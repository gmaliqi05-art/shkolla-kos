import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import type { NavItem } from './components/layout/Sidebar';

import DirectorDashboard from './pages/director/DirectorDashboard';
import ManageTeachers from './pages/director/ManageTeachers';
import ManageClasses from './pages/director/ManageClasses';
import ManageStudents from './pages/director/ManageStudents';
import ManageParents from './pages/director/ManageParents';
import Reports from './pages/director/Reports';
import Announcements from './pages/director/Announcements';
import AuditLogs from './pages/director/AuditLogs';
import DeletionRequests from './pages/director/DeletionRequests';
import SpecialNeedsManagement from './pages/director/SpecialNeedsManagement';
import SchoolCouncils from './pages/director/SchoolCouncils';
import SchoolSettings from './pages/director/SchoolSettings';
import ReportCards from './pages/director/ReportCards';
import ReportCardView from './pages/director/ReportCardView';
import TeacherLicensing from './pages/director/TeacherLicensing';
import Activities from './pages/director/Activities';

import TeacherDashboard from './pages/teacher/TeacherDashboard';
import MyClasses from './pages/teacher/MyClasses';
import GradeEntry from './pages/teacher/GradeEntry';
import AttendancePage from './pages/teacher/AttendancePage';
import TeacherSchedule from './pages/teacher/TeacherSchedule';
import SubjectsPage from './pages/teacher/SubjectsPage';
import BehaviorPage from './pages/teacher/BehaviorPage';
import DisciplinePage from './pages/teacher/DisciplinePage';
import StudentAccommodations from './pages/teacher/StudentAccommodations';
import MyLicense from './pages/teacher/MyLicense';
import ParentMeetings from './pages/teacher/ParentMeetings';

import StudentDashboard from './pages/student/StudentDashboard';
import MyGrades from './pages/student/MyGrades';
import MySchedule from './pages/student/MySchedule';
import MyAttendance from './pages/student/MyAttendance';

import ParentDashboard from './pages/parent/ParentDashboard';
import ChildGrades from './pages/parent/ChildGrades';
import ChildAttendance from './pages/parent/ChildAttendance';
import PrivacySettings from './pages/parent/PrivacySettings';
import ChildIEP from './pages/parent/ChildIEP';

import MessagesPage from './pages/shared/MessagesPage';
import PrivacyPolicy from './pages/shared/PrivacyPolicy';
import MyCouncils from './pages/shared/MyCouncils';

import {
  LayoutDashboard, Users, GraduationCap, Layers, BarChart3,
  Megaphone, BookOpen, ClipboardCheck, CalendarCheck, Award,
  Calendar, Clock, Star, MessageSquare, Library, UserCog, Shield,
  Activity, Trash2, Lock, Heart, Sparkles, Briefcase, FileCheck, Building2,
  Trophy,
} from 'lucide-react';

const directorNav: NavItem[] = [
  { label: 'Paneli Kryesor', path: '/drejtor', icon: LayoutDashboard },
  { label: 'Mesuesit', path: '/drejtor/mesues', icon: GraduationCap },
  { label: 'Licencat', path: '/drejtor/licencat', icon: Award },
  { label: 'Nxenesit', path: '/drejtor/nxenes', icon: Users },
  { label: 'Prinderit', path: '/drejtor/prinder', icon: UserCog },
  { label: 'Klasat', path: '/drejtor/klasa', icon: Layers },
  { label: 'Raportet', path: '/drejtor/raporte', icon: BarChart3 },
  { label: 'Dëftesat', path: '/drejtor/deftesat', icon: FileCheck },
  { label: 'Disiplina', path: '/drejtor/disiplina', icon: Shield },
  { label: 'NVA & PIA', path: '/drejtor/nva', icon: Heart },
  { label: 'Organet Shkollore', path: '/drejtor/keshillat', icon: Briefcase },
  { label: 'Aktivitetet', path: '/drejtor/aktivitete', icon: Trophy },
  { label: 'Takimet me Prindër', path: '/drejtor/takimet', icon: Users },
  { label: 'Audit Log', path: '/drejtor/audit', icon: Activity },
  { label: 'Kërkesat Fshirje', path: '/drejtor/kerkesa-fshirje', icon: Trash2 },
  { label: 'Cilësimet', path: '/drejtor/cilesime', icon: Building2 },
  { label: 'Njoftimet', path: '/drejtor/njoftime', icon: Megaphone },
  { label: 'Mesazhet', path: '/drejtor/mesazhet', icon: MessageSquare },
];

const teacherNav: NavItem[] = [
  { label: 'Paneli Kryesor', path: '/mesues', icon: LayoutDashboard },
  { label: 'Klasat e Mia', path: '/mesues/klasa', icon: BookOpen },
  { label: 'Lëndët Mësimore', path: '/mesues/lendet', icon: Library },
  { label: 'Vendos Nota', path: '/mesues/nota', icon: ClipboardCheck },
  { label: 'Sjellja', path: '/mesues/sjellja', icon: Star },
  { label: 'Disiplina', path: '/mesues/disiplina', icon: Shield },
  { label: 'Akomodimet', path: '/mesues/akomodimet', icon: Sparkles },
  { label: 'Këshillat e Mi', path: '/mesues/keshillat', icon: Briefcase },
  { label: 'Frekuentimi', path: '/mesues/frekuentimi', icon: CalendarCheck },
  { label: 'Orari Mësimor', path: '/mesues/orari', icon: Clock },
  { label: 'Mesazhet', path: '/mesues/mesazhet', icon: MessageSquare },
  { label: 'Licenca Ime', path: '/mesues/licenca', icon: Award },
  { label: 'Aktivitetet', path: '/mesues/aktivitete', icon: Trophy },
  { label: 'Takimet me Prindër', path: '/mesues/takimet', icon: Users },
];

const studentNav: NavItem[] = [
  { label: 'Paneli Kryesor', path: '/nxenes', icon: LayoutDashboard },
  { label: 'Notat e Mia', path: '/nxenes/nota', icon: Award },
  { label: 'Orari Im', path: '/nxenes/orari', icon: Clock },
  { label: 'Frekuentimi', path: '/nxenes/frekuentimi', icon: Calendar },
  { label: 'Mesazhet', path: '/nxenes/mesazhet', icon: MessageSquare },
  { label: 'Këshillat e Mi', path: '/nxenes/keshillat', icon: Briefcase },
];

const parentNav: NavItem[] = [
  { label: 'Paneli Kryesor', path: '/prind', icon: LayoutDashboard },
  { label: 'Notat', path: '/prind/nota', icon: Star },
  { label: 'Frekuentimi', path: '/prind/frekuentimi', icon: Calendar },
  { label: 'Mesazhet', path: '/prind/mesazhet', icon: MessageSquare },
  { label: 'PIA i Fëmijës', path: '/prind/pia', icon: Heart },
  { label: 'Aktivitetet', path: '/prind/aktivitete', icon: Trophy },
  { label: 'Takimet', path: '/prind/takimet', icon: Users },
  { label: 'Këshillat e Mi', path: '/prind/keshillat', icon: Briefcase },
  { label: 'Privatësia', path: '/prind/privatesia', icon: Lock },
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
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
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
          <Route path="/drejtor/licencat" element={<TeacherLicensing />} />
          <Route path="/drejtor/nxenes" element={<ManageStudents />} />
          <Route path="/drejtor/prinder" element={<ManageParents />} />
          <Route path="/drejtor/klasa" element={<ManageClasses />} />
          <Route path="/drejtor/raporte" element={<Reports />} />
          <Route path="/drejtor/deftesat" element={<ReportCards />} />
          <Route path="/drejtor/deftesat/:studentId/:classId/:period/:type" element={<ReportCardView />} />
          <Route path="/drejtor/cilesime" element={<SchoolSettings />} />
          <Route path="/drejtor/disiplina" element={<DisciplinePage />} />
          <Route path="/drejtor/nva" element={<SpecialNeedsManagement />} />
          <Route path="/drejtor/keshillat" element={<SchoolCouncils />} />
          <Route path="/drejtor/aktivitete" element={<Activities />} />
          <Route path="/drejtor/takimet" element={<ParentMeetings />} />
          <Route path="/drejtor/audit" element={<AuditLogs />} />
          <Route path="/drejtor/kerkesa-fshirje" element={<DeletionRequests />} />
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
          <Route path="/mesues/sjellja" element={<BehaviorPage />} />
          <Route path="/mesues/disiplina" element={<DisciplinePage />} />
          <Route path="/mesues/akomodimet" element={<StudentAccommodations />} />
          <Route path="/mesues/keshillat" element={<MyCouncils />} />
          <Route path="/mesues/licenca" element={<MyLicense />} />
          <Route path="/mesues/aktivitete" element={<Activities />} />
          <Route path="/mesues/takimet" element={<ParentMeetings />} />
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
          <Route path="/nxenes/keshillat" element={<MyCouncils />} />
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
          <Route path="/prind/pia" element={<ChildIEP />} />
          <Route path="/prind/aktivitete" element={<Activities />} />
          <Route path="/prind/takimet" element={<ParentMeetings />} />
          <Route path="/prind/keshillat" element={<MyCouncils />} />
          <Route path="/prind/privatesia" element={<PrivacySettings />} />
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
