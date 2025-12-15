
// ... existing imports ...
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StaffRoster, ShiftCode, Rank, DailyDutyDetails, Staff } from '../types';
import { Edit, Save, X, Sparkles, Loader2, RefreshCw, UserPlus, List, CheckCircle, Lock, Unlock, FileSignature, Shuffle, AlignJustify, Share2 } from 'lucide-react';
import { STAFF_LIST } from '../constants';
import { GoogleGenAI } from "@google/genai";
import { ApprovalModal } from './ApprovalModal';
import { UnlockModal } from './UnlockModal';

// ... interfaces ...
interface DailyRosterProps {
  date: Date;
  rosterData: StaffRoster[];
  details: DailyDutyDetails | null;
  onDetailsUpdate: (details: DailyDutyDetails) => void;
  staffList: Staff[];
}

const DEFAULT_DETAILS: DailyDutyDetails = {
  dayVehicles: { mpv1: '', mpv2: '', mpv3: '', adminMpv: '', adminWt: '', wt1: '', wt2: '', wt3: '' },
  nightVehicles: { mpv1: '', mpv2: '', mpv3: '', wt1: '', wt2: '', wt3: '' },
  notes: [
    "1. ANGGOTA TUGASAN GALLERY DIKEHENDAKI MEMBUAT RONDAAN DI SHOWUNIT SATU (1) KALI.",
    "2. TEAM 1 / TEAM 2 DIKEHENDAKI BERADA DI CLUBHOUSE SETIAP KALI SELEPAS TAMAT RONDAAN.",
    "3. TEAM MALAM DIKEHENDAKI MEMBUAT RONDAAN DI GALERI (LUAR & DALAM) DAN SHOWUNIT SATU (1) KALI.",
    "4. SILA GUNAKAN URB MENGIKUT JADUAL YANG DITETAPKAN KECUALI HARI HUJAN LEBAT ATAU RONDAAN KE BL & MD."
  ]
};

// ... component logic ...
export const DailyRoster: React.FC<DailyRosterProps> = ({ date, rosterData, details, onDetailsUpdate, staffList }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<DailyDutyDetails>(details || DEFAULT_DETAILS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isPreparationModalOpen, setIsPreparationModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [customInputModes, setCustomInputModes] = useState<Record<string, boolean>>({});
  const [isRotationEnabled, setIsRotationEnabled] = useState(true);
  
  const rosterRef = useRef<HTMLDivElement>(null);

  const isStaffInList = (nameString: string) => {
    if (!nameString || nameString === '-' || nameString === '') return true; 
    return staffList.some(s => `${s.rank}/${s.bodyNumber} ${s.name}` === nameString);
  };

  useEffect(() => {
    const currentData = details || DEFAULT_DETAILS;
    setEditForm(currentData);

    const newModes: Record<string, boolean> = {};
    if (currentData.dayTeam) {
        currentData.dayTeam.forEach((name, idx) => {
            if (!isStaffInList(name)) newModes[`day_${idx}`] = true;
        });
    }
    if (currentData.nightTeam) {
        currentData.nightTeam.forEach((name, idx) => {
            if (!isStaffInList(name)) newModes[`night_${idx}`] = true;
        });
    }
    if (currentData.officeAdmin && !isStaffInList(currentData.officeAdmin)) {
        newModes['admin'] = true;
    }
    setCustomInputModes(newModes);
  }, [details, date, staffList]);

  // ... helper methods (formatDate, getSerialNumber) ...
  const targetDay = date.getDate();
  const targetMonth = date.getMonth();
  const targetYear = date.getFullYear();

  const formatDate = (d: Date) => {
    const days = ['AHAD', 'ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU'];
    const months = ['JANUARI', 'FEBRUARI', 'MAC', 'APRIL', 'MEI', 'JUN', 'JULAI', 'OGOS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DISEMBER'];
    return `${days[d.getDay()]} ${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const getSerialNumber = (d: Date) => {
    const year = d.getFullYear();
    const start = new Date(Date.UTC(year, 0, 0));
    const current = new Date(Date.UTC(year, d.getMonth(), d.getDate()));
    const diff = current.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const dayStr = dayOfYear.toString().padStart(3, '0');
    const yearSuffix = year.toString().slice(-2);
    return `POL 69A/${dayStr}/${yearSuffix}`;
  };

  // ... Memoized Staff Filtering ...
  const { dayShiftStaff, nightShiftStaff, offDayStaff, leaveStaff } = useMemo(() => {
    const dayS: any[] = [];
    const nightS: any[] = [];
    const offS: any[] = [];
    const leaveS: any[] = [];
    rosterData.forEach(r => {
      const dayData = r.days.find(d => d.date === targetDay && d.month === targetMonth && d.year === targetYear);
      if (!dayData) return;
      let effectiveCode = dayData.code;
      if (dayData.code === ShiftCode.CFPH && dayData.originalCode) { effectiveCode = dayData.originalCode; }
      const entry = { staff: r.staff, code: dayData.code, effectiveCode };
      if (effectiveCode === ShiftCode.S || (dayData.code === ShiftCode.CFPH && effectiveCode !== ShiftCode.O)) {
        if (effectiveCode === ShiftCode.M) nightS.push(entry); else dayS.push(entry);
      } else if (effectiveCode === ShiftCode.M) nightS.push(entry);
      else if (effectiveCode === ShiftCode.O) offS.push(entry);
      else leaveS.push(entry);
    });
    return { dayShiftStaff: dayS, nightShiftStaff: nightS, offDayStaff: offS, leaveStaff: leaveS };
  }, [rosterData, targetDay, targetMonth, targetYear]);

  // ... Role Assignment Logic ...
  const assignRoles = (staffListArg: any[], overrideSupervisorName?: string, useRotation: boolean = true) => {
    let sorted = [...staffListArg].sort((a, b) => {
      const rankScore = (r: Rank) => r === Rank.SJN ? 3 : r === Rank.KPL ? 2 : 1;
      return rankScore(b.staff.rank) - rankScore(a.staff.rank);
    });
    if (sorted.length === 0) return { supervisor: null, members: [], admin: null };
    const highestRank = sorted[0].staff.rank;
    const candidates = sorted.filter(s => s.staff.rank === highestRank);
    let supervisor = sorted[0];
    if (useRotation && candidates.length > 1) {
       const rotationIndex = targetDay % candidates.length;
       supervisor = candidates[rotationIndex];
       const chosenIndex = sorted.indexOf(supervisor);
       if (chosenIndex > 0) { sorted.splice(chosenIndex, 1); sorted.unshift(supervisor); }
    }
    if (overrideSupervisorName) {
      const foundIndex = sorted.findIndex(s => s.staff.name === overrideSupervisorName);
      if (foundIndex !== -1) { supervisor = sorted[foundIndex]; sorted.splice(foundIndex, 1); sorted.unshift(supervisor); }
    }
    const members = sorted.slice(1);
    const adminIndex = members.findIndex((m: any) => m.staff.name.includes('NOORAZREENA'));
    let admin = null;
    if (adminIndex !== -1) { admin = members[adminIndex]; members.splice(adminIndex, 1); }
    if (members.length > 1) {
        const highestMemberRank = members[0].staff.rank;
        const leadCandidates = members.filter((m: any) => m.staff.rank === highestMemberRank);
        if (useRotation && leadCandidates.length > 1) {
            const leadRotationIndex = targetDay % leadCandidates.length;
            const shiftLead = leadCandidates[leadRotationIndex];
            const leadIndex = members.indexOf(shiftLead);
            if (leadIndex > 0) { members.splice(leadIndex, 1); members.unshift(shiftLead); }
        }
    }
    return { supervisor, members, admin };
  };

  const dayTeam = assignRoles(dayShiftStaff, (isEditing ? editForm.daySupervisor : details?.daySupervisor), isRotationEnabled);
  const nightTeam = assignRoles(nightShiftStaff, (isEditing ? editForm.nightSupervisor : details?.nightSupervisor), isRotationEnabled);

  // ... Auto-Populate Helpers ...
  const getStaffWT = (staffString: string): string => {
    if (!staffString || staffString === '-') return '';
    const staff = staffList.find(s => staffString.toUpperCase().includes(s.name.toUpperCase()));
    return staff?.walkieTalkie || '';
  };
  const getStaffVehicle = (staffString: string): string => {
    if (!staffString || staffString === '-') return '';
    const staff = staffList.find(s => staffString.toUpperCase().includes(s.name.toUpperCase()));
    return staff?.vehicle || '';
  };
  const parseStaffString = (str: string) => {
    if (!str || str === '-') return { rank: '', no: '', name: '-' };
    const parts = str.split(' ');
    if (parts.length < 2) return { rank: '', no: '', name: str };
    let rank = parts[0]; let no = parts[1]; let nameStartIndex = 2;
    if (rank.includes('/')) { const splitRank = rank.split('/'); if (!isNaN(Number(splitRank[1]))) { rank = splitRank[0]; no = splitRank[1]; nameStartIndex = 1; } }
    const name = parts.slice(nameStartIndex).join(' ');
    return { rank, no, name };
  };

  // ... Handlers (Edit, Save, AI, Share, Approve, Unlock) ...
  const handleEditClick = () => { setEditForm(prev => ({ ...prev, ...details })); setIsEditing(true); };
  const handleResetStaff = () => { if (window.confirm("Reset all staff fields to Master Roster?")) { setEditForm(prev => ({ ...prev, dayTeam: undefined, nightTeam: undefined, officeAdmin: undefined, daySupervisor: undefined, nightSupervisor: undefined, offDayStaffNames: undefined, leaveStaffNames: undefined })); setCustomInputModes({}); } };
  const handleSave = () => { onDetailsUpdate(editForm); setIsEditing(false); };
  const handleCancel = () => { setEditForm(details || DEFAULT_DETAILS); setCustomInputModes({}); setIsEditing(false); };
  
  const handleGenerateAiNotes = async () => {
    if (!process.env.API_KEY) { alert("API Key is missing."); return; }
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const dateStr = formatDate(date);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const prompt = `Role: Sergeant. Generate 4 concise Malay daily briefing notes for ${dateStr} (${isWeekend ? 'Weekend' : 'Weekday'}). 1. Patrol, 2. Clubhouse, 3. Safety, 4. Equipment.`;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      if (response.text) { const lines = response.text.split('\n').map(l => l.trim()).filter(l => l.length > 0 && /^\d/.test(l)).slice(0, 4); if (lines.length > 0) setEditForm(prev => ({ ...prev, notes: lines })); }
    } catch (e) { console.error(e); alert("AI Error"); } finally { setIsGenerating(false); }
  };

  const handlePreparation = (name: string, rank: string) => onDetailsUpdate({ ...details || DEFAULT_DETAILS, preparation: { approverName: name, approverRank: rank, date: new Date().toLocaleDateString(), isApproved: true } });
  const handleApprove = (name: string, rank: string) => onDetailsUpdate({ ...details || DEFAULT_DETAILS, approval: { approverName: name, approverRank: rank, date: new Date().toLocaleDateString(), isApproved: true } });
  const handleUnlock = () => onDetailsUpdate({ ...details || DEFAULT_DETAILS, approval: { ...details?.approval, isApproved: false } as any, preparation: { ...details?.preparation, isApproved: false } as any });
  
  const handleShare = async () => {
    if (rosterRef.current) {
        try {
            // @ts-ignore
            const canvas = await window.html2canvas(rosterRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            const fileName = `Daily_Roster_${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}.png`;
            link.href = image; link.download = fileName; link.click();
            window.open('https://web.whatsapp.com/', '_blank');
            alert(`Image saved as "${fileName}". Attach to WhatsApp.`);
        } catch (error) { console.error(error); alert("Screenshot failed."); }
    }
  };

  const currentDetails = isEditing ? editForm : (details || DEFAULT_DETAILS);
  const isPrepared = !!details?.preparation?.isApproved;
  const isApproved = !!details?.approval?.isApproved;
  const isLocked = (isPrepared || isApproved) && !isEditing;

  // ... Render Functions ...
  const renderInput = (section: 'dayVehicles' | 'nightVehicles', field: string, autoValue?: string) => {
    let val = isEditing ? (editForm[section] as any)[field] : (currentDetails[section] as any)[field];
    if (!val && autoValue) val = autoValue;
    if (!isEditing) return val || '-';
    return <input type="text" className="w-full text-center border border-blue-400 bg-blue-50 text-[10px] py-0.5" value={val || ''} onChange={(e) => setEditForm(prev => ({ ...prev, [section]: { ...prev[section], [field]: e.target.value } }))} />;
  };

  const renderSupervisorSelect = (teamMembers: { members: any[] }, currentSup: any, section: 'daySupervisor' | 'nightSupervisor') => {
    if (!isEditing) return currentSup ? `${currentSup.staff.rank} ${currentSup.staff.bodyNumber} ${currentSup.staff.name}` : 'TIADA';
    const value = editForm[section] !== undefined ? editForm[section] : (currentSup ? currentSup.staff.name : '');
    const allOptions = currentSup ? [currentSup, ...teamMembers.members] : teamMembers.members;
    return (
      <div className="flex items-center gap-1 w-full">
        <select className="w-full bg-blue-50 border border-blue-400 text-[10px] p-0.5" value={value} onChange={(e) => setEditForm(prev => ({ ...prev, [section]: e.target.value }))}>
          <option value="">TIADA</option>
          {allOptions.map((m: any) => <option key={m.staff.id} value={m.staff.name}>{m.staff.rank} {m.staff.name}</option>)}
        </select>
        {editForm[section] !== undefined && <button onClick={() => setEditForm(prev => ({ ...prev, [section]: undefined }))} className="text-blue-600 hover:text-blue-800"><RefreshCw className="w-3 h-3" /></button>}
      </div>
    );
  };

  const renderStaffRow = (isDay: boolean, slotIndex: number) => {
    const override = isDay ? currentDetails.dayTeam : currentDetails.nightTeam;
    const computedMembers = isDay ? dayTeam.members : nightTeam.members;
    const displayList = (override && override.length > 0) ? override : computedMembers.map((m: any) => `${m.staff.rank}/${m.staff.bodyNumber} ${m.staff.name}`);
    const staffString = displayList[slotIndex] || '-';
    const autoWT = getStaffWT(staffString);
    const autoMPV = getStaffVehicle(staffString); 
    const finalAutoMPV = (autoMPV && autoMPV !== '-') ? autoMPV : '';
    const vehicleSection = isDay ? 'dayVehicles' : 'nightVehicles';
    const mpvField = slotIndex === 0 ? 'mpv1' : slotIndex === 1 ? 'mpv2' : 'mpv3';
    const wtField = slotIndex === 0 ? 'wt1' : slotIndex === 1 ? 'wt2' : 'wt3';

    if (isEditing) {
        const teamKey = isDay ? 'dayTeam' : 'nightTeam';
        const hasOverride = editForm[teamKey] !== undefined;
        const inputModeKey = `${isDay ? 'day' : 'night'}_${slotIndex}`;
        const isCustom = customInputModes[inputModeKey];
        return (
            <>
                <td className="border-r border-black p-0 py-1 text-[12px]">
                   <div className="flex items-center px-1 gap-1">
                     {isCustom ? (
                        <input type="text" className="w-full text-[10px] border border-blue-400 bg-white px-1" placeholder="Type rank/no name..." value={displayList[slotIndex] || ""} onChange={(e) => { const newVal = e.target.value; const currentList = displayList ? [...displayList] : []; for(let k=0; k<3; k++) { if(!currentList[k]) currentList[k] = ''; } currentList[slotIndex] = newVal; setEditForm(prev => ({ ...prev, [teamKey]: currentList })); }} />
                     ) : (
                        <select className="w-full text-[10px] border border-blue-400 bg-white" value={displayList[slotIndex] || ""} onChange={(e) => { const newVal = e.target.value; const currentList = displayList ? [...displayList] : []; for(let k=0; k<3; k++) { if(!currentList[k]) currentList[k] = ''; } currentList[slotIndex] = newVal; 
                            const nMPV = (getStaffVehicle(newVal) && getStaffVehicle(newVal) !== '-') ? getStaffVehicle(newVal) : ''; 
                            const nWT = getStaffWT(newVal);
                            setEditForm(prev => ({ ...prev, [teamKey]: currentList, [vehicleSection]: { ...prev[vehicleSection], [mpvField]: nMPV, [wtField]: nWT } })); }}>
                            <option value="">Select Staff</option>
                            {staffList.map(s => <option key={s.id} value={`${s.rank}/${s.bodyNumber} ${s.name}`}>{s.name}</option>)}
                        </select>
                     )}
                     <button onClick={() => setCustomInputModes(prev => ({ ...prev, [inputModeKey]: !prev[inputModeKey] }))} className="text-gray-600 hover:text-blue-600 bg-gray-100 p-0.5 rounded border border-gray-300">{isCustom ? <List className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}</button>
                     {slotIndex === 0 && hasOverride && <button onClick={() => setEditForm(prev => ({ ...prev, [teamKey]: undefined }))} className="text-blue-600 hover:text-blue-800 bg-blue-50 p-0.5 rounded border border-blue-200"><RefreshCw className="w-3 h-3" /></button>}
                   </div>
                </td>
                <td className="border-r border-black p-0.5 text-[12px]">{renderInput(vehicleSection, mpvField, finalAutoMPV)}</td>
                <td className="p-0.5 text-[12px]">{renderInput(vehicleSection, wtField, autoWT)}</td>
            </>
        );
    }
    const { rank, no, name } = parseStaffString(staffString);
    return (
        <>
            <td className="border-r border-black p-0 text-[11px]"><div className="flex w-full h-full items-center"><div className="w-12 border-r border-gray-300 px-1 text-[11px] font-medium shrink-0 text-center h-full flex items-center justify-center">{rank}</div><div className="w-12 border-r border-gray-300 px-1 text-[11px] shrink-0 text-center h-full flex items-center justify-center">{no}</div><div className="flex-1 px-1 text-[11px] leading-tight whitespace-normal text-left h-full flex items-center">{name}</div></div></td>
            <td className="border-r border-black p-0.5 align-middle text-[12px]">{renderInput(vehicleSection, mpvField, finalAutoMPV)}</td>
            <td className="p-0.5 align-middle text-[12px]">{renderInput(vehicleSection, wtField, autoWT)}</td>
        </>
    );
  };

  const renderOfficeAdmin = () => {
    const computedAdmin = dayTeam.admin ? `${dayTeam.admin.staff.rank}/${dayTeam.admin.staff.bodyNumber} ${dayTeam.admin.staff.name}` : '-';
    const autoAdminMPV = getStaffVehicle(computedAdmin);
    const finalAdminMPV = (autoAdminMPV && autoAdminMPV !== '-') ? autoAdminMPV : '';
    const autoAdminWT = getStaffWT(computedAdmin);

    if (isEditing) {
      const currentVal = editForm.officeAdmin !== undefined ? editForm.officeAdmin : computedAdmin;
      const isCustom = customInputModes['admin'];
      return (
        <>
            <td className="border-r border-black text-left p-0 py-1">
                <div className="flex gap-1 items-center w-full p-1">
                    {isCustom ? ( <input type="text" className="w-full text-[10px] border border-blue-400 bg-white px-1" value={currentVal === '-' ? '' : currentVal} onChange={(e) => setEditForm(prev => ({ ...prev, officeAdmin: e.target.value }))} /> ) : ( <select className="w-full text-[10px] border border-blue-400 bg-white" value={currentVal === '-' ? '' : currentVal} onChange={(e) => { const newVal = e.target.value; const nMPV = (getStaffVehicle(newVal) && getStaffVehicle(newVal) !== '-') ? getStaffVehicle(newVal) : ''; const nWT = getStaffWT(newVal); setEditForm(prev => ({ ...prev, officeAdmin: newVal, dayVehicles: { ...prev.dayVehicles, adminMpv: nMPV, adminWt: nWT } })); }}> <option value="">Select Staff</option> {staffList.map(s => <option key={s.id} value={`${s.rank}/${s.bodyNumber} ${s.name}`}>{s.name}</option>)} </select> )}
                    <button onClick={() => setCustomInputModes(prev => ({ ...prev, 'admin': !prev['admin'] }))} className="text-gray-600 hover:text-blue-600 bg-gray-100 p-0.5 rounded border border-gray-300">{isCustom ? <List className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}</button>
                    {editForm.officeAdmin !== undefined && <button onClick={() => setEditForm(prev => ({ ...prev, officeAdmin: undefined }))} className="text-blue-600 hover:text-blue-800 bg-blue-50 p-0.5 rounded border border-blue-200"><RefreshCw className="w-3 h-3" /></button>}
                </div>
            </td>
            <td className="border-r border-black p-0.5 align-middle text-[12px]">{renderInput('dayVehicles', 'adminMpv', finalAdminMPV)}</td>
            <td className="p-0.5 align-middle text-[12px]">{renderInput('dayVehicles', 'adminWt', autoAdminWT)}</td>
        </>
      );
    }
    const line = currentDetails.officeAdmin || computedAdmin;
    const { rank, no, name } = parseStaffString(line);
    return (
        <>
            <td className="border-r border-black text-left p-0"><div className="flex text-left items-center w-full h-full min-h-[24px]"><div className="w-12 border-r border-gray-300 px-1 text-[11px] font-medium shrink-0 h-full flex items-center justify-center">{rank}</div><div className="w-12 border-r border-gray-300 px-1 text-[11px] shrink-0 h-full flex items-center justify-center">{no}</div><div className="flex-1 px-1 text-[11px] leading-tight whitespace-normal h-full flex items-center">{name}</div></div></td>
            <td className="border-r border-black p-0.5 align-middle text-[12px]">{renderInput('dayVehicles', 'adminMpv', finalAdminMPV)}</td>
            <td className="p-0.5 align-middle text-[12px]">{renderInput('dayVehicles', 'adminWt', autoAdminWT)}</td>
        </>
    );
  };

  const renderOffDaySection = () => {
    const computed = offDayStaff.map(o => `${o.staff.rank} ${o.staff.name}`);
    if (isEditing) {
       const currentVal = editForm.offDayStaffNames !== undefined ? editForm.offDayStaffNames : computed;
       return (
          <div className="flex flex-col w-full">
             <div className="flex gap-1 items-center mb-1">
               <select className="w-full text-[10px] border border-blue-400 bg-white" onChange={(e) => { if(e.target.value) { setEditForm(prev => ({ ...prev, offDayStaffNames: [...currentVal, e.target.value] })); e.target.value=""; } }}> <option value="">+ Add Staff</option> {staffList.map(s => <option key={s.id} value={`${s.rank} ${s.name}`}>{s.name}</option>)} </select>
               {editForm.offDayStaffNames !== undefined && <button onClick={() => setEditForm(prev => ({ ...prev, offDayStaffNames: undefined }))} className="text-blue-600"><RefreshCw className="w-3 h-3" /></button>}
             </div>
             <textarea className="w-full h-8 text-[12px] border border-blue-400 bg-blue-50 p-1 resize-none leading-tight" value={currentVal.join(', ')} onChange={(e) => setEditForm(prev => ({ ...prev, offDayStaffNames: e.target.value.split(',').map(s=>s.trim()) }))} />
          </div>
       )
    }
    const displayList = (currentDetails.offDayStaffNames !== undefined) ? currentDetails.offDayStaffNames : computed;
    return displayList.length > 0 ? displayList.filter(s => s).join(', ') : 'TIADA';
  }

  const renderLeaveSection = () => {
    const computed = leaveStaff.map(l => `${l.staff.rank} ${l.staff.name} (${l.code})`);
    if (isEditing) {
       const currentVal = editForm.leaveStaffNames !== undefined ? editForm.leaveStaffNames : computed;
       return (
          <div className="flex flex-col w-full">
             <div className="flex gap-1 items-center mb-1">
               <select className="w-full text-[10px] border border-blue-400 bg-white" onChange={(e) => { if(e.target.value) { setEditForm(prev => ({ ...prev, leaveStaffNames: [...currentVal, e.target.value] })); e.target.value=""; } }}> <option value="">+ Add Staff</option> {staffList.map(s => <option key={s.id} value={`${s.rank} ${s.name}`}>{s.name}</option>)} </select>
               {editForm.leaveStaffNames !== undefined && <button onClick={() => setEditForm(prev => ({ ...prev, leaveStaffNames: undefined }))} className="text-blue-600"><RefreshCw className="w-3 h-3" /></button>}
             </div>
             <textarea className="w-full h-8 text-[12px] border border-blue-400 bg-blue-50 p-1 resize-none leading-tight" value={currentVal.join(', ')} onChange={(e) => setEditForm(prev => ({ ...prev, leaveStaffNames: e.target.value.split(',').map(s=>s.trim()) }))} />
          </div>
       )
    }
    const displayList = (currentDetails.leaveStaffNames !== undefined) ? currentDetails.leaveStaffNames : computed;
    return displayList.length > 0 ? displayList.filter(s => s).join(', ') : 'TIADA';
  }

  const countRank = (r: Rank) => rosterData.filter(rd => rd.staff.rank === r).length;
  const totalStaff = rosterData.length;

  return (
    <div className="flex flex-col items-center">
      {/* CONTROLS */}
      <div className="no-print w-full max-w-[210mm] flex justify-end mb-2 gap-2">
        {!isLocked ? (
            !isEditing ? (
            <>
                <button onClick={handleEditClick} className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 shadow text-xs"><Edit className="w-3 h-3" /> Edit Details</button>
                <button onClick={handleShare} className="flex items-center gap-2 px-3 py-1 bg-[#25D366] text-white rounded hover:bg-[#128C7E] shadow text-xs font-bold"><Share2 className="w-3 h-3" /> Share to WhatsApp</button>
                {!isPrepared && (
                    <button onClick={() => setIsPreparationModalOpen(true)} className="flex items-center gap-2 px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-700 shadow text-xs"><FileSignature className="w-3 h-3" /> Sign (Prepared)</button>
                )}
                <button onClick={() => setIsApprovalModalOpen(true)} className="flex items-center gap-2 px-3 py-1 bg-green-700 text-white rounded hover:bg-green-800 shadow text-xs animate-pulse"><CheckCircle className="w-3 h-3" /> Approve & Lock</button>
            </>
            ) : (
            <>
                <button onClick={handleResetStaff} className="flex items-center gap-2 px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 shadow text-xs mr-auto"><RefreshCw className="w-3 h-3" /> Sync Master</button>
                <button onClick={handleCancel} className="flex items-center gap-2 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 shadow text-xs"><X className="w-3 h-3" /> Cancel</button>
                <button onClick={handleSave} className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 shadow text-xs"><Save className="w-3 h-3" /> Save</button>
            </>
            )
        ) : (
            <>
                <button onClick={handleShare} className="flex items-center gap-2 px-3 py-1 bg-[#25D366] text-white rounded hover:bg-[#128C7E] shadow text-xs font-bold"><Share2 className="w-3 h-3" /> Share to WhatsApp</button>
                {isPrepared && !isApproved && (
                    <button onClick={() => setIsApprovalModalOpen(true)} className="flex items-center gap-2 px-3 py-1 bg-green-700 text-white rounded hover:bg-green-800 shadow text-xs animate-pulse"><CheckCircle className="w-3 h-3" /> Approve (SJN)</button>
                )}
                <button onClick={() => setIsUnlockModalOpen(true)} className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 shadow text-xs"><Unlock className="w-3 h-3" /> Unlock / Reset</button>
            </>
        )}
      </div>

      <div ref={rosterRef} className={`bg-white text-black font-sans w-[210mm] border-2 border-black p-4 text-[12px] leading-tight shadow-2xl mb-12 relative ${isEditing ? 'ring-4 ring-blue-100' : ''}`}>
        
        {/* WATERMARK */}
        {!isApproved ? (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <h1 className="text-9xl text-gray-200 font-bold transform -rotate-45 opacity-50">DRAFT</h1>
            </div>
        ) : null}

        {/* HEADER */}
        <div className="flex border-b-2 border-black pb-2 mb-1 relative z-10">
          <div className="w-32 flex items-center justify-center">
              <img src="https://file-service.aistudio.google.com/file/332f3ce9-756d-49d7-832d-327c5ce82d5f" alt="Logo" className="w-24 h-auto object-contain" />
          </div>
          <div className="flex-1 pl-2 flex flex-col justify-center">
              <h1 className="font-bold text-sm">JADUAL TUGAS HARIAN</h1>
              <h2 className="font-bold">POLIS BANTUAN</h2>
              <h2 className="font-bold">ECOWORLD DEVELOPMENT GROUP BERHAD</h2>
              <h2 className="font-bold">WILAYAH UTARA (ECONORTH)</h2>
          </div>
          <div className="w-32 flex items-end justify-end pr-2">
              <span className="font-bold">{getSerialNumber(date)}</span>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 border-b-2 border-black relative z-10 bg-white">
          <div className="border-r-2 border-black p-1">
              <h3 className="font-bold underline mb-1">PENGURUSAN / PENTADBIRAN</h3>
              <div className="space-y-0.5 text-[12px]">
                  <p>1. SJN/PB 74722 MOHD KHAIRUL AZWANDY BIN ISHAK</p>
                  <p className="pl-4">KETUA PENYELIA OPERASI DAN PENTADBIRAN</p>
                  <p>2. KPL/PB 94340 KALAIARASU</p>
                  <p className="pl-4">PENYELIA OPERASI</p>
                  <p>3. KONST/PB 7835 NOORAZREENA BT ROSLI</p>
                  <p className="pl-4">PENTADBIRAN</p>
              </div>
          </div>
          <div className="p-1">
              <h3 className="font-bold underline mb-1">KEKUATAN ANGGOTA</h3>
              <div className="grid grid-cols-2 w-3/4 text-[12px]">
                  <span>SJN/PB</span> <span>: {countRank(Rank.SJN)} ANGGOTA</span>
                  <span>KPL/PB</span> <span>: {countRank(Rank.KPL)} ANGGOTA</span>
                  <span>KONST/PB</span> <span>: {countRank(Rank.KONST)} ANGGOTA</span>
                  <span className="font-bold border-t border-black mt-1">TOTAL</span> <span className="font-bold border-t border-black mt-1">: {totalStaff} ANGGOTA</span>
              </div>
          </div>
        </div>

        {/* SHIFT HEADERS */}
        <div className="grid grid-cols-2 border-b-2 border-black text-center font-bold bg-gray-100 text-[12px] relative z-10">
          <div className="border-r-2 border-black py-0.5 flex items-center justify-center gap-2 relative">
              <div className="flex flex-col">
                <p>TARIKH / HARI / MASA</p>
                <p className="text-red-600">0800HRS - 2000HRS (S)</p>
              </div>
              <button onClick={() => setIsRotationEnabled(!isRotationEnabled)} className={`absolute right-1 top-1 p-1 rounded hover:bg-gray-200 no-print ${isRotationEnabled ? 'text-blue-600' : 'text-gray-400'}`} title={isRotationEnabled ? "Auto-Rotation Enabled (Fairness)" : "Manual Assignment (Static)"}>{isRotationEnabled ? <Shuffle className="w-3 h-3" /> : <AlignJustify className="w-3 h-3" />}</button>
          </div>
          <div className="py-0.5"><p>TARIKH / HARI / MASA</p><p className="text-red-600">2000HRS - 0800HRS (M)</p></div>
        </div>
        
        <div className="grid grid-cols-2 border-b-2 border-black text-center font-bold text-red-600 text-[12px] relative z-10 bg-white">
          <div className="border-r-2 border-black py-0.5 uppercase">{formatDate(date)}</div>
          <div className="py-0.5 uppercase">{formatDate(date)}</div>
        </div>
        
        <div className="grid grid-cols-2 border-b-2 border-black text-center font-bold text-[12px] relative z-10 bg-white">
          <div className="border-r-2 border-black py-0.5 bg-gray-50 uppercase px-2 flex items-center justify-center">
              <span className="mr-2 whitespace-nowrap">PENYELIA PAGI :</span> 
              <div className="flex-1">{renderSupervisorSelect(dayTeam, dayTeam.supervisor, 'daySupervisor')}</div>
          </div>
          <div className="py-0.5 bg-gray-50 uppercase px-2 flex items-center justify-center">
              <span className="mr-2 whitespace-nowrap">PENYELIA MALAM :</span>
              <div className="flex-1">{renderSupervisorSelect(nightTeam, nightTeam.supervisor, 'nightSupervisor')}</div>
          </div>
        </div>

        {/* MAIN TABLE */}
        <div className="grid grid-cols-2 border-b-2 border-black text-[12px] relative z-10 bg-white">
          <div className="border-r-2 border-black">
              <table className="w-full text-center border-collapse">
                  <thead>
                      <tr className="border-b border-black text-[10px] leading-tight bg-gray-50">
                          <th className="border-r border-black w-6">BIL</th>
                          <th className="border-r border-black">LOKASI</th>
                          <th className="border-r border-black p-0"><div className="flex w-full h-full"><div className="w-12 border-r border-black flex items-center justify-center">PKT</div><div className="w-12 border-r border-black flex items-center justify-center">NO</div><div className="flex-1 flex items-center justify-center">NAMA</div></div></th>
                          <th className="border-r border-black w-20">MPV/ URB<br/>NO</th>
                          <th className="w-10">W/T NO</th>
                      </tr>
                  </thead>
                  <tbody className="text-[12px]">
                      <tr className="border-b border-gray-300 h-6"><td className="border-r border-black font-bold text-[10px]" rowSpan={3}>1</td><td className="border-r border-black font-bold text-[10px]" rowSpan={3}>ECO HORIZON<br/>(TEAM 1)</td>{renderStaffRow(true, 0)}</tr>
                      <tr className="border-b border-gray-300 h-6">{renderStaffRow(true, 1)}</tr>
                      <tr className="border-b border-black h-6">{renderStaffRow(true, 2)}</tr>
                      <tr className="h-8"><td className="border-r border-black font-bold text-[10px]">2</td><td className="border-r border-black font-bold text-[10px]">OFFICE ADMIN</td>{renderOfficeAdmin()}</tr>
                  </tbody>
              </table>
          </div>
          <div>
              <table className="w-full text-center border-collapse">
                  <thead>
                      <tr className="border-b border-black text-[10px] leading-tight bg-gray-50">
                          <th className="border-r border-black w-6">BIL</th>
                          <th className="border-r border-black">LOKASI</th>
                          <th className="border-r border-black p-0"><div className="flex w-full h-full"><div className="w-12 border-r border-black flex items-center justify-center">PKT</div><div className="w-12 border-r border-black flex items-center justify-center">NO</div><div className="flex-1 flex items-center justify-center">NAMA</div></div></th>
                          <th className="border-r border-black w-20">MPV/ URB<br/>NO</th>
                          <th className="w-10">W/T NO</th>
                      </tr>
                  </thead>
                  <tbody className="text-[12px]">
                      <tr className="border-b border-gray-300 h-6"><td className="border-r border-black font-bold text-[10px]" rowSpan={3}>1</td><td className="border-r border-black font-bold text-[10px]" rowSpan={3}>ECO HORIZON<br/>(TEAM 2)</td>{renderStaffRow(false, 0)}</tr>
                      <tr className="border-b border-gray-300 h-6">{renderStaffRow(false, 1)}</tr>
                      <tr className="border-b border-black h-6">{renderStaffRow(false, 2)}</tr>
                  </tbody>
              </table>
          </div>
        </div>

        {/* FOOTER SECTIONS */}
        <div className="border-b border-black flex text-[12px] relative z-10 bg-white"><div className="w-1/3 border-r border-black p-1 font-bold bg-gray-100">ANGGOTA (REST DAY)</div><div className="flex-1 p-1 uppercase">{renderOffDaySection()}</div></div>
        <div className="border-b border-black flex text-[12px] relative z-10 bg-white"><div className="w-1/3 border-r border-black p-1 font-bold bg-gray-100">CUTI (AL, EL, MC, DAN LAIN-LAIN)</div><div className="flex-1 p-1 uppercase text-red-600">{renderLeaveSection()}</div></div>
        <div className="border-b border-black p-1 italic text-[12px] relative z-10 bg-white">MC, EL, DLL - Diisi oleh penyelia selepas jadual tugas ditandatangan</div>

        {/* NOTES */}
        <div className="grid grid-cols-2 border-b-2 border-black h-44 relative z-10 bg-white">
          <div className="border-r-2 border-black p-2 flex flex-col items-center justify-center text-center font-bold text-red-600 text-[10px]">
              <span>TUGASAN KHAS & ARAHAN SEMASA</span>
              {isEditing && <button onClick={handleGenerateAiNotes} disabled={isGenerating} className="mt-2 flex items-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded text-[10px] hover:shadow-lg disabled:opacity-50">{isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Auto-Generate (AI)</button>}
          </div>
          <div className="p-1 text-[10px] space-y-0.5 overflow-hidden relative">
            {currentDetails.notes.map((note, index) => (isEditing ? <div key={index} className="flex gap-1 mb-1"><span className="font-bold">{index + 1}.</span><textarea className="w-full h-10 text-[10px] border border-blue-300 p-1 resize-none leading-tight" value={note.replace(/^\d+\.\s*/, '')} onChange={(e) => { const n = [...editForm.notes]; n[index] = `${index + 1}. ${e.target.value}`; setEditForm(prev => ({ ...prev, notes: n })); }} /></div> : <p key={index}>{note}</p>))}
          </div>
        </div>

        {/* INSTRUCTIONS */}
        <div className="border-b-2 border-black p-2 text-[12px] space-y-0.5 relative z-10 bg-white">
          <h3 className="font-bold underline text-[12px] mb-1">ARAHAN PENUGASAN</h3>
          <div className="columns-2 gap-4 space-y-1">
             <p className="break-inside-avoid">1. SEMUA ANGGOTA PERLU LAPOR DIRI 30 MINIT AWAL SEBELUM WAKTU TUGAS UNTUK TUJUAN PERSIAPAN DIRI,KELENGKAPAN ALATAN TUGAS, KENDERAAN SERTA HADIR TAKLIMAT TUGAS.</p>
             <p className="break-inside-avoid">2. SENTIASA BERPAKAIAN KEMAS DAN BERSIH.</p>
             <p className="break-inside-avoid">3. ANGGOTA YANG TIDAK HADIR TAKLIMAT TUGAS SERTA LEWAT HADIR BERTUGAS AKAN DIKENAKAN TINDAKAN TATATERTIB.</p>
             <p className="break-inside-avoid">4. SEMUA ANGGOTA YANG BERTUGAS WAJIB MENGAMBIL T-BATON, GARI SERTA WALKIE TALKIE SERTA LAIN-LAIN PERALATAN YANG DIPERLUKAN SERTA PERLU MEREKODKAN PENGAMBILAN DAN PEMULANGAN ALATAN DI DALAM BUKU YANG DISEDIAKAN.</p>
             <p className="break-inside-avoid">5. SEMUA ANGGOTA WAJIB MEMASTIKAN KENDERAAN DALAM KEADAAN BERSIH SEMASA BERTUGAS DAN TAMAT TUGAS.</p>
          </div>
        </div>

        {/* FOOTER SIGNATURES */}
        <div className="grid grid-cols-2 pt-2 pb-2 relative z-10 bg-white">
          <div className="text-center relative">
              <p className="text-[12px] mb-1">DISEDIAKAN / DISEMAK OLEH :</p>
              <div className="h-24 flex items-center justify-center mb-1 border-b border-black w-3/4 mx-auto relative">
                 {/* DIGITAL STAMP 1 */}
                 {details?.preparation?.isApproved && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                        <div className="border-2 border-blue-600 px-2 py-1 text-center bg-blue-50/90 transform -rotate-2 shadow-sm min-w-[140px]">
                            <div className="text-blue-900 font-bold text-[7px] uppercase leading-tight">POLIS BANTUAN WILAYAH UTARA</div>
                            <div className="text-blue-900 font-bold text-[7px] uppercase leading-tight border-b border-blue-600 pb-0.5 mb-0.5">ECO WORLD DEVELOPMENT GROUP BHD.</div>
                            <div className="text-blue-700 font-black text-[10px] tracking-widest uppercase mb-0.5">DISEDIAKAN / DISEMAK</div>
                            <div className="text-blue-800 text-[8px] font-bold uppercase">{details.preparation.approverName}</div>
                            <div className="text-blue-800 text-[7px] font-bold uppercase">{details.preparation.approverRank}</div>
                            <div className="text-blue-800 text-[7px] font-bold mt-1 border-t border-blue-600 pt-0.5">TARIKH: {details.preparation.date}</div>
                        </div>
                    </div>
                 )}
              </div>
          </div>
          <div className="text-center relative">
              <p className="text-[12px] mb-1">DISAHKAN OLEH :</p>
              <div className="h-24 flex items-center justify-center mb-1 relative border-b border-black w-3/4 mx-auto">
                 {/* DIGITAL STAMP 2 */}
                 {details?.approval?.isApproved && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                        <div className="border-2 border-green-600 px-2 py-1 text-center bg-green-50/90 transform -rotate-3 shadow-sm min-w-[140px]">
                            <div className="text-green-900 font-bold text-[7px] uppercase leading-tight">POLIS BANTUAN WILAYAH UTARA</div>
                            <div className="text-green-900 font-bold text-[7px] uppercase leading-tight border-b border-green-600 pb-0.5 mb-0.5">ECO WORLD DEVELOPMENT GROUP BHD.</div>
                            <div className="text-green-700 font-black text-[10px] tracking-widest uppercase mb-0.5">DISAHKAN</div>
                            <div className="text-green-800 text-[8px] font-bold uppercase">{details.approval.approverName}</div>
                            <div className="text-green-800 text-[7px] font-bold uppercase">{details.approval.approverRank}</div>
                            <div className="text-green-800 text-[6px] font-bold uppercase leading-tight mt-0.5">KETUA PENYELIA OPERASI DAN PENTADBIRAN</div>
                            <div className="text-green-800 text-[7px] font-bold mt-1 border-t border-green-600 pt-0.5">TARIKH: {details.approval.date}</div>
                        </div>
                    </div>
                 )}
              </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <ApprovalModal isOpen={isPreparationModalOpen} onClose={() => setIsPreparationModalOpen(false)} onSubmit={handlePreparation} title="Sign as Prepared/Checked" initialName="AHMAD ZAKI BIN NAZER" initialRank="KONST/PB 48805" />
      <ApprovalModal isOpen={isApprovalModalOpen} onClose={() => setIsApprovalModalOpen(false)} onSubmit={handleApprove} title="Approve Daily Roster" initialName="MOHD KHAIRUL AZWANDY BIN ISHAK" initialRank="SJN/PB 74722" />
      <UnlockModal isOpen={isUnlockModalOpen} onClose={() => setIsUnlockModalOpen(false)} onSubmit={handleUnlock} />
    </div>
  );
};
