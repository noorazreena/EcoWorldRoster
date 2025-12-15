
import React, { useState, useEffect } from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, rank: string) => void;
  title?: string;
  initialName?: string;
  initialRank?: string;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title = "Approve Roster",
  initialName = 'MOHD KHAIRUL AZWANDY BIN ISHAK',
  initialRank = 'SJN/PB 74722'
}) => {
  const [name, setName] = useState(initialName);
  const [rank, setRank] = useState(initialRank);

  // Update state when props change (re-opening modal with different defaults)
  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setRank(initialRank);
    }
  }, [isOpen, initialName, initialRank]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && rank) {
      onSubmit(name, rank);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative animate-fade-in border-t-4 border-green-600">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-4 text-green-900 border-b border-green-100 pb-2 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-green-600" />
          {title}
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Please confirm the officer details for the official stamp.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Officer Name</label>
            <input 
              type="text" 
              required
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-green-500 focus:border-green-500 outline-none uppercase"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rank / ID</label>
            <input 
              type="text" 
              required
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-green-500 focus:border-green-500 outline-none uppercase"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-green-50 mt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
            >
              Confirm & Stamp
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
