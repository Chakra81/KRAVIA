import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Plus, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = `https://kravia.onrender.com/api`;

const AssignTrainers = () => {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  const [formData, setFormData] = useState({
    course_id: '',
    trainer_id: '',
    batch_name: '',
    start_date: '',
    end_date: '',
    schedule_time: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignRes, coursesRes, trainersRes] = await Promise.all([
        axios.get(`${API}/course-assignments/`),
        axios.get(`${API}/list-courses/`),
        axios.get(`${API}/list-trainers/`)
      ]);
      setAssignments(assignRes.data);
      setCourses(coursesRes.data);
      setTrainers(trainersRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.course_id || !formData.batch_name || !formData.start_date || !formData.end_date) {
      toast.error('Please fill required fields');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await axios.post(`${API}/course-assignments/`, formData);
      toast.success('Assignment created successfully!');
      setShowModal(false);
      setFormData({
        course_id: '', trainer_id: '', batch_name: '',
        start_date: '', end_date: '', schedule_time: ''
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API}/course-assignments/${deleteId}/`);
      toast.success('Deleted successfully');
      setDeleteId(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete assignment');
    }
  };

  return (
    <div className="p-8 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Course Assignments</h1>
          <p className="text-[var(--text-muted)] mt-1">Assign trainers to specific courses and batches</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
        >
          <Plus size={20} /> Create Assignment
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading assignments...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map(assignment => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card border border-[var(--border)] rounded-2xl p-6 relative group hover:border-indigo-500/30 transition-all"
            >
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => confirmDelete(assignment.id)}
                  className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/20"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-main)] line-clamp-1">{assignment.course_title}</h3>
                  <p className="text-sm font-semibold text-indigo-400">{assignment.batch_name}</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center bg-[var(--glass)] p-3 rounded-xl border border-[var(--border)]">
                  <span className="text-sm text-[var(--text-muted)]">Trainer</span>
                  <span className="font-medium flex items-center gap-2 text-[var(--text-main)]">
                    <Users size={14} className="text-indigo-400" />
                    {assignment.trainer_name}
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-[var(--glass)] p-3 rounded-xl border border-[var(--border)]">
                  <span className="text-sm text-[var(--text-muted)]">Schedule</span>
                  <span className="text-sm font-medium text-[var(--text-main)]">
                    {assignment.schedule_time || 'TBD'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-center">
                  <div className="bg-[var(--glass)] p-2 rounded-lg border border-[var(--border)] text-[var(--text-muted)]">
                    Start: <span className="font-semibold text-[var(--text-main)]">{assignment.start_date}</span>
                  </div>
                  <div className="bg-[var(--glass)] p-2 rounded-lg border border-[var(--border)] text-[var(--text-muted)]">
                    End: <span className="font-semibold text-[var(--text-main)]">{assignment.end_date}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {assignments.length === 0 && (
            <div className="col-span-full glass-card p-12 text-center text-[var(--text-muted)]">
              No assignments found. Click "Create Assignment" to get started.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-xl relative z-10 border border-[var(--border)] shadow-2xl rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
                <h2 className="text-xl font-bold text-[var(--text-main)]">Create New Assignment</h2>
                <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium text-[var(--text-muted)]">Select Course *</label>
                    <select
                      name="course_id"
                      value={formData.course_id}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl p-3 text-[var(--text-main)]"
                    >
                      <option value="" className="bg-[#1e1e2d] text-white">-- Select Course --</option>
                      {courses.map(c => <option key={c.id} value={c.id} className="bg-[#1e1e2d] text-white">{c.title}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium text-[var(--text-muted)]">Assign Trainer</label>
                    <select
                      name="trainer_id"
                      value={formData.trainer_id}
                      onChange={handleInputChange}
                      className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl p-3 text-[var(--text-main)]"
                    >
                      <option value="" className="bg-[#1e1e2d] text-white">-- Leave Unassigned --</option>
                      {trainers.map(t => <option key={t.id} value={t.id} className="bg-[#1e1e2d] text-white">{t.name} ({t.email})</option>)}
                    </select>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium text-[var(--text-muted)]">Batch Name *</label>
                    <input
                      name="batch_name"
                      type="text"
                      required
                      placeholder="e.g., Summer 2026 Morning Batch"
                      value={formData.batch_name}
                      onChange={handleInputChange}
                      className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl p-3 text-[var(--text-main)]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-muted)]">Start Date *</label>
                    <input
                      name="start_date"
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={handleInputChange}
                      className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl p-3 text-[var(--text-main)]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-muted)]">End Date *</label>
                    <input
                      name="end_date"
                      type="date"
                      required
                      value={formData.end_date}
                      onChange={handleInputChange}
                      className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl p-3 text-[var(--text-main)]"
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium text-[var(--text-muted)]">Schedule Time</label>
                    <input
                      name="schedule_time"
                      type="text"
                      placeholder="e.g., Mon-Wed-Fri 10:00 AM - 12:00 PM"
                      value={formData.schedule_time}
                      onChange={handleInputChange}
                      className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl p-3 text-[var(--text-main)]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all"
                >
                  {isSubmitting ? 'Creating...' : 'Create Assignment'}
                </button>
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
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md relative z-10 border border-rose-500/30 shadow-2xl rounded-2xl overflow-hidden p-6 text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-main)] mb-2">Delete Assignment?</h2>
              <p className="text-[var(--text-muted)] mb-6">
                Are you sure you want to delete this course assignment? This action cannot be undone.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-6 py-2.5 rounded-xl font-medium bg-[var(--glass)] hover:bg-slate-700/50 text-[var(--text-main)] border border-[var(--border)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="px-6 py-2.5 rounded-xl font-medium bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/30 transition-all"
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

export default AssignTrainers;
