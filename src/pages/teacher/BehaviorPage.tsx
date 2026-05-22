import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Save, ClipboardCheck } from 'lucide-react';
import {
  BEHAVIOR_LEVEL_LABELS,
  BEHAVIOR_LEVEL_COLORS,
  type BehaviorLevel,
} from '../../types/database';
import { useI18n } from '../../lib/i18n/I18nProvider';
import type { TranslationKey } from '../../lib/i18n/translations';

const PERIOD_KEYS: Record<number, TranslationKey> = {
  1: 'period.1',
  2: 'period.2',
  3: 'period.3',
};

interface ClassOption {
  id: string;
  name: string;
}

interface StudentRow {
  id: string;
  full_name: string;
  current_level: BehaviorLevel | '';
  current_comment: string;
  saved_id: string | null;
}

const BEHAVIOR_OPTIONS: BehaviorLevel[] = ['shembullor', 'shume_mire', 'mire', 'kenaqshem', 'jo_kenaqshem'];

export default function BehaviorPage() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [period, setPeriod] = useState(1);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadClasses();
  }, [profile?.id]);

  useEffect(() => {
    if (selectedClass) loadStudents();
  }, [selectedClass, period]);

  const loadClasses = async () => {
    if (!profile) return;
    const teacherClasses = new Set<string>();

    const { data: homeroom } = await supabase
      .from('classes')
      .select('id, name')
      .eq('homeroom_teacher_id', profile.id);
    homeroom?.forEach((c) => teacherClasses.add(c.id));

    const { data: assigned } = await supabase
      .from('class_subjects')
      .select('class_id, classes(id, name)')
      .eq('teacher_id', profile.id);
    assigned?.forEach((c: { class_id: string }) => teacherClasses.add(c.class_id));

    const ids = Array.from(teacherClasses);
    if (ids.length === 0) {
      setClasses([]);
      return;
    }
    const { data } = await supabase
      .from('classes')
      .select('id, name')
      .in('id', ids)
      .order('grade_level')
      .order('section');
    setClasses(data || []);
    if (data && data.length > 0 && !selectedClass) setSelectedClass(data[0].id);
  };

  const loadStudents = async () => {
    setLoading(true);
    const { data: enrolls } = await supabase
      .from('student_classes')
      .select('student_id')
      .eq('class_id', selectedClass);

    const studentIds = (enrolls || []).map((e) => e.student_id);
    if (studentIds.length === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', studentIds);
    const studentList: { id: string; full_name: string }[] = profilesData || [];

    const { data: existing } = await supabase
      .from('behavior_assessments')
      .select('id, student_id, level, comment')
      .eq('class_id', selectedClass)
      .eq('period', period);

    const existingMap = new Map<string, { id: string; level: BehaviorLevel; comment: string }>();
    existing?.forEach((b: { id: string; student_id: string; level: BehaviorLevel; comment: string }) => {
      existingMap.set(b.student_id, { id: b.id, level: b.level, comment: b.comment || '' });
    });

    const rows: StudentRow[] = studentList
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
      .map((s) => {
        const e = existingMap.get(s.id);
        return {
          id: s.id,
          full_name: s.full_name,
          current_level: e?.level || '',
          current_comment: e?.comment || '',
          saved_id: e?.id || null,
        };
      });

    setStudents(rows);
    setLoading(false);
  };

  const updateStudent = (id: string, patch: Partial<StudentRow>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setMessage('');

    const toUpsert = students
      .filter((s) => s.current_level)
      .map((s) => ({
        ...(s.saved_id ? { id: s.saved_id } : {}),
        student_id: s.id,
        class_id: selectedClass,
        teacher_id: profile.id,
        period,
        level: s.current_level as BehaviorLevel,
        comment: s.current_comment,
      }));

    if (toUpsert.length === 0) {
      setMessage(t('beh.no_assessments'));
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('behavior_assessments')
      .upsert(toUpsert, { onConflict: 'student_id,class_id,period' });

    if (error) {
      setMessage(`${t('common.error')}: ${error.message}`);
    } else {
      setMessage(`${toUpsert.length} ${t('beh.title').toLowerCase()}`);
      loadStudents();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <ClipboardCheck className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('beh.title')}</h1>
          <p className="text-slate-500 text-sm">{t('beh.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">{t('teacher.tbl_class')}</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
          >
            {classes.length === 0 && <option value="">— {t('tch.no_classes_assigned')} —</option>}
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">{t('ge.period_label')}</label>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
          >
            {[1, 2, 3].map((p) => (
              <option key={p} value={p}>{t(PERIOD_KEYS[p])}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-end">
          <button
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('common.save')}
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-2">
          {message}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">
            {selectedClass ? t('att.no_students_for_class') : t('tch.select_class')}
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase">
                <th className="px-6 py-3">{t('teacher.tbl_student')}</th>
                <th className="px-6 py-3">{t('beh.behavior_label').replace(' *', '')}</th>
                <th className="px-6 py-3">{t('beh.observations')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="px-6 py-3 font-medium text-slate-900 align-top">{s.full_name}</td>
                  <td className="px-6 py-3 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      {BEHAVIOR_OPTIONS.map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => updateStudent(s.id, { current_level: lvl })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                            s.current_level === lvl
                              ? `${BEHAVIOR_LEVEL_COLORS[lvl]} border-transparent ring-2 ring-offset-1 ring-purple-400`
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {BEHAVIOR_LEVEL_LABELS[lvl]}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-3 align-top">
                    <input
                      type="text"
                      value={s.current_comment}
                      onChange={(e) => updateStudent(s.id, { current_comment: e.target.value })}
                      placeholder={`${t('beh.observations')} (${t('common.optional').toLowerCase()})`}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
