import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, IndianRupee, Users, AlertCircle,
  Calendar, BarChart2, CreditCard, Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const StatCard = ({ icon: Icon, label, value, sub, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="rounded-2xl border border-[var(--border)] bg-[var(--glass)] p-5 flex flex-col gap-3"
  >
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--text-muted)] font-medium">{label}</span>
      <div className={`p-2 rounded-xl ${color} bg-opacity-15`}>
        <Icon size={18} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
    <p className="text-2xl font-bold text-[var(--text-main)]">{value}</p>
    {sub && <p className="text-xs text-[var(--text-muted)]">{sub}</p>}
  </motion.div>
);

export default function FeeDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://${window.location.hostname}:8000/api/fees/analytics/?email=${user?.email}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin h-10 w-10 rounded-full border-4 border-indigo-500 border-t-transparent" />
    </div>
  );

  if (!data) return <p className="text-[var(--text-muted)] text-center mt-10">Failed to load analytics.</p>;

  const { stats, monthly_chart, course_revenue, method_breakdown } = data;

  const cards = [
    { icon: IndianRupee, label: 'Total Revenue', value: `₹${Number(stats.total_revenue).toLocaleString('en-IN')}`, color: 'bg-indigo-500', sub: 'All time collections', delay: 0 },
    { icon: Clock, label: "Today's Collection", value: `₹${Number(stats.today_collection).toLocaleString('en-IN')}`, color: 'bg-emerald-500', sub: 'Collected today', delay: 0.05 },
    { icon: Calendar, label: 'Monthly Revenue', value: `₹${Number(stats.monthly_revenue).toLocaleString('en-IN')}`, color: 'bg-cyan-500', sub: 'This month', delay: 0.1 },
    { icon: Users, label: 'Paid Students', value: stats.paid_students, color: 'bg-violet-500', sub: 'Fully cleared', delay: 0.15 },
    { icon: AlertCircle, label: 'Overdue Fees', value: `₹${Number(stats.overdue_amount).toLocaleString('en-IN')}`, color: 'bg-rose-500', sub: `${stats.overdue_count} students overdue`, delay: 0.2 },
    { icon: TrendingUp, label: 'Pending Fees', value: `₹${Number(stats.pending_fees).toLocaleString('en-IN')}`, color: 'bg-amber-500', sub: 'Awaiting collection', delay: 0.25 },
    { icon: CreditCard, label: 'Total Transactions', value: stats.total_transactions, color: 'bg-pink-500', sub: 'Successful payments', delay: 0.3 },
    { icon: BarChart2, label: 'Monthly Revenue', value: `₹${Number(stats.monthly_revenue).toLocaleString('en-IN')}`, color: 'bg-teal-500', sub: 'Current month', delay: 0.35 },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.slice(0, 7).map((c, i) => <StatCard key={i} {...c} />)}
      </div>

      {/* Monthly Revenue Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="rounded-2xl border border-[var(--border)] bg-[var(--glass)] p-6">
        <h3 className="font-semibold text-lg text-[var(--text-main)] mb-6 flex items-center gap-2">
          <TrendingUp size={20} className="text-indigo-500" /> Monthly Revenue Trend
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={monthly_chart}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}
              formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
            />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Bottom Row: Course Revenue + Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Course Revenue Bar Chart */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
          className="rounded-2xl border border-[var(--border)] bg-[var(--glass)] p-6">
          <h3 className="font-semibold text-[var(--text-main)] mb-5 flex items-center gap-2">
            <BarChart2 size={18} className="text-violet-400" /> Revenue by Course
          </h3>
          {course_revenue.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm text-center py-8">No course revenue data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={course_revenue} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="course" width={90} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}
                  formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                  {course_revenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Payment Method Pie */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 }}
          className="rounded-2xl border border-[var(--border)] bg-[var(--glass)] p-6">
          <h3 className="font-semibold text-[var(--text-main)] mb-5 flex items-center gap-2">
            <CreditCard size={18} className="text-cyan-400" /> Payment Methods
          </h3>
          {method_breakdown.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm text-center py-8">No payment data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={method_breakdown} cx="50%" cy="50%" outerRadius={85} dataKey="total" nameKey="method" label={({ method, percent }) => `${method} ${(percent * 100).toFixed(0)}%`}>
                  {method_breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}
                  formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>
    </div>
  );
}
