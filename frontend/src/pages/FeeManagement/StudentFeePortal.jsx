import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, Download, CheckCircle, AlertCircle, Calendar, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  paid: 'from-emerald-500 to-teal-600',
  partially_paid: 'from-amber-500 to-orange-600',
  pending: 'from-blue-500 to-indigo-600',
  overdue: 'from-rose-500 to-red-600',
};

function generatePDF(receipt) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pageW, 45, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22); doc.setFont('helvetica', 'bold');
  doc.text(receipt.institute_name || 'Kravia Institute', pageW / 2, 18, { align: 'center' });
  doc.setFontSize(11); doc.setFont('helvetica', 'normal');
  doc.text('Official Fee Receipt', pageW / 2, 28, { align: 'center' });
  doc.setFontSize(9);
  doc.text(`Receipt No: ${receipt.receipt_number}`, pageW / 2, 37, { align: 'center' });
  doc.setTextColor(30, 30, 30);
  doc.setDrawColor(99, 102, 241);
  doc.line(14, 52, pageW - 14, 52);
  const field = (label, value, y) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.text(label, 14, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(30, 30, 30);
    doc.text(String(value || '—'), 14, y + 6);
  };
  field('STUDENT NAME', receipt.student_name, 62);
  field('COURSE', receipt.course, 76);
  doc.setFillColor(248, 247, 255);
  doc.roundedRect(14, 92, pageW - 28, 65, 3, 3, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(99, 102, 241);
  doc.text('PAYMENT DETAILS', 20, 103);
  const rows = [['Txn ID', receipt.transaction_id], ['Method', receipt.payment_method], ['Date', receipt.payment_date], ['Amount', `Rs. ${Number(receipt.amount).toLocaleString('en-IN')}`]];
  rows.forEach(([l, v], i) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(30, 30, 30);
    doc.text(l + ':', 20, 113 + i * 10);
    doc.setFont('helvetica', 'normal');
    doc.text(String(v || '—'), 70, 113 + i * 10);
  });
  doc.setFontSize(8); doc.setTextColor(150);
  doc.text('This is a system-generated receipt.', pageW / 2, 200, { align: 'center' });
  doc.save(`receipt_${receipt.receipt_number}.pdf`);
}

export default function StudentFeePortal() {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [loadingReceipt, setLoadingReceipt] = useState(null);

  const fetchData = useCallback(() => {
    Promise.all([
      fetch(`http://${window.location.hostname}:8000/api/fees/my/?email=${user?.email}`).then(r => r.json()),
      fetch(`http://${window.location.hostname}:8000/api/fees/history/?email=${user?.email}`).then(r => r.json()),
    ]).then(([f, p]) => {
      setFees(Array.isArray(f) ? f : []);
      setPayments(Array.isArray(p) ? p : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDownload = async (paymentId) => {
    setLoadingReceipt(paymentId);
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/fees/receipt/${paymentId}/?email=${user?.email}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      generatePDF(data);
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setLoadingReceipt(null);
    }
  };

  const totalFee = fees.reduce((s, f) => s + Number(f.total_fee), 0);
  const totalPaid = fees.reduce((s, f) => s + Number(f.paid_amount), 0);
  const totalPending = fees.reduce((s, f) => s + Number(f.pending_amount), 0);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin h-10 w-10 rounded-full border-4 border-indigo-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Overall Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Course Fees', value: `₹${totalFee.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'indigo' },
          { label: 'Amount Paid', value: `₹${totalPaid.toLocaleString('en-IN')}`, icon: CheckCircle, color: 'emerald' },
          { label: 'Amount Pending', value: `₹${totalPending.toLocaleString('en-IN')}`, icon: AlertCircle, color: 'rose' },
        ].map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`rounded-2xl border border-${c.color}-500/20 bg-${c.color}-500/10 p-5`}>
            <div className={`w-10 h-10 rounded-xl bg-${c.color}-500/20 flex items-center justify-center mb-3`}>
              <c.icon size={20} className={`text-${c.color}-400`} />
            </div>
            <p className={`text-2xl font-bold text-${c.color}-400`}>{c.value}</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">{c.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--glass)] border border-[var(--border)] w-fit">
        {['summary', 'history'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}>{tab === 'summary' ? 'Fee Summary' : 'Payment History'}</button>
        ))}
      </div>

      {/* Fee Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          {fees.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-[var(--border)] text-[var(--text-muted)]">
              <IndianRupee size={40} className="mx-auto mb-3 opacity-30" />
              <p>No fee records assigned yet.</p>
            </div>
          ) : fees.map((fee, i) => {
            const pct = Math.min((Number(fee.paid_amount) / Number(fee.total_fee)) * 100, 100);
            return (
              <motion.div key={fee.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-[var(--border)] bg-[var(--glass)] p-6">
                <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                  <div>
                    <h3 className="font-bold text-lg text-[var(--text-main)]">{fee.course_title}</h3>
                    {fee.batch_name && <p className="text-sm text-[var(--text-muted)]">Batch: {fee.batch_name}</p>}
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r ${STATUS_COLORS[fee.status] || 'from-gray-500 to-gray-600'} text-white`}>
                    {fee.status?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1.5">
                    <span>Payment Progress</span>
                    <span>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[var(--border)] overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-xl bg-[var(--glass)] p-3">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Total Fee</p>
                    <p className="font-bold text-[var(--text-main)]">₹{Number(fee.total_fee).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-500/10 p-3">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Paid</p>
                    <p className="font-bold text-emerald-400">₹{Number(fee.paid_amount).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="rounded-xl bg-rose-500/10 p-3">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Pending</p>
                    <p className="font-bold text-rose-400">₹{Number(fee.pending_amount).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {fee.due_date && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <Calendar size={13} />
                    Due Date: <span className="font-medium text-[var(--text-main)]">{fee.due_date}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Payment History Tab */}
      {activeTab === 'history' && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--glass)] overflow-hidden">
          {payments.length === 0 ? (
            <div className="text-center py-16 text-[var(--text-muted)]">No payment records yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Txn ID', 'Course', 'Amount', 'Method', 'Date', 'Receipt'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-[var(--border)] hover:bg-[var(--glass-hover)] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-indigo-400">{p.transaction_id}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{p.course_title}</td>
                    <td className="px-4 py-3 font-bold text-emerald-400">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)] capitalize">{p.payment_method?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{p.payment_date}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDownload(p.id)} disabled={loadingReceipt === p.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-medium transition-all border border-indigo-500/20 disabled:opacity-50">
                        {loadingReceipt === p.id ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
                        PDF
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
