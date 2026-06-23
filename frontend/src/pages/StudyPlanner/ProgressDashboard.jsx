import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api');

const ProgressDashboard = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProgress = async () => {
    try {
      const res = await axios.get(`${API}/study-plan/progress/?email=${user.email}`);
      setProgress(res.data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  if (loading) return <div className="text-center py-10 text-[var(--text-secondary)]">Loading...</div>;

  const currentStreak = progress?.current_streak || 0;
  const longestStreak = progress?.longest_streak || 0;
  const xpPoints = progress?.xp_points || 0;

  // Simple level calculation based on XP
  const level = Math.floor(xpPoints / 500) + 1;
  const xpToNextLevel = 500 - (xpPoints % 500);
  const progressPercent = ((xpPoints % 500) / 500) * 100;

  const badges = [
    { name: 'Starter', icon: '🌱', earned: true },
    { name: '7-Day Streak', icon: '🔥', earned: longestStreak >= 7 },
    { name: 'Consistent Learner', icon: '📚', earned: xpPoints >= 1000 },
    { name: 'Level 5', icon: '🌟', earned: level >= 5 },
    { name: 'Code Ninja', icon: '🥷', earned: xpPoints >= 5000 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-3xl border border-[var(--border-color)] bg-gradient-to-br from-orange-500/10 to-red-500/10 relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">🔥</div>
          <h3 className="text-[var(--text-secondary)] font-medium">Current Streak</h3>
          <div className="flex items-end mt-2 space-x-2">
            <span className="text-5xl font-bold text-orange-400">{currentStreak}</span>
            <span className="text-xl text-[var(--text-secondary)] mb-1">days</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-4">Longest streak: {longestStreak} days</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 rounded-3xl border border-[var(--border-color)] bg-gradient-to-br from-blue-500/10 to-indigo-500/10 relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">⚡</div>
          <h3 className="text-[var(--text-secondary)] font-medium">Total XP</h3>
          <div className="flex items-end mt-2 space-x-2">
            <span className="text-5xl font-bold text-blue-400">{xpPoints}</span>
            <span className="text-xl text-[var(--text-secondary)] mb-1">XP</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-4">Earn 50 XP per completed task</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 rounded-3xl border border-[var(--border-color)] bg-gradient-to-br from-purple-500/10 to-pink-500/10 relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">🎓</div>
          <h3 className="text-[var(--text-secondary)] font-medium">Current Level</h3>
          <div className="flex items-end mt-2 space-x-2">
            <span className="text-5xl font-bold text-purple-400">Lv {level}</span>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
              <span>{xpToNextLevel} XP to Level {level + 1}</span>
            </div>
            <div className="w-full bg-[var(--bg)] rounded-full h-2 overflow-hidden border border-[var(--border-color)]">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="glass-card p-6 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Achievement Badges</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {badges.map((badge, idx) => (
            <motion.div
              key={badge.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + (idx * 0.1) }}
              className={`p-4 rounded-2xl flex flex-col items-center justify-center text-center border transition-all ${
                badge.earned
                  ? 'bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                  : 'bg-[var(--bg)] border-[var(--border-color)] opacity-50 grayscale'
              }`}
            >
              <span className="text-4xl mb-2">{badge.icon}</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">{badge.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;
