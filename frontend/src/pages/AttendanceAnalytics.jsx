import React, { useState, useEffect, useCallback } from 'react';
import { liveSessionService } from '../services/liveSessionService';
import { ClipboardList, Users, Video, Search, UserCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const AttendanceAnalytics = () => {
  const [records, setRecords] = useState([]);
  const [metrics, setMetrics] = useState({ total_attendance_logs: 0, unique_students_attended: 0 });
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSessions = useCallback(async () => {
    try {
      const data = await liveSessionService.getSessions();
      // Sort sessions alphabetically by title for easier navigation
      const sorted = [...data].sort((a, b) => a.title.localeCompare(b.title));
      setSessions(sorted);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await liveSessionService.getAttendanceAnalytics(selectedSession || null);
      setRecords(data.records);
      setMetrics(data.metrics);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load attendance analytics.');
    } finally {
      setLoading(false);
    }
  }, [selectedSession]);

  useEffect(() => {
    fetchSessions();
    fetchAnalytics();
  }, [fetchSessions, fetchAnalytics]);

  const filteredRecords = records.filter(rec =>
    rec.student_detail?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.student_detail?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.session_detail?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 min-h-screen bg-transparent relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight flex items-center gap-3">
            <ClipboardList className="text-indigo-500" size={32} />
            Attendance Analytics
          </h1>
          <p className="text-[var(--text-muted)] mt-1 font-semibold">
            Track student engagement, live class attendance records, and active learning metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <input
              type="text"
              placeholder="Search by student or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-3 bg-[var(--glass)] border border-[var(--border)] rounded-2xl text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
          </div>

          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="bg-[var(--glass)] border border-[var(--border)] text-[var(--text-main)] rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 font-semibold"
          >
            <option value="" className="bg-slate-900 text-white font-semibold">All Sessions</option>
            {sessions.map(s => {
              const isDuplicate = sessions.filter(x => x.title === s.title).length > 1;
              return (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white font-semibold">
                  {isDuplicate ? `${s.title} (#${s.id})` : s.title}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 border border-[var(--border)] rounded-3xl relative overflow-hidden flex items-center gap-5"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg">
            <Users size={28} />
          </div>
          <div>
            <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider block">Total Attendance Logs</span>
            <span className="text-3xl font-black text-[var(--text-main)] mt-1 block">{metrics.total_attendance_logs}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 border border-[var(--border)] rounded-3xl relative overflow-hidden flex items-center gap-5"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg">
            <UserCheck size={28} />
          </div>
          <div>
            <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider block">Unique Students Attended</span>
            <span className="text-3xl font-black text-[var(--text-main)] mt-1 block">{metrics.unique_students_attended}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 border border-[var(--border)] rounded-3xl relative overflow-hidden flex items-center gap-5 col-span-1 md:col-span-2 lg:col-span-1"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-lg">
            <Video size={28} />
          </div>
          <div>
            <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider block">Active Live Sessions</span>
            <span className="text-3xl font-black text-[var(--text-main)] mt-1 block">{sessions.length}</span>
          </div>
        </motion.div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredRecords.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card border border-[var(--border)] rounded-[32px] overflow-hidden shadow-2xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-indigo-600/5 text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
                  <th className="p-6">Student</th>
                  <th className="p-6">Class Title</th>
                  <th className="p-6">Joined At</th>
                  <th className="p-6">Left At</th>
                  <th className="p-6">Session Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/40 text-sm text-[var(--text-main)] font-semibold">
                {filteredRecords.map((rec) => {
                  const joinTime = new Date(rec.joined_at);
                  const leaveTime = rec.left_at ? new Date(rec.left_at) : null;
                  const durationMins = leaveTime ? Math.round((leaveTime - joinTime) / 60000) : null;

                  return (
                    <tr key={rec.id} className="hover:bg-[var(--glass-hover)] transition-all">
                      <td className="p-6 flex flex-col">
                        <span className="font-bold text-[var(--text-main)]">{rec.student_detail?.username || 'Student'}</span>
                        <span className="text-xs text-[var(--text-muted)] font-semibold mt-0.5">{rec.student_detail?.email}</span>
                      </td>
                      <td className="p-6">
                        <span className="font-semibold text-indigo-400">{rec.session_detail?.title || 'Virtual Class'}</span>
                      </td>
                      <td className="p-6 text-[var(--text-muted)]">
                        {joinTime.toLocaleString()}
                      </td>
                      <td className="p-6 text-[var(--text-muted)]">
                        {leaveTime ? leaveTime.toLocaleString() : (
                          <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full animate-pulse tracking-wide uppercase">
                            Still In Meeting
                          </span>
                        )}
                      </td>
                      <td className="p-6 text-[var(--text-muted)] font-bold">
                        {durationMins !== null ? `${durationMins} mins` : '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-[var(--glass)] rounded-[32px] border border-dashed border-[var(--border)] text-center px-4">
          <AlertCircle className="text-slate-500/30 mb-4" size={64} />
          <h3 className="text-xl font-bold text-[var(--text-main)]">No Attendance Logs</h3>
          <p className="text-[var(--text-muted)] max-w-sm mt-2">
            Once students participate in live classes, their engagement records and join timestamps will populate here.
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendanceAnalytics;
