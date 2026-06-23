import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

const METHOD_COLORS = {
  cash: 'bg-emerald-500/15 text-emerald-400',
  upi: 'bg-blue-500/15 text-blue-400',
  bank_transfer: 'bg-violet-500/15 text-violet-400',
  card: 'bg-cyan-500/15 text-cyan-400',
  cheque: 'bg-amber-500/15 text-amber-400',
  online: 'bg-pink-500/15 text-pink-400',
};

function generatePDF(receipt) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  // Header gradient background simulation
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pageW, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(receipt.institute_name || 'Kravia Institute', pageW / 2, 18, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Fee Receipt', pageW / 2, 28, { align: 'center' });
  doc.setFontSize(9);
  doc.text(`Receipt No: ${receipt.receipt_number}`, pageW / 2, 37, { align: 'center' });

  // Reset color
  doc.setTextColor(30, 30, 30);

  // Divider
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.line(14, 52, pageW - 14, 52);

  const field = (label, value, y) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(label, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(String(value), 14, y + 6);
  };

  field('STUDENT NAME', receipt.student_name, 62);
  field('EMAIL', receipt.student_email, 76);
  field('COURSE', receipt.course, 90);
  if (receipt.batch) field('BATCH', receipt.batch, 104);

  // Separator
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 116, pageW - 14, 116);

  // Payment Details Box
  doc.setFillColor(248, 247, 255);
  doc.roundedRect(14, 120, pageW - 28, 55, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(99, 102, 241);
  doc.text('PAYMENT DETAILS', 20, 131);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const rows = [
    ['Transaction ID', receipt.transaction_id],
    ['Payment Method', receipt.payment_method],
    ['Payment Date', receipt.payment_date],
    ['Amount Paid', `Rs. ${Number(receipt.amount).toLocaleString('en-IN')}`],
    ['Payment Status', receipt.status?.toUpperCase()],
  ];

  rows.forEach(([l, v], i) => {
    doc.setFont('helvetica', 'bold'); doc.text(l + ':', 20, 141 + i * 9);
    doc.setFont('helvetica', 'normal'); doc.text(String(v), 85, 141 + i * 9);
  });

  // Fee Summary Box
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, 183, pageW - 28, 42, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129);
  doc.text('FEE SUMMARY', 20, 194);
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  const feeRows = [
    ['Total Course Fee', `Rs. ${Number(receipt.total_fee).toLocaleString('en-IN')}`],
    ['Amount Paid', `Rs. ${Number(receipt.paid_amount).toLocaleString('en-IN')}`],
    ['Balance Pending', `Rs. ${Number(receipt.pending_amount).toLocaleString('en-IN')}`],
  ];
  feeRows.forEach(([l, v], i) => {
    doc.setFont('helvetica', 'bold'); doc.text(l + ':', 20, 203 + i * 9);
    doc.setFont('helvetica', 'normal'); doc.text(v, 85, 203 + i * 9);
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('This is a computer-generated receipt and does not require a physical signature.', pageW / 2, 248, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageW / 2, 255, { align: 'center' });

  doc.save(`receipt_${receipt.receipt_number}.pdf`);
}

export default function PaymentHistory() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [loadingReceipt, setLoadingReceipt] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  const isAdmin = user?.role === 'admin';

  const fetchPayments = useCallback(() => {
    let url = `https://kravia.onrender.com/api/fees/history/?email=${user?.email}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (methodFilter) url += `&method=${methodFilter}`;
    fetch(url)
      .then(r => r.json())
      .then(d => { setPayments(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, search, methodFilter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleDownloadReceipt = async (paymentId) => {
    setLoadingReceipt(paymentId);
    try {
      const res = await fetch(`https://kravia.onrender.com/api/fees/receipt/${paymentId}/?email=${user?.email}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load receipt');
      generatePDF(data);
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setLoadingReceipt(null);
    }
  };

  const paginated = payments.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(payments.length / PER_PAGE);

  const totalAmount = payments.filter(p => p.status === 'success').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Transactions', value: payments.length, color: 'text-indigo-400' },
          { label: 'Total Collected', value: `₹${totalAmount.toLocaleString('en-IN')}`, color: 'text-emerald-400' },
          { label: 'This Month', value: payments.filter(p => new Date(p.payment_date) >= new Date(new Date().setDate(1))).length, color: 'text-amber-400' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--glass)] p-4 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 flex-wrap items-center justify-between">
        <div className="flex gap-3 flex-1">
          {isAdmin && (
            <div className="relative max-w-xs flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search student / Txn ID..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--glass)] text-[var(--text-main)] text-sm outline-none focus:border-indigo-500" />
            </div>
          )}
          <select value={methodFilter} onChange={e => { setMethodFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] text-sm outline-none">
            <option value="">All Methods</option>
            {['cash','upi','bank_transfer','card','cheque','online'].map(m => (
              <option key={m} value={m}>{m.replace('_',' ').toUpperCase()}</option>
            ))}
          </select>
        </div>
        <button onClick={fetchPayments} className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--glass)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--glass)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--glass)]">
                {['Txn ID', 'Student', 'Course', 'Amount', 'Method', 'Date', 'Status', 'Receipt'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center">
                  <div className="animate-spin h-8 w-8 rounded-full border-4 border-indigo-500 border-t-transparent mx-auto" />
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-[var(--text-muted)]">No payments found.</td></tr>
              ) : paginated.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-[var(--border)] hover:bg-[var(--glass-hover)] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-400">{p.transaction_id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--text-main)]">{p.student_name}</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{p.course_title}</td>
                  <td className="px-4 py-3 font-bold text-emerald-400">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${METHOD_COLORS[p.payment_method] || 'bg-[var(--glass)] text-[var(--text-muted)]'}`}>
                      {p.payment_method?.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{p.payment_date}</td>
                  <td className="px-4 py-3">
                    {p.status === 'success' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><CheckCircle size={12} /> Success</span>
                    ) : p.status === 'failed' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-rose-400"><XCircle size={12} /> Failed</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-400"><Clock size={12} /> {p.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDownloadReceipt(p.id)}
                      disabled={loadingReceipt === p.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-medium transition-all border border-indigo-500/20 disabled:opacity-50">
                      {loadingReceipt === p.id ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
                      Receipt
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)]">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs disabled:opacity-40 hover:bg-[var(--glass)] text-[var(--text-main)]">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs disabled:opacity-40 hover:bg-[var(--glass)] text-[var(--text-main)]">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
