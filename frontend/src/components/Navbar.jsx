import React from 'react';
import { Search, Plus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onSearchChange, onAddCourse }) => {
  const { user } = useAuth();
  useTheme();

  return (
    <div className={`backdrop-blur-md py-4 px-10 flex items-center justify-between sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg-card)]`}>
      <div className="flex-shrink-0">
        <div className={`flex items-center gap-4 px-6 py-2.5 rounded-lg border shadow-xl glass-card`}>
          <span className={`text-[var(--text-muted)] text-sm font-medium`}>Welcome,</span>
          <span className={`text-[var(--text-main)] font-bold tracking-wide`}>Admin</span>
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-auto">
        <div className="relative">
          <input
            type="text"
            placeholder="Search Courses..."
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-11 pr-4 py-2.5 border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all bg-[var(--glass)] text-[var(--text-main)] placeholder-[var(--text-muted)]`}
          />
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]`} size={18} />
        </div>
      </div>

      {user?.role !== 'student' && (
        <div className="flex-shrink-0">
          <button 
            onClick={onAddCourse}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-indigo-500/20 transition-all active:scale-95 uppercase text-xs tracking-widest"
          >
            <Plus size={18} />
            Add Course
          </button>
        </div>
      )}
    </div>
  );
};

export default Navbar;
