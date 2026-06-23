import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, Clock, Award, TrendingUp, Calendar, ChevronLeft, ChevronRight, Video, FileText, Play, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import NotificationBell from '../components/NotificationBell';


const API = `https://kravia.onrender.com/api`;

const MiniCalendar = ({ events }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  };

  const getEventsForDay = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date.startsWith(dateStr));
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-10"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day);
    const hasLiveClass = dayEvents.some(e => e.type === 'live_class');
    const hasAssignment = dayEvents.some(e => e.type === 'assignment');

    days.push(
      <div 
        key={day} 
        className={`relative h-10 w-10 mx-auto flex items-center justify-center rounded-full text-sm font-medium transition-all cursor-pointer group
          ${isToday(day) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-[var(--text-main)] hover:bg-[var(--glass-hover)]'}
        `}
      >
        {day}
        {dayEvents.length > 0 && (
          <div className="absolute -bottom-1 flex gap-0.5">
            {hasLiveClass && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>}
            {hasAssignment && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>}
          </div>
        )}
        
        {/* Tooltip for events */}
        {dayEvents.length > 0 && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-slate-900 border border-slate-700 text-white text-xs rounded-xl p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
            <p className="font-bold border-b border-slate-700 pb-1 mb-2">{monthNames[currentDate.getMonth()]} {day}</p>
            <div className="space-y-2">
              {dayEvents.map((evt, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  {evt.type === 'live_class' ? <Video size={12} className="text-rose-400 mt-0.5 shrink-0" /> : <FileText size={12} className="text-amber-400 mt-0.5 shrink-0" />}
                  <span className="line-clamp-2 leading-tight">{evt.title}</span>
                </div>
              ))}
            </div>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-b border-r border-slate-700 rotate-45"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-[var(--text-main)]">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg bg-[var(--glass)] border border-[var(--border)] hover:bg-[var(--glass-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"><ChevronLeft size={16} /></button>
          <button onClick={nextMonth} className="p-1.5 rounded-lg bg-[var(--glass)] border border-[var(--border)] hover:bg-[var(--glass-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-y-2 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-center text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-3">
        {days}
      </div>
      
      <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-[var(--border)] text-xs font-semibold text-[var(--text-muted)]">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Live Class</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Assignment Due</div>
      </div>
    </div>
  );
};

const StudyHeatmap = ({ data }) => {
  const today = new Date();
  
  // Create last 365 days array
  const days = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  // Create a map of date -> count
  const activityMap = {};
  data.forEach(item => {
    activityMap[item.date] = item.count;
  });

  const getColor = (count) => {
    if (!count || count === 0) return 'bg-slate-800/50 border-slate-700/50';
    if (count === 1) return 'bg-emerald-900/80 border-emerald-800';
    if (count === 2) return 'bg-emerald-700/90 border-emerald-600';
    if (count === 3) return 'bg-emerald-500 border-emerald-400';
    return 'bg-emerald-400 border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.5)]';
  };

  const firstDayOfWeek = days[0].getDay(); 
  const paddedDays = Array(firstDayOfWeek).fill(null).concat(days);
  
  const weeks = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent">
      <div className="min-w-max">
        <div className="flex gap-1.5">
          <div className="flex flex-col justify-around text-[10px] text-[var(--text-muted)] pr-2 font-semibold tracking-wider uppercase h-[100px]">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1.5 h-[100px]">
              {week.map((day, dIdx) => {
                if (!day) return <div key={dIdx} className="w-[11px] h-[11px] rounded-sm opacity-0" />;
                
                const dateStr = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
                const count = activityMap[dateStr] || 0;
                
                return (
                  <div 
                    key={dIdx} 
                    className={`w-[11px] h-[11px] rounded-sm border ${getColor(count)} transition-all hover:ring-2 hover:ring-emerald-400 hover:scale-125 cursor-pointer group relative`}
                  >
                    <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 w-max bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg py-1 px-2.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl font-medium">
                      <span className={count > 0 ? 'text-emerald-400 font-bold' : ''}>{count === 0 ? 'No' : count} activity</span> on {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StudentHome = () => {
  const { user } = useAuth();
  const [myRecord, setMyRecord] = useState(null);




  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const res = await axios.get(`${API}/list-students/`);
        const students = res.data;
        const record = students.find(
          (s) =>
            s.email?.toLowerCase() === user?.email?.toLowerCase() ||
            s.name?.toLowerCase() === user?.name?.toLowerCase()
        );
        setMyRecord(record || null);
      } catch (err) {
        console.error('Failed to fetch student record:', err);
      }
    };
    fetchRecord();
  }, [user]);

  const stats = [
    { label: 'Enrolled Course', value: myRecord?.course || 'N/A', icon: <BookOpen size={22} />, color: 'var(--accent)' },
    { label: 'Status', value: myRecord ? 'Enrolled' : 'Pending', icon: <CheckCircle size={22} />, color: 'var(--accent)' },
    { label: 'Joined', value: myRecord?.joinedDate || 'N/A', icon: <Calendar size={22} />, color: 'var(--accent)' },
    { label: 'Progress', value: '72%', icon: <TrendingUp size={22} />, color: 'var(--accent)' },
  ];

  const [calendarEvents, setCalendarEvents] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);

  useEffect(() => {
    if (!user) return;
    const fetchEvents = async () => {
      try {
        const liveRes = await fetch(`${API}/live-sessions/?email=${user.email}`);
        const liveData = liveRes.ok ? await liveRes.json() : [];
        const assignRes = await fetch(`${API}/assignments/?email=${user.email}`);
        const assignData = assignRes.ok ? await assignRes.json() : [];

        const formatLive = Array.isArray(liveData) ? liveData.map(ls => ({
          title: ls.title,
          type: 'live_class',
          date: ls.scheduled_time || ls.start_time || ''
        })) : [];

        const formatAssign = Array.isArray(assignData) ? assignData.map(asg => ({
          title: asg.title,
          type: 'assignment',
          date: asg.due_date || ''
        })) : [];

        setCalendarEvents([...formatLive, ...formatAssign]);

        // Build upcoming classes list (scheduled or live, not ended)
        const upcoming = Array.isArray(liveData)
          ? liveData
              .filter(ls => ls.status !== 'ended')
              .sort((a, b) => new Date(a.scheduled_time || a.start_time) - new Date(b.scheduled_time || b.start_time))
              .slice(0, 5)
          : [];
        setUpcomingClasses(upcoming);
      } catch (err) {
        console.error('Failed to fetch calendar events', err);
      }
    };
    
    const fetchHeatmap = async () => {
      try {
        const res = await fetch(`${API}/heatmap/?email=${user.email}`);
        if (res.ok) {
          const data = await res.json();
          // data is now { activities: [...], current_streak: N }
          setHeatmapData(data.activities || []);
        }
      } catch (err) {
        console.error('Failed to fetch heatmap data', err);
      }
    };

    fetchEvents();
    fetchHeatmap();
  }, [user]);

  return (
    <div className="p-8 min-h-screen bg-[var(--bg)] transition-colors duration-300">
      {/* Hero welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl mb-10 p-10 bg-[var(--card)] border border-[var(--border)]"
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, var(--text-main) 1px, transparent 1px), radial-gradient(circle at 80% 20%, var(--text-main) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
          <div>
            <p className="text-[var(--accent)] font-medium mb-1 uppercase tracking-widest text-sm">Student Dashboard</p>
            <h1 className="text-4xl font-black text-[var(--text-main)] mb-2">
              Hey, {user?.name || 'Student'}! 👋
            </h1>
            <p className="text-[var(--text-muted)] text-lg">Welcome back to your learning journey. Keep it up!</p>
          </div>
          <div className="flex items-center gap-5">
            {/* Notification Bell with Dropdown */}
            <div className="flex items-center">
              <NotificationBell />
            </div>

            <div className="w-24 h-24 rounded-3xl bg-[var(--accent)]/10 backdrop-blur-xl border border-[var(--accent)]/20 flex items-center justify-center shadow-2xl">
              <span className="text-4xl font-black text-[var(--accent)]">{(user?.name || 'S').charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat, i) => {
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 border border-[var(--border)] overflow-hidden`}
              style={{ background: 'var(--glass)' }}
            >
              <div className={`w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] mb-4 shadow-lg`}>
                {stat.icon}
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-[var(--text-main)] font-bold text-xl">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Heatmap Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl p-6 border border-[var(--border)] mb-10"
        style={{ background: 'var(--glass)' }}
      >
        <h2 className="text-[var(--text-main)] font-bold text-lg mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-emerald-400" /> Study Heatmap
        </h2>
        <p className="text-[var(--text-muted)] text-sm mb-6">A visual log of your learning activity over the past year. Keep the streak alive! 🔥</p>
        <StudyHeatmap data={heatmapData} />
      </motion.div>

      {/* Upcoming Live Classes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-2xl p-6 border border-[var(--border)] mb-10"
        style={{ background: 'var(--glass)' }}
      >
        <h2 className="text-[var(--text-main)] font-bold text-lg mb-4 flex items-center gap-2">
          <Video size={20} className="text-indigo-400" /> Upcoming Live Classes
        </h2>
        {upcomingClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Video size={40} className="text-slate-500/30 mb-3" />
            <p className="text-[var(--text-muted)] font-medium">No upcoming live classes scheduled.</p>
            <p className="text-[var(--text-muted)] text-sm mt-1">Check back later or contact your trainer.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingClasses.map((cls, i) => {
              const sessionTime = new Date(cls.scheduled_time || cls.start_time);
              const isLive = cls.status === 'live' || cls.is_live;
              return (
                <motion.div
                  key={cls.id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--glass-hover)] hover:border-indigo-500/40 transition-all group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isLive ? 'bg-rose-500/15 text-rose-400' : 'bg-indigo-500/15 text-indigo-400'
                  }`}>
                    {isLive ? <Radio size={18} className="animate-pulse" /> : <Video size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-main)] font-semibold text-sm truncate">{cls.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[var(--text-muted)] text-xs flex items-center gap-1">
                        <Calendar size={11} />
                        {sessionTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[var(--text-muted)] text-xs flex items-center gap-1">
                        <Clock size={11} />
                        {sessionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {cls.course_detail && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full uppercase tracking-wider truncate max-w-[120px]">
                          {cls.course_detail.title}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`shrink-0 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
                    isLive
                      ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                      : 'bg-indigo-500/10 border border-indigo-500/25 text-indigo-400'
                  }`}>
                    {isLive ? <><span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />Live</> : <><Play size={10} />Scheduled</>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Profile & course info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-6 border border-[var(--border)]"
          style={{ background: 'var(--glass)' }}
        >
          {/* ... profile ... */}
          <h2 className="text-[var(--text-main)] font-bold text-lg mb-6 flex items-center gap-2">
            <Award size={20} className="text-[var(--accent)]" /> My Profile
          </h2>
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent)] flex items-center justify-center text-white font-black text-2xl shadow-lg">
              {(user?.name || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-[var(--text-main)] font-bold text-xl">{user?.name || 'Student'}</h3>
              <p className="text-[var(--text-muted)] text-sm">{user?.email || 'student@example.com'}</p>
              <span className="inline-block mt-1 px-3 py-0.5 bg-[var(--accent)]/20 text-[var(--accent)] text-xs font-bold rounded-full border border-[var(--accent)]/30 uppercase">
                {user?.role || 'student'}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Full Name', value: user?.name || 'N/A' },
              { label: 'Email', value: user?.email || 'N/A' },
              { label: 'Role', value: user?.role || 'student' },
              { label: 'Course', value: myRecord?.course || 'Not Enrolled' },
              { label: 'Password', value: myRecord?.password || '••••••••' },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center py-2.5 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)] text-sm">{row.label}</span>
                <span className="text-[var(--text-main)] font-semibold text-sm">{row.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl p-6 border border-[var(--border)]"
          style={{ background: 'var(--glass)' }}
        >
          <h2 className="text-[var(--text-main)] font-bold text-lg mb-6 flex items-center gap-2">
            <Clock size={20} className="text-[var(--accent)]" /> Recent Activity
          </h2>
          <div className="space-y-4">
            {[
              { action: 'Logged into student portal', time: 'Just now', color: 'bg-emerald-500' },
              { action: `Enrolled in ${myRecord?.course || 'a course'}`, time: myRecord?.joinedDate || 'Recently', color: 'bg-[var(--accent)]' },
              { action: 'Profile created', time: 'On registration', color: 'bg-purple-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${item.color}`} />
                <div>
                  <p className="text-[var(--text-main)] text-sm font-medium">{item.action}</p>
                  <p className="text-[var(--text-muted)] text-xs mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <div className="flex justify-between mb-2">
              <span className="text-[var(--text-muted)] text-sm">Course Progress</span>
              <span className="text-[var(--accent)] font-bold text-sm">72%</span>
            </div>
            <div className="w-full h-2.5 bg-[var(--text-muted)]/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '72%' }}
                transition={{ duration: 1, delay: 0.8 }}
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl p-6 border border-[var(--border)]"
          style={{ background: 'var(--glass)' }}
        >
          <h2 className="text-[var(--text-main)] font-bold text-lg mb-6 flex items-center gap-2">
            <Calendar size={20} className="text-indigo-400" /> Study Planner
          </h2>
          <MiniCalendar events={calendarEvents} />
        </motion.div>
      </div>
    </div>
  );
};

export default StudentHome;
