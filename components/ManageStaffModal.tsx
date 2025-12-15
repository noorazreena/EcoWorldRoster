
import React, { useState, useEffect } from 'react';
import { Staff, Rank } from '../types';
import { X, Plus, Trash2, Edit2, Save, Users } from 'lucide-react';

interface ManageStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: Staff[];
  onUpdate: (newStaffList: Staff[]) => void;
}

const EMPTY_STAFF: Staff = {
  id: '',
  bodyNumber: '',
  rank: Rank.KONST,
  name: '',
  walkieTalkie: '',
  vehicle: ''
};

export const ManageStaffModal: React.FC<ManageStaffModalProps> = ({ isOpen, onClose, staffList, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Staff>(EMPTY_STAFF);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditingId(null);
      setIsAdding(false);
      setEditForm(EMPTY_STAFF);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEdit = (staff: Staff) => {
    setEditingId(staff.id);
    setEditForm({ ...staff });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to remove this staff member? This will not remove them from historical static logs but will affect future rosters.")) {
      const updated = staffList.filter(s => s.id !== id);
      onUpdate(updated);
    }
  };

  const handleSave = () => {
    if (!editForm.name || !editForm.bodyNumber) {
      alert("Name and Body Number are required.");
      return;
    }

    let updatedList = [...staffList];

    if (isAdding) {
      const newStaff = { ...editForm, id: Date.now().toString() };
      updatedList.push(newStaff);
    } else {
      updatedList = updatedList.map(s => s.id === editingId ? editForm : s);
    }

    onUpdate(updatedList);
    setEditingId(null);
    setIsAdding(false);
    setEditForm(EMPTY_STAFF);
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setEditForm({ ...EMPTY_STAFF, rank: Rank.KONST });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setEditForm(EMPTY_STAFF);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 relative animate-fade-in flex flex-col max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-4 text-gray-900 flex items-center gap-2 border-b pb-2">
          <Users className="w-6 h-6 text-blue-600" />
          Manage Staff List
        </h2>

        <div className="flex-1 overflow-y-auto mb-4">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="p-2 border-b">Rank</th>
                <th className="p-2 border-b">No. Badan</th>
                <th className="p-2 border-b">Name</th>
                <th className="p-2 border-b">W/T</th>
                <th className="p-2 border-b">Vehicle</th>
                <th className="p-2 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map(staff => (
                <tr key={staff.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{staff.rank}</td>
                  <td className="p-2">{staff.bodyNumber}</td>
                  <td className="p-2 font-medium">{staff.name}</td>
                  <td className="p-2">{staff.walkieTalkie || '-'}</td>
                  <td className="p-2">{staff.vehicle || '-'}</td>
                  <td className="p-2 text-right space-x-2">
                    <button onClick={() => handleEdit(staff)} className="text-blue-600 hover:text-blue-800 p-1"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(staff.id)} className="text-red-600 hover:text-red-800 p-1"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* EDIT/ADD FORM */}
        {(isAdding || editingId) && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">{isAdding ? 'Add New Staff' : 'Edit Staff'}</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-600">Rank</label>
                <select 
                  className="w-full border rounded p-1 text-sm"
                  value={editForm.rank}
                  onChange={e => setEditForm({...editForm, rank: e.target.value as Rank})}
                >
                  <option value={Rank.SJN}>SJN</option>
                  <option value={Rank.KPL}>KPL</option>
                  <option value={Rank.KONST}>KONST</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600">No. Badan</label>
                <input 
                  className="w-full border rounded p-1 text-sm"
                  value={editForm.bodyNumber}
                  onChange={e => setEditForm({...editForm, bodyNumber: e.target.value})}
                  placeholder="e.g. 12345"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-600">Name</label>
                <input 
                  className="w-full border rounded p-1 text-sm uppercase"
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  placeholder="Full Name"
                />
              </div>
              <div>
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-bold text-gray-600">W/T</label>
                        <input 
                        className="w-full border rounded p-1 text-sm"
                        value={editForm.walkieTalkie}
                        onChange={e => setEditForm({...editForm, walkieTalkie: e.target.value})}
                        placeholder="N01"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600">Vehicle</label>
                        <input 
                        className="w-full border rounded p-1 text-sm"
                        value={editForm.vehicle}
                        onChange={e => setEditForm({...editForm, vehicle: e.target.value})}
                        placeholder="WB..."
                        />
                    </div>
                 </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={cancelEdit} className="px-3 py-1 bg-gray-300 text-gray-800 rounded text-sm">Cancel</button>
              <button onClick={handleSave} className="px-3 py-1 bg-blue-600 text-white rounded text-sm flex items-center gap-1"><Save className="w-4 h-4" /> Save</button>
            </div>
          </div>
        )}

        {!isAdding && !editingId && (
          <button onClick={startAdd} className="w-full py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> Add New Staff
          </button>
        )}

      </div>
    </div>
  );
};
