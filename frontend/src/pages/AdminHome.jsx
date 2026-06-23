import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Presentation, TrendingUp, Clock, CheckCircle, Briefcase, FileText, Send, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import NotificationBell from '../components/NotificationBell';

const AdminHome = () => {
  const [analytics, setAnalytics] = useState({
    total_students: 0,
    total_trainers: 0,
    total_courses: 0,
    total_revenue: 0,
    total_placements: 0,
    active_enrollments: 0,
    total_assignments: 0
  });

  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationForm, setNotificationForm] = useState({ title: '', message: '', type: 'info' });
  const [isSending, setIsSending] = useState(false);



  const handleGenerateReport = () => {
    const reportDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
    const reportTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit'
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Kravia LMS — Admin Report ${reportDate}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; padding-bottom: 20px; border-bottom: 3px solid #4f46e5; }
          .brand { font-size: 28px; font-weight: 800; color: #4f46e5; letter-spacing: -1px; }
          .brand span { color: #1a1a2e; }
          .meta { text-align: right; font-size: 13px; color: #64748b; }
          .meta strong { display: block; font-size: 15px; color: #1a1a2e; margin-bottom: 4px; }
          h2 { font-size: 18px; font-weight: 700; color: #1a1a2e; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 36px; }
          .stat-card { background: #f8faff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
          .stat-card .label { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
          .stat-card .value { font-size: 26px; font-weight: 800; color: #1a1a2e; }
          .stat-card .accent { color: #4f46e5; }
          .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 36px; }
          .summary-table th { background: #4f46e5; color: white; padding: 12px 16px; text-align: left; font-size: 13px; font-weight: 700; }
          .summary-table td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          .summary-table tr:nth-child(even) td { background: #f8faff; }
          .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
          .badge-green { background: #dcfce7; color: #16a34a; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">Kravia<span> LMS</span></div>
            <div style="font-size:13px;color:#64748b;margin-top:4px;">Institute Management System</div>
          </div>
          <div class="meta">
            <strong>Admin Analytics Report</strong>
            Generated on: ${reportDate} at ${reportTime}
          </div>
        </div>

        <h2>📊 Key Performance Metrics</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="label">Total Students</div>
            <div class="value">${analytics.total_students}</div>
          </div>
          <div class="stat-card">
            <div class="label">Expert Trainers</div>
            <div class="value">${analytics.total_trainers}</div>
          </div>
          <div class="stat-card">
            <div class="label">Active Courses</div>
            <div class="value">${analytics.total_courses}</div>
          </div>
          <div class="stat-card">
            <div class="label">Total Revenue</div>
            <div class="value accent">₹${analytics.total_revenue}</div>
          </div>
          <div class="stat-card">
            <div class="label">Placements</div>
            <div class="value">${analytics.total_placements}</div>
          </div>
          <div class="stat-card">
            <div class="label">Active Enrollments</div>
            <div class="value">${analytics.active_enrollments}</div>
          </div>
          <div class="stat-card">
            <div class="label">Total Assignments</div>
            <div class="value">${analytics.total_assignments}</div>
          </div>
        </div>

        <h2>📋 Detailed Summary</h2>
        <table class="summary-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Total Registered Students</td><td>${analytics.total_students}</td><td><span class="badge badge-green">Live</span></td></tr>
            <tr><td>Expert Trainers on Platform</td><td>${analytics.total_trainers}</td><td><span class="badge badge-green">Live</span></td></tr>
            <tr><td>Active Course Catalog</td><td>${analytics.total_courses}</td><td><span class="badge badge-green">Live</span></td></tr>
            <tr><td>Total Revenue Collected</td><td>₹${analytics.total_revenue}</td><td><span class="badge badge-green">Live</span></td></tr>
            <tr><td>Student Placements</td><td>${analytics.total_placements}</td><td><span class="badge badge-green">Live</span></td></tr>
            <tr><td>Active Enrollments</td><td>${analytics.active_enrollments}</td><td><span class="badge badge-green">Live</span></td></tr>
            <tr><td>Total Assignments Created</td><td>${analytics.total_assignments}</td><td><span class="badge badge-green">Live</span></td></tr>
          </tbody>
        </table>

        <div class="footer">
          This report was auto-generated by Kravia LMS Admin Dashboard &nbsp;|&nbsp; Confidential
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notificationForm.title || !notificationForm.message) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsSending(true);
    try {
      const email = localStorage.getItem('userEmail');
      await axios.post(`https://kravia.onrender.com/api/notifications/send-global/`, {
        ...notificationForm,
        email
      });
      toast.success('Global notification sent successfully!');
      setIsNotificationModalOpen(false);
      setNotificationForm({ title: '', message: '', type: 'info' });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(`https://kravia.onrender.com/api/admin-analytics/`);
        setAnalytics(res.data);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      }
    };
    fetchAnalytics();
  }, []);

  const stats = [
    { label: 'Total Students', value: analytics.total_students, icon: <Users size={24} />, color: 'bg-blue-500', trend: 'Live' },
    { label: 'Expert Trainers', value: analytics.total_trainers, icon: <Presentation size={24} />, color: 'bg-emerald-500', trend: 'Live' },
    { label: 'Active Courses', value: analytics.total_courses, icon: <BookOpen size={24} />, color: 'bg-indigo-500', trend: 'Live' },
    { label: 'Total Placements', value: analytics.total_placements, icon: <Briefcase size={24} />, color: 'bg-amber-500', trend: 'Live' },
    { label: 'Total Revenue', value: `₹${analytics.total_revenue}`, icon: <TrendingUp size={24} />, color: 'bg-purple-500', trend: 'Live' },
    { label: 'Active Enrollments', value: analytics.active_enrollments, icon: <CheckCircle size={24} />, color: 'bg-pink-500', trend: 'Live' },
    { label: 'Total Assignments', value: analytics.total_assignments, icon: <FileText size={24} />, color: 'bg-teal-500', trend: 'Live' },
  ];

  const recentActivities = [
    { id: 1, user: 'System', action: 'Data synced successfully', time: 'Just now', status: 'Success' },
  ];

  return (
    <div className="p-8 min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Overview</h1>
          <p className="text-slate-400 mt-1 font-medium">Monitor your institute's key metrics and performance.</p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6 border border-white/5 group hover:border-white/20 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg shadow-black/20`}>
                {stat.icon}
              </div>
              <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-lg">
                {stat.trend}
              </span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium mb-1">{stat.label}</h3>
            <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-6 border border-white/5">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Clock size={20} className="text-indigo-400" /> Recent Activities
            </h2>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                      {activity.user.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-semibold group-hover:text-indigo-400 transition-colors">{activity.user}</p>
                      <p className="text-slate-500 text-sm">{activity.action}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs mb-1">{activity.time}</p>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle size={10} /> {activity.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Info Area */}
        <div className="space-y-8">
          <div className="glass-card p-6 border border-white/5 bg-indigo-600/10 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-lg font-bold text-white mb-2">Quick Actions</h2>
              <p className="text-slate-400 text-sm mb-6">Commonly used administrative tools.</p>
              <div className="space-y-3">
                <button
                  onClick={handleGenerateReport}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
                  <Download size={15} />
                  Generate Report
                </button>
                <button 
                  onClick={() => setIsNotificationModalOpen(true)}
                  className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold border border-white/10 transition-all">
                  Send Global Notification
                </button>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
          </div>
        </div>
      </div>

      {/* Global Notification Modal */}
      <AnimatePresence>
        {isNotificationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
              style={{ background: 'var(--glass)' }}
            >
              <button
                onClick={() => setIsNotificationModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Send size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Global Notification</h3>
                  <p className="text-xs text-slate-400">Send an alert to all active users</p>
                </div>
              </div>

              <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Notification Title</label>
                  <input
                    type="text"
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm(prev => ({...prev, title: e.target.value}))}
                    className="w-full bg-black/20 border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="e.g. System Maintenance"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Message Content</label>
                  <textarea
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm(prev => ({...prev, message: e.target.value}))}
                    className="w-full bg-black/20 border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors min-h-[100px] resize-none"
                    placeholder="Enter notification details..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Notification Type</label>
                  <select
                    value={notificationForm.type}
                    onChange={(e) => setNotificationForm(prev => ({...prev, type: e.target.value}))}
                    className="w-full bg-black/20 border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    style={{ color: 'var(--text-main)' }}
                  >
                    <option value="info" className="bg-[#1a1b23]">Information</option>
                    <option value="success" className="bg-[#1a1b23]">Success</option>
                    <option value="warning" className="bg-[#1a1b23]">Warning</option>
                    <option value="course" className="bg-[#1a1b23]">Course Update</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsNotificationModalOpen(false)}
                    className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={16} />
                        Broadcast
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminHome;
