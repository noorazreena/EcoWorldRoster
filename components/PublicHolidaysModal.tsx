
import React from 'react';
import { X, Calendar } from 'lucide-react';
import { PUBLIC_HOLIDAYS_2026, MONTH_NAMES } from '../constants';

interface PublicHolidaysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublicHolidaysModal: React.FC<PublicHolidaysModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Convert dictionary to array and sort by date
  const holidays = Object.entries(PUBLIC_HOLIDAYS_2026).map(([key, name]) => {
    const [monthStr, dayStr] = key.split('-');
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    return { month, day, name };
  }).sort((a, b) => {
    if (a.month !== b.month) return a.month - b.month;
    return a.day - b.day;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative animate-fade-in flex flex-col max-h-[85vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-4 text-gray-900 border-b pb-2 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-red-600" />
          Public Holidays 2026
        </h2>

        <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0 z-10">
              <tr>
                <th className="p-2 border-b border-gray-200">Date</th>
                <th className="p-2 border-b border-gray-200">Holiday</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {holidays.map((h, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="p-2 font-medium text-gray-600 whitespace-nowrap align-top w-1/3">
                    {h.day} {MONTH_NAMES[h.month]}
                  </td>
                  <td className="p-2 text-gray-900 align-top">
                    {h.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 pt-2 border-t text-xs text-gray-400 text-center">
            EcoWorld Auxiliary Police • EcoNorth
        </div>
      </div>
    </div>
  );
};
