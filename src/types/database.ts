export type UserRole = 'drejtor' | 'mesues' | 'nxenes' | 'prind' | 'pedagog' | 'drejtor_komunal' | 'ministri' | 'inspektor' | 'super_admin';

export type Gender = 'M' | 'F' | 'tjeter';

export type EnrollmentStatus = 'regjistruar' | 'transferuar' | 'perfunduar' | 'larguar';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string;
  avatar_url: string;
  created_at: string;
  personal_number: string | null;
  date_of_birth: string | null;
  place_of_birth: string;
  address: string;
  gender: Gender | null;
  nationality: string;
  mother_tongue: string;
  legal_guardian_name: string;
  legal_guardian_relation: string;
  enrollment_status: EnrollmentStatus;
  must_change_password?: boolean;
  deleted_at?: string | null;
  last_login_at?: string | null;
  consent_recorded_at?: string | null;
  license_number?: string | null;
  license_level?: LicenseLevel | null;
  license_issued_at?: string | null;
  license_expires_at?: string | null;
  qualification?: string;
  subject_specialization?: string;
  hired_at?: string | null;
  preferred_language?: 'sq' | 'sr' | 'tr' | 'bs';
  managed_municipality_id?: string | null;
  managed_locality_id?: string | null;
  school_id?: string | null;
}

// Të dhënat e ndjeshme shëndetësore ruhen veçmas profiles (RLS rigoroze:
// vetëm drejtori/pedagogu i shkollës, prindi & nxënësi).
export interface StudentHealthRecord {
  id: string;
  student_id: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  medical_conditions: string;
  family_doctor: string;
  updated_by?: string | null;
  updated_at?: string;
  created_at?: string;
}

export type LicenseLevel = 'fillestar' | 'karriere' | 'keshillues';

export const LICENSE_LEVEL_LABELS: Record<LicenseLevel, string> = {
  fillestar: 'Mësimdhënës fillestar',
  karriere: 'Mësimdhënës i karrierës',
  keshillues: 'Mësimdhënës këshillues',
};

export type ZHPMCategory =
  | 'didaktike_pedagogjike'
  | 'lendore'
  | 'tik'
  | 'gjuhe_te_huaj'
  | 'gjitheperfshirje'
  | 'menaxhim'
  | 'tjeter';

export const ZHPM_CATEGORY_LABELS: Record<ZHPMCategory, string> = {
  didaktike_pedagogjike: 'Didaktike / Pedagogjike',
  lendore: 'Lëndore',
  tik: 'TIK / Teknologji',
  gjuhe_te_huaj: 'Gjuhë të huaja',
  gjitheperfshirje: 'Gjithëpërfshirje (NVA)',
  menaxhim: 'Menaxhim',
  tjeter: 'Tjetër',
};

export interface ProfessionalDevelopment {
  id: string;
  teacher_id: string;
  title: string;
  organizer: string;
  hours: number;
  completion_date: string;
  certificate_url: string | null;
  category: ZHPMCategory;
  notes: string;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

// === Paketa 7: Aktivitetet Jashtëmësimore & Takimet me Prindër ===

export type ActivityCategory =
  | 'sport' | 'art' | 'shkence' | 'muzike' | 'gjuhe'
  | 'teknologji' | 'kulturore' | 'sociale' | 'mjedis' | 'olimpiada' | 'tjeter';

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  sport: 'Sport',
  art: 'Art pamor',
  shkence: 'Shkencë',
  muzike: 'Muzikë',
  gjuhe: 'Gjuhë',
  teknologji: 'Teknologji / TIK',
  kulturore: 'Kulturore',
  sociale: 'Sociale',
  mjedis: 'Mjedisi',
  olimpiada: 'Olimpiada / Garat',
  tjeter: 'Tjetër',
};

export interface ExtracurricularActivity {
  id: string;
  name: string;
  description: string;
  category: ActivityCategory;
  coordinator_id: string | null;
  schedule: string;
  location: string;
  max_participants: number | null;
  academic_year_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ActivityParticipant {
  id: string;
  activity_id: string;
  student_id: string;
  joined_at: string;
  left_at: string | null;
  parent_consent: boolean;
  parent_consent_at: string | null;
  notes: string;
  created_at: string;
}

export type ParentMeetingType = 'klase' | 'individuale' | 'pergjithshme';

export const PARENT_MEETING_TYPE_LABELS: Record<ParentMeetingType, string> = {
  klase: 'Takim klase',
  individuale: 'Takim individual',
  pergjithshme: 'Takim i përgjithshëm',
};

export interface ParentMeeting {
  id: string;
  meeting_type: ParentMeetingType;
  class_id: string | null;
  student_id: string | null;
  title: string;
  meeting_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string;
  agenda: string;
  notes: string;
  status: MeetingStatus;
  organized_by: string;
  created_at: string;
}

// === Paketa 8: Testet Kombëtare ===

export type NationalTestStatus = 'planifikuar' | 'mbajtur' | 'rezultatet_marrura' | 'perfunduar';

export const NATIONAL_TEST_STATUS_LABELS: Record<NationalTestStatus, string> = {
  planifikuar: 'I planifikuar',
  mbajtur: 'I mbajtur',
  rezultatet_marrura: 'Rezultatet të marra',
  perfunduar: 'I përfunduar',
};

export interface NationalTest {
  id: string;
  grade_level: number;
  academic_year_id: string | null;
  test_date: string;
  name: string;
  description: string;
  status: NationalTestStatus;
  created_at: string;
}

export type TestResultLevel = 'shkelqyeshem' | 'shume_mire' | 'mire' | 'kenaqshem' | 'pakenaqshem';

export const TEST_RESULT_LEVEL_LABELS: Record<TestResultLevel, string> = {
  shkelqyeshem: 'Shkëlqyeshëm',
  shume_mire: 'Shumë mirë',
  mire: 'Mirë',
  kenaqshem: 'I kënaqshëm',
  pakenaqshem: 'Pakënaqshëm',
};

export const TEST_RESULT_LEVEL_COLORS: Record<TestResultLevel, string> = {
  shkelqyeshem: 'bg-emerald-100 text-emerald-700',
  shume_mire: 'bg-blue-100 text-blue-700',
  mire: 'bg-cyan-100 text-cyan-700',
  kenaqshem: 'bg-amber-100 text-amber-700',
  pakenaqshem: 'bg-rose-100 text-rose-700',
};

export interface NationalTestResult {
  id: string;
  test_id: string;
  student_id: string;
  subject_id: string | null;
  subject_name: string;
  score: number | null;
  max_score: number | null;
  percentage: number | null;
  level: TestResultLevel | null;
  notes: string;
  recorded_by: string | null;
  recorded_at: string;
}

// === Paketa 10: Multi-shkollë & Komuna (Ligji 03/L-068) ===

export interface Municipality {
  id: string;
  name: string;
  region: string;
  code: string;
  created_at: string;
}

export type LocalityType = 'qytet' | 'fshat' | 'lagje' | 'komuna';

export const LOCALITY_TYPE_LABELS: Record<LocalityType, string> = {
  qytet: 'Qytet',
  fshat: 'Fshat',
  lagje: 'Lagje',
  komuna: 'Komunë',
};

export interface Locality {
  id: string;
  name: string;
  municipality_id: string;
  type: LocalityType;
  is_city_center: boolean;
  postal_code: string;
  created_at: string;
}

export type SchoolType =
  | 'parashkollor' | 'fillore' | 'fillore_mesme_ulet' | 'mesme_ulet'
  | 'mesme_larte' | 'profesionale' | 'speciale' | 'private';

export const SCHOOL_TYPE_LABELS: Record<SchoolType, string> = {
  parashkollor: 'Parashkollor',
  fillore: 'Shkollë Fillore',
  fillore_mesme_ulet: 'Shkollë Fillore dhe e Mesme e Ulët',
  mesme_ulet: 'Shkollë e Mesme e Ulët',
  mesme_larte: 'Shkollë e Mesme e Lartë',
  profesionale: 'Shkollë Profesionale',
  speciale: 'Shkollë Speciale',
  private: 'Shkollë Private',
};

// === Paketa 11: Ditari, Detyrat, Kalendari ===

export interface ClassJournalEntry {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  date: string;
  lesson_number: number | null;
  topic: string;
  homework: string;
  notes: string;
  created_at: string;
}

export interface Homework {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  title: string;
  description: string;
  assigned_date: string;
  due_date: string | null;
  attachment_url: string | null;
  created_at: string;
}

export type HomeworkSubmissionStatus = 'pa_dorezuar' | 'dorezuar' | 'vleresuar' | 'me_vonese';

export const HOMEWORK_SUBMISSION_STATUS_LABELS: Record<HomeworkSubmissionStatus, string> = {
  pa_dorezuar: 'Pa dorëzuar',
  dorezuar: 'Dorëzuar',
  vleresuar: 'Vlerësuar',
  me_vonese: 'Me vonesë',
};

export interface HomeworkSubmission {
  id: string;
  homework_id: string;
  student_id: string;
  status: HomeworkSubmissionStatus;
  submission_text: string;
  attachment_url: string | null;
  submitted_at: string | null;
  grade: number | null;
  teacher_feedback: string;
  reviewed_at: string | null;
}

export type SchoolEventType = 'pushim' | 'feste' | 'provim' | 'aktivitet' | 'mbledhje' | 'tjeter';

export const SCHOOL_EVENT_LABELS: Record<SchoolEventType, string> = {
  pushim: 'Pushim',
  feste: 'Festë zyrtare',
  provim: 'Periudhë provimi',
  aktivitet: 'Aktivitet shkollor',
  mbledhje: 'Mbledhje',
  tjeter: 'Tjetër',
};

export const SCHOOL_EVENT_COLORS: Record<SchoolEventType, string> = {
  pushim: 'bg-blue-100 text-blue-700',
  feste: 'bg-rose-100 text-rose-700',
  provim: 'bg-purple-100 text-purple-700',
  aktivitet: 'bg-emerald-100 text-emerald-700',
  mbledhje: 'bg-amber-100 text-amber-700',
  tjeter: 'bg-slate-100 text-slate-700',
};

export interface SchoolCalendarEvent {
  id: string;
  academic_year_id: string | null;
  date: string;
  event_type: SchoolEventType;
  title: string;
  description: string;
  is_school_day: boolean;
  target_grade_levels: number[] | null;
  created_by: string | null;
  created_at: string;
}

// === Paketa 12: Vlerësimi Diagnostikues & Portofoli (UA 06/2022) ===

export type StartingLevel = 'shume_i_dobet' | 'i_dobet' | 'mesatar' | 'i_mire' | 'shkelqyer';

export const STARTING_LEVEL_LABELS: Record<StartingLevel, string> = {
  shume_i_dobet: 'Shumë i/e dobët',
  i_dobet: 'I/E dobët',
  mesatar: 'Mesatar/e',
  i_mire: 'I/E mirë',
  shkelqyer: 'Shkëlqyer',
};

export const STARTING_LEVEL_COLORS: Record<StartingLevel, string> = {
  shume_i_dobet: 'bg-rose-100 text-rose-700',
  i_dobet: 'bg-amber-100 text-amber-700',
  mesatar: 'bg-cyan-100 text-cyan-700',
  i_mire: 'bg-blue-100 text-blue-700',
  shkelqyer: 'bg-emerald-100 text-emerald-700',
};

export interface DiagnosticAssessment {
  id: string;
  student_id: string;
  class_id: string;
  subject_id: string | null;
  teacher_id: string;
  academic_year_id: string | null;
  assessment_date: string;
  starting_level: StartingLevel | null;
  strengths: string;
  weaknesses: string;
  recommended_actions: string;
  created_at: string;
}

export interface StudentPortfolio {
  id: string;
  student_id: string;
  academic_year_id: string | null;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export type PortfolioItemType = 'punim' | 'projekt' | 'detyre' | 'foto' | 'video' | 'vetevleresim' | 'reflektim' | 'tjeter';

export const PORTFOLIO_ITEM_TYPE_LABELS: Record<PortfolioItemType, string> = {
  punim: 'Punim me shkrim',
  projekt: 'Projekt',
  detyre: 'Detyrë',
  foto: 'Foto',
  video: 'Video',
  vetevleresim: 'Vetëvlerësim',
  reflektim: 'Reflektim',
  tjeter: 'Tjetër',
};

export const PORTFOLIO_ITEM_COLORS: Record<PortfolioItemType, string> = {
  punim: 'bg-blue-100 text-blue-700',
  projekt: 'bg-purple-100 text-purple-700',
  detyre: 'bg-cyan-100 text-cyan-700',
  foto: 'bg-pink-100 text-pink-700',
  video: 'bg-rose-100 text-rose-700',
  vetevleresim: 'bg-emerald-100 text-emerald-700',
  reflektim: 'bg-amber-100 text-amber-700',
  tjeter: 'bg-slate-100 text-slate-700',
};

export interface PortfolioItem {
  id: string;
  portfolio_id: string;
  subject_id: string | null;
  item_type: PortfolioItemType;
  title: string;
  description: string;
  content: string;
  attachment_url: string | null;
  added_by: string | null;
  added_by_role: string | null;
  added_at: string;
}

export type SelfAssessmentLevel = 'shkelqyeshem' | 'shume_mire' | 'mire' | 'kenaqshem' | 'duhet_permiresuar';

export const SELF_ASSESS_LEVEL_LABELS: Record<SelfAssessmentLevel, string> = {
  shkelqyeshem: 'Shkëlqyeshëm',
  shume_mire: 'Shumë mirë',
  mire: 'Mirë',
  kenaqshem: 'I/E kënaqshëm',
  duhet_permiresuar: 'Duhet të përmirësohem',
};

export const SELF_ASSESS_LEVEL_COLORS: Record<SelfAssessmentLevel, string> = {
  shkelqyeshem: 'bg-emerald-100 text-emerald-700',
  shume_mire: 'bg-blue-100 text-blue-700',
  mire: 'bg-cyan-100 text-cyan-700',
  kenaqshem: 'bg-amber-100 text-amber-700',
  duhet_permiresuar: 'bg-rose-100 text-rose-700',
};

export interface SelfAssessment {
  id: string;
  student_id: string;
  subject_id: string | null;
  class_id: string | null;
  period: number | null;
  level: SelfAssessmentLevel;
  what_learned: string;
  what_to_improve: string;
  goals: string;
  created_at: string;
}

// === Paketa 13: Plani Vjetor i Shkollës ===

export type AnnualPlanStatus = 'draft' | 'miratuar' | 'aktiv' | 'perfunduar';

export const ANNUAL_PLAN_STATUS_LABELS: Record<AnnualPlanStatus, string> = {
  draft: 'Draft',
  miratuar: 'I miratuar',
  aktiv: 'Aktiv',
  perfunduar: 'I përfunduar',
};

export const ANNUAL_PLAN_STATUS_COLORS: Record<AnnualPlanStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  miratuar: 'bg-blue-100 text-blue-700',
  aktiv: 'bg-emerald-100 text-emerald-700',
  perfunduar: 'bg-purple-100 text-purple-700',
};

export interface AnnualSchoolPlan {
  id: string;
  academic_year_id: string | null;
  school_id: string | null;
  title: string;
  vision: string;
  mission: string;
  values_principles: string;
  analysis_situation: string;
  priority_areas: string;
  general_goals: string;
  resources: string;
  evaluation_methods: string;
  status: AnnualPlanStatus;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  approved_notes: string;
  created_at: string;
  updated_at: string;
}

export type PlanObjectiveArea = 'mesimore' | 'organizative' | 'infrastrukture' | 'profesionale' | 'sociale' | 'tjeter';

export const PLAN_OBJECTIVE_AREA_LABELS: Record<PlanObjectiveArea, string> = {
  mesimore: 'Mësimore',
  organizative: 'Organizative',
  infrastrukture: 'Infrastrukturë',
  profesionale: 'Profesionale (staf)',
  sociale: 'Sociale & komunitare',
  tjeter: 'Tjetër',
};

export type PlanObjectiveStatus = 'planifikuar' | 'ne_proces' | 'arritur' | 'pjeserisht_arritur' | 'nuk_eshte_arritur';

export const PLAN_OBJECTIVE_STATUS_LABELS: Record<PlanObjectiveStatus, string> = {
  planifikuar: 'I planifikuar',
  ne_proces: 'Në proces',
  arritur: 'I arritur',
  pjeserisht_arritur: 'Pjesërisht i arritur',
  nuk_eshte_arritur: 'Nuk është arritur',
};

export interface PlanObjective {
  id: string;
  plan_id: string;
  area: PlanObjectiveArea;
  title: string;
  description: string;
  expected_outcome: string;
  responsible_person: string;
  start_date: string | null;
  target_date: string | null;
  status: PlanObjectiveStatus;
  notes: string;
  created_at: string;
}

// === Paketa 14: Biblioteka Shkollore ===

export type BookCategory = 'letersi' | 'shkence' | 'matematike' | 'histori' | 'gjeografi' | 'gjuhe' | 'art' | 'biografi' | 'enciklopedi' | 'tekst_shkollor' | 'tjeter';

export const BOOK_CATEGORY_LABELS: Record<BookCategory, string> = {
  letersi: 'Letërsi',
  shkence: 'Shkencë',
  matematike: 'Matematikë',
  histori: 'Histori',
  gjeografi: 'Gjeografi',
  gjuhe: 'Gjuhë',
  art: 'Art',
  biografi: 'Biografi',
  enciklopedi: 'Enciklopedi',
  tekst_shkollor: 'Tekst shkollor',
  tjeter: 'Tjetër',
};

export interface LibraryBook {
  id: string;
  isbn: string | null;
  title: string;
  author: string;
  publisher: string;
  publication_year: number | null;
  category: BookCategory;
  language: string;
  copies_total: number;
  copies_available: number;
  location: string;
  cover_url: string | null;
  description: string;
  created_at: string;
}

export type BookLoanStatus = 'aktive' | 'kthyer' | 'vonuar' | 'humbur';

export const BOOK_LOAN_STATUS_LABELS: Record<BookLoanStatus, string> = {
  aktive: 'Aktive',
  kthyer: 'Kthyer',
  vonuar: 'Vonuar',
  humbur: 'Humbur',
};

export const BOOK_LOAN_STATUS_COLORS: Record<BookLoanStatus, string> = {
  aktive: 'bg-blue-100 text-blue-700',
  kthyer: 'bg-emerald-100 text-emerald-700',
  vonuar: 'bg-amber-100 text-amber-700',
  humbur: 'bg-rose-100 text-rose-700',
};

export interface BookLoan {
  id: string;
  book_id: string;
  borrower_id: string;
  loan_date: string;
  due_date: string;
  returned_date: string | null;
  status: BookLoanStatus;
  notes: string;
  issued_by: string | null;
  created_at: string;
}

export const GENDER_LABELS: Record<Gender, string> = {
  M: 'Mashkull',
  F: 'Femër',
  tjeter: 'Tjetër',
};

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  regjistruar: 'I/E regjistruar',
  transferuar: 'I/E transferuar',
  perfunduar: 'Përfunduar',
  larguar: 'Larguar',
};

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  grade_level: number;
  section: string;
  academic_year_id: string;
  homeroom_teacher_id: string | null;
  max_students: number;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  created_at: string;
}

export interface SubjectGrade {
  id: string;
  subject_id: string;
  grade_level: number;
  hours_per_week: number;
}

export interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string | null;
  created_at: string;
}

export interface StudentClass {
  id: string;
  student_id: string;
  class_id: string;
  enrolled_at: string;
}

export interface ParentStudent {
  id: string;
  parent_id: string;
  student_id: string;
  relationship: string;
  created_at: string;
}

export type AssessmentType = 'vlersim' | 'perfundimtare_gjysmvjetor' | 'perfundimtare_vjetor';

export interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  class_id: string;
  teacher_id: string;
  grade: number;
  assessment_type: AssessmentType;
  assessment_number: number | null;
  description: string;
  date: string;
  semester: number;
  created_at: string;
}

export type AttendanceStatusType = 'prezent' | 'mungon' | 'vonese' | 'arsyeshme';

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  subject_id: string | null;
  date: string;
  status: AttendanceStatusType;
  note: string;
  recorded_by: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  target_role: 'te_gjithe' | 'mesues' | 'nxenes' | 'prind';
  is_important: boolean;
  created_at: string;
}

export interface Schedule {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string;
  is_active: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: { full_name: string; role: UserRole };
  receiver?: { full_name: string; role: UserRole };
}

export const ROLE_LABELS: Record<UserRole, string> = {
  drejtor: 'Drejtor/e i Shkollës',
  mesues: 'Mesues/e',
  nxenes: 'Nxenes/e',
  prind: 'Prind',
  pedagog: 'Pedagog/e (Psikolog/Logoped)',
  drejtor_komunal: 'Drejtor/e Komunal/e i/e Arsimit',
  ministri: 'Ministër/e i/e Arsimit (MAShTI)',
  inspektor: 'Inspektor/e i/e Arsimit',
  super_admin: 'Administrator Sistemi',
};

// === Paketa 23: Inspektimi Shkollor (Ligji 06/L-046) ===

export type InspectionType = 'e_rregullt' | 'e_jashtezakonshme' | 'tematike' | 'ndjekje' | 'ankese';

export const INSPECTION_TYPE_LABELS: Record<InspectionType, string> = {
  e_rregullt: 'E rregullt',
  e_jashtezakonshme: 'E jashtëzakonshme',
  tematike: 'Tematike',
  ndjekje: 'Ndjekje (follow-up)',
  ankese: 'Ankesë',
};

export type InspectionStatus = 'planifikuar' | 'ne_proces' | 'perfunduar' | 'anuluar';

export const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  planifikuar: 'I planifikuar',
  ne_proces: 'Në proces',
  perfunduar: 'I përfunduar',
  anuluar: 'I anuluar',
};

export const INSPECTION_STATUS_COLORS: Record<InspectionStatus, string> = {
  planifikuar: 'bg-blue-100 text-blue-700',
  ne_proces: 'bg-amber-100 text-amber-700',
  perfunduar: 'bg-emerald-100 text-emerald-700',
  anuluar: 'bg-rose-100 text-rose-700',
};

export type OverallRating = 'shkelqyer' | 'i_mire' | 'i_kenaqshem' | 'duhet_permiresuar' | 'i_papranueshem';

export const OVERALL_RATING_LABELS: Record<OverallRating, string> = {
  shkelqyer: 'Shkëlqyer',
  i_mire: 'I mirë',
  i_kenaqshem: 'I kënaqshëm',
  duhet_permiresuar: 'Duhet përmirësim',
  i_papranueshem: 'I papranueshëm',
};

export const OVERALL_RATING_COLORS: Record<OverallRating, string> = {
  shkelqyer: 'bg-emerald-100 text-emerald-700',
  i_mire: 'bg-blue-100 text-blue-700',
  i_kenaqshem: 'bg-cyan-100 text-cyan-700',
  duhet_permiresuar: 'bg-amber-100 text-amber-700',
  i_papranueshem: 'bg-rose-100 text-rose-700',
};

export interface Inspection {
  id: string;
  school_id: string;
  inspector_id: string;
  inspection_type: InspectionType;
  planned_date: string;
  conducted_date: string | null;
  duration_hours: number | null;
  status: InspectionStatus;
  scope: string;
  overall_rating: OverallRating | null;
  summary: string;
  approved_by_director: boolean;
  approved_at: string | null;
  director_comments: string;
  created_at: string;
  updated_at: string;
}

export type FindingCategory = 'infrastrukture' | 'dokumentacion' | 'mesimdhenie' | 'siguri' | 'administrim' | 'sjellje' | 'tjeter';

export const FINDING_CATEGORY_LABELS: Record<FindingCategory, string> = {
  infrastrukture: 'Infrastrukturë',
  dokumentacion: 'Dokumentacion',
  mesimdhenie: 'Mësimdhënie',
  siguri: 'Siguri',
  administrim: 'Administrim',
  sjellje: 'Sjellje',
  tjeter: 'Tjetër',
};

export type FindingSeverity = 'e_lehte' | 'mesatare' | 'e_rende' | 'kritike';

export const FINDING_SEVERITY_LABELS: Record<FindingSeverity, string> = {
  e_lehte: 'E lehtë',
  mesatare: 'Mesatare',
  e_rende: 'E rëndë',
  kritike: 'Kritike',
};

export const FINDING_SEVERITY_COLORS: Record<FindingSeverity, string> = {
  e_lehte: 'bg-blue-100 text-blue-700',
  mesatare: 'bg-amber-100 text-amber-700',
  e_rende: 'bg-orange-100 text-orange-700',
  kritike: 'bg-rose-100 text-rose-700',
};

export interface InspectionFinding {
  id: string;
  inspection_id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  description: string;
  evidence: string;
  legal_basis: string;
  created_at: string;
}

export type RecommendationPriority = 'ulet' | 'mesatar' | 'larte' | 'urgjent';

export const REC_PRIORITY_LABELS: Record<RecommendationPriority, string> = {
  ulet: 'I ulët',
  mesatar: 'Mesatar',
  larte: 'I lartë',
  urgjent: 'Urgjent',
};

export const REC_PRIORITY_COLORS: Record<RecommendationPriority, string> = {
  ulet: 'bg-slate-100 text-slate-700',
  mesatar: 'bg-blue-100 text-blue-700',
  larte: 'bg-amber-100 text-amber-700',
  urgjent: 'bg-rose-100 text-rose-700',
};

export type RecommendationStatus = 'i_papermbushur' | 'ne_proces' | 'i_permbushur' | 'jo_aplikuar';

export const REC_STATUS_LABELS: Record<RecommendationStatus, string> = {
  i_papermbushur: 'I papërmbushur',
  ne_proces: 'Në proces',
  i_permbushur: 'I përmbushur',
  jo_aplikuar: 'Jo i aplikuar',
};

export interface InspectionRecommendation {
  id: string;
  inspection_id: string;
  finding_id: string | null;
  title: string;
  description: string;
  priority: RecommendationPriority;
  deadline: string | null;
  responsible: string;
  status: RecommendationStatus;
  completion_evidence: string;
  completed_at: string | null;
  verified_by: string | null;
  created_at: string;
}

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  vlersim: 'Vlerësim',
  perfundimtare_gjysmvjetor: 'Nota Përfundimtare e Periudhës',
  perfundimtare_vjetor: 'Nota Përfundimtare Vjetore',
};

export const PERIOD_LABELS: Record<number, string> = {
  1: 'Periudha e Parë',
  2: 'Periudha e Dytë',
  3: 'Periudha e Tretë',
};

export const ASSESSMENT_NUMBER_LABELS: Record<number, string> = {
  1: 'Vlerësimi 1',
  2: 'Vlerësimi 2',
  3: 'Vlerësimi 3',
  4: 'Vlerësimi 4',
};

export const GRADE_LABELS: Record<number, string> = {
  1: 'Pamjaftueshme',
  2: 'Mjaftueshme',
  3: 'Mire',
  4: 'Shume Mire',
  5: 'Shkelqyeshem',
};

export type DescriptiveLevel = 'shkelqyeshem' | 'shume_kenaqshem' | 'kenaqshem' | 'mjaftueshem' | 'pamjaftueshem';

export const DESCRIPTIVE_LEVEL_LABELS: Record<DescriptiveLevel, string> = {
  shkelqyeshem: 'Arritje e shkëlqyer',
  shume_kenaqshem: 'Arritje shumë e kënaqshme',
  kenaqshem: 'Arritje e kënaqshme',
  mjaftueshem: 'Arritje minimale',
  pamjaftueshem: 'Arritje e pamjaftueshme',
};

export const DESCRIPTIVE_LEVEL_COLORS: Record<DescriptiveLevel, string> = {
  shkelqyeshem: 'bg-emerald-100 text-emerald-700',
  shume_kenaqshem: 'bg-blue-100 text-blue-700',
  kenaqshem: 'bg-cyan-100 text-cyan-700',
  mjaftueshem: 'bg-amber-100 text-amber-700',
  pamjaftueshem: 'bg-rose-100 text-rose-700',
};

export interface DescriptiveAssessment {
  id: string;
  student_id: string;
  subject_id: string;
  class_id: string;
  teacher_id: string;
  period: number;
  level: DescriptiveLevel;
  comment: string;
  date: string;
  created_at: string;
}

export const ATTENDANCE_LABELS: Record<AttendanceStatusType, string> = {
  prezent: 'Prezent',
  mungon: 'Mungon',
  vonese: 'Vonese',
  arsyeshme: 'Arsyeshme',
};

export const DAY_LABELS: Record<number, string> = {
  1: 'E Hene',
  2: 'E Marte',
  3: 'E Merkure',
  4: 'E Enjte',
  5: 'E Premte',
};

export const getGradeColor = (grade: number): string => {
  if (grade >= 5) return 'text-emerald-600';
  if (grade >= 4) return 'text-blue-600';
  if (grade >= 3) return 'text-cyan-600';
  if (grade >= 2) return 'text-amber-600';
  return 'text-rose-600';
};

export const getGradeBgColor = (grade: number): string => {
  if (grade >= 5) return 'bg-emerald-100 text-emerald-700';
  if (grade >= 4) return 'bg-blue-100 text-blue-700';
  if (grade >= 3) return 'bg-cyan-100 text-cyan-700';
  if (grade >= 2) return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
};

export const getAvgColor = (avg: number): string => {
  if (avg >= 4.5) return 'text-emerald-600';
  if (avg >= 3.5) return 'text-blue-600';
  if (avg >= 2.5) return 'text-cyan-600';
  if (avg >= 1.5) return 'text-amber-600';
  return 'text-rose-600';
};

export const getAvgBgColor = (avg: number): string => {
  if (avg >= 4.5) return 'bg-emerald-100 text-emerald-700';
  if (avg >= 3.5) return 'bg-blue-100 text-blue-700';
  if (avg >= 2.5) return 'bg-cyan-100 text-cyan-700';
  if (avg >= 1.5) return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
};

// === Sjellja (UA 06/2022) ===
export type BehaviorLevel = 'shembullor' | 'shume_mire' | 'mire' | 'kenaqshem' | 'jo_kenaqshem';

export const BEHAVIOR_LEVEL_LABELS: Record<BehaviorLevel, string> = {
  shembullor: 'Shembullor',
  shume_mire: 'Shumë mirë',
  mire: 'Mirë',
  kenaqshem: 'I/E kënaqshëm',
  jo_kenaqshem: 'Jo i/e kënaqshëm',
};

export const BEHAVIOR_LEVEL_COLORS: Record<BehaviorLevel, string> = {
  shembullor: 'bg-emerald-100 text-emerald-700',
  shume_mire: 'bg-blue-100 text-blue-700',
  mire: 'bg-cyan-100 text-cyan-700',
  kenaqshem: 'bg-amber-100 text-amber-700',
  jo_kenaqshem: 'bg-rose-100 text-rose-700',
};

export interface BehaviorAssessment {
  id: string;
  student_id: string;
  class_id: string;
  teacher_id: string;
  period: number;
  level: BehaviorLevel;
  comment: string;
  date: string;
  created_at: string;
}

// === Masat disiplinore ===
export type DisciplinaryActionType =
  | 'verejtje_goje'
  | 'verejtje_shkrim'
  | 'largim_perkohshem'
  | 'transferim'
  | 'largim_perfundimtar';

export const DISCIPLINARY_ACTION_LABELS: Record<DisciplinaryActionType, string> = {
  verejtje_goje: 'Vërejtje me gojë',
  verejtje_shkrim: 'Vërejtje me shkrim',
  largim_perkohshem: 'Largim i përkohshëm',
  transferim: 'Transferim',
  largim_perfundimtar: 'Largim përfundimtar',
};

export type DisciplinaryStatus = 'aktive' | 'shfuqizuar' | 'permbushur';

export const DISCIPLINARY_STATUS_LABELS: Record<DisciplinaryStatus, string> = {
  aktive: 'Aktive',
  shfuqizuar: 'Shfuqizuar',
  permbushur: 'Përmbushur',
};

export interface DisciplinaryAction {
  id: string;
  student_id: string;
  class_id: string | null;
  action_type: DisciplinaryActionType;
  description: string;
  action_date: string;
  issued_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  status: DisciplinaryStatus;
  notes: string;
  created_at: string;
}

// === Privatësia & Siguria (Ligji 06/L-082) ===

export type ConsentType =
  | 'data_processing'
  | 'photo_use'
  | 'directory'
  | 'medical'
  | 'communication'
  | 'extracurricular';

export const CONSENT_TYPE_LABELS: Record<ConsentType, string> = {
  data_processing: 'Përpunimi i të dhënave personale',
  photo_use: 'Përdorimi i fotografive',
  directory: 'Përfshirja në direktori shkollore',
  medical: 'Ndarja e informacioneve mjekësore',
  communication: 'Komunikim me palë të treta',
  extracurricular: 'Aktivitete jashtëmësimore',
};

export const CONSENT_TYPE_DESCRIPTIONS: Record<ConsentType, string> = {
  data_processing: 'Lejoni shkollën të përpunojë të dhënat personale të fëmijës (emri, datëlindja, adresa) sipas Ligjit 06/L-082.',
  photo_use: 'Lejoni shkollën të bëjë dhe të publikojë fotografi të fëmijës në aktivitete shkollore.',
  directory: 'Lejoni emrin e fëmijës të shfaqet në lista publike (p.sh. fituesit e garave).',
  medical: 'Lejoni shkollën të ndajë informacione mjekësore me personelin përkatës në rast emergjence.',
  communication: 'Lejoni shkollën të komunikojë me palë të treta (p.sh. ekskursione, partnerë).',
  extracurricular: 'Lejoni pjesëmarrjen e fëmijës në aktivitete jashtëmësimore.',
};

export interface Consent {
  id: string;
  student_id: string;
  granted_by: string;
  consent_type: ConsentType;
  granted: boolean;
  granted_at: string;
  revoked_at: string | null;
  notes: string;
}

export type DeletionRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export const DELETION_REQUEST_STATUS_LABELS: Record<DeletionRequestStatus, string> = {
  pending: 'Në pritje',
  approved: 'E miratuar',
  rejected: 'E refuzuar',
  completed: 'E përfunduar',
};

export interface DataDeletionRequest {
  id: string;
  requested_by: string;
  student_id: string;
  reason: string;
  status: DeletionRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string;
  completed_at: string | null;
  created_at: string;
}

export type AuditActionType = 'view' | 'create' | 'update' | 'delete' | 'export' | 'login' | 'logout' | 'password_change';

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_role: UserRole | null;
  action: AuditActionType;
  resource_type: string;
  resource_id: string | null;
  target_user_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// === Paketa 3: NVA & PIA (Ligji 04/L-032 Neni 40) ===

export type SpecialNeedCategory =
  | 'gjuhesore'
  | 'fizike'
  | 'shqisore'
  | 'intelektuale'
  | 'sjellore'
  | 'emocionale'
  | 'specifike_te_nxenit'
  | 'autizem'
  | 'shumefishte'
  | 'tjeter';

export const SPECIAL_NEED_LABELS: Record<SpecialNeedCategory, string> = {
  gjuhesore: 'Vështirësi gjuhësore / të folurit',
  fizike: 'Aftësi të kufizuara fizike',
  shqisore: 'Vështirësi shqisore (shikim/dëgjim)',
  intelektuale: 'Aftësi të kufizuara intelektuale',
  sjellore: 'Vështirësi sjellore',
  emocionale: 'Vështirësi emocionale',
  specifike_te_nxenit: 'Vështirësi specifike të të nxënit (disleksi, etj.)',
  autizem: 'Spektri i autizmit',
  shumefishte: 'Aftësi të kufizuara të shumëfishta',
  tjeter: 'Tjetër',
};

export type SpecialNeedSeverity = 'lehte' | 'mesatare' | 'rende' | 'shume_rende';

export const SEVERITY_LABELS: Record<SpecialNeedSeverity, string> = {
  lehte: 'E lehtë',
  mesatare: 'Mesatare',
  rende: 'E rëndë',
  shume_rende: 'Shumë e rëndë',
};

export interface SpecialNeed {
  id: string;
  student_id: string;
  category: SpecialNeedCategory;
  severity: SpecialNeedSeverity | null;
  diagnosis: string;
  diagnosed_at: string | null;
  diagnosed_by: string;
  is_active: boolean;
  notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type IEPStatus = 'draft' | 'aktiv' | 'pezulluar' | 'perfunduar';

export const IEP_STATUS_LABELS: Record<IEPStatus, string> = {
  draft: 'Draft',
  aktiv: 'Aktiv',
  pezulluar: 'I pezulluar',
  perfunduar: 'I përfunduar',
};

export interface IndividualEducationPlan {
  id: string;
  student_id: string;
  academic_year_id: string | null;
  title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  status: IEPStatus;
  coordinator_id: string | null;
  parent_consent: boolean;
  parent_consent_at: string | null;
  parent_consent_by: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type IEPGoalArea =
  | 'akademik'
  | 'gjuhesor'
  | 'sjellor'
  | 'social'
  | 'emocional'
  | 'motorik'
  | 'pavaresi'
  | 'tjeter';

export const IEP_GOAL_AREA_LABELS: Record<IEPGoalArea, string> = {
  akademik: 'Akademik',
  gjuhesor: 'Gjuhësor',
  sjellor: 'Sjellor',
  social: 'Social',
  emocional: 'Emocional',
  motorik: 'Motorik',
  pavaresi: 'Pavarësi',
  tjeter: 'Tjetër',
};

export type IEPGoalStatus = 'ne_proces' | 'arritur' | 'pjeserisht_arritur' | 'nuk_eshte_arritur' | 'shtyer';

export const IEP_GOAL_STATUS_LABELS: Record<IEPGoalStatus, string> = {
  ne_proces: 'Në proces',
  arritur: 'I arritur',
  pjeserisht_arritur: 'Pjesërisht i arritur',
  nuk_eshte_arritur: 'Nuk është arritur',
  shtyer: 'I shtyrë',
};

export interface IEPGoal {
  id: string;
  iep_id: string;
  goal_area: IEPGoalArea;
  description: string;
  target_date: string | null;
  achievement_criteria: string;
  status: IEPGoalStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type IEPAccommodationType =
  | 'kohe_shtese_provim'
  | 'mjedis_qete'
  | 'mjete_ndihmese'
  | 'asistent_personal'
  | 'materiale_te_pershtatura'
  | 'vlerasim_alternativ'
  | 'pushim_shtese'
  | 'ulja_e_pershtatur'
  | 'teknollogji_ndihmese'
  | 'gjuha_shenjave'
  | 'libra_shkronja_te_medha'
  | 'tjeter';

export const IEP_ACCOMMODATION_LABELS: Record<IEPAccommodationType, string> = {
  kohe_shtese_provim: 'Kohë shtesë gjatë provimeve',
  mjedis_qete: 'Mjedis i qetë për provime',
  mjete_ndihmese: 'Mjete ndihmëse mësimore',
  asistent_personal: 'Asistent personal',
  materiale_te_pershtatura: 'Materiale të përshtatura',
  vlerasim_alternativ: 'Vlerësim alternativ',
  pushim_shtese: 'Pushime shtesë',
  ulja_e_pershtatur: 'Ulje e përshtatur në klasë',
  teknollogji_ndihmese: 'Teknologji ndihmëse',
  gjuha_shenjave: 'Gjuha e shenjave',
  libra_shkronja_te_medha: 'Libra me shkronja të mëdha',
  tjeter: 'Tjetër',
};

export interface IEPAccommodation {
  id: string;
  iep_id: string;
  accommodation_type: IEPAccommodationType;
  description: string;
  applies_to_subject_id: string | null;
  is_active: boolean;
  notes: string;
  created_at: string;
}

export type SupportStaffRole = 'asistent' | 'pedagog' | 'psikolog' | 'logoped' | 'mesues_mbeshtetes' | 'tjeter';

export const SUPPORT_STAFF_ROLE_LABELS: Record<SupportStaffRole, string> = {
  asistent: 'Asistent',
  pedagog: 'Pedagog',
  psikolog: 'Psikolog',
  logoped: 'Logoped',
  mesues_mbeshtetes: 'Mësues mbështetës',
  tjeter: 'Tjetër',
};

export interface SupportStaffAssignment {
  id: string;
  student_id: string;
  support_staff_id: string;
  role: SupportStaffRole;
  start_date: string;
  end_date: string | null;
  hours_per_week: number | null;
  notes: string;
  is_active: boolean;
  created_at: string;
}

// === Paketa 4: Organet Shkollore (Ligji 04/L-032 Nenet 18-23) ===

export type CouncilType = 'drejtues' | 'prinder' | 'nxenes' | 'profesional';

export const COUNCIL_TYPE_LABELS: Record<CouncilType, string> = {
  drejtues: 'Këshilli Drejtues i Shkollës',
  prinder: 'Këshilli i Prindërve',
  nxenes: 'Këshilli i Nxënësve',
  profesional: 'Këshilli Profesional i Mësimdhënësve',
};

export const COUNCIL_TYPE_DESCRIPTIONS: Record<CouncilType, string> = {
  drejtues: 'Organi më i lartë drejtues i shkollës (Neni 18) — 7 deri 9 anëtarë: prindër, mësues, përfaqësues të komunës dhe nxënës.',
  prinder: 'Përfaqëson prindërit e nxënësve të shkollës (Neni 19) — me përfaqësues nga çdo klasë.',
  nxenes: 'Përfaqëson nxënësit në vendimmarrjen e shkollës (Neni 23) — për nxënësit e klasave 6–9.',
  profesional: 'Përbëhet nga të gjithë mësimdhënësit dhe drejtuesit (Neni 20) — për çështje pedagogjike.',
};

export type CouncilMemberRole = 'kryetar' | 'zevendes_kryetar' | 'sekretar' | 'anetar';

export const COUNCIL_MEMBER_ROLE_LABELS: Record<CouncilMemberRole, string> = {
  kryetar: 'Kryetar/e',
  zevendes_kryetar: 'Zëvendëskryetar/e',
  sekretar: 'Sekretar/e',
  anetar: 'Anëtar/e',
};

export interface SchoolCouncil {
  id: string;
  type: CouncilType;
  name: string;
  description: string;
  academic_year_id: string | null;
  is_active: boolean;
  established_at: string | null;
  term_ends: string | null;
  created_at: string;
}

export interface CouncilMember {
  id: string;
  council_id: string;
  user_id: string;
  role: CouncilMemberRole;
  represents: string;
  joined_at: string;
  left_at: string | null;
  is_active: boolean;
  notes: string;
  created_at: string;
}

export type MeetingStatus = 'planifikuar' | 'mbajtur' | 'anuluar' | 'shtyer';

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  planifikuar: 'I planifikuar',
  mbajtur: 'I mbajtur',
  anuluar: 'I anuluar',
  shtyer: 'I shtyrë',
};

export interface CouncilMeeting {
  id: string;
  council_id: string;
  title: string;
  meeting_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string;
  agenda: string;
  status: MeetingStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type MeetingAttendanceStatus = 'pa_specifikuar' | 'prezent' | 'mungon' | 'arsyeshme';

export const MEETING_ATTENDANCE_LABELS: Record<MeetingAttendanceStatus, string> = {
  pa_specifikuar: 'Pa specifikuar',
  prezent: 'Prezent',
  mungon: 'Mungon',
  arsyeshme: 'I/E arsyeshëm/e',
};

export interface MeetingAttendance {
  id: string;
  meeting_id: string;
  member_id: string;
  status: MeetingAttendanceStatus;
  notes: string;
}

export interface MeetingMinutes {
  id: string;
  meeting_id: string;
  content: string;
  decisions: string;
  recorded_by: string;
  approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

// === Paketa 5: Dëftesa Zyrtare (UA 19/2018) ===

export interface SchoolInfo {
  id: string;
  name: string;
  full_name: string;
  address: string;
  municipality: string;
  phone: string;
  email: string;
  website: string;
  director_name: string;
  logo_url: string | null;
  stamp_url: string | null;
  registration_number: string;
  municipality_id?: string | null;
  locality_id?: string | null;
  school_type?: SchoolType;
  created_at: string;
  updated_at: string;
}

export type ReportCardType = 'periudhshme' | 'vjetore' | 'certifikate_klases_5' | 'diplome_klases_9';

export const REPORT_CARD_TYPE_LABELS: Record<ReportCardType, string> = {
  periudhshme: 'Dëftesë e Periudhës',
  vjetore: 'Dëftesë Vjetore',
  certifikate_klases_5: 'Certifikatë e Klasës së V-të',
  diplome_klases_9: 'Diplomë e Klasës së IX-të',
};

export interface ReportCardIssued {
  id: string;
  student_id: string;
  class_id: string | null;
  academic_year_id: string | null;
  period: number | null;
  card_type: ReportCardType;
  issued_by: string;
  issued_at: string;
  serial_number: string | null;
  notes: string;
}
