import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell, Search, Check, Trash2, Settings, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const api = axios.create({ baseURL: `http://${window.location.hostname}:8000` });

const NotificationCenter = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/notifications/';
      const params = new URLSearchParams();
      
      if (filter === 'unread') params.append('is_read', 'false');
      if (filter === 'read') params.append('is_read', 'true');
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (user?.email) params.append('email', user.email);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await api.get(url);
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  }, [filter, typeFilter, user?.email]);

  useEffect(() => {
    fetchNotifications();
    
    if (!user) return;
    
    // Connect to WebSocket for real-time notifications
    const wsUrl = `ws://${window.location.hostname}:8000/ws/notifications/${user.id}/`;
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_notification') {
        const notif = data.notification;
        // Only add if it matches the current type filter (or if typeFilter is 'all')
        // and if it matches the read filter
        setNotifications(prev => {
          // If we are filtering by read, we shouldn't show it (since it's unread)
          if (filter === 'read') return prev;
          if (typeFilter !== 'all' && notif.type !== typeFilter) return prev;
          
          // Prepend to array
          return [notif, ...prev];
        });
      }
    };
    
    return () => {
      ws.close();
    };
  }, [filter, typeFilter, user, fetchNotifications]);

  const handleMarkAsRead = async (id = null) => {
    try {
      const payload = id ? { notification_ids: [id], email: user?.email } : { action: 'all', email: user?.email };
      await api.post('/api/notifications/read/', payload);
      
      if (id) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleDelete = async (id = null) => {
    try {
      const payload = id ? { notification_ids: [id], email: user?.email } : { action: 'all', email: user?.email };
      await api.post('/api/notifications/delete/', payload);
      
      if (id) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to delete notifications', err);
    }
  };

  const filteredSearch = notifications.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.message.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 min-h-screen bg-[var(--bg)] transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-[var(--text-main)] flex items-center gap-3">
              <div className="p-3 bg-[var(--accent)]/10 rounded-xl text-[var(--accent)]">
                <Bell size={28} />
              </div>
              Notification Center
            </h1>
            <p className="text-[var(--text-muted)] mt-2">Manage your alerts, updates, and messages</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/notifications/settings')}
              className="px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--text-main)] rounded-xl hover:bg-[var(--accent)]/10 hover:border-[var(--accent)] transition-all flex items-center gap-2"
            >
              <Settings size={18} /> Settings
            </button>
            <button 
              onClick={() => handleMarkAsRead()}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 font-medium shadow-lg shadow-[var(--accent)]/20"
            >
              <Check size={18} /> Mark All Read
            </button>
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl mb-6 flex flex-col md:flex-row gap-4 justify-between items-center" style={{ background: 'var(--glass)' }}>
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-[var(--border)] rounded-xl text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {['all', 'unread', 'read'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filter === f ? 'bg-[var(--accent)] text-white shadow-lg' : 'bg-black/20 text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--accent)]/50'}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <div className="h-9 w-px bg-[var(--border)] mx-1 self-center"></div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 bg-black/20 border border-[var(--border)] text-[var(--text-main)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="all">All Types</option>
              <option value="assignment">Assignments</option>
              <option value="exam">Exams</option>
              <option value="course">Courses</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[var(--text-muted)]">Loading notifications...</p>
            </div>
          ) : filteredSearch.length === 0 ? (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-12 text-center" style={{ background: 'var(--glass)' }}>
              <div className="w-20 h-20 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--accent)]">
                <Bell size={40} />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">You're all caught up!</h3>
              <p className="text-[var(--text-muted)]">No notifications match your current filters.</p>
            </div>
          ) : (
            filteredSearch.map(notif => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={notif.id}
                className={`p-5 rounded-2xl border ${notif.is_read ? 'bg-[var(--card)] border-[var(--border)]' : 'bg-[var(--accent)]/5 border-[var(--accent)]/30'} flex gap-5 items-start transition-all hover:-translate-y-1 hover:shadow-lg`}
                style={{ background: notif.is_read ? 'var(--glass)' : undefined }}
              >
                <div className={`p-3 rounded-xl flex-shrink-0 mt-1
                  ${notif.priority === 'critical' ? 'bg-red-500/20 text-red-500' : 
                    notif.priority === 'warning' ? 'bg-yellow-500/20 text-yellow-500' : 
                    notif.priority === 'success' ? 'bg-green-500/20 text-green-500' : 
                    'bg-blue-500/20 text-blue-500'}`}
                >
                  {notif.priority === 'critical' ? <AlertCircle size={24} /> : 
                   notif.priority === 'success' ? <CheckCircle size={24} /> : 
                   notif.priority === 'warning' ? <AlertCircle size={24} /> : 
                   <Info size={24} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded-full border border-[var(--accent)]/20">
                      {notif.type}
                    </span>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"></span>
                    )}
                    <span className="text-xs text-[var(--text-muted)] ml-auto">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-[var(--text-main)] mb-1">{notif.title}</h4>
                  <p className="text-[var(--text-muted)] text-sm leading-relaxed">{notif.message}</p>
                </div>
                
                <div className="flex flex-col gap-2">
                  {!notif.is_read && (
                    <button 
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="p-2 bg-[var(--card)] border border-[var(--border)] rounded-xl text-green-500 hover:bg-green-500 hover:text-white transition-colors"
                      title="Mark as Read"
                    >
                      <Check size={18} />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(notif.id)}
                    className="p-2 bg-[var(--card)] border border-[var(--border)] rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
