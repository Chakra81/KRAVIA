import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Presentation, Users, BookOpen, Clock, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import NotificationBell from '../components/NotificationBell';


const TrainerHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    active_batches: 0,
    total_students: 0,
    upcoming_classes_count: 0,
    courses_assigned: 0,
    upcoming_schedules: []
  });
  
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock analytics data for the chart
  const analyticsData = [
    { name: 'Mon', attendance: 85 },
    { name: 'Tue', attendance: 88 },
    { name: 'Wed', attendance: 92 },
    { name: 'Thu', attendance: 90 },
    { name: 'Fri', attendance: 95 },
    { name: 'Sat', attendance: 80 },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.email) return;
      try {
        const [dashRes, coursesRes, studentsRes] = await Promise.all([
          axios.get(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/trainer-dashboard/?email=${user.email}`),
          axios.get(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/trainer/my-courses/?email=${user.email}`),
          axios.get(`${(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')}/trainer/my-students/?email=${user.email}`)
        ]);
        
        setStats(dashRes.data);
        setCourses(coursesRes.data);
        setStudents(studentsRes.data);
      } catch (error) {
        console.error('Error fetching trainer dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const statCards = [
    { label: 'Active Batches', value: courses.length, icon: Presentation, color: 'from-blue-500 to-indigo-600' },
    { label: 'My Students', value: students.length, icon: Users, color: 'from-emerald-500 to-teal-600' },
    { label: 'Live Classes', value: stats.upcoming_classes_count, icon: Clock, color: 'from-amber-500 to-orange-600' },
    { label: 'Performance', value: '94%', icon: TrendingUp, color: 'from-purple-500 to-pink-600' },
  ];

  return (
    <div className="p-8 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black gradient-text">Trainer Dashboard</h1>
          <p className="text-[var(--text-muted)] mt-1">Welcome back, {user?.name || 'Trainer'}</p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading dashboard metrics...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card border border-[var(--border)] p-6 rounded-3xl relative overflow-hidden group"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity`} />
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-4 shadow-lg`}>
                  <stat.icon size={24} />
                </div>
                <p className="text-[var(--text-muted)] text-sm font-medium">{stat.label}</p>
                <h3 className="text-3xl font-bold text-[var(--text-main)] mt-1">{stat.value}</h3>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Analytics and Courses */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Analytics Chart */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card border border-[var(--border)] rounded-3xl p-6"
              >
                <h2 className="text-xl font-bold text-[var(--text-main)] mb-6 flex items-center gap-2">
                  <TrendingUp className="text-indigo-500" /> Student Attendance Trends
                </h2>
                <div className="h-64 w-full flex items-end gap-2 pb-6 border-b border-[var(--border)] relative">
                  {analyticsData.map((data, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
                      <div 
                        className="w-full max-w-[40px] bg-indigo-500/80 rounded-t-lg transition-all group-hover:bg-indigo-400 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                        style={{ height: `${data.attendance}%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 text-white text-xs py-1 px-2 rounded-lg transition-opacity whitespace-nowrap">
                          {data.attendance}%
                        </div>
                      </div>
                      <span className="text-xs text-[var(--text-muted)] mt-2 font-medium">{data.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* My Assigned Courses */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card border border-[var(--border)] rounded-3xl p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                    <BookOpen className="text-indigo-500" /> Assigned Courses
                  </h2>
                </div>
                
                {courses.length === 0 ? (
                  <p className="text-[var(--text-muted)] p-4 text-center">No courses assigned to you yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.map((course, idx) => (
                      <div key={idx} className="bg-[var(--glass)] border border-[var(--border)] p-5 rounded-2xl hover:border-indigo-500/50 transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-500 mb-4">
                          <Presentation size={20} />
                        </div>
                        <h4 className="font-bold text-[var(--text-main)] text-lg line-clamp-1">{course.course_title}</h4>
                        <p className="text-[var(--text-muted)] text-sm mt-1 mb-4">{course.batch_name}</p>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-xs font-semibold px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg">
                            {course.students_count} Students
                          </span>
                          <span className="text-xs font-semibold px-2 py-1 bg-amber-500/10 text-amber-500 rounded-lg">
                            {course.schedule_time || 'TBD'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right Column: Schedule and Students */}
            <div className="space-y-8">
              
              {/* Upcoming Schedule */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card border border-[var(--border)] rounded-3xl p-6"
              >
                <h2 className="text-xl font-bold text-[var(--text-main)] mb-6 flex items-center gap-2">
                  <Calendar className="text-indigo-500" /> Upcoming Schedule
                </h2>
                {stats.upcoming_schedules.length === 0 ? (
                  <p className="text-[var(--text-muted)] text-center py-4">No upcoming classes scheduled.</p>
                ) : (
                  <div className="space-y-4">
                    {stats.upcoming_schedules.map((schedule, i) => (
                      <div key={i} className="flex flex-col p-4 bg-[var(--glass)] hover:bg-[var(--glass-hover)] rounded-2xl border border-[var(--border)] transition-all">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-500 shrink-0">
                            <Clock size={18} />
                          </div>
                          <div>
                            <h4 className="text-[var(--text-main)] font-bold text-sm line-clamp-1">{schedule.course}</h4>
                            <p className="text-[var(--text-muted)] text-xs">{schedule.batch_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg">
                            {schedule.time || 'Time TBD'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Recent Students */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card border border-[var(--border)] rounded-3xl p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                    <Users className="text-indigo-500" /> Recent Students
                  </h2>
                  <span className="text-xs bg-indigo-500/20 text-indigo-500 px-2 py-1 rounded-lg font-bold">
                    {students.length} Total
                  </span>
                </div>
                
                {students.length === 0 ? (
                  <p className="text-[var(--text-muted)] text-center py-4">No students enrolled yet.</p>
                ) : (
                  <div className="space-y-4">
                    {students.slice(0, 5).map((student, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                          {student.student_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[var(--text-main)] font-semibold text-sm">{student.student_name}</p>
                          <p className="text-[var(--text-muted)] text-xs line-clamp-1">{student.course_title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TrainerHome;
