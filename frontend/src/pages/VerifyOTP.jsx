import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const VerifyOTP = () => {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { email, role, name, password } = location.state || {};
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/');
    }
  }, [email, navigate]);

  useEffect(() => {
    let interval = null;
    if (timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer, canResend]);

  const handleResend = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      const response = await axios.post(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/send-otp/`, {
        email,
        role,       // pass role so backend can store it
        password    // pass password for trainer validation
      });

      if (response.status === 200 || response.status === 201) {
        toast.success('OTP resent successfully! Check your inbox.');
        setTimer(30);
        setCanResend(false);
      }
    } catch (error) {
      console.error('Resend error:', error);
      const errMsg = error.response?.data?.error || 'Failed to resend OTP. Please try again.';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.nextSibling && element.value !== '') {
      element.nextSibling.focus();
    }
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  const otpValue = otp.join('');

  if (otpValue.length !== 6) {
    toast.error('Enter 6-digit OTP');
    return;
  }

  setIsLoading(true);

  try {
    const response = await axios.post(
      `${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/verify-otp/`,
      {
        email,
        otp: otpValue,
        password: location.state?.password
      }
    );

      if (response.status === 200) {
        toast.success('Login Successful!', {
          duration: 4000,
          icon: '🎉',
        });
        
        // Use role from URL state (user's explicit choice) as the source of truth
        const finalRole = role || response.data.role || 'student';

        // Store user info in context
        login({
            email: response.data.email || email,
            role: finalRole,
            name: name || response.data.name
        });

        setTimeout(() => {
          const from = location.state?.from?.pathname || '/home';
          navigate(from, { replace: true });
        }, 1500);
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      const errMsg = error.response?.data?.error || 'Invalid OTP. Please try again.';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
};

  return (
    <div className="login-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card login-form"
        style={{ maxWidth: '450px' }}
      >
        <Link to={`/login/${role}`} className="back-link">
          <ArrowLeft size={18} />
          <span>Back to Login</span>
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-400 border border-indigo-500/20 shadow-xl shadow-indigo-500/10">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Verify OTP</h2>
          <p className="text-slate-400">We've sent a 6-digit code to <br /><span className="text-indigo-400 font-semibold">{email}</span></p>
        </div>


        <form onSubmit={handleSubmit}>
          <div className="flex gap-2 sm:gap-3 justify-center mb-10">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={data}
                onChange={e => handleChange(e.target, index)}
                onFocus={e => e.target.select()}
                className="w-9 h-11 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50"
                disabled={isLoading}
              />
            ))}
          </div>

          <motion.button 
            whileHover={{ scale: isLoading ? 1 : 1.01 }}
            whileTap={{ scale: isLoading ? 1 : 0.99 }}
            type="submit" 
            className="login-btn flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </>
            ) : 'Verify OTP'}
          </motion.button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          Didn't receive the code?{' '}
          <button 
            onClick={handleResend}
            disabled={!canResend || isLoading}
            className={`font-semibold transition-all ${
              canResend ? 'text-indigo-400 hover:underline cursor-pointer' : 'text-slate-600 cursor-not-allowed'
            } bg-transparent border-none p-0`}
          >
            {canResend ? 'Resend OTP' : `Resend OTP in ${timer}s`}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOTP;
