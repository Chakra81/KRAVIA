import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const TrainerLogin = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`https://kravia.onrender.com/api/trainer-login-direct/`, {
        email,
        password
      });

      if (response.data.require_otp) {
        // First login, send OTP
        const otpResponse = await axios.post(`https://kravia.onrender.com/api/send-otp/`, {
          email,
          role: 'trainer',
          password
        });
        
        if (otpResponse.status === 200 || otpResponse.status === 201) {
          navigate('/verify-otp', { state: { email, role: 'trainer', password } });
        } else {
          setError('Failed to send OTP. Please try again.');
        }
      } else {
        // Direct login success
        login({
          email: response.data.email || email,
          role: response.data.role || 'trainer',
          name: response.data.name
        });
        toast.success('Login Successful!', { icon: '🎉' });
        navigate('/home');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Something went wrong. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl"
      >
        <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-[10px] transition-colors mb-3">
          <ArrowLeft size={12} /> Back to Roles
        </Link>

        <div className="text-center mb-5">
          {/* KRAVIA Logo */}
          <div className="flex flex-col items-center mb-3">
            <div className="relative mb-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-violet-600/30 rounded-3xl blur-xl scale-110" />
              <img
                src="/kravia-logo.png"
                alt="KRAVIA"
                className="relative w-20 h-20 object-contain drop-shadow-2xl"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-px w-6 bg-gradient-to-r from-transparent to-emerald-500/50" />
              <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-500">Trainer Portal</span>
              <div className="h-px w-6 bg-gradient-to-l from-transparent to-emerald-500/50" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-0.5">Trainer Login</h2>
          <p className="text-slate-400 text-[11px]">Access your training dashboard</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 ml-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="email" 
                placeholder="trainer@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 ml-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-11 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
          >
            {isLoading ? 'Signing in...' : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default TrainerLogin;
