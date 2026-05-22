import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  IEP_ACCOMMODATION_LABELS,
  SPECIAL_NEED_LABELS,
  type IEPAccommodation,
  type SpecialNeed,
  type IndividualEducationPlan,
} from '../../types/database';
import { Loader2, Sparkles, Heart, Info } from 'lucide-react';
import { useI18n } from '../../lib/i18n/I18nProvider';

interface StudentInfo {
  id: string;
  full_name: string;
  needs: SpecialNeed[];
  accommodations: IEPAccommodation[];
}

export default function StudentAccommodations() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) loadData();
  }, [profile?.id]);

  const loadData = async () => {
    if (!profile) return;

    const classIds = new Set<string>();
    const { data: homeroom } = await supabase.from('classes').select('id').eq('homeroom_teacher_id', profile.id);
    homeroom?.forEach((c) => classIds.add(c.id));
    const { data: assigned } = await supabase.from('class_subjects').select('class_id').eq('teacher_id', profile.id);
    assigned?.forEach((c) => classIds.add(c.class_id));

    if (classIds.size === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }

    const { data: enrolls } = await supabase
      .from('student_classes')
      .select('student_id')
      .in('class_id', Array.from(classIds));
    const studentIds = Array.from(new Set((enrolls || []).map((e) => e.student_id)));
    if (studentIds.length === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }

    const [profilesRes, needsRes, iepsRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name').in('id', studentIds),
      supabase.from('special_needs').select('*').in('student_id', studentIds).eq('is_active', true),
      supabase.from('individual_education_plans').select('*').in('student_id', studentIds),
    ]);

    const iepIdToStudent = new Map<string, string>();
    (iepsRes.data || []).forEach((i: IndividualEducationPlan) => iepIdToStudent.set(i.id, i.student_id));
    const iepIds = Array.from(iepIdToStudent.keys());

    let accommodations: IEPAccommodation[] = [];
    if (iepIds.length > 0) {
      const { data: accRes } = await supabase
        .from('iep_accommodations')
        .select('*')
        .in('iep_id', iepIds)
        .eq('is_active', true);
      accommodations = accRes || [];
    }

    const needsByStudent = new Map<string, SpecialNeed[]>();
    (needsRes.data || []).forEach((n: SpecialNeed) => {
      const list = needsByStudent.get(n.student_id) || [];
      list.push(n);
      needsByStudent.set(n.student_id, list);
    });

    const accByStudent = new Map<string, IEPAccommodation[]>();
    accommodations.forEach((a) => {
      const sid = iepIdToStudent.get(a.iep_id);
      if (!sid) return;
      const list = accByStudent.get(sid) || [];
      list.push(a);
      accByStudent.set(sid, list);
    });

    const filteredStudents = (profilesRes.data || [])
      .filter((s) => needsByStudent.has(s.id) || accByStudent.has(s.id))
      .map((s) => ({
        id: s.id,
        full_name: s.full_name,
        needs: needsByStudent.get(s.id) || [],
        accommodations: accByStudent.get(s.id) || [],
      }))
      .sort((a, b) => a.full_name.localeCompare(b.full_name));

    setStudents(filteredStudents);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-pink-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('sa.title')}</h1>
          <p className="text-slate-500 text-sm">{t('sa.subtitle')}</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-900">
          <p className="font-medium">{t('sa.confidential_title')}</p>
          <p className="text-blue-700 mt-1">{t('sa.confidential_help')}</p>
        </div>
      </div>

      <div className="space-y-3">
        {students.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 px-6 py-12 text-center text-slate-400 text-sm">
            {t('sa.no_sen_students')}
          </div>
        ) : (
          students.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-4">
                <h3 className="font-semibold text-slate-900">{s.full_name}</h3>

                {s.needs.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1.5 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      {t('sa.needs_label')}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {s.needs.map((n) => (
                        <span key={n.id} className="px-2 py-1 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
                          {SPECIAL_NEED_LABELS[n.category]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {s.accommodations.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      {t('sa.accommodations_label')}
                    </h4>
                    <ul className="space-y-1.5">
                      {s.accommodations.map((a) => (
                        <li key={a.id} className="bg-purple-50 rounded-lg px-3 py-2 text-sm">
                          <span className="font-medium text-purple-900">{IEP_ACCOMMODATION_LABELS[a.accommodation_type]}:</span>
                          <span className="text-slate-700 ml-1">{a.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
