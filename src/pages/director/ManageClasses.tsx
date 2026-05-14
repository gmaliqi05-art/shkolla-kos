import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Class } from '../../types/database';
import { Search, Users, BookOpen, ChevronRight, Plus, CreditCard as Edit2, Trash2, X, FolderPlus, MoreVertical } from 'lucide-react';

interface ClassFormData {
  name: string;
  grade_level: number;
  section: string;
  max_students: number;
}

export default function ManageClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState<ClassFormData>({
    name: '',
    grade_level: 1,
    section: 'A',
    max_students: 30,
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('*')
      .order('grade_level')
      .order('section');
    setClasses(data || []);
    setLoading(false);
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { data: activeYear } = await supabase
      .from('academic_years')
      .select('id')
      .eq('is_active', true)
      .maybeSingle();

    const { error } = await supabase.from('classes').insert({
      name: formData.name,
      grade_level: formData.grade_level,
      section: formData.section,
      max_students: formData.max_students,
      academic_year_id: activeYear?.id ?? null,
    });

    if (error) {
      alert('Gabim gjate krijimit te klases: ' + error.message);
    } else {
      alert('Klasa u krijua me sukses!');
      setShowAddModal(false);
      setFormData({ name: '', grade_level: 1, section: 'A', max_students: 30 });
      loadClasses();
    }

    setSubmitting(false);
  };

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    setSubmitting(true);

    const { error } = await supabase
      .from('classes')
      .update({
        name: formData.name,
        grade_level: formData.grade_level,
        section: formData.section,
        max_students: formData.max_students,
      })
      .eq('id', selectedClass.id);

    if (error) {
      alert('Gabim gjate perditesimit: ' + error.message);
    } else {
      alert('Klasa u perditesua me sukses!');
      setShowEditModal(false);
      setSelectedClass(null);
      setFormData({ name: '', grade_level: 1, section: 'A', max_students: 30 });
      loadClasses();
    }

    setSubmitting(false);
  };

  const handleDeleteClass = async (cls: Class) => {
    if (!confirm(`A jeni te sigurt qe doni te fshini: ${cls.name}?`)) return;

    const { error } = await supabase.from('classes').delete().eq('id', cls.id);

    if (error) {
      alert('Gabim gjate fshirjes: ' + error.message);
    } else {
      alert('Klasa u fshi me sukses!');
      loadClasses();
    }
  };

  const openEditModal = (cls: Class) => {
    setSelectedClass(cls);
    setFormData({
      name: cls.name,
      grade_level: cls.grade_level,
      section: cls.section,
      max_students: cls.max_students,
    });
    setShowEditModal(true);
    setActiveDropdown(null);
  };

  const filtered = classes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<number, Class[]>>((acc, cls) => {
    if (!acc[cls.grade_level]) acc[cls.grade_level] = [];
    acc[cls.grade_level].push(cls);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Klasat</h1>
          <p className="text-slate-500 mt-1">Menaxhoni klasat e shkolles</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Shto Klase
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kerkoni klasa..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
        />
      </div>

      <div className="space-y-6">
        {Object.entries(grouped)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([grade, classList]) => (
            <div key={grade}>
              <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center text-sm font-bold">
                  {grade}
                </div>
                Klasa e {grade}-te
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {classList.map((cls) => (
                  <div
                    key={cls.id}
                    className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:border-amber-200 transition-all group relative"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-900">{cls.name}</h3>
                      <div className="relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === cls.id ? null : cls.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeDropdown === cls.id && (
                          <div className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-10">
                            <button
                              onClick={() => openEditModal(cls)}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edito
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteClass(cls);
                                setActiveDropdown(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Fshi
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Users className="w-4 h-4" />
                        <span>Maks {cls.max_students} nxenes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <BookOpen className="w-4 h-4" />
                        <span>Seksioni {cls.section}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Viti 2025-2026</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          Number(grade) <= 4 ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {Number(grade) <= 4 ? 'Cikli i Ulet' : 'Cikli i Larte'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <FolderPlus className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Shto Klase te Re</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Emri i Klases
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  placeholder="p.sh. Klasa 5-A"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Niveli
                  </label>
                  <select
                    value={formData.grade_level}
                    onChange={(e) => setFormData({ ...formData, grade_level: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
                      <option key={level} value={level}>Klasa {level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Seksioni
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    placeholder="A, B, C..."
                    maxLength={1}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Numri Maksimal i Nxenesve
                </label>
                <input
                  type="number"
                  required
                  min="10"
                  max="50"
                  value={formData.max_students}
                  onChange={(e) => setFormData({ ...formData, max_students: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Anulo
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Duke krijuar...' : 'Krijo Klasen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Edit2 className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Edito Klasen</h2>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Emri i Klases
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Niveli
                  </label>
                  <select
                    value={formData.grade_level}
                    onChange={(e) => setFormData({ ...formData, grade_level: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
                      <option key={level} value={level}>Klasa {level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Seksioni
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    maxLength={1}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Numri Maksimal i Nxenesve
                </label>
                <input
                  type="number"
                  required
                  min="10"
                  max="50"
                  value={formData.max_students}
                  onChange={(e) => setFormData({ ...formData, max_students: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Anulo
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Duke ruajtur...' : 'Ruaj Ndryshimet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
