import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Save, Mail, Smartphone, Bell, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const api = axios.create({ baseURL: `http://${window.location.hostname}:8000` });

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    in_app_notifications: true
  });
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('/api/notifications/settings/', { params: { email: user?.email } });
      setSettings({
        email_notifications: res.data.email_notifications ?? true,
        push_notifications: res.data.push_notifications ?? true,
        in_app_notifications: res.data.in_app_notifications ?? true,
      });
    } catch (err) {
      console.error('Failed to fetch settings', err);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.email) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [user, fetchSettings]);

  const saveSettings = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.put('/api/notifications/settings/', { ...settings, email: user?.email });
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save settings', err);
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (loading) {
    return (
      <div className="p-8 min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-[var(--bg)] transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => navigate('/notifications')}
          className="flex items-center text-[var(--text-muted)] hover:text-[var(--accent)] mb-6 transition-colors"
        >
          <ChevronLeft size={20} /> Back to Notifications
        </button>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 shadow-2xl relative overflow-hidden" style={{ background: 'var(--glass)' }}>
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-[var(--accent)]/10 flex items-center justify-center rounded-2xl text-[var(--accent)]">
              <Settings size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[var(--text-main)]">Notification Settings</h1>
              <p className="text-[var(--text-muted)] text-sm mt-1">Manage how and where you receive alerts</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-5 border border-[var(--border)] rounded-2xl bg-black/10 flex justify-between items-center group hover:border-[var(--accent)]/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-main)]">Email Notifications</h3>
                  <p className="text-[var(--text-muted)] text-sm">Receive important updates via email</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.email_notifications} onChange={() => handleToggle('email_notifications')} />
                <div className="w-14 h-7 bg-black/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[var(--accent)]"></div>
              </label>
            </div>

            <div className="p-5 border border-[var(--border)] rounded-2xl bg-black/10 flex justify-between items-center group hover:border-[var(--accent)]/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
                  <Smartphone size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-main)]">Push Notifications</h3>
                  <p className="text-[var(--text-muted)] text-sm">Get alerts delivered to your device</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.push_notifications} onChange={() => handleToggle('push_notifications')} />
                <div className="w-14 h-7 bg-black/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[var(--accent)]"></div>
              </label>
            </div>

            <div className="p-5 border border-[var(--border)] rounded-2xl bg-black/10 flex justify-between items-center group hover:border-[var(--accent)]/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--accent)]/10 text-[var(--accent)] rounded-xl">
                  <Bell size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-main)]">In-App Alerts</h3>
                  <p className="text-[var(--text-muted)] text-sm">Show notifications within the dashboard</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.in_app_notifications} onChange={() => handleToggle('in_app_notifications')} />
                <div className="w-14 h-7 bg-black/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[var(--accent)]"></div>
              </label>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[var(--border)] flex items-center justify-between">
            <span className={`text-sm font-medium ${message.includes('success') ? 'text-green-500' : 'text-red-500'}`}>
              {message}
            </span>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-6 py-3 bg-[var(--accent)] hover:opacity-90 text-white font-bold rounded-xl shadow-lg shadow-[var(--accent)]/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <><Save size={20} /> Save Preferences</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
