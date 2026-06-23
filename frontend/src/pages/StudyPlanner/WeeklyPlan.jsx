import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API = 'https://kravia.onrender.com/api';

const WeeklyPlan = () => {
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

  if (loading) return <div className="text-center py-10 text-[var(--text-secondary)]">Loading...</div>;
  if (!Array.isArray(plans) || plans.length === 0 || !plans[0]) return (
    <div className="text-center py-10 text-[var(--text-secondary)]">No plans available. Generate one from Goals & Roadmap!</div>
  );

  const activePlan = plans[0];

  // Group tasks by date
  const tasksByDate = activePlan?.tasks?.reduce((acc, task) => {
    if (!acc[task.date]) acc[task.date] = [];
    acc[task.date].push(task);
    return acc;
  }, {});

  const sortedDates = Object.keys(tasksByDate || {}).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Weekly Overview</h2>
        <span className="text-sm text-[var(--text-secondary)]">{activePlan.title}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedDates.map((date, idx) => (
          <motion.div
            key={date}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-card p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col h-full"
          >
            <div className="border-b border-[var(--border-color)] pb-2 mb-3">
              <h3 className="font-bold text-[var(--text-primary)]">
                {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </h3>
            </div>
            <div className="space-y-3 flex-1">
              {tasksByDate[date].map(task => (
                <div key={task.id} className="flex items-start space-x-2">
                  <div className="mt-1">
                    {task.is_completed ? (
                      <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                    ) : task.is_skipped ? (
                      <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-500"></div>
                    )}
                  </div>
                  <div>
                    <p className={`text-sm ${task.is_completed ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                      {task.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyPlan;
