import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  ShieldCheck, 
  GraduationCap, 
  Presentation, 
  ArrowRight, 
  Zap,
  Globe,
  Layout,
  Cpu,
} from 'lucide-react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Interactive 3D Card Component
const InteractiveCard = ({ role, from }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const Icon = role.icon;

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: role.index * 0.1, type: 'spring', stiffness: 100 }}
      className="relative group h-full"
    >
      <Link 
        to={`/login/${role.role}`} 
        state={{ from: from ? { pathname: from } : null }}
        className="block h-full no-underline"
      >
        <div className="h-full bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 flex flex-col transition-all duration-500 group-hover:bg-slate-800/80 group-hover:border-white/30 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] relative overflow-hidden">
          {/* Animated Glowing Border */}
          <div className={`absolute -inset-[2px] bg-gradient-to-r ${role.color} rounded-[3rem] opacity-0 group-hover:opacity-100 blur-[2px] transition-opacity duration-500 -z-10`} />
          
          <div style={{ transform: "translateZ(50px)" }} className="relative z-10">
            <div className={`w-20 h-20 rounded-[1.5rem] bg-gradient-to-br ${role.color} flex items-center justify-center text-white mb-8 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
              <Icon size={40} strokeWidth={2} />
            </div>

            <h3 className="text-3xl font-black text-white mb-4 tracking-tight">
              {role.title}
            </h3>
            
            <p className="text-slate-400 text-base leading-relaxed mb-10 opacity-80 group-hover:opacity-100 transition-opacity">
              {role.description}
            </p>

            <div className="grid grid-cols-1 gap-4 mb-10">
              {role.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm font-bold text-slate-500 group-hover:text-white transition-colors duration-300">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${role.color} shadow-[0_0_10px_rgba(255,255,255,0.3)]`} />
                  {feature}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-auto pt-8 border-t border-white/5">
              <span className="text-lg font-black text-white flex items-center gap-2 group-hover:gap-4 transition-all">
                Enter Portal <ArrowRight size={20} className="text-indigo-400 group-hover:translate-x-2 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const Home = () => {
  const location = useLocation();
  const { user } = useAuth();
  const from = location.pathname !== '/login' ? location.pathname : null;

  if (user) {
    return <Navigate to="/home" replace />;
  }

  const roles = [
    {
      role: 'admin',
      title: 'Admin',
      icon: ShieldCheck,
      description: 'Master control center for institutional operations and strategic planning.',
      color: 'from-amber-400 to-rose-600',
      features: ['Advanced Analytics', 'Global User Mgmt', 'System Security'],
      index: 0
    },
    {
      role: 'student',
      title: 'Student',
      icon: GraduationCap,
      description: 'Immersive learning environment designed for maximum skill acquisition.',
      color: 'from-blue-400 to-indigo-700',
      features: ['Interactive Courses', 'Live Mentorship', 'Smart Progress'],
      index: 1
    },
    {
      role: 'trainer',
      title: 'Trainer',
      icon: Presentation,
      description: 'Professional workspace for educators to inspire and shape future talent.',
      color: 'from-emerald-400 to-cyan-600',
      features: ['Curriculum Studio', 'AI Assessment', 'Student Insights'],
      index: 2
    },
  ];

  const highlights = [
    { icon: <Zap size={14} />, text: 'Real-time Sync' },
    { icon: <Globe size={14} />, text: 'Global Access' },
    { icon: <Cpu size={14} />, text: 'AI Driven' },
    { icon: <Layout size={14} />, text: 'Intuitive UX' },
  ];

  return (
    <div className="min-h-screen bg-[#010409] relative overflow-hidden flex flex-col items-center py-20 px-6">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <div className="w-full max-w-7xl mx-auto relative z-10">
        {/* Top Navbar Style Header */}
        <div className="flex justify-between items-center mb-24 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-8 py-3 max-w-fit mx-auto shadow-2xl">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
              {/* KRAVIA Logo Mark */}
              <div className="relative w-11 h-11 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-indigo-500 rounded-xl shadow-lg shadow-violet-500/40" />
                <span className="relative text-white font-black text-xl leading-none" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.04em' }}>K</span>
              </div>
              {/* KRAVIA Wordmark */}
              <span className="font-black text-xl tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                <span className="text-white">KRA</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">VIA</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              {highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <span className="text-indigo-400">{h.icon}</span>
                  {h.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        <header className="text-center mb-24">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl md:text-8xl font-black mb-8 tracking-tighter text-white leading-[0.9]"
          >
            THE FUTURE OF <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-emerald-400 animate-gradient">LEARNING</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-xl md:text-2xl max-w-3xl mx-auto font-medium leading-relaxed"
          >
            A high-performance ecosystem engineered for modern education. <br /> Choose your specialized gateway to begin.
          </motion.p>
        </header>
  
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-32 perspective-1000">
          {roles.map((role) => (
            <InteractiveCard key={role.role} role={role} from={from} />
          ))}
        </div>

        {/* Dynamic Platform Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-32">
          {[
            { label: 'Active Sessions', value: '1,248', color: 'text-emerald-400' },
            { label: 'Cloud Latency', value: '12ms', color: 'text-indigo-400' },
            { label: 'Uptime', value: '99.99%', color: 'text-amber-400' },
            { label: 'Support Ready', value: '24/7', color: 'text-rose-400' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + (i * 0.1) }}
              className="bg-white/5 border border-white/5 rounded-3xl p-6 text-center backdrop-blur-sm hover:bg-white/10 transition-colors"
            >
              <p className={`text-2xl font-black mb-1 ${stat.color}`}>{stat.value}</p>
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</p>
            </motion.div>
          ))}
        </div>
  
        <footer className="text-center pb-10 border-t border-white/5 pt-20">
          <div className="flex flex-wrap justify-center gap-10 mb-8">
            {['Architecture', 'Security', 'Enterprise', 'Compliance', 'Roadmap'].map(link => (
              <a key={link} href="#!" className="text-slate-500 hover:text-white text-[11px] transition-all font-black uppercase tracking-widest">{link}</a>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 text-slate-700 text-[10px] font-black uppercase tracking-[0.3em]">
            <span>&copy; 2026 KRAVIA PLATFORM</span>
            <div className="w-1 h-1 rounded-full bg-slate-800" />
            <span>VERSION 4.2.0-STABLE</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;
