import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Video, 
  AlertCircle,
  X,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';


const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin' || user?.role === 'trainer';
  const [course, setCourse] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [topicToEdit, setTopicToEdit] = useState(null);
  const [topicToDelete, setTopicToDelete] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [searchTopic, setSearchTopic] = useState('');
  
  const [topicData, setTopicData] = useState({ title: '', videoUrl: '' });

  const [loading, setLoading] = useState(true);
  const API_URL = `${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}`;

  const fetchCourseDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/get-course/${id}/`);
      setCourse(response.data);
    } catch (error) {
      console.error("Error fetching course details:", error);
      toast.error('Course not found');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, API_URL]);

  useEffect(() => {
    fetchCourseDetails();
  }, [fetchCourseDetails]);

  const handleUploadTopic = async (e) => {
    e.preventDefault();
    if (!topicData.title || !topicData.videoUrl) {
      toast.error('Topic title and Video URL are required');
      return;
    }

    try {
      await axios.post(`${API_URL}/create-lesson/`, {
        courseId: id,
        title: topicData.title,
        videoUrl: topicData.videoUrl
      });
      toast.success('Topic uploaded successfully');
      fetchCourseDetails();
      setTopicData({ title: '', videoUrl: '' });
      setShowUploadModal(false);
    } catch (error) {
      toast.error('Failed to upload topic');
    }
  };

  const handleEditTopic = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/update-lesson/${topicToEdit.id}/`, {
        title: topicData.title,
        videoUrl: topicData.videoUrl
      });
      toast.success('Topic updated successfully');
      fetchCourseDetails();
      setIsEditingTopic(false);
      setTopicToEdit(null);
      setTopicData({ title: '', videoUrl: '' });
    } catch (error) {
      toast.error('Failed to update topic');
    }
  };

  const confirmDeleteTopic = (topic) => {
    setTopicToDelete(topic);
    setShowDeleteConfirm(true);
  };

  const handleDeleteTopic = async () => {
    try {
      await axios.delete(`${API_URL}/delete-lesson/${topicToDelete.id}/`);
      toast.success('Topic deleted successfully');
      fetchCourseDetails();
      setShowDeleteConfirm(false);
      setTopicToDelete(null);
    } catch (error) {
      toast.error('Failed to delete topic');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );
  if (!course) return null;

  const filteredTopics = (course.topics || []).filter(topic =>
    topic.title.toLowerCase().includes(searchTopic.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate('/courses')}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors group"
        >
          <div className="p-2 rounded-lg bg-[var(--glass)] border border-[var(--border)] group-hover:scale-110 transition-transform">
            <ArrowLeft size={20} />
          </div>
          <span className="font-semibold text-lg">Back</span>
        </button>

        <div className="flex-1 max-w-md mx-8">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Search by Topic Name"
                    value={searchTopic}
                    onChange={(e) => setSearchTopic(e.target.value)}
                    className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                />
            </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button 
              onClick={() => {
                setTopicData({ title: '', videoUrl: '' });
                setShowUploadModal(true);
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
              <Video size={18} />
              Upload Video
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Table */}
      <div className="rounded-3xl overflow-hidden border border-[var(--border)] bg-[var(--card)] shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-sm border-b border-white/10">S.NO</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-sm border-b border-white/10">Course Name</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-sm border-b border-white/10">Topic</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-sm border-b border-white/10 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filteredTopics.length > 0 ? (
              filteredTopics.map((topic, index) => (
                <tr key={topic.id} className="hover:bg-[var(--glass)] transition-colors group">
                  <td className="px-6 py-4 text-[var(--text-main)] font-medium">{index + 1}</td>
                  <td className="px-6 py-4 text-[var(--text-main)]">{course.title}</td>
                  <td className="px-6 py-4 text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">{topic.title}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setPlayingVideo(topic)}
                          className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                          title="View Video"
                        >
                          <Eye size={18} />
                        </button>
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => {
                                setTopicToEdit(topic);
                                setTopicData({ title: topic.title, videoUrl: topic.video_url });
                                setIsEditingTopic(true);
                              }}
                              className="p-2 rounded-lg bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                              title="Edit Topic"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => confirmDeleteTopic(topic)}
                              className="p-2 rounded-lg bg-rose-600/10 text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                              title="Delete Topic"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-20 text-center text-[var(--text-muted)] italic">
                  No topics found for this course. Click "Upload Video" to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Video Player Modal */}
      <AnimatePresence>
        {playingVideo && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPlayingVideo(null)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden relative z-10 shadow-[0_0_50px_rgba(79,70,229,0.3)] border border-white/10"
            >
              <button 
                onClick={() => setPlayingVideo(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black transition-colors z-20"
              >
                <X size={24} />
              </button>
              <iframe
                src={playingVideo.video_url}
                title={playingVideo.title}
                className="w-full h-full"
                allowFullScreen
                autoPlay
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent pointer-events-none">
                <h3 className="text-white text-2xl font-bold">{playingVideo.title}</h3>
                <p className="text-slate-400">Lesson Topic • {course.title}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload/Edit Topic Modal */}
      <AnimatePresence>
        {(showUploadModal || isEditingTopic) && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowUploadModal(false);
                setIsEditingTopic(false);
              }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-lg overflow-hidden relative z-10 border border-white/10"
            >
              <form onSubmit={isEditingTopic ? handleEditTopic : handleUploadTopic} className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    {isEditingTopic ? <Edit className="text-indigo-400" /> : <Video className="text-indigo-400" />}
                    {isEditingTopic ? 'Edit Topic' : 'Upload Video Topic'}
                  </h2>
                  <button 
                    type="button" 
                    onClick={() => {
                        setShowUploadModal(false);
                        setIsEditingTopic(false);
                    }} 
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Topic Title</label>
                    <input 
                      type="text"
                      required
                      value={topicData.title}
                      onChange={(e) => setTopicData({ ...topicData, title: e.target.value })}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      placeholder="e.g. Introduction to Models"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Video URL (YouTube Embed)</label>
                    <input 
                      type="url"
                      required
                      value={topicData.videoUrl}
                      onChange={(e) => setTopicData({ ...topicData, videoUrl: e.target.value })}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      placeholder="https://www.youtube.com/embed/..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => {
                        setShowUploadModal(false);
                        setIsEditingTopic(false);
                    }}
                    className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all"
                  >
                    {isEditingTopic ? 'Update Topic' : 'Upload Topic'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-sm p-8 text-center relative z-10 border border-white/10"
            >
              <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
                <AlertCircle className="text-rose-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Confirm Delete</h3>
              <p className="text-slate-400">Are you sure you want to delete this topic? This action cannot be undone.</p>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-6 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteTopic}
                  className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-500/20 transition-all"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseDetails;
