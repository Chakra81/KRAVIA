import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ShieldX, Award, CheckCircle, XCircle, Loader2, Calendar, User, BookOpen, ArrowLeft } from 'lucide-react';

const BASE = `http://${window.location.hostname}:8000`;

export default function CertificateVerification() {
  const { certificateId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!certificateId) return;
    fetch(`${BASE}/api/certificates/verify/${certificateId}/`)
      .then(r => r.json())
      .then(d => { setResult(d); setLoading(false); })
      .catch(() => { setResult({ valid: false, error: 'Network error' }); setLoading(false); });
  }, [certificateId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg,#0f0c33 0%,#1e1b4b 50%,#0f172a 100%)' }}>
      <div className="fixed top-0 left-0 w-96 h-96 bg-indigo-600 rounded-full opacity-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-purple-600 rounded-full opacity-10 translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-4">
          <Award size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Certificate Verification</h1>
        <p className="text-slate-400 text-sm mt-1">Kravia Institute — Official Verification Portal</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/20"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.2)' }}>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={40} className="animate-spin text-indigo-400" />
            <p className="text-slate-400">Verifying certificate...</p>
          </div>
        ) : result?.valid ? (
          <>
            <div className="bg-gradient-to-r from-emerald-600/80 to-teal-600/80 px-8 py-6 text-center">
              <CheckCircle size={56} className="text-white mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-white">Certificate Verified ✓</h2>
              <p className="text-emerald-200 text-sm mt-1">Authentic certificate from Kravia Institute</p>
            </div>
            <div className="p-8 space-y-4">
              {[
                { icon: User,     label: 'Student Name',   value: result.student_name },
                { icon: BookOpen, label: 'Course',          value: result.course_title },
                { icon: Award,    label: 'Certificate ID',  value: result.certificate_id, mono: true },
                { icon: Calendar, label: 'Completion Date', value: new Date(result.completion_date).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) },
              ].map(({ icon: Icon, label, value, mono }) => (
                <div key={label} className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(99,102,241,0.15)' }}>
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                    <p className={`font-semibold text-white ${mono ? 'font-mono text-sm text-indigo-300' : ''}`}>{value}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)' }}>
                <ShieldCheck size={16} className="text-emerald-400" />
                <span className="text-emerald-300 text-sm font-medium">Status: Active &amp; Valid</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gradient-to-r from-rose-700/80 to-red-700/80 px-8 py-6 text-center">
              <XCircle size={56} className="text-white mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-white">Verification Failed</h2>
              <p className="text-rose-200 text-sm mt-1">This certificate could not be verified</p>
            </div>
            <div className="p-8 text-center">
              <div className="p-5 rounded-xl mb-4"
                style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
                <ShieldX size={28} className="text-rose-400 mx-auto mb-2" />
                <p className="text-slate-300 font-medium">{result?.error || 'Certificate not found or revoked.'}</p>
                <p className="text-slate-500 text-sm mt-2">ID: <span className="font-mono text-slate-400">{certificateId}</span></p>
              </div>
            </div>
          </>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-6">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft size={15} /> Back to Platform
        </Link>
      </motion.div>
    </div>
  );
}
