import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, TrendingUp, XCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const ATSChecker = ({ email, onAtsScoreUpdate }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const checkAts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.post(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/resume/ats-score/`, { email, job_description: jobDescription });
      setResults(response.data);
      if (onAtsScoreUpdate && response.data.ats_score) {
        onAtsScoreUpdate(response.data.ats_score);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze resume');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
          <CheckCircle2 size={24} />
        </div>
        <h2 className="text-xl font-bold text-white">ATS Checker</h2>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">Target Job Description (Optional)</label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-600 rounded-lg p-3 text-white h-32 focus:outline-none focus:border-indigo-500 transition-colors"
          placeholder="Paste job description to check keyword match..."
        />
      </div>

      <button
        onClick={checkAts}
        disabled={loading}
        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity flex justify-center items-center gap-2 mb-6"
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Analyze Resume'}
      </button>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm mb-6 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {results && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Main Score */}
          <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="text-sm text-slate-400 mb-1 uppercase tracking-wider">Overall ATS Match</div>
            <div className={`text-5xl font-black ${results.ats_score > 80 ? 'text-emerald-400' : results.ats_score > 60 ? 'text-yellow-400' : 'text-red-400'}`}>
              {results.ats_score}%
            </div>
          </div>

          {/* Sub Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Keywords</div>
              <div className="text-lg font-bold text-white">{results.keyword_match_score || results.keywords_score}%</div>
            </div>
            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Formatting</div>
              <div className="text-lg font-bold text-white">{results.formatting_score}%</div>
            </div>
            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Skills</div>
              <div className="text-lg font-bold text-white">{results.skills_score}%</div>
            </div>
            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Projects</div>
              <div className="text-lg font-bold text-white">{results.project_quality_score || results.projects_score}%</div>
            </div>
            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Education</div>
              <div className="text-lg font-bold text-white">{results.education_score}%</div>
            </div>
            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Experience</div>
              <div className="text-lg font-bold text-white">{results.experience_score}%</div>
            </div>
          </div>

          {/* Missing Keywords */}
          {results.missing_keywords && results.missing_keywords.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3">
                <XCircle size={16} className="text-red-400" />
                Missing Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {results.missing_keywords.map((kw, idx) => (
                  <span key={idx} className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-md">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {results.suggestions && results.suggestions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-emerald-400" />
                AI Suggestions
              </h3>
              <ul className="space-y-2">
                {results.suggestions.map((sug, idx) => (
                  <li key={idx} className="text-sm text-slate-300 bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                    {sug}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default ATSChecker;
