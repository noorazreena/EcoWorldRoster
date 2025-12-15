
import React, { useState, useEffect } from 'react';
import { Staff, ShiftCode } from '../types';
import { X, Edit3 } from 'lucide-react';

interface ChangeShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (staffId: string, date: string, newCode: ShiftCode) => void;
  staffList: Staff[];
}

export const ChangeShiftModal: React.FC<ChangeShiftModalProps> = ({ isOpen, onClose, onSubmit, staffList }) => {
  const [staffId, setStaffId] = useState('');
  const [date, setDate] = useState('');
  const [newCode, setNewCode] = useState<ShiftCode>(ShiftCode.S);

  useEffect(() => {
    if (staffList.length > 0 && !staffId) {
      setStaffId(staffList[0].id);
    }
  }, [staffList, staffId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (staffId && date && newCode) {
      onSubmit(staffId, date, newCode);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative animate-fade-in border-t-4 border-blue-500">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-4 text-blue-900 border-b border-blue-100 pb-2 flex items-center gap-2">
          <Edit3 className="w-6 h-6 text-blue-600" />
          Change Shift
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Manually assign a specific shift code to a staff member.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
            <select 
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input 
              type="date" 
              required
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Shift Code</label>
            <select 
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value as ShiftCode)}
            >
              <option value={ShiftCode.S}>Siang (S)</option>
              <option value={ShiftCode.M}>Malam (M)</option>
              <option value={ShiftCode.O}>Off (O)</option>
              <option value={ShiftCode.AL}>Annual Leave (AL)</option>
              <option value={ShiftCode.EL}>Medical Leave (MC)</option>
              <option value={ShiftCode.CL}>Compassionate Leave (CL)</option>
              <option value={ShiftCode.HL}>Hospital Leave (HL)</option>
              <option value={ShiftCode.ML}>Maternity Leave (ML)</option>
              <option value={ShiftCode.PL}>Paternity Leave (PL)</option>
              <option value={ShiftCode.MIA}>Missing In Action (MIA)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-blue-50 mt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Update Shift
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
