export type UserRole = 'drejtor' | 'mesues' | 'nxenes' | 'prind' | 'pedagog';

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
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  medical_conditions: string;
  family_doctor: string;
  enrollment_status: EnrollmentStatus;
  must_change_password?: boolean;
  deleted_at?: string | null;
  last_login_at?: string | null;
  consent_recorded_at?: string | null;
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
  drejtor: 'Drejtor/e',
  mesues: 'Mesues/e',
  nxenes: 'Nxenes/e',
  prind: 'Prind',
  pedagog: 'Pedagog/e (Psikolog/Logoped)',
};

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
