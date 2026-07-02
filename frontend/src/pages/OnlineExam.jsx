import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Clock, CheckCircle, ChevronRight, 
  ChevronLeft, Award, BarChart3, RotateCcw, Play,
  Zap, Brain, Target, Star, Users, Plus, Trash2,
  BookOpen, Edit3, X, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://127.0.0.1:8000/api' 
  : 'https://kravia.onrender.com/api');

/* ─── Admin: Create Exam Modal ─── */
const CreateExamModal = ({ onClose, onCreated, userEmail }) => {
  const [step, setStep] = useState(1); // 1=exam info, 2=questions
  const [examInfo, setExamInfo] = useState({ title: '', domain: '', difficulty: 'Beginner', timer: 300 });
  const [questions, setQuestions] = useState([
    { text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', marks: 10 }
  ]);
  const [saving, setSaving] = useState(false);

  const addQuestion = () => setQuestions(prev => [
    ...prev,
    { text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', marks: 10 }
  ]);

  const removeQuestion = (idx) => setQuestions(prev => prev.filter((_, i) => i !== idx));

  const updateQuestion = (idx, field, val) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: val } : q));
  };

  const handleSubmit = async () => {
    if (!examInfo.title || !examInfo.domain) { toast.error('Title and domain are required'); return; }
    if (questions.some(q => !q.text || !q.option_a || !q.option_b || !q.option_c || !q.option_d)) {
      toast.error('All question fields must be filled'); return;
    }
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/exam/create/`, {
        ...examInfo,
        questions,
        email: userEmail
      });
      toast.success('Exam created successfully!');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create exam');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#1a1b23] border border-white/10 rounded-3xl w-full max-w-3xl my-8 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 bg-indigo-600/10">
          <div>
            <h2 className="text-2xl font-black text-white">Create New Exam</h2>
            <p className="text-slate-400 text-sm mt-1">Step {step} of 2 — {step === 1 ? 'Exam Details' : 'Add Questions'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10">
            <X size={22} />
          </button>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Exam Title *</label>
                  <input
                    value={examInfo.title}
                    onChange={e => setExamInfo(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Python Basics Certification"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Domain *</label>
                  <input
                    value={examInfo.domain}
                    onChange={e => setExamInfo(p => ({ ...p, domain: e.target.value }))}
                    placeholder="e.g. Python, ReactJS, General"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Difficulty</label>
                  <select
                    value={examInfo.difficulty}
                    onChange={e => setExamInfo(p => ({ ...p, difficulty: e.target.value }))}
                    className="w-full bg-[#1a1b23] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Time per Question (seconds)</label>
                  <input
                    type="number"
                    value={examInfo.timer}
                    onChange={e => setExamInfo(p => ({ ...p, timer: parseInt(e.target.value) || 60 }))}
                    min={30}
                    max={600}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!examInfo.title || !examInfo.domain}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all mt-4"
              >
                Next: Add Questions →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-400 font-bold text-sm uppercase tracking-widest">Question {idx + 1}</span>
                    {questions.length > 1 && (
                      <button onClick={() => removeQuestion(idx)} className="text-rose-400 hover:text-rose-300 transition-colors p-1.5 rounded-lg hover:bg-rose-500/10">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={q.text}
                    onChange={e => updateQuestion(idx, 'text', e.target.value)}
                    placeholder="Enter question text..."
                    rows={2}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    {['A','B','C','D'].map(opt => (
                      <div key={opt} className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${q.correct_option === opt ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-400'}`}>{opt}</span>
                        <input
                          value={q[`option_${opt.toLowerCase()}`]}
                          onChange={e => updateQuestion(idx, `option_${opt.toLowerCase()}`, e.target.value)}
                          placeholder={`Option ${opt}`}
                          className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-sm font-medium">Correct:</span>
                      {['A','B','C','D'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => updateQuestion(idx, 'correct_option', opt)}
                          className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${q.correct_option === opt ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
                        >{opt}</button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-slate-400 text-sm">Marks:</span>
                      <input
                        type="number"
                        value={q.marks}
                        onChange={e => updateQuestion(idx, 'marks', parseInt(e.target.value) || 1)}
                        min={1}
                        className="w-16 bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500 text-center"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addQuestion}
                className="w-full py-3 border border-dashed border-white/20 text-slate-400 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Plus size={16} /> Add Another Question
              </button>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setStep(1)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all">
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><BookOpen size={18} /> Save Exam</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

/* ─── Admin Exam Card ─── */
const AdminExamCard = ({ exam, onDelete, idx }) => {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const userEmail = localStorage.getItem('userEmail');

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${exam.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_BASE}/exam/delete/${exam.id}/?email=${userEmail}`);
      toast.success('Exam deleted');
      onDelete(exam.id);
    } catch {
      toast.error('Failed to delete exam');
    } finally {
      setDeleting(false);
    }
  };

  const difficultyColor = { Beginner: 'text-emerald-400 bg-emerald-500/10', Intermediate: 'text-amber-400 bg-amber-500/10', Expert: 'text-red-400 bg-red-500/10' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08 }}
      className="bg-[var(--glass)] border border-[var(--border)] rounded-2xl overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${difficultyColor[exam.difficulty] || 'text-slate-400 bg-white/5'}`}>
                {exam.difficulty}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-400 bg-indigo-500/10">
                {exam.domain}
              </span>
            </div>
            <h3 className="text-lg font-black text-white truncate">{exam.title}</h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><Target size={14} /> {exam.questions?.length || 0} Questions</span>
              <span className="flex items-center gap-1.5"><Star size={14} /> {exam.total_marks} Marks</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setExpanded(p => !p)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            >
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all disabled:opacity-50"
            >
              {deleting ? <div className="w-4 h-4 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" /> : <Trash2 size={18} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 overflow-hidden"
          >
            <div className="p-6 pt-4 space-y-3">
              {exam.questions?.map((q, qi) => (
                <div key={q.id} className="p-4 bg-white/3 rounded-xl border border-white/5">
                  <p className="text-slate-300 text-sm font-medium mb-2"><span className="text-indigo-400 mr-2">Q{qi+1}.</span>{q.text}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['A','B','C','D'].map(opt => (
                      <div key={opt} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${q.correct_option === opt ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-500'}`}>
                        <span className="font-bold w-4">{opt}.</span>
                        <span>{q[`option_${opt.toLowerCase()}`]}</span>
                        {q.correct_option === opt && <CheckCircle size={12} className="ml-auto flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─── Main Component ─── */
const OnlineExam = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin' || user?.role === 'trainer';

  const [examState, setExamState] = useState('selection');
  const [exams, setExams] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [domain, setDomain] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const hasFetchedRef = useRef(false);

  const fetchExams = useCallback(async () => {
    if (!user || !user.email) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/student/exams/`, {
        params: { email: user.email }
      });
      setExams(res.data.exams || []);
      setDomain(res.data.domain || '');
    } catch (err) {
      console.error('Failed to fetch exams', err);
      toast.error('Failed to load exams. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchLeaderboard = useCallback(async () => {
    if (!user || !user.email) return;
    try {
      const res = await axios.get(`${API_BASE}/exam/leaderboard/`, {
        params: { email: user.email }
      });
      setLeaderboard(res.data.leaderboard || []);
    } catch (err) {
      console.error('Failed to fetch leaderboard');
    }
  }, [user]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    if (user && user.email) {
      hasFetchedRef.current = true;
      fetchExams();
      fetchLeaderboard();
    }
  }, [user, fetchExams, fetchLeaderboard]);

  const startExam = (exam) => {
    setSelectedSubject(exam);
    setExamState('active');
    setCurrentQuestion(0);
    setAnswers({});
    setTimeLeft(60);
  };

  const handleAnswer = (optionIndex) => {
    const choice = String.fromCharCode(65 + optionIndex);
    setAnswers({ ...answers, [selectedSubject.questions[currentQuestion].id]: choice });
  };

  const calculateScore = useCallback(async () => {
    if (!selectedSubject || !user || !user.email) return;
    try {
      const res = await axios.post(`${API_BASE}/exam/submit/`, {
        exam_id: selectedSubject.id,
        answers: answers,
        email: user.email
      });
      setScore((res.data.score / res.data.total_marks) * 100);
      setExamState('finished');
      fetchLeaderboard();
      if (res.data.passed) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#6366f1', '#a855f7', '#ec4899'] });
      }
    } catch (err) {
      toast.error('Failed to submit exam');
    }
  }, [answers, selectedSubject, user, fetchLeaderboard]);

  useEffect(() => {
    let timer;
    if (examState === 'active' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && examState === 'active') {
      if (currentQuestion < selectedSubject.questions.length - 1) {
        toast('Time is up! Moving to next question. ⏱️', { icon: '⏰' });
        setCurrentQuestion(prev => prev + 1);
      } else {
        toast.loading('Time is up! Submitting... 📝', { duration: 2000 });
        calculateScore();
      }
    }
    return () => clearInterval(timer);
  }, [examState, timeLeft, currentQuestion, selectedSubject, calculateScore]);

  useEffect(() => {
    if (examState === 'active') setTimeLeft(60);
  }, [currentQuestion, examState]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  /* ─── ADMIN VIEW ─── */
  if (isAdmin) {
    return (
      <div className="p-8 min-h-screen bg-[var(--bg)]">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8 flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-black text-[var(--text-main)] mb-2">Online Exam Management</h1>
              <p className="text-[var(--text-muted)]">Create and manage exams for all domains • Students see exams matching their course</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-600/20"
            >
              <Plus size={18} /> Create Exam
            </button>
          </header>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Exams', value: exams.length, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
              { label: 'Total Questions', value: exams.reduce((a, e) => a + (e.questions?.length || 0), 0), color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Domains Covered', value: [...new Set(exams.map(e => e.domain))].length, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            ].map(stat => (
              <div key={stat.label} className="bg-[var(--glass)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4">
                <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                  <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                </div>
                <span className="text-slate-400 text-sm font-medium">{stat.label}</span>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-[var(--glass)] border border-[var(--border)] rounded-3xl">
              <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                <BookOpen className="text-indigo-400" size={48} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Exams Yet</h3>
              <p className="text-slate-400 mb-8 max-w-md">Create your first exam to get started. Students will see exams based on their enrolled course domain.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all flex items-center gap-2"
              >
                <Plus size={18} /> Create First Exam
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map((exam, idx) => (
                <AdminExamCard
                  key={exam.id}
                  exam={exam}
                  idx={idx}
                  onDelete={(id) => setExams(prev => prev.filter(e => e.id !== id))}
                />
              ))}
            </div>
          )}
        </div>

        <AnimatePresence>
          {showCreateModal && (
            <CreateExamModal
              onClose={() => setShowCreateModal(false)}
              onCreated={() => { hasFetchedRef.current = false; fetchExams(); }}
              userEmail={user?.email}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ─── STUDENT VIEW ─── */
  return (
    <div className="p-8 min-h-screen bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-[var(--text-main)] mb-2">Online Examination</h1>
            <p className="text-[var(--text-muted)]">Test your skills and track your progress</p>
          </div>
          {examState === 'active' && (
            <div className="flex items-center gap-4 bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-2xl">
              <Clock className="text-red-500 animate-pulse" size={20} />
              <span className="text-red-500 font-black text-xl tabular-nums">{formatTime(timeLeft)}</span>
            </div>
          )}
        </header>

        <AnimatePresence mode="wait">
          {examState === 'selection' && (
            <motion.div key="selection" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-[var(--glass)] border border-[var(--border)] rounded-3xl">
                  <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6" />
                  <p className="text-slate-400 font-medium">Loading your exams...</p>
                </div>
              ) : exams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-[var(--glass)] border border-[var(--border)] rounded-3xl">
                  <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="text-indigo-400" size={48} />
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--text-main)] mb-3">No Exams Available</h3>
                  <p className="text-[var(--text-muted)] max-w-md text-lg">No exams have been scheduled yet. Please check back later or contact your admin.</p>
                </div>
              ) : (
                <>
                  {domain && domain !== 'All Domains' && (
                    <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-3">
                      <Target className="text-indigo-400 flex-shrink-0" size={20} />
                      <span className="text-indigo-300 text-sm">Showing exams for your enrolled domain: <strong>{domain}</strong></span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {exams.map((exam) => (
                      <motion.div
                        key={exam.id}
                        whileHover={{ scale: 1.02 }}
                        className="bg-[var(--glass)] border border-[var(--border)] rounded-3xl p-8 relative overflow-hidden group cursor-pointer"
                        onClick={() => startExam(exam)}
                      >
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                          {exam.domain?.toLowerCase().includes('python') ? <Zap size={80} /> : <Brain size={80} />}
                        </div>
                        <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-full uppercase tracking-widest mb-4 inline-block">
                          {exam.difficulty}
                        </span>
                        <h3 className="text-2xl font-black text-[var(--text-main)] mb-2">{exam.title}</h3>
                        <p className="text-slate-500 text-sm mb-4">{exam.domain}</p>
                        <div className="flex gap-6 mt-4">
                          <div className="flex items-center gap-2 text-[var(--text-muted)]">
                            <Target size={16} />
                            <span className="text-sm">{exam.questions?.length || 0} MCQs</span>
                          </div>
                          <div className="flex items-center gap-2 text-[var(--text-muted)]">
                            <Clock size={16} />
                            <span className="text-sm">1 Min / Question</span>
                          </div>
                          <div className="flex items-center gap-2 text-[var(--text-muted)]">
                            <Star size={16} />
                            <span className="text-sm">{exam.total_marks} Marks</span>
                          </div>
                        </div>
                        <button className="mt-8 w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20">
                          <Play size={18} fill="currentColor" /> Start Exam
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {examState === 'active' && selectedSubject && (
            <motion.div 
              key="active"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-[var(--glass)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="h-1.5 w-full bg-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestion + 1) / selectedSubject.questions.length) * 100}%` }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                />
              </div>
              <div className="p-10">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-indigo-400 font-bold tracking-widest uppercase text-xs">
                    Question {currentQuestion + 1} of {selectedSubject.questions.length}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-main)] mb-10 leading-relaxed">
                  {selectedSubject.questions[currentQuestion].text}
                </h2>
                <div className="space-y-4">
                  {['option_a','option_b','option_c','option_d'].map((opt, idx) => {
                    const choice = String.fromCharCode(65 + idx);
                    const isSelected = answers[selectedSubject.questions[currentQuestion].id] === choice;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        className={`w-full p-6 rounded-2xl text-left transition-all border flex items-center gap-4 ${isSelected ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10' : 'bg-white/5 border-white/10 text-[var(--text-muted)] hover:bg-white/10'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${isSelected ? 'bg-indigo-500 text-white' : 'bg-white/10 text-[var(--text-muted)]'}`}>{choice}</div>
                        <span className="font-medium text-lg">{selectedSubject.questions[currentQuestion][opt]}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center mt-12 pt-8 border-t border-white/10">
                  <button disabled={currentQuestion === 0} onClick={() => setCurrentQuestion(p => p - 1)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    <ChevronLeft size={20} /> Previous
                  </button>
                  {currentQuestion === selectedSubject.questions.length - 1 ? (
                    <button onClick={calculateScore} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black rounded-xl hover:scale-105 transition-all shadow-lg shadow-emerald-500/20">
                      Submit Exam
                    </button>
                  ) : (
                    <button onClick={() => setCurrentQuestion(p => p + 1)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all">
                      Next Question <ChevronRight size={20} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {examState === 'finished' && selectedSubject && (
            <motion.div key="finished" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              <div className="bg-[var(--glass)] border border-[var(--border)] rounded-3xl p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                <div className="w-24 h-24 rounded-3xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-8">
                  <Trophy size={48} />
                </div>
                <h2 className="text-4xl font-black text-[var(--text-main)] mb-2">Exam Completed!</h2>
                <p className="text-[var(--text-muted)] mb-10 text-lg">Great job on finishing the {selectedSubject.title} exam.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-10">
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <BarChart3 className="text-indigo-400 mx-auto mb-3" />
                    <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-widest mb-1">Your Score</p>
                    <p className={`text-3xl font-black ${score >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{Math.round(score)}%</p>
                  </div>
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <CheckCircle className="text-emerald-500 mx-auto mb-3" />
                    <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-widest mb-1">Result</p>
                    <p className="text-xl font-black text-[var(--text-main)]">{score >= 70 ? '✅ PASSED' : '❌ FAILED'}</p>
                  </div>
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <Star className="text-purple-400 mx-auto mb-3" />
                    <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-widest mb-1">Questions</p>
                    <p className="text-3xl font-black text-[var(--text-main)]">{selectedSubject.questions.length}</p>
                  </div>
                </div>
                <div className="flex gap-4 justify-center">
                  <button onClick={() => setExamState('selection')} className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all flex items-center gap-2">
                    <RotateCcw size={18} /> Try Another
                  </button>
                  <button onClick={() => navigate('/certificates')} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all flex items-center gap-2">
                    <Award size={18} /> View Certificate
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Leaderboard */}
                <div className="bg-[var(--glass)] border border-[var(--border)] rounded-3xl p-8">
                  <h3 className="text-xl font-bold text-[var(--text-main)] mb-6 flex items-center gap-3">
                    <Users className="text-indigo-500" /> {domain} Leaderboard
                  </h3>
                  <div className="space-y-3">
                    {leaderboard.length === 0 
                      ? <p className="text-center text-slate-500 py-8">No results yet</p>
                      : leaderboard.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-slate-300 text-black' : 'bg-orange-600 text-white'}`}>{idx + 1}</div>
                            <span className="text-white font-medium">{entry.student_name}</span>
                          </div>
                          <span className="text-indigo-400 font-bold">{entry.score}/{entry.total_marks}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>

                {/* Answers Review */}
                <div className="bg-[var(--glass)] border border-[var(--border)] rounded-3xl p-8">
                  <h3 className="text-xl font-bold text-[var(--text-main)] mb-6 flex items-center gap-3">
                    <CheckCircle className="text-emerald-500" /> Quick Summary
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    You completed the {selectedSubject.title} exam with a score of {Math.round(score)}%.
                    {score >= 70 ? ' Excellent! You have a strong grasp of this domain.' : ' Keep practicing and review the questions you missed.'}
                  </p>
                  <button onClick={() => setExamState('selection')} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all">
                    Back to Exams
                  </button>
                </div>
              </div>

              {/* Detailed Q&A Review */}
              <div className="bg-[var(--glass)] border border-[var(--border)] rounded-3xl p-8">
                <h3 className="text-2xl font-bold text-[var(--text-main)] mb-8 flex items-center gap-3">
                  <CheckCircle className="text-emerald-500" size={24} /> Detailed Review
                </h3>
                <div className="space-y-4">
                  {selectedSubject.questions.map((q, idx) => {
                    const userAnswer = answers[q.id];
                    const isCorrect = userAnswer === q.correct_option;
                    return (
                      <div key={idx} className={`p-6 rounded-2xl border space-y-3 ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="text-base font-bold text-[var(--text-main)] leading-relaxed">
                            <span className="text-indigo-400 mr-2">Q{idx+1}.</span>{q.text}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className={`p-3 rounded-xl text-sm ${isCorrect ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                            <span className="font-bold block text-xs uppercase tracking-wider mb-1 text-slate-400">Your Answer</span>
                            <span className="font-semibold">{userAnswer ? `${userAnswer}. ${q[`option_${userAnswer.toLowerCase()}`] || ''}` : 'No Answer'}</span>
                          </div>
                          {!isCorrect && (
                            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm">
                              <span className="font-bold block text-xs uppercase tracking-wider mb-1 text-slate-400">Correct Answer</span>
                              <span className="font-semibold">{q.correct_option}. {q[`option_${q.correct_option.toLowerCase()}`] || ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnlineExam;
