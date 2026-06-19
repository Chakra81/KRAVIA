import React from 'react';
import { LayoutDashboard, Video, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const IntellMeetNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logout Successfully!');
  };

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/intell-dashboard' },
    { name: 'Meeting', icon: <Video size={18} />, path: '/meeting-room' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border)] px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div
          className="flex items-center gap-3 group cursor-pointer select-none"
          onClick={() => navigate('/home')}
        >
          {/* KRAVIA Logo Mark */}
          <div className="relative w-12 h-12 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-500 to-blue-500 rounded-[12px] shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow duration-300" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-[12px]" />
            <span
              className="relative text-white font-black text-2xl leading-none"
              style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.04em', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
            >
              K
            </span>
          </div>

          {/* KRAVIA Wordmark */}
          <div className="flex flex-col leading-none">
            <span
              className="font-black text-2xl tracking-tight"
              style={{ letterSpacing: '-0.03em' }}
            >
              <span className="text-white">KRA</span>
              <span
                className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400"
              >
                VIA
              </span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mt-0.5">Platform</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 mr-4 bg-[var(--glass)] px-4 py-2 rounded-full border border-[var(--border)]">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-xs font-medium text-[var(--text-muted)]">System Online</span>
          </div>

          <div className="flex items-center gap-2 p-1 bg-[var(--glass)] rounded-2xl border border-[var(--border)]">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  location.pathname === item.path
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-hover)]'
                }`}
              >
                {item.icon}
                {item.name}
              </button>
            ))}
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all ml-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-[var(--border)] ml-2">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-[var(--text-main)]">{user?.name || 'Admin'}</span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">{user?.role || 'User'}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[var(--glass)] border border-[var(--border)] flex items-center justify-center text-[var(--text-main)] font-bold">
              {user?.name?.[0] || 'A'}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default IntellMeetNavbar;
