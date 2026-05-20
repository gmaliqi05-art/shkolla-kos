import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { logAudit } from '../../lib/audit';
import {
  GRADE_LABELS,
  PERIOD_LABELS,
  GENDER_LABELS,
  BEHAVIOR_LEVEL_LABELS,
  DESCRIPTIVE_LEVEL_LABELS,
  REPORT_CARD_TYPE_LABELS,
  type ReportCardType,
  type Profile,
  type SchoolInfo,
  type BehaviorLevel,
  type DescriptiveLevel,
} from '../../types/database';
import { Loader2, Printer, ArrowLeft, FileCheck } from 'lucide-react';

interface GradeRow {
  subject_id: string;
  subject_name: string;
  v1: number | null;
  v2: number | null;
  v3: number | null;
  v4: number | null;
  perfundimtare: number | null;
  descriptive: DescriptiveLevel | null;
}

interface AttendanceSummary {
  prezent: number;
  mungon: number;
  vonese: number;
  arsyeshme: number;
}

export default function ReportCardView() {
  const { studentId, classId, period: periodStr, type: typeStr } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const period = periodStr ? Number(periodStr) : null;
  const cardType = (typeStr as ReportCardType) || 'periudhshme';

  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [student, setStudent] = useState<Profile | null>(null);
  const [className, setClassName] = useState('');
  const [gradeLevel, setGradeLevel] = useState(0);
  const [academicYearName, setAcademicYearName] = useState('');
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [behavior, setBehavior] = useState<BehaviorLevel | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary>({ prezent: 0, mungon: 0, vonese: 0, arsyeshme: 0 });
  const [issuing, setIssuing] = useState(false);
  const [issued, setIssued] = useState(false);

  useEffect(() => {
    if (studentId && classId) loadAll();
  }, [studentId, classId, period, cardType]);

  const loadAll = async () => {
    setLoading(true);

    const [schoolRes, studentRes, classRes] = await Promise.all([
      supabase.from('school_info').select('*').limit(1).maybeSingle(),
      supabase.from('profiles').select('*').eq('id', studentId).maybeSingle(),
      supabase.from('classes').select('id, name, grade_level, academic_year_id, academic_years(name)').eq('id', classId).maybeSingle(),
    ]);

    setSchool(schoolRes.data);
    setStudent(studentRes.data);
    if (classRes.data) {
      setClassName(classRes.data.name);
      setGradeLevel(classRes.data.grade_level);
      const ay = classRes.data.academic_years as { name?: string } | null;
      setAcademicYearName(ay?.name || '');
    }

    const lvl = classRes.data?.grade_level || 0;

    const { data: classSubjects } = await supabase
      .from('class_subjects')
      .select('subject_id, subjects(id, name)')
      .eq('class_id', classId);

    type ClassSubjectRow = { subject_id: string; subjects: { id: string; name: string } | null };
    const subjects = (classSubjects || [])
      .map((cs) => {
        const row = cs as unknown as ClassSubjectRow;
        return { id: row.subject_id, name: row.subjects?.name || '' };
      })
      .filter((s) => !!s.name)
      .sort((a, b) => a.name.localeCompare(b.name));

    if (lvl >= 1 && lvl <= 2) {
      // descriptive
      const { data: desc } = await supabase
        .from('descriptive_assessments')
        .select('*')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .eq('period', period || 1);
      const descMap = new Map<string, DescriptiveLevel>();
      (desc || []).forEach((d: { subject_id: string; level: DescriptiveLevel }) => descMap.set(d.subject_id, d.level));
      setGrades(subjects.map((s) => ({
        subject_id: s.id,
        subject_name: s.name,
        v1: null, v2: null, v3: null, v4: null, perfundimtare: null,
        descriptive: descMap.get(s.id) || null,
      })));
    } else {
      let query = supabase
        .from('grades')
        .select('*')
        .eq('student_id', studentId)
        .eq('class_id', classId);
      if (cardType === 'vjetore') {
        // annual: get perfundimtare_vjetor
        query = query.eq('assessment_type', 'perfundimtare_vjetor');
      } else if (period) {
        query = query.eq('semester', period);
      }
      const { data: gradesData } = await query;
      const byId = new Map<string, GradeRow>();
      subjects.forEach((s) => {
        byId.set(s.id, { subject_id: s.id, subject_name: s.name, v1: null, v2: null, v3: null, v4: null, perfundimtare: null, descriptive: null });
      });
      type GradeRecord = { subject_id: string; assessment_type: string; assessment_number: number | null; grade: number };
      (gradesData || []).forEach((g) => {
        const row = byId.get((g as GradeRecord).subject_id);
        if (!row) return;
        const gr = g as GradeRecord;
        if (gr.assessment_type === 'vlersim' && gr.assessment_number) {
          if (gr.assessment_number === 1) row.v1 = gr.grade;
          if (gr.assessment_number === 2) row.v2 = gr.grade;
          if (gr.assessment_number === 3) row.v3 = gr.grade;
          if (gr.assessment_number === 4) row.v4 = gr.grade;
        } else {
          row.perfundimtare = gr.grade;
        }
      });
      setGrades(Array.from(byId.values()));
    }

    if (period) {
      const { data: behaviorData } = await supabase
        .from('behavior_assessments')
        .select('level')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .eq('period', period)
        .maybeSingle();
      setBehavior((behaviorData?.level as BehaviorLevel) || null);
    }

    const { data: attData } = await supabase
      .from('attendance')
      .select('status')
      .eq('student_id', studentId)
      .eq('class_id', classId);
    const summary: AttendanceSummary = { prezent: 0, mungon: 0, vonese: 0, arsyeshme: 0 };
    (attData || []).forEach((a) => {
      const s = (a as { status: keyof AttendanceSummary }).status;
      if (s in summary) summary[s]++;
    });
    setAttendance(summary);

    const { data: existing } = await supabase
      .from('report_cards_issued')
      .select('id')
      .eq('student_id', studentId)
      .eq('period', period)
      .eq('card_type', cardType)
      .maybeSingle();
    setIssued(!!existing);

    setLoading(false);
  };

  const issueCard = async () => {
    if (!profile || !studentId || !classId) return;
    setIssuing(true);
    const serial = `${academicYearName.replace(/[^0-9]/g, '')}-${className.replace(/\s+/g, '')}-${(student?.personal_number || studentId).slice(-4)}-${cardType[0].toUpperCase()}${period || 'V'}`;
    const { data: classData } = await supabase.from('classes').select('academic_year_id').eq('id', classId).maybeSingle();
    const { error } = await supabase.from('report_cards_issued').insert({
      student_id: studentId,
      class_id: classId,
      academic_year_id: classData?.academic_year_id || null,
      period,
      card_type: cardType,
      issued_by: profile.id,
      serial_number: serial,
    });
    if (!error) {
      await logAudit({
        actorId: profile.id,
        actorRole: profile.role,
        action: 'create',
        resourceType: 'report_card',
        targetUserId: studentId,
        metadata: { period, card_type: cardType, serial },
      });
      setIssued(true);
    } else if (error.code !== '23505') {
      alert('Gabim: ' + error.message);
    } else {
      setIssued(true);
    }
    setIssuing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!student) {
    return <div className="text-center py-12 text-rose-500">Nxënësi nuk u gjet.</div>;
  }

  const isDescriptive = gradeLevel >= 1 && gradeLevel <= 2;
  const cardTitle = REPORT_CARD_TYPE_LABELS[cardType];
  const periodLabel = period ? PERIOD_LABELS[period] : '';

  // Calculate average for numeric grades
  const validGrades = grades.map((g) => g.perfundimtare).filter((g): g is number => g !== null && g > 0);
  const average = validGrades.length > 0 ? validGrades.reduce((sum, n) => sum + n, 0) / validGrades.length : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate('/drejtor/deftesat')}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Kthehu
        </button>
        <div className="flex gap-2">
          {!issued && (
            <button
              onClick={issueCard}
              disabled={issuing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium disabled:opacity-50"
            >
              {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
              Lësho Zyrtarisht
            </button>
          )}
          {issued && (
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-medium">
              <FileCheck className="w-4 h-4" />
              E lëshuar
            </span>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
          >
            <Printer className="w-4 h-4" />
            Printo / PDF
          </button>
        </div>
      </div>

      {/* The printable card */}
      <div id="report-card" className="bg-white rounded-2xl border border-slate-200 p-8 print:border-0 print:rounded-none print:p-0 print:shadow-none">
        <style>{`
          @media print {
            @page { size: A4; margin: 1.5cm; }
            body { background: white; }
            #report-card { box-shadow: none !important; border: 0 !important; padding: 0 !important; }
            .print\\:hidden { display: none !important; }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-start gap-3">
            {school?.logo_url && (
              <img src={school.logo_url} alt="Logo" className="w-16 h-16 object-contain" />
            )}
            <div>
              <p className="text-xs text-slate-600">REPUBLIKA E KOSOVËS</p>
              <p className="text-xs text-slate-600">Ministria e Arsimit, Shkencës, Teknologjisë dhe Inovacionit</p>
              <p className="text-xs text-slate-600">Komuna {school?.municipality || '________'}</p>
              <h1 className="text-lg font-bold text-slate-900 mt-1">{school?.full_name || school?.name || 'Shkolla'}</h1>
              {school?.address && <p className="text-xs text-slate-600">{school.address}</p>}
              {school?.registration_number && <p className="text-[10px] text-slate-500">Nr. regjistrimit: {school.registration_number}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Viti shkollor</p>
            <p className="text-sm font-semibold text-slate-900">{academicYearName}</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">{cardTitle}</h2>
          {periodLabel && <p className="text-sm text-slate-600 mt-1">{periodLabel}</p>}
        </div>

        {/* Student info */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-6 border border-slate-300 rounded-lg p-4">
          <div>
            <span className="text-slate-500">Emri dhe mbiemri: </span>
            <span className="font-semibold text-slate-900">{student.full_name}</span>
          </div>
          <div>
            <span className="text-slate-500">Numri personal: </span>
            <span className="font-mono text-slate-900">{student.personal_number || '__________'}</span>
          </div>
          <div>
            <span className="text-slate-500">Datëlindja: </span>
            <span className="text-slate-900">{student.date_of_birth || '__________'}</span>
          </div>
          <div>
            <span className="text-slate-500">Vendlindja: </span>
            <span className="text-slate-900">{student.place_of_birth || '__________'}</span>
          </div>
          <div>
            <span className="text-slate-500">Gjinia: </span>
            <span className="text-slate-900">{student.gender ? GENDER_LABELS[student.gender] : '__________'}</span>
          </div>
          <div>
            <span className="text-slate-500">Klasa: </span>
            <span className="font-semibold text-slate-900">{className}</span>
          </div>
          <div className="col-span-2">
            <span className="text-slate-500">Kujdestari ligjor: </span>
            <span className="text-slate-900">{student.legal_guardian_name || '__________'}</span>
          </div>
        </div>

        {/* Grades */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase mb-2">
            {isDescriptive ? 'Vlerësimi përshkrues' : 'Notat'}
          </h3>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 border border-slate-300">
                <th className="border border-slate-300 px-3 py-2 text-left">Lënda</th>
                {isDescriptive ? (
                  <th className="border border-slate-300 px-3 py-2 text-left">Niveli i Arritjes</th>
                ) : (
                  <>
                    <th className="border border-slate-300 px-2 py-2 w-10">V1</th>
                    <th className="border border-slate-300 px-2 py-2 w-10">V2</th>
                    <th className="border border-slate-300 px-2 py-2 w-10">V3</th>
                    <th className="border border-slate-300 px-2 py-2 w-10">V4</th>
                    <th className="border border-slate-300 px-2 py-2 w-20 font-bold">Përfund.</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => (
                <tr key={g.subject_id}>
                  <td className="border border-slate-300 px-3 py-1.5">{g.subject_name}</td>
                  {isDescriptive ? (
                    <td className="border border-slate-300 px-3 py-1.5">
                      {g.descriptive ? DESCRIPTIVE_LEVEL_LABELS[g.descriptive] : '—'}
                    </td>
                  ) : (
                    <>
                      <td className="border border-slate-300 px-2 py-1.5 text-center">{g.v1 || '—'}</td>
                      <td className="border border-slate-300 px-2 py-1.5 text-center">{g.v2 || '—'}</td>
                      <td className="border border-slate-300 px-2 py-1.5 text-center">{g.v3 || '—'}</td>
                      <td className="border border-slate-300 px-2 py-1.5 text-center">{g.v4 || '—'}</td>
                      <td className="border border-slate-300 px-2 py-1.5 text-center font-bold">
                        {g.perfundimtare ? `${g.perfundimtare} (${GRADE_LABELS[g.perfundimtare]})` : '—'}
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {!isDescriptive && average !== null && (
                <tr className="bg-slate-50 font-semibold">
                  <td className="border border-slate-300 px-3 py-2" colSpan={5}>Mesatarja</td>
                  <td className="border border-slate-300 px-2 py-2 text-center">{average.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Behavior */}
        {behavior && (
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="border border-slate-300 rounded-lg p-3 text-sm">
              <p className="text-slate-500 mb-1">Sjellja:</p>
              <p className="font-semibold text-slate-900">{BEHAVIOR_LEVEL_LABELS[behavior]}</p>
            </div>
          </div>
        )}

        {/* Attendance */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase mb-2">Frekuentimi</h3>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-3 py-2 text-left">Statusi</th>
                <th className="border border-slate-300 px-3 py-2 w-24 text-center">Numri</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-slate-300 px-3 py-1.5">Prezent</td><td className="border border-slate-300 px-3 py-1.5 text-center">{attendance.prezent}</td></tr>
              <tr><td className="border border-slate-300 px-3 py-1.5">Mungesa të arsyetuara</td><td className="border border-slate-300 px-3 py-1.5 text-center">{attendance.arsyeshme}</td></tr>
              <tr><td className="border border-slate-300 px-3 py-1.5">Mungesa të paarsyetuara</td><td className="border border-slate-300 px-3 py-1.5 text-center">{attendance.mungon}</td></tr>
              <tr><td className="border border-slate-300 px-3 py-1.5">Vonesa</td><td className="border border-slate-300 px-3 py-1.5 text-center">{attendance.vonese}</td></tr>
            </tbody>
          </table>
          </div>
        </div>

        {/* Signature */}
        <div className="grid grid-cols-2 gap-6 mt-12 text-sm">
          <div className="text-center">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-semibold text-slate-900">Mësuesi/ja kujdestar/e</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-semibold text-slate-900">Drejtori/ja i/e Shkollës</p>
              <p className="text-slate-600">{school?.director_name || '________________'}</p>
            </div>
            {school?.stamp_url && (
              <img src={school.stamp_url} alt="Vula" className="w-20 h-20 mx-auto mt-2 opacity-80" />
            )}
          </div>
        </div>

        <div className="mt-8 text-xs text-slate-500 text-center">
          Lëshuar më: {new Date().toLocaleDateString('sq')} · Vendi: {school?.municipality || '_____'}
        </div>
      </div>
    </div>
  );
}
