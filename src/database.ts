export type UserRole = 'drejtor' | 'mesues' | 'nxenes' | 'prind';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string;
  avatar_url: string;
  created_at: string;
}

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

/** Maps which subjects belong to which grade levels (Kosovo KKK curriculum) */
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

// ─── Labels ────────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  drejtor: 'Drejtor/e',
  mesues: 'Mesues/e',
  nxenes: 'Nxenes/e',
  prind: 'Prind',
};

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  vlersim: 'Vlerësim',
  perfundimtare_gjysmvjetor: 'Nota Përfundimtare Gjysmëvjetori',
  perfundimtare_vjetor: 'Nota Përfundimtare Vjetore',
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

// ─── Color helpers ──────────────────────────────────────────────────────────

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
