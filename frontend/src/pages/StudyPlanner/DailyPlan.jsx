import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API = 'https://kravia.onrender.com/api';

const DailyPlan = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchPlans = async () => {
    try {
      const res = await axios.get(`${API}/study-plan/plans/?email=${user.email}`);
      setPlans(res.data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleUpdateTask = async (taskId, action) => {
    try {
      const res = await axios.post(`${API}/study-plan/task/${taskId}/update/`, {
        email: user.email,
        action
      });
      if (res.status === 200 || res.status === 201) {
        toast.success(`Task marked as ${action}!`);
        fetchPlans();
      }
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );

  if (!Array.isArray(plans) || plans.length === 0) return (
    <div className="text-center py-20 glass-card rounded-2xl border border-[var(--border-color)]">
      <div className="text-5xl mb-4">🎯</div>
      <h3 className="text-xl font-bold text-[var(--text-primary)]">No active study plan</h3>
      <p className="text-[var(--text-secondary)] mt-2">Go to <strong>Goals &amp; Roadmap</strong> → Add a goal → Click <strong>"Generate AI Plan"</strong></p>
    </div>
  );

  const activePlan = plans[0];
  const allTasks = activePlan?.tasks || [];

  if (allTasks.length === 0) return (
    <div className="text-center py-20 glass-card rounded-2xl border border-[var(--border-color)]">
      <div className="text-5xl mb-4">📋</div>
      <h3 className="text-xl font-bold text-[var(--text-primary)]">Plan has no tasks</h3>
      <p className="text-[var(--text-secondary)] mt-2">Try regenerating your AI study plan from Goals &amp; Roadmap.</p>
    </div>
  );

  // Sort tasks by date
  const sortedTasks = [...allTasks].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Find the earliest incomplete task date to show as "today's focus"
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = sortedTasks.filter(t => t.date === today);
  const pendingTasks = sortedTasks.filter(t => !t.is_completed && !t.is_skipped);
  const focusTasks = todayTasks.length > 0 ? todayTasks : (pendingTasks.length > 0 ? [pendingTasks[0]] : sortedTasks.slice(0, 1));

  const completedCount = allTasks.filter(t => t.is_completed).length;
  const totalCount = allTasks.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const taskTypeColor = (type) => {
    if (type === 'quiz') return 'bg-purple-500/20 text-purple-400';
    if (type === 'revision') return 'bg-orange-500/20 text-orange-400';
    if (type === 'weekly') return 'bg-green-500/20 text-green-400';
    return 'bg-blue-500/20 text-blue-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Daily Plan</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{activePlan.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <div className="text-sm px-3 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
            {completedCount}/{totalCount} done
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass-card p-4 rounded-xl border border-[var(--border-color)]">
        <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
          <span>Overall Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full bg-[var(--bg)] rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Today's / Current Focus Tasks */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
          {todayTasks.length > 0 ? "📅 Today's Tasks" : "⏳ Current Focus"}
        </h3>
        <div className="grid gap-4">
          {focusTasks.map((task, idx) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={`p-5 rounded-2xl border transition-all ${
                task.is_completed
                  ? 'bg-green-500/5 border-green-500/30'
                  : task.is_skipped
                  ? 'bg-red-500/5 border-red-500/20 opacity-60'
                  : 'glass-card border-[var(--border-color)] hover:border-blue-500/40'
              }`}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${taskTypeColor(task.task_type)}`}>
                      {task.task_type}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      📅 {new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    {task.is_completed && <span className="text-xs text-green-400 font-medium">✅ Completed</span>}
                    {task.is_skipped && <span className="text-xs text-red-400 font-medium">⏭ Skipped</span>}
                  </div>
                  <h3 className={`text-base font-bold mt-2 ${task.is_completed ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                    {task.title}
                  </h3>
                  <p className={`text-sm mt-1 ${task.is_completed ? 'text-[var(--text-secondary)]/50' : 'text-[var(--text-secondary)]'}`}>
                    {task.description}
                  </p>
                </div>
                {!task.is_completed && !task.is_skipped && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleUpdateTask(task.id, 'complete')}
                      className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                      title="Mark Complete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </button>
                    <button
                      onClick={() => handleUpdateTask(task.id, 'skip')}
                      className="p-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors"
                      title="Skip Task"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* All Tasks List */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">📚 All Tasks</h3>
        <div className="grid gap-3">
          {sortedTasks.map((task, idx) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                task.is_completed
                  ? 'border-green-500/20 bg-green-500/5'
                  : task.is_skipped
                  ? 'border-red-500/20 bg-red-500/5 opacity-50'
                  : 'border-[var(--border-color)] glass-card hover:border-blue-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  task.is_completed ? 'bg-green-500/20 text-green-400' :
                  task.is_skipped ? 'bg-red-500/20 text-red-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {task.is_completed ? '✓' : task.is_skipped ? '✕' : idx + 1}
                </div>
                <div>
                  <p className={`text-sm font-medium ${task.is_completed ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {new Date(task.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {task.task_type}
                  </p>
                </div>
              </div>
              {!task.is_completed && !task.is_skipped && (
                <button
                  onClick={() => handleUpdateTask(task.id, 'complete')}
                  className="text-xs px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors border border-green-500/20 shrink-0"
                >
                  Done
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DailyPlan;
