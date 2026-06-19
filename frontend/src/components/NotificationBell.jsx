import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const api = axios.create({ baseURL: `http://${window.location.hostname}:8000` });

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/api/notifications/unread/', { params: { email: user?.email } });
      setUnreadCount(res.data.count);
      setNotifications(res.data.notifications.slice(0, 5)); // Just preview the first 5
    } catch (err) {
      console.error('Failed to fetch unread notifications', err);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (!user) return;
    
    fetchUnreadCount();
    
    // Connect to WebSocket for real-time notifications
    const wsUrl = `ws://${window.location.hostname}:8000/ws/notifications/${user.id}/`;
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_notification') {
        const notif = data.notification;
        // Check if we need to show push/in-app alert (to be handled in GlobalNotificationManager if needed)
        // Here we just update the bell count and preview
        setNotifications(prev => [notif, ...prev].slice(0, 5));
        setUnreadCount(prev => prev + 1);
        
        // Optional: you can show a toast here, but GlobalNotificationManager might do it better
        // to avoid double toast, let's assume global handles it or we handle it here if it's simpler
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    return () => {
      ws.close();
    };
  }, [user, fetchUnreadCount]);

  const markAsRead = async (id) => {
    try {
      await api.post('/api/notifications/read/', { notification_ids: [id], email: user?.email });
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const toggleDropdown = () => setIsOpen(!isOpen);

  return (
    <div className="relative">
      <button 
        onClick={toggleDropdown}
        className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors border border-white/10 relative"
      >
        <Bell className="w-5 h-5 text-gray-200" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#1E1E2E]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 bg-[#1E1E2E] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="text-white font-semibold flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                )}
              </h3>
              <div className="flex gap-2 text-gray-400">
                <button 
                  onClick={() => { setIsOpen(false); navigate('/notifications/settings'); }}
                  className="hover:text-white transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-400">Loading...</div>
              ) : (notifications && notifications.length > 0) ? (
                <div className="flex flex-col">
                  {notifications.map(notif => (
                    <div key={notif.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors relative group">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full 
                          ${notif.priority === 'critical' ? 'bg-red-500/20 text-red-400' : 
                            notif.priority === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 
                            notif.priority === 'success' ? 'bg-green-500/20 text-green-400' : 
                            'bg-blue-500/20 text-blue-400'}`}>
                          {notif.type.charAt(0).toUpperCase() + notif.type.slice(1)}
                        </span>
                        <button 
                          onClick={() => markAsRead(notif.id)}
                          className="text-gray-500 hover:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="text-white text-sm font-medium">{notif.title}</h4>
                      <p className="text-gray-400 text-xs mt-1 line-clamp-2">{notif.message}</p>
                      <span className="text-gray-500 text-[10px] mt-2 block">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                  <Bell className="w-8 h-8 mb-2 opacity-20" />
                  <p>No new notifications</p>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-white/10 bg-white/5 text-center">
              <button 
                onClick={() => { setIsOpen(false); navigate('/notifications'); }}
                className="text-primary text-sm font-medium hover:text-primary-light transition-colors"
              >
                View All Notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
