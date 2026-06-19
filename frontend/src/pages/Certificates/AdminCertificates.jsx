import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Award, CheckCircle, XCircle, Download, Plus, Search, RefreshCw, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const BASE = `http://${window.location.hostname}:8000`;
const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444'];

function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--glass)] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[var(--text-muted)]">{label}</span>
        <div className={`p-2 rounded-xl ${color} bg-opacity-15`}>
          <Icon size={18} className={color.replace('bg-','text-')} />
        </div>
      </div>
      <p className="text-2xl font-bold text-[var(--text-main)]">{value}</p>
    </motion.div>
  );
}

function GenerateModal({ onClose, onSuccess, adminEmail }) {
  const [students, setStudents] = useState([]);
  const [courses,  setCourses]  = useState([]);
  const [form, setForm] = useState({ student_id:'', course_id:'', completion_date: new Date().toISOString().split('T')[0] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`http://${window.location.hostname}:8000/api/list-students/`).then(r=>r.json()).then(setStudents).catch(console.error);
    fetch(`http://${window.location.hostname}:8000/api/list-courses/`).then(r=>r.json()).then(d=>setCourses(Array.isArray(d)?d:d.courses||[])).catch(console.error);
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/certificates/`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ email: adminEmail, ...form })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(`Certificate issued! ID: ${data.certificate_id}`);
      onSuccess(); onClose();
    } catch(err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-[var(--text-main)] mb-5">Issue Certificate</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--text-main)] mb-1 block">Student *</label>
            <select required value={form.student_id} onChange={e=>setForm({...form,student_id:e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] outline-none focus:border-indigo-500">
              <option value="">Select Student</option>
              {students.map(s=><option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.email})</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text-main)] mb-1 block">Course *</label>
            <select required value={form.course_id} onChange={e=>setForm({...form,course_id:e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] outline-none focus:border-indigo-500">
              <option value="">Select Course</option>
              {courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text-main)] mb-1 block">Completion Date</label>
            <input type="date" value={form.completion_date} onChange={e=>setForm({...form,completion_date:e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--glass)] text-[var(--text-main)] outline-none focus:border-indigo-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all disabled:opacity-60">
              {loading ? 'Issuing...' : 'Issue Certificate'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function AdminCertificates() {
  const { user } = useAuth();
  const [certs, setCerts]       = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showGenModal, setShowGenModal] = useState(false);
  const [autoLoading, setAutoLoading]   = useState(false);
  const [revokeCertId, setRevokeCertId] = useState(null);

  const fetchAll = useCallback(() => {
    let url = `${BASE}/api/certificates/?email=${user?.email}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    Promise.all([
      fetch(url).then(r=>r.json()),
      fetch(`${BASE}/api/certificates/analytics/?email=${user?.email}`).then(r=>r.json()),
    ]).then(([c,a]) => { setCerts(Array.isArray(c)?c:[]); setAnalytics(a); setLoading(false); })
    .catch(()=>setLoading(false));
  }, [user, search, statusFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRevoke = async () => {
    if (!revokeCertId) return;
    const res = await fetch(`${BASE}/api/certificates/${revokeCertId}/`, {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email: user?.email, status:'revoked', revoke_reason:'Revoked by admin' })
    });
    if (res.ok) { toast.success('Certificate revoked'); setRevokeCertId(null); fetchAll(); }
    else toast.error('Failed to revoke');
  };

  const handleAutoGenerate = async () => {
    setAutoLoading(true);
    try {
      const res = await fetch(`${BASE}/api/certificates/auto-generate/`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: user?.email })
      });
      const data = await res.json();
      toast.success(data.message || 'Done');
      fetchAll();
    } catch { toast.error('Auto-generate failed'); }
    finally { setAutoLoading(false); }
  };

  const stats = analytics?.stats;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Award}       label="Total Issued"      value={stats.total}          color="bg-indigo-500" delay={0} />
          <StatCard icon={CheckCircle} label="Active"            value={stats.active}         color="bg-emerald-500" delay={0.05} />
          <StatCard icon={XCircle}     label="Revoked"           value={stats.revoked}        color="bg-rose-500" delay={0.1} />
          <StatCard icon={Download}    label="Total Downloads"   value={stats.total_downloads} color="bg-cyan-500" delay={0.15} />
        </div>
      )}

      {/* Course Chart */}
      {analytics?.course_data?.length > 0 && (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          className="rounded-2xl border border-[var(--border)] bg-[var(--glass)] p-6">
          <h3 className="font-semibold text-[var(--text-main)] mb-4 flex items-center gap-2">
            <Award size={18} className="text-indigo-400" /> Certificates by Course
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.course_data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="course" tick={{ fontSize:11, fill:'var(--text-muted)' }} />
              <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} allowDecimals={false} />
              <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12 }} />
              <Bar dataKey="count" radius={[6,6,0,0]}>
                {analytics.course_data.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative max-w-xs flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input value={search} onChange={e=>{setSearch(e.target.value)}}
              placeholder="Search student, course, ID..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--glass)] text-[var(--text-main)] text-sm outline-none focus:border-indigo-500" />
          </div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] text-sm outline-none">
            <option value="">All Status</option>
            {['active','pending','revoked','expired'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAutoGenerate} disabled={autoLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-sm font-medium border border-purple-500/20 transition-all disabled:opacity-60">
            {autoLoading ? <RefreshCw size={15} className="animate-spin" /> : <Zap size={15} />} Auto-Generate
          </button>
          <button onClick={()=>setShowGenModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20">
            <Plus size={15} /> Issue Certificate
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--glass)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {['Certificate ID','Student','Course','Issue Date','Downloads','Status','Actions'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center">
                  <div className="animate-spin h-8 w-8 rounded-full border-4 border-indigo-500 border-t-transparent mx-auto" />
                </td></tr>
              ) : certs.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-[var(--text-muted)]">No certificates found.</td></tr>
              ) : certs.map((cert,i)=>(
                <motion.tr key={cert.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                  className="border-b border-[var(--border)] hover:bg-[var(--glass-hover)] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-400">{cert.certificate_id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--text-main)]">{cert.student_name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{cert.student_email}</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{cert.course_title}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                    {new Date(cert.issue_date).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-center text-[var(--text-main)] font-medium">{cert.download_count}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      cert.status==='active'  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                      cert.status==='revoked' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
                      'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}>{cert.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {cert.status === 'active' && (
                      <button onClick={()=>setRevokeCertId(cert.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium transition-all border border-rose-500/20">
                        Revoke
                      </button>
                    )}
                    {cert.status === 'revoked' && (
                      <span className="text-xs text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showGenModal && (
        <GenerateModal adminEmail={user?.email} onClose={()=>setShowGenModal(false)} onSuccess={fetchAll} />
      )}

      {revokeCertId && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setRevokeCertId(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[var(--bg-card)] w-full max-w-md relative z-10 border border-rose-500/30 shadow-2xl rounded-2xl overflow-hidden p-6 text-center"
            onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-2">Revoke Certificate?</h2>
            <p className="text-[var(--text-muted)] mb-6">
              Are you sure you want to revoke this certificate? It will be marked as invalid.
            </p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setRevokeCertId(null)}
                className="px-6 py-2.5 rounded-xl font-medium bg-[var(--glass)] hover:bg-[var(--glass-hover)] text-[var(--text-main)] transition-all border border-[var(--border)]">
                Cancel
              </button>
              <button onClick={handleRevoke}
                className="px-6 py-2.5 rounded-xl font-medium bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/30 transition-all">
                Yes, Revoke
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
