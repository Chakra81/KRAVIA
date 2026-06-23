import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, X, CheckCircle,
  AlertCircle, Clock, IndianRupee, Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  partially_paid: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  pending: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  overdue: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};
const STATUS_LABELS = { paid: 'Paid', partially_paid: 'Partially Paid', pending: 'Pending', overdue: 'Overdue' };
const STATUS_ICONS = { paid: CheckCircle, partially_paid: Clock, pending: Clock, overdue: AlertCircle };

function CollectFeeModal({ fee, onClose, onSuccess, adminEmail }) {
  const [form, setForm] = useState({
    amount: '', payment_method: 'cash', payment_date: new Date().toISOString().split('T')[0], remarks: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return toast.error('Enter a valid amount');
    setLoading(true);
    try {
      const res = await fetch(`https://kravia.onrender.com/api/fees/collect/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fee_id: fee.id, email: adminEmail, ...form })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(`Payment recorded! Receipt: ${data.receipt_number}`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-[var(--text-main)]">Collect Fee</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--glass)] text-[var(--text-muted)]"><X size={18} /></button>
        </div>

        {/* Fee Info */}
        <div className="mb-5 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <p className="font-semibold text-[var(--text-main)]">{fee.student_name}</p>
          <p className="text-sm text-[var(--text-muted)]">{fee.course_title}</p>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div><p className="text-xs text-[var(--text-muted)]">Total</p><p className="font-bold text-[var(--text-main)]">₹{Number(fee.total_fee).toLocaleString('en-IN')}</p></div>
            <div><p className="text-xs text-[var(--text-muted)]">Paid</p><p className="font-bold text-emerald-400">₹{Number(fee.paid_amount).toLocaleString('en-IN')}</p></div>
            <div><p className="text-xs text-[var(--text-muted)]">Pending</p><p className="font-bold text-rose-400">₹{Number(fee.pending_amount).toLocaleString('en-IN')}</p></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--text-main)] mb-1 block">Amount (₹) *</label>
            <input type="number" required value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              placeholder={`Max: ₹${fee.pending_amount}`}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--glass)] text-[var(--text-main)] outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text-main)] mb-1 block">Payment Method</label>
            <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] outline-none focus:border-indigo-500">
              {['cash','upi','bank_transfer','card','cheque','online'].map(m => (
                <option key={m} value={m}>{m.replace('_',' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text-main)] mb-1 block">Payment Date</label>
            <input type="date" value={form.payment_date}
              onChange={e => setForm({ ...form, payment_date: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--glass)] text-[var(--text-main)] outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text-main)] mb-1 block">Remarks</label>
            <input type="text" value={form.remarks}
              onChange={e => setForm({ ...form, remarks: e.target.value })}
              placeholder="Optional note..."
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--glass)] text-[var(--text-main)] outline-none focus:border-indigo-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-60">
            {loading ? 'Processing...' : 'Record Payment'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function AddFeeModal({ onClose, onSuccess, adminEmail }) {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState({
    student_id: '', course_id: '', batch_id: '', total_fee: '',
    discount: '0', payment_type: 'one_time', due_date: '', notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`https://kravia.onrender.com/api/list-students/`).then(r => r.json()).then(setStudents).catch(console.error);
    fetch(`https://kravia.onrender.com/api/list-courses/`).then(r => r.json()).then(d => setCourses(Array.isArray(d) ? d : d.courses || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (!form.course_id) return;
    fetch(`https://kravia.onrender.com/api/list-courses/`).then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d : d.courses || [];
      const c = list.find(x => String(x.id) === String(form.course_id));
      setBatches(c?.batches || []);
    });
  }, [form.course_id]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`https://kravia.onrender.com/api/fees/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, ...form })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save fee record');
      toast.success('Fee record saved!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-[var(--text-main)]">Assign Fee to Student</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--glass)] text-[var(--text-muted)]"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--text-main)] mb-1 block">Student *</label>
            <select required value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] outline-none focus:border-indigo-500">
              <option value="">Select Student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.email})</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text-main)] mb-1 block">Course *</label>
            <select required value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value, batch_id: '' })}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] outline-none focus:border-indigo-500">
              <option value="">Select Course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          {batches.length > 0 && (
            <div>
              <label className="text-sm font-medium text-[var(--text-main)] mb-1 block">Batch</label>
              <select value={form.batch_id} onChange={e => setForm({ ...form, batch_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] outline-none focus:border-indigo-500">
                <option value="">No Specific Batch</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[var(--text-main)] mb-1 block">Total Fee (₹) *</label>
              <input type="number" required value={form.total_fee} onChange={e => setForm({ ...form, total_fee: e.target.value })}
                placeholder="15000"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--glass)] text-[var(--text-main)] outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-main)] mb-1 block">Discount (₹)</label>
              <input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--glass)] text-[var(--text-main)] outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[var(--text-main)] mb-1 block">Payment Type</label>
              <select value={form.payment_type} onChange={e => setForm({ ...form, payment_type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] outline-none focus:border-indigo-500">
                <option value="one_time">One Time</option>
                <option value="installment">Installment</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-main)] mb-1 block">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--glass)] text-[var(--text-main)] outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text-main)] mb-1 block">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes..."
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--glass)] text-[var(--text-main)] outline-none focus:border-indigo-500 resize-none" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-60">
            {loading ? 'Saving...' : 'Save Fee Record'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function StudentFees({ onCollect }) {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [collectFee, setCollectFee] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [feeToDelete, setFeeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const fetchFees = useCallback(() => {
    let url = `https://kravia.onrender.com/api/fees/?email=${user?.email}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    fetch(url)
      .then(r => r.json())
      .then(d => { setFees(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, statusFilter, search]);

  useEffect(() => { fetchFees(); }, [fetchFees]);

  const paginated = fees.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(fees.length / PER_PAGE);

  const confirmDelete = async () => {
    if (!feeToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`https://kravia.onrender.com/api/fees/${feeToDelete.id}/?email=${user?.email}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete fee record');
      toast.success('Fee record deleted successfully');
      setFeeToDelete(null);
      fetchFees();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search student or course..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--glass)] text-[var(--text-main)] text-sm outline-none focus:border-indigo-500" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] text-sm outline-none focus:border-indigo-500">
            <option value="">All Status</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20">
          <Plus size={16} /> Assign Fee
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex gap-2 flex-wrap text-xs">
        {Object.entries(STATUS_LABELS).map(([k, l]) => {
          const count = fees.filter(f => f.status === k).length;
          return count > 0 ? (
            <span key={k} className={`px-3 py-1.5 rounded-full border font-medium ${STATUS_COLORS[k]}`}>
              {l}: {count}
            </span>
          ) : null;
        })}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--glass)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--glass)]">
                {['Student', 'Course / Batch', 'Total Fee', 'Paid', 'Pending', 'Due Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-[var(--text-muted)]">
                  <div className="animate-spin h-8 w-8 rounded-full border-4 border-indigo-500 border-t-transparent mx-auto" />
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-[var(--text-muted)]">
                  No fee records found.
                </td></tr>
              ) : paginated.map((fee, i) => {
                const Icon = STATUS_ICONS[fee.status] || Clock;
                return (
                  <motion.tr key={fee.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-[var(--border)] hover:bg-[var(--glass-hover)] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text-main)]">{fee.student_name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{fee.student_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text-main)]">{fee.course_title}</p>
                      {fee.batch_name && <p className="text-xs text-[var(--text-muted)]">{fee.batch_name}</p>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--text-main)]">₹{Number(fee.total_fee).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-emerald-400 font-semibold">₹{Number(fee.paid_amount).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-rose-400 font-semibold">₹{Number(fee.pending_amount).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{fee.due_date || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[fee.status]}`}>
                        <Icon size={11} />
                        {STATUS_LABELS[fee.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {fee.status !== 'paid' && (
                          <button onClick={() => setCollectFee(fee)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 text-xs font-medium transition-all border border-indigo-500/20">
                            <IndianRupee size={12} /> Collect
                          </button>
                        )}
                        <button onClick={() => setFeeToDelete(fee)} title="Delete Fee Record"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/20">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)]">Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, fees.length)} of {fees.length}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs disabled:opacity-40 hover:bg-[var(--glass)] text-[var(--text-main)]">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs disabled:opacity-40 hover:bg-[var(--glass)] text-[var(--text-main)]">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {collectFee && (
          <CollectFeeModal fee={collectFee} adminEmail={user?.email}
            onClose={() => setCollectFee(null)} onSuccess={fetchFees} />
        )}
        {showAddModal && (
          <AddFeeModal adminEmail={user?.email}
            onClose={() => setShowAddModal(false)} onSuccess={fetchFees} />
        )}
        {feeToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setFeeToDelete(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 text-rose-500">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-main)] mb-2">Delete Fee Record?</h3>
              <p className="text-sm text-[var(--text-muted)] mb-6">
                Are you sure you want to delete the fee record for <span className="text-[var(--text-main)] font-semibold">{feeToDelete.student_name}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setFeeToDelete(null)} disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--glass)] hover:bg-[var(--glass-hover)] text-[var(--text-main)] font-medium transition-colors">
                  Cancel
                </button>
                <button onClick={confirmDelete} disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium transition-all shadow-lg shadow-rose-500/20 disabled:opacity-60 flex items-center justify-center gap-2">
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
