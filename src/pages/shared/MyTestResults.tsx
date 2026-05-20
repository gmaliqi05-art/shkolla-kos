import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  TEST_RESULT_LEVEL_LABELS,
  TEST_RESULT_LEVEL_COLORS,
  NATIONAL_TEST_STATUS_LABELS,
  type NationalTest,
  type NationalTestResult,
} from '../../types/database';
import { Loader2, GraduationCap, Trophy, Printer } from 'lucide-react';

interface ChildOption {
  id: string;
  full_name: string;
}

interface TestWithResults {
  test: NationalTest;
  results: NationalTestResult[];
}

export default function MyTestResults() {
  const { profile } = useAuth();
  const isParent = profile?.role === 'prind';

  const [children, setChildren] = useState<ChildOption[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [data, setData] = useState<TestWithResults[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    if (isParent) {
      loadChildren();
    } else {
      setSelectedStudent(profile.id);
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (selectedStudent) loadResults();
  }, [selectedStudent]);

  const loadChildren = async () => {
    if (!profile) return;
    const { data: links } = await supabase.from('parent_students').select('student_id').eq('parent_id', profile.id);
    const ids = (links || []).map((l) => l.student_id);
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('profiles').select('id, full_name').in('id', ids);
    setChildren(data || []);
    if (data && data.length > 0) setSelectedStudent(data[0].id);
    setLoading(false);
  };

  const loadResults = async () => {
    setLoading(true);
    const { data: results } = await supabase
      .from('national_test_results')
      .select('*')
      .eq('student_id', selectedStudent)
      .order('recorded_at', { ascending: false });
    const resultsList: NationalTestResult[] = results || [];
    if (resultsList.length === 0) {
      setData([]);
      setLoading(false);
      return;
    }
    const testIds = Array.from(new Set(resultsList.map((r) => r.test_id)));
    const { data: tests } = await supabase.from('national_tests').select('*').in('id', testIds);
    const byTest = new Map<string, NationalTestResult[]>();
    resultsList.forEach((r) => {
      const list = byTest.get(r.test_id) || [];
      list.push(r);
      byTest.set(r.test_id, list);
    });
    const items: TestWithResults[] = (tests || []).map((t: NationalTest) => ({
      test: t,
      results: byTest.get(t.id) || [],
    }));
    items.sort((a, b) => b.test.test_date.localeCompare(a.test.test_date));
    setData(items);
    setLoading(false);
  };

  const handlePrint = () => {
    const studentName = isParent
      ? children.find((c) => c.id === selectedStudent)?.full_name || ''
      : profile?.full_name || '';
    const today = new Date().toLocaleDateString('sq-AL', { year: 'numeric', month: 'long', day: 'numeric' });
    const w = window.open('', '_blank');
    if (!w) return;

    const sections = data.map(({ test, results }) => {
      const rows = results.map((r) => `
        <tr>
          <td>${r.subject_name}</td>
          <td style="text-align:center">${r.score !== null ? `${r.score}/${r.max_score}` : '—'}</td>
          <td style="text-align:center">${r.percentage !== null ? `${r.percentage.toFixed(0)}%` : '—'}</td>
          <td>${r.level ? TEST_RESULT_LEVEL_LABELS[r.level] : '—'}</td>
        </tr>`).join('');
      return `
        <h2>${test.name}</h2>
        <p class="meta">Klasa ${test.grade_level}-të • ${test.test_date} • ${NATIONAL_TEST_STATUS_LABELS[test.status]}</p>
        <table>
          <thead><tr><th>Lënda</th><th style="text-align:center">Pikët</th><th style="text-align:center">Përqindja</th><th>Niveli</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    }).join('');

    w.document.write(`<!DOCTYPE html><html><head><title>Rezultatet e Testeve - ${studentName}</title><style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:40px;color:#1e293b;max-width:900px;margin:0 auto}
      h1{font-size:22px;margin-bottom:4px}
      h2{font-size:16px;margin-top:24px;padding-bottom:6px;border-bottom:2px solid #e2e8f0}
      .subtitle{color:#64748b;font-size:13px;margin-bottom:24px}
      .meta{color:#64748b;font-size:12px;margin:4px 0 8px}
      table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}
      th,td{padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:left}
      th{background:#f8fafc;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600}
      .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center}
      @media print{body{padding:20px}}
    </style></head><body>
      <h1>Rezultatet e Testeve Kombëtare</h1>
      <p class="subtitle">${studentName} • Gjeneruar: ${today}</p>
      ${sections || '<p>Asnjë rezultat i regjistruar.</p>'}
      <div class="footer">Sistemi i Menaxhimit Shkollor — Shkolla-Kos</div>
    </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (isParent && children.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        Nuk keni asnjë fëmijë të lidhur me llogarinë tuaj.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Rezultatet e Testeve Kombëtare</h1>
            <p className="text-slate-500 text-sm">Testi i Arritshmërisë Klasa V-të dhe IX-të</p>
          </div>
        </div>
        {data.length > 0 && (
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700"
          >
            <Printer className="w-4 h-4" />
            Printo / PDF
          </button>
        )}
      </div>

      {isParent && children.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <label className="block text-xs font-medium text-slate-500 mb-1">Fëmija</label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
        </div>
      )}

      {data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 px-6 py-12 text-center text-slate-400 text-sm">
          Asnjë rezultat i regjistruar për teste kombëtare.
        </div>
      ) : (
        <div className="space-y-4">
          {data.map(({ test, results }) => (
            <div key={test.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                    Klasa {test.grade_level}-të
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                    {NATIONAL_TEST_STATUS_LABELS[test.status]}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 mt-1">{test.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{test.test_date}</p>
              </div>
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
                    <th className="px-4 py-2">Lënda</th>
                    <th className="px-4 py-2 text-center">Pikët</th>
                    <th className="px-4 py-2 text-center">Përqindja</th>
                    <th className="px-4 py-2">Niveli</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2 font-medium text-slate-900">{r.subject_name}</td>
                      <td className="px-4 py-2 text-center text-slate-700">
                        {r.score !== null ? `${r.score}/${r.max_score}` : '—'}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {r.percentage !== null ? (
                          <span className="font-semibold text-slate-900">{r.percentage.toFixed(0)}%</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-2">
                        {r.level ? (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${TEST_RESULT_LEVEL_COLORS[r.level]}`}>
                            <Trophy className="w-3 h-3 inline mr-1" />
                            {TEST_RESULT_LEVEL_LABELS[r.level]}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
