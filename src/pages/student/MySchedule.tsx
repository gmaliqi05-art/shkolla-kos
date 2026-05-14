import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Clock, MapPin, User, Loader2, AlertCircle } from 'lucide-react';

const DAYS = ['E Hënë', 'E Martë', 'E Mërkurë', 'E Enjte', 'E Premte'];
const DAY_NAMES: Record<number, string> = {
  1: 'E Hënë',
  2: 'E Martë',
  3: 'E Mërkurë',
  4: 'E Enjte',
  5: 'E Premte',
};

interface ScheduleItem {
  id: string;
  subject_name: string;
  teacher_name: string;
  room: string;
  start_time: string;
  end_time: string;
  day_of_week: number;
  color: string;
}

const SUBJECT_COLORS: Record<string, string> = {
  'Matematike': 'bg-blue-100 text-blue-800 border-blue-200',
  'Gjuhe Shqipe': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Anglisht': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Histori': 'bg-amber-100 text-amber-800 border-amber-200',
  'Gjeografi': 'bg-teal-100 text-teal-800 border-teal-200',
  'Biologji': 'bg-green-100 text-green-800 border-green-200',
  'Fizike': 'bg-orange-100 text-orange-800 border-orange-200',
  'Kimi': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Edukim Fizik': 'bg-rose-100 text-rose-800 border-rose-200',
  'Art Pamor': 'bg-pink-100 text-pink-800 border-pink-200',
  'Muzike': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  'TIK': 'bg-slate-100 text-slate-800 border-slate-200',
};

export default function MySchedule() {
  const { profile, isDemo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const todayIndex = Math.min(new Date().getDay() - 1, 4);
  const today = todayIndex >= 0 ? DAYS[todayIndex] : DAYS[0];

  useEffect(() => {
    loadSchedule();
  }, [profile]);

  const loadSchedule = async () => {
    if (isDemo) {
      setSchedule([
        { id: '1', subject_name: 'Matematike', teacher_name: 'Znj. Hoxha', room: 'Salla 12', start_time: '08:00', end_time: '08:45', day_of_week: 1, color: SUBJECT_COLORS['Matematike'] },
        { id: '2', subject_name: 'Gjuhe Shqipe', teacher_name: 'Z. Krasniqi', room: 'Salla 8', start_time: '09:00', end_time: '09:45', day_of_week: 1, color: SUBJECT_COLORS['Gjuhe Shqipe'] },
        { id: '3', subject_name: 'Anglisht', teacher_name: 'Znj. Shehu', room: 'Salla 5', start_time: '10:00', end_time: '10:45', day_of_week: 1, color: SUBJECT_COLORS['Anglisht'] },
        { id: '4', subject_name: 'Histori', teacher_name: 'Z. Krasniqi', room: 'Salla 8', start_time: '11:00', end_time: '11:45', day_of_week: 1, color: SUBJECT_COLORS['Histori'] },
        { id: '5', subject_name: 'Biologji', teacher_name: 'Z. Basha', room: 'Lab. Bio', start_time: '08:00', end_time: '08:45', day_of_week: 2, color: SUBJECT_COLORS['Biologji'] },
        { id: '6', subject_name: 'Matematike', teacher_name: 'Znj. Hoxha', room: 'Salla 12', start_time: '09:00', end_time: '09:45', day_of_week: 2, color: SUBJECT_COLORS['Matematike'] },
        { id: '7', subject_name: 'Fizike', teacher_name: 'Z. Basha', room: 'Lab. Fiz', start_time: '10:00', end_time: '10:45', day_of_week: 2, color: SUBJECT_COLORS['Fizike'] },
        { id: '8', subject_name: 'Edukim Fizik', teacher_name: 'Z. Dervishi', room: 'Palestra', start_time: '11:00', end_time: '11:45', day_of_week: 2, color: SUBJECT_COLORS['Edukim Fizik'] },
        { id: '9', subject_name: 'Gjuhe Shqipe', teacher_name: 'Z. Krasniqi', room: 'Salla 8', start_time: '08:00', end_time: '08:45', day_of_week: 3, color: SUBJECT_COLORS['Gjuhe Shqipe'] },
        { id: '10', subject_name: 'Anglisht', teacher_name: 'Znj. Shehu', room: 'Salla 5', start_time: '09:00', end_time: '09:45', day_of_week: 3, color: SUBJECT_COLORS['Anglisht'] },
        { id: '11', subject_name: 'Gjeografi', teacher_name: 'Znj. Leka', room: 'Salla 10', start_time: '10:00', end_time: '10:45', day_of_week: 3, color: SUBJECT_COLORS['Gjeografi'] },
        { id: '12', subject_name: 'Matematike', teacher_name: 'Znj. Hoxha', room: 'Salla 12', start_time: '11:00', end_time: '11:45', day_of_week: 3, color: SUBJECT_COLORS['Matematike'] },
      ]);
      setLoading(false);
      return;
    }

    try {
      const { data: enrollment, error: enrollError } = await supabase
        .from('student_classes')
        .select('class_id')
        .eq('student_id', profile?.id)
        .maybeSingle();

      if (enrollError) throw enrollError;

      if (!enrollment) {
        setSchedule([]);
        setLoading(false);
        return;
      }

      const { data: scheduleData, error: schedError } = await supabase
        .from('schedule')
        .select(`
          id,
          day_of_week,
          start_time,
          end_time,
          room,
          subjects (name),
          profiles (full_name)
        `)
        .eq('class_id', enrollment.class_id)
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time');

      if (schedError) throw schedError;

      const formattedSchedule = scheduleData?.map((item: any) => ({
        id: item.id,
        subject_name: item.subjects?.name || '',
        teacher_name: item.profiles?.full_name || '',
        room: item.room,
        start_time: item.start_time.substring(0, 5),
        end_time: item.end_time.substring(0, 5),
        day_of_week: item.day_of_week,
        color: SUBJECT_COLORS[item.subjects?.name || ''] || 'bg-slate-100 text-slate-800 border-slate-200',
      })) || [];

      setSchedule(formattedSchedule);
    } catch (error) {
      console.error('Error loading schedule:', error);
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  const getScheduleByDay = (day: number) => {
    return schedule.filter(item => item.day_of_week === day);
  };

  const getAllTimes = () => {
    const times = new Set<string>();
    schedule.forEach(item => {
      times.add(`${item.start_time} - ${item.end_time}`);
    });
    return Array.from(times).sort();
  };

  const getItemForDayAndTime = (day: number, timeSlot: string) => {
    const [start] = timeSlot.split(' - ');
    return schedule.find(
      item => item.day_of_week === day && item.start_time === start
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  if (schedule.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Nuk ka orar</h3>
        <p className="text-slate-500">
          {isDemo ? 'Orari nuk është konfiguruar për këtë përdorues demo.' : 'Nuk jeni të regjistruar në asnjë klasë ose klasa nuk ka orar.'}
        </p>
      </div>
    );
  }

  const times = getAllTimes();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orari Im</h1>
          <p className="text-slate-500 mt-1">Orari javor i mesimit</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setView('grid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Tabelë
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Listë
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left w-32">
                    Ora
                  </th>
                  {DAYS.map((day, index) => (
                    <th
                      key={day}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center ${
                        day === today ? 'text-cyan-600' : 'text-slate-500'
                      }`}
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {times.map((time) => (
                  <tr key={time} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-600 whitespace-nowrap">
                      {time}
                    </td>
                    {[1, 2, 3, 4, 5].map((day) => {
                      const item = getItemForDayAndTime(day, time);
                      return (
                        <td key={day} className="px-2 py-2">
                          {item ? (
                            <div className={`rounded-lg p-3 border-2 ${item.color} hover:shadow-md transition-shadow`}>
                              <div className="font-semibold text-sm mb-1">{item.subject_name}</div>
                              <div className="text-xs opacity-80 flex items-center gap-1 mb-1">
                                <User className="w-3 h-3" />
                                {item.teacher_name}
                              </div>
                              <div className="text-xs opacity-80 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {item.room}
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-300">-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((dayNum) => {
            const daySchedule = getScheduleByDay(dayNum);
            if (daySchedule.length === 0) return null;

            return (
              <div key={dayNum} className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className={`text-lg font-bold mb-4 ${DAY_NAMES[dayNum] === today ? 'text-cyan-600' : 'text-slate-900'}`}>
                  {DAY_NAMES[dayNum]}
                </h3>
                <div className="space-y-3">
                  {daySchedule.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-xl p-4 border-2 ${item.color} hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-base">{item.subject_name}</div>
                        <div className="flex items-center gap-1.5 text-sm opacity-80">
                          <Clock className="w-4 h-4" />
                          {item.start_time} - {item.end_time}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm opacity-80">
                        <div className="flex items-center gap-1.5">
                          <User className="w-4 h-4" />
                          {item.teacher_name}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {item.room}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
