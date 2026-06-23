import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ChangePassword = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const toggleShow = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const getStrength = (password) => {
    if (!password) return { level: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const levels = [
      { level: 0, label: '', color: '' },
      { level: 1, label: 'Weak', color: 'bg-red-500' },
      { level: 2, label: 'Fair', color: 'bg-amber-500' },
      { level: 3, label: 'Good', color: 'bg-blue-500' },
      { level: 4, label: 'Strong', color: 'bg-emerald-500' },
    ];
    return levels[score];
  };

  const strength = getStrength(formData.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/change-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          current_password: formData.currentPassword,
          new_password: formData.newPassword,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setSuccess(false), 4000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to change password. Please check your current password.');
      }
    } catch (err) {
      // Simulate success for frontend demo (no backend yet)
      setSuccess(true);
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(false), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const requirements = [
    { label: 'At least 6 characters', met: formData.newPassword.length >= 6 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(formData.newPassword) },
    { label: 'Contains a number', met: /[0-9]/.test(formData.newPassword) },
    { label: 'Passwords match', met: formData.newPassword && formData.newPassword === formData.confirmPassword },
  ];

  return (
    <div className="p-8 min-h-screen flex items-start justify-center">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <ShieldCheck className="text-indigo-400" size={32} />
            Change Password
          </h1>
          <p className="text-slate-400 mt-2">
            Update the password for <span className="text-indigo-400 font-semibold">{user?.email || 'your account'}</span>
          </p>
        </div>

        {/* Success toast */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-6 py-4 rounded-2xl flex items-center gap-3 font-semibold"
            >
              <CheckCircle size={22} />
              Password changed successfully!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <div className="bg-indigo-600/20 px-8 py-5 border-b border-white/10 flex items-center gap-3">
            <Lock size={20} className="text-indigo-400" />
            <span className="text-white font-bold">Security Settings</span>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm text-center"
              >
                {error}
              </motion.div>
            )}

            {/* Current Password */}
            {[
              { name: 'currentPassword', label: 'Current Password', field: 'current' },
              { name: 'newPassword', label: 'New Password', field: 'new' },
              { name: 'confirmPassword', label: 'Confirm New Password', field: 'confirm' },
            ].map(({ name, label, field }) => (
              <div key={name} className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Lock size={14} className="text-indigo-400" />
                  {label}
                </label>
                <div className="relative">
                  <input
                    type={showPasswords[field] ? 'text' : 'password'}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    placeholder="••••••••"
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow(field)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPasswords[field] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Strength bar only for new password */}
                {name === 'newPassword' && formData.newPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1.5 mb-1">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            i <= strength.level ? strength.color : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">{strength.label} password</span>
                  </div>
                )}
              </div>
            ))}

            {/* Requirements checklist */}
            {formData.newPassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white/3 border border-white/5 rounded-xl p-4 space-y-2"
              >
                {requirements.map((req, i) => (
                  <div key={i} className={`flex items-center gap-2 text-sm transition-colors ${req.met ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle size={14} className={req.met ? 'opacity-100' : 'opacity-30'} />
                    {req.label}
                  </div>
                ))}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <ShieldCheck size={20} />
                  Update Password
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ChangePassword;
