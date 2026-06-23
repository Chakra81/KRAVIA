import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';
import { 
  BookOpen, 
  Users, 
  UserPlus, 
  ShieldCheck, 
  MessageSquare, 
  LogOut,
  AlertCircle,
  Award,
  Sparkles,
  Video,
  Tv,
  ClipboardList,
  GraduationCap,
  Briefcase,
  FileText,
  Compass,
  IndianRupee,
  Bell,
  Menu,
  X
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [pendingStudents, setPendingStudents] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchCounts = async () => {
      try {
        const response = await axios.get(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/unread-counts/`, {
          params: { user_email: user.email }
        });
        const counts = response.data;
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        setTotalUnread(total);
      } catch (err) {
        console.error('Failed to fetch sidebar unread counts:', err);
      }

      // Fetch unread notification count
      try {
        const notifRes = await axios.get(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/notifications/`, {
          params: { email: user.email }
        });
        const notifs = notifRes.data?.notifications || notifRes.data || [];
        const unread = Array.isArray(notifs) ? notifs.filter(n => !n.is_read).length : 0;
        setUnreadNotifCount(unread);
      } catch (err) {
        // silently fail
      }

      if (user.role === 'admin') {
        try {
          const response = await axios.get(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/list-students/`);
          const pending = response.data.filter(s => !s.is_approved).length;
          setPendingStudents(pending);
        } catch (err) {
          console.error('Failed to fetch pending students:', err);
        }
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const adminMenu = [
    { name: 'Courses', icon: <BookOpen size={20} />, path: '/courses' },
    { name: 'Students', icon: <Users size={20} />, path: '/students' },
    { name: 'Trainers', icon: <GraduationCap size={20} />, path: '/trainers' },
    { name: 'Assign Trainers', icon: <Briefcase size={20} />, path: '/assign-trainers' },
    { name: 'Enroll All Students', icon: <UserPlus size={20} />, path: '/enroll' },
    { name: 'Add Admin', icon: <ShieldCheck size={20} />, path: '/add-admin' },
    { name: 'Live Classes', icon: <Video size={20} />, path: '/live-sessions' },
    { name: 'Online Exams', icon: <Award size={20} />, path: '/exams' },
    { name: 'Attendance Analytics', icon: <ClipboardList size={20} />, path: '/attendance-analytics' },
    { name: 'Fee Management', icon: <IndianRupee size={20} />, path: '/fees' },
    { name: 'Certificates', icon: <Award size={20} />, path: '/certificates' },
    { name: 'Placement', icon: <Briefcase size={20} />, path: '/placements' },
    { name: 'Chat with User', icon: <MessageSquare size={20} />, path: '/chat' },
    { name: 'Notifications', icon: <Bell size={20} />, path: '/notifications' },
  ];

  const studentMenu = [
    { name: 'Home', icon: <Users size={20} />, path: '/home' },
    { name: 'Courses', icon: <BookOpen size={20} />, path: '/courses' },
    { name: 'Study Planner', icon: <Compass size={20} />, path: '/study-planner' },
    { name: 'Online Exams', icon: <Award size={20} />, path: '/exams' },
    { name: 'Assignments', icon: <FileText size={20} />, path: '/assignments' },
    { name: 'My Fees', icon: <IndianRupee size={20} />, path: '/fees' },
    { name: 'Certificates', icon: <Award size={20} />, path: '/certificates' },
    { name: 'Live Classes', icon: <Video size={20} />, path: '/live-sessions' },
    { name: 'Recordings', icon: <Tv size={20} />, path: '/recordings' },
    { name: 'Resume Builder', icon: <FileText size={20} />, path: '/resume-builder' },
    { name: 'Messages', icon: <MessageSquare size={20} />, path: '/chat' },
    { name: 'Notifications', icon: <Bell size={20} />, path: '/notifications' },
    { name: 'Change Password', icon: <ShieldCheck size={20} />, path: '/change-password' },
  ];

  const trainerMenu = [
    { name: 'Dashboard', icon: <Briefcase size={20} />, path: '/home' },
    { name: 'Analytics', icon: <Sparkles size={20} />, path: '/trainer-analytics' },
    { name: 'Assignments', icon: <FileText size={20} />, path: '/assignments' },
    { name: 'Live Classes', icon: <Video size={20} />, path: '/live-sessions' },
    { name: 'Online Exams', icon: <Award size={20} />, path: '/exams' },
    { name: 'Recordings', icon: <Tv size={20} />, path: '/recordings' },
    { name: 'Attendance', icon: <ClipboardList size={20} />, path: '/attendance-analytics' },
    { name: 'Messages', icon: <MessageSquare size={20} />, path: '/chat' },
    { name: 'Notifications', icon: <Bell size={20} />, path: '/notifications' },
  ];

  const menuItems = user?.role === 'admin' ? adminMenu : user?.role === 'trainer' ? trainerMenu : studentMenu;

  const handleLogout = () => {
    logout();
    setShowConfirm(false);
    toast.success('Logout Successfully!');
    navigate('/'); 
  };

  return (
    <>
      {/* Hamburger Toggle Button for Mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-[60] p-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-main)] shadow-xl lg:hidden hover:bg-[var(--glass-hover)] active:scale-95 transition-all flex items-center justify-center"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay Backdrop for Mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className={`fixed left-0 top-0 h-screen w-64 bg-[var(--bg-card)] flex flex-col border-r border-[var(--border)] shadow-xl z-50 transition-all duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={`p-6 flex flex-col items-center border-b border-[var(--border)] flex-shrink-0`}>
          <div className="w-full flex justify-between items-center mb-4">
            <NavLink
              to="/home"
              onClick={() => setIsOpen(false)}
              className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-inner overflow-hidden border border-indigo-100 hover:ring-2 hover:ring-[var(--primary)] transition-all cursor-pointer"
              title="Go to Dashboard"
            >
              <img src="/logo.png" alt="Kravia Logo" className="w-10 h-10 object-contain" />
            </NavLink>
            <ThemeToggle />
          </div>
          <NavLink
            to="/home"
            onClick={() => setIsOpen(false)}
            className="text-2xl font-black tracking-tight w-full text-[var(--text-main)] hover:text-[var(--primary)] transition-colors cursor-pointer"
          >
            KRAVIA
          </NavLink>
        </div>

        <nav className="flex-1 mt-6 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-6 py-4 transition-all duration-300 gap-4 ${
                  isActive 
                    ? 'bg-[var(--glass)] text-[var(--primary)] border-l-4 border-[var(--primary)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--glass)] hover:text-[var(--text-main)]'
                }`
              }
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
              {(item.name === 'Chat with User' || item.name === 'Messages') && totalUnread > 0 && (
                <span className="ml-auto bg-red-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-lg border border-red-400/20 animate-pulse">
                  {totalUnread}
                </span>
              )}
              {item.name === 'Notifications' && unreadNotifCount > 0 && (
                <span className="ml-auto bg-rose-500 text-white font-bold text-[10px] min-w-[18px] text-center px-1.5 py-0.5 rounded-full shadow-lg shadow-rose-500/30 border border-rose-400/20 animate-pulse">
                  {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                </span>
              )}
              {item.name === 'Enroll All Students' && pendingStudents > 0 && (
                <span className="ml-auto bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-lg border border-amber-400/20 animate-pulse">
                  {pendingStudents}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={`p-4 mt-auto border-t border-[var(--border)] flex-shrink-0`}>
          <button 
            onClick={() => { setIsOpen(false); setShowConfirm(true); }}
            className={`flex items-center gap-4 px-6 py-4 w-full transition-all duration-300 rounded-lg group text-[var(--text-muted)] hover:bg-[var(--glass)] hover:text-[var(--text-main)]`}
          >
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform text-rose-500" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className={`absolute inset-0 backdrop-blur-md bg-[var(--bg-dark)] opacity-60`}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-sm overflow-hidden relative z-10 border border-[var(--border)] shadow-2xl"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
                  <AlertCircle className="text-rose-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">Confirm Logout</h3>
                <p className="text-[var(--text-muted)]">Are you sure you want to logout?</p>
                
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <button 
                    onClick={() => setShowConfirm(false)}
                    className="px-6 py-3 rounded-xl border border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--glass-hover)] transition-all font-semibold"
                  >
                    No
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20 transition-all font-bold"
                  >
                    Yes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
