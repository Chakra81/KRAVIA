import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Save, Sparkles, LayoutTemplate, Briefcase, GraduationCap, Code, FileText, User as UserIcon, Plus, Trash2, CheckCircle2, Clock, RefreshCw, Award, History } from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import ResumePreview from './ResumePreview';
import ATSChecker from './ATSChecker';

const TABS_LIST = [
  { id: 'personal', icon: UserIcon, label: 'Info' },
  { id: 'experience', icon: Briefcase, label: 'Experience' },
  { id: 'projects', icon: Code, label: 'Projects' },
  { id: 'education', icon: GraduationCap, label: 'Education' },
  { id: 'skills', icon: FileText, label: 'Skills' },
  { id: 'additional', icon: Plus, label: 'Additional' },
  { id: 'history', icon: History, label: 'Downloads' },
];

const ResumeBuilder = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [careerReadiness, setCareerReadiness] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const autoSaveTimer = useRef(null);
  
  const [resumeData, setResumeData] = useState({
    phone: '', address: '', linkedin: '', github: '', portfolio: '',
    summary: '', template: 'modern', ats_score: 0,
    education_details: [], skills: [], projects: [], experiences: [],
    certifications: [], achievements: [], languages: [], interests: [], references: []
  });
  
  const [activeTab, setActiveTab] = useState('personal'); // personal, experience, projects, education, skills, additional
  const previewRef = useRef(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
      fetchResume(userData.email);
    }
  }, []);

  // Debounced autosave — triggers 3 seconds after last change
  const triggerAutoSave = useCallback((data, email) => {
    if (!email) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setAutoSaveStatus('saving');
    autoSaveTimer.current = setTimeout(async () => {
      try {
        const payload = { ...data, email };
        await axios.post(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/resume/update/`, payload);
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      } catch {
        setAutoSaveStatus('error');
      }
    }, 3000);
  }, []);

  const fetchResume = async (email) => {
    try {
      setLoading(true);
      const res = await axios.get(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/resume/?email=${email}`);
      setResumeData(prev => ({ ...prev, ...res.data }));
    } catch (err) {
      console.error('Error fetching resume', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await axios.post(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/resume/import-data/`, { email: user.email });
      setResumeData(prev => ({ ...prev, ...res.data }));
      toast.success('Platform data imported successfully!');
    } catch (err) {
      console.error('Error importing data', err);
      toast.error('Failed to import data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = { ...resumeData, email: user.email };
      const res = await axios.post(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/resume/update/`, payload);
      setResumeData(prev => ({ ...prev, ...res.data }));
      toast.success('Resume saved successfully!');
    } catch (err) {
      console.error('Error saving resume', err);
      toast.error('Failed to save resume.');
    } finally {
      setSaving(false);
    }
  };

  // Full resume validation across all tabs before final submit
  const validateFullResume = () => {
    // --- Personal Info ---
    if (!resumeData.phone?.trim()) {
      toast.error('Personal Info: Phone number is required.');
      setActiveTab('personal');
      return false;
    }
    if (!resumeData.address?.trim()) {
      toast.error('Personal Info: Address is required.');
      setActiveTab('personal');
      return false;
    }
    if (!resumeData.summary?.trim() || resumeData.summary.trim().length < 30) {
      toast.error('Personal Info: Professional summary is required (min 30 characters).');
      setActiveTab('personal');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    // Validate entire resume before submitting
    if (!validateFullResume()) return;

    try {
      setSaving(true);
      const payload = { ...resumeData, email: user.email };
      const res = await axios.post(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/resume/update/`, payload);
      setResumeData(prev => ({ ...prev, ...res.data }));
      setIsSubmitted(true);
      // Refresh / clear the UI state for a fresh start
      setResumeData({
        phone: '', address: '', linkedin: '', github: '', portfolio: '',
        summary: '', template: 'modern', ats_score: 0,
        education_details: [], skills: [], projects: [], experiences: [],
        certifications: [], achievements: [], languages: [], interests: [], references: []
      });
      setCareerReadiness(null);
      setActiveTab('personal');
      toast.success('Resume submitted successfully! Form refreshed for a new resume. 🎉');
    } catch (err) {
      console.error('Error submitting resume', err);
      toast.error('Failed to submit resume.');
    } finally {
      setSaving(false);
    }
  };


  const handleDownload = async () => {
    if (!previewRef.current) return;
    
    // Notify backend
    try {
      await axios.post(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/resume/download/`, { email: user?.email });
      // Fetch resume again to get the updated versions list
      fetchResume(user?.email);
    } catch(e) {}

    // Generate PDF on frontend
    const element = previewRef.current;
    
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${user?.first_name || 'Student'}_Resume.pdf`);
  };

  const handleRestoreVersion = async (versionId) => {
    try {
      setLoading(true);
      await axios.post(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/resume/restore-version/`, { email: user.email, version_id: versionId });
      toast.success('Successfully opened downloaded resume!');
      fetchResume(user.email);
    } catch (err) {
      console.error('Error restoring version', err);
      toast.error('Failed to open resume.');
    } finally {
      setLoading(false);
    }
  };

  const autoGenerateSummary = async () => {
    try {
      setGeneratingSummary(true);
      const res = await axios.post(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/resume/generate-summary/`, {
        skills: resumeData.skills.map(s => s.skill_name),
        projects: resumeData.projects
      });
      setResumeData(prev => ({ ...prev, summary: res.data.summary }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate summary');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const updateField = (field, value) => {
    setResumeData(prev => {
      const updated = { ...prev, [field]: value };
      triggerAutoSave(updated, user?.email);
      return updated;
    });
  };

  const addItem = (field, emptyObj) => {
    setResumeData(prev => {
      const updated = { ...prev, [field]: [...prev[field], emptyObj] };
      triggerAutoSave(updated, user?.email);
      return updated;
    });
  };

  const updateItem = (field, index, key, value) => {
    setResumeData(prev => {
      const newItems = [...prev[field]];
      newItems[index] = { ...newItems[index], [key]: value };
      const updated = { ...prev, [field]: newItems };
      triggerAutoSave(updated, user?.email);
      return updated;
    });
  };

  const removeItem = (field, index) => {
    setResumeData(prev => {
      const newItems = [...prev[field]];
      newItems.splice(index, 1);
      const updated = { ...prev, [field]: newItems };
      triggerAutoSave(updated, user?.email);
      return updated;
    });
  };

  const handleDeleteResume = async () => {
    try {
      setLoading(true);
      await axios.delete(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/resume/delete/?email=${user.email}`);
      // Reset to blank state
      setResumeData({
        phone: '', address: '', linkedin: '', github: '', portfolio: '',
        summary: '', template: 'modern', ats_score: 0,
        education_details: [], skills: [], projects: [], experiences: [],
        certifications: [], achievements: [], languages: [], interests: [], references: []
      });
      setCareerReadiness(null);
      setShowDeleteModal(false);
      toast.success('Resume deleted successfully.');
    } catch (err) {
      toast.error('Failed to delete resume.');
    } finally {
      setLoading(false);
    }
  };

  const computeCareerReadiness = () => {
    let score = 0;
    const tips = [];
    if (resumeData.summary?.length > 50) score += 15; else tips.push('Add a professional summary (min 50 chars)');
    if (resumeData.phone) score += 5; else tips.push('Add your phone number');
    if (resumeData.linkedin) score += 5; else tips.push('Add your LinkedIn profile');
    if (resumeData.github) score += 5; else tips.push('Add your GitHub profile');
    if ((resumeData.education_details || []).length > 0) score += 15; else tips.push('Add your education details');
    if ((resumeData.skills || []).length >= 5) score += 15; else tips.push('Add at least 5 skills');
    if ((resumeData.projects || []).length > 0) score += 20; else tips.push('Add at least 1 project');
    if ((resumeData.experiences || []).length > 0) score += 10; else tips.push('Add work or internship experience');
    if ((resumeData.certifications || []).length > 0) score += 5; else tips.push('Add certifications');
    if ((resumeData.achievements || []).length > 0) score += 5; else tips.push('Add achievements or awards');
    setCareerReadiness({ score, tips });
  };

  // Validate required fields per tab before proceeding
  const validateCurrentTab = () => {
    switch (activeTab) {
      case 'personal': {
        if (!resumeData.phone?.trim()) {
          toast.error('Phone number is required.');
          return false;
        }
        if (!resumeData.address?.trim()) {
          toast.error('Address is required.');
          return false;
        }
        if (!resumeData.summary?.trim() || resumeData.summary.trim().length < 30) {
          toast.error('Professional summary is required (min 30 characters).');
          return false;
        }
        return true;
      }
      default:
        return true;
    }
  };

  const handleNextTab = async () => {
    // Validate current tab before proceeding
    if (!validateCurrentTab()) return;

    // Save current data
    if (!saving) {
      await handleSave();
    }
    const currentIndex = TABS_LIST.findIndex(t => t.id === activeTab);
    if (currentIndex < TABS_LIST.length - 1) {
      setActiveTab(TABS_LIST[currentIndex + 1].id);
    }
  };

  const handlePrevTab = () => {
    const currentIndex = TABS_LIST.findIndex(t => t.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(TABS_LIST[currentIndex - 1].id);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-800/60 rounded-xl animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 relative z-10 custom-scrollbar h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI Resume Builder</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-400">Build, analyze, and download your ATS-friendly resume</p>
            {/* Autosave indicator */}
            <AnimatePresence mode="wait">
              {autoSaveStatus === 'saving' && (
                <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-xs text-amber-400">
                  <RefreshCw size={12} className="animate-spin" /> Autosaving...
                </motion.span>
              )}
              {autoSaveStatus === 'saved' && (
                <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 size={12} /> Saved
                </motion.span>
              )}
              {autoSaveStatus === 'error' && (
                <motion.span key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-xs text-red-400">
                  <Clock size={12} /> Save failed
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleImportData} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 font-medium rounded-xl border border-indigo-500/30 transition-all">
            <Sparkles size={18} /> Auto Import
          </button>
          <button onClick={computeCareerReadiness} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 font-medium rounded-xl border border-emerald-500/30 transition-all">
            <Award size={18} /> Readiness
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-600 transition-all">
            <Save size={18} /> {saving ? 'Saving...' : 'Save Draft'}
          </button>
          {isSubmitted && (
            <button onClick={handleDownload} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/20 transition-all">
              <Download size={18} /> Download PDF
            </button>
          )}
          <button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-red-900/20 text-red-400 hover:bg-red-800/40 font-medium rounded-xl border border-red-800/40 transition-all">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Career Readiness Panel */}
      <AnimatePresence>
        {careerReadiness && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-5 bg-slate-800/60 backdrop-blur-md border border-slate-700 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold flex items-center gap-2"><Award size={18} className="text-emerald-400" /> Career Readiness Score</h3>
              <button onClick={() => setCareerReadiness(null)} className="text-slate-500 hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#1e293b" strokeWidth="3" />
                  <circle cx="18" cy="18" r="16" fill="none"
                    stroke={careerReadiness.score >= 75 ? '#10b981' : careerReadiness.score >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="3" strokeDasharray={`${(careerReadiness.score / 100) * 100.5} 100.5`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-lg font-black ${careerReadiness.score >= 75 ? 'text-emerald-400' : careerReadiness.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {careerReadiness.score}%
                  </span>
                </div>
              </div>
              <div className="flex-1">
                {careerReadiness.tips.length === 0 ? (
                  <p className="text-emerald-400 font-medium">🎉 Your resume looks great! Ready for placement.</p>
                ) : (
                  <ul className="space-y-1">
                    {careerReadiness.tips.slice(0, 4).map((tip, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">•</span> {tip}
                      </li>
                    ))}
                    {careerReadiness.tips.length > 4 && <li className="text-xs text-slate-500">+{careerReadiness.tips.length - 4} more suggestions...</li>}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-red-800/50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-900/30 rounded-xl"><Trash2 size={24} className="text-red-400" /></div>
                <div>
                  <h2 className="text-xl font-bold text-white">Delete Resume?</h2>
                  <p className="text-slate-400 text-sm">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm mb-6">All your resume data, sections, and version history will be permanently deleted. Your profile data will remain untouched.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-600 transition-all">Cancel</button>
                <button onClick={handleDeleteResume}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-semibold rounded-xl shadow-lg transition-all">Yes, Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* LEFT PANEL - BUILDER */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          {/* Tabs */}
          <div className="flex gap-2 p-1.5 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl flex-wrap">
            {TABS_LIST.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>

          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl"
          >
            {activeTab === 'personal' && (
              <div className="space-y-4 text-slate-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Phone <span className="text-red-500">*</span></label>
                    <input type="text" value={resumeData.phone} onChange={e => updateField('phone', e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-white" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Address <span className="text-red-500">*</span></label>
                    <input type="text" value={resumeData.address} onChange={e => updateField('address', e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-white" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">LinkedIn Profile</label>
                  <input type="url" value={resumeData.linkedin} onChange={e => updateField('linkedin', e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">GitHub Profile</label>
                  <input type="url" value={resumeData.github} onChange={e => updateField('github', e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Portfolio Website</label>
                  <input type="url" value={resumeData.portfolio} onChange={e => updateField('portfolio', e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium block">Professional Summary <span className="text-red-500">*</span></label>
                    <button onClick={autoGenerateSummary} disabled={generatingSummary} className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300">
                      <Sparkles size={12} /> {generatingSummary ? 'Generating...' : 'Auto-Generate AI'}
                    </button>
                  </div>
                  <textarea value={resumeData.summary} onChange={e => updateField('summary', e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-white h-24" />
                </div>
              </div>
            )}

            {activeTab === 'experience' && (
              <div className="space-y-6">
                {resumeData.experiences.map((exp, i) => (
                  <div key={i} className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl relative">
                    <button onClick={() => removeItem('experiences', i)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400">×</button>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input placeholder="Role" value={exp.role} onChange={e => updateItem('experiences', i, 'role', e.target.value)} className="bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                      <input placeholder="Company" value={exp.company} onChange={e => updateItem('experiences', i, 'company', e.target.value)} className="bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                    </div>
                    <input placeholder="Duration (e.g. Jan 2023 - Present)" value={exp.duration} onChange={e => updateItem('experiences', i, 'duration', e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white mb-3" />
                    <textarea placeholder="Description" value={exp.description} onChange={e => updateItem('experiences', i, 'description', e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white h-20" />
                  </div>
                ))}
                <button onClick={() => addItem('experiences', { role: '', company: '', duration: '', description: '' })} className="w-full py-2 border-2 border-dashed border-slate-600 text-slate-400 rounded-xl hover:text-white hover:border-slate-500 transition-colors">+ Add Experience</button>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-6">
                {resumeData.projects.map((proj, i) => (
                  <div key={i} className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl relative">
                    <button onClick={() => removeItem('projects', i)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400">×</button>
                    <input placeholder="Project Title" value={proj.title} onChange={e => updateItem('projects', i, 'title', e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white mb-3" />
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input placeholder="GitHub URL" value={proj.github_link} onChange={e => updateItem('projects', i, 'github_link', e.target.value)} className="bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                      <input placeholder="Live Demo URL" value={proj.live_link} onChange={e => updateItem('projects', i, 'live_link', e.target.value)} className="bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                    </div>
                    <input placeholder="Technologies Used" value={proj.technologies} onChange={e => updateItem('projects', i, 'technologies', e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white mb-3" />
                    <textarea placeholder="Description" value={proj.description} onChange={e => updateItem('projects', i, 'description', e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white h-20" />
                  </div>
                ))}
                <button onClick={() => addItem('projects', { title: '', description: '', technologies: '', github_link: '', live_link: '' })} className="w-full py-2 border-2 border-dashed border-slate-600 text-slate-400 rounded-xl hover:text-white hover:border-slate-500 transition-colors">+ Add Project</button>
              </div>
            )}

            {activeTab === 'education' && (
              <div className="space-y-6">
                {resumeData.education_details.map((edu, i) => (
                  <div key={i} className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl relative">
                    <button onClick={() => removeItem('education_details', i)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400">×</button>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input placeholder="Degree" value={edu.degree} onChange={e => updateItem('education_details', i, 'degree', e.target.value)} className="bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                      <input placeholder="College/University" value={edu.college} onChange={e => updateItem('education_details', i, 'college', e.target.value)} className="bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder="Year" value={edu.year} onChange={e => updateItem('education_details', i, 'year', e.target.value)} className="bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                      <input placeholder="Percentage/CGPA" value={edu.percentage} onChange={e => updateItem('education_details', i, 'percentage', e.target.value)} className="bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                    </div>
                  </div>
                ))}
                <button onClick={() => addItem('education_details', { degree: '', college: '', percentage: '', year: '' })} className="w-full py-2 border-2 border-dashed border-slate-600 text-slate-400 rounded-xl hover:text-white hover:border-slate-500 transition-colors">+ Add Education</button>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-3">Technical Skills</h3>
                    <div className="space-y-2 mb-3">
                      {resumeData.skills.map((skill, i) => skill.skill_type === 'Technical' && (
                        <div key={i} className="flex gap-2">
                          <input value={skill.skill_name} onChange={e => updateItem('skills', i, 'skill_name', e.target.value)} className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                          <button onClick={() => removeItem('skills', i)} className="text-slate-500 hover:text-red-400 px-2">×</button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => addItem('skills', { skill_name: '', skill_type: 'Technical' })} className="w-full py-1.5 border border-dashed border-slate-600 text-slate-400 rounded-lg text-sm hover:text-white">+ Add Technical Skill</button>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-3">Soft Skills</h3>
                    <div className="space-y-2 mb-3">
                      {resumeData.skills.map((skill, i) => skill.skill_type === 'Soft' && (
                        <div key={i} className="flex gap-2">
                          <input value={skill.skill_name} onChange={e => updateItem('skills', i, 'skill_name', e.target.value)} className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                          <button onClick={() => removeItem('skills', i)} className="text-slate-500 hover:text-red-400 px-2">×</button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => addItem('skills', { skill_name: '', skill_type: 'Soft' })} className="w-full py-1.5 border border-dashed border-slate-600 text-slate-400 rounded-lg text-sm hover:text-white">+ Add Soft Skill</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'additional' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Certifications</h3>
                  {resumeData.certifications.map((cert, i) => (
                    <div key={i} className="grid grid-cols-2 gap-3 mb-3 relative p-4 bg-slate-800/40 border border-slate-700 rounded-xl">
                      <button onClick={() => removeItem('certifications', i)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400">×</button>
                      <input placeholder="Name" value={cert.name} onChange={e => updateItem('certifications', i, 'name', e.target.value)} className="bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                      <input placeholder="Issuer" value={cert.issuer} onChange={e => updateItem('certifications', i, 'issuer', e.target.value)} className="bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                      <input type="date" value={cert.date} onChange={e => updateItem('certifications', i, 'date', e.target.value)} className="bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                      <input placeholder="Link" value={cert.link} onChange={e => updateItem('certifications', i, 'link', e.target.value)} className="bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                    </div>
                  ))}
                  <button onClick={() => addItem('certifications', { name: '', issuer: '', date: '', link: '' })} className="w-full py-1.5 border border-dashed border-slate-600 text-slate-400 rounded-lg text-sm hover:text-white">+ Add Certification</button>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Achievements</h3>
                  {resumeData.achievements.map((ach, i) => (
                    <div key={i} className="mb-3 relative p-4 bg-slate-800/40 border border-slate-700 rounded-xl">
                      <button onClick={() => removeItem('achievements', i)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400">×</button>
                      <input placeholder="Title" value={ach.title} onChange={e => updateItem('achievements', i, 'title', e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white mb-2" />
                      <textarea placeholder="Description" value={ach.description} onChange={e => updateItem('achievements', i, 'description', e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white h-16" />
                    </div>
                  ))}
                  <button onClick={() => addItem('achievements', { title: '', description: '' })} className="w-full py-1.5 border border-dashed border-slate-600 text-slate-400 rounded-lg text-sm hover:text-white">+ Add Achievement</button>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Languages</h3>
                  {resumeData.languages.map((lang, i) => (
                    <div key={i} className="grid grid-cols-2 gap-3 mb-3 relative p-4 bg-slate-800/40 border border-slate-700 rounded-xl">
                      <button onClick={() => removeItem('languages', i)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400">×</button>
                      <input placeholder="Language" value={lang.name} onChange={e => updateItem('languages', i, 'name', e.target.value)} className="bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                      <select value={lang.proficiency} onChange={e => updateItem('languages', i, 'proficiency', e.target.value)} className="bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-white">
                        <option value="Native">Native</option>
                        <option value="Fluent">Fluent</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Beginner">Beginner</option>
                      </select>
                    </div>
                  ))}
                  <button onClick={() => addItem('languages', { name: '', proficiency: 'Native' })} className="w-full py-1.5 border border-dashed border-slate-600 text-slate-400 rounded-lg text-sm hover:text-white">+ Add Language</button>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-300 mb-2">Your Downloaded Resumes</h3>
                <p className="text-xs text-slate-400 mb-4">Every time you download a PDF, a copy is saved here. Click 'Open' to load it back into the editor.</p>
                {resumeData.versions && resumeData.versions.length > 0 ? (
                  <div className="space-y-3">
                    {resumeData.versions.map((version) => (
                      <div key={version.id} className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl flex justify-between items-center hover:bg-slate-800/60 transition-colors">
                        <div>
                          <p className="text-sm font-semibold text-white">{version.version_name}</p>
                        </div>
                        <button 
                          onClick={() => handleRestoreVersion(version.id)}
                          className="px-4 py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white text-xs font-semibold rounded-lg transition-all"
                        >
                          Open & Update
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-slate-800/20 border border-slate-700/50 rounded-xl">
                    <History size={32} className="mx-auto text-slate-500 mb-3" />
                    <p className="text-slate-400 text-sm">No downloaded resumes yet.</p>
                    <p className="text-slate-500 text-xs mt-1">Submit your resume and download the PDF to save a copy here.</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            {(() => {
              const currentIndex = TABS_LIST.findIndex(t => t.id === activeTab);
              const isLastTab = currentIndex === TABS_LIST.length - 1;
              return (
                <div className="mt-8 pt-4 border-t border-slate-700/50 flex justify-between items-center">
                  <button
                    onClick={handlePrevTab}
                    disabled={currentIndex === 0}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed text-slate-500' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                  >
                    Previous
                  </button>
                  {isLastTab ? (
                    <button
                      onClick={handleSubmit}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white transition-all shadow-lg shadow-indigo-500/25"
                    >
                      <CheckCircle2 size={16} />
                      {saving ? 'Submitting...' : 'Submit Resume'}
                    </button>
                  ) : (
                    <button
                      onClick={handleNextTab}
                      className="flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/20"
                    >
                      <Save size={16} /> Save & Next
                    </button>
                  )}
                </div>
              );
            })()}
          </motion.div>

          {/* Post-Submission Download Banner */}
          <AnimatePresence>
            {isSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="mt-4 p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/30 to-teal-900/20 backdrop-blur-md shadow-xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-emerald-500/20 rounded-xl">
                    <CheckCircle2 size={22} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Resume Submitted! 🎉</p>
                    <p className="text-slate-400 text-xs">Your resume has been saved successfully.</p>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Download size={18} /> Download PDF
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ATS Checker Panel */}
          <ATSChecker email={user?.email} onAtsScoreUpdate={(score) => updateField('ats_score', score)} />

        </div>

        {/* RIGHT PANEL - PREVIEW */}
        <div className="xl:col-span-7 bg-slate-900/50 border border-white/5 rounded-2xl flex flex-col shadow-2xl overflow-hidden h-[85vh]">
            {/* Header Area */}
            <div className="bg-slate-900/90 backdrop-blur-xl p-4 w-full z-10 border-b border-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
              <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <LayoutTemplate size={18} className="text-indigo-400" /> Live Preview
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { id: 'modern', label: 'Modern' },
                  { id: 'professional', label: 'Classic' },
                  { id: 'developer', label: 'Dev' },
                  { id: 'executive', label: 'Executive' },
                  { id: 'minimal', label: 'Minimal' },
                ].map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => updateField('template', tpl.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${resumeData.template === tpl.id ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                  >
                    {tpl.label}
                  </button>
                ))}
                <button onClick={() => setShowTemplateModal(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-indigo-400 hover:bg-slate-700 transition-colors flex items-center gap-1">
                  <LayoutTemplate size={12} />
                </button>
              </div>
            </div>
            
            {/* Scrollable Preview Area */}
            <div className="flex-1 overflow-auto custom-scrollbar p-4 md:p-8 bg-slate-800/30 flex justify-center items-start">
               <div className="w-full max-w-[800px] flex justify-center">
                  <div className="w-full sm:w-[800px] transform origin-top sm:scale-[0.8] md:scale-[0.9] xl:scale-100 transition-transform pb-[200px]">
                      <ResumePreview ref={previewRef} data={resumeData} template={resumeData.template} />
                  </div>
               </div>
            </div>
        </div>
      </div>

      {/* MORE TEMPLATES MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><LayoutTemplate className="text-indigo-400" /> Choose a Template</h2>
                <p className="text-slate-400 text-sm mt-1">Select a professionally designed template for your resume.</p>
              </div>
              <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-2 custom-scrollbar">
              {[
                { id: 'modern', name: 'Modern', desc: 'Indigo gradient header, clean sans-serif', available: true, bg: 'bg-indigo-100', bar: 'bg-indigo-400' },
                { id: 'professional', name: 'Classic', desc: 'Serif font, corporate black border', available: true, bg: 'bg-gray-100', bar: 'bg-gray-500' },
                { id: 'developer', name: 'Developer', desc: 'Dark monospace, emerald accents', available: true, bg: 'bg-gray-900', bar: 'bg-emerald-500' },
                { id: 'executive', name: 'Executive', desc: 'Dark slate header for senior roles', available: true, bg: 'bg-slate-100', bar: 'bg-slate-700' },
                { id: 'minimal', name: 'Minimal', desc: 'Ultra clean, light typography', available: true, bg: 'bg-white', bar: 'bg-gray-300' },
              ].map(tpl => (
                <div 
                  key={tpl.id}
                  onClick={() => {
                    if(tpl.available) {
                      updateField('template', tpl.id);
                      setShowTemplateModal(false);
                    }
                  }}
                  className={`relative group rounded-xl border-2 transition-all cursor-pointer overflow-hidden flex flex-col bg-slate-800/50 ${
                    resumeData.template === tpl.id ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'border-slate-700 hover:border-slate-500'
                  } ${!tpl.available ? 'opacity-80 cursor-not-allowed' : ''}`}
                >
                  {/* Thumbnail Mockup */}
                  <div className={`w-full aspect-[1/1.2] p-4 flex flex-col gap-3 ${tpl.bg}`}>
                    <div className={`h-10 w-full rounded ${tpl.bar}`}></div>
                    <div className="flex flex-col gap-2 flex-1">
                      <div className={`h-3 w-3/4 rounded ${tpl.bar} opacity-50`}></div>
                      <div className={`h-3 w-1/2 rounded ${tpl.bar} opacity-30`}></div>
                      <div className={`flex-1 rounded ${tpl.id === 'developer' ? 'bg-gray-800' : 'bg-white'} shadow-sm mt-1`}></div>
                    </div>
                  </div>
                  
                  {/* Info Footer */}
                  <div className="p-4 border-t border-slate-700 bg-slate-800 flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-semibold">{tpl.name}</h3>
                      <p className="text-slate-400 text-xs mt-0.5">{tpl.desc}</p>
                    </div>
                    {resumeData.template === tpl.id && (
                      <div className="bg-indigo-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded">Active</div>
                    )}
                  </div>

                  {/* Unavailable Overlay */}
                  {!tpl.available && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                      <span className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-full border border-slate-600 shadow-xl flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-400" /> Coming Soon
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;
