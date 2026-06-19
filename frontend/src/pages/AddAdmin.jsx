import React, { useState } from 'react';
import { ShieldAlert, UserPlus, Mail, Lock, User, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const API = `http://${window.location.hostname}:8000/api`;

const AddAdmin = () => {
  const { user } = useAuth();
  useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('All fields are required');
      return;
    }

    setIsSubmitting(true);
    
    try {
        const response = await axios.post(`${API}/add-admin/`, {
            ...formData, 
            requester_email: user.email 
        });

        if (response.status === 201 || response.status === 200) {
            toast.success('Admin account created successfully!');
            setSubmitted(true);
            setFormData({ name: '', email: '', password: '' });
        }
    } catch (err) {
        const errorMsg = err.response?.data?.error || 'Failed to create admin';
        toast.error(errorMsg);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 min-h-screen relative flex items-center justify-center">
      <div className={`absolute inset-0 backdrop-blur-sm -z-10 bg-[var(--glass)]`} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card w-full max-w-xl overflow-hidden border border-white/10 shadow-2xl"
      >
        <div className={`p-6 flex justify-between items-center border-b bg-[var(--glass)] border border-[var(--border)]`}>
          <h1 className={`text-2xl font-bold flex items-center gap-3 text-[var(--text-main)]`}>
            <ShieldAlert className="text-indigo-400" size={28} />
            System Administration
          </h1>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="text-emerald-500" size={48} />
                </div>
                <h2 className={`text-2xl font-bold text-[var(--text-main)]`}>Success!</h2>
                <p className="text-[var(--text-muted)] mt-2">The new admin account has been registered.</p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="mt-8 text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                >
                  Add Another Admin
                </button>
              </motion.div>
            ) : (
              <motion.form 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit} 
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <User size={16} className="text-indigo-400" /> Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    placeholder="Enter admin name"
                    className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Mail size={16} className="text-indigo-400" /> Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    placeholder="admin@kravia.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Lock size={16} className="text-indigo-400" /> Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
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

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <UserPlus size={20} />
                  )}
                  Create Admin Account
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default AddAdmin;
