import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, Inbox, ArrowLeft, Plus, X, Search,
  Loader2, Mail, MailOpen, Trash2, Clock, ChevronDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types/database';
import { ROLE_LABELS } from '../../types/database';

interface MessageItem {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  sender_role: UserRole;
  receiver_name: string;
  receiver_role: UserRole;
}

interface ContactItem {
  id: string;
  full_name: string;
  role: UserRole;
  email: string;
}

const ROLE_CAN_MESSAGE: Record<UserRole, UserRole[]> = {
  drejtor: ['mesues', 'nxenes', 'prind'],
  mesues: ['nxenes', 'prind', 'drejtor'],
  nxenes: ['mesues'],
  prind: ['mesues'],
};

const DEMO_MESSAGES: MessageItem[] = [
  { id: 'd1', sender_id: 'demo-mesues', receiver_id: 'demo-nxenes', subject: 'Detyra e shtepise', content: 'Pershendetje! Ju lutem mos harroni te perfundoni detyren e matematikes per diten e hene. Nese keni pyetje, mund te me shkruani.', is_read: false, created_at: new Date(Date.now() - 3600000).toISOString(), sender_name: 'Florentina Gashi', sender_role: 'mesues', receiver_name: 'Ardi Krasniqi', receiver_role: 'nxenes' },
  { id: 'd2', sender_id: 'demo-drejtor', receiver_id: 'demo-nxenes', subject: 'Njoftime per aktivitetin', content: 'Te dashur nxenes, jeni te ftuar ne aktivitetin e shkolles qe do te mbahet diten e premte ne oren 10:00.', is_read: true, created_at: new Date(Date.now() - 86400000).toISOString(), sender_name: 'Arben Hoxha', sender_role: 'drejtor', receiver_name: 'Ardi Krasniqi', receiver_role: 'nxenes' },
  { id: 'd3', sender_id: 'demo-nxenes', receiver_id: 'demo-mesues', subject: 'Pyetje per projektin', content: 'Pershendetje mesuese! Kam nje pyetje ne lidhje me projektin e biologjise. A mundeni te me ndihmoni?', is_read: true, created_at: new Date(Date.now() - 172800000).toISOString(), sender_name: 'Ardi Krasniqi', sender_role: 'nxenes', receiver_name: 'Florentina Gashi', receiver_role: 'mesues' },
  { id: 'd4', sender_id: 'demo-mesues', receiver_id: 'demo-prind', subject: 'Ecurite e femijes', content: 'Pershendetje! Doja tju njoftoja qe Ardi ka pasur rezultate shume te mira kete jave ne matematike.', is_read: false, created_at: new Date(Date.now() - 7200000).toISOString(), sender_name: 'Florentina Gashi', sender_role: 'mesues', receiver_name: 'Driton Krasniqi', receiver_role: 'prind' },
  { id: 'd5', sender_id: 'demo-prind', receiver_id: 'demo-mesues', subject: 'Faleminderit', content: 'Faleminderit per njoftimin! Jam shume i kenaqur me ecurine e Ardit.', is_read: true, created_at: new Date(Date.now() - 3600000 * 5).toISOString(), sender_name: 'Driton Krasniqi', sender_role: 'prind', receiver_name: 'Florentina Gashi', receiver_role: 'mesues' },
  { id: 'd6', sender_id: 'demo-drejtor', receiver_id: 'demo-mesues', subject: 'Mbledhje e stafit', content: 'Te dashur mesues, mbledhja e stafit do te mbahet diten e merkure ne oren 14:00 ne sallen e konferencave.', is_read: false, created_at: new Date(Date.now() - 3600000 * 2).toISOString(), sender_name: 'Arben Hoxha', sender_role: 'drejtor', receiver_name: 'Florentina Gashi', receiver_role: 'mesues' },
];

const DEMO_CONTACTS: ContactItem[] = [
  { id: 'demo-drejtor', full_name: 'Arben Hoxha', role: 'drejtor', email: 'drejtor@shkolla.ks' },
  { id: 'demo-mesues', full_name: 'Florentina Gashi', role: 'mesues', email: 'mesues@shkolla.ks' },
  { id: 'demo-nxenes', full_name: 'Ardi Krasniqi', role: 'nxenes', email: 'nxenes@shkolla.ks' },
  { id: 'demo-prind', full_name: 'Driton Krasniqi', role: 'prind', email: 'prind@shkolla.ks' },
];

export default function MessagesPage() {
  const { profile, isDemo } = useAuth();
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<ContactItem | null>(null);
  const [msgSubject, setMsgSubject] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [sending, setSending] = useState(false);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [profile, tab]);

  useEffect(() => {
    if (showCompose) loadContacts();
  }, [showCompose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowContactDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadMessages = async () => {
    if (!profile) return;
    setLoading(true);

    if (isDemo) {
      const filtered = DEMO_MESSAGES.filter(m =>
        tab === 'inbox' ? m.receiver_id === profile.id : m.sender_id === profile.id
      );
      setMessages(filtered);
      setLoading(false);
      return;
    }

    try {
      const col = tab === 'inbox' ? 'receiver_id' : 'sender_id';
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:sender_id(full_name, role), receiver:receiver_id(full_name, role)')
        .eq(col, profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMessages((data || []).map((m: any) => ({
        id: m.id,
        sender_id: m.sender_id,
        receiver_id: m.receiver_id,
        subject: m.subject,
        content: m.content,
        is_read: m.is_read,
        created_at: m.created_at,
        sender_name: m.sender?.full_name || '',
        sender_role: m.sender?.role || 'nxenes',
        receiver_name: m.receiver?.full_name || '',
        receiver_role: m.receiver?.role || 'nxenes',
      })));
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    if (!profile) return;

    if (isDemo) {
      const allowedRoles = ROLE_CAN_MESSAGE[profile.role];
      setContacts(DEMO_CONTACTS.filter(c => allowedRoles.includes(c.role) && c.id !== profile.id));
      return;
    }

    try {
      const allowedRoles = ROLE_CAN_MESSAGE[profile.role];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, email')
        .in('role', allowedRoles)
        .neq('id', profile.id)
        .order('full_name');

      if (error) throw error;
      setContacts(data || []);
    } catch (err) {
      console.error('Error loading contacts:', err);
    }
  };

  const markAsRead = async (msg: MessageItem) => {
    if (msg.is_read || msg.receiver_id !== profile?.id) return;

    if (isDemo) {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
      return;
    }

    await supabase.from('messages').update({ is_read: true }).eq('id', msg.id);
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
  };

  const openMessage = (msg: MessageItem) => {
    setSelectedMessage(msg);
    markAsRead(msg);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedContact || !msgSubject.trim() || !msgContent.trim()) return;
    setSending(true);

    if (isDemo) {
      const newMsg: MessageItem = {
        id: `d${Date.now()}`,
        sender_id: profile.id,
        receiver_id: selectedContact.id,
        subject: msgSubject,
        content: msgContent,
        is_read: false,
        created_at: new Date().toISOString(),
        sender_name: profile.full_name,
        sender_role: profile.role,
        receiver_name: selectedContact.full_name,
        receiver_role: selectedContact.role,
      };
      DEMO_MESSAGES.unshift(newMsg);
      closeCompose();
      setSending(false);
      if (tab === 'sent') loadMessages();
      setTab('sent');
      return;
    }

    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: profile.id,
        receiver_id: selectedContact.id,
        subject: msgSubject,
        content: msgContent,
      });

      if (error) throw error;
      closeCompose();
      if (tab === 'sent') loadMessages();
      else setTab('sent');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId: string) => {
    if (isDemo) {
      const idx = DEMO_MESSAGES.findIndex(m => m.id === msgId);
      if (idx !== -1) DEMO_MESSAGES.splice(idx, 1);
      setMessages(prev => prev.filter(m => m.id !== msgId));
      setSelectedMessage(null);
      return;
    }

    await supabase.from('messages').delete().eq('id', msgId);
    setMessages(prev => prev.filter(m => m.id !== msgId));
    setSelectedMessage(null);
  };

  const closeCompose = () => {
    setShowCompose(false);
    setSelectedContact(null);
    setMsgSubject('');
    setMsgContent('');
    setContactSearch('');
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Tani';
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ore`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} dite`;
    return new Date(dateStr).toLocaleDateString('sq-AL');
  };

  const getRoleColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      drejtor: 'bg-blue-100 text-blue-700',
      mesues: 'bg-teal-100 text-teal-700',
      nxenes: 'bg-cyan-100 text-cyan-700',
      prind: 'bg-slate-200 text-slate-700',
    };
    return colors[role];
  };

  const getRoleAvatarColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      drejtor: 'from-blue-500 to-blue-600',
      mesues: 'from-teal-500 to-teal-600',
      nxenes: 'from-cyan-500 to-cyan-600',
      prind: 'from-slate-500 to-slate-600',
    };
    return colors[role];
  };

  const unreadCount = messages.filter(m => !m.is_read && m.receiver_id === profile?.id).length;

  const filteredContacts = contacts.filter(c =>
    c.full_name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    ROLE_LABELS[c.role].toLowerCase().includes(contactSearch.toLowerCase())
  );

  if (selectedMessage) {
    const isOwn = selectedMessage.sender_id === profile?.id;
    const otherName = isOwn ? selectedMessage.receiver_name : selectedMessage.sender_name;
    const otherRole = isOwn ? selectedMessage.receiver_role : selectedMessage.sender_role;

    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedMessage(null)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kthehu te mesazhet
        </button>

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRoleAvatarColor(otherRole)} flex items-center justify-center text-white font-bold text-lg`}>
                  {otherName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedMessage.subject}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-slate-600">
                      {isOwn ? 'Derguar te' : 'Nga'}: {otherName}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(otherRole)}`}>
                      {ROLE_LABELS[otherRole]}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(selectedMessage.created_at)}
                </span>
                {isOwn && (
                  <button
                    onClick={() => handleDelete(selectedMessage.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedMessage.content}</p>
          </div>
          {!isOwn && (
            <div className="px-6 pb-6">
              <button
                onClick={() => {
                  setSelectedMessage(null);
                  setShowCompose(true);
                  const contact = contacts.find(c => c.id === selectedMessage.sender_id);
                  if (!contact) {
                    const newContact: ContactItem = {
                      id: selectedMessage.sender_id,
                      full_name: selectedMessage.sender_name,
                      role: selectedMessage.sender_role,
                      email: '',
                    };
                    setContacts(prev => [...prev, newContact]);
                    setSelectedContact(newContact);
                  } else {
                    setSelectedContact(contact);
                  }
                  setMsgSubject(`Re: ${selectedMessage.subject}`);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                <Send className="w-4 h-4" />
                Pergjigju
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mesazhet</h1>
          <p className="text-slate-500 mt-1">Komunikoni me stafin dhe nxenesit</p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/25"
        >
          <Plus className="w-4 h-4" />
          Mesazh i Ri
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('inbox')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'inbox' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Te marra
          {unreadCount > 0 && (
            <span className="ml-1 bg-rose-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'sent' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Send className="w-4 h-4" />
          Te derguara
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {tab === 'inbox' ? 'Nuk ka mesazhe te marra' : 'Nuk ka mesazhe te derguara'}
          </h3>
          <p className="text-slate-500 text-sm">
            {tab === 'inbox' ? 'Kutia juaj e mesazheve eshte bosh.' : 'Nuk keni derguar asnje mesazh ende.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
          {messages.map((msg) => {
            const isOwn = msg.sender_id === profile?.id;
            const otherName = isOwn ? msg.receiver_name : msg.sender_name;
            const otherRole = isOwn ? msg.receiver_role : msg.sender_role;

            return (
              <button
                key={msg.id}
                onClick={() => openMessage(msg)}
                className={`w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors ${
                  !msg.is_read && !isOwn ? 'bg-blue-50/40' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getRoleAvatarColor(otherRole)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {otherName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${!msg.is_read && !isOwn ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {otherName}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getRoleColor(otherRole)}`}>
                      {ROLE_LABELS[otherRole]}
                    </span>
                  </div>
                  <p className={`text-sm truncate mt-0.5 ${!msg.is_read && !isOwn ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                    {msg.subject}
                  </p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{msg.content}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs text-slate-400">{formatTime(msg.created_at)}</span>
                  {!msg.is_read && !isOwn ? (
                    <Mail className="w-4 h-4 text-blue-500" />
                  ) : (
                    <MailOpen className="w-4 h-4 text-slate-300" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showCompose && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">Mesazh i Ri</h3>
              <button onClick={closeCompose} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSend} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-slate-700 mb-1">Merruesi</label>
                {selectedContact ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getRoleAvatarColor(selectedContact.role)} flex items-center justify-center text-white text-xs font-bold`}>
                      {selectedContact.full_name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-slate-900 flex-1">{selectedContact.full_name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${getRoleColor(selectedContact.role)}`}>
                      {ROLE_LABELS[selectedContact.role]}
                    </span>
                    <button type="button" onClick={() => setSelectedContact(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex items-center px-4 py-2.5 border border-slate-200 rounded-xl">
                      <Search className="w-4 h-4 text-slate-400 mr-2" />
                      <input
                        type="text"
                        value={contactSearch}
                        onChange={(e) => { setContactSearch(e.target.value); setShowContactDropdown(true); }}
                        onFocus={() => setShowContactDropdown(true)}
                        placeholder="Kerko kontakt..."
                        className="flex-1 outline-none text-sm"
                      />
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>
                    {showContactDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredContacts.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-slate-400">Nuk u gjet asnje kontakt</div>
                        ) : (
                          filteredContacts.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => { setSelectedContact(c); setShowContactDropdown(false); setContactSearch(''); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                            >
                              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getRoleAvatarColor(c.role)} flex items-center justify-center text-white text-xs font-bold`}>
                                {c.full_name.charAt(0)}
                              </div>
                              <div className="flex-1 text-left">
                                <p className="text-sm font-medium text-slate-900">{c.full_name}</p>
                              </div>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getRoleColor(c.role)}`}>
                                {ROLE_LABELS[c.role]}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tema</label>
                <input
                  type="text"
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mesazhi</label>
                <textarea
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none text-sm resize-none"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCompose}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Anullo
                </button>
                <button
                  type="submit"
                  disabled={sending || !selectedContact}
                  className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Dergo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
