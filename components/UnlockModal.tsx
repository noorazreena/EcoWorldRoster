
import React, { useState } from 'react';
import { X, Lock, AlertTriangle } from 'lucide-react';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

// HARDCODED ADMIN PIN FOR SECURITY SIMULATION
const ADMIN_PIN = "8888";

export const UnlockModal: React.FC<UnlockModalProps> = ({ isOpen, onClose, onSubmit }) => {
  if (!isOpen) return null;

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      onSubmit();
      onClose();
      setPin('');
      setError('');
    } else {
      setError('Incorrect PIN. Access Denied.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 relative animate-fade-in border-t-4 border-red-600">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-4 text-red-900 border-b border-red-100 pb-2 flex items-center gap-2">
          <Lock className="w-6 h-6 text-red-600" />
          Security Check
        </h2>
        
        <div className="bg-red-50 p-3 rounded-md mb-4 flex items-start gap-2">
           <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
           <p className="text-xs text-red-800">
             This roster is <b>LOCKED</b>. Enter the Admin PIN to unlock it for editing.
           </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Enter Admin PIN</label>
            <input 
              type="password" 
              autoFocus
              required
              className="w-full border border-gray-300 rounded-md p-2 text-center text-lg tracking-widest focus:ring-red-500 focus:border-red-500 outline-none"
              placeholder="••••"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
              }}
            />
            {error && <p className="text-red-600 text-xs mt-1 font-bold text-center">{error}</p>}
            <p className="text-[10px] text-gray-400 text-center mt-2">(Default PIN: 8888)</p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-red-50 mt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
            >
              Unlock Roster
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
