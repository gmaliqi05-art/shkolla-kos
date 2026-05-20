import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  PORTFOLIO_ITEM_TYPE_LABELS,
  PORTFOLIO_ITEM_COLORS,
  type PortfolioItemType,
  type PortfolioItem,
  type StudentPortfolio,
} from '../../types/database';
import { Loader2, FolderOpen, Plus, X, Trash2, FileText } from 'lucide-react';
import FileUpload from '../../components/FileUpload';

interface StudentOption { id: string; full_name: string }
interface SubjectOption { id: string; name: string }

export default function Portfolio() {
  const { profile } = useAuth();
  const isStudent = profile?.role === 'nxenes';
  const isParent = profile?.role === 'prind';
  const isTeacher = profile?.role === 'mesues';
  const isDirector = profile?.role === 'drejtor' || profile?.role === 'pedagog';

  const [accessible, setAccessible] = useState<StudentOption[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [portfolio, setPortfolio] = useState<StudentPortfolio | null>(null);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<PortfolioItemType | ''>('');

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    item_type: 'punim' as PortfolioItemType,
    title: '',
    description: '',
    content: '',
    subject_id: '',
    attachment_url: '',
  });

  useEffect(() => {
    if (profile?.id) loadAccessible();
    loadSubjects();
  }, [profile?.id]);

  useEffect(() => {
    if (selectedStudent) loadPortfolio();
  }, [selectedStudent]);

  const loadAccessible = async () => {
    if (!profile) return;
    if (isStudent) {
      setAccessible([{ id: profile.id, full_name: profile.full_name }]);
      setSelectedStudent(profile.id);
      return;
    }
    if (isParent) {
      const { data: links } = await supabase.from('parent_students').select('student_id').eq('parent_id', profile.id);
      const ids = (links || []).map((l) => l.student_id);
      if (ids.length === 0) {
        setAccessible([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase.from('profiles').select('id, full_name').in('id', ids);
      setAccessible(data || []);
      if (data && data.length > 0) setSelectedStudent(data[0].id);
      return;
    }
    // teacher: students in their classes
    if (isTeacher) {
      const ids = new Set<string>();
      const { data: hr } = await supabase.from('classes').select('id').eq('homeroom_teacher_id', profile.id);
      const { data: cs } = await supabase.from('class_subjects').select('class_id').eq('teacher_id', profile.id);
      const classIds = [
        ...(hr || []).map((c) => c.id),
        ...(cs || []).map((c: { class_id: string }) => c.class_id),
      ];
      if (classIds.length === 0) {
        setAccessible([]);
        setLoading(false);
        return;
      }
      const { data: enrolls } = await supabase.from('student_classes').select('student_id').in('class_id', classIds);
      (enrolls || []).forEach((e) => ids.add(e.student_id));
      if (ids.size === 0) {
        setAccessible([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase.from('profiles').select('id, full_name').in('id', Array.from(ids)).is('deleted_at', null).order('full_name');
      setAccessible(data || []);
      if (data && data.length > 0) setSelectedStudent(data[0].id);
      return;
    }
    // director/pedagog: all students
    if (isDirector) {
      const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'nxenes').is('deleted_at', null).order('full_name');
      setAccessible(data || []);
      if (data && data.length > 0) setSelectedStudent(data[0].id);
    }
  };

  const loadSubjects = async () => {
    const { data } = await supabase.from('subjects').select('id, name').order('name');
    setSubjects(data || []);
  };

  const loadPortfolio = async () => {
    setLoading(true);
    // Find or create portfolio
    let { data: p } = await supabase
      .from('student_portfolios')
      .select('*')
      .eq('student_id', selectedStudent)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!p) {
      // Auto-create for self or eligible
      const canCreate = isStudent || isTeacher || isDirector;
      if (canCreate) {
        const { data: created } = await supabase
          .from('student_portfolios')
          .insert({ student_id: selectedStudent, title: 'Portofoli i Vitit' })
          .select()
          .single();
        p = created;
      }
    }

    if (p) {
      setPortfolio(p);
      const { data: itemsData } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('portfolio_id', p.id)
        .order('added_at', { ascending: false });
      setItems(itemsData || []);
    } else {
      setPortfolio(null);
      setItems([]);
    }
    setLoading(false);
  };

  const openNew = () => {
    setForm({ item_type: 'punim', title: '', description: '', content: '', subject_id: '', attachment_url: '' });
    setError('');
    setShowModal(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolio || !profile) return;
    setSubmitting(true);
    setError('');
    const { error: err } = await supabase.from('portfolio_items').insert({
      portfolio_id: portfolio.id,
      subject_id: form.subject_id || null,
      item_type: form.item_type,
      title: form.title,
      description: form.description,
      content: form.content,
      attachment_url: form.attachment_url || null,
      added_by: profile.id,
      added_by_role: profile.role,
    });
    if (err) {
      setError(err.message);
    } else {
      setShowModal(false);
      loadPortfolio();
    }
    setSubmitting(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Hiq këtë element nga portofoli?')) return;
    await supabase.from('portfolio_items').delete().eq('id', id);
    loadPortfolio();
  };

  const filtered = filterType ? items.filter((i) => i.item_type === filterType) : items;
  const canAdd = !!portfolio && (isStudent || isTeacher || isDirector);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (accessible.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        Nuk keni qasje në asnjë portofol.
      </div>
    );
  }

  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Portofoli i Nxënësit</h1>
            <p className="text-slate-500 text-sm">UA 06/2022 — koleksion punimesh dhe reflektimesh</p>
          </div>
        </div>
        {canAdd && (
          <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium">
            <Plus className="w-4 h-4" />
            Shto Element
          </button>
        )}
      </div>

      {accessible.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <label className="block text-xs font-medium text-slate-500 mb-1">Nxënësi</label>
          <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500">
            {accessible.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterType === '' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Të gjitha ({items.length})
          </button>
          {(Object.keys(PORTFOLIO_ITEM_TYPE_LABELS) as PortfolioItemType[]).map((t) => {
            const count = items.filter((i) => i.item_type === t).length;
            if (count === 0) return null;
            return (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterType === t ? PORTFOLIO_ITEM_COLORS[t] : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {PORTFOLIO_ITEM_TYPE_LABELS[t]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.length === 0 ? (
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 px-6 py-12 text-center text-slate-400 text-sm">
            Portofoli është bosh. {canAdd && 'Klik "Shto Element" për të filluar.'}
          </div>
        ) : (
          filtered.map((it) => (
            <div key={it.id} className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${PORTFOLIO_ITEM_COLORS[it.item_type]}`}>
                    {PORTFOLIO_ITEM_TYPE_LABELS[it.item_type]}
                  </span>
                  {it.subject_id && (
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                      {subjectMap.get(it.subject_id) || 'Lënda'}
                    </span>
                  )}
                </div>
                {(it.added_by === profile?.id || isDirector) && (
                  <button onClick={() => remove(it.id)} className="p-1 text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <h3 className="font-semibold text-slate-900">{it.title}</h3>
              {it.description && <p className="text-sm text-slate-600 mt-1">{it.description}</p>}
              {it.content && (
                <div className="mt-2 p-2 bg-slate-50 rounded-lg text-sm text-slate-700 whitespace-pre-wrap">{it.content}</div>
              )}
              {it.attachment_url && (
                <a href={it.attachment_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800">
                  <FileText className="w-3 h-3" />
                  Shiko bashkëngjitjen
                </a>
              )}
              <p className="text-xs text-slate-400 mt-2">
                Shtuar më: {new Date(it.added_at).toLocaleDateString('sq')}
              </p>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Shto Element në Portofol</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lloji *</label>
                  <select required value={form.item_type} onChange={(e) => setForm({ ...form, item_type: e.target.value as PortfolioItemType })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500">
                    {(Object.keys(PORTFOLIO_ITEM_TYPE_LABELS) as PortfolioItemType[]).map((t) => (
                      <option key={t} value={t}>{PORTFOLIO_ITEM_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lënda</label>
                  <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500">
                    <option value="">— Pa specifikim —</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titulli *</label>
                <input required type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Përshkrimi i shkurtër</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Përmbajtja / Reflektimi</label>
                <textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 resize-none" placeholder="Përshkruani këtë punim, çfarë mësuat, etj." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bashkëngjitja (foto, video, PDF)</label>
                <FileUpload
                  bucket="portfolio"
                  folder={profile?.id}
                  accept="image/*,video/*,application/pdf"
                  maxSizeMB={10}
                  currentUrl={form.attachment_url || null}
                  label="Ngarko bashkëngjitje"
                  onUploaded={(url) => setForm({ ...form, attachment_url: url })}
                  onRemoved={() => setForm({ ...form, attachment_url: '' })}
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Shto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
