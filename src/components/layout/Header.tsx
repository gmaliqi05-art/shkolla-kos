import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, User, MessageSquare, Megaphone, Clock, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ROLE_LABELS } from '../../types/database';
import type { UserRole } from '../../types/database';

interface HeaderProps {
  onMenuToggle: () => void;
}

interface NotifItem {
  id: string;
  type: 'announcement' | 'message';
  title: string;
  preview: string;
  from: string;
  time: string;
  isRead: boolean;
}

const DEMO_NOTIFS: Record<UserRole, NotifItem[]> = {
  drejtor: [
    { id: 'n1', type: 'message', title: 'Pyetje per orarin', preview: 'A mundeni te ndryshoni orarin e dites se hene?', from: 'Florentina Gashi', time: '2 ore', isRead: false },
    { id: 'n2', type: 'announcement', title: 'Raport mujor', preview: 'Raporti i frekuentimit per muajin janar eshte gati.', from: 'Sistemi', time: '1 dite', isRead: true },
  ],
  mesues: [
    { id: 'n1', type: 'message', title: 'Detyra e shtepise', preview: 'Kam nje pyetje ne lidhje me detyren...', from: 'Ardi Krasniqi', time: '1 ore', isRead: false },
    { id: 'n2', type: 'announcement', title: 'Mbledhje e stafit', preview: 'Mbledhja e stafit do te mbahet diten e merkure.', from: 'Arben Hoxha', time: '3 ore', isRead: false },
  ],
  nxenes: [
    { id: 'n1', type: 'message', title: 'Detyra e shtepise', preview: 'Ju lutem mos harroni te perfundoni detyren...', from: 'Florentina Gashi', time: '1 ore', isRead: false },
    { id: 'n2', type: 'announcement', title: 'Njoftime per aktivitetin', preview: 'Jeni te ftuar ne aktivitetin e shkolles...', from: 'Arben Hoxha', time: '1 dite', isRead: true },
  ],
  prind: [
    { id: 'n1', type: 'message', title: 'Ecurite e femijes', preview: 'Ardi ka pasur rezultate shume te mira kete jave...', from: 'Florentina Gashi', time: '2 ore', isRead: false },
    { id: 'n2', type: 'announcement', title: 'Mbledhje me prinderit', preview: 'Diten e enjte ne oren 17:00', from: 'Arben Hoxha', time: '1 dite', isRead: false },
  ],
};

export default function Header({ onMenuToggle }: HeaderProps) {
  const { profile, isDemo, signOut } = useAuth();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifs();
  }, [profile]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadNotifs = async () => {
    if (!profile) return;

    if (isDemo) {
      setNotifs(DEMO_NOTIFS[profile.role] || []);
      return;
    }

    try {
      const [msgRes, annRes] = await Promise.all([
        supabase
          .from('messages')
          .select('id, subject, content, is_read, created_at, sender:sender_id(full_name)')
          .eq('receiver_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('announcements')
          .select('id, title, content, created_at')
          .in('target_role', [profile.role, 'te_gjithe'])
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      const items: NotifItem[] = [];

      (msgRes.data || []).forEach((m: any) => {
        const diff = Date.now() - new Date(m.created_at).getTime();
        const hours = Math.floor(diff / 3600000);
        const timeStr = hours < 1 ? 'Tani' : hours < 24 ? `${hours} ore` : `${Math.floor(hours / 24)} dite`;

        items.push({
          id: `msg-${m.id}`,
          type: 'message',
          title: m.subject,
          preview: m.content.substring(0, 80),
          from: m.sender?.full_name || '',
          time: timeStr,
          isRead: m.is_read,
        });
      });

      (annRes.data || []).forEach((a: any) => {
        const diff = Date.now() - new Date(a.created_at).getTime();
        const hours = Math.floor(diff / 3600000);
        const timeStr = hours < 1 ? 'Tani' : hours < 24 ? `${hours} ore` : `${Math.floor(hours / 24)} dite`;

        items.push({
          id: `ann-${a.id}`,
          type: 'announcement',
          title: a.title,
          preview: a.content.substring(0, 80),
          from: 'Shkolla',
          time: timeStr,
          isRead: true,
        });
      });

      items.sort((a, b) => {
        if (!a.isRead && b.isRead) return -1;
        if (a.isRead && !b.isRead) return 1;
        return 0;
      });

      setNotifs(items.slice(0, 8));
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const unreadCount = notifs.filter(n => !n.isRead).length;

  const getMessagePath = () => {
    if (!profile) return '/';
    const basePaths: Record<UserRole, string> = {
      drejtor: '/drejtor/mesazhet',
      mesues: '/mesues/mesazhet',
      nxenes: '/nxenes/mesazhet',
      prind: '/prind/mesazhet',
    };
    return basePaths[profile.role];
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <h2 className="text-sm font-semibold text-slate-900">
            Mire se vini, {profile?.full_name || 'Perdorues'}
          </h2>
          <p className="text-xs text-slate-500">
            {profile ? ROLE_LABELS[profile.role] : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(getMessagePath())}
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          title="Mesazhet"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Njoftimet</h3>
                <button onClick={() => setShowNotifs(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifs.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Nuk ka njoftime</p>
                  </div>
                ) : (
                  notifs.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        setShowNotifs(false);
                        if (n.type === 'message') navigate(getMessagePath());
                      }}
                      className={`w-full text-left px-5 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0 ${
                        !n.isRead ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${
                        n.type === 'message' ? 'bg-teal-50 text-teal-500' : 'bg-amber-50 text-amber-500'
                      }`}>
                        {n.type === 'message' ? <MessageSquare className="w-3.5 h-3.5" /> : <Megaphone className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate ${!n.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {n.title}
                          </p>
                          {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{n.preview}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400">{n.from}</span>
                          <span className="text-[10px] text-slate-300 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {n.time}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="px-5 py-3 border-t border-slate-100">
                <button
                  onClick={() => { setShowNotifs(false); navigate(getMessagePath()); }}
                  className="w-full text-center text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
                >
                  Shiko te gjitha mesazhet
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 ml-2 pl-4 border-l border-slate-200">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center text-white text-sm font-bold">
            {profile?.full_name?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-900 leading-tight">
              {profile?.full_name}
            </p>
            <p className="text-xs text-slate-500">{profile?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            title="Dilni"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
