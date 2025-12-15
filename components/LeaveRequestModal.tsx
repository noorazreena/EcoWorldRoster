
import React, { useState, useEffect } from 'react';
import { Staff, ShiftCode } from '../types';
import { X } from 'lucide-react';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (staffId: string, leaveType: ShiftCode, startDate: string, endDate: string) => void;
  staffList: Staff[];
}

export const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({ isOpen, onClose, onSubmit, staffList }) => {
  const [staffId, setStaffId] = useState('');
  const [leaveType, setLeaveType] = useState<ShiftCode>(ShiftCode.AL);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Update default staff ID when list loads or modal opens
  useEffect(() => {
    if (staffList.length > 0 && !staffId) {
      setStaffId(staffList[0].id);
    }
  }, [staffList, staffId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (staffId && leaveType && startDate && endDate) {
      onSubmit(staffId, leaveType, startDate, endDate);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative animate-fade-in">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-4 text-gray-900 border-b pb-2 flex items-center gap-2">
          Request Leave / PH
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
            <select 
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-900 focus:border-blue-900 outline-none"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
            >
              {staffList.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.rank} {staff.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
            <select 
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-900 focus:border-blue-900 outline-none"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as ShiftCode)}
            >
              <option value={ShiftCode.AL}>Annual Leave (AL)</option>
              <option value={ShiftCode.PH}>Public Holiday (PH)</option>
              <option value={ShiftCode.CL}>Compassionate Leave (CL)</option>
              <option value={ShiftCode.EL}>Medical Leave (MC)</option>
              <option value={ShiftCode.HL}>Hospital Leave (HL)</option>
              <option value={ShiftCode.ML}>Maternity Leave (ML)</option>
              <option value={ShiftCode.PL}>Paternity Leave (PL)</option>
              <option value={ShiftCode.MIA}>Missing In Action (MIA)</option>
              <option value={ShiftCode.T}>Training (T)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input 
                type="date" 
                required
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-900 focus:border-blue-900 outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input 
                type="date" 
                required
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-900 focus:border-blue-900 outline-none"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-900 text-white rounded text-sm font-medium hover:bg-blue-800 transition-colors shadow-sm"
            >
              Confirm Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
