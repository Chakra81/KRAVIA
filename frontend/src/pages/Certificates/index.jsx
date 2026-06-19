import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CertificateCard from './CertificateCard';
import CertificatePreview from './CertificatePreview';
import AdminCertificates from './AdminCertificates';
import { downloadCertificatePDF } from './CertificatePreview';

const BASE = `http://${window.location.hostname}:8000`;

function StudentCertificates() {
  const { user } = useAuth();
  const [certs, setCerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState(null);

  const fetchCerts = useCallback(() => {
    fetch(`${BASE}/api/certificates/?email=${user?.email}`)
      .then(r => r.json())
      .then(d => { setCerts(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  useEffect(() => { fetchCerts(); }, [fetchCerts]);

  const filtered = certs.filter(c =>
    !search ||
    c.course_title?.toLowerCase().includes(search.toLowerCase()) ||
    c.certificate_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }}
        className="relative overflow-hidden rounded-2xl p-7"
        style={{ background:'linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e1b4b 100%)', border:'1px solid rgba(99,102,241,0.3)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600 rounded-full opacity-10 translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="relative flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40 flex-shrink-0">
            <Award size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">My Certificates</h2>
            <p className="text-indigo-300 text-sm mt-1">
              {certs.length === 0 ? 'Complete courses to earn certificates' : `${certs.filter(c=>c.status==='active').length} active certificate${certs.length !== 1 ? 's' : ''} earned`}
            </p>
          </div>
          <div className="ml-auto hidden md:flex gap-6 text-center">
            {[
              { label:'Total', value: certs.length, color:'text-indigo-300' },
              { label:'Active', value: certs.filter(c=>c.status==='active').length, color:'text-emerald-300' },
              { label:'Downloads', value: certs.reduce((s,c)=>s+c.download_count,0), color:'text-yellow-300' },
            ].map(s => (
              <div key={s.label}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-indigo-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search course or certificate ID..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--glass)] text-[var(--text-main)] text-sm outline-none focus:border-indigo-500" />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-[var(--border)]">
          <Award size={48} className="mx-auto mb-4 text-[var(--text-muted)] opacity-40" />
          <h3 className="text-lg font-semibold text-[var(--text-main)] mb-2">
            {search ? 'No certificates match your search' : 'No Certificates Yet'}
          </h3>
          <p className="text-[var(--text-muted)] text-sm max-w-xs mx-auto">
            {search ? 'Try a different keyword.' : 'Complete your enrolled courses to earn certificates.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((cert, i) => (
            <CertificateCard
              key={cert.id}
              cert={cert}
              idx={i}
              onPreview={setPreview}
              onDownload={c => downloadCertificatePDF(c, null)}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {preview && (
          <CertificatePreview cert={preview} onClose={() => setPreview(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

const ADMIN_TABS = [
  { id:'manage', label:'Manage Certificates', icon:Award },
];

export default function CertificatesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('manage');

  if (!isAdmin) return (
    <div className="flex flex-col h-[calc(100vh)] overflow-hidden">
      <div className="px-8 pt-8 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Award size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)]">Certificate Center</h1>
            <p className="text-sm text-[var(--text-muted)]">Your earned certificates &amp; achievements</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <StudentCertificates />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh)] overflow-hidden">
      <div className="px-8 pt-8 pb-0 flex-shrink-0">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Award size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)]">Certificate Management</h1>
            <p className="text-sm text-[var(--text-muted)]">Issue, manage and track student certificates</p>
          </div>
        </div>
        <div className="flex gap-1 border-b border-[var(--border)]">
          {ADMIN_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all rounded-t-xl ${
                activeTab === tab.id ? 'text-indigo-400 bg-indigo-500/10' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass)]'
              }`}>
              <tab.icon size={16} />{tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="cert-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.18 }}>
            <AdminCertificates />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
