import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import axios from 'axios';

const API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api');

const PIE_COLORS = ['#6C63FF', '#48BB78', '#F6AD55', '#FC8181', '#63B3ED'];

// ── Custom Tooltip ──────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(22,33,62,0.97)', border: '1px solid #6C63FF44',
        borderRadius: 10, padding: '10px 16px', color: '#fff', fontSize: 13
      }}>
        <p style={{ color: '#aaa', marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin: '2px 0' }}>
            {p.name}: <strong>{p.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ── Stat Card ───────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, sub }) => (
  <div style={{
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    border: `1px solid ${color}33`, borderRadius: 14, padding: '1.4rem 1.6rem',
    display: 'flex', flexDirection: 'column', gap: 8,
    boxShadow: `0 4px 20px ${color}18`, transition: 'transform 0.2s',
    cursor: 'default'
  }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
  >
    <span style={{ fontSize: '1.8rem' }}>{icon}</span>
    <span style={{ fontSize: '2rem', fontWeight: 800, color, letterSpacing: '-0.5px' }}>{value}</span>
    <span style={{ color: '#ccc', fontSize: '0.82rem', fontWeight: 600 }}>{label}</span>
    {sub && <span style={{ color: '#666', fontSize: '0.75rem' }}>{sub}</span>}
  </div>
);

// ── Section Header ──────────────────────────────────────────
const SectionHeader = ({ title, icon }) => (
  <h2 style={{
    fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0',
    marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8
  }}>
    <span>{icon}</span> {title}
  </h2>
);

// ── Main Component ──────────────────────────────────────────
export default function TrainerAnalytics() {
  const [summary, setSummary] = useState(null);
  const [batchChart, setBatchChart] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const email = localStorage.getItem('trainer_email') || localStorage.getItem('email') || '';

  const fetchAll = useCallback(async () => {
    if (!email) { setError('No trainer email found. Please log in again.'); setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const params = `?email=${encodeURIComponent(email)}`;
      const [s, b, st, a] = await Promise.all([
        axios.get(`${API}/trainer/analytics/summary/${params}`),
        axios.get(`${API}/trainer/analytics/batch-chart/${params}`),
        axios.get(`${API}/trainer/analytics/student-progress/${params}`),
        axios.get(`${API}/trainer/analytics/assignments/${params}`),
      ]);
      setSummary(s.data);
      setBatchChart(b.data);
      setStudents(st.data);
      setAssignments(a.data);
    } catch (e) {
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Pie chart: enrollment status distribution
  const statusData = students.reduce((acc, s) => {
    const found = acc.find(x => x.name === s.status);
    if (found) found.value++;
    else acc.push({ name: s.status, value: 1 });
    return acc;
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', color: '#6C63FF' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
        <p style={{ color: '#aaa' }}>Loading analytics...</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
      <div style={{
        background: '#2d1b1b', border: '1px solid #FC818155', borderRadius: 12,
        padding: '2rem 3rem', textAlign: 'center'
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
        <p style={{ color: '#FC8181', marginBottom: 12 }}>{error}</p>
        <button onClick={fetchAll} style={{
          background: '#6C63FF', color: '#fff', border: 'none', borderRadius: 8,
          padding: '8px 20px', cursor: 'pointer', fontWeight: 600
        }}>Retry</button>
      </div>
    </div>
  );

  return (
    <div style={{
      padding: '2rem', minHeight: '100vh',
      background: 'var(--bg, #0F0E17)', color: '#fff',
      fontFamily: "'Inter', 'Segoe UI', sans-serif"
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{
              fontSize: '1.7rem', fontWeight: 800, margin: 0,
              background: 'linear-gradient(135deg, #6C63FF, #48BB78)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              📊 Trainer Analytics Dashboard
            </h1>
            <p style={{ color: '#718096', margin: '4px 0 0', fontSize: '0.9rem' }}>
              Performance overview for your courses and students
            </p>
          </div>
          <button onClick={fetchAll} style={{
            background: '#6C63FF22', border: '1px solid #6C63FF55',
            color: '#6C63FF', borderRadius: 8, padding: '8px 16px',
            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem', marginBottom: '2rem'
        }}>
          <StatCard icon="👥" label="Total Students" value={summary.total_students} color="#6C63FF" />
          <StatCard icon="📚" label="Total Courses" value={summary.total_courses} color="#48BB78" />
          <StatCard icon="🗂️" label="Total Batches" value={summary.total_batches} color="#63B3ED" />
          <StatCard icon="✅" label="Completion Rate" value={`${summary.completion_rate}%`} color="#F6AD55" sub="enrolled → completed" />
          <StatCard icon="🏆" label="Avg Exam Score" value={`${summary.avg_exam_score}%`} color="#FC8181" />
          <StatCard icon="📝" label="Total Assignments" value={summary.total_assignments} color="#B794F4" sub={`${summary.graded_submissions} graded`} />
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Bar Chart: Students per Batch */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          border: '1px solid #6C63FF22', borderRadius: 14, padding: '1.5rem'
        }}>
          <SectionHeader title="Students per Batch" icon="📈" />
          {batchChart.length === 0 ? (
            <p style={{ color: '#555', textAlign: 'center', padding: '3rem 0' }}>No batch data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={batchChart} margin={{ top: 5, right: 10, bottom: 30, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                <XAxis dataKey="batch" stroke="#718096" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                <YAxis stroke="#718096" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="students" fill="#6C63FF" radius={[6, 6, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart: Enrollment Status */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          border: '1px solid #48BB7822', borderRadius: 14, padding: '1.5rem'
        }}>
          <SectionHeader title="Student Status" icon="🥧" />
          {statusData.length === 0 ? (
            <p style={{ color: '#555', textAlign: 'center', padding: '3rem 0' }}>No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="45%" innerRadius={60} outerRadius={90}
                  dataKey="value" nameKey="name" paddingAngle={3}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, color: '#aaa' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Assignment Stats Bar Chart */}
      {assignments.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          border: '1px solid #F6AD5522', borderRadius: 14, padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <SectionHeader title="Assignment Submission Rates" icon="📋" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={assignments} margin={{ top: 5, right: 10, bottom: 30, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
              <XAxis dataKey="title" stroke="#718096" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
              <YAxis stroke="#718096" tick={{ fontSize: 11 }} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="submission_rate" fill="#F6AD55" radius={[6, 6, 0, 0]} name="Submission Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Student Progress Table */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        border: '1px solid #63B3ED22', borderRadius: 14, padding: '1.5rem'
      }}>
        <SectionHeader title="Student Progress" icon="🎓" />
        {students.length === 0 ? (
          <p style={{ color: '#555', textAlign: 'center', padding: '2rem 0' }}>No students enrolled yet</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a2a4a' }}>
                  {['Student', 'Batch', 'Course', 'Status', 'Avg Score', 'Exams', 'Submitted', 'Graded'].map(h => (
                    <th key={h} style={{
                      padding: '10px 12px', textAlign: 'left',
                      color: '#718096', fontWeight: 600, whiteSpace: 'nowrap'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s.student_id} style={{
                    borderBottom: '1px solid #1e1e3a',
                    background: i % 2 === 0 ? 'transparent' : '#ffffff05'
                  }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{s.student_name}</div>
                      <div style={{ color: '#718096', fontSize: '0.75rem' }}>{s.student_email}</div>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#aaa' }}>{s.batch}</td>
                    <td style={{ padding: '10px 12px', color: '#aaa' }}>{s.course}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                        background: s.status === 'completed' ? '#48BB7822' : s.status === 'active' ? '#6C63FF22' : '#FC818122',
                        color: s.status === 'completed' ? '#48BB78' : s.status === 'active' ? '#6C63FF' : '#FC8181',
                      }}>{s.status}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: s.avg_exam_score >= 60 ? '#48BB78' : '#FC8181', fontWeight: 700 }}>
                      {s.avg_exam_score > 0 ? `${s.avg_exam_score}%` : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#aaa', textAlign: 'center' }}>{s.exams_taken}</td>
                    <td style={{ padding: '10px 12px', color: '#aaa', textAlign: 'center' }}>{s.assignments_submitted}</td>
                    <td style={{ padding: '10px 12px', color: '#48BB78', textAlign: 'center' }}>{s.assignments_graded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
