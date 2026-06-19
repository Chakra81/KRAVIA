import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';


const API = `http://${window.location.hostname}:8000/api`;

const StudentCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourseTitle, setEnrolledCourseTitle] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch all courses from API
        const coursesRes = await axios.get(`${API}/list-courses/`);
        setCourses(coursesRes.data);

        // 2. Fetch student enrollment from API
        const studentsRes = await axios.get(`${API}/list-students/`);
        const students = studentsRes.data;
        const myRecord = students.find(
          (s) =>
            s.email?.toLowerCase() === user?.email?.toLowerCase() ||
            s.name?.toLowerCase() === user?.name?.toLowerCase()
        );
        if (myRecord?.course) {
          setEnrolledCourseTitle(myRecord.course);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);


  if (loading) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Filter courses to show only the one the student is enrolled in
  const myCourses = courses.filter(c => 
    enrolledCourseTitle && c.title.toLowerCase() === enrolledCourseTitle.toLowerCase()
  );

  return (
    <div className="p-8 min-h-screen bg-transparent">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black gradient-text flex items-center gap-3">
            <BookOpen className="text-indigo-500" size={36} />
            My Learning Journey
          </h1>
          <p className="text-[var(--text-muted)] mt-2 text-lg">
            {enrolledCourseTitle
              ? `Keep it up! You're making great progress in ${enrolledCourseTitle}.`
              : 'Welcome! Get started by exploring your assigned courses.'}
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <input 
              type="text" 
              placeholder="Search topics..."
              className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-xl px-4 py-2.5 pl-10 text-sm text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Specific Enrolled Course Banner */}
      <div className="space-y-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm tracking-widest uppercase mb-4">
          <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-indigo-400 border-b-[6px] border-b-transparent"></div>
          Your Enrolled Course
        </div>

        {myCourses.length > 0 ? (
          myCourses.map((course, index) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              key={course.id}
              onClick={() => navigate(`/courses/${course.id}`)}
              className="group relative cursor-pointer"
            >
              <div className="relative h-[280px] w-full rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0">
                  <img 
                    src={course.image} 
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-indigo-950/40"></div>
                </div>

                {/* Banner Content */}
                <div className="relative h-full flex items-center justify-between px-10 lg:px-16">
                  {/* Left Side: Info */}
                  <div className="flex flex-col gap-4 max-w-2xl">
                    <span className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] w-fit shadow-lg shadow-indigo-600/20">
                      Enrolled
                    </span>
                    
                    <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-none">
                      {course.title}
                    </h2>
                    
                    <p className="text-slate-300 text-base lg:text-lg font-medium opacity-80 line-clamp-2">
                      Master full-stack development with the {course.title} framework. Build real-world projects and expert skills.
                    </p>

                    <div className="flex items-center gap-6 mt-2">
                      <div className="flex items-center gap-2 text-slate-400">
                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                        </div>
                        <span className="text-sm font-bold tracking-wide">12 hrs</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                          <div className="w-2 h-2 bg-emerald-400 rotate-45"></div>
                        </div>
                        <span className="text-sm font-bold tracking-wide">45 Lessons</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Play Action */}
                  <div className="flex flex-col items-center gap-4">
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group/play transition-all duration-300 hover:bg-indigo-600/30 hover:border-indigo-500/50"
                    >
                      <div className="w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-400/50 flex items-center justify-center shadow-inner">
                        <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent translate-x-1"></div>
                      </div>
                    </motion.div>
                    
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      Watch on YouTube
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-24 bg-[var(--glass)] rounded-[3rem] border-2 border-dashed border-white/5 text-center backdrop-blur-xl">
            <div className="w-24 h-24 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-indigo-500/20">
              <BookOpen className="text-indigo-400" size={48} />
            </div>
            <h3 className="text-white text-4xl font-black mb-4">Awaiting Enrollment</h3>
            <p className="text-slate-400 max-w-xl mx-auto text-xl leading-relaxed px-8">
              We couldn't find an active enrollment for <span className="text-indigo-400 font-bold">"{enrolledCourseTitle || 'your profile'}"</span>. 
              Hang tight! Your administrator will assign your curriculum shortly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCourses;
