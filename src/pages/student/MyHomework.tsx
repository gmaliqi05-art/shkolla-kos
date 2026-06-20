import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, FileText, Clock, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { useI18n } from '../../lib/i18n/I18nProvider';
import { useToast } from '../../components/ToastProvider';
import type { HomeworkSubmissionStatus } from '../../types/database';

interface HomeworkRow {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  assigned_date: string;
  due_date: string | null;
  subject_name: string;
  status: HomeworkSubmissionStatus;
  submission_text: string;
  submitted_at: string | null;
  grade: number | null;
  teacher_feedback: string;
}

const DEMO_HOMEWORK: HomeworkRow[] = [
  { id: 'd1', subject_id: 's1', title: 'Ushtrimet 12–18, faqe 45', description: 'Zgjidhni ushtrimet me thyesa dhe sillni fletoren.', assigned_date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10), due_date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10), subject_name: 'Matematikë', status: 'e_pa_dorezuar', submission_text: '', submitted_at: null, grade: null, teacher_feedback: '' },
  { id: 'd2', subject_id: 's2', title: 'Ese: Vjeshta', description: 'Shkruani një ese 150 fjalë për vjeshtën.', assigned_date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10), due_date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10), subject_name: 'Gjuhë shqipe', status: 'vleresuar', submission_text: 'Vjeshta është stina ...', submitted_at: new Date(Date.now() - 2 * 86400000).toISOString(), grade: 5, teacher_feedback: 'Punë shumë e mirë!' },
];

export default function MyHomework() {
  const { profile, isDemo } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<HomeworkRow[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.id || isDemo) load();
  }, [profile?.id, isDemo]);

  const load = async () => {
    setLoading(true);
    if (isDemo) {
      setRows(DEMO_HOMEWORK);
      setLoading(false);
      return;
    }
    if (!profile) return;

    const { data: enrollments } = await supabase
      .from('student_classes')
      .select('class_id')
      .eq('student_id', profile.id);
    const classIds = (enrollments || []).map((e: { class_id: string }) => e.class_id);
    if (classIds.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const { data: hws } = await supabase
      .from('homework')
      .select('id, subject_id, title, description, assigned_date, due_date, subjects(name)')
      .in('class_id', classIds)
      .order('due_date', { ascending: true });

    const list = hws || [];
    const hwIds = list.map((h) => h.id);
    const subMap = new Map<string, { status: HomeworkSubmissionStatus; submission_text: string; submitted_at: string | null; grade: number | null; teacher_feedback: string }>();
    if (hwIds.length > 0) {
      const { data: subs } = await supabase
        .from('homework_submissions')
        .select('homework_id, status, submission_text, submitted_at, grade, teacher_feedback')
        .eq('student_id', profile.id)
        .in('homework_id', hwIds);
      (subs || []).forEach((s) => subMap.set(s.homework_id, {
        status: s.status as HomeworkSubmissionStatus,
        submission_text: s.submission_text || '',
        submitted_at: s.submitted_at,
        grade: s.grade,
        teacher_feedback: s.teacher_feedback || '',
      }));
    }

    type Row = { id: string; subject_id: string; title: string; description: string; assigned_date: string; due_date: string | null; subjects: { name: string } | { name: string }[] | null };
    setRows(list.map((h) => {
      const r = h as unknown as Row;
      const subj = Array.isArray(r.subjects) ? r.subjects[0] : r.subjects;
      const sub = subMap.get(r.id);
      return {
        id: r.id,
        subject_id: r.subject_id,
        title: r.title,
        description: r.description,
        assigned_date: r.assigned_date,
        due_date: r.due_date,
        subject_name: subj?.name || '',
        status: sub?.status || 'e_pa_dorezuar',
        submission_text: sub?.submission_text || '',
        submitted_at: sub?.submitted_at || null,
        grade: sub?.grade ?? null,
        teacher_feedback: sub?.teacher_feedback || '',
      };
    }));
    setLoading(false);
  };

  const openSubmit = (row: HomeworkRow) => {
    setOpenId(row.id);
    setText(row.submission_text || '');
  };

  const submit = async (row: HomeworkRow) => {
    if (!text.trim()) {
      toast.error(t('hw.submit_empty'));
      return;
    }
    setSaving(true);
    if (isDemo) {
      setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, status: 'dorezuar', submission_text: text, submitted_at: new Date().toISOString() } : r));
      setOpenId(null);
      setSaving(false);
      toast.success(t('hw.submit_done'));
      return;
    }
    if (!profile) return;
    const { error } = await supabase
      .from('homework_submissions')
      .upsert({
        homework_id: row.id,
        student_id: profile.id,
        status: 'dorezuar',
        submission_text: text,
        submitted_at: new Date().toISOString(),
      }, { onConflict: 'homework_id,student_id' });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t('hw.submit_done'));
    setOpenId(null);
    load();
  };

  const isLate = (row: HomeworkRow) => {
    if (!row.due_date) return false;
    const due = new Date(row.due_date + 'T23:59:59');
    if (row.submitted_at) return new Date(row.submitted_at) > due;
    return row.status === 'e_pa_dorezuar' && new Date() > due;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
          <FileText className="w-5 h-5 text-cyan-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('hw.student_title')}</h1>
          <p className="text-slate-500 text-sm">{t('hw.student_subtitle')}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">{t('hw.student_none')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const late = isLate(row);
            return (
              <div key={row.id} className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-cyan-100 text-cyan-700">{row.subject_name}</span>
                      {row.status === 'vleresuar' && (
                        <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />{t('hw.status_graded')}
                        </span>
                      )}
                      {row.status === 'dorezuar' && (
                        <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">{t('hw.status_submitted')}</span>
                      )}
                      {row.status === 'e_pa_dorezuar' && (
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">{t('hw.status_pending')}</span>
                      )}
                      {late && <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700">{t('hw.late')}</span>}
                    </div>
                    <h3 className="font-semibold text-slate-900 mt-1">{row.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('hw.assigned_on')} {row.assigned_date}
                      {row.due_date && ` · ${t('hw.delivery_until')} ${row.due_date}`}
                    </p>
                    {row.description && <p className="text-sm text-slate-600 mt-2">{row.description}</p>}
                    {row.grade !== null && (
                      <p className="text-sm mt-2 font-medium text-emerald-700">{t('hw.grade_label')} {row.grade}</p>
                    )}
                    {row.teacher_feedback && (
                      <p className="text-xs text-slate-600 mt-1 italic">{t('hw.feedback_field')}: {row.teacher_feedback}</p>
                    )}
                    {row.submitted_at && row.status !== 'vleresuar' && (
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {t('hw.submitted_at')} {new Date(row.submitted_at).toLocaleDateString('sq-AL')}
                      </p>
                    )}
                  </div>
                  {row.status !== 'vleresuar' && openId !== row.id && (
                    <button onClick={() => openSubmit(row)} className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium">
                      <Send className="w-4 h-4" />
                      {row.status === 'dorezuar' ? t('hw.resubmit') : t('hw.submit_btn')}
                    </button>
                  )}
                </div>

                {openId === row.id && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('hw.your_work')}</label>
                    <textarea
                      rows={4}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={t('hw.your_work_placeholder')}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 resize-none text-sm"
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => submit(row)} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {t('hw.submit_btn')}
                      </button>
                      <button onClick={() => setOpenId(null)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm hover:bg-slate-50">{t('common.cancel')}</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
