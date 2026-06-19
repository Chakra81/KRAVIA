import React from 'react';
import { motion } from 'framer-motion';
import { Users, Video, CheckCircle, IndianRupee, ArrowUpRight, Calendar, Sparkles, Plus } from 'lucide-react';
import IntellMeetNavbar from '../components/IntellMeetNavbar';
import { useTheme } from '../context/ThemeContext';

const StatCard = ({ title, value, icon, trend, color }) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    className="glass-card p-6 flex flex-col gap-4 group"
  >
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-2xl bg-${color}-500/10 border border-${color}-500/20 text-${color}-400 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
        <ArrowUpRight size={12} />
        {trend}
      </div>
    </div>
    <div>
      <p className="text-[var(--text-muted)] text-sm font-medium">{title}</p>
      <h3 className="text-3xl font-black text-[var(--text-main)] mt-1 tracking-tight">{value}</h3>
    </div>
    <div className="h-1 w-full bg-[var(--border)] rounded-full overflow-hidden mt-2">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: '70%' }}
        className={`h-full bg-gradient-to-r from-${color}-500 to-${color}-400`}
      />
    </div>
  </motion.div>
);

const IntellMeetDashboard = () => {
  useTheme();
  const stats = [
    { title: 'Total Employees', value: '124', icon: <Users size={24} />, trend: '+12%', color: 'indigo' },
    { title: 'Meetings Today', value: '08', icon: <Video size={24} />, trend: '+5%', color: 'purple' },
    { title: 'Tasks Pending', value: '15', icon: <CheckCircle size={24} />, trend: '-2%', color: 'rose' },
    { title: 'Total Revenue', value: '₹52,000', icon: <IndianRupee size={24} />, trend: '+18%', color: 'emerald' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] pt-24 pb-12 px-6 transition-colors duration-300">
      <IntellMeetNavbar />
      
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Welcome Section */}
        <section className={`relative overflow-hidden rounded-[32px] p-12 border border-[var(--border)] shadow-2xl bg-[var(--glass)] text-[var(--text-main)]`}>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-4 max-w-2xl text-center md:text-left">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--glass)] border border-[var(--border)] text-indigo-500 font-bold text-sm"
              >
                <Sparkles size={16} />
                Welcome back, Commander
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-6xl font-black tracking-tight"
              >
                Your <span className="gradient-text">AI-Powered</span> <br /> Workspace is Ready.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-slate-400 text-lg font-medium"
              >
                Manage your team, schedule smart meetings, and analyze productivity all in one place.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start"
              >
                <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95">
                  <Plus size={20} />
                  Start Meeting
                </button>
                <button className="px-8 py-4 bg-[var(--glass)] hover:bg-[var(--glass-hover)] text-[var(--text-main)] rounded-2xl font-bold border border-[var(--border)] transition-all">
                  Schedule AI Summary
                </button>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: 'spring' }}
              className="w-full max-w-[340px] aspect-square glass-card flex items-center justify-center relative group"
            >
              <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full group-hover:bg-indigo-500/30 transition-colors" />
              <div className="relative z-10 text-center space-y-4">
                <div className="text-6xl">🚀</div>
                <h4 className="text-xl font-bold text-[var(--text-main)]">Launch Success</h4>
                <p className="text-[var(--text-muted)] text-sm">Next meeting in 15 mins</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </section>

        {/* Recent Meetings & Productivity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 glass-card p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black flex items-center gap-2">
                <Calendar className="text-indigo-400" />
                Recent Meetings
              </h3>
              <button className="text-indigo-400 hover:text-indigo-300 font-bold text-sm">View All</button>
            </div>
            
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[var(--glass)] border border-[var(--border)] hover:bg-[var(--glass-hover)] transition-all group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-[var(--text-muted)]`}>
                      M{i}
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--text-main)]">Project Sync - Sprint {i+10}</h4>
                      <p className="text-xs text-[var(--text-muted)]">Yesterday at 2:00 PM • 45 mins</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(j => (
                        <div key={j} className="w-8 h-8 rounded-full border-2 border-[#0f172a] bg-slate-700" />
                      ))}
                    </div>
                    <ArrowUpRight className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card p-8">
            <h3 className="text-2xl font-black mb-8">AI Insights</h3>
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <h4 className="text-indigo-300 font-bold text-sm uppercase tracking-wider mb-2">Efficiency Score</h4>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black">94%</span>
                  <span className="text-emerald-400 text-xs font-bold mb-1">+4% vs last week</span>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-[var(--text-muted)] font-medium">Top Collaborators</p>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {[1, 2, 3, 4].map(k => (
                    <div key={k} className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-800 border border-white/10" />
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--text-muted)] italic">"AI predicts your team is most productive between 10 AM and 12 PM."</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default IntellMeetDashboard;
