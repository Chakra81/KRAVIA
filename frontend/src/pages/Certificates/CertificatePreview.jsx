import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, Download, Award, ShieldCheck, QrCode, Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

const BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000' : 'https://kravia.onrender.com');

async function downloadCertificatePDF(cert, onDone) {
  try {
    // Increment download counter
    await fetch(`${BASE}/api/certificates/${cert.id}/download/`, { method: 'POST' });

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    // Background
    doc.setFillColor(15, 12, 51);
    doc.rect(0, 0, W, H, 'F');

    // Outer border
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(1.2);
    doc.rect(8, 8, W - 16, H - 16, 'S');
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(0.4);
    doc.rect(11, 11, W - 22, H - 22, 'S');

    // Top decorative strip
    doc.setFillColor(99, 102, 241);
    doc.rect(8, 8, W - 16, 8, 'F');

    // Gold star decoration corners
    const corners = [[18, 22], [W - 18, 22], [18, H - 18], [W - 18, H - 18]];
    corners.forEach(([x, y]) => {
      doc.setFontSize(14);
      doc.setTextColor(250, 204, 21);
      doc.text('✦', x, y, { align: 'center' });
    });

    // Institute name
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 220);
    doc.text(cert.template_data?.institute_name || 'Kravia Institute', W / 2, 32, { align: 'center' });

    // "Certificate of Completion"
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text('CERTIFICATE OF COMPLETION', W / 2, 52, { align: 'center' });

    // Divider
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.4);
    doc.line(W / 2 - 60, 56, W / 2 + 60, 56);

    // "This is to certify..."
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 160, 200);
    doc.text('This is to proudly certify that', W / 2, 66, { align: 'center' });

    // Student name
    doc.setFontSize(30);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(cert.student_name, W / 2, 82, { align: 'center' });

    // Underline
    const nameW = doc.getTextWidth(cert.student_name);
    doc.setDrawColor(250, 204, 21);
    doc.setLineWidth(0.5);
    doc.line(W / 2 - nameW / 2, 84, W / 2 + nameW / 2, 84);

    // "has successfully completed"
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 160, 200);
    doc.text('has successfully completed the course', W / 2, 93, { align: 'center' });

    // Course title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(250, 204, 21);
    doc.text(cert.course_title, W / 2, 105, { align: 'center' });

    // Completion date
    const completionStr = new Date(cert.completion_date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 160, 200);
    doc.text(`Completed on ${completionStr}`, W / 2, 114, { align: 'center' });

    // Bottom section: signature left, cert id center, seal right
    const bottomY = H - 30;

    // Signatory
    doc.setDrawColor(100, 100, 150);
    doc.line(25, bottomY, 75, bottomY);
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 220);
    doc.text(cert.template_data?.signatory_name || 'Director', 50, bottomY + 5, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(130, 130, 160);
    doc.text(cert.template_data?.signatory_title || 'Institute Director', 50, bottomY + 9, { align: 'center' });

    // Center: Certificate ID
    doc.setFontSize(7);
    doc.setTextColor(130, 130, 160);
    doc.text(`Certificate ID: ${cert.certificate_id}`, W / 2, bottomY + 3, { align: 'center' });
    doc.text(`Issued: ${new Date(cert.issue_date).toLocaleDateString('en-IN')}`, W / 2, bottomY + 8, { align: 'center' });

    // Right: Seal/Verified
    doc.setFontSize(7);
    doc.setTextColor(99, 102, 241);
    doc.text('VERIFIED & AUTHENTICATED', W - 50, bottomY + 3, { align: 'center' });
    doc.setTextColor(130, 130, 160);
    doc.text('Kravia Institute', W - 50, bottomY + 8, { align: 'center' });

    doc.save(`Certificate_${cert.certificate_id}.pdf`);
    toast.success('Certificate downloaded!');
  } catch (err) {
    toast.error('Download failed');
    console.error(err);
  } finally {
    onDone?.();
  }
}

export default function CertificatePreview({ cert, onClose }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    downloadCertificatePDF(cert, () => setDownloading(false));
  };

  const verifyUrl = `${window.location.origin}/verify-certificate/${cert.certificate_id}`;

  // QR code via Google Charts API (no library needed)
  const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=160x160&chl=${encodeURIComponent(verifyUrl)}&choe=UTF-8`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: 'spring', damping: 25 }}
        className="relative z-10 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* ── Certificate Canvas ── */}
        <div
          className="relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0f0c33 0%, #1e1b4b 40%, #0f172a 100%)',
            minHeight: 420,
          }}
        >
          {/* Decorative blobs */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-600 rounded-full opacity-10 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600 rounded-full opacity-10 translate-x-1/2 translate-y-1/2" />

          {/* Border frame */}
          <div className="absolute inset-3 border-2 border-indigo-500/30 rounded-xl pointer-events-none" />
          <div className="absolute inset-[14px] border border-indigo-500/15 rounded-xl pointer-events-none" />

          {/* Top accent bar */}
          <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          {/* Content */}
          <div className="relative px-10 py-8">
            {/* Close */}
            <button onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all z-10">
              <X size={18} />
            </button>

            {/* Institute */}
            <p className="text-center text-indigo-300 text-sm font-medium tracking-widest uppercase mb-2">
              {cert.template_data?.institute_name || 'Kravia Institute'}
            </p>

            {/* Title */}
            <div className="text-center mb-4">
              <h1 className="text-3xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
                CERTIFICATE OF COMPLETION
              </h1>
              <div className="flex items-center justify-center gap-3 mt-2">
                <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-indigo-500" />
                <Award size={18} className="text-yellow-400" />
                <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-indigo-500" />
              </div>
            </div>

            {/* Body */}
            <div className="flex items-start gap-8">
              {/* Left — main cert text */}
              <div className="flex-1 text-center">
                <p className="text-slate-400 text-sm mb-2">This is to proudly certify that</p>
                <p className="text-4xl font-bold text-white mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                  {cert.student_name}
                </p>
                <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-2">has successfully completed the course</p>
                <p className="text-2xl font-bold text-yellow-400 mb-2">{cert.course_title}</p>
                <p className="text-slate-400 text-xs">
                  Completed on{' '}
                  <span className="text-white font-medium">
                    {new Date(cert.completion_date).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                </p>
              </div>

              {/* Right — QR */}
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className="p-2 bg-white rounded-xl">
                  <img src={qrUrl} alt="QR Code" className="w-28 h-28" />
                </div>
                <p className="text-xs text-slate-500 text-center">Scan to verify</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-indigo-500/20 grid grid-cols-3 items-end">
              <div>
                <div className="h-px w-32 bg-slate-600 mb-1.5" />
                <p className="text-sm font-semibold text-slate-300">
                  {cert.template_data?.signatory_name || 'Director'}
                </p>
                <p className="text-xs text-slate-500">
                  {cert.template_data?.signatory_title || 'Institute Director'}
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30">
                  <ShieldCheck size={12} className="text-indigo-400" />
                  <span className="font-mono text-xs text-indigo-300">{cert.certificate_id}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Issued: {new Date(cert.issue_date).toLocaleDateString('en-IN')}
                </p>
              </div>
              <div className="text-right">
                <div className="w-16 h-16 ml-auto rounded-full border-2 border-indigo-500/40 flex items-center justify-center">
                  <Award size={28} className="text-indigo-400" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Official Seal</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Action Bar ── */}
        <div className="flex gap-3 p-4 bg-[var(--bg-card)] border-t border-[var(--border)]">
          <button onClick={handleDownload} disabled={downloading || cert.status !== 'active'}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-60">
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {downloading ? 'Generating PDF...' : 'Download PDF'}
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(verifyUrl); toast.success('Verify link copied!'); }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--glass)] border border-[var(--border)] text-[var(--text-main)] font-medium hover:border-indigo-500/40 transition-all">
            <QrCode size={16} /> Copy Verify Link
          </button>
          <button onClick={onClose}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--glass)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all">
            <X size={16} /> Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export { downloadCertificatePDF };
