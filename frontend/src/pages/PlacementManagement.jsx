import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Search, Plus, Trash2, Edit2, X, Building, DollarSign } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API = `https://kravia.onrender.com/api`;

const PlacementManagement = () => {
  const [placements, setPlacements] = useState([]);
  const [students, setStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  
  const [formData, setFormData] = useState({
    student: '',
    company_name: '',
    job_role: '',
    package: '',
    placement_date: '',
    status: 'pending'
  });

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchPlacements();
    fetchStudents();
  }, []);

  const fetchPlacements = async () => {
    try {
      const res = await axios.get(`${API}/placements/`);
      setPlacements(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load placements');
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API}/list-students/`);
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = (placement = null) => {
    if (placement) {
      setEditingId(placement.id);
      setFormData({
        student: placement.student,
        company_name: placement.company_name,
        job_role: placement.job_role,
        package: placement.package || '',
        placement_date: placement.placement_date,
        status: placement.status
      });
    } else {
      setEditingId(null);
      setFormData({
        student: '',
        company_name: '',
        job_role: '',
        package: '',
        placement_date: '',
        status: 'pending'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API}/placements/${editingId}/`, formData);
        toast.success('Placement updated successfully');
      } else {
        await axios.post(`${API}/placements/`, formData);
        toast.success('Placement added successfully');
      }
      setIsModalOpen(false);
      fetchPlacements();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to save placement');
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API}/placements/${deleteId}/`);
      toast.success('Placement record deleted');
      setDeleteId(null);
      fetchPlacements();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
    }
  };

  const filteredPlacements = placements.filter(p => 
    p.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.job_role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Briefcase className="text-indigo-400" size={32} />
            Placement Management
          </h1>
          <p className="text-slate-400 mt-1 font-medium">Track and manage student placements</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus size={20} /> Add Record
        </button>
      </div>

      <div className="glass-card p-6 border border-white/5 mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by student, company, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlacements.map(placement => (
          <motion.div
            key={placement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 border border-white/5 relative group"
          >
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleOpenModal(placement)} className="p-2 bg-white/10 text-indigo-400 hover:bg-white/20 rounded-lg transition-all">
                <Edit2 size={16} />
              </button>
              <button onClick={() => confirmDelete(placement.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-all">
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xl">
                {placement.student_name?.charAt(0) || 'S'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{placement.student_name}</h3>
                <p className="text-slate-400 text-sm">{placement.student_email}</p>
              </div>
            </div>

            <div className="space-y-3 mt-6">
              <div className="flex items-center gap-3 text-sm">
                <div className="p-1.5 rounded-md bg-white/5 text-slate-400"><Building size={16} /></div>
                <span className="text-white">{placement.company_name}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="p-1.5 rounded-md bg-white/5 text-slate-400"><Briefcase size={16} /></div>
                <span className="text-white">{placement.job_role}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400"><DollarSign size={16} /></div>
                <span className="text-emerald-400 font-semibold">{placement.package || 'Not disclosed'}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
              <span className="text-slate-500 text-xs">Date: {placement.placement_date}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                placement.status === 'placed' ? 'bg-emerald-500/10 text-emerald-400' :
                placement.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400' :
                'bg-slate-500/10 text-slate-400'
              }`}>
                {placement.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </motion.div>
        ))}
        
        {filteredPlacements.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            No placement records found.
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a1b26] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/5">
                <h2 className="text-xl font-bold text-white">
                  {editingId ? 'Edit Placement Record' : 'Add New Placement'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Student</label>
                  <select
                    required
                    value={formData.student}
                    onChange={(e) => setFormData({...formData, student: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value="" className="bg-[#1a1b26]">Select Student</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id} className="bg-[#1a1b26]">{s.name || s.username} ({s.email})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Company Name</label>
                    <input
                      type="text"
                      required
                      value={formData.company_name}
                      onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Job Role</label>
                    <input
                      type="text"
                      required
                      value={formData.job_role}
                      onChange={(e) => setFormData({...formData, job_role: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Package (LPA)</label>
                    <input
                      type="text"
                      placeholder="e.g. 8.5 LPA"
                      value={formData.package}
                      onChange={(e) => setFormData({...formData, package: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Placement Date</label>
                    <input
                      type="date"
                      required
                      value={formData.placement_date}
                      onChange={(e) => setFormData({...formData, placement_date: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-all"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value="pending" className="bg-[#1a1b26]">Pending</option>
                    <option value="in_progress" className="bg-[#1a1b26]">In Progress</option>
                    <option value="placed" className="bg-[#1a1b26]">Placed</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20 transition-all"
                  >
                    {editingId ? 'Update Record' : 'Save Record'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a1b26] w-full max-w-md relative z-10 border border-red-500/30 shadow-2xl rounded-2xl overflow-hidden p-6 text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Delete Placement Record?</h2>
              <p className="text-slate-400 mb-6">
                Are you sure you want to delete this placement record? This action cannot be undone.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-6 py-2.5 rounded-xl font-medium bg-white/5 hover:bg-white/10 text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="px-6 py-2.5 rounded-xl font-medium bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30 transition-all"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlacementManagement;
