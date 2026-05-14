import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Check, X, Clock, AlertCircle, Calendar, Loader2 } from 'lucide-react';

type AttStatus = 'prezent' | 'mungon' | 'vonese' | 'arsyeshme';

interface AttRecord {
  date: string;
  status: AttStatus;
}

interface MonthData {
  month: string;
  days: { date: string; day: string; status: AttStatus }[];
}

const STATUS_CONFIG = {
  prezent: { icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Prezent' },
  mungon: { icon: X, color: 'text-rose-600', bg: 'bg-rose-100', label: 'Mungon' },
  vonese: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Vonese' },
  arsyeshme: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Arsyeshme' },
};

const DAY_ABBR = ['Diel', 'Hen', 'Mar', 'Mer', 'Enj', 'Pre', 'Sht'];

export default function MyAttendance() {
  const { profile, isDemo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, justified: 0, total: 0 });
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);

  useEffect(() => {
    loadAttendance();
  }, [profile]);

  const loadAttendance = async () => {
    if (isDemo) {
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
      setLoading(false);
      return;
    }

    try {
      const { data: records } = await supabase
        .from('attendance')
        .select('date, status')
        .eq('student_id', profile?.id)
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

      const MONTH_NAMES = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nentor', 'Dhjetor'];

      const grouped: Record<string, AttRecord[]> = {};
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
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  const presenceRate = summary.total > 0 ? ((summary.present / summary.total) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Frekuentimi Im</h1>
        <p className="text-slate-500 mt-1">Ndiqni prezencen tuaj ne mesim</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
          <p className="text-3xl font-bold text-slate-900">{presenceRate}%</p>
          <p className="text-xs text-slate-500 mt-1">Prezenca</p>
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

      {monthlyData.length > 0 ? (
        <div className="space-y-4">
          {monthlyData.map((month) => (
            <div key={month.month} className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-cyan-500" />
                <h3 className="font-semibold text-slate-900">{month.month}</h3>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {month.days.map((day) => {
                  const cfg = STATUS_CONFIG[day.status];
                  return (
                    <div
                      key={day.date}
                      className={`${cfg.bg} rounded-xl p-2 text-center cursor-pointer hover:shadow-md transition-all`}
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
          <p className="text-slate-500 text-sm">Nuk ka te dhena te frekuentimit per ju.</p>
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
