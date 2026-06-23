import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api');

const GoalTracker = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.email) fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchGoals = async () => {
    try {
      const res = await axios.get(`${API}/study-plan/goals/?email=${user.email}`);
      setGoals(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API}/study-plan/goals/`, {
        email: user.email,
        title,
        description,
        target_date: targetDate
      });
      if (res.status === 200 || res.status === 201) {
        toast.success('Goal added successfully!');
        setTitle('');
        setDescription('');
        setTargetDate('');
        fetchGoals();
      }
    } catch (error) {
      const errData = error.response?.data || {};
      toast.error(errData.detail || errData.error || 'Failed to add goal.');
    }
    setLoading(false);
  };

  const handleGeneratePlan = async (goalId) => {
    toast.promise(
      axios.post(`${API}/study-plan/generate/`, { email: user.email, goal_id: goalId }).then(res => res.data),
      {
        loading: 'AI is generating your personalized study plan...',
        success: 'Study plan generated! Check your Daily/Weekly Plan.',
        error: 'Failed to generate plan.'
      }
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="glass-card p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 z-0"></div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">Set New Goal</h2>
          <form onSubmit={handleAddGoal} className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Goal Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Become Java Developer"
                className="w-full bg-[var(--bg)] border border-[var(--border-color)] rounded-xl p-3 text-[var(--text-primary)] focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What do you want to achieve?"
                className="w-full bg-[var(--bg)] border border-[var(--border-color)] rounded-xl p-3 text-[var(--text-primary)] focus:border-blue-500 outline-none"
                rows="3"
                required
              ></textarea>
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border-color)] rounded-xl p-3 text-[var(--text-primary)] focus:border-blue-500 outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
            >
              {loading ? 'Adding...' : 'Add Goal'}
            </button>
          </form>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Your Goals</h2>
        {Array.isArray(goals) && goals.map((goal, idx) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-blue-500/50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{goal.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{goal.description}</p>
                <div className="text-xs text-blue-400 mt-2 font-medium">Target: {goal.target_date}</div>
              </div>
              <button
                onClick={() => handleGeneratePlan(goal.id)}
                className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-500/30 transition-colors border border-indigo-500/30"
              >
                Generate AI Plan
              </button>
            </div>
          </motion.div>
        ))}
        {(!Array.isArray(goals) || goals.length === 0) && (
          <div className="text-[var(--text-secondary)] text-center py-10 glass-panel rounded-2xl border border-dashed border-[var(--border-color)]">
            No goals set yet. Start by adding one!
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalTracker;
