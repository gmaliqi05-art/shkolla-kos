import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Profile, Gender, EnrollmentStatus } from '../../types/database';
import { GENDER_LABELS, ENROLLMENT_STATUS_LABELS } from '../../types/database';
import { Search, Mail, Plus, CreditCard as Edit2, Trash2, X, UserPlus, MoreVertical, Phone, Loader2, BookOpen, Copy, Check as CheckIcon } from 'lucide-react';

function generateSecurePassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const special = '!@#$';
  const arr = new Uint8Array(10);
  crypto.getRandomValues(arr);
  const pwd = Array.from(arr).map(n => chars[n % chars.length]).join('');
  return pwd.slice(0, 7) + special[arr[0] % special.length] + (arr[1] % 9 + 1);
}

interface StudentFormData {
  full_name: string;
  email: string;
  phone: string;
  class_id: string;
  personal_number: string;
  date_of_birth: string;
  place_of_birth: string;
  address: string;
  gender: Gender | '';
  nationality: string;
  mother_tongue: string;
  legal_guardian_name: string;
  legal_guardian_relation: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  medical_conditions: string;
  family_doctor: string;
  enrollment_status: EnrollmentStatus;
}

const emptyFormData: StudentFormData = {
  full_name: '',
  email: '',
  phone: '',
  class_id: '',
  personal_number: '',
  date_of_birth: '',
  place_of_birth: '',
  address: '',
  gender: '',
  nationality: '',
  mother_tongue: 'shqip',
  legal_guardian_name: '',
  legal_guardian_relation: 'prind',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relation: '',
  medical_conditions: '',
  family_doctor: '',
  enrollment_status: 'regjistruar',
};

interface ClassOption {
  id: string;
  name: string;
}

interface StudentWithClass extends Profile {
  class_name?: string;
  class_id?: string;
}

export default function ManageStudents() {
  const [students, setStudents] = useState<StudentWithClass[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithClass | null>(null);
  const [formData, setFormData] = useState<StudentFormData>({ ...emptyFormData });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadStudents(), loadClasses()]);
    setLoading(false);
  };

  const loadClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('id, name')
      .order('grade_level')
      .order('section');
    setClasses(data || []);
  };

  const loadStudents = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'nxenes')
      .order('full_name');

    if (!profiles || profiles.length === 0) {
      setStudents([]);
      return;
    }

    const { data: enrollments } = await supabase
      .from('student_classes')
      .select('student_id, class_id, classes(name)');

    const enrollMap = new Map<string, { class_id: string; class_name: string }>();
    enrollments?.forEach((e: any) => {
      enrollMap.set(e.student_id, {
        class_id: e.class_id,
        class_name: e.classes?.name || '',
      });
    });

    const studentsWithClass = profiles.map((p) => ({
      ...p,
      class_name: enrollMap.get(p.id)?.class_name || '',
      class_id: enrollMap.get(p.id)?.class_id || '',
    }));

    setStudents(studentsWithClass);
  };

  const handleCopy = async () => {
    if (!newCredentials) return;
    await navigator.clipboard.writeText(`Email: ${newCredentials.email}\nFjalekalimi: ${newCredentials.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const validateForm = (): string | null => {
    if (formData.personal_number && !/^[0-9]{10}$/.test(formData.personal_number)) {
      return 'Numri personal duhet të jetë saktësisht 10 shifra.';
    }
    if (!formData.date_of_birth) {
      return 'Datëlindja është e detyrueshme për Amzën.';
    }
    if (!formData.gender) {
      return 'Gjinia është e detyrueshme.';
    }
    if (!formData.legal_guardian_name.trim()) {
      return 'Emri i kujdestarit ligjor është i detyrueshëm.';
    }
    if (!formData.emergency_contact_name.trim() || !formData.emergency_contact_phone.trim()) {
      return 'Kontakti emergjent (emri dhe telefoni) është i detyrueshëm.';
    }
    return null;
  };

  const buildProfilePayload = () => ({
    email: formData.email,
    full_name: formData.full_name,
    phone: formData.phone,
    personal_number: formData.personal_number || null,
    date_of_birth: formData.date_of_birth || null,
    place_of_birth: formData.place_of_birth,
    address: formData.address,
    gender: formData.gender || null,
    nationality: formData.nationality,
    mother_tongue: formData.mother_tongue || 'shqip',
    legal_guardian_name: formData.legal_guardian_name,
    legal_guardian_relation: formData.legal_guardian_relation,
    emergency_contact_name: formData.emergency_contact_name,
    emergency_contact_phone: formData.emergency_contact_phone,
    emergency_contact_relation: formData.emergency_contact_relation,
    medical_conditions: formData.medical_conditions,
    family_doctor: formData.family_doctor,
    enrollment_status: formData.enrollment_status,
  });

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setSubmitting(true);

    const tempPassword = generateSecurePassword();

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: tempPassword,
    });

    if (signUpError) {
      setFormError('Gabim: ' + signUpError.message);
      setSubmitting(false);
      return;
    }

    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        role: 'nxenes',
        ...buildProfilePayload(),
      });

      if (profileError) {
        setFormError('Gabim profili: ' + profileError.message);
        setSubmitting(false);
        return;
      }

      if (formData.class_id) {
        await supabase.from('student_classes').insert({
          student_id: authData.user.id,
          class_id: formData.class_id,
        });
      }

      setShowAddModal(false);
      setFormData({ ...emptyFormData });
      setNewCredentials({ email: formData.email, password: tempPassword });
      setShowCredentials(true);
      loadStudents();
    }

    setSubmitting(false);
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setFormError('');
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setSubmitting(true);

    const { email: _email, ...updatePayload } = buildProfilePayload();
    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', selectedStudent.id);

    if (error) {
      setFormError('Gabim: ' + error.message);
      setSubmitting(false);
      return;
    }

    if (formData.class_id !== selectedStudent.class_id) {
      await supabase.from('student_classes').delete().eq('student_id', selectedStudent.id);
      if (formData.class_id) {
        await supabase.from('student_classes').insert({
          student_id: selectedStudent.id,
          class_id: formData.class_id,
        });
      }
    }

    setShowEditModal(false);
    setSelectedStudent(null);
    setFormData({ ...emptyFormData });
    loadStudents();
    setSubmitting(false);
  };

  const handleDeleteStudent = async (student: StudentWithClass) => {
    if (!confirm(`Fshij nxenesin: ${student.full_name}?`)) return;

    await supabase.from('messages').delete().or(`sender_id.eq.${student.id},receiver_id.eq.${student.id}`);
    await supabase.from('parent_students').delete().eq('student_id', student.id);
    await supabase.from('student_classes').delete().eq('student_id', student.id);
    await supabase.from('grades').delete().eq('student_id', student.id);
    await supabase.from('attendance').delete().eq('student_id', student.id);
    await supabase.from('messages').delete().eq('sender_id', student.id);
    await supabase.from('messages').delete().eq('receiver_id', student.id);
    await supabase.from('parent_students').delete().eq('student_id', student.id);

    const { error } = await supabase.from('profiles').delete().eq('id', student.id);
    if (error) {
      alert('Gabim: ' + error.message);
      return;
    }

    loadStudents();
    setActiveDropdown(null);
  };

  const openEditModal = (student: StudentWithClass) => {
    setSelectedStudent(student);
    setFormError('');
    setFormData({
      full_name: student.full_name,
      email: student.email,
      phone: student.phone || '',
      class_id: student.class_id || '',
      personal_number: student.personal_number || '',
      date_of_birth: student.date_of_birth || '',
      place_of_birth: student.place_of_birth || '',
      address: student.address || '',
      gender: student.gender || '',
      nationality: student.nationality || '',
      mother_tongue: student.mother_tongue || 'shqip',
      legal_guardian_name: student.legal_guardian_name || '',
      legal_guardian_relation: student.legal_guardian_relation || 'prind',
      emergency_contact_name: student.emergency_contact_name || '',
      emergency_contact_phone: student.emergency_contact_phone || '',
      emergency_contact_relation: student.emergency_contact_relation || '',
      medical_conditions: student.medical_conditions || '',
      family_doctor: student.family_doctor || '',
      enrollment_status: student.enrollment_status || 'regjistruar',
    });
    setShowEditModal(true);
    setActiveDropdown(null);
  };

  const filtered = students.filter((s) => {
    const matchSearch =
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchClass = !filterClass || s.class_id === filterClass;
    return matchSearch && matchClass;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nxenesit</h1>
          <p className="text-slate-500 mt-1">{students.length} nxenes gjithsej</p>
        </div>
        <button
          onClick={() => {
            setFormData({ ...emptyFormData });
            setFormError('');
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/25"
        >
          <Plus className="w-5 h-5" />
          Shto Nxenes
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kerkoni nxenes..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
        </div>
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Te gjitha klasat</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nxenesi</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Klasa</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Telefon</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Veprime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    {students.length === 0 ? 'Shtoni nxenesin e pare duke klikuar "Shto Nxenes"' : 'Nuk u gjet asnje rezultat'}
                  </td>
                </tr>
              ) : (
                filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center text-white text-sm font-bold">
                          {student.full_name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-900">{student.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Mail className="w-4 h-4" />
                        {student.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {student.class_name ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          <BookOpen className="w-3 h-3" />
                          {student.class_name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Pa klase</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {student.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {student.phone}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === student.id ? null : student.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeDropdown === student.id && (
                          <div className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-10">
                            <button
                              onClick={() => openEditModal(student)}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edito
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student)}
                              className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Fshi
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
              <p className="text-xs text-amber-700">Ky fjalekalim nuk do te shfaqet perseri. Ndajeni me nxenesin ne menyre te sigurte.</p>
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

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${showAddModal ? 'bg-blue-100' : 'bg-cyan-100'} rounded-xl flex items-center justify-center`}>
                  {showAddModal ? <UserPlus className="w-5 h-5 text-blue-600" /> : <Edit2 className="w-5 h-5 text-cyan-600" />}
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {showAddModal ? 'Shto Nxenes te Ri' : 'Edito Nxenesin'}
                </h2>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setShowEditModal(false); setFormError(''); }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleAddStudent : handleEditStudent} className="space-y-6">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
                  {formError}
                </div>
              )}

              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                  Të dhënat bazike
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Emri i Plotë *</label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Emri Mbiemri"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required={showAddModal}
                      disabled={showEditModal}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none ${showEditModal ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`}
                      placeholder="email@shkolla.al"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="+383 44 123 456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Klasa</label>
                    <select
                      value={formData.class_id}
                      onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Pa klasë</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Statusi i regjistrimit</label>
                    <select
                      value={formData.enrollment_status}
                      onChange={(e) => setFormData({ ...formData, enrollment_status: e.target.value as EnrollmentStatus })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {(Object.keys(ENROLLMENT_STATUS_LABELS) as EnrollmentStatus[]).map((s) => (
                        <option key={s} value={s}>{ENROLLMENT_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                  Të dhënat e Amzës (UA 19/2018)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Numri Personal (10 shifra)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      value={formData.personal_number}
                      onChange={(e) => setFormData({ ...formData, personal_number: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                      placeholder="1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Datëlindja *</label>
                    <input
                      type="date"
                      required
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vendlindja</label>
                    <input
                      type="text"
                      value={formData.place_of_birth}
                      onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Prishtinë"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Gjinia *</label>
                    <select
                      required
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">— Zgjidh —</option>
                      {(Object.keys(GENDER_LABELS) as Gender[]).map((g) => (
                        <option key={g} value={g}>{GENDER_LABELS[g]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kombësia (vetëdeklarim)</label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Shqiptar/Serb/Turk/Boshnjak/Rom/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Gjuha amtare</label>
                    <input
                      type="text"
                      value={formData.mother_tongue}
                      onChange={(e) => setFormData({ ...formData, mother_tongue: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="shqip"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Adresa</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Rruga, qyteti, kodi postar"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                  Kujdestari ligjor *
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Emri i kujdestarit *</label>
                    <input
                      type="text"
                      required
                      value={formData.legal_guardian_name}
                      onChange={(e) => setFormData({ ...formData, legal_guardian_name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lidhja</label>
                    <select
                      value={formData.legal_guardian_relation}
                      onChange={(e) => setFormData({ ...formData, legal_guardian_relation: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="prind">Prind</option>
                      <option value="nene">Nënë</option>
                      <option value="baba">Baba</option>
                      <option value="gjyshe">Gjyshe</option>
                      <option value="gjysh">Gjysh</option>
                      <option value="tjeter">Tjetër kujdestar ligjor</option>
                    </select>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                  Kontakt emergjent *
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Emri *</label>
                    <input
                      type="text"
                      required
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefon *</label>
                    <input
                      type="tel"
                      required
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                      placeholder="+383 44 123 456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lidhja</label>
                    <input
                      type="text"
                      value={formData.emergency_contact_relation}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                      placeholder="Prind, gjysh, ..."
                    />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-rose-500 rounded-full"></span>
                  Informacion shëndetësor (opsional)
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Alergji / Kushte mjekësore</label>
                    <textarea
                      rows={2}
                      value={formData.medical_conditions}
                      onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                      placeholder="Astma, alergji ndaj polenit, etj."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mjeku familjar</label>
                    <input
                      type="text"
                      value={formData.family_doctor}
                      onChange={(e) => setFormData({ ...formData, family_doctor: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                      placeholder="Dr. Emri / Klinika"
                    />
                  </div>
                </div>
              </section>

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t border-slate-100 -mx-6 px-6 -mb-6 pb-6">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); setFormError(''); }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors"
                >
                  Anulo
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 px-4 py-2.5 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${showAddModal ? 'bg-blue-600 hover:bg-blue-700' : 'bg-cyan-600 hover:bg-cyan-700'}`}
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Duke ruajtur...' : showAddModal ? 'Shto Nxenes' : 'Ruaj'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
