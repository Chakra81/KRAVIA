import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download, Share2, Eye, ShieldCheck, Copy, CheckCircle,
  Globe, Mail, Award
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  active:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  revoked: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  expired: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

export default function CertificateCard({ cert, onPreview, onDownload, idx = 0 }) {
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(cert.certificate_id);
    setCopied(true);
    toast.success('Certificate ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const verifyUrl = `${window.location.origin}/verify-certificate/${cert.certificate_id}`;

  const handleShare = (type) => {
    setShareOpen(false);
    if (type === 'linkedin') {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`,
        '_blank'
      );
    } else if (type === 'whatsapp') {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`🎓 I earned a certificate for "${cert.course_title}" from Kravia Institute!\n\nVerify here: ${verifyUrl}`)}`,
        '_blank'
      );
    } else if (type === 'email') {
      window.open(
        `mailto:?subject=My Certificate - ${cert.course_title}&body=${encodeURIComponent(`Hi,\n\nI have earned a certificate for completing "${cert.course_title}".\n\nCertificate ID: ${cert.certificate_id}\nVerify here: ${verifyUrl}\n\nBest regards,\n${cert.student_name}`)}`,
        '_blank'
      );
    } else if (type === 'copy') {
      navigator.clipboard.writeText(verifyUrl);
      toast.success('Verification link copied!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07 }}
      className="relative rounded-2xl border border-[var(--border)] bg-[var(--glass)] overflow-hidden group hover:border-indigo-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10"
    >
      {/* Top accent bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      {/* Watermark icon */}
      <div className="absolute top-6 right-5 opacity-5 group-hover:opacity-10 transition-opacity">
        <Award size={80} />
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
              <Award size={22} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--text-main)] leading-tight line-clamp-1">
                {cert.course_title}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Certificate of Completion</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${STATUS_STYLES[cert.status] || STATUS_STYLES.active}`}>
            {cert.status?.charAt(0).toUpperCase() + cert.status?.slice(1)}
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl bg-[var(--glass)] p-3">
            <p className="text-xs text-[var(--text-muted)] mb-1">Issued On</p>
            <p className="text-sm font-semibold text-[var(--text-main)]">
              {new Date(cert.issue_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--glass)] p-3">
            <p className="text-xs text-[var(--text-muted)] mb-1">Downloads</p>
            <p className="text-sm font-semibold text-[var(--text-main)]">{cert.download_count} times</p>
          </div>
        </div>

        {/* Certificate ID */}
        <div className="flex items-center gap-2 mb-5 px-3 py-2.5 rounded-xl bg-indigo-500/8 border border-indigo-500/15">
          <ShieldCheck size={14} className="text-indigo-400 flex-shrink-0" />
          <span className="font-mono text-xs text-indigo-300 flex-1 truncate">{cert.certificate_id}</span>
          <button onClick={handleCopyId}
            className="text-indigo-400 hover:text-indigo-300 transition-colors flex-shrink-0">
            {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={() => onPreview(cert)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--glass)] border border-[var(--border)] text-[var(--text-main)] text-sm font-medium hover:border-indigo-500/40 hover:text-indigo-400 transition-all">
            <Eye size={15} /> Preview
          </button>

          <button
            onClick={() => onDownload(cert)}
            disabled={cert.status !== 'active'}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={15} /> Download
          </button>

          <div className="relative">
            <button onClick={() => setShareOpen(o => !o)}
              className="h-full px-3 rounded-xl bg-[var(--glass)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-indigo-500/40 transition-all">
              <Share2 size={16} />
            </button>

            {shareOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute bottom-full right-0 mb-2 w-44 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl overflow-hidden z-30"
              >
                {[
                  { icon: Globe, label: 'LinkedIn', key: 'linkedin', color: 'text-blue-400' },
                  { icon: Share2,   label: 'WhatsApp', key: 'whatsapp', color: 'text-emerald-400' },
                  { icon: Mail,     label: 'Email',    key: 'email',    color: 'text-amber-400' },
                  { icon: Copy,     label: 'Copy Link',key: 'copy',     color: 'text-purple-400' },
                ].map(s => (
                  <button key={s.key} onClick={() => handleShare(s.key)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--text-main)] hover:bg-[var(--glass)] transition-colors">
                    <s.icon size={14} className={s.color} />
                    {s.label}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
