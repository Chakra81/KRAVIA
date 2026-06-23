import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import toast from 'react-hot-toast';
import { Bell, Sparkles, BookOpen, UserPlus } from 'lucide-react';



const GlobalNotificationManager = () => {
  const { user } = useAuth();
  const navigate = useNavigate();


  useEffect(() => {
    if (!user) return; // Allow all authenticated users to receive notifications

    // Connect to WebSocket for real-time notifications
    const wsUrl = `wss://kravia.onrender.com/ws/notifications/${user.id}/`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_notification') {
        const n = data.notification;
            if (n.type === 'chat') {
              // WhatsApp style right-side alert message!
              const senderName = n.title.replace('New message from ', '').replace(' 💬', '');
              const senderInitials = senderName.charAt(0).toUpperCase();

              toast.custom((t) => (
                <div
                  className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                  } max-w-sm w-full bg-[var(--card)] border border-emerald-500/30 shadow-2xl rounded-2xl pointer-events-auto flex p-4 cursor-pointer hover:scale-[1.02] transition-transform duration-200`}
                  style={{
                    boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.1), 0 10px 10px -5px rgba(16, 185, 129, 0.04)',
                    background: 'var(--glass)'
                  }}
                  onClick={() => {
                    toast.dismiss(t.id);
                    navigate('/chat');
                  }}
                >
                  <div className="flex-1 w-0">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black shadow-md border border-emerald-400/30">
                          {senderInitials}
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-bold text-[var(--text-main)] flex items-center gap-1.5">
                          {senderName} <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex border-l border-[var(--border)] ml-3 pl-3 items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.dismiss(t.id);
                        navigate('/chat');
                      }}
                      className="w-full border border-transparent rounded-none rounded-r-lg p-1.5 flex items-center justify-center text-xs font-bold text-emerald-500 hover:text-emerald-400 focus:outline-none uppercase tracking-wider"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              ), { position: 'bottom-right', duration: 5000 });

            } else if (n.type === 'student_approval') {
              toast.custom((t) => (
                <div
                  className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                  } max-w-sm w-full bg-[var(--card)] border border-indigo-500/30 shadow-2xl rounded-2xl pointer-events-auto flex p-4 cursor-pointer hover:scale-[1.02] transition-transform duration-200`}
                  style={{
                    boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.1)',
                    background: 'var(--glass)'
                  }}
                  onClick={() => {
                    toast.dismiss(t.id);
                    navigate('/enroll'); // Go to enroll students page
                  }}
                >
                  <div className="flex-1 w-0">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-md">
                          <UserPlus size={20} />
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-bold text-[var(--text-main)] flex items-center gap-1.5">
                          {n.title} <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex border-l border-[var(--border)] ml-3 pl-3 items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.dismiss(t.id);
                        navigate('/enroll');
                      }}
                      className="w-full border border-transparent rounded-none rounded-r-lg p-1.5 flex items-center justify-center text-xs font-bold text-indigo-500 hover:text-indigo-400 focus:outline-none uppercase"
                    >
                      View
                    </button>
                  </div>
                </div>
              ), { position: 'top-right', duration: 10000 });
            } else {
              // Course or General updates global notification
              toast.custom((t) => (
                <div
                  className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                  } max-w-sm w-full bg-[var(--card)] border border-[var(--border)] shadow-2xl rounded-2xl pointer-events-auto flex p-4`}
                  style={{ background: 'var(--glass)' }}
                >
                  <div className="flex-1 w-0">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] font-bold">
                          {n.type === 'course' ? <BookOpen size={20} /> : <Bell size={20} />}
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-bold text-[var(--text-main)] flex items-center gap-1.5">
                          {n.title} <Sparkles size={14} className="text-yellow-500 animate-spin" />
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex border-l border-[var(--border)] ml-3 pl-3 items-center">
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="w-full border border-transparent rounded-none rounded-r-lg p-1.5 flex items-center justify-center text-xs font-bold text-[var(--accent)] hover:text-[var(--accent)]/80 focus:outline-none"
                    >
                      OK
                    </button>
                  </div>
                </div>
              ), { position: 'bottom-right', duration: 6000 });
            }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error in GlobalNotificationManager:', error);
    };

    return () => {
      ws.close();
    };
  }, [user, navigate]);

  return null; // This component runs globally in the background
};

export default GlobalNotificationManager;
