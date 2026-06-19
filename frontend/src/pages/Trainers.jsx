import React, { useState, useEffect } from 'react';
import {
  UserPlus, X, Mail, User, Lock, Phone, BookOpen,
  Edit2, Trash2, Eye, EyeOff, GraduationCap, Award,
  Search, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = `http://${window.location.hostname}:8000/api`;



const emptyForm = {
  name: '',
  email: '',
  phone: '',
  specialization: '',
  password: '',
};

const Trainers = () => {
  useTheme();
  const [trainers, setTrainers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [trainersRes, coursesRes] = await Promise.all([
        axios.get(`${API}/list-trainers/`),
        axios.get(`${API}/list-courses/`)
      ]);
      setTrainers(trainersRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/list-trainers/`);
      setTrainers(res.data);
    } catch (err) {
      console.error('Error fetching trainers:', err);
      toast.error('Failed to fetch trainers');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAdd = () => {
    setEditingTrainer(null);
    setFormData(emptyForm);
    setShowPassword(false);
    setShowAddForm(true);
  };

  const handleOpenEdit = (trainer) => {
    setEditingTrainer(trainer);
    setFormData({
      name: trainer.name,
      email: trainer.email,
      phone: trainer.phone || '',
      specialization: trainer.specialization || '',
      password: trainer.password || '',
    });
    setShowPassword(true);
    setShowAddForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }
    if (!editingTrainer && !formData.password) {
      toast.error('Password is required');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingTrainer) {
        await axios.put(`${API}/trainer-detail/${editingTrainer.id}/`, formData);
        toast.success('Trainer updated successfully!');
      } else {
        await axios.post(`${API}/list-trainers/`, formData);
        toast.success('Trainer added successfully!');
      }
      await fetchTrainers();
      setShowAddForm(false);
      setEditingTrainer(null);
      setFormData(emptyForm);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save trainer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API}/trainer-detail/${deleteConfirmId}/`);
      toast.success('Trainer deleted successfully');
      setDeleteConfirmId(null);
      fetchTrainers();
    } catch (err) {
      toast.error('Failed to delete trainer');
    }
  };

  const filtered = trainers.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase()) ||
    t.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  // Avatar initials
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name[0].toUpperCase();
  };

  const avatarColors = [
    'from-violet-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-pink-500 to-rose-600',
    'from-cyan-500 to-blue-600',
    'from-amber-500 to-yellow-600',
  ];

  return (
    <div className="p-8 relative min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Trainer Management</h1>
          <p className="text-[var(--text-muted)] mt-1">
            Manage your institute's trainers — {trainers.length} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTrainers}
            className="p-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass)] transition-all"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
          >
            <UserPlus size={20} />
            Add Trainer
          </motion.button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search by name, email or specialization..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl pl-11 pr-4 py-3 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm"
        />
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 flex items-center justify-center z-[150] p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-sm overflow-hidden relative z-10 border border-white/10 p-8 text-center shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/30">
                <Trash2 size={40} className="text-rose-500" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-main)] mb-2">Delete Trainer?</h3>
              <p className="text-[var(--text-muted)] mb-8">This will permanently remove the trainer. This action cannot be undone.</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-6 py-3 rounded-xl bg-[var(--glass)] border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--glass-hover)] transition-all"
                >Cancel</button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-3 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
                >Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setShowAddForm(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-2xl overflow-hidden relative z-10 border border-[var(--border)] shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={`p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--glass)]`}>
                <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                  {editingTrainer
                    ? <><Edit2 className="text-indigo-500" size={22} /> Edit Trainer</>
                    : <><GraduationCap className="text-indigo-500" size={22} /> Add New Trainer</>
                  }
                </h2>
                <button
                  onClick={() => !isSubmitting && setShowAddForm(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                  disabled={isSubmitting}
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-muted)] flex items-center gap-2">
                      <User size={15} className="text-indigo-400" /> Full Name *
                    </label>
                    <input
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      placeholder="e.g. Priya Sharma"
                      className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all disabled:opacity-50"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-muted)] flex items-center gap-2">
                      <Mail size={15} className="text-indigo-400" /> Email Address *
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      placeholder="trainer@example.com"
                      className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all disabled:opacity-50"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-muted)] flex items-center gap-2">
                      <Phone size={15} className="text-indigo-400" /> Phone Number
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      placeholder="+91 9876543210"
                      className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all disabled:opacity-50"
                    />
                  </div>

                  {/* Specialization */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-muted)] flex items-center gap-2">
                      <BookOpen size={15} className="text-indigo-400" /> Specialization
                    </label>
                    <select
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all disabled:opacity-50 appearance-none"
                    >
                      <option value="" className="bg-[var(--bg-dark)] text-[var(--text-main)]">Select Specialization</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.title} className="bg-[var(--bg-dark)] text-[var(--text-main)]">{c.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Password */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-[var(--text-muted)] flex items-center gap-2">
                      <Lock size={15} className="text-indigo-400" /> Password {!editingTrainer && '*'}
                    </label>
                    <div className="relative">
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required={!editingTrainer}
                        value={formData.password}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        placeholder={editingTrainer ? 'Leave blank to keep current password' : '••••••••'}
                        className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl pl-4 pr-12 py-3 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 mt-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {editingTrainer ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    editingTrainer ? 'Update Trainer' : 'Add Trainer'
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Trainers Table */}
      {loading ? (
        <div className="glass-card border border-[var(--border)] p-12 text-center">
          <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading trainers...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card border border-[var(--border)] p-16 text-center">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={40} className="text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--text-main)] mb-2">
            {search ? 'No trainers matched' : 'No Trainers Yet'}
          </h3>
          <p className="text-[var(--text-muted)] mb-6">
            {search ? 'Try a different search term.' : 'Click "Add Trainer" to get started.'}
          </p>
          {!search && (
            <button
              onClick={handleOpenAdd}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2 transition-all"
            >
              <UserPlus size={18} /> Add First Trainer
            </button>
          )}
        </div>
      ) : (
        <div className="glass-card overflow-hidden border border-[var(--border)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['#', 'Trainer', 'Phone', 'Specialization', 'Assigned Courses', 'Password', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y bg-[var(--glass)] text-[var(--text-main)]`}>
                {filtered.map((trainer, idx) => (
                  <motion.tr
                    key={trainer.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="hover:bg-[var(--glass)] transition-colors group"
                  >
                    {/* # */}
                    <td className="px-5 py-4 font-mono text-indigo-400 text-sm">
                      #{trainer.id?.toString().padStart(3, '0')}
                    </td>

                    {/* Trainer info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg`}>
                          {getInitials(trainer.name)}
                        </div>
                        <div>
                          <p className={`font-semibold text-[var(--text-main)]`}>
                            {trainer.name || '—'}
                          </p>
                          <p className="text-[var(--text-muted)] text-xs">{trainer.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-5 py-4 text-[var(--text-main)] text-sm">
                      {trainer.phone || <span className="text-[var(--text-muted)] italic text-xs">Not provided</span>}
                    </td>

                    {/* Specialization */}
                    <td className="px-5 py-4">
                      {trainer.specialization ? (
                        <span className="bg-violet-500/10 text-violet-400 border border-violet-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                          {trainer.specialization}
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)] italic text-xs">Not set</span>
                      )}
                    </td>

                    {/* Assigned Courses */}
                    <td className="px-5 py-4">
                      {trainer.courses && trainer.courses.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {trainer.courses.map((c, i) => (
                            <span key={i} className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap">
                              {c}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)] italic text-xs">No batches assigned</span>
                      )}
                    </td>

                    {/* Password */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 group/pass">
                        <span className="text-indigo-400/80 font-mono text-sm">
                          {showPasswords[trainer.id] ? trainer.password : '••••••••'}
                        </span>
                        <button
                          onClick={() => setShowPasswords(prev => ({ ...prev, [trainer.id]: !prev[trainer.id] }))}
                          className="opacity-0 group-hover/pass:opacity-100 p-1 hover:bg-[var(--glass)] rounded transition-all text-slate-500 hover:text-indigo-400"
                        >
                          {showPasswords[trainer.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      {trainer.is_approved ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          Active
                        </span>
                      ) : (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(trainer)}
                          className="p-2 text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors"
                          title="Edit Trainer"
                        >
                          <Edit2 size={17} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(trainer.id)}
                          className="p-2 text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                          title="Delete Trainer"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className={`px-6 py-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--glass)] text-[var(--text-main)]`}>
            <p className="text-xs text-[var(--text-muted)]">
              Showing {filtered.length} of {trainers.length} trainers
            </p>
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Award size={13} className="text-indigo-400" />
              Trainer Management
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trainers;
