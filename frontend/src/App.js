import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import EnrollAll from './pages/EnrollAll';
import AddAdmin from './pages/AddAdmin';
import Chat from './pages/Chat';
import Login from './pages/Login';
import StudentLogin from './pages/StudentLogin';
import TrainerLogin from './pages/TrainerLogin';
import StudentHome from './pages/StudentHome';
import StudentCourses from './pages/StudentCourses';
import OnlineExam from './pages/OnlineExam';
import ChangePassword from './pages/ChangePassword';
import Signup from './pages/Signup';
import Home from './pages/Home';
import VerifyOTP from './pages/VerifyOTP';
import TrainerHome from './pages/TrainerHome';
import ForgotPassword from './pages/ForgotPassword';
import AdminHome from './pages/AdminHome';
import IntellMeetDashboard from './pages/IntellMeetDashboard';
import MeetingRoom from './pages/MeetingRoom';
import CourseDetails from './pages/CourseDetails';
import LiveSessions from './pages/LiveSessions';
import Recordings from './pages/Recordings';
import AttendanceAnalytics from './pages/AttendanceAnalytics';
import Trainers from './pages/Trainers';
import AssignTrainers from './pages/AssignTrainers';
import Assignments from './pages/Assignments';
import StudyPlanner from './pages/StudyPlanner/StudyPlanner';
import FeeManagement from './pages/FeeManagement';
import CertificatesPage from './pages/Certificates';
import CertificateVerification from './pages/Certificates/CertificateVerification';
import NotificationCenter from './pages/NotificationCenter';
import NotificationSettings from './pages/NotificationSettings';
import PlacementManagement from './pages/PlacementManagement';
import ResumeBuilder from './pages/Resume/ResumeBuilder';
import TrainerAnalytics from './pages/TrainerAnalytics';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import GlobalNotificationManager from './components/GlobalNotificationManager';
import AIStudyAssistant from './components/AIStudyAssistant';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Layout Component
const AdminLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[var(--bg)] transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 ml-64 bg-transparent min-h-screen">
        <ProtectedRoute>
          {children}
        </ProtectedRoute>
        {/* Only show AI Assistant for students */}
        <StudentOnlyAI />
      </div>
    </div>
  );
};

const StudentOnlyAI = () => {
  const { user } = useAuth();
  if (user?.role === 'student') {
    return <AIStudyAssistant />;
  }
  return null;
};

// Role-based courses: admin sees Dashboard, student sees StudentCourses, trainer sees TrainerHome for now
const CoursesPage = () => {
  const { user } = useAuth();
  if (user?.role === 'student') return <StudentCourses />;
  if (user?.role === 'trainer') return <TrainerHome />;
  return <Dashboard />;
};

// Role-based home: admin sees Dashboard, student sees StudentHome, trainer sees TrainerHome
const HomeDashboard = () => {
  const { user } = useAuth();
  if (user?.role === 'student') return <StudentHome />;
  if (user?.role === 'trainer') return <TrainerHome />;
  return <AdminHome />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-center" reverseOrder={false} />
        <Router>
          <GlobalNotificationManager />
          <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Home />} />
            <Route path="/login/admin" element={<Login />} />
            <Route path="/login/student" element={<StudentLogin />} />
            <Route path="/login/trainer" element={<TrainerLogin />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes (shared layout) */}
            <Route path="/courses" element={
              <AdminLayout><CoursesPage /></AdminLayout>
            } />
            <Route path="/home" element={
              <AdminLayout><HomeDashboard /></AdminLayout>
            } />
            <Route path="/courses/:id" element={
              <AdminLayout><CourseDetails /></AdminLayout>
            } />
            <Route path="/students" element={
              <AdminLayout><Students /></AdminLayout>
            } />
            <Route path="/enroll" element={
              <AdminLayout><EnrollAll /></AdminLayout>
            } />
            <Route path="/add-admin" element={
              <AdminLayout><AddAdmin /></AdminLayout>
            } />
            <Route path="/chat" element={
              <AdminLayout><Chat /></AdminLayout>
            } />
            <Route path="/change-password" element={
              <AdminLayout><ChangePassword /></AdminLayout>
            } />
            <Route path="/exams" element={
              <AdminLayout><OnlineExam /></AdminLayout>
            } />
            <Route path="/intell-dashboard" element={<IntellMeetDashboard />} />
            <Route path="/meeting-room" element={<ProtectedRoute><MeetingRoom /></ProtectedRoute>} />
            <Route path="/live-sessions" element={
              <AdminLayout><LiveSessions /></AdminLayout>
            } />
            <Route path="/recordings" element={
              <AdminLayout><Recordings /></AdminLayout>
            } />
            <Route path="/attendance-analytics" element={
              <AdminLayout><AttendanceAnalytics /></AdminLayout>
            } />
            <Route path="/trainers" element={
              <AdminLayout><Trainers /></AdminLayout>
            } />
            <Route path="/assign-trainers" element={
              <AdminLayout><AssignTrainers /></AdminLayout>
            } />
            <Route path="/assignments" element={
              <AdminLayout><Assignments /></AdminLayout>
            } />
            <Route path="/study-planner" element={
              <AdminLayout><StudyPlanner /></AdminLayout>
            } />
            <Route path="/fees" element={
              <AdminLayout><FeeManagement /></AdminLayout>
            } />
            <Route path="/certificates" element={
              <AdminLayout><CertificatesPage /></AdminLayout>
            } />
            <Route path="/notifications" element={
              <AdminLayout><NotificationCenter /></AdminLayout>
            } />
            <Route path="/notifications/settings" element={
              <AdminLayout><NotificationSettings /></AdminLayout>
            } />
            <Route path="/placements" element={
              <AdminLayout><PlacementManagement /></AdminLayout>
            } />
            <Route path="/resume-builder" element={
              <AdminLayout><ResumeBuilder /></AdminLayout>
            } />
            <Route path="/trainer-analytics" element={
              <AdminLayout><TrainerAnalytics /></AdminLayout>
            } />

            {/* Public verify — no layout wrapper */}
            <Route path="/verify-certificate/:certificateId" element={<CertificateVerification />} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
