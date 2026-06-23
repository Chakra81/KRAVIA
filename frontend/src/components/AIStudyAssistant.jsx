import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, X, Send, Paperclip, Mic, MicOff, Copy, Download, 
  History, ChevronRight, Sparkles,
  Terminal, FileText, Lightbulb, BookOpen, ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

const API_BASE = `https://kravia.onrender.com/api/ai`;

const AIStudyAssistant = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [savedChats, setSavedChats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizConfig, setQuizConfig] = useState({ subject: 'Python', type: 'MCQs', difficulty: 'Beginner' });
  const [quizState, setQuizState] = useState(null); // { questions, currentIndex, answeredIndices }
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Voice Recognition Setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/history/`, {
        params: { email: user.email }
      });
      setSavedChats(res.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }, [user.email]);

  useEffect(() => {
    if (isOpen && user) {
      fetchHistory();
    }
  }, [isOpen, user, fetchHistory]);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, scrollToBottom]);

  // --- Quiz helpers ---
  const handleShowAnswer = useCallback((questionIndex) => {
    if (!quizState) return;
    const idx = questionIndex ?? quizState.currentIndex;
    if (quizState.answeredIndices.includes(idx)) return; // already answered
    
    const current = quizState.questions[idx];
    if (!current) return;

    setTimeout(() => {
      setChatHistory(ch => {
        const exists = ch.some(m => m.type === 'quiz-answer' && m.questionIndex === idx);
        if (exists) return ch;
        return [...ch, {
          role: 'ai',
          type: 'quiz-answer',
          data: { 
            isCorrect: false,
            userAnswer: null,
            answer: current.answer, 
            explanation: current.explanation 
          },
          hasMore: idx < quizState.questions.length - 1,
          questionIndex: idx,
        }];
      });
    }, 0);

    setQuizState(prev => {
      if (!prev) return prev;
      if (prev.answeredIndices.includes(idx)) return prev;
      return { 
        ...prev, 
        answeredIndices: [...prev.answeredIndices, idx],
        selectedAnswers: { ...prev.selectedAnswers, [idx]: null }
      };
    });
  }, [quizState]);

  const handleSelectOption = useCallback((questionIndex, chosenLetter) => {
    if (!quizState) return;
    if (quizState.answeredIndices.includes(questionIndex)) return;

    const current = quizState.questions[questionIndex];
    if (!current) return;

    const isCorrect = chosenLetter === current.answer;

    if (isCorrect) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.85 } });
      toast.success('Correct answer! 🎉');
    } else {
      toast.error(`Wrong answer! The correct choice is ${current.answer}.`);
    }

    // Add feedback and explanation to the chat stream
    setTimeout(() => {
      setChatHistory(ch => {
        const exists = ch.some(m => m.type === 'quiz-answer' && m.questionIndex === questionIndex);
        if (exists) return ch;
        return [...ch, {
          role: 'ai',
          type: 'quiz-answer',
          data: { 
            isCorrect,
            userAnswer: chosenLetter,
            answer: current.answer, 
            explanation: current.explanation 
          },
          hasMore: questionIndex < quizState.questions.length - 1,
          questionIndex: questionIndex,
        }];
      });
    }, 300);

    setQuizState(prev => {
      if (!prev) return prev;
      if (prev.answeredIndices.includes(questionIndex)) return prev;
      return {
        ...prev,
        answeredIndices: [...prev.answeredIndices, questionIndex],
        selectedAnswers: { ...prev.selectedAnswers, [questionIndex]: chosenLetter }
      };
    });
  }, [quizState]);

  const handleNextQuestion = useCallback(() => {
    if (!quizState) return;
    const nextIndex = quizState.currentIndex + 1;
    
    if (nextIndex >= quizState.questions.length) {
      setTimeout(() => {
        setChatHistory(ch => {
          const exists = ch.some(m => m.role === 'ai' && m.content && m.content.includes('Quiz Complete!'));
          if (exists) return ch;
          return [...ch, { role: 'ai', content: '🎉 **Quiz Complete!** You answered all questions. Well done!' }];
        });
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
      }, 0);
      setQuizState(null);
      return;
    }
    
    const nextQ = quizState.questions[nextIndex];
    setTimeout(() => {
      setChatHistory(ch => {
        const exists = ch.some(m => m.type === 'quiz-question' && m.questionIndex === nextIndex);
        if (exists) return ch;
        return [...ch, {
          role: 'ai',
          type: 'quiz-question',
          data: { ...nextQ, index: nextIndex, total: quizState.questions.length },
          questionIndex: nextIndex,
        }];
      });
    }, 0);

    setQuizState(prev => {
      if (!prev) return prev;
      return { ...prev, currentIndex: nextIndex };
    });
  }, [quizState]);

  // --- Main send ---
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!message.trim() || isLoading) return;

    const trimmed = message.trim();
    const userMsg = { role: 'user', content: trimmed };
    setChatHistory(prev => [...prev, userMsg]);
    setMessage('');

    // If quiz is active, check if user is asking for the answer
    if (quizState) {
      const lower = trimmed.toLowerCase();
      const isAnswerRequest =
        /^[abcd]$/i.test(lower) ||
        lower.includes('answer') ||
        lower.includes('reveal') ||
        lower.includes('show') ||
        lower.includes('solution') ||
        lower.includes('correct');
      if (isAnswerRequest) {
        handleShowAnswer(quizState.currentIndex);
        return;
      }
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/chat/`, {
        message: trimmed,
        email: user.email
      });
      const aiMsg = { role: 'ai', content: res.data.response };
      setChatHistory(prev => [...prev, aiMsg]);
      if (res.data.response.toLowerCase().includes('congratulations') ||
          res.data.response.toLowerCase().includes('great job')) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) {
      toast.error('AI is taking a break. Try again later!');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', user.email);

    try {
      const res = await axios.post(`${API_BASE}/summarize/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setChatHistory(prev => [
        ...prev, 
        { role: 'user', content: `Summarize PDF: ${file.name}` },
        { role: 'ai', content: res.data.summary }
      ]);
      toast.success('PDF summarized successfully!');
    } catch (err) {
      toast.error('Failed to summarize PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceInput = () => {
    if (!recognition) {
      toast.error('Voice recognition not supported in this browser');
      return;
    }

    setIsListening(true);
    recognition.start();
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const downloadAsPDF = (content) => {
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(content, 180);
    doc.text(splitText, 10, 10);
    doc.save('ai_notes.pdf');
    toast.success('Notes downloaded as PDF');
  };

  const getRecommendations = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/recommend/`, {
        params: { email: user.email }
      });
      setChatHistory(prev => [
        ...prev,
        { role: 'user', content: 'Give me some personalized recommendations' },
        { role: 'ai', content: res.data.recommendations }
      ]);
    } catch (err) {
      toast.error('Failed to get recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSpecializedQuiz = async () => {
    setShowQuizModal(false);
    setShowHistory(false);
    setIsLoading(true);
    setChatHistory(prev => [...prev, { role: 'user', content: `Generate ${quizConfig.difficulty} ${quizConfig.subject} quiz (${quizConfig.type})` }]);

    const prompt = `You are a quiz generator. Create a 5-question ${quizConfig.type} quiz on ${quizConfig.subject} at ${quizConfig.difficulty} level.
Return ONLY a valid JSON object — no markdown, no extra text:
{"quiz":[{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"B","explanation":"..."}]}`;

    try {
      const res = await axios.post(`${API_BASE}/chat/`, { message: prompt, email: user.email });
      let raw = res.data.response;
      // Extract JSON even if wrapped in markdown code block
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : raw;
      const parsed = JSON.parse(jsonStr.trim());
      const questions = parsed.quiz;
      setQuizState({ questions, currentIndex: 0, answeredIndices: [], selectedAnswers: {} });
      setChatHistory(prev => [...prev, {
        role: 'ai',
        type: 'quiz-question',
        data: { ...questions[0], index: 0, total: questions.length },
        questionIndex: 0,
      }]);
      toast.success('Quiz ready! Answer each question, then reveal the answer.');
    } catch (err) {
      toast.error('Failed to generate quiz. Try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: 'Explain Code', icon: <Terminal size={14} />, prompt: 'Explain this code for me: ' },
    { label: 'Interview Prep', icon: <Lightbulb size={14} />, prompt: 'Give me some interview questions for ' },
    { label: 'Generate Quiz', icon: <BookOpen size={14} />, action: () => setShowQuizModal(true) },
    { label: 'Summarize', icon: <FileText size={14} />, prompt: 'Summarize the concept of ' },
    { label: 'Recommendations', icon: <Sparkles size={14} />, action: getRecommendations },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xl flex items-center justify-center z-50 border border-white/20 backdrop-blur-md"
      >
        <Bot size={32} />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white"
        />
      </motion.button>

      {/* Main Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-28 right-8 w-[450px] h-[650px] rounded-3xl overflow-hidden z-50 border border-white/20 shadow-2xl flex flex-col bg-[#0f172a]/90 backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="p-5 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Study Assistant</h3>
                  <p className="text-indigo-400 text-xs font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Powered by Gemini AI
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(chatHistory.length > 0 || quizState) && (
                  <button 
                    onClick={() => {
                      setChatHistory([]);
                      setQuizState(null);
                      setShowQuizModal(false);
                      setShowHistory(false);
                    }}
                    title="Back to Menu"
                    className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors flex items-center gap-1 text-xs font-bold mr-1"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                )}
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <History size={20} />
                </button>
                <button 
                  onClick={() => {
                    setShowQuizModal(true);
                    setShowHistory(false); // Close history when opening quiz
                  }}
                  title="Generate Quiz"
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <BookOpen size={20} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden flex">
              {/* Chat Messages */}
              <div className="flex-1 flex flex-col overflow-y-auto p-5 space-y-4 custom-scrollbar">
                {chatHistory.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-2">
                      <Sparkles size={40} />
                    </div>
                    <h4 className="text-white font-bold text-xl">How can I help you today?</h4>
                    <p className="text-slate-400 text-sm">
                      Ask me to explain concepts, generate quizzes, or summarize your PDFs.
                    </p>
                    <div className="grid grid-cols-2 gap-2 w-full">
                      {quickActions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (action.action) {
                              setShowHistory(false); // Close history for actions
                              action.action();
                            } else {
                              setMessage(action.prompt);
                            }
                          }}
                          className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs hover:bg-white/10 transition-all flex items-center gap-2"
                        >
                          {action.icon}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {chatHistory.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[90%] rounded-2xl p-4 ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-none'
                    }`}>

                      {/* Quiz Question Card */}
                      {msg.type === 'quiz-question' ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                              Question {msg.data.index + 1} / {msg.data.total}
                            </span>
                            <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{quizConfig.type}</span>
                          </div>
                          <p className="text-white font-semibold text-sm leading-relaxed">{msg.data.question}</p>
                          <div className="space-y-2">
                            {(msg.data.options || []).map((opt, j) => {
                              const letter = String.fromCharCode(65 + j); // A, B, C, D
                              const isAnswered = quizState?.answeredIndices.includes(msg.questionIndex);
                              const isUserSelection = quizState?.selectedAnswers?.[msg.questionIndex] === letter;
                              const isCorrectAnswer = msg.data.answer === letter;
                              
                              let buttonStyle = "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10";
                              if (isAnswered) {
                                if (isCorrectAnswer) {
                                  buttonStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-semibold";
                                } else if (isUserSelection) {
                                  buttonStyle = "bg-rose-500/20 border-rose-500 text-rose-400 font-semibold";
                                } else {
                                  buttonStyle = "bg-white/5 border-white/5 text-slate-500 opacity-60";
                                }
                              }
                              
                              return (
                                <button
                                  key={j}
                                  disabled={isAnswered}
                                  onClick={() => handleSelectOption(msg.questionIndex, letter)}
                                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-center gap-3 ${buttonStyle}`}
                                >
                                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                                    isAnswered 
                                      ? isCorrectAnswer 
                                        ? 'bg-emerald-500 text-white' 
                                        : isUserSelection 
                                          ? 'bg-rose-500 text-white' 
                                          : 'bg-white/5 text-slate-600'
                                      : 'bg-white/10 text-slate-400'
                                  }`}>
                                    {letter}
                                  </span>
                                  <span>{opt.replace(/^[A-D]\.\s*/, '')}</span>
                                </button>
                              );
                            })}
                          </div>
                          {quizState && !quizState.answeredIndices.includes(msg.questionIndex) && (
                            <button
                              onClick={() => handleShowAnswer(msg.questionIndex)}
                              className="w-full mt-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition-all"
                            >
                              💡 Reveal Answer
                            </button>
                          )}
                        </div>

                      ) : msg.type === 'quiz-answer' ? (
                        /* Quiz Answer Card */
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            {msg.data.userAnswer === null ? (
                              <>
                                <span className="text-amber-400 text-base">💡</span>
                                <span className="text-white font-bold text-sm">Correct Answer: {msg.data.answer}</span>
                              </>
                            ) : msg.data.isCorrect ? (
                              <>
                                <span className="text-emerald-400 text-base">🎉</span>
                                <span className="text-emerald-400 font-bold text-sm">Correct! You chose {msg.data.userAnswer}</span>
                              </>
                            ) : (
                              <>
                                <span className="text-rose-400 text-base">❌</span>
                                <span className="text-rose-400 font-bold text-sm">Incorrect. You chose {msg.data.userAnswer}, Correct: {msg.data.answer}</span>
                              </>
                            )}
                          </div>
                          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Explanation</p>
                            <p className="text-slate-300 text-sm leading-relaxed">{msg.data.explanation}</p>
                          </div>
                          {msg.hasMore ? (
                            <button
                              onClick={handleNextQuestion}
                              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                            >
                              Next Question <ChevronRight size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={handleNextQuestion}
                              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold hover:opacity-90 transition-all"
                            >
                              🎉 Finish Quiz
                            </button>
                          )}
                        </div>

                      ) : (
                        /* Regular message */
                        <>
                          <div className="text-sm prose prose-invert">
                            <ReactMarkdown
                              components={{
                                code({node, inline, className, children, ...props}) {
                                  const match = /language-(\w+)/.exec(className || '')
                                  return !inline && match ? (
                                    <SyntaxHighlighter style={atomDark} language={match[1]} PreTag="div" {...props}>
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code className={className} {...props}>{children}</code>
                                  )
                                }
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                          {msg.role === 'ai' && (
                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10">
                              <button onClick={() => copyToClipboard(msg.content)} className="text-slate-500 hover:text-white transition-colors"><Copy size={14} /></button>
                              <button onClick={() => downloadAsPDF(msg.content)} className="text-slate-500 hover:text-white transition-colors"><Download size={14} /></button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-4 flex items-center gap-3">
                      <div className="flex gap-1">
                        <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-2 h-2 bg-indigo-500 rounded-full" />
                        <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-indigo-500 rounded-full" />
                        <motion.span animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-indigo-500 rounded-full" />
                      </div>
                      <span className="text-slate-400 text-xs font-medium italic">Assistant is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* History Sidebar */}
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    className="absolute inset-0 bg-[#0f172a] z-20 border-l border-white/10 p-5 flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-white font-bold">Chat History</h4>
                      <button onClick={() => setShowHistory(false)} className="text-slate-400">
                        <ChevronRight size={20} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                      {savedChats.length === 0 && <p className="text-slate-500 text-sm text-center">No history yet.</p>}
                      {savedChats.map((chat, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setChatHistory([{ role: 'user', content: chat.message }, { role: 'ai', content: chat.ai_response }]);
                            setShowHistory(false);
                          }}
                          className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                        >
                          <p className="text-white text-sm font-medium line-clamp-1 group-hover:text-indigo-400 transition-colors">{chat.message}</p>
                          <p className="text-slate-500 text-xs mt-1">{new Date(chat.created_at).toLocaleDateString()}</p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quiz Configuration Modal */}
              <AnimatePresence>
                {showQuizModal && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute inset-0 bg-[#0f172a]/95 z-30 p-6 flex flex-col items-center justify-center"
                  >
                    <div className="w-full max-w-sm space-y-6">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-4">
                          <BookOpen size={32} />
                        </div>
                        <h4 className="text-white font-bold text-xl">Quiz Generator</h4>
                        <p className="text-slate-400 text-sm">Customize your practice session</p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Subject</label>
                          <div className="flex gap-2">
                            {['Python', 'Java', 'SQL'].map(s => (
                              <button 
                                key={s} 
                                onClick={() => setQuizConfig({...quizConfig, subject: s})}
                                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border ${quizConfig.subject === s ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Type</label>
                          <div className="flex gap-2">
                            {['MCQs', 'Coding', 'Mixed'].map(t => (
                              <button 
                                key={t} 
                                onClick={() => setQuizConfig({...quizConfig, type: t})}
                                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border ${quizConfig.type === t ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Difficulty</label>
                          <div className="flex gap-2">
                            {['Beginner', 'Intermediate', 'Expert'].map(d => (
                              <button 
                                key={d} 
                                onClick={() => setQuizConfig({...quizConfig, difficulty: d})}
                                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border ${quizConfig.difficulty === d ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button 
                          onClick={() => setShowQuizModal(false)}
                          className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={generateSpecializedQuiz}
                          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="p-5 bg-white/5 border-t border-white/10">
              <form onSubmit={handleSend} className="relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me anything..."
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-5 pr-32 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="p-2 text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    <Paperclip size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={startVoiceInput}
                    className={`p-2 transition-colors ${isListening ? 'text-rose-500 animate-pulse' : 'text-slate-400 hover:text-indigo-400'}`}
                  >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                  <button
                    type="submit"
                    disabled={!message.trim() || isLoading}
                    className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all ml-1"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept=".pdf"
              />
              <p className="text-[10px] text-slate-500 text-center mt-3 uppercase tracking-widest font-bold">
                Personalized Learning Assistant
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </>
  );
};

export default AIStudyAssistant;
