import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Clock, CheckCircle, ChevronRight, 
  ChevronLeft, Award, BarChart3, RotateCcw, Play,
  Zap, Brain, Target, Star, Users
} from 'lucide-react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE = `http://${window.location.hostname}:8000/api`;

const OnlineExam = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [examState, setExamState] = useState('selection'); // selection, active, finished
  const [exams, setExams] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [domain, setDomain] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(null);

  const hasFetchedRef = useRef(false);

  const fetchExams = useCallback(async () => {
    if (!user || !user.email) return;
    try {
      const res = await axios.get(`${API_BASE}/student/exams/`, {
        params: { email: user.email }
      });
      setExams(res.data.exams);
      setDomain(res.data.domain);
    } catch (err) {
      toast.error('Failed to fetch exams');
    }
  }, [user]);

  const fetchLeaderboard = useCallback(async () => {
    if (!user || !user.email) return;
    try {
      const res = await axios.get(`${API_BASE}/exam/leaderboard/`, {
        params: { email: user.email }
      });
      setLeaderboard(res.data.leaderboard);
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
    // Map index 0-3 to A-D
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
      fetchLeaderboard(); // Refresh leaderboard
      
      if (res.data.passed) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#ec4899']
        });
      }
    } catch (err) {
      toast.error('Failed to submit exam');
    }
  }, [answers, selectedSubject, user, fetchLeaderboard]);

  useEffect(() => {
    let timer;
    if (examState === 'active' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && examState === 'active') {
      // Time is up for current question
      if (currentQuestion < selectedSubject.questions.length - 1) {
        toast('Time is up! Moving to the next question. ⏱️', {
          icon: '⏰',
          style: {
            borderRadius: '10px',
            background: 'var(--card)',
            color: 'var(--text-main)',
            border: '1px border var(--border)'
          }
        });
        setCurrentQuestion(prev => prev + 1);
      } else {
        toast.loading('Time is up! Submitting your exam... 📝', { duration: 2000 });
        calculateScore();
      }
    }
    return () => clearInterval(timer);
  }, [examState, timeLeft, currentQuestion, selectedSubject, calculateScore]);

  // Reset timer to 60 seconds whenever currentQuestion changes
  useEffect(() => {
    if (examState === 'active') {
      setTimeLeft(60);
    }
  }, [currentQuestion, examState]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
            <motion.div 
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {exams.map((exam) => (
                <motion.div
                  key={exam.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-[var(--glass)] border border-[var(--border)] rounded-3xl p-8 relative overflow-hidden group cursor-pointer"
                  onClick={() => startExam(exam)}
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    {exam.domain === 'Python' ? <Zap size={80} /> : <Brain size={80} />}
                  </div>
                  <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-full uppercase tracking-widest mb-4 inline-block">
                    {exam.difficulty}
                  </span>
                  <h3 className="text-2xl font-black text-[var(--text-main)] mb-2">{exam.title}</h3>
                  <div className="flex gap-6 mt-6">
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      <Target size={16} />
                      <span className="text-sm">{exam.questions.length} MCQs</span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      <Clock size={16} />
                      <span className="text-sm">1 Min / Question</span>
                    </div>
                  </div>
                  <button className="mt-8 w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20">
                    <Play size={18} fill="currentColor" /> Start Exam
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}

          {examState === 'active' && (
            <motion.div 
              key="active"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-[var(--glass)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Progress Bar */}
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
                  {selectedSubject.questions[currentQuestion].option_a && [
                    selectedSubject.questions[currentQuestion].option_a,
                    selectedSubject.questions[currentQuestion].option_b,
                    selectedSubject.questions[currentQuestion].option_c,
                    selectedSubject.questions[currentQuestion].option_d
                  ].map((option, idx) => {
                    const choice = String.fromCharCode(65 + idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        className={`w-full p-6 rounded-2xl text-left transition-all border flex items-center gap-4 ${
                          answers[selectedSubject.questions[currentQuestion].id] === choice
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                            : 'bg-white/5 border-white/10 text-[var(--text-muted)] hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          answers[selectedSubject.questions[currentQuestion].id] === choice ? 'bg-indigo-500 text-white' : 'bg-white/10 text-[var(--text-muted)]'
                        }`}>
                          {choice}
                        </div>
                        <span className="font-medium text-lg">{option}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center mt-12 pt-8 border-t border-white/10">
                  <button
                    disabled={currentQuestion === 0}
                    onClick={() => setCurrentQuestion(prev => prev - 1)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={20} /> Previous
                  </button>
                  
                  {currentQuestion === selectedSubject.questions.length - 1 ? (
                    <button
                      onClick={calculateScore}
                      className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black rounded-xl hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Submit Exam
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentQuestion(prev => prev + 1)}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all"
                    >
                      Next Question <ChevronRight size={20} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {examState === 'finished' && (
            <motion.div 
              key="finished"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
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
                    <p className={`text-3xl font-black ${score >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{score}%</p>
                  </div>
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <CheckCircle className="text-emerald-500 mx-auto mb-3" />
                    <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-widest mb-1">Accuracy</p>
                    <p className="text-3xl font-black text-[var(--text-main)]">
                      {Math.floor(score/20)}/5
                    </p>
                  </div>
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <Star className="text-purple-400 mx-auto mb-3" />
                    <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-widest mb-1">Status</p>
                    <p className="text-xl font-black text-[var(--text-main)]">{score >= 70 ? 'PASSED' : 'FAILED'}</p>
                  </div>
                </div>

                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => setExamState('selection')}
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all flex items-center gap-2"
                  >
                    <RotateCcw size={18} /> Try Another
                  </button>
                  <button 
                    onClick={() => navigate('/certificates')}
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all flex items-center gap-2"
                  >
                    <Award size={18} /> View Certificate
                  </button>
                </div>
              </div>

              {/* Detailed Result Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[var(--glass)] border border-[var(--border)] rounded-3xl p-8">
                  <h3 className="text-xl font-bold text-[var(--text-main)] mb-6 flex items-center gap-3">
                    <Users className="text-indigo-500" /> {domain} Leaderboard
                  </h3>
                  <div className="space-y-4">
                    {leaderboard.map((entry, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-slate-300 text-black' : 'bg-orange-600 text-white'
                          }`}>
                            {idx + 1}
                          </div>
                          <span className="text-white font-medium">{entry.student_name}</span>
                        </div>
                        <span className="text-indigo-400 font-bold">{entry.score}/{entry.total_marks}</span>
                      </div>
                    ))}
                    {leaderboard.length === 0 && <p className="text-center text-slate-500">No results yet</p>}
                  </div>
                </div>

                <div className="bg-[var(--glass)] border border-[var(--border)] rounded-3xl p-8">
                  <h3 className="text-xl font-bold text-[var(--text-main)] mb-6 flex items-center gap-3">
                    <BarChart3 className="text-indigo-500" /> Exam Summary
                  </h3>
                  <div className="space-y-4">
                    <p className="text-slate-400 text-sm leading-relaxed">
                      You have completed the {selectedSubject.title}. Based on your performance, you scored {score}%. 
                      {score >= 70 ? ' Excellent work! You have a strong grasp of this domain.' : ' Good attempt! Review the questions you missed to improve your score.'}
                    </p>
                    <button 
                      onClick={() => setExamState('selection')}
                      className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              </div>

              {/* Detailed Questions & Answers Review */}
              <div className="bg-[var(--glass)] border border-[var(--border)] rounded-3xl p-8 mt-8 text-left">
                <h3 className="text-2xl font-bold text-[var(--text-main)] mb-8 flex items-center gap-3">
                  <CheckCircle className="text-emerald-500" size={24} /> Detailed Questions & Answers Review
                </h3>
                <div className="space-y-6">
                  {selectedSubject.questions.map((q, idx) => {
                    const userAnswer = answers[q.id];
                    const correctAnswer = q.correct_option;
                    const isCorrect = userAnswer === correctAnswer;
                    
                    return (
                      <div key={idx} className={`p-6 rounded-2xl border ${
                        isCorrect 
                          ? 'bg-emerald-500/5 border-emerald-500/20' 
                          : 'bg-rose-500/5 border-rose-500/20'
                      } space-y-4`}>
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="text-lg font-bold text-[var(--text-main)] leading-relaxed">
                            <span className="text-indigo-400 mr-2">Q{idx + 1}.</span> {q.text}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                            isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className={`p-4 rounded-xl text-sm ${
                            isCorrect 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            <span className="font-bold block text-xs uppercase tracking-wider mb-2 text-slate-400">Your Selection</span>
                            <span className="font-semibold text-base">
                              {userAnswer ? `${userAnswer}. ${q[`option_${userAnswer.toLowerCase()}`] || ''}` : 'No Answer Selected'}
                            </span>
                          </div>
                          
                          {!isCorrect && (
                            <div className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm">
                              <span className="font-bold block text-xs uppercase tracking-wider mb-2 text-slate-400">Correct Answer</span>
                              <span className="font-semibold text-base">
                                {correctAnswer ? `${correctAnswer}. ${q[`option_${correctAnswer.toLowerCase()}`] || ''}` : 'N/A'}
                              </span>
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
