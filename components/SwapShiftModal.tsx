
import React, { useState, useEffect } from 'react';
import { Staff } from '../types';
import { X, RefreshCcw } from 'lucide-react';

interface SwapShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (staffAId: string, staffBId: string, date: string) => void;
  staffList: Staff[];
}

export const SwapShiftModal: React.FC<SwapShiftModalProps> = ({ isOpen, onClose, onSubmit, staffList }) => {
  const [staffAId, setStaffAId] = useState('');
  const [staffBId, setStaffBId] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (staffList.length >= 2 && !staffAId) {
      setStaffAId(staffList[0].id);
      setStaffBId(staffList[1].id);
    }
  }, [staffList, staffAId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (staffAId && staffBId && date && staffAId !== staffBId) {
      onSubmit(staffAId, staffBId, date);
      onClose();
    } else if (staffAId === staffBId) {
      alert("Please select two different staff members.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative animate-fade-in border-t-4 border-purple-600">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-4 text-purple-900 border-b border-purple-100 pb-2 flex items-center gap-2">
          <RefreshCcw className="w-6 h-6 text-purple-600" />
          Swap Shift (Mutual Change)
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Exchange duties between two staff members for a specific date.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member A</label>
            <select 
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-purple-500 focus:border-purple-500 outline-none"
              value={staffAId}
              onChange={(e) => setStaffAId(e.target.value)}
            >
              {staffList.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.rank} {staff.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center -my-2 relative z-10">
             <div className="bg-gray-100 p-1 rounded-full border border-gray-300">
                <RefreshCcw className="w-4 h-4 text-gray-500" />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member B</label>
            <select 
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-purple-500 focus:border-purple-500 outline-none"
              value={staffBId}
              onChange={(e) => setStaffBId(e.target.value)}
            >
              {staffList.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.rank} {staff.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Swap</label>
            <input 
              type="date" 
              required
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-purple-500 focus:border-purple-500 outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-purple-50 mt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm"
            >
              Confirm Swap
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
