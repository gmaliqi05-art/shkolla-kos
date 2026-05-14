import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import type { NavItem } from './components/layout/Sidebar';

import DirectorDashboard from './pages/director/DirectorDashboard';
import ManageTeachers from './pages/director/ManageTeachers';
import ManageClasses from './pages/director/ManageClasses';
import ManageStudents from './pages/director/ManageStudents';
import Reports from './pages/director/Reports';
import Announcements from './pages/director/Announcements';

import TeacherDashboard from './pages/teacher/TeacherDashboard';
import MyClasses from './pages/teacher/MyClasses';
import GradeEntry from './pages/teacher/GradeEntry';
import AttendancePage from './pages/teacher/AttendancePage';
import TeacherSchedule from './pages/teacher/TeacherSchedule';
import SubjectsPage from './pages/teacher/SubjectsPage';

import StudentDashboard from './pages/student/StudentDashboard';
import MyGrades from './pages/student/MyGrades';
import MySchedule from './pages/student/MySchedule';
import MyAttendance from './pages/student/MyAttendance';

import ParentDashboard from './pages/parent/ParentDashboard';
import ChildGrades from './pages/parent/ChildGrades';
import ChildAttendance from './pages/parent/ChildAttendance';

import MessagesPage from './pages/shared/MessagesPage';

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Layers,
  BarChart3,
  Megaphone,
  BookOpen,
  ClipboardCheck,
  CalendarCheck,
  Award,
  Calendar,
  Clock,
  Star,
  MessageSquare,
  Library,
} from 'lucide-react';

const directorNav: NavItem[] = [
  { label: 'Paneli Kryesor', path: '/drejtor', icon: LayoutDashboard },
  { label: 'Mesuesit', path: '/drejtor/mesues', icon: GraduationCap },
  { label: 'Nxenesit', path: '/drejtor/nxenes', icon: Users },
  { label: 'Klasat', path: '/drejtor/klasa', icon: Layers },
  { label: 'Raportet', path: '/drejtor/raporte', icon: BarChart3 },
  { label: 'Njoftimet', path: '/drejtor/njoftime', icon: Megaphone },
  { label: 'Mesazhet', path: '/drejtor/mesazhet', icon: MessageSquare },
];

const teacherNav: NavItem[] = [
  { label: 'Paneli Kryesor', path: '/mesues', icon: LayoutDashboard },
  { label: 'Klasat e Mia', path: '/mesues/klasa', icon: BookOpen },
  { label: 'Lëndët Mësimore', path: '/mesues/lendet', icon: Library },
  { label: 'Vendos Nota', path: '/mesues/nota', icon: ClipboardCheck },
  { label: 'Frekuentimi', path: '/mesues/frekuentimi', icon: CalendarCheck },
  { label: 'Orari Mësimor', path: '/mesues/orari', icon: Clock },
  { label: 'Mesazhet', path: '/mesues/mesazhet', icon: MessageSquare },
];

const studentNav: NavItem[] = [
  { label: 'Paneli Kryesor', path: '/nxenes', icon: LayoutDashboard },
  { label: 'Notat e Mia', path: '/nxenes/nota', icon: Award },
  { label: 'Orari Im', path: '/nxenes/orari', icon: Clock },
  { label: 'Frekuentimi', path: '/nxenes/frekuentimi', icon: Calendar },
  { label: 'Mesazhet', path: '/nxenes/mesazhet', icon: MessageSquare },
];

const parentNav: NavItem[] = [
  { label: 'Paneli Kryesor', path: '/prind', icon: LayoutDashboard },
  { label: 'Notat', path: '/prind/nota', icon: Star },
  { label: 'Frekuentimi', path: '/prind/frekuentimi', icon: Calendar },
  { label: 'Mesazhet', path: '/prind/mesazhet', icon: MessageSquare },
];

function AppRoutes() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 mt-4 text-sm">Duke ngarkuar...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  if (profile.role === 'drejtor') {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/drejtor" replace />} />
        <Route element={<DashboardLayout navItems={directorNav} role="drejtor" />}>
          <Route path="/drejtor" element={<DirectorDashboard />} />
          <Route path="/drejtor/mesues" element={<ManageTeachers />} />
          <Route path="/drejtor/nxenes" element={<ManageStudents />} />
          <Route path="/drejtor/klasa" element={<ManageClasses />} />
          <Route path="/drejtor/raporte" element={<Reports />} />
          <Route path="/drejtor/njoftime" element={<Announcements />} />
          <Route path="/drejtor/mesazhet" element={<MessagesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/drejtor" replace />} />
      </Routes>
    );
  }

  if (profile.role === 'mesues') {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/mesues" replace />} />
        <Route element={<DashboardLayout navItems={teacherNav} role="mesues" />}>
          <Route path="/mesues" element={<TeacherDashboard />} />
          <Route path="/mesues/klasa" element={<MyClasses />} />
          <Route path="/mesues/nota" element={<GradeEntry />} />
          <Route path="/mesues/frekuentimi" element={<AttendancePage />} />
          <Route path="/mesues/lendet" element={<SubjectsPage />} />
          <Route path="/mesues/orari" element={<TeacherSchedule />} />
          <Route path="/mesues/mesazhet" element={<MessagesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/mesues" replace />} />
      </Routes>
    );
  }

  if (profile.role === 'nxenes') {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/nxenes" replace />} />
        <Route element={<DashboardLayout navItems={studentNav} role="nxenes" />}>
          <Route path="/nxenes" element={<StudentDashboard />} />
          <Route path="/nxenes/nota" element={<MyGrades />} />
          <Route path="/nxenes/orari" element={<MySchedule />} />
          <Route path="/nxenes/frekuentimi" element={<MyAttendance />} />
          <Route path="/nxenes/mesazhet" element={<MessagesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/nxenes" replace />} />
      </Routes>
    );
  }

  if (profile.role === 'prind') {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/prind" replace />} />
        <Route element={<DashboardLayout navItems={parentNav} role="prind" />}>
          <Route path="/prind" element={<ParentDashboard />} />
          <Route path="/prind/nota" element={<ChildGrades />} />
          <Route path="/prind/frekuentimi" element={<ChildAttendance />} />
          <Route path="/prind/mesazhet" element={<MessagesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/prind" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
