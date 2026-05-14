import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Check, X, Clock, AlertCircle, Calendar, TrendingUp, Loader2, Users } from 'lucide-react';

type AttStatus = 'prezent' | 'mungon' | 'vonese' | 'arsyeshme';

interface MonthData {
  month: string;
  days: { date: string; day: string; status: AttStatus }[];
}

interface WeekTrend {
  week: string;
  rate: number;
}

const STATUS_CONFIG = {
  prezent: { icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Prezent' },
  mungon: { icon: X, color: 'text-rose-600', bg: 'bg-rose-100', label: 'Mungon' },
  vonese: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Vonese' },
  arsyeshme: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Arsyeshme' },
};

const DAY_ABBR = ['Diel', 'Hen', 'Mar', 'Mer', 'Enj', 'Pre', 'Sht'];

const MONTH_NAMES = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nentor', 'Dhjetor'];

export default function ChildAttendance() {
  const { profile, isDemo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [childName, setChildName] = useState('');
  const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, justified: 0, total: 0 });
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<WeekTrend[]>([]);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (isDemo) {
      setChildName('Ardi Malaj');
      setSummary({ present: 78, absent: 3, late: 2, justified: 2, total: 85 });
      setMonthlyData([
        {
          month: 'Shkurt 2026',
          days: [
            { date: '03', day: 'Hen', status: 'prezent' }, { date: '04', day: 'Mar', status: 'prezent' },
            { date: '05', day: 'Mer', status: 'prezent' }, { date: '06', day: 'Enj', status: 'vonese' },
            { date: '07', day: 'Pre', status: 'prezent' },
          ],
        },
        {
          month: 'Janar 2026',
          days: [
            { date: '06', day: 'Hen', status: 'prezent' }, { date: '07', day: 'Mar', status: 'prezent' },
            { date: '08', day: 'Mer', status: 'mungon' }, { date: '09', day: 'Enj', status: 'arsyeshme' },
            { date: '10', day: 'Pre', status: 'prezent' }, { date: '13', day: 'Hen', status: 'prezent' },
            { date: '14', day: 'Mar', status: 'prezent' }, { date: '15', day: 'Mer', status: 'prezent' },
            { date: '16', day: 'Enj', status: 'prezent' }, { date: '17', day: 'Pre', status: 'prezent' },
            { date: '20', day: 'Hen', status: 'mungon' }, { date: '21', day: 'Mar', status: 'arsyeshme' },
            { date: '22', day: 'Mer', status: 'prezent' }, { date: '23', day: 'Enj', status: 'prezent' },
            { date: '24', day: 'Pre', status: 'vonese' }, { date: '27', day: 'Hen', status: 'prezent' },
            { date: '28', day: 'Mar', status: 'prezent' }, { date: '29', day: 'Mer', status: 'prezent' },
            { date: '30', day: 'Enj', status: 'prezent' }, { date: '31', day: 'Pre', status: 'mungon' },
          ],
        },
      ]);
      setWeeklyTrend([
        { week: 'Java 1', rate: 100 }, { week: 'Java 2', rate: 80 },
        { week: 'Java 3', rate: 100 }, { week: 'Java 4', rate: 60 },
        { week: 'Java 5', rate: 100 }, { week: 'Java 6', rate: 100 },
        { week: 'Java 7', rate: 80 }, { week: 'Java 8', rate: 100 },
      ]);
      setLoading(false);
      return;
    }

    try {
      const { data: parentStudent } = await supabase
        .from('parent_students')
        .select('student_id, profiles:student_id(id, full_name)')
        .eq('parent_id', profile?.id)
        .limit(1)
        .maybeSingle();

      if (!parentStudent) {
        setLoading(false);
        return;
      }

      const childId = parentStudent.student_id;
      setChildName((parentStudent as any).profiles?.full_name || '');

      const { data: records } = await supabase
        .from('attendance')
        .select('date, status')
        .eq('student_id', childId)
        .order('date', { ascending: false });

      if (!records || records.length === 0) {
        setLoading(false);
        return;
      }

      const present = records.filter(r => r.status === 'prezent').length;
      const absent = records.filter(r => r.status === 'mungon').length;
      const late = records.filter(r => r.status === 'vonese').length;
      const justified = records.filter(r => r.status === 'arsyeshme').length;
      setSummary({ present, absent, late, justified, total: records.length });

      const grouped: Record<string, { date: string; status: AttStatus }[]> = {};
      records.forEach(r => {
        const d = new Date(r.date);
        const key = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push({ date: r.date, status: r.status as AttStatus });
      });

      const months: MonthData[] = Object.entries(grouped).map(([month, recs]) => ({
        month,
        days: recs.sort((a, b) => a.date.localeCompare(b.date)).map(r => {
          const d = new Date(r.date);
          return {
            date: String(d.getDate()).padStart(2, '0'),
            day: DAY_ABBR[d.getDay()],
            status: r.status,
          };
        }),
      }));
      setMonthlyData(months);

      const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
      if (sorted.length > 0) {
        const firstDate = new Date(sorted[0].date);
        const mondayOffset = firstDate.getDay() === 0 ? -6 : 1 - firstDate.getDay();
        const firstMonday = new Date(firstDate);
        firstMonday.setDate(firstDate.getDate() + mondayOffset);

        const weekMap: Record<number, { total: number; present: number }> = {};
        sorted.forEach(r => {
          const d = new Date(r.date);
          const diff = Math.floor((d.getTime() - firstMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
          if (!weekMap[diff]) weekMap[diff] = { total: 0, present: 0 };
          weekMap[diff].total += 1;
          if (r.status === 'prezent') weekMap[diff].present += 1;
        });

        const weekNums = Object.keys(weekMap).map(Number).sort((a, b) => a - b);
        const last8 = weekNums.slice(-8);
        setWeeklyTrend(last8.map((wn, i) => ({
          week: `Java ${i + 1}`,
          rate: weekMap[wn].total > 0 ? Math.round((weekMap[wn].present / weekMap[wn].total) * 100) : 100,
        })));
      }
    } catch (error) {
      console.error('Error loading child attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (!childName && !isDemo) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Frekuentimi</h1>
          <p className="text-slate-500 mt-1">Ndiqni prezencen e femijes ne shkoll</p>
        </div>
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Nuk ka femije te lidhur</h3>
          <p className="text-slate-500 text-sm">Kontaktoni drejtorine per te lidhur llogarine me femijen tuaj.</p>
        </div>
      </div>
    );
  }

  const presenceRate = summary.total > 0 ? ((summary.present / summary.total) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Frekuentimi i {childName.split(' ')[0]}</h1>
        <p className="text-slate-500 mt-1">Ndiqni prezencen e femijes ne shkoll</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-3xl font-bold text-slate-900">{presenceRate}%</p>
          <p className="text-xs text-slate-500 mt-1">Prezenca</p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
            <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${presenceRate}%` }} />
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-emerald-700">{summary.present}</p>
          <p className="text-xs text-emerald-600 mt-1">Prezent</p>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-rose-700">{summary.absent}</p>
          <p className="text-xs text-rose-600 mt-1">Mungesa</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-700">{summary.late}</p>
          <p className="text-xs text-amber-600 mt-1">Vonesa</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-700">{summary.justified}</p>
          <p className="text-xs text-blue-600 mt-1">Arsyeshme</p>
        </div>
      </div>

      {weeklyTrend.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-teal-500" />
            <h3 className="font-semibold text-slate-900">Trendi Javor</h3>
          </div>
          <div className="flex items-end gap-2 h-32">
            {weeklyTrend.map((w) => (
              <div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-slate-100 rounded-t-lg relative" style={{ height: '100px' }}>
                  <div
                    className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-500 ${
                      w.rate >= 90 ? 'bg-emerald-400' :
                      w.rate >= 70 ? 'bg-amber-400' :
                      'bg-rose-400'
                    }`}
                    style={{ height: `${w.rate}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400">{w.week.replace('Java ', 'J')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {monthlyData.length > 0 ? (
        <div className="space-y-4">
          {monthlyData.map((month) => (
            <div key={month.month} className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-slate-500" />
                <h3 className="font-semibold text-slate-900">{month.month}</h3>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {month.days.map((day) => {
                  const cfg = STATUS_CONFIG[day.status];
                  return (
                    <div
                      key={day.date}
                      className={`${cfg.bg} rounded-xl p-2 text-center hover:shadow-md transition-all`}
                      title={`${day.date} ${month.month} - ${cfg.label}`}
                    >
                      <p className={`text-lg font-bold ${cfg.color}`}>{day.date}</p>
                      <p className="text-[10px] text-slate-500">{day.day}</p>
                      <cfg.icon className={`w-3 h-3 ${cfg.color} mx-auto mt-1`} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Nuk ka te dhena</h3>
          <p className="text-slate-500 text-sm">Nuk ka te dhena te frekuentimit.</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-semibold text-slate-900 mb-3">Legjenda</h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-6 h-6 ${cfg.bg} rounded-lg flex items-center justify-center`}>
                <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
              </div>
              <span className="text-sm text-slate-600">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
