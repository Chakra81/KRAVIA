import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, CheckCircle, KeyRound, ShieldCheck, BookOpen } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api';

const StudentLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [tab, setTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState({
    login: false,
    signup: false,
    confirm: false,
    forgot: false
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  // Login
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Sign Up: step = 'form' | 'otp'
  const [signupStep, setSignupStep] = useState('form');
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', confirmPassword: '', course_id: '' });
  const [signupOtp, setSignupOtp] = useState('');
  const [courses, setCourses] = useState([]);

  // Forgot Password: step = 'email' | 'otp' | 'reset'
  const [forgotStep, setForgotStep] = useState('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  React.useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get(`${API}/list-courses/`);
        setCourses(res.data);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      }
    };
    fetchCourses();
  }, []);

  const msg = (type, text) => setMessage({ type, text });
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all disabled:opacity-50";

  const switchTab = (t) => {
    setTab(t);
    setMessage({ type: '', text: '' });
    setSignupStep('form');
    setForgotStep('email');
    setShowPass({ login: false, signup: false, confirm: false, forgot: false });
  };

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (!loginData.email || !loginData.password) { msg('error', 'Please fill in all fields.'); return; }
    
    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/student-login/`, loginData);
      const data = response.data;
      
      login({ 
        id: data.id,
        name: data.name, 
        email: data.email, 
        role: 'student',
        course: data.course
      });
      
      toast.success(`Welcome back, ${data.name}!`, {
        duration: 4000,
        icon: '🎓',
      });
      
      msg('success', `Welcome back, ${data.name}! Redirecting...`);
      setTimeout(() => {
        const from = location.state?.from?.pathname || '/home';
        navigate(from, { replace: true });
      }, 1200);
    } catch (err) {
      msg('error', err.response?.data?.error || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── SIGN UP: Step 1 — Send OTP ─────────────────────────────────────────────
  const handleSignupSendOtp = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (signupData.password !== signupData.confirmPassword) { msg('error', 'Passwords do not match.'); return; }
    if (signupData.password.length < 6) { msg('error', 'Password must be at least 6 characters.'); return; }
    setIsLoading(true);
    try {
      await axios.post(`${API}/send-otp/`, { 
        email: signupData.email, 
        role: 'student',
        password: signupData.password
      });
      msg('success', `OTP sent to ${signupData.email}. Check your inbox.`);
      setSignupStep('otp');
    } catch {
      msg('error', 'Failed to send OTP. Please check your email and try again.');
    } finally { setIsLoading(false); }
  };

  // ── SIGN UP: Step 2 — Verify OTP & Create Account ─────────────────────────
  const handleSignupVerifyOtp = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (!signupOtp.trim()) { msg('error', 'Please enter the OTP.'); return; }
    setIsLoading(true);
    try {
      const res = await axios.post(`${API}/verify-otp/`, { 
        email: signupData.email, 
        otp: signupOtp.trim(),
        name: signupData.name,
        course_id: signupData.course_id,
        password: signupData.password
      });
      if (res.status === 200) {
        if (res.data.is_approved) {
          // Admin-added student — auto login and redirect
          toast.success('Account verified! Logging you in...', { duration: 4000, icon: '🎉' });
          login({ 
            id: res.data.id,
            name: res.data.name || signupData.name, 
            email: res.data.email || signupData.email, 
            role: 'student',
            course: res.data.course
          });
          setTimeout(() => { 
            setSignupData({ name: '', email: '', password: '', confirmPassword: '', course_id: '' }); 
            setSignupOtp(''); 
            setSignupStep('form'); 
            navigate('/home', { replace: true });
          }, 1500);
        } else {
          // Self-registered student — pending admin approval
          toast.success('Registration successful!', { duration: 5000, icon: '✅' });
          msg('success', '🎉 Account created! Your enrollment is pending admin approval. You will be notified once approved.');
          setTimeout(() => { 
            setSignupData({ name: '', email: '', password: '', confirmPassword: '', course_id: '' }); 
            setSignupOtp(''); 
            setSignupStep('form');
            setTab('login');
          }, 4000);
        }
      }
    } catch (err) { msg('error', err.response?.data?.error || 'Invalid OTP. Please try again.'); }
    finally { setIsLoading(false); }
  };

  // ── FORGOT: Step 1 — Send OTP ─────────────────────────────────────────────
  const handleForgotSendOtp = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setIsLoading(true);
    try {
      await axios.post(`${API}/send-otp/`, { email: forgotEmail, role: 'student' });
      msg('success', `OTP sent to ${forgotEmail}.`);
      setForgotStep('otp');
    } catch { msg('error', 'No account found with this email or failed to send OTP.'); }
    finally { setIsLoading(false); }
  };

  // ── FORGOT: Step 2 — Verify OTP ───────────────────────────────────────────
  const handleForgotVerifyOtp = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setIsLoading(true);
    try {
      const res = await axios.post(`${API}/verify-otp/`, { email: forgotEmail, otp: forgotOtp.trim() });
      if (res.status === 200) { msg('success', 'OTP verified! Set your new password.'); setForgotStep('reset'); }
    } catch (err) { msg('error', err.response?.data?.error || 'Invalid OTP. Please try again.'); }
    finally { setIsLoading(false); }
  };

  // ── FORGOT: Step 3 — Reset Password ───────────────────────────────────────
  const handleForgotReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { msg('error', 'Password must be at least 6 characters.'); return; }
    setIsLoading(true);
    try {
      await axios.post(`${API}/reset-password/`, { email: forgotEmail, new_password: newPassword });
      msg('success', 'Password reset! Please log in.');
      setTimeout(() => { setForgotEmail(''); setForgotOtp(''); setNewPassword(''); setForgotStep('email'); switchTab('login'); }, 1500);
    } catch { msg('error', 'Failed to reset password. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const tabs = [
    { key: 'login', label: 'Log In' },
    { key: 'signup', label: 'Sign Up' },
    { key: 'forgot', label: 'Forgot Password' },
  ];

  const Spinner = () => <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />;

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <div className="bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

          {/* Header */}
          <div className="px-8 pt-6">
            <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs transition-colors mb-4">
              <ArrowLeft size={14} /> Back to Roles
            </Link>
            {/* KRAVIA Logo */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-violet-600/30 rounded-2xl blur-lg scale-110" />
                <img
                  src="/kravia-logo.png"
                  alt="KRAVIA"
                  className="relative w-16 h-16 object-contain drop-shadow-xl"
                />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">Student Portal</h1>
                <p className="text-slate-400 mt-0.5 text-sm">Access your learning dashboard</p>
              </div>
            </div>

            {/* Tab switcher */}
            <div className="flex bg-white/5 rounded-xl p-1 mb-4">
              {tabs.map(t => (
                <button key={t.key} onClick={() => switchTab(t.key)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tab === t.key ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <AnimatePresence mode="wait">
            {message.text && (
              <motion.div key={message.text} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`mx-8 mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2 font-medium ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                {message.type === 'success' ? <CheckCircle size={15} /> : null}
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="px-8 pb-8">
            <AnimatePresence mode="wait">

              {/* ── LOG IN ── */}
              {tab === 'login' && (
                <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-2"><Mail size={12} className="text-indigo-400" /> Email</label>
                    <input type="email" required value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} placeholder="you@example.com" disabled={isLoading} className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-2"><Lock size={12} className="text-indigo-400" /> Password</label>
                    <div className="relative">
                      <input type={showPass.login ? 'text' : 'password'} required value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} placeholder="••••••••" disabled={isLoading} className={inputClass + ' pr-12'} />
                      <button type="button" onClick={() => setShowPass(p => ({ ...p, login: !p.login }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showPass.login ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="text-right">
                      <button type="button" onClick={() => switchTab('forgot')} className="text-xs text-indigo-400 hover:text-indigo-300">Forgot password?</button>
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
                    {isLoading ? <Spinner /> : 'Log In'}
                  </motion.button>
                  <p className="text-center text-slate-500 text-xs">New here?{' '}<button type="button" onClick={() => switchTab('signup')} className="text-indigo-400 hover:underline font-medium">Create an account</button></p>
                </motion.form>
              )}

              {/* ── SIGN UP: Step 1 — Form ── */}
              {tab === 'signup' && signupStep === 'form' && (
                <motion.form key="signup-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSignupSendOtp} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-2"><User size={12} className="text-indigo-400" /> Full Name</label>
                    <input type="text" required value={signupData.name} onChange={e => setSignupData({ ...signupData, name: e.target.value })} placeholder="Your full name" disabled={isLoading} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-2"><Mail size={12} className="text-indigo-400" /> Email</label>
                    <input type="email" required value={signupData.email} onChange={e => setSignupData({ ...signupData, email: e.target.value })} placeholder="you@example.com" disabled={isLoading} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-2"><Lock size={12} className="text-indigo-400" /> Password</label>
                    <div className="relative">
                      <input type={showPass.signup ? 'text' : 'password'} required value={signupData.password} onChange={e => setSignupData({ ...signupData, password: e.target.value })} placeholder="Min. 6 characters" disabled={isLoading} className={inputClass + ' pr-12'} />
                      <button type="button" onClick={() => setShowPass(p => ({ ...p, signup: !p.signup }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">{showPass.signup ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-2"><Lock size={12} className="text-indigo-400" /> Confirm Password</label>
                    <div className="relative">
                      <input type={showPass.confirm ? 'text' : 'password'} required value={signupData.confirmPassword} onChange={e => setSignupData({ ...signupData, confirmPassword: e.target.value })} placeholder="Re-enter password" disabled={isLoading} className={inputClass + ' pr-12'} />
                      <button type="button" onClick={() => setShowPass(p => ({ ...p, confirm: !p.confirm }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">{showPass.confirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-2"><BookOpen size={12} className="text-indigo-400" /> Select Course</label>
                    <select 
                      required 
                      value={signupData.course_id} 
                      onChange={e => setSignupData({ ...signupData, course_id: e.target.value })} 
                      disabled={isLoading} 
                      className={inputClass}
                    >
                      <option value="">Choose your course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.title}</option>
                      ))}
                    </select>
                  </div>
                  <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
                    {isLoading ? <Spinner /> : 'Send OTP & Verify Email'}
                  </motion.button>
                  <p className="text-center text-slate-500 text-xs">Already have an account?{' '}<button type="button" onClick={() => switchTab('login')} className="text-indigo-400 hover:underline font-medium">Log in</button></p>
                </motion.form>
              )}

              {/* ── SIGN UP: Step 2 — OTP ── */}
              {tab === 'signup' && signupStep === 'otp' && (
                <motion.form key="signup-otp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} onSubmit={handleSignupVerifyOtp} className="space-y-5">
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <ShieldCheck size={20} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-300 text-sm">OTP sent to <span className="text-white font-semibold">{signupData.email}</span>. Enter it below to verify and create your account.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Enter OTP</label>
                    <input type="text" required maxLength={6} value={signupOtp} onChange={e => setSignupOtp(e.target.value.replace(/\D/g, ''))} placeholder="6-digit OTP" disabled={isLoading} className={inputClass + ' text-center text-2xl tracking-[0.5em] font-bold'} />
                  </div>
                  <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50">
                    {isLoading ? <Spinner /> : <><CheckCircle size={18} /> Verify & Create Account</>}
                  </motion.button>
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => { setSignupStep('form'); setMessage({ type: '', text: '' }); }} className="text-slate-400 hover:text-white text-sm transition-colors">← Back to edit details</button>
                    <button type="button" disabled={isLoading} onClick={async () => {
                      setMessage({ type: '', text: '' });
                      setSignupOtp('');
                      setIsLoading(true);
                      try {
                        await axios.post(`${API}/send-otp/`, { email: signupData.email, role: 'student', password: signupData.password });
                        msg('success', 'New OTP sent! Check your email.');
                      } catch { msg('error', 'Failed to resend OTP. Please try again.'); }
                      finally { setIsLoading(false); }
                    }} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors disabled:opacity-50">Resend OTP</button>
                  </div>
                </motion.form>
              )}

              {/* ── FORGOT: Step 1 — Email ── */}
              {tab === 'forgot' && forgotStep === 'email' && (
                <motion.form key="forgot-email" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} onSubmit={handleForgotSendOtp} className="space-y-5">
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <KeyRound size={20} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-300 text-sm">Enter your registered email and we'll send you an OTP to reset your password.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2"><Mail size={14} className="text-indigo-400" /> Email</label>
                    <input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="you@example.com" disabled={isLoading} className={inputClass} />
                  </div>
                  <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50">
                    {isLoading ? <Spinner /> : 'Send OTP'}
                  </motion.button>
                  <p className="text-center text-slate-500 text-sm">Remembered it?{' '}<button type="button" onClick={() => switchTab('login')} className="text-indigo-400 hover:underline font-medium">Back to Log In</button></p>
                </motion.form>
              )}

              {/* ── FORGOT: Step 2 — OTP ── */}
              {tab === 'forgot' && forgotStep === 'otp' && (
                <motion.form key="forgot-otp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} onSubmit={handleForgotVerifyOtp} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">OTP sent to <span className="text-indigo-400">{forgotEmail}</span></label>
                    <input type="text" required maxLength={6} value={forgotOtp} onChange={e => setForgotOtp(e.target.value.replace(/\D/g, ''))} placeholder="6-digit OTP" disabled={isLoading} className={inputClass + ' text-center text-2xl tracking-[0.5em] font-bold'} />
                  </div>
                  <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50">
                    {isLoading ? <Spinner /> : 'Verify OTP'}
                  </motion.button>
                </motion.form>
              )}

              {/* ── FORGOT: Step 3 — New Password ── */}
              {tab === 'forgot' && forgotStep === 'reset' && (
                <motion.form key="forgot-reset" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} onSubmit={handleForgotReset} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2"><Lock size={14} className="text-indigo-400" /> New Password</label>
                    <div className="relative">
                      <input type={showPass.forgot ? 'text' : 'password'} required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 characters" disabled={isLoading} className={inputClass + ' pr-12'} />
                      <button type="button" onClick={() => setShowPass(p => ({ ...p, forgot: !p.forgot }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">{showPass.forgot ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                    {isLoading ? <Spinner /> : <><ShieldCheck size={18} /> Reset Password</>}
                  </motion.button>
                </motion.form>
              )}

            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StudentLogin;
