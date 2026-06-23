import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CourseCard from '../components/CourseCard';
import { X, Plus, Image as ImageIcon, Type, Info, AlertCircle, Save } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const API_URL = `https://kravia.onrender.com/api`;

const Dashboard = () => {
  useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const isAdmin = user?.role === 'admin' || user?.role === 'trainer';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ title: '', image: '', videoUrl: '' });

  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/list-courses/`);
      const mappedCourses = response.data.map(c => ({
        id: c.id,
        title: c.title,
        image: c.image || 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=60',
        videoUrl: c.video_url || '',
        topics: []
      }));
      setCourses(mappedCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error('Failed to load courses');
    }
  };

  const handleOpenForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ title: '', image: '', videoUrl: '' });
    setShowForm(true);
  };

  const handleOpenEdit = (course) => {
    setIsEditing(true);
    setEditingId(course.id);
    setFormData({ title: course.title, image: course.image, videoUrl: course.videoUrl || '' });
    setShowForm(true);
  };

  const handleOpenDelete = (id) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.image) {
      toast.error('Title and Image are required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await axios.put(`${API_URL}/update-course/${editingId}/`, formData);
        toast.success('Course updated successfully');
      } else {
        await axios.post(`${API_URL}/create-course/`, formData);
        toast.success('Course added successfully');
      }
      fetchCourses();
      setShowForm(false);
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error(error.response?.data?.error || 'Failed to save course');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/delete-course/${deletingId}/`);
      toast.success('Course deleted successfully');
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error('Failed to delete course');
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-transparent relative">
      <Navbar onSearchChange={setSearchQuery} onAddCourse={isAdmin ? handleOpenForm : null} />
      
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setShowForm(false)}
              className={`absolute inset-0 backdrop-blur-xl bg-[var(--bg-dark)] opacity-80`}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md overflow-hidden relative z-10 border border-[var(--border)] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`bg-[var(--glass)] border border-[var(--border)] p-6 flex justify-between items-center border-b`}>
                <h2 className={`text-xl font-bold flex items-center gap-2 text-[var(--text-main)]`}>
                  {isEditing ? <Save className="text-indigo-400" size={24} /> : <Plus className="text-indigo-400" size={24} />}
                  {isEditing ? 'Edit Course' : 'Add New Course'}
                </h2>
                <button onClick={() => setShowForm(false)} className={`text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors`}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                    <Type size={14} className="text-indigo-400" /> Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                    placeholder="e.g. Next.js Mastery"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={14} className="text-indigo-400" /> Image URL
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 mt-4 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isEditing ? 'Save Changes' : 'Create Course')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-[110] p-4">
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
              <p className="text-slate-400">Are you sure you want to delete this course? This action cannot be undone.</p>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-6 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-500/20 transition-all"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={course.id}
              >
                <CourseCard 
                    title={course.title} 
                    image={course.image} 
                    onClick={() => navigate(`/courses/${course.id}`)}
                    onEdit={isAdmin ? () => handleOpenEdit(course) : null}
                    onDelete={isAdmin ? () => handleOpenDelete(course.id) : null}
                />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-[var(--glass)] rounded-3xl border border-dashed border-[var(--border)]">
              <Info className="mx-auto text-indigo-500/50 mb-4" size={48} />
              <p className="text-[var(--text-muted)] text-xl font-medium">No courses found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
