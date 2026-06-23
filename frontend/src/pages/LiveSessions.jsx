import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { liveSessionService } from '../services/liveSessionService';
import { 
  Video, Plus, Calendar, Clock, User, ExternalLink, 
  FileText, CheckCircle2, Play, StopCircle, Upload, X, Search, BookOpen, Pencil, Trash2, MessageCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';
import CalendarSync from '../components/CalendarSync';

const LiveSessions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin' || user?.role === 'trainer';

  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    scheduled_time: '',
    duration: 60,
    course: '',
  });

  const [material, setMaterial] = useState({
    title: '',
    file_url: ''
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSession, setEditingSession] = useState({
    id: '',
    title: '',
    description: '',
    scheduled_time: '',
    duration: 60,
    course: '',
  });

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  const fetchCourses = async () => {
    try {
      const endpoint = user?.role === 'trainer' 
        ? `${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/trainer/my-courses/?email=${user.email}` 
        : `${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/list-courses/`;
      const response = await axios.get(endpoint);
      // For trainers, the API returns objects with `course_id` and `course_title`
      const formattedCourses = user?.role === 'trainer' 
        ? response.data.map(c => ({ id: c.course_id, title: `${c.course_title} (${c.batch_name})` })) 
        : response.data;
      setCourses(formattedCourses);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  useEffect(() => {
    fetchSessions();
    if (isAdmin || user?.role === 'trainer') {
      fetchCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, user?.role]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await liveSessionService.getSessions();
      setSessions(data);
    } catch (err) {
      console.error(err);
      toast.error(err.message === 'Network Error' ? 'Failed to connect to server. Is the backend running on 0.0.0.0?' : 'Failed to load sessions: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const scheduled_time_utc = newSession.scheduled_time ? new Date(newSession.scheduled_time).toISOString() : '';
      await liveSessionService.createSession({
        ...newSession,
        scheduled_time: scheduled_time_utc,
        course: newSession.course || null
      });
      toast.success('Live class scheduled successfully!');
      setShowCreateModal(false);
      setNewSession({ title: '', description: '', scheduled_time: '', duration: 60, course: '' });
      fetchSessions();
    } catch (err) {
      console.error(err);
      toast.error('Failed to schedule class.');
    }
  };

  const handleEditClick = (session) => {
    let localTime = '';
    if (session.scheduled_time) {
      const d = new Date(session.scheduled_time);
      const offset = d.getTimezoneOffset();
      const localDate = new Date(d.getTime() - (offset * 60 * 1000));
      localTime = localDate.toISOString().slice(0, 16);
    }

    setEditingSession({
      id: session.id,
      title: session.title,
      description: session.description || '',
      scheduled_time: localTime,
      duration: session.duration || 60,
      course: session.course || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateSession = async (e) => {
    e.preventDefault();
    try {
      const scheduled_time_utc = editingSession.scheduled_time ? new Date(editingSession.scheduled_time).toISOString() : '';
      await liveSessionService.updateSession(editingSession.id, {
        title: editingSession.title,
        description: editingSession.description,
        scheduled_time: scheduled_time_utc,
        duration: editingSession.duration,
        course: editingSession.course || null
      });
      toast.success('Live class updated successfully!');
      setShowEditModal(false);
      fetchSessions();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update class.');
    }
  };

  const triggerDeleteConfirm = (id) => {
    setSessionToDelete(id);
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    try {
      await liveSessionService.deleteSession(sessionToDelete);
      toast.success('Live class deleted successfully.');
      setShowDeleteConfirmModal(false);
      setSessionToDelete(null);
      fetchSessions();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete class.');
    }
  };

  const handleStartSession = async (id) => {
    try {
      await liveSessionService.startSession(id);
      toast.success('Session started!');
      fetchSessions();
      navigate(`/meeting-room?id=${id}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to start session.');
    }
  };

  const handleEndSession = async (id) => {
    try {
      await liveSessionService.endSession(id);
      toast.success('Session ended.');
      fetchSessions();
    } catch (err) {
      console.error(err);
      toast.error('Failed to end session.');
    }
  };

  const handleJoinSession = async (id) => {
    try {
      await liveSessionService.joinSession(id);
      
      // Log activity to heatmap
      try {
          await axios.post(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/heatmap/log/`, { email: user.email });
      } catch (err) {
          console.error('Failed to log activity', err);
      }

      navigate(`/meeting-room?id=${id}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to record join attendance.');
      navigate(`/meeting-room?id=${id}`);
    }
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    try {
      await liveSessionService.uploadMaterial(selectedSessionId, material);
      toast.success('Study material uploaded!');
      setShowUploadModal(false);
      setMaterial({ title: '', file_url: '' });
      fetchSessions();
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload material.');
    }
  };

  const handleWhatsAppShare = (session) => {
    const meetingLink = `http://${window.location.hostname}:3000/meeting-room?id=${session.id}`;
    const message = `*Live Class Alert!* 🚀\n\n*Topic:* ${session.title}\n*Host:* ${session.host_detail?.username || 'Trainer'}\n\nJoin the live session now using the link below:\n${meetingLink}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 min-h-screen bg-transparent relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight flex items-center gap-3">
            <Video className="text-indigo-500 animate-pulse" size={32} />
            Live Classes & Meetings
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Join ongoing virtual classes, interact in real-time, and download study resources.
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <input
              type="text"
              placeholder="Search sessions..."
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
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-500/25 transition-all"
            >
              <Plus size={20} />
              Schedule Class
            </motion.button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredSessions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredSessions.map((session) => {
            const now = new Date().getTime();
            const sessionEnd = new Date(session.scheduled_time).getTime() + ((session.duration || 60) * 60000);
            const isExpired = !session.is_live && session.status !== 'ended' && sessionEnd < now;

            return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 border border-[var(--border)] rounded-3xl relative overflow-hidden group hover:border-indigo-500/40 transition-all shadow-xl flex flex-col justify-between"
            >
              {session.is_live ? (
                <div className="absolute top-4 right-4 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-black px-3 py-1 rounded-full animate-pulse tracking-widest flex items-center gap-1.5 uppercase">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                  Live Now
                </div>
              ) : session.status === 'ended' ? (
                <div className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-black px-3 py-1 rounded-full tracking-widest flex items-center gap-1.5 uppercase">
                  <CheckCircle2 size={12} />
                  Completed
                </div>
              ) : isExpired ? (
                <div className="absolute top-4 right-4 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-black px-3 py-1 rounded-full tracking-widest flex items-center gap-1.5 uppercase">
                  <X size={12} />
                  Expired
                </div>
              ) : null}

              <div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <Video size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold text-[var(--text-main)] group-hover:text-indigo-400 transition-colors">
                        {session.title}
                      </h3>
                      {session.course_detail && (
                        <span className="bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider select-none shrink-0">
                          {session.course_detail.title}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-muted)] line-clamp-2 mt-1">
                      {session.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-[var(--border)] my-4 text-sm text-[var(--text-muted)] font-semibold">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-indigo-400" />
                    <span>{new Date(session.scheduled_time).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-indigo-400" />
                    <span>{new Date(session.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({session.duration} min)</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <User size={16} className="text-indigo-400" />
                    <span>Host: {session.host_detail?.username || 'Host'}</span>
                  </div>
                </div>

                {!isAdmin && !isExpired && session.status !== 'ended' && (
                  <CalendarSync 
                    eventTitle={session.title} 
                    description={session.description || 'Live class on Kravia LMS'} 
                    startTime={session.scheduled_time} 
                    endTime={new Date(new Date(session.scheduled_time).getTime() + ((session.duration || 60) * 60000)).toISOString()} 
                  />
                )}

                {session.materials && session.materials.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                      <BookOpen size={12} />
                      Class Resources
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {session.materials.map((mat) => (
                        <a
                          key={mat.id}
                          href={mat.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--glass-hover)] border border-[var(--border)] hover:border-indigo-500/30 rounded-xl text-xs font-semibold text-[var(--text-main)] transition-all"
                        >
                          <FileText size={12} className="text-indigo-400" />
                          <span>{mat.title}</span>
                          <ExternalLink size={10} className="text-[var(--text-muted)]" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[var(--border)]/40">
                {isAdmin ? (
                  <>
                    {!session.is_live && session.status !== 'ended' && !isExpired && (
                      <button
                        onClick={() => handleStartSession(session.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                      >
                        <Play size={16} />
                        Start Session
                      </button>
                    )}
                    {isExpired && (
                      <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--glass)] border border-[var(--border)] text-rose-500/80 font-bold rounded-xl cursor-default">
                        <X size={16} />
                        Expired
                      </div>
                    )}
                    {session.is_live && (
                      <div className="flex-1 flex gap-3">
                        <button
                          onClick={() => navigate(`/meeting-room?id=${session.id}`)}
                          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-2 rounded-xl transition-all shadow-lg shadow-indigo-500/20 text-sm"
                        >
                          <Play size={16} />
                          Join Live
                        </button>
                        <button
                          onClick={() => handleEndSession(session.id)}
                          className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-2 rounded-xl transition-all shadow-lg shadow-rose-500/20 text-sm"
                        >
                          <StopCircle size={16} />
                          End Session
                        </button>
                      </div>
                    )}
                    {session.status === 'ended' && (
                      <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--glass)] border border-[var(--border)] text-[var(--text-muted)] font-bold rounded-xl cursor-default">
                        <CheckCircle2 size={16} />
                        Completed
                      </div>
                    )}
                    <button
                      onClick={() => handleWhatsAppShare(session)}
                      className="p-3 bg-[var(--glass)] border border-[var(--border)] hover:border-emerald-500/30 hover:bg-[var(--glass-hover)] text-emerald-400 rounded-xl transition-all"
                      title="Share on WhatsApp"
                    >
                      <MessageCircle size={18} />
                    </button>
                    <button
                      onClick={() => { setSelectedSessionId(session.id); setShowUploadModal(true); }}
                      className="p-3 bg-[var(--glass)] border border-[var(--border)] hover:border-indigo-500/30 hover:bg-[var(--glass-hover)] text-indigo-400 rounded-xl transition-all"
                      title="Upload Materials"
                    >
                      <Upload size={18} />
                    </button>
                    <button
                      onClick={() => handleEditClick(session)}
                      className="p-3 bg-[var(--glass)] border border-[var(--border)] hover:border-amber-500/30 hover:bg-[var(--glass-hover)] text-amber-400 rounded-xl transition-all"
                      title="Edit Session"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => triggerDeleteConfirm(session.id)}
                      className="p-3 bg-[var(--glass)] border border-[var(--border)] hover:border-rose-500/30 hover:bg-[var(--glass-hover)] text-rose-400 rounded-xl transition-all"
                      title="Delete Session"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    {session.is_live ? (
                      <button
                        onClick={() => handleJoinSession(session.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 animate-bounce"
                      >
                        <Play size={16} />
                        Join Live Now
                      </button>
                    ) : session.status === 'ended' ? (
                      <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--glass)] border border-[var(--border)] text-[var(--text-muted)] font-bold rounded-xl cursor-default">
                        <CheckCircle2 size={16} />
                        Class Ended
                      </div>
                    ) : isExpired ? (
                      <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--glass)] border border-[var(--border)] text-rose-500/80 font-bold rounded-xl cursor-default">
                        <X size={16} />
                        Expired
                      </div>
                    ) : (
                      <button
                        onClick={() => handleJoinSession(session.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--glass)] border border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-400 font-bold rounded-xl transition-all cursor-pointer"
                      >
                        <Clock size={16} />
                        Join Waiting Room
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-[var(--glass)] rounded-[32px] border border-dashed border-[var(--border)] text-center px-4">
          <Video className="text-slate-500/30 mb-4 animate-pulse" size={64} />
          <h3 className="text-xl font-bold text-[var(--text-main)]">No Live Sessions</h3>
          <p className="text-[var(--text-muted)] max-w-sm mt-2">
            No virtual classes or online meetings are scheduled at this time.
          </p>
        </div>
      )}

      {/* CREATE SESSION MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-lg overflow-hidden relative z-10 border border-[var(--border)] shadow-2xl rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-indigo-600/10">
                <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                  <Video className="text-indigo-400" size={24} />
                  Schedule Virtual Class
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 bg-white/5 hover:bg-white/10 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateSession} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Class Title</label>
                  <input
                    type="text"
                    required
                    value={newSession.title}
                    onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                    className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold"
                    placeholder="e.g. Masterclass in Django REST Framework"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Description</label>
                  <textarea
                    rows="3"
                    value={newSession.description}
                    onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                    className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold resize-none"
                    placeholder="Provide details about the session topics, requirements, etc."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Assigned Course (Optional)</label>
                  <select
                    value={newSession.course}
                    onChange={(e) => setNewSession({ ...newSession, course: e.target.value })}
                    className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold cursor-pointer"
                  >
                    <option value="" className="bg-slate-900 text-slate-400">All Students / No Specific Course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id} className="bg-slate-900 text-white">
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Scheduled Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={newSession.scheduled_time}
                      onChange={(e) => setNewSession({ ...newSession, scheduled_time: e.target.value })}
                      className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Duration (Minutes)</label>
                    <input
                      type="number"
                      required
                      value={newSession.duration}
                      onChange={(e) => setNewSession({ ...newSession, duration: parseInt(e.target.value) || 60 })}
                      className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold"
                      min="5"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-white/5 border border-[var(--border)] hover:bg-white/10 text-[var(--text-main)] py-3.5 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all"
                  >
                    Schedule Session
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT SESSION MODAL */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-lg overflow-hidden relative z-10 border border-[var(--border)] shadow-2xl rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-indigo-600/10">
                <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                  <Pencil className="text-amber-400" size={24} />
                  Edit Virtual Class
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 bg-white/5 hover:bg-white/10 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateSession} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Class Title</label>
                  <input
                    type="text"
                    required
                    value={editingSession.title}
                    onChange={(e) => setEditingSession({ ...editingSession, title: e.target.value })}
                    className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-semibold"
                    placeholder="e.g. Masterclass in Django REST Framework"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Description</label>
                  <textarea
                    rows="3"
                    value={editingSession.description}
                    onChange={(e) => setEditingSession({ ...editingSession, description: e.target.value })}
                    className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-semibold resize-none"
                    placeholder="Provide details about the session topics, requirements, etc."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Assigned Course (Optional)</label>
                  <select
                    value={editingSession.course || ''}
                    onChange={(e) => setEditingSession({ ...editingSession, course: e.target.value })}
                    className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-semibold cursor-pointer"
                  >
                    <option value="" className="bg-slate-900 text-slate-400">All Students / No Specific Course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id} className="bg-slate-900 text-white">
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Scheduled Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={editingSession.scheduled_time}
                      onChange={(e) => setEditingSession({ ...editingSession, scheduled_time: e.target.value })}
                      className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Duration (Minutes)</label>
                    <input
                      type="number"
                      required
                      value={editingSession.duration}
                      onChange={(e) => setEditingSession({ ...editingSession, duration: parseInt(e.target.value) || 60 })}
                      className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-semibold"
                      min="5"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-white/5 border border-[var(--border)] hover:bg-white/10 text-[var(--text-main)] py-3.5 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-amber-500/25 transition-all"
                  >
                    Update Session
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirmModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md overflow-hidden relative z-10 border border-[var(--border)] shadow-2xl rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-rose-600/10">
                <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                  <Trash2 className="text-rose-400 animate-pulse" size={24} />
                  Delete Virtual Class
                </h2>
                <button
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="p-1 bg-white/5 hover:bg-white/10 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <p className="text-[var(--text-muted)] font-semibold text-center text-lg leading-relaxed">
                  Are you sure you want to delete this virtual class? This action is permanent and cannot be undone.
                </p>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirmModal(false)}
                    className="flex-1 bg-white/5 border border-[var(--border)] hover:bg-white/10 text-[var(--text-main)] py-3.5 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-rose-500/25 transition-all"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UPLOAD MATERIAL MODAL */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
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
                  <Upload className="text-indigo-400" size={24} />
                  Upload Study Resource
                </h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-1 bg-white/5 hover:bg-white/10 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUploadMaterial} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Resource Name</label>
                  <input
                    type="text"
                    required
                    value={material.title}
                    onChange={(e) => setMaterial({ ...material, title: e.target.value })}
                    className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold"
                    placeholder="e.g. Django Session Slide deck"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">Resource URL (Document Link)</label>
                  <input
                    type="url"
                    required
                    value={material.file_url}
                    onChange={(e) => setMaterial({ ...material, file_url: e.target.value })}
                    className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold"
                    placeholder="https://drive.google.com/..."
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 bg-white/5 border border-[var(--border)] hover:bg-white/10 text-[var(--text-main)] py-3.5 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all"
                  >
                    Add Material
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

export default LiveSessions;
