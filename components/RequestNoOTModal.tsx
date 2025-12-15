
import React, { useState, useEffect } from 'react';
import { Staff } from '../types';
import { X } from 'lucide-react';

interface RequestNoOTModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (staffId: string, date: string) => void;
  staffList: Staff[];
}

export const RequestNoOTModal: React.FC<RequestNoOTModalProps> = ({ isOpen, onClose, onSubmit, staffList }) => {
  const [staffId, setStaffId] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (staffList.length > 0 && !staffId) {
      setStaffId(staffList[0].id);
    }
  }, [staffList, staffId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (staffId && date) {
      onSubmit(staffId, date);
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
          Request No OT
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Staff who do not perform OT (less than 10hrs duty) are not entitled to Meal Allowance.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
            <select 
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-gray-500 focus:border-gray-500 outline-none"
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
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-gray-500 focus:border-gray-500 outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
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
              className="px-4 py-2 bg-gray-800 text-white rounded text-sm font-medium hover:bg-gray-900 transition-colors shadow-sm"
            >
              Confirm No OT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
