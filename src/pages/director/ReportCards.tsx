import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  PERIOD_LABELS,
  REPORT_CARD_TYPE_LABELS,
  type ReportCardType,
} from '../../types/database';
import { Loader2, FileText, FileCheck, ChevronRight, Building2 } from 'lucide-react';

interface ClassOption {
  id: string;
  name: string;
  grade_level: number;
}

interface StudentRow {
  id: string;
  full_name: string;
  personal_number: string | null;
  issued_count: number;
}

export default function ReportCards() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [period, setPeriod] = useState<number | 'vjetore'>(1);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (selectedClass) loadStudents();
  }, [selectedClass, period]);

  const load = async () => {
    const { data } = await supabase
      .from('classes')
      .select('id, name, grade_level')
      .order('grade_level')
      .order('section');
    setClasses(data || []);
    if (data && data.length > 0) setSelectedClass(data[0].id);
    setLoading(false);
  };

  const loadStudents = async () => {
    const { data: enrolls } = await supabase
      .from('student_classes')
      .select('student_id')
      .eq('class_id', selectedClass);
    const studentIds = (enrolls || []).map((e) => e.student_id);
    if (studentIds.length === 0) {
      setStudents([]);
      return;
    }
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, personal_number')
      .in('id', studentIds)
      .is('deleted_at', null)
      .order('full_name');

    const cardType: ReportCardType = period === 'vjetore' ? 'vjetore' : 'periudhshme';
    const periodVal = period === 'vjetore' ? null : period;

    let q = supabase
      .from('report_cards_issued')
      .select('student_id')
      .in('student_id', studentIds)
      .eq('card_type', cardType);
    if (periodVal !== null) {
      q = q.eq('period', periodVal);
    } else {
      q = q.is('period', null);
    }
    const { data: issued } = await q;
    const issuedSet = new Set((issued || []).map((i) => i.student_id));

    setStudents((profiles || []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      personal_number: p.personal_number,
      issued_count: issuedSet.has(p.id) ? 1 : 0,
    })));
  };

  const openReportCard = (studentId: string) => {
    const cardType = period === 'vjetore' ? 'vjetore' : 'periudhshme';
    const p = period === 'vjetore' ? 'annual' : String(period);
    navigate(`/drejtor/deftesat/${studentId}/${selectedClass}/${p}/${cardType}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const selectedClassObj = classes.find((c) => c.id === selectedClass);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dëftesat Zyrtare</h1>
            <p className="text-slate-500 text-sm">UA 19/2018 — gjenerimi dhe lëshimi i dëftesave</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/drejtor/cilesime')}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-xl"
        >
          <Building2 className="w-4 h-4" />
          Cilësimet e shkollës
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Klasa</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Lloji</label>
          <select
            value={String(period)}
            onChange={(e) => setPeriod(e.target.value === 'vjetore' ? 'vjetore' : Number(e.target.value))}
            className="px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="1">{PERIOD_LABELS[1]}</option>
            <option value="2">{PERIOD_LABELS[2]}</option>
            <option value="3">{PERIOD_LABELS[3]}</option>
            <option value="vjetore">{REPORT_CARD_TYPE_LABELS.vjetore}</option>
          </select>
        </div>
      </div>

      {selectedClassObj && selectedClassObj.grade_level <= 2 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
          <FileText className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Klasa {selectedClassObj.grade_level} — vlerësimi përshkrues</p>
            <p className="text-blue-700 text-xs mt-1">
              Sipas UA 06/2022, nxënësit e klasave 1–2 vlerësohen me 5 nivele përshkruese, jo me nota numerike.
              Dëftesa do të gjenerojë vlerësimin përshkrues për lëndët e periudhës.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {students.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">
            Asnjë nxënës i regjistruar në këtë klasë.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase">
                <th className="px-4 py-3">Nxënësi</th>
                <th className="px-4 py-3">Numri Personal</th>
                <th className="px-4 py-3">Statusi i Dëftesës</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => openReportCard(s.id)}>
                  <td className="px-4 py-3 font-medium text-slate-900">{s.full_name}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">{s.personal_number || '—'}</td>
                  <td className="px-4 py-3">
                    {s.issued_count > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                        <FileCheck className="w-3 h-3" />
                        E lëshuar
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">
                        Pa lëshuar
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); openReportCard(s.id); }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      Hap dëftesën
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
