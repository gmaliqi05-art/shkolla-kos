import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { I18nProvider } from './lib/i18n/I18nProvider';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import type { NavItem } from './components/layout/Sidebar';

const DirectorDashboard = lazy(() => import('./pages/director/DirectorDashboard'));
const ManageTeachers = lazy(() => import('./pages/director/ManageTeachers'));
const ManageClasses = lazy(() => import('./pages/director/ManageClasses'));
const ManageStudents = lazy(() => import('./pages/director/ManageStudents'));
const ManageParents = lazy(() => import('./pages/director/ManageParents'));
const Reports = lazy(() => import('./pages/director/Reports'));
const Announcements = lazy(() => import('./pages/director/Announcements'));
const AuditLogs = lazy(() => import('./pages/director/AuditLogs'));
const DeletionRequests = lazy(() => import('./pages/director/DeletionRequests'));
const SpecialNeedsManagement = lazy(() => import('./pages/director/SpecialNeedsManagement'));
const SchoolCouncils = lazy(() => import('./pages/director/SchoolCouncils'));
const SchoolSettings = lazy(() => import('./pages/director/SchoolSettings'));
const ReportCards = lazy(() => import('./pages/director/ReportCards'));
const ReportCardView = lazy(() => import('./pages/director/ReportCardView'));
const TeacherLicensing = lazy(() => import('./pages/director/TeacherLicensing'));
const Activities = lazy(() => import('./pages/director/Activities'));
const NationalTests = lazy(() => import('./pages/director/NationalTests'));
const Municipalities = lazy(() => import('./pages/director/Municipalities'));
const SchoolCalendar = lazy(() => import('./pages/director/SchoolCalendar'));
const AnnualPlan = lazy(() => import('./pages/director/AnnualPlan'));
const LibraryPage = lazy(() => import('./pages/director/Library'));
const TwoFactorSettings = lazy(() => import('./pages/TwoFactorSettings'));
const LegalDocuments = lazy(() => import('./pages/shared/LegalDocuments'));
const MinistriDashboard = lazy(() => import('./pages/ministri/MinistriDashboard'));
const StaffAccountsManagement = lazy(() => import('./pages/ministri/StaffAccountsManagement'));
const DkaDashboard = lazy(() => import('./pages/dka/DkaDashboard'));
const SchoolsManagement = lazy(() => import('./pages/shared/SchoolsManagement'));
const LocalitiesManagement = lazy(() => import('./pages/shared/LocalitiesManagement'));
const InspectionsManagement = lazy(() => import('./pages/inspektor/InspectionsManagement'));
const InspectionDetail = lazy(() => import('./pages/inspektor/InspectionDetail'));

const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const MyClasses = lazy(() => import('./pages/teacher/MyClasses'));
const GradeEntry = lazy(() => import('./pages/teacher/GradeEntry'));
const AttendancePage = lazy(() => import('./pages/teacher/AttendancePage'));
const TeacherSchedule = lazy(() => import('./pages/teacher/TeacherSchedule'));
const SubjectsPage = lazy(() => import('./pages/teacher/SubjectsPage'));
const BehaviorPage = lazy(() => import('./pages/teacher/BehaviorPage'));
const DisciplinePage = lazy(() => import('./pages/teacher/DisciplinePage'));
const StudentAccommodations = lazy(() => import('./pages/teacher/StudentAccommodations'));
const MyLicense = lazy(() => import('./pages/teacher/MyLicense'));
const ParentMeetings = lazy(() => import('./pages/teacher/ParentMeetings'));
const ClassDiary = lazy(() => import('./pages/teacher/ClassDiary'));
const HomeworkPage = lazy(() => import('./pages/teacher/HomeworkPage'));
const DiagnosticAssessments = lazy(() => import('./pages/teacher/DiagnosticAssessments'));

const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const MyGrades = lazy(() => import('./pages/student/MyGrades'));
const MySchedule = lazy(() => import('./pages/student/MySchedule'));
const MyAttendance = lazy(() => import('./pages/student/MyAttendance'));

const ParentDashboard = lazy(() => import('./pages/parent/ParentDashboard'));
const ChildGrades = lazy(() => import('./pages/parent/ChildGrades'));
const ChildAttendance = lazy(() => import('./pages/parent/ChildAttendance'));
const PrivacySettings = lazy(() => import('./pages/parent/PrivacySettings'));
const ChildIEP = lazy(() => import('./pages/parent/ChildIEP'));

const MessagesPage = lazy(() => import('./pages/shared/MessagesPage'));
const PrivacyPolicy = lazy(() => import('./pages/shared/PrivacyPolicy'));
const MyCouncils = lazy(() => import('./pages/shared/MyCouncils'));
const MyTestResults = lazy(() => import('./pages/shared/MyTestResults'));
const Portfolio = lazy(() => import('./pages/shared/Portfolio'));
const SelfAssessmentPage = lazy(() => import('./pages/student/SelfAssessment'));

import {
  LayoutDashboard, Users, GraduationCap, Layers, BarChart3,
  Megaphone, BookOpen, ClipboardCheck, CalendarCheck, Award,
  Calendar, Clock, Star, MessageSquare, Library, UserCog, Shield,
  Activity, Trash2, Lock, Heart, Sparkles, Briefcase, FileCheck, Building2,
  Trophy, MapPin, NotebookPen, FileText, Stethoscope, FolderOpen, FileSpreadsheet, ShieldCheck, Scale,
  Crown, Building, School,
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
  { label: 'Testet Kombëtare', path: '/drejtor/testet-kombetare', icon: GraduationCap },
  { label: 'Audit Log', path: '/drejtor/audit', icon: Activity },
  { label: 'Kërkesat Fshirje', path: '/drejtor/kerkesa-fshirje', icon: Trash2 },
  { label: 'Cilësimet', path: '/drejtor/cilesime', icon: Building2 },
  { label: 'Komunat', path: '/drejtor/komunat', icon: MapPin },
  { label: 'Kalendari', path: '/drejtor/kalendari', icon: Calendar },
  { label: 'Plani Vjetor', path: '/drejtor/plani-vjetor', icon: FileSpreadsheet },
  { label: 'Biblioteka', path: '/drejtor/biblioteka', icon: Library },
  { label: '2FA / Siguria', path: '/drejtor/2fa', icon: ShieldCheck },
  { label: 'Dokumentet Ligjore', path: '/drejtor/dokumentet-ligjore', icon: Scale },
  { label: 'Inspektimet', path: '/drejtor/inspektimet', icon: ClipboardCheck },
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
  { label: '2FA / Siguria', path: '/mesues/2fa', icon: ShieldCheck },
  { label: 'Dokumentet Ligjore', path: '/mesues/dokumentet-ligjore', icon: Scale },
  { label: 'Ditari i Klasës', path: '/mesues/ditari', icon: NotebookPen },
  { label: 'Detyrat e Shtëpisë', path: '/mesues/detyrat', icon: FileText },
  { label: 'Vlerësimi Diagnostikues', path: '/mesues/diagnostik', icon: Stethoscope },
  { label: 'Portofoli', path: '/mesues/portofoli', icon: FolderOpen },
];

const studentNav: NavItem[] = [
  { label: 'Paneli Kryesor', path: '/nxenes', icon: LayoutDashboard },
  { label: 'Notat e Mia', path: '/nxenes/nota', icon: Award },
  { label: 'Orari Im', path: '/nxenes/orari', icon: Clock },
  { label: 'Frekuentimi', path: '/nxenes/frekuentimi', icon: Calendar },
  { label: 'Mesazhet', path: '/nxenes/mesazhet', icon: MessageSquare },
  { label: 'Këshillat e Mi', path: '/nxenes/keshillat', icon: Briefcase },
  { label: 'Testet Kombëtare', path: '/nxenes/testet-kombetare', icon: GraduationCap },
  { label: 'Portofoli Im', path: '/nxenes/portofoli', icon: FolderOpen },
  { label: 'Vetëvlerësimi', path: '/nxenes/vetevleresimi', icon: Heart },
  { label: 'Dokumentet Ligjore', path: '/nxenes/dokumentet-ligjore', icon: Scale },
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
  { label: 'Testet Kombëtare', path: '/prind/testet-kombetare', icon: GraduationCap },
  { label: 'Portofoli', path: '/prind/portofoli', icon: FolderOpen },
  { label: 'Privatësia', path: '/prind/privatesia', icon: Lock },
  { label: 'Dokumentet Ligjore', path: '/prind/dokumentet-ligjore', icon: Scale },
];

const dkaNav: NavItem[] = [
  { label: 'Paneli Kryesor', path: '/dka', icon: LayoutDashboard },
  { label: 'Shkollat', path: '/dka/shkollat', icon: School },
  { label: 'Vendbanimet', path: '/dka/vendbanimet', icon: MapPin },
  { label: 'Komunat', path: '/dka/komunat', icon: Building },
  { label: 'Mesazhet', path: '/dka/mesazhet', icon: MessageSquare },
  { label: '2FA / Siguria', path: '/dka/2fa', icon: ShieldCheck },
  { label: 'Dokumentet Ligjore', path: '/dka/dokumentet-ligjore', icon: Scale },
];

const ministriNav: NavItem[] = [
  { label: 'Paneli Kryesor', path: '/ministri', icon: Crown },
  { label: 'Stafi Administrativ', path: '/ministri/stafi', icon: UserCog },
  { label: 'Shkollat', path: '/ministri/shkollat', icon: School },
  { label: 'Vendbanimet', path: '/ministri/vendbanimet', icon: MapPin },
  { label: 'Komunat', path: '/ministri/komunat', icon: Building },
  { label: 'Mesazhet', path: '/ministri/mesazhet', icon: MessageSquare },
  { label: 'Audit Log', path: '/ministri/audit', icon: Activity },
  { label: '2FA / Siguria', path: '/ministri/2fa', icon: ShieldCheck },
  { label: 'Dokumentet Ligjore', path: '/ministri/dokumentet-ligjore', icon: Scale },
];

const inspektorNav: NavItem[] = [
  { label: 'Paneli Kryesor', path: '/inspektor', icon: LayoutDashboard },
  { label: 'Inspektimet', path: '/inspektor/inspektimet', icon: ClipboardCheck },
  { label: 'Shkollat', path: '/inspektor/shkollat', icon: School },
  { label: 'Mesazhet', path: '/inspektor/mesazhet', icon: MessageSquare },
  { label: '2FA / Siguria', path: '/inspektor/2fa', icon: ShieldCheck },
  { label: 'Dokumentet Ligjore', path: '/inspektor/dokumentet-ligjore', icon: Scale },
];

const pedagogNav: NavItem[] = [
  { label: 'Paneli Kryesor', path: '/pedagog', icon: LayoutDashboard },
  { label: 'NVA & PIA', path: '/pedagog/nva', icon: Heart },
  { label: 'Vlerësimi Diagnostikues', path: '/pedagog/diagnostik', icon: Stethoscope },
  { label: 'Portofoli', path: '/pedagog/portofoli', icon: FolderOpen },
  { label: 'Organet Shkollore', path: '/pedagog/keshillat', icon: Briefcase },
  { label: 'Aktivitetet', path: '/pedagog/aktivitete', icon: Trophy },
  { label: 'Takimet me Prindër', path: '/pedagog/takimet', icon: Users },
  { label: 'Mesazhet', path: '/pedagog/mesazhet', icon: MessageSquare },
  { label: '2FA / Siguria', path: '/pedagog/2fa', icon: ShieldCheck },
  { label: 'Dokumentet Ligjore', path: '/pedagog/dokumentet-ligjore', icon: Scale },
];

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-64">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/dokumentet-ligjore" element={<LegalDocuments />} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </Suspense>
    );
  }

  if (profile.role === 'drejtor') {
    return (
      <Suspense fallback={<PageLoader />}>
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
            <Route path="/drejtor/komunat" element={<Municipalities />} />
            <Route path="/drejtor/kalendari" element={<SchoolCalendar />} />
            <Route path="/drejtor/plani-vjetor" element={<AnnualPlan />} />
            <Route path="/drejtor/biblioteka" element={<LibraryPage />} />
            <Route path="/drejtor/2fa" element={<TwoFactorSettings />} />
            <Route path="/drejtor/dokumentet-ligjore" element={<LegalDocuments />} />
            <Route path="/drejtor/inspektimet" element={<InspectionsManagement />} />
            <Route path="/drejtor/inspektimet/:id" element={<InspectionDetail />} />
            <Route path="/drejtor/disiplina" element={<DisciplinePage />} />
            <Route path="/drejtor/nva" element={<SpecialNeedsManagement />} />
            <Route path="/drejtor/keshillat" element={<SchoolCouncils />} />
            <Route path="/drejtor/aktivitete" element={<Activities />} />
            <Route path="/drejtor/takimet" element={<ParentMeetings />} />
            <Route path="/drejtor/testet-kombetare" element={<NationalTests />} />
            <Route path="/drejtor/audit" element={<AuditLogs />} />
            <Route path="/drejtor/kerkesa-fshirje" element={<DeletionRequests />} />
            <Route path="/drejtor/njoftime" element={<Announcements />} />
            <Route path="/drejtor/mesazhet" element={<MessagesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/drejtor" replace />} />
        </Routes>
      </Suspense>
    );
  }

  if (profile.role === 'mesues') {
    return (
      <Suspense fallback={<PageLoader />}>
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
            <Route path="/mesues/ditari" element={<ClassDiary />} />
            <Route path="/mesues/detyrat" element={<HomeworkPage />} />
            <Route path="/mesues/2fa" element={<TwoFactorSettings />} />
            <Route path="/mesues/dokumentet-ligjore" element={<LegalDocuments />} />
            <Route path="/mesues/diagnostik" element={<DiagnosticAssessments />} />
            <Route path="/mesues/portofoli" element={<Portfolio />} />
            <Route path="/mesues/frekuentimi" element={<AttendancePage />} />
            <Route path="/mesues/lendet" element={<SubjectsPage />} />
            <Route path="/mesues/orari" element={<TeacherSchedule />} />
            <Route path="/mesues/mesazhet" element={<MessagesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/mesues" replace />} />
        </Routes>
      </Suspense>
    );
  }

  if (profile.role === 'nxenes') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/nxenes" replace />} />
          <Route element={<DashboardLayout navItems={studentNav} role="nxenes" />}>
            <Route path="/nxenes" element={<StudentDashboard />} />
            <Route path="/nxenes/nota" element={<MyGrades />} />
            <Route path="/nxenes/orari" element={<MySchedule />} />
            <Route path="/nxenes/frekuentimi" element={<MyAttendance />} />
            <Route path="/nxenes/mesazhet" element={<MessagesPage />} />
            <Route path="/nxenes/keshillat" element={<MyCouncils />} />
            <Route path="/nxenes/testet-kombetare" element={<MyTestResults />} />
            <Route path="/nxenes/portofoli" element={<Portfolio />} />
            <Route path="/nxenes/vetevleresimi" element={<SelfAssessmentPage />} />
            <Route path="/nxenes/dokumentet-ligjore" element={<LegalDocuments />} />
          </Route>
          <Route path="*" element={<Navigate to="/nxenes" replace />} />
        </Routes>
      </Suspense>
    );
  }

  if (profile.role === 'prind') {
    return (
      <Suspense fallback={<PageLoader />}>
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
            <Route path="/prind/testet-kombetare" element={<MyTestResults />} />
            <Route path="/prind/portofoli" element={<Portfolio />} />
            <Route path="/prind/privatesia" element={<PrivacySettings />} />
            <Route path="/prind/dokumentet-ligjore" element={<LegalDocuments />} />
          </Route>
          <Route path="*" element={<Navigate to="/prind" replace />} />
        </Routes>
      </Suspense>
    );
  }

  if (profile.role === 'pedagog') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/pedagog" replace />} />
          <Route element={<DashboardLayout navItems={pedagogNav} role="pedagog" />}>
            <Route path="/pedagog" element={<DirectorDashboard />} />
            <Route path="/pedagog/nva" element={<SpecialNeedsManagement />} />
            <Route path="/pedagog/diagnostik" element={<DiagnosticAssessments />} />
            <Route path="/pedagog/portofoli" element={<Portfolio />} />
            <Route path="/pedagog/keshillat" element={<MyCouncils />} />
            <Route path="/pedagog/aktivitete" element={<Activities />} />
            <Route path="/pedagog/takimet" element={<ParentMeetings />} />
            <Route path="/pedagog/mesazhet" element={<MessagesPage />} />
            <Route path="/pedagog/2fa" element={<TwoFactorSettings />} />
            <Route path="/pedagog/dokumentet-ligjore" element={<LegalDocuments />} />
          </Route>
          <Route path="*" element={<Navigate to="/pedagog" replace />} />
        </Routes>
      </Suspense>
    );
  }

  if (profile.role === 'drejtor_komunal') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dka" replace />} />
          <Route element={<DashboardLayout navItems={dkaNav} role="drejtor_komunal" />}>
            <Route path="/dka" element={<DkaDashboard />} />
            <Route path="/dka/shkollat" element={<SchoolsManagement />} />
            <Route path="/dka/vendbanimet" element={<LocalitiesManagement />} />
            <Route path="/dka/mesazhet" element={<MessagesPage />} />
            <Route path="/dka/komunat" element={<Municipalities />} />
            <Route path="/dka/2fa" element={<TwoFactorSettings />} />
            <Route path="/dka/dokumentet-ligjore" element={<LegalDocuments />} />
          </Route>
          <Route path="*" element={<Navigate to="/dka" replace />} />
        </Routes>
      </Suspense>
    );
  }

  if (profile.role === 'inspektor') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/inspektor" replace />} />
          <Route element={<DashboardLayout navItems={inspektorNav} role="inspektor" />}>
            <Route path="/inspektor" element={<InspectionsManagement />} />
            <Route path="/inspektor/inspektimet" element={<InspectionsManagement />} />
            <Route path="/inspektor/inspektimet/:id" element={<InspectionDetail />} />
            <Route path="/inspektor/shkollat" element={<SchoolsManagement />} />
            <Route path="/inspektor/mesazhet" element={<MessagesPage />} />
            <Route path="/inspektor/2fa" element={<TwoFactorSettings />} />
            <Route path="/inspektor/dokumentet-ligjore" element={<LegalDocuments />} />
          </Route>
          <Route path="*" element={<Navigate to="/inspektor" replace />} />
        </Routes>
      </Suspense>
    );
  }

  if (profile.role === 'ministri') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/ministri" replace />} />
          <Route element={<DashboardLayout navItems={ministriNav} role="ministri" />}>
            <Route path="/ministri" element={<MinistriDashboard />} />
            <Route path="/ministri/stafi" element={<StaffAccountsManagement />} />
            <Route path="/ministri/shkollat" element={<SchoolsManagement />} />
            <Route path="/ministri/vendbanimet" element={<LocalitiesManagement />} />
            <Route path="/ministri/komunat" element={<Municipalities />} />
            <Route path="/ministri/mesazhet" element={<MessagesPage />} />
            <Route path="/ministri/audit" element={<AuditLogs />} />
            <Route path="/ministri/2fa" element={<TwoFactorSettings />} />
            <Route path="/ministri/dokumentet-ligjore" element={<LegalDocuments />} />
          </Route>
          <Route path="*" element={<Navigate to="/ministri" replace />} />
        </Routes>
      </Suspense>
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
      <I18nProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

export default App;
