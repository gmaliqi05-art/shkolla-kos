import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { I18nProvider } from './lib/i18n/I18nProvider';
import { ToastProvider } from './components/ToastProvider';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import ErrorBoundary from './components/ErrorBoundary';
import type { NavItem } from './components/layout/Sidebar';

function lazyRetry(factory: () => Promise<{ default: React.ComponentType }>) {
  return lazy(() =>
    factory().catch((err) => {
      // Nje chunk i vjeter mund te mungoje pas nje deploy-i te ri. Provojme nje
      // pastrim + reload, por vetem nje here ne nje dritare kohore qe te mos
      // krijohet loop i pafund (dridhje) nese chunk-u mungon vertet.
      const KEY = 'chunk-reload-ts';
      const last = Number(sessionStorage.getItem(KEY) || 0);
      if (Date.now() - last > 30000) {
        sessionStorage.setItem(KEY, String(Date.now()));
        if ('caches' in window) {
          caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))));
        }
        window.location.reload();
        return new Promise<{ default: React.ComponentType }>(() => {});
      }
      throw err;
    })
  );
}

const DirectorDashboard = lazyRetry(() => import('./pages/director/DirectorDashboard'));
const ManageTeachers = lazyRetry(() => import('./pages/director/ManageTeachers'));
const ManageClasses = lazyRetry(() => import('./pages/director/ManageClasses'));
const ManageStudents = lazyRetry(() => import('./pages/director/ManageStudents'));
const ManageParents = lazyRetry(() => import('./pages/director/ManageParents'));
const ManagePedagogues = lazyRetry(() => import('./pages/director/ManagePedagogues'));
const Reports = lazyRetry(() => import('./pages/director/Reports'));
const Announcements = lazyRetry(() => import('./pages/director/Announcements'));
const AuditLogs = lazyRetry(() => import('./pages/director/AuditLogs'));
const DeletionRequests = lazyRetry(() => import('./pages/director/DeletionRequests'));
const SpecialNeedsManagement = lazyRetry(() => import('./pages/director/SpecialNeedsManagement'));
const SchoolCouncils = lazyRetry(() => import('./pages/director/SchoolCouncils'));
const SchoolSettings = lazyRetry(() => import('./pages/director/SchoolSettings'));
const ReportCards = lazyRetry(() => import('./pages/director/ReportCards'));
const ReportCardView = lazyRetry(() => import('./pages/director/ReportCardView'));
const TeacherLicensing = lazyRetry(() => import('./pages/director/TeacherLicensing'));
const Activities = lazyRetry(() => import('./pages/director/Activities'));
const NationalTests = lazyRetry(() => import('./pages/director/NationalTests'));
const Municipalities = lazyRetry(() => import('./pages/director/Municipalities'));
const SchoolCalendar = lazyRetry(() => import('./pages/director/SchoolCalendar'));
const AnnualPlan = lazyRetry(() => import('./pages/director/AnnualPlan'));
const LibraryPage = lazyRetry(() => import('./pages/director/Library'));
const TwoFactorSettings = lazyRetry(() => import('./pages/TwoFactorSettings'));
const LegalDocuments = lazyRetry(() => import('./pages/shared/LegalDocuments'));
const RoleGuide = lazyRetry(() => import('./pages/shared/RoleGuide'));
const MinistriDashboard = lazyRetry(() => import('./pages/ministri/MinistriDashboard'));
const StaffAccountsManagement = lazyRetry(() => import('./pages/ministri/StaffAccountsManagement'));
const DkaDashboard = lazyRetry(() => import('./pages/dka/DkaDashboard'));
const SchoolsManagement = lazyRetry(() => import('./pages/shared/SchoolsManagement'));
const LocalitiesManagement = lazyRetry(() => import('./pages/shared/LocalitiesManagement'));
const InspectionsManagement = lazyRetry(() => import('./pages/inspektor/InspectionsManagement'));
const InspectionDetail = lazyRetry(() => import('./pages/inspektor/InspectionDetail'));
const InspectorDashboard = lazyRetry(() => import('./pages/inspektor/InspectorDashboard'));
const PedagogDashboard = lazyRetry(() => import('./pages/pedagog/PedagogDashboard'));
const SuperAdminDashboard = lazyRetry(() => import('./pages/admin/SuperAdminDashboard'));
const UserManual = lazyRetry(() => import('./pages/admin/UserManual'));

const TeacherDashboard = lazyRetry(() => import('./pages/teacher/TeacherDashboard'));
const MyClasses = lazyRetry(() => import('./pages/teacher/MyClasses'));
const GradeEntry = lazyRetry(() => import('./pages/teacher/GradeEntry'));
const AttendancePage = lazyRetry(() => import('./pages/teacher/AttendancePage'));
const TeacherSchedule = lazyRetry(() => import('./pages/teacher/TeacherSchedule'));
const SubjectsPage = lazyRetry(() => import('./pages/teacher/SubjectsPage'));
const BehaviorPage = lazyRetry(() => import('./pages/teacher/BehaviorPage'));
const DisciplinePage = lazyRetry(() => import('./pages/teacher/DisciplinePage'));
const StudentAccommodations = lazyRetry(() => import('./pages/teacher/StudentAccommodations'));
const MyLicense = lazyRetry(() => import('./pages/teacher/MyLicense'));
const ParentMeetings = lazyRetry(() => import('./pages/teacher/ParentMeetings'));
const ClassDiary = lazyRetry(() => import('./pages/teacher/ClassDiary'));
const HomeworkPage = lazyRetry(() => import('./pages/teacher/HomeworkPage'));
const DiagnosticAssessments = lazyRetry(() => import('./pages/teacher/DiagnosticAssessments'));

const StudentDashboard = lazyRetry(() => import('./pages/student/StudentDashboard'));
const MyGrades = lazyRetry(() => import('./pages/student/MyGrades'));
const MySchedule = lazyRetry(() => import('./pages/student/MySchedule'));
const MyAttendance = lazyRetry(() => import('./pages/student/MyAttendance'));

const ParentDashboard = lazyRetry(() => import('./pages/parent/ParentDashboard'));
const ChildGrades = lazyRetry(() => import('./pages/parent/ChildGrades'));
const ChildAttendance = lazyRetry(() => import('./pages/parent/ChildAttendance'));
const PrivacySettings = lazyRetry(() => import('./pages/parent/PrivacySettings'));
const ChildIEP = lazyRetry(() => import('./pages/parent/ChildIEP'));

const MessagesPage = lazyRetry(() => import('./pages/shared/MessagesPage'));
const PrivacyPolicy = lazyRetry(() => import('./pages/shared/PrivacyPolicy'));
const MyCouncils = lazyRetry(() => import('./pages/shared/MyCouncils'));
const MyTestResults = lazyRetry(() => import('./pages/shared/MyTestResults'));
const ProfileSettings = lazyRetry(() => import('./pages/shared/ProfileSettings'));
const Portfolio = lazyRetry(() => import('./pages/shared/Portfolio'));
const SelfAssessmentPage = lazyRetry(() => import('./pages/student/SelfAssessment'));

import {
  LayoutDashboard, Users, GraduationCap, Layers, BarChart3,
  Megaphone, BookOpen, ClipboardCheck, CalendarCheck, Award,
  Calendar, Clock, Star, MessageSquare, Library, UserCog, Shield,
  Activity, Trash2, Lock, Heart, Sparkles, Briefcase, FileCheck, Building2,
  Trophy, MapPin, NotebookPen, FileText, Stethoscope, FolderOpen, FileSpreadsheet, ShieldCheck, Scale,
  Crown, Building, School, HardDrive, Settings as SettingsIcon,
} from 'lucide-react';

const directorNav: NavItem[] = [
  { label: 'Paneli Kryesor', labelKey: 'nav.dashboard', path: '/drejtor', icon: LayoutDashboard },
  { label: 'Mesuesit', labelKey: 'nav.teachers', path: '/drejtor/mesues', icon: GraduationCap },
  { label: 'Pedagogët', path: '/drejtor/pedagoget', icon: Heart },
  { label: 'Licencat', labelKey: 'nav.licenses', path: '/drejtor/licencat', icon: Award },
  { label: 'Nxenesit', labelKey: 'nav.students', path: '/drejtor/nxenes', icon: Users },
  { label: 'Prinderit', labelKey: 'nav.parents', path: '/drejtor/prinder', icon: UserCog },
  { label: 'Klasat', labelKey: 'nav.classes', path: '/drejtor/klasa', icon: Layers },
  { label: 'Raportet', labelKey: 'nav.reports', path: '/drejtor/raporte', icon: BarChart3 },
  { label: 'Dëftesat', labelKey: 'nav.report_cards', path: '/drejtor/deftesat', icon: FileCheck },
  { label: 'Disiplina', labelKey: 'nav.discipline', path: '/drejtor/disiplina', icon: Shield },
  { label: 'NVA & PIA', labelKey: 'nav.iep', path: '/drejtor/nva', icon: Heart },
  { label: 'Organet Shkollore', labelKey: 'nav.councils', path: '/drejtor/keshillat', icon: Briefcase },
  { label: 'Aktivitetet', labelKey: 'nav.activities', path: '/drejtor/aktivitete', icon: Trophy },
  { label: 'Takimet me Prindër', labelKey: 'nav.meetings', path: '/drejtor/takimet', icon: Users },
  { label: 'Testet Kombëtare', labelKey: 'nav.national_tests', path: '/drejtor/testet-kombetare', icon: GraduationCap },
  { label: 'Audit Log', labelKey: 'nav.audit_log', path: '/drejtor/audit', icon: Activity },
  { label: 'Kërkesat Fshirje', labelKey: 'nav.deletion_requests', path: '/drejtor/kerkesa-fshirje', icon: Trash2 },
  { label: 'Cilësimet', labelKey: 'nav.settings', path: '/drejtor/cilesime', icon: Building2 },
  { label: 'Komunat', labelKey: 'nav.municipalities', path: '/drejtor/komunat', icon: MapPin },
  { label: 'Kalendari', labelKey: 'nav.calendar', path: '/drejtor/kalendari', icon: Calendar },
  { label: 'Plani Vjetor', labelKey: 'nav.annual_plan', path: '/drejtor/plani-vjetor', icon: FileSpreadsheet },
  { label: 'Biblioteka', labelKey: 'nav.library', path: '/drejtor/biblioteka', icon: Library },
  { label: '2FA / Siguria', labelKey: 'nav.two_factor', path: '/drejtor/2fa', icon: ShieldCheck },
  { label: 'Dokumentet Ligjore', labelKey: 'nav.legal_documents', path: '/drejtor/dokumentet-ligjore', icon: Scale },
  { label: 'Inspektimet', labelKey: 'nav.inspections', path: '/drejtor/inspektimet', icon: ClipboardCheck },
  { label: 'Njoftimet', labelKey: 'nav.announcements', path: '/drejtor/njoftime', icon: Megaphone },
  { label: 'Mesazhet', labelKey: 'nav.messages', path: '/drejtor/mesazhet', icon: MessageSquare },
];

const teacherNav: NavItem[] = [
  { label: 'Paneli Kryesor', labelKey: 'nav.dashboard', path: '/mesues', icon: LayoutDashboard },
  { label: 'Klasat e Mia', labelKey: 'nav.my_classes', path: '/mesues/klasa', icon: BookOpen },
  { label: 'Lëndët Mësimore', labelKey: 'nav.my_lessons', path: '/mesues/lendet', icon: Library },
  { label: 'Vendos Nota', labelKey: 'nav.enter_grades', path: '/mesues/nota', icon: ClipboardCheck },
  { label: 'Sjellja', labelKey: 'nav.behavior', path: '/mesues/sjellja', icon: Star },
  { label: 'Disiplina', labelKey: 'nav.discipline', path: '/mesues/disiplina', icon: Shield },
  { label: 'Akomodimet', labelKey: 'nav.accommodations', path: '/mesues/akomodimet', icon: Sparkles },
  { label: 'Këshillat e Mi', labelKey: 'nav.my_councils', path: '/mesues/keshillat', icon: Briefcase },
  { label: 'Frekuentimi', labelKey: 'nav.attendance', path: '/mesues/frekuentimi', icon: CalendarCheck },
  { label: 'Orari Mësimor', labelKey: 'nav.lesson_schedule', path: '/mesues/orari', icon: Clock },
  { label: 'Mesazhet', labelKey: 'nav.messages', path: '/mesues/mesazhet', icon: MessageSquare },
  { label: 'Licenca Ime', labelKey: 'nav.my_license', path: '/mesues/licenca', icon: Award },
  { label: 'Aktivitetet', labelKey: 'nav.activities', path: '/mesues/aktivitete', icon: Trophy },
  { label: 'Takimet me Prindër', labelKey: 'nav.meetings', path: '/mesues/takimet', icon: Users },
  { label: '2FA / Siguria', labelKey: 'nav.two_factor', path: '/mesues/2fa', icon: ShieldCheck },
  { label: 'Dokumentet Ligjore', labelKey: 'nav.legal_documents', path: '/mesues/dokumentet-ligjore', icon: Scale },
  { label: 'Ditari i Klasës', labelKey: 'nav.class_diary', path: '/mesues/ditari', icon: NotebookPen },
  { label: 'Detyrat e Shtëpisë', labelKey: 'nav.homework', path: '/mesues/detyrat', icon: FileText },
  { label: 'Vlerësimi Diagnostikues', labelKey: 'nav.diagnostic', path: '/mesues/diagnostik', icon: Stethoscope },
  { label: 'Portofoli', labelKey: 'nav.portfolio', path: '/mesues/portofoli', icon: FolderOpen },
];

const studentNav: NavItem[] = [
  { label: 'Paneli Kryesor', labelKey: 'nav.dashboard', path: '/nxenes', icon: LayoutDashboard },
  { label: 'Notat e Mia', labelKey: 'nav.my_grades', path: '/nxenes/nota', icon: Award },
  { label: 'Orari Im', labelKey: 'nav.my_schedule', path: '/nxenes/orari', icon: Clock },
  { label: 'Frekuentimi', labelKey: 'nav.attendance', path: '/nxenes/frekuentimi', icon: Calendar },
  { label: 'Mesazhet', labelKey: 'nav.messages', path: '/nxenes/mesazhet', icon: MessageSquare },
  { label: 'Këshillat e Mi', labelKey: 'nav.my_councils', path: '/nxenes/keshillat', icon: Briefcase },
  { label: 'Testet Kombëtare', labelKey: 'nav.national_tests', path: '/nxenes/testet-kombetare', icon: GraduationCap },
  { label: 'Portofoli Im', labelKey: 'nav.my_portfolio', path: '/nxenes/portofoli', icon: FolderOpen },
  { label: 'Vetëvlerësimi', labelKey: 'nav.self_assessment', path: '/nxenes/vetevleresimi', icon: Heart },
  { label: 'Dokumentet Ligjore', labelKey: 'nav.legal_documents', path: '/nxenes/dokumentet-ligjore', icon: Scale },
];

const parentNav: NavItem[] = [
  { label: 'Paneli Kryesor', labelKey: 'nav.dashboard', path: '/prind', icon: LayoutDashboard },
  { label: 'Notat', labelKey: 'nav.grades', path: '/prind/nota', icon: Star },
  { label: 'Frekuentimi', labelKey: 'nav.attendance', path: '/prind/frekuentimi', icon: Calendar },
  { label: 'Mesazhet', labelKey: 'nav.messages', path: '/prind/mesazhet', icon: MessageSquare },
  { label: 'PIA i Fëmijës', labelKey: 'nav.child_iep', path: '/prind/pia', icon: Heart },
  { label: 'Aktivitetet', labelKey: 'nav.activities', path: '/prind/aktivitete', icon: Trophy },
  { label: 'Takimet', labelKey: 'nav.meetings', path: '/prind/takimet', icon: Users },
  { label: 'Këshillat e Mi', labelKey: 'nav.my_councils', path: '/prind/keshillat', icon: Briefcase },
  { label: 'Testet Kombëtare', labelKey: 'nav.national_tests', path: '/prind/testet-kombetare', icon: GraduationCap },
  { label: 'Portofoli', labelKey: 'nav.portfolio', path: '/prind/portofoli', icon: FolderOpen },
  { label: 'Privatësia', labelKey: 'nav.privacy', path: '/prind/privatesia', icon: Lock },
  { label: 'Dokumentet Ligjore', labelKey: 'nav.legal_documents', path: '/prind/dokumentet-ligjore', icon: Scale },
];

const dkaNav: NavItem[] = [
  { label: 'Paneli Kryesor', labelKey: 'nav.dashboard', path: '/dka', icon: LayoutDashboard },
  { label: 'Shkollat', labelKey: 'nav.schools', path: '/dka/shkollat', icon: School },
  { label: 'Vendbanimet', labelKey: 'nav.localities', path: '/dka/vendbanimet', icon: MapPin },
  { label: 'Komunat', labelKey: 'nav.municipalities', path: '/dka/komunat', icon: Building },
  { label: 'Mesazhet', labelKey: 'nav.messages', path: '/dka/mesazhet', icon: MessageSquare },
  { label: '2FA / Siguria', labelKey: 'nav.two_factor', path: '/dka/2fa', icon: ShieldCheck },
  { label: 'Dokumentet Ligjore', labelKey: 'nav.legal_documents', path: '/dka/dokumentet-ligjore', icon: Scale },
];

const ministriNav: NavItem[] = [
  { label: 'Paneli Kryesor', labelKey: 'nav.dashboard', path: '/ministri', icon: Crown },
  { label: 'Stafi Administrativ', labelKey: 'nav.staff', path: '/ministri/stafi', icon: UserCog },
  { label: 'Shkollat', labelKey: 'nav.schools', path: '/ministri/shkollat', icon: School },
  { label: 'Vendbanimet', labelKey: 'nav.localities', path: '/ministri/vendbanimet', icon: MapPin },
  { label: 'Komunat', labelKey: 'nav.municipalities', path: '/ministri/komunat', icon: Building },
  { label: 'Mesazhet', labelKey: 'nav.messages', path: '/ministri/mesazhet', icon: MessageSquare },
  { label: 'Audit Log', labelKey: 'nav.audit_log', path: '/ministri/audit', icon: Activity },
  { label: '2FA / Siguria', labelKey: 'nav.two_factor', path: '/ministri/2fa', icon: ShieldCheck },
  { label: 'Dokumentet Ligjore', labelKey: 'nav.legal_documents', path: '/ministri/dokumentet-ligjore', icon: Scale },
];

const inspektorNav: NavItem[] = [
  { label: 'Paneli Kryesor', labelKey: 'nav.dashboard', path: '/inspektor', icon: LayoutDashboard },
  { label: 'Inspektimet', labelKey: 'nav.inspections', path: '/inspektor/inspektimet', icon: ClipboardCheck },
  { label: 'Shkollat', labelKey: 'nav.schools', path: '/inspektor/shkollat', icon: School },
  { label: 'Mesazhet', labelKey: 'nav.messages', path: '/inspektor/mesazhet', icon: MessageSquare },
  { label: '2FA / Siguria', labelKey: 'nav.two_factor', path: '/inspektor/2fa', icon: ShieldCheck },
  { label: 'Dokumentet Ligjore', labelKey: 'nav.legal_documents', path: '/inspektor/dokumentet-ligjore', icon: Scale },
];

const pedagogNav: NavItem[] = [
  { label: 'Paneli Kryesor', labelKey: 'nav.dashboard', path: '/pedagog', icon: LayoutDashboard },
  { label: 'NVA & PIA', labelKey: 'nav.iep', path: '/pedagog/nva', icon: Heart },
  { label: 'Vlerësimi Diagnostikues', labelKey: 'nav.diagnostic', path: '/pedagog/diagnostik', icon: Stethoscope },
  { label: 'Portofoli', labelKey: 'nav.portfolio', path: '/pedagog/portofoli', icon: FolderOpen },
  { label: 'Organet Shkollore', labelKey: 'nav.councils', path: '/pedagog/keshillat', icon: Briefcase },
  { label: 'Aktivitetet', labelKey: 'nav.activities', path: '/pedagog/aktivitete', icon: Trophy },
  { label: 'Takimet me Prindër', labelKey: 'nav.meetings', path: '/pedagog/takimet', icon: Users },
  { label: 'Mesazhet', labelKey: 'nav.messages', path: '/pedagog/mesazhet', icon: MessageSquare },
  { label: '2FA / Siguria', labelKey: 'nav.two_factor', path: '/pedagog/2fa', icon: ShieldCheck },
  { label: 'Dokumentet Ligjore', labelKey: 'nav.legal_documents', path: '/pedagog/dokumentet-ligjore', icon: Scale },
];

const adminNav: NavItem[] = [
  { label: 'Paneli Kryesor', labelKey: 'nav.dashboard', path: '/admin', icon: Shield },
  { label: 'Manual i Përdorimit', labelKey: 'manual.title', path: '/admin/manual', icon: BookOpen },
  { label: 'Përmbajtja Homepage', labelKey: 'nav.admin_content', path: '/admin/content', icon: FileText },
  { label: 'Politikat', labelKey: 'nav.admin_policies', path: '/admin/policies', icon: Scale },
  { label: 'Logs & Monitorim', labelKey: 'nav.admin_logs', path: '/admin/logs', icon: Activity },
  { label: 'Backup', labelKey: 'nav.admin_backups', path: '/admin/backups', icon: HardDrive },
  { label: 'Migrations DB', labelKey: 'nav.admin_migrations', path: '/admin/migrations', icon: Building2 },
  { label: 'Cilësimet', labelKey: 'nav.settings', path: '/admin/settings', icon: SettingsIcon },
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
          <Route path="/udhezues/:role" element={<RoleGuide />} />
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
            <Route path="/drejtor/pedagoget" element={<ManagePedagogues />} />
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
            <Route path="/drejtor/profili" element={<ProfileSettings />} />
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
            <Route path="/mesues/profili" element={<ProfileSettings />} />
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
            <Route path="/nxenes/profili" element={<ProfileSettings />} />
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
            <Route path="/prind/profili" element={<ProfileSettings />} />
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
            <Route path="/pedagog" element={<PedagogDashboard />} />
            <Route path="/pedagog/nva" element={<SpecialNeedsManagement />} />
            <Route path="/pedagog/diagnostik" element={<DiagnosticAssessments />} />
            <Route path="/pedagog/portofoli" element={<Portfolio />} />
            <Route path="/pedagog/keshillat" element={<MyCouncils />} />
            <Route path="/pedagog/aktivitete" element={<Activities />} />
            <Route path="/pedagog/takimet" element={<ParentMeetings />} />
            <Route path="/pedagog/mesazhet" element={<MessagesPage />} />
            <Route path="/pedagog/profili" element={<ProfileSettings />} />
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
            <Route path="/dka/profili" element={<ProfileSettings />} />
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
            <Route path="/inspektor" element={<InspectorDashboard />} />
            <Route path="/inspektor/inspektimet" element={<InspectionsManagement />} />
            <Route path="/inspektor/inspektimet/:id" element={<InspectionDetail />} />
            <Route path="/inspektor/shkollat" element={<SchoolsManagement />} />
            <Route path="/inspektor/mesazhet" element={<MessagesPage />} />
            <Route path="/inspektor/profili" element={<ProfileSettings />} />
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
            <Route path="/ministri/profili" element={<ProfileSettings />} />
            <Route path="/ministri/audit" element={<AuditLogs />} />
            <Route path="/ministri/2fa" element={<TwoFactorSettings />} />
            <Route path="/ministri/dokumentet-ligjore" element={<LegalDocuments />} />
          </Route>
          <Route path="*" element={<Navigate to="/ministri" replace />} />
        </Routes>
      </Suspense>
    );
  }

  if (profile.role === 'super_admin') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route element={<DashboardLayout navItems={adminNav} role="super_admin" />}>
            <Route path="/admin" element={<SuperAdminDashboard />} />
            <Route path="/admin/manual" element={<UserManual />} />
            <Route path="/admin/content" element={<SuperAdminDashboard />} />
            <Route path="/admin/policies" element={<SuperAdminDashboard />} />
            <Route path="/admin/logs" element={<SuperAdminDashboard />} />
            <Route path="/admin/backups" element={<SuperAdminDashboard />} />
            <Route path="/admin/migrations" element={<SuperAdminDashboard />} />
            <Route path="/admin/settings" element={<SuperAdminDashboard />} />
            <Route path="/admin/profili" element={<ProfileSettings />} />
            <Route path="/admin/2fa" element={<TwoFactorSettings />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin" replace />} />
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
    <ErrorBoundary>
      <BrowserRouter>
        <I18nProvider>
          <ToastProvider>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </ToastProvider>
        </I18nProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
