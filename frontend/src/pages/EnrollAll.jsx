import React, { useState, useEffect } from 'react';
import { UserPlus, Search, CheckCircle, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const EnrollAll = () => {
  useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState([]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/list-students/`);
      setStudents(response.data);
    } catch (err) {
      toast.error('Failed to fetch students');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleEnrollAll = async () => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/approve-all-students/`);
      if (response.status === 200) {
        toast.success('All pending students enrolled successfully!');
        fetchStudents();
      }
    } catch (err) {
      toast.error('Failed to enroll all students');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnroll = async (id) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/approve-student/${id}/`);
      if (response.status === 200) {
        toast.success('Student enrolled successfully!');
        fetchStudents();
      }
    } catch (err) {
      toast.error('Failed to enroll student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = students.filter(s => !s.is_approved).length;

  return (
    <div className="p-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-end mb-8 gap-4 flex-wrap">
            <div>
                <h1 className="text-3xl font-bold gradient-text">Bulk Enrollment</h1>
                <p className="text-[var(--text-muted)] mt-1">Approve pending student enrollments with one click</p>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search..."
                        className="bg-[var(--glass)] border border-[var(--border)] rounded-xl pl-12 pr-4 py-3 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/50 outline-none w-48 transition-all"
                    />
                </div>
                
                <button
                    onClick={handleEnrollAll}
                    disabled={pendingCount === 0 || isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all whitespace-nowrap"
                >
                    <CheckCircle size={20} />
                    Enroll All Students
                </button>
            </div>
        </div>

        <div className="glass-card overflow-hidden border border-[var(--border)] shadow-2xl">
          <div className="bg-[var(--glass)] px-8 py-5 border-b border-[var(--border)] flex justify-between items-center">
            <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                Pending Queue
            </span>
            <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500 font-medium">
                    {pendingCount} Pending Approval
                </span>
                <button onClick={fetchStudents} className="text-slate-400 hover:text-white transition-colors">
                    <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </div>
          </div>
          
          <div className="p-4 grid gap-3">
            <AnimatePresence mode="popLayout">
                {isLoading ? (
                    <div className="text-center py-20 text-slate-500">
                        Loading students...
                    </div>
                ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                        <motion.div 
                            layout
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            key={student.id} 
                            className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                                student.is_approved 
                                ? 'bg-emerald-500/5 border-emerald-500/20' 
                                : 'bg-white/5 border-white/5 hover:border-white/20'
                            }`}
                        >
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg transition-colors duration-500 ${
                                    student.is_approved ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'
                                }`}>
                                    {student.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className={`font-bold text-lg text-[var(--text-main)]`}>{student.name}</h3>
                                    <div className="flex items-center gap-3 mt-1 text-sm">
                                        <span className="text-indigo-400 font-medium">{student.course}</span>
                                        <span className={`w-1 h-1 rounded-full bg-[var(--glass)] text-[var(--text-main)]`} />
                                        <span className="text-[var(--text-muted)]">{student.email}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleEnroll(student.id)}
                                disabled={student.is_approved || isSubmitting}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                                student.is_approved
                                    ? 'bg-emerald-500/10 text-emerald-400 cursor-default border border-emerald-500/20'
                                    : 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white'
                                }`}
                            >
                                {student.is_approved ? (
                                <>
                                    <CheckCircle size={18} />
                                    Approved
                                </>
                                ) : (
                                <>
                                    <UserPlus size={18} />
                                    Approve
                                </>
                                )}
                            </button>
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-20 text-slate-500">
                        No students found.
                    </div>
                )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollAll;
