import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types/database';
import { Search, Mail, Phone, BookOpen, MoreVertical, Plus, CreditCard as Edit2, Trash2, X, UserPlus, Loader2, Link2, Copy, Check as CheckIcon } from 'lucide-react';

interface TeacherFormData {
  full_name: string;
  email: string;
  phone: string;
}

interface ClassOption { id: string; name: string; }
interface SubjectOption { id: string; name: string; }
interface Assignment { id: string; class_name: string; subject_name: string; class_id: string; subject_id: string; }

interface TeacherWithAssignments extends Profile {
  assignments: Assignment[];
}

function generateSecurePassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const special = '!@#$';
  const arr = new Uint8Array(10);
  crypto.getRandomValues(arr);
  let pwd = Array.from(arr).map(n => chars[n % chars.length]).join('');
  return pwd.slice(0, 7) + special[arr[0] % special.length] + (arr[1] % 9 + 1);
}

export default function ManageTeachers() {
  const [teachers, setTeachers] = useState<TeacherWithAssignments[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherWithAssignments | null>(null);
  const [formData, setFormData] = useState<TeacherFormData>({ full_name: '', email: '', phone: '' });
  const [assignClassId, setAssignClassId] = useState('');
  const [assignSubjectId, setAssignSubjectId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    await Promise.all([loadTeachers(), loadClassesAndSubjects()]);
    setLoading(false);
  };

  const loadClassesAndSubjects = async () => {
    const [{ data: c }, { data: s }] = await Promise.all([
      supabase.from('classes').select('id, name').order('grade_level').order('section'),
      supabase.from('subjects').select('id, name').order('name'),
    ]);
    setClasses(c || []);
    setSubjects(s || []);
  };

  const loadTeachers = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'mesues')
      .order('full_name');

    if (!profiles || profiles.length === 0) {
      setTeachers([]);
      return;
    }

    const { data: allAssignments } = await supabase
      .from('class_subjects')
      .select('id, teacher_id, class_id, subject_id, classes(name), subjects(name)');

    const assignmentMap = new Map<string, Assignment[]>();
    allAssignments?.forEach((a: any) => {
      const list = assignmentMap.get(a.teacher_id) || [];
      list.push({
        id: a.id,
        class_name: a.classes?.name || '',
        subject_name: a.subjects?.name || '',
        class_id: a.class_id,
        subject_id: a.subject_id,
      });
      assignmentMap.set(a.teacher_id, list);
    });

    setTeachers(profiles.map((p) => ({
      ...p,
      assignments: assignmentMap.get(p.id) || [],
    })));
  };

  const handleCopy = async () => {
    if (!newCredentials) return;
    await navigator.clipboard.writeText(`Email: ${newCredentials.email}\nFjalekalimi: ${newCredentials.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const tempPassword = generateSecurePassword();

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email, password: tempPassword,
    });

    if (signUpError) { alert('Gabim: ' + signUpError.message); setSubmitting(false); return; }

    if (authData.user) {
      const { error } = await supabase.from('profiles').insert({
        id: authData.user.id, email: formData.email, full_name: formData.full_name, phone: formData.phone, role: 'mesues',
      });
      if (error) { alert('Gabim: ' + error.message); }
      else {
        setShowAddModal(false);
        setFormData({ full_name: '', email: '', phone: '' });
        setNewCredentials({ email: formData.email, password: tempPassword });
        setShowCredentials(true);
        loadTeachers();
      }
    }
    setSubmitting(false);
  };

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    setSubmitting(true);
    const { error } = await supabase.from('profiles')
      .update({ full_name: formData.full_name, phone: formData.phone })
      .eq('id', selectedTeacher.id);
    if (error) { alert('Gabim: ' + error.message); }
    else { setShowEditModal(false); loadTeachers(); }
    setSubmitting(false);
  };

  const handleDeleteTeacher = async (teacher: TeacherWithAssignments) => {
    if (!confirm(`Fshij mesuesin: ${teacher.full_name}?`)) return;
    const { error: csErr } = await supabase.from('class_subjects').delete().eq('teacher_id', teacher.id);
    if (csErr) { alert('Gabim: ' + csErr.message); return; }
    const { error: schErr } = await supabase.from('schedule').delete().eq('teacher_id', teacher.id);
    if (schErr) { alert('Gabim: ' + schErr.message); return; }
    const { error } = await supabase.from('profiles').delete().eq('id', teacher.id);
    if (error) alert('Gabim: ' + error.message);
    else loadTeachers();
    setActiveDropdown(null);
  };

  const handleAssign = async () => {
    if (!selectedTeacher || !assignClassId || !assignSubjectId) return;
    setSubmitting(true);

    const existing = selectedTeacher.assignments.find(
      a => a.class_id === assignClassId && a.subject_id === assignSubjectId
    );
    if (existing) { alert('Ky caktim ekziston tashme!'); setSubmitting(false); return; }

    const { error } = await supabase.from('class_subjects').insert({
      class_id: assignClassId, subject_id: assignSubjectId, teacher_id: selectedTeacher.id,
    });
    if (error) alert('Gabim: ' + error.message);
    else {
      setAssignClassId('');
      setAssignSubjectId('');
      loadTeachers();
    }
    setSubmitting(false);
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    await supabase.from('class_subjects').delete().eq('id', assignmentId);
    loadTeachers();
  };

  const openEditModal = (t: TeacherWithAssignments) => {
    setSelectedTeacher(t);
    setFormData({ full_name: t.full_name, email: t.email, phone: t.phone || '' });
    setShowEditModal(true);
    setActiveDropdown(null);
  };

  const openAssignModal = (t: TeacherWithAssignments) => {
    setSelectedTeacher(t);
    setAssignClassId('');
    setAssignSubjectId('');
    setShowAssignModal(true);
    setActiveDropdown(null);
  };

  const filtered = teachers.filter((t) =>
    t.full_name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mesuesit</h1>
          <p className="text-slate-500 mt-1">{teachers.length} mesues gjithsej</p>
        </div>
        <button
          onClick={() => { setFormData({ full_name: '', email: '', phone: '' }); setShowAddModal(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-teal-600/25"
        >
          <Plus className="w-5 h-5" />
          Shto Mesues
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kerkoni mesues..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Nuk ka mesues</h3>
          <p className="text-slate-500">Shtoni mesuesin e pare duke klikuar "Shto Mesues"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((teacher) => (
            <div key={teacher.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {teacher.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{teacher.full_name}</h3>
                    <p className="text-sm text-slate-500">{teacher.email}</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === teacher.id ? null : teacher.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {activeDropdown === teacher.id && (
                    <div className="absolute right-0 top-8 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-10">
                      <button onClick={() => openAssignModal(teacher)} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                        <Link2 className="w-4 h-4" /> Cakto Lende/Klase
                      </button>
                      <button onClick={() => openEditModal(teacher)} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                        <Edit2 className="w-4 h-4" /> Edito
                      </button>
                      <button onClick={() => handleDeleteTeacher(teacher)} className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                        <Trash2 className="w-4 h-4" /> Fshi
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {teacher.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {teacher.phone}
                  </div>
                )}
                {teacher.assignments.length > 0 ? (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs font-medium text-slate-500 mb-2">Lendet e caktuara:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {teacher.assignments.map((a) => (
                        <span key={a.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-teal-50 text-teal-700 border border-teal-100">
                          <BookOpen className="w-3 h-3" />
                          {a.class_name} - {a.subject_name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">Nuk ka lende te caktuara</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-teal-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Shto Mesues te Ri</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Emri i Plote</label>
                <input type="text" required value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Emri Mbiemri" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="email@shkolla.al" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="+383 44 123 456" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Duke shtuar...' : 'Shto Mesues'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Edito Mesuesin</h2>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditTeacher} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Emri i Plote</label>
                <input type="text" required value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" disabled value={formData.email} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Duke ruajtur...' : 'Ruaj'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCredentials && newCredentials && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Kredencialet e Reja</h2>
              <button onClick={() => setShowCredentials(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-800 font-medium mb-1">Ruajeni kete fjalekalim tani!</p>
              <p className="text-xs text-amber-700">Ky fjalekalim nuk do te shfaqet perseri. Ndajeni me msuesi ne menyre te sigurte.</p>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Email</p>
                <p className="text-sm font-mono bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">{newCredentials.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Fjalekalimi</p>
                <p className="text-sm font-mono bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 tracking-widest">{newCredentials.password}</p>
              </div>
            </div>
            <button
              onClick={handleCopy}
              className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                copied ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {copied ? <CheckIcon className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'U kopjua!' : 'Kopjo Kredencialet'}
            </button>
          </div>
        </div>
      )}

      {showAssignModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Cakto Lende</h2>
                  <p className="text-sm text-slate-500">{selectedTeacher.full_name}</p>
                </div>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedTeacher.assignments.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-slate-700 mb-3">Caktimet aktuale:</p>
                <div className="space-y-2">
                  {selectedTeacher.assignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-teal-600" />
                        <span className="text-sm font-medium text-slate-900">{a.class_name}</span>
                        <span className="text-slate-400">-</span>
                        <span className="text-sm text-slate-600">{a.subject_name}</span>
                      </div>
                      <button onClick={() => handleRemoveAssignment(a.id)} className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-medium text-slate-700 mb-3">Shto caktim te ri:</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <select value={assignClassId} onChange={(e) => setAssignClassId(e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                  <option value="">Zgjidhni klasen</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={assignSubjectId} onChange={(e) => setAssignSubjectId(e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                  <option value="">Zgjidhni lenden</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <button onClick={handleAssign} disabled={!assignClassId || !assignSubjectId || submitting}
                className="mt-3 w-full px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <Plus className="w-4 h-4" /> Shto Caktim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
