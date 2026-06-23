import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, KeyRound, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const ForgotPassword = () => {
  const [step, setStep] = useState('email'); // email | otp | reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  React.useEffect(() => {
    let interval = null;
    if (step === 'otp' && timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer, canResend, step]);

  const handleResendOtp = async () => {
    if (!canResend) return;
    setIsLoading(true);
    try {
      const response = await axios.post(`https://kravia.onrender.com/api/send-otp/`, { email, role: 'admin' });
      if (response.status === 200) {
        msg('success', 'OTP resent to your email.');
        setTimer(60);
        setCanResend(false);
      }
    } catch (err) {
      msg('error', 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value !== '' && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const msg = (type, text) => setMessage({ type, text });

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    msg('', '');
    try {
      const response = await axios.post(`https://kravia.onrender.com/api/send-otp/`, { email, role: 'admin' });
      if (response.status === 200) {
        msg('success', 'OTP sent to your email.');
        setStep('otp');
      }
    } catch (err) {
      msg('error', err.response?.data?.error || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      msg('error', 'Please enter 6-digit OTP.');
      return;
    }
    setIsLoading(true);
    msg('', '');
    try {
      const response = await axios.post(`https://kravia.onrender.com/api/verify-otp/`, { email, otp: otpValue });
      if (response.status === 200) {
        msg('success', 'OTP verified. Now set your new password.');
        setStep('reset');
      }
    } catch (err) {
      msg('error', 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      msg('error', 'Password must be at least 6 characters.');
      return;
    }
    setIsLoading(true);
    msg('', '');
    try {
      const response = await axios.post(`https://kravia.onrender.com/api/reset-password/`, { email, otp: otp.join(''), new_password: newPassword });
      if (response.status === 200) {
        msg('success', 'Password reset successful! Redirecting to login...');
        setTimeout(() => navigate('/login/admin'), 2000);
      }
    } catch (err) {
      msg('error', 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl"
      >
        <Link to="/login/admin" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs transition-colors mb-4">
          <ArrowLeft size={14} /> Back to Login
        </Link>

        <div className="text-center mb-6">
          <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/20">
            <KeyRound size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Reset Password</h2>
          <p className="text-slate-400 text-sm">Recover your admin account</p>
        </div>

        {message.text && (
          <div className={`px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2 font-medium ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
            {message.type === 'success' ? <CheckCircle size={15} /> : null}
            {message.text}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 'email' && (
            <motion.form key="email" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 ml-1 flex items-center gap-2"><Mail size={12} className="text-indigo-400" /> Email Address</label>
                <input type="email" required placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm">
                {isLoading ? 'Sending...' : 'Send Reset OTP'}
              </button>
            </motion.form>
          )}

          {step === 'otp' && (
            <motion.form key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-300 ml-1 block text-center">Enter 6-digit OTP</label>
                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!canResend || isLoading}
                  className={`text-sm font-medium transition-colors ${canResend ? 'text-indigo-400 hover:text-indigo-300 cursor-pointer' : 'text-slate-500 cursor-not-allowed'}`}
                >
                  {canResend ? 'Resend OTP' : `Resend OTP in ${timer}s`}
                </button>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button type="button" onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); setTimer(60); setCanResend(false); }} className="w-full text-slate-500 hover:text-white text-sm text-center">Use a different email</button>
            </motion.form>
          )}

          {step === 'reset' && (
            <motion.form key="reset" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1 flex items-center gap-2"><Lock size={14} className="text-indigo-400" /> New Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required placeholder="Min. 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass + " pr-12"} />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
