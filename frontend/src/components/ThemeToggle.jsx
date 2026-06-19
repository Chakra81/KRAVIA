import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'light', icon: Sun, label: 'Light', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'dark', icon: Moon, label: 'Dark', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { id: 'sunset', icon: Sparkles, label: 'Sunset', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-2xl bg-[var(--bg-dark)] border border-[var(--border)] shadow-inner">
      {themes.map((t) => {
        const Icon = t.icon;
        const isActive = theme === t.id;

        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 z-10 ${
              isActive ? t.color : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
            title={`Switch to ${t.label} Mode`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTheme"
                className={`absolute inset-0 rounded-xl ${t.bg} border border-[var(--border)] shadow-sm`}
                initial={false}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            )}
            <Icon size={18} className="relative z-10" />
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
