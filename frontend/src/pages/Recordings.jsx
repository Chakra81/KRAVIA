import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { liveSessionService } from '../services/liveSessionService';
import { Tv, Play, Plus, Search, Calendar, User, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Recordings = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'trainer';

  const [recordings, setRecordings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    session_id: '',
    recording_url: ''
  });

  const fetchRecordings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await liveSessionService.getRecordings();
      setRecordings(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load recordings.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await liveSessionService.getSessions();
      setSessions(data.filter(s => s.status === 'ended'));
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchRecordings();
    if (isAdmin) {
      fetchSessions();
    }
  }, [fetchRecordings, fetchSessions, isAdmin]);

  const handleAddRecording = async (e) => {
    e.preventDefault();
    if (!formData.session_id || !formData.recording_url) {
      toast.error('Please fill in all fields.');
      return;
    }
    try {
      await liveSessionService.addRecording(formData);
      toast.success('Recording link added successfully!');
      setShowAddModal(false);
      setFormData({ session_id: '', recording_url: '' });
      fetchRecordings();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add recording.');
    }
  };

  const filteredRecordings = recordings.filter(rec =>
    rec.session_detail?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.session_detail?.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 min-h-screen bg-transparent relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight flex items-center gap-3">
            <Tv className="text-indigo-500" size={32} />
            Class Recordings
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Access past live lecture recordings, masterclasses, and revision content.
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <input
              type="text"
              placeholder="Search recordings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-3 bg-[var(--glass)] border border-[var(--border)] rounded-2xl text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
          </div>

          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-500/25 transition-all"
            >
              <Plus size={20} />
              Add Recording
            </motion.button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredRecordings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRecordings.map((rec) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card overflow-hidden border border-[var(--border)] rounded-3xl group hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all flex flex-col justify-between"
            >
              <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 to-purple-950/80 flex flex-col justify-between p-4 z-0" />
                <div className="z-10 w-16 h-16 rounded-full bg-indigo-600 group-hover:bg-indigo-500 border-4 border-white/10 flex items-center justify-center text-white cursor-pointer group-hover:scale-110 transition-all shadow-xl shadow-indigo-600/30">
                  <Play size={24} className="fill-current ml-1" />
                </div>
                <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-between items-center text-xs font-bold text-white/80 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(rec.uploaded_at).toLocaleDateString()}</span>
                  <span>{rec.session_detail?.duration || 60} mins</span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-bold text-[var(--text-main)] group-hover:text-indigo-400 transition-colors line-clamp-1 font-sans">
                  {rec.session_detail?.title || 'Class Recording'}
                </h3>
                <p className="text-sm text-[var(--text-muted)] line-clamp-2 mt-2 font-semibold">
                  {rec.session_detail?.description || 'No description provided.'}
                </p>

                <div className="mt-4 pt-4 border-t border-[var(--border)]/40 flex justify-between items-center text-xs text-[var(--text-muted)] font-semibold">
                  <span className="flex items-center gap-1">
                    <User size={14} className="text-indigo-400" />
                    Host: {rec.session_detail?.host_detail?.username || 'Host'}
                  </span>
                  <a
                    href={rec.recording_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider transition-colors"
                  >
                    View Recording
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-[var(--glass)] rounded-[32px] border border-dashed border-[var(--border)] text-center px-4">
          <Tv className="text-slate-500/30 mb-4" size={64} />
          <h3 className="text-xl font-bold text-[var(--text-main)]">No Recordings Available</h3>
          <p className="text-[var(--text-muted)] max-w-sm mt-2">
            Once sessions are completed and hosted, their recording playbacks will appear here.
          </p>
        </div>
      )}

      {/* ADD RECORDING MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md overflow-hidden relative z-10 border border-[var(--border)] shadow-2xl rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-indigo-600/10">
                <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                  <Tv className="text-indigo-400" size={24} />
                  Add Class Recording Link
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 bg-white/5 hover:bg-white/10 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddRecording} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Select Ended Session</label>
                  <select
                    required
                    value={formData.session_id}
                    onChange={(e) => setFormData({ ...formData, session_id: e.target.value })}
                    className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold"
                  >
                    <option value="">-- Select Completed Class --</option>
                    {sessions.map(s => (
                      <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                        {s.title} ({new Date(s.scheduled_time).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Recording URL (Cloud Playback Link)</label>
                  <input
                    type="url"
                    required
                    value={formData.recording_url}
                    onChange={(e) => setFormData({ ...formData, recording_url: e.target.value })}
                    className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold"
                    placeholder="https://zoom.us/rec/play/... or YouTube link"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-white/5 border border-[var(--border)] hover:bg-white/10 text-[var(--text-main)] py-3.5 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all"
                  >
                    Save Recording
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

export default Recordings;
