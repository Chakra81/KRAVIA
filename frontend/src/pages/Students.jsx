import React, { useState, useEffect } from 'react';
import { UserPlus, X, Mail, User, BookOpen, Lock, Calendar, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import ExportModule from '../components/ExportModule';

const API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api');

const Students = () => {
  useTheme();
  const [students, setStudents] = useState([]);
  const [showPasswords, setShowPasswords] = useState({}); // student.id -> boolean
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [availableCourses, setAvailableCourses] = useState([]);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    course: '',
    password: '',
    joinedDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API}/list-courses/`);
      setAvailableCourses(response.data);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API}/list-students/`);
      setStudents(response.data);
    } catch (err) {
      console.error('Error fetching students:', err);
      toast.error('Failed to fetch students from server');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      email: '',
      course: '',
      password: '',
      joinedDate: '',
      endDate: ''
    });
    setShowAddForm(true);
    setShowPassword(false); // Masked by default for creation
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      course: student.course,
      password: student.password, // Show current password
      joinedDate: student.joinedDate,
      endDate: student.endDate || ''
    });
    setShowAddForm(true);
    setShowPassword(true); // Plain text by default for editing
  };

  const handleDeleteStudent = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    try {
        await axios.delete(`${API}/delete-student/${deleteConfirmId}/`);
        setStudents(students.filter(s => s.id !== deleteConfirmId));
        toast.success('Student deleted successfully');
        setDeleteConfirmId(null);
        fetchStudents(); // Refresh data to be sure
    } catch (err) {
        console.error('Delete error:', err);
        toast.error('Failed to delete student');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.course || !formData.joinedDate) {
        toast.error('Please fill in all required fields');
        return;
    }

    setIsSubmitting(true);
    
    const submitData = async () => {
      try {
        if (editingStudent) {
          await axios.put(`${API}/update-student/${editingStudent.id}/`, formData);
          toast.success('Student updated successfully!');
        } else {
          await axios.post(`${API}/add-student/`, formData);
          toast.success('Student enrolled successfully!');
        }
        await fetchStudents();
        
        setFormData({
          name: '',
          email: '',
          course: '',
          password: '',
          joinedDate: '',
          endDate: ''
        });
        
        setIsSubmitting(false);
        setShowAddForm(false);
        setEditingStudent(null);
      } catch (err) {
        setIsSubmitting(false);
        toast.error(err.response?.data?.error || 'Failed to save student.');
      }
    };

    submitData();
  };

  return (
    <div className="p-8 relative min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Student Management</h1>
          <p className="text-[var(--text-muted)] mt-1">Manage and track your institute's students</p>
        </div>
        <div className="flex items-center gap-4">
          <ExportModule 
            data={students} 
            columns={['name', 'email', 'course', 'joinedDate', 'status']} 
            filename="Kravia_Students_Report" 
          />
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
          >
            <UserPlus size={20} />
            Add Student
          </motion.button>
        </div>
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
              onClick={(e) => e.stopPropagation()}
            >
                <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/30">
                    <Trash2 size={40} className="text-rose-500" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-main)] mb-2">Delete Student?</h3>
                <p className="text-[var(--text-muted)] mb-8">This will permanently remove the student from the system. This action cannot be undone.</p>
                
                <div className="flex gap-4">
                    <button 
                        onClick={() => setDeleteConfirmId(null)}
                        className="flex-1 px-6 py-3 rounded-xl bg-[var(--glass)] border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--glass-hover)] transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDelete}
                        className="flex-1 px-6 py-3 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
                    >
                        Delete
                    </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-2xl overflow-hidden relative z-10 border border-[var(--border)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--glass)]`}>
                <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                  {editingStudent ? <Edit2 className="text-indigo-500" size={24} /> : <UserPlus className="text-indigo-500" size={24} />}
                  {editingStudent ? 'Edit Student Details' : 'Add New Student'}
                </h2>
                <button 
                  onClick={() => setShowAddForm(false)} 
                  className="text-white/60 hover:text-white transition-colors"
                  disabled={isSubmitting}
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-muted)] flex items-center gap-2">
                      <User size={16} className="text-indigo-400" /> Full Name
                    </label>
                    <input
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Mail size={16} className="text-indigo-400" /> Email Address
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                      placeholder="john@example.com"
                    />
                  </div>

                  {/* Course */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <BookOpen size={16} className="text-indigo-400" /> Course
                    </label>
                    <select
                      name="course"
                      required
                      value={formData.course}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all disabled:opacity-50 appearance-none"
                    >
                      <option value="" className={`bg-[var(--glass)]`}>Select Course</option>
                      {availableCourses.map(course => (
                        <option key={course.id} value={course.title} className={`bg-[var(--glass)]`}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Lock size={16} className="text-indigo-400" /> Password
                    </label>
                    <div className="relative">
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required={!editingStudent}
                        value={formData.password}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl pl-4 pr-12 py-3 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                        placeholder="••••••••"
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

                  {/* Joined Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Calendar size={16} className="text-indigo-400" /> Joined Date
                    </label>
                    <input
                      name="joinedDate"
                      type="date"
                      required
                      value={formData.joinedDate}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Calendar size={16} className="text-indigo-400" /> Course End Date
                    </label>
                    <input
                      name="endDate"
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                    />
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
                      {editingStudent ? 'Updating...' : 'Enrolling...'}
                    </>
                  ) : (editingStudent ? 'Update Student' : 'Enroll Student')}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="glass-card overflow-hidden border border-[var(--border)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-6 py-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">ID</th>
                <th className="px-6 py-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Student Details</th>
                <th className="px-6 py-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Course</th>
                <th className="px-6 py-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Password</th>
                <th className="px-6 py-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Joined Date</th>
                <th className="px-6 py-5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-right text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y bg-[var(--glass)] text-[var(--text-main)]`}>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-[var(--text-muted)] italic">
                    No students enrolled yet. Click "Add Student" to get started.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <motion.tr 
                    animate={{ opacity: 1 }}
                    key={student.id} 
                    className="hover:bg-[var(--glass)] transition-colors group"
                  >
                    <td className="px-6 py-5 font-mono text-indigo-400 text-sm">#{student.id.toString().padStart(3, '0')}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className={`font-semibold text-[var(--text-main)]`}>{student.name}</span>
                        <span className="text-[var(--text-muted)] text-sm">{student.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[var(--text-main)] font-medium">{student.course}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 group/pass">
                        <span className="text-indigo-400/80 font-mono text-sm">
                          {showPasswords[student.id] ? student.password : '••••••••'}
                        </span>
                        <button 
                          onClick={() => setShowPasswords(prev => ({ ...prev, [student.id]: !prev[student.id] }))}
                          className="opacity-0 group-hover/pass:opacity-100 p-1 hover:bg-[var(--glass)] rounded transition-all text-slate-500 hover:text-indigo-400"
                        >
                          {showPasswords[student.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-slate-400 text-sm">{student.joinedDate}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        {student.is_approved ? (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            Enrolled
                          </span>
                        ) : (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenEdit(student)}
                          className="p-2 text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors"
                          title="Edit Student"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(student.id)}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Delete Student"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Students;

