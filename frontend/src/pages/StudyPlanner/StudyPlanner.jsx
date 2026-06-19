import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GoalTracker from './GoalTracker';
import DailyPlan from './DailyPlan';
import WeeklyPlan from './WeeklyPlan';
import ProgressDashboard from './ProgressDashboard';

const StudyPlanner = () => {
  const [activeTab, setActiveTab] = useState('daily');

  const tabs = [
    { id: 'daily', label: 'Daily Plan' },
    { id: 'weekly', label: 'Weekly Plan' },
    { id: 'goals', label: 'Goals & Roadmap' },
    { id: 'progress', label: 'Progress Dashboard' },
  ];

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            AI Study Planner
          </h1>
          <div className="flex space-x-2 bg-[var(--bg-secondary)] p-1 rounded-xl glass-effect">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            {activeTab === 'daily' && <DailyPlan />}
            {activeTab === 'weekly' && <WeeklyPlan />}
            {activeTab === 'goals' && <GoalTracker />}
            {activeTab === 'progress' && <ProgressDashboard />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StudyPlanner;
