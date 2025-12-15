
import React from 'react';
import { StaffRoster, ShiftCode, DailyStrength, DayStatus } from '../types';
import { DAYS_OF_WEEK, SHIFT_COLORS, PUBLIC_HOLIDAYS_2026 } from '../constants';
import { AlertTriangle } from 'lucide-react';

interface RosterTableProps {
  rosterData: StaffRoster[];
  dailyStrength: DailyStrength[];
  viewMode?: 'PLAN' | 'ACTUAL' | 'DAILY';
}

export const RosterTable: React.FC<RosterTableProps> = ({ rosterData, dailyStrength, viewMode = 'PLAN' }) => {
  if (!rosterData.length) return <div>No Data</div>;

  const headerDays = rosterData[0].days;

  const getPublicHolidayName = (day: DayStatus) => {
    const key = `${day.month}-${day.date}`;
    return PUBLIC_HOLIDAYS_2026[key];
  };

  const getMealTooltip = (day: DayStatus) => {
    if (day.mealAllowance === 0) return 'No Meal Allowance';
    if (day.code === ShiftCode.CFPH) return 'Carry Forward PH (RM 10)';
    if (day.code === ShiftCode.M) return 'Night Shift (Standard RM 10)';
    if (day.code === ShiftCode.S) {
      const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6;
      return isWeekend ? 'Weekend Day Shift (RM 20)' : 'Weekday Day Shift (RM 10)';
    }
    return `Allowance: RM ${day.mealAllowance}`;
  };

  const renderCell = (day: DayStatus) => {
    let codeForColor = day.code;
    if (day.code === ShiftCode.CFPH && day.originalCode) {
      codeForColor = day.originalCode;
    }
    const colorClass = SHIFT_COLORS[codeForColor] || 'bg-white text-gray-800';
    const isWeekendDay = day.dayOfWeek === 0 || day.dayOfWeek === 6;
    const displayText = day.isRestDayOT ? 'RDOT' : day.code;
    const rdotClass = day.isRestDayOT ? 'font-black tracking-tighter' : '';
    const weekendClass = isWeekendDay ? 'brightness-95 saturate-150 ring-inset ring-1 ring-black/10' : '';
    const hoverClass = 'transition-all duration-150 hover:brightness-75 cursor-pointer hover:shadow-inner';
    
    return (
      <div 
        className={`w-full h-full flex items-center justify-center font-bold text-xs ${colorClass} ${rdotClass} ${weekendClass} ${hoverClass} relative group`}
        title={isWeekendDay ? 'Weekend Duty' : ''}
      >
        {displayText}
        {isWeekendDay && (<span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-black/20 rounded-full" />)}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto border border-black shadow-lg bg-white mb-8">
      <table className="w-full border-collapse min-w-[1500px]">
        <thead className="sticky top-0 z-20 bg-gray-100 text-[9px] uppercase text-center border-b-2 border-black leading-tight">
          <tr>
            <th className="sticky left-0 z-30 bg-gray-200 border border-black min-w-[30px] w-[30px] p-0.5 break-words whitespace-normal" rowSpan={2}>No<br/>Staf</th>
            <th className="sticky left-[30px] z-30 bg-gray-200 border border-black min-w-[40px] w-[40px] p-0.5 break-words whitespace-normal" rowSpan={2}>No<br/>Badan</th>
            <th className="sticky left-[70px] z-30 bg-gray-200 border border-black min-w-[35px] w-[35px] p-0.5 break-words whitespace-normal" rowSpan={2}>Pkt</th>
            <th className="sticky left-[105px] z-30 bg-gray-200 border border-black min-w-[100px] max-w-[100px] p-1 text-center" rowSpan={2}>Nama</th>
            <th className="border border-black bg-gray-300 min-w-[30px] p-0.5 whitespace-normal" rowSpan={2}>DATE<br/>DAY</th>
            
            {headerDays.map((d, index) => {
              const phName = getPublicHolidayName(d);
              const isWeekend = d.dayOfWeek === 0 || d.dayOfWeek === 6;
              return (
                <th key={index} className={`border border-black min-w-[28px] ${phName ? 'bg-red-200 text-red-900' : (isWeekend ? 'bg-gray-300' : '')}`} title={phName || `${d.date}/${d.month + 1}`}>
                  {d.date}
                </th>
              );
            })}

            <th className="border border-black bg-gray-200 min-w-[30px] whitespace-normal p-0.5" rowSpan={2}>Work<br/>Day</th>
            <th className="border border-black bg-gray-200 min-w-[30px] whitespace-normal p-0.5" rowSpan={2}>OT<br/>Hrs</th>
            <th className="border border-black bg-gray-200 min-w-[40px] whitespace-normal p-0.5" rowSpan={2}>Meal<br/>(RM)</th>
            <th className="border border-black bg-gray-200 min-w-[30px] whitespace-normal p-0.5" rowSpan={2}>Rest<br/>Day</th>
            <th className="border border-black bg-gray-200 min-w-[30px] whitespace-normal p-0.5" rowSpan={2}>RD<br/>OT</th>
            <th className="border border-black bg-gray-200 min-w-[30px] whitespace-normal p-0.5" rowSpan={2}>Pub<br/>Hol</th>
            <th className="border border-black bg-gray-200 min-w-[30px] whitespace-normal p-0.5" rowSpan={2}>CF<br/>PH</th>
          </tr>

          <tr>
            {headerDays.map((d, index) => {
               const phName = getPublicHolidayName(d);
               const isWeekend = d.dayOfWeek === 0 || d.dayOfWeek === 6;
               return (
                <th key={`day-${index}`} className={`border border-black h-6 text-[10px] ${phName ? 'bg-red-100 text-red-900 font-bold' : (isWeekend ? 'bg-gray-300' : '')}`} title={phName}>
                  {DAYS_OF_WEEK[d.dayOfWeek].charAt(0)}
                </th>
               );
            })}
          </tr>
        </thead>

        <tbody className="text-center text-xs">
          {rosterData.map((person) => (
            <React.Fragment key={person.staff.id}>
              <tr className="min-h-[32px]">
                <td className="sticky left-0 z-10 bg-white border border-black font-semibold text-[10px]" rowSpan={3}>{person.staff.id}</td>
                <td className="sticky left-[30px] z-10 bg-white border border-black text-[10px]" rowSpan={3}>{person.staff.bodyNumber}</td>
                <td className="sticky left-[70px] z-10 bg-white border border-black text-[10px]" rowSpan={3}>{person.staff.rank}</td>
                <td className="sticky left-[105px] z-10 bg-white border border-black text-left pl-1 font-bold text-[10px] leading-tight max-w-[100px]" rowSpan={3}>
                  <div className="flex items-center justify-between w-full min-h-[2rem]">
                    <span className="whitespace-normal break-words">{person.staff.name}</span>
                    {person.conflicts.length > 0 && (
                      <div className="mr-1 shrink-0" title={person.conflicts.join('\n')}>
                        <AlertTriangle className="w-3 h-3 text-orange-500 cursor-help" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="border border-black font-bold bg-gray-50 text-[10px]">SHIFT</td>
                {person.days.map((day, i) => <td key={`status-${i}`} className="border border-black p-0">{renderCell(day)}</td>)}
                
                <td className="border border-black font-bold" rowSpan={3}>{person.summary.workdays}</td>
                <td className="border border-black font-bold" rowSpan={3}>{person.summary.overtimeHours}</td>
                <td className="border border-black font-bold text-blue-800" rowSpan={3}>{person.summary.meals > 0 ? person.summary.meals : ''}</td>
                <td className="border border-black font-bold" rowSpan={3}>{person.summary.restdays}</td>
                <td className="border border-black font-bold bg-orange-50" rowSpan={3}>{person.summary.rdot}</td>
                <td className="border border-black font-bold bg-green-50" rowSpan={3}>{person.summary.publicHolidays}</td>
                <td className="border border-black font-bold bg-green-100 text-green-800" rowSpan={3}>{person.summary.cfph}</td>
              </tr>
              
              <tr className="h-6 bg-gray-50">
                <td className="border border-black font-semibold text-[9px]">OT</td>
                {person.days.map((day, i) => (
                  <td key={`ot-${i}`} className={`border border-black text-[10px] ${(day.dayOfWeek === 0 || day.dayOfWeek === 6) ? 'bg-gray-100' : ''}`}>
                    {day.otHours ? <b>{day.otHours}</b> : ''}
                  </td>
                ))}
              </tr>

              <tr className="h-6 bg-gray-50">
                <td className="border border-black font-semibold text-[9px]">MEAL</td>
                {person.days.map((day, i) => (
                  <td key={`meal-${i}`} className={`border border-black text-[10px] cursor-help ${(day.dayOfWeek === 0 || day.dayOfWeek === 6) ? 'bg-gray-100' : ''}`} title={getMealTooltip(day)}>
                    {day.mealAllowance > 0 ? <span className="text-blue-800">{day.mealAllowance}</span> : ''}
                  </td>
                ))}
              </tr>
            </React.Fragment>
          ))}
        </tbody>

        <tfoot className="sticky bottom-0 z-30 bg-white border-t-4 border-black">
          <tr className="h-8 text-[10px]">
            <td colSpan={5} className="sticky left-0 bg-blue-50 border border-black font-bold text-right pr-2 uppercase text-blue-900">KEKUATAN SIANG (Min 3)</td>
            {dailyStrength.map((ds, i) => (
              <td key={`strength-s-${i}`} className={`border border-black font-bold text-center ${ds.shiftSiang < 3 ? 'bg-red-500 text-white' : 'bg-blue-100 text-blue-900'}`}>{ds.shiftSiang}</td>
            ))}
            <td colSpan={7} className="bg-gray-200 border border-black"></td>
          </tr>
          <tr className="h-8 text-[10px]">
            <td colSpan={5} className="sticky left-0 bg-gray-100 border border-black font-bold text-right pr-2 uppercase text-gray-900">KEKUATAN MALAM (Min 3)</td>
            {dailyStrength.map((ds, i) => (
              <td key={`strength-m-${i}`} className={`border border-black font-bold text-center ${ds.shiftMalam < 3 ? 'bg-red-500 text-white' : 'bg-gray-50 text-gray-900'}`}>{ds.shiftMalam}</td>
            ))}
            <td colSpan={7} className="bg-gray-200 border border-black"></td>
          </tr>
          <tr className="h-8 text-[10px]">
            <td colSpan={5} className="sticky left-0 bg-yellow-50 border border-black font-bold text-right pr-2 uppercase text-yellow-900">KEKUATAN OFF DAY</td>
            {dailyStrength.map((ds, i) => (
              <td key={`strength-o-${i}`} className={`border border-black font-bold text-center ${ds.off < 2 ? 'bg-red-500 text-white' : 'bg-yellow-100 text-yellow-900'}`}>{ds.off}</td>
            ))}
            <td colSpan={7} className="bg-gray-200 border border-black"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
