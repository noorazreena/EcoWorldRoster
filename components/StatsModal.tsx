
import React from 'react';
import { StaffRoster, ShiftCode } from '../types';
import { X, BarChart2 } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rosterData: StaffRoster[];
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, rosterData }) => {
  if (!isOpen) return null;

  // Calculate stats for charts
  const stats = rosterData.map(r => {
    const nightShifts = r.days.filter(d => d.code === ShiftCode.M || (d.code === ShiftCode.CFPH && d.originalCode === ShiftCode.M)).length;
    const weekendDuties = r.days.filter(d => {
      const isWeekend = d.dayOfWeek === 0 || d.dayOfWeek === 6;
      const isWorking = d.code === ShiftCode.S || d.code === ShiftCode.M || d.code === ShiftCode.CFPH;
      return isWeekend && isWorking;
    }).length;

    return {
      name: r.staff.name.split(' ').pop(), // Short name
      nightShifts,
      weekendDuties,
      otHours: r.summary.overtimeHours
    };
  });

  const maxNight = Math.max(...stats.map(s => s.nightShifts));
  const maxWeekend = Math.max(...stats.map(s => s.weekendDuties));
  const maxOT = Math.max(...stats.map(s => s.otHours));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 relative animate-fade-in overflow-y-auto max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-blue-600" />
          Fairness Dashboard
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Night Shifts Chart */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-center mb-4 text-gray-700">Night Shifts</h3>
            <div className="space-y-3">
              {stats.map((s, i) => (
                <div key={i} className="flex items-center text-xs">
                  <div className="w-20 font-medium truncate">{s.name}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 mx-2">
                    <div 
                      className="bg-purple-600 h-3 rounded-full" 
                      style={{ width: `${(s.nightShifts / maxNight) * 100}%` }}
                    ></div>
                  </div>
                  <div className="w-6 text-right font-bold">{s.nightShifts}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekend Duties Chart */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-center mb-4 text-gray-700">Weekend Duties</h3>
            <div className="space-y-3">
              {stats.map((s, i) => (
                <div key={i} className="flex items-center text-xs">
                  <div className="w-20 font-medium truncate">{s.name}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 mx-2">
                    <div 
                      className="bg-orange-500 h-3 rounded-full" 
                      style={{ width: `${(s.weekendDuties / maxWeekend) * 100}%` }}
                    ></div>
                  </div>
                  <div className="w-6 text-right font-bold">{s.weekendDuties}</div>
                </div>
              ))}
            </div>
          </div>

          {/* OT Hours Chart */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-center mb-4 text-gray-700">OT Hours</h3>
            <div className="space-y-3">
              {stats.map((s, i) => (
                <div key={i} className="flex items-center text-xs">
                  <div className="w-20 font-medium truncate">{s.name}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 mx-2">
                    <div 
                      className="bg-green-600 h-3 rounded-full" 
                      style={{ width: `${(s.otHours / maxOT) * 100}%` }}
                    ></div>
                  </div>
                  <div className="w-6 text-right font-bold">{s.otHours}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
