import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  NATIONAL_TEST_STATUS_LABELS,
  TEST_RESULT_LEVEL_LABELS,
  TEST_RESULT_LEVEL_COLORS,
  type NationalTest,
  type NationalTestStatus,
  type NationalTestResult,
  type TestResultLevel,
} from '../../types/database';
import { Loader2, Plus, X, GraduationCap, ChevronDown, ChevronRight, Edit2, Save } from 'lucide-react';

interface TestWithCounts extends NationalTest {
  result_count?: number;
}

interface StudentRow {
  id: string;
  full_name: string;
  results: Map<string, NationalTestResult>;
}

const STATUS_COLORS: Record<NationalTestStatus, string> = {
  planifikuar: 'bg-blue-100 text-blue-700',
  mbajtur: 'bg-emerald-100 text-emerald-700',
  rezultatet_marrura: 'bg-purple-100 text-purple-700',
  perfunduar: 'bg-slate-100 text-slate-600',
};

const DEFAULT_SUBJECTS_5 = ['Gjuhë Shqipe', 'Matematikë', 'Natyra dhe Shoqëria'];
const DEFAULT_SUBJECTS_9 = ['Gjuhë Shqipe', 'Matematikë', 'Shkencat e Natyrës', 'Anglisht'];

export default function NationalTests() {
  const { profile } = useAuth();
  const [tests, setTests] = useState<TestWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [studentsForTest, setStudentsForTest] = useState<Map<string, StudentRow[]>>(new Map());

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<NationalTest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    grade_level: 5 as 5 | 9,
    test_date: new Date().toISOString().slice(0, 10),
    name: '',
    description: '',
    status: 'planifikuar' as NationalTestStatus,
  });

  const [editingResult, setEditingResult] = useState<{
    testId: string;
    studentId: string;
    subjectName: string;
    score: string;
    maxScore: string;
    level: TestResultLevel | '';
  } | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data: testsData } = await supabase
      .from('national_tests')
      .select('*')
      .order('test_date', { ascending: false });
    const items: NationalTest[] = testsData || [];
    if (items.length === 0) {
      setTests([]);
      setLoading(false);
      return;
    }
    const ids = items.map((t) => t.id);
    const { data: resultsData } = await supabase
      .from('national_test_results')
      .select('test_id')
      .in('test_id', ids);
    const counts = new Map<string, number>();
    (resultsData || []).forEach((r: { test_id: string }) => {
      counts.set(r.test_id, (counts.get(r.test_id) || 0) + 1);
    });
    setTests(items.map((t) => ({ ...t, result_count: counts.get(t.id) || 0 })));
    setLoading(false);
  };

  const loadStudentsForTest = async (test: NationalTest) => {
    const { data: enrolls } = await supabase
      .from('student_classes')
      .select('student_id, classes!inner(grade_level)')
      .eq('classes.grade_level', test.grade_level);
    type EnrollRow = { student_id: string };
    const studentIds = Array.from(new Set((enrolls || []).map((e) => (e as EnrollRow).student_id)));
    if (studentIds.length === 0) {
      setStudentsForTest((prev) => new Map(prev).set(test.id, []));
      return;
    }
    const [profilesRes, resultsRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name').in('id', studentIds).is('deleted_at', null).order('full_name'),
      supabase.from('national_test_results').select('*').eq('test_id', test.id),
    ]);
    const results: NationalTestResult[] = resultsRes.data || [];
    const resultsByStudent = new Map<string, Map<string, NationalTestResult>>();
    results.forEach((r) => {
      if (!resultsByStudent.has(r.student_id)) resultsByStudent.set(r.student_id, new Map());
      resultsByStudent.get(r.student_id)!.set(r.subject_name, r);
    });
    const rows: StudentRow[] = (profilesRes.data || []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      results: resultsByStudent.get(p.id) || new Map(),
    }));
    setStudentsForTest((prev) => new Map(prev).set(test.id, rows));
  };

  const toggleExpand = (test: NationalTest) => {
    if (expanded === test.id) {
      setExpanded(null);
    } else {
      setExpanded(test.id);
      if (!studentsForTest.has(test.id)) loadStudentsForTest(test);
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ grade_level: 5, test_date: new Date().toISOString().slice(0, 10), name: '', description: '', status: 'planifikuar' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (t: NationalTest) => {
    setEditing(t);
    setForm({
      grade_level: t.grade_level as 5 | 9,
      test_date: t.test_date,
      name: t.name,
      description: t.description,
      status: t.status,
    });
    setError('');
    setShowModal(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const payload = {
      grade_level: form.grade_level,
      test_date: form.test_date,
      name: form.name,
      description: form.description,
      status: form.status,
    };
    const res = editing
      ? await supabase.from('national_tests').update(payload).eq('id', editing.id)
      : await supabase.from('national_tests').insert(payload);
    if (res.error) {
      setError(res.error.message);
    } else {
      setShowModal(false);
      load();
    }
    setSubmitting(false);
  };

  const openEditResult = (testId: string, studentId: string, subjectName: string, existing: NationalTestResult | undefined) => {
    setEditingResult({
      testId,
      studentId,
      subjectName,
      score: existing?.score ? String(existing.score) : '',
      maxScore: existing?.max_score ? String(existing.max_score) : '100',
      level: existing?.level || '',
    });
  };

  const saveResult = async () => {
    if (!editingResult || !profile) return;
    const score = editingResult.score ? Number(editingResult.score) : null;
    const maxScore = editingResult.maxScore ? Number(editingResult.maxScore) : null;
    const percentage = score !== null && maxScore && maxScore > 0 ? (score / maxScore) * 100 : null;

    const { data: existing } = await supabase
      .from('national_test_results')
      .select('id')
      .eq('test_id', editingResult.testId)
      .eq('student_id', editingResult.studentId)
      .eq('subject_name', editingResult.subjectName)
      .maybeSingle();

    const payload = {
      test_id: editingResult.testId,
      student_id: editingResult.studentId,
      subject_name: editingResult.subjectName,
      score,
      max_score: maxScore,
      percentage,
      level: editingResult.level || null,
      recorded_by: profile.id,
      recorded_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase.from('national_test_results').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('national_test_results').insert(payload);
    }
    setEditingResult(null);
    const test = tests.find((t) => t.id === editingResult.testId);
    if (test) loadStudentsForTest(test);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Testet Kombëtare</h1>
            <p className="text-slate-500 text-sm">Testi i Arritshmërisë Klasa V-të dhe IX-të (MAShTI/MASA)</p>
          </div>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium">
          <Plus className="w-4 h-4" />
          Krijo Test
        </button>
      </div>

      {tests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 px-6 py-12 text-center text-slate-400 text-sm">
          Asnjë test i regjistruar. Krijoni testin e parë.
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((t) => {
            const subjects = t.grade_level === 5 ? DEFAULT_SUBJECTS_5 : DEFAULT_SUBJECTS_9;
            const isOpen = expanded === t.id;
            const students = studentsForTest.get(t.id) || [];
            return (
              <div key={t.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                        Klasa {t.grade_level}-të
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[t.status]}`}>
                        {NATIONAL_TEST_STATUS_LABELS[t.status]}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mt-1">{t.name}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {t.test_date} · {t.result_count} rezultate të regjistruara
                    </p>
                    {t.description && <p className="text-sm text-slate-600 mt-1 italic">{t.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(t)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleExpand(t)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded">
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 overflow-x-auto">
                    {students.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">Asnjë nxënës në klasën {t.grade_level}.</p>
                    ) : (
                      <table className="w-full text-sm min-w-[600px]">
                        <thead>
                          <tr className="text-left text-xs font-semibold text-slate-500 uppercase">
                            <th className="px-2 py-2">Nxënësi</th>
                            {subjects.map((s) => (
                              <th key={s} className="px-2 py-2 text-center">{s}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((st) => (
                            <tr key={st.id} className="border-t border-slate-200">
                              <td className="px-2 py-2 font-medium text-slate-900">{st.full_name}</td>
                              {subjects.map((s) => {
                                const r = st.results.get(s);
                                return (
                                  <td key={s} className="px-2 py-2 text-center">
                                    <button
                                      onClick={() => openEditResult(t.id, st.id, s, r)}
                                      className="inline-flex items-center justify-center min-w-[80px] px-2 py-1 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
                                    >
                                      {r ? (
                                        <div className="flex flex-col items-center gap-0.5">
                                          <span className="text-slate-900 font-semibold">
                                            {r.score}/{r.max_score} ({r.percentage?.toFixed(0)}%)
                                          </span>
                                          {r.level && (
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${TEST_RESULT_LEVEL_COLORS[r.level]}`}>
                                              {TEST_RESULT_LEVEL_LABELS[r.level]}
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-slate-400">+ Shto</span>
                                      )}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edito Testin' : 'Krijo Test të Ri'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Klasa *</label>
                  <select required value={form.grade_level} onChange={(e) => setForm({ ...form, grade_level: Number(e.target.value) as 5 | 9 })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500">
                    <option value={5}>Klasa V-të</option>
                    <option value={9}>Klasa IX-të</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data e testit *</label>
                  <input required type="date" value={form.test_date} onChange={(e) => setForm({ ...form, test_date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Emri / Titulli *</label>
                <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="P.sh. Testi i Arritshmërisë 2026" className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Përshkrimi</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Statusi</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as NationalTestStatus })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500">
                  {(Object.keys(NATIONAL_TEST_STATUS_LABELS) as NationalTestStatus[]).map((s) => (
                    <option key={s} value={s}>{NATIONAL_TEST_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Ruaj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Rezultati i {editingResult.subjectName}</h2>
              <button onClick={() => setEditingResult(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pikët</label>
                  <input type="number" step="0.01" value={editingResult.score} onChange={(e) => setEditingResult({ ...editingResult, score: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Maksimumi</label>
                  <input type="number" step="0.01" value={editingResult.maxScore} onChange={(e) => setEditingResult({ ...editingResult, maxScore: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Niveli i arritshmërisë</label>
                <select value={editingResult.level} onChange={(e) => setEditingResult({ ...editingResult, level: e.target.value as TestResultLevel | '' })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">— Pa specifikim —</option>
                  {(Object.keys(TEST_RESULT_LEVEL_LABELS) as TestResultLevel[]).map((l) => (
                    <option key={l} value={l}>{TEST_RESULT_LEVEL_LABELS[l]}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingResult(null)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button onClick={saveResult} className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  Ruaj
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
