import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  BOOK_CATEGORY_LABELS,
  BOOK_LOAN_STATUS_LABELS,
  BOOK_LOAN_STATUS_COLORS,
  type BookCategory,
  type LibraryBook,
  type BookLoan,
  type BookLoanStatus,
} from '../../types/database';
import { Loader2, Plus, X, BookOpen, Library, Search, Edit2, Trash2, ArrowRight } from 'lucide-react';

type Tab = 'books' | 'loans';

interface LoanRow extends BookLoan {
  book_title?: string;
  borrower_name?: string;
}

export default function LibraryPage() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('books');
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [students, setStudents] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<BookCategory | ''>('');
  const [filterStatus, setFilterStatus] = useState<BookLoanStatus | ''>('aktive');

  const [showBookModal, setShowBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState<LibraryBook | null>(null);
  const [showLoanModal, setShowLoanModal] = useState<LibraryBook | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [bookForm, setBookForm] = useState({
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    publication_year: '',
    category: 'letersi' as BookCategory,
    language: 'sq',
    copies_total: '1',
    location: '',
    description: '',
  });

  const [loanForm, setLoanForm] = useState({
    borrower_id: '',
    loan_date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    notes: '',
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const [booksRes, loansRes, studentsRes] = await Promise.all([
      supabase.from('library_books').select('*').order('title'),
      supabase.from('book_loans').select('*').order('loan_date', { ascending: false }),
      supabase.from('profiles').select('id, full_name').in('role', ['nxenes', 'mesues']).is('deleted_at', null).order('full_name'),
    ]);
    setBooks(booksRes.data || []);
    setStudents(studentsRes.data || []);

    const loansList: BookLoan[] = loansRes.data || [];
    if (loansList.length > 0) {
      const bookIds = Array.from(new Set(loansList.map((l) => l.book_id)));
      const borrowerIds = Array.from(new Set(loansList.map((l) => l.borrower_id)));
      const [b, p] = await Promise.all([
        supabase.from('library_books').select('id, title').in('id', bookIds),
        supabase.from('profiles').select('id, full_name').in('id', borrowerIds),
      ]);
      const bMap = new Map((b.data || []).map((x) => [x.id, x.title]));
      const pMap = new Map((p.data || []).map((x) => [x.id, x.full_name]));
      setLoans(loansList.map((l) => ({
        ...l,
        book_title: bMap.get(l.book_id),
        borrower_name: pMap.get(l.borrower_id),
      })));
    } else {
      setLoans([]);
    }
    setLoading(false);
  };

  const openNewBook = () => {
    setEditingBook(null);
    setBookForm({
      isbn: '', title: '', author: '', publisher: '', publication_year: '',
      category: 'letersi', language: 'sq', copies_total: '1', location: '', description: '',
    });
    setError('');
    setShowBookModal(true);
  };

  const openEditBook = (b: LibraryBook) => {
    setEditingBook(b);
    setBookForm({
      isbn: b.isbn || '',
      title: b.title,
      author: b.author,
      publisher: b.publisher,
      publication_year: b.publication_year ? String(b.publication_year) : '',
      category: b.category,
      language: b.language,
      copies_total: String(b.copies_total),
      location: b.location,
      description: b.description,
    });
    setError('');
    setShowBookModal(true);
  };

  const saveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const copiesTotal = Number(bookForm.copies_total);
    const payload = {
      isbn: bookForm.isbn || null,
      title: bookForm.title,
      author: bookForm.author,
      publisher: bookForm.publisher,
      publication_year: bookForm.publication_year ? Number(bookForm.publication_year) : null,
      category: bookForm.category,
      language: bookForm.language,
      copies_total: copiesTotal,
      ...(editingBook ? {} : { copies_available: copiesTotal }),
      location: bookForm.location,
      description: bookForm.description,
    };
    const res = editingBook
      ? await supabase.from('library_books').update(payload).eq('id', editingBook.id)
      : await supabase.from('library_books').insert(payload);
    if (res.error) {
      setError(res.error.message);
    } else {
      setShowBookModal(false);
      load();
    }
    setSubmitting(false);
  };

  const removeBook = async (id: string) => {
    if (!confirm('Fshij këtë libër? Huazimet aktive duhet të kthehen së pari.')) return;
    const { error } = await supabase.from('library_books').delete().eq('id', id);
    if (error) alert('Gabim: ' + error.message);
    else load();
  };

  const openLoan = (b: LibraryBook) => {
    setShowLoanModal(b);
    setLoanForm({
      borrower_id: '',
      loan_date: new Date().toISOString().slice(0, 10),
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      notes: '',
    });
    setError('');
  };

  const submitLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showLoanModal || !profile) return;
    setSubmitting(true);
    setError('');
    const { error: err } = await supabase.from('book_loans').insert({
      book_id: showLoanModal.id,
      borrower_id: loanForm.borrower_id,
      loan_date: loanForm.loan_date,
      due_date: loanForm.due_date,
      notes: loanForm.notes,
      issued_by: profile.id,
    });
    if (err) {
      setError(err.message);
    } else {
      setShowLoanModal(null);
      load();
    }
    setSubmitting(false);
  };

  const returnLoan = async (loan: LoanRow) => {
    if (!confirm(`Kthe librin "${loan.book_title}"?`)) return;
    await supabase.from('book_loans').update({
      status: 'kthyer',
      returned_date: new Date().toISOString().slice(0, 10),
    }).eq('id', loan.id);
    load();
  };

  const markLost = async (loan: LoanRow) => {
    if (!confirm('Shëno këtë libër si të humbur?')) return;
    await supabase.from('book_loans').update({ status: 'humbur' }).eq('id', loan.id);
    load();
  };

  const filteredBooks = books.filter((b) => {
    if (filterCategory && b.category !== filterCategory) return false;
    if (search) {
      const t = search.toLowerCase();
      if (!b.title.toLowerCase().includes(t) && !b.author.toLowerCase().includes(t) && !(b.isbn || '').toLowerCase().includes(t)) return false;
    }
    return true;
  });

  const filteredLoans = loans.filter((l) => !filterStatus || l.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Library className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Biblioteka Shkollore</h1>
            <p className="text-slate-500 text-sm">Katalog librash dhe gjurmim huazimesh</p>
          </div>
        </div>
        {tab === 'books' && (
          <button onClick={openNewBook} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium">
            <Plus className="w-4 h-4" />
            Shto Libër
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab('books')}
          className={`px-4 py-2 -mb-px border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
            tab === 'books' ? 'border-indigo-500 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Librat ({books.length})
        </button>
        <button
          onClick={() => setTab('loans')}
          className={`px-4 py-2 -mb-px border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
            tab === 'loans' ? 'border-indigo-500 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
          Huazimet ({loans.length})
        </button>
      </div>

      {tab === 'books' && (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Kërko titull, autor ose ISBN..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as BookCategory | '')} className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Të gjitha kategoritë</option>
              {(Object.keys(BOOK_CATEGORY_LABELS) as BookCategory[]).map((c) => (
                <option key={c} value={c}>{BOOK_CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {filteredBooks.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-400 text-sm">
                {books.length === 0 ? 'Asnjë libër në katalog. Shto librin e parë.' : 'Asnjë libër me filtrat e zgjedhur.'}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase">
                    <th className="px-4 py-2">Titulli & Autori</th>
                    <th className="px-4 py-2">Kategoria</th>
                    <th className="px-4 py-2">ISBN</th>
                    <th className="px-4 py-2 text-center">Kopje</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBooks.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <p className="font-medium text-slate-900">{b.title}</p>
                        {b.author && <p className="text-xs text-slate-500">{b.author}</p>}
                      </td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700">
                          {BOOK_CATEGORY_LABELS[b.category]}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-slate-600">{b.isbn || '—'}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`font-semibold ${b.copies_available === 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {b.copies_available} / {b.copies_total}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="inline-flex gap-1">
                          {b.copies_available > 0 && (
                            <button onClick={() => openLoan(b)} className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded">
                              Huazo
                            </button>
                          )}
                          <button onClick={() => openEditBook(b)} className="p-1.5 text-slate-400 hover:text-slate-700">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => removeBook(b.id)} className="p-1.5 text-slate-400 hover:text-rose-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === 'loans' && (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-2">
            <button onClick={() => setFilterStatus('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterStatus === '' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              Të gjitha ({loans.length})
            </button>
            {(Object.keys(BOOK_LOAN_STATUS_LABELS) as BookLoanStatus[]).map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterStatus === s ? BOOK_LOAN_STATUS_COLORS[s] : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                {BOOK_LOAN_STATUS_LABELS[s]} ({loans.filter((l) => l.status === s).length})
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {filteredLoans.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-400 text-sm">Asnjë huazim.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase">
                    <th className="px-4 py-2">Libri</th>
                    <th className="px-4 py-2">Huazues</th>
                    <th className="px-4 py-2">Marrë</th>
                    <th className="px-4 py-2">Dorëzimi</th>
                    <th className="px-4 py-2">Statusi</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLoans.map((l) => {
                    const overdue = l.status === 'aktive' && new Date(l.due_date) < new Date();
                    return (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium text-slate-900">{l.book_title}</td>
                        <td className="px-4 py-2 text-slate-700">{l.borrower_name}</td>
                        <td className="px-4 py-2 text-slate-600">{l.loan_date}</td>
                        <td className={`px-4 py-2 ${overdue ? 'text-rose-600 font-semibold' : 'text-slate-600'}`}>{l.due_date}{overdue && ' ⚠'}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${BOOK_LOAN_STATUS_COLORS[l.status]}`}>
                            {BOOK_LOAN_STATUS_LABELS[l.status]}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          {l.status === 'aktive' && (
                            <div className="inline-flex gap-1">
                              <button onClick={() => returnLoan(l)} className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded">
                                Kthe
                              </button>
                              <button onClick={() => markLost(l)} className="px-2.5 py-1 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded">
                                Humbur
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* BOOK MODAL */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editingBook ? 'Edito Librin' : 'Shto Libër të Ri'}</h2>
              <button onClick={() => setShowBookModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={saveBook} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titulli *</label>
                <input required type="text" value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Autori</label>
                  <input type="text" value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Botuesi</label>
                  <input type="text" value={bookForm.publisher} onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ISBN</label>
                  <input type="text" value={bookForm.isbn} onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Viti</label>
                  <input type="number" value={bookForm.publication_year} onChange={(e) => setBookForm({ ...bookForm, publication_year: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kopje *</label>
                  <input required type="number" min="1" value={bookForm.copies_total} onChange={(e) => setBookForm({ ...bookForm, copies_total: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategoria *</label>
                  <select required value={bookForm.category} onChange={(e) => setBookForm({ ...bookForm, category: e.target.value as BookCategory })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                    {(Object.keys(BOOK_CATEGORY_LABELS) as BookCategory[]).map((c) => (
                      <option key={c} value={c}>{BOOK_CATEGORY_LABELS[c]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vendi në bibliotekë</label>
                  <input type="text" value={bookForm.location} onChange={(e) => setBookForm({ ...bookForm, location: e.target.value })} placeholder="P.sh. A-12-3" className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Përshkrimi</label>
                <textarea rows={2} value={bookForm.description} onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowBookModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Ruaj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOAN MODAL */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Huazo Librin</h2>
                <p className="text-sm text-slate-500">{showLoanModal.title}</p>
              </div>
              <button onClick={() => setShowLoanModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submitLoan} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Huazuesi *</label>
                <select required value={loanForm.borrower_id} onChange={(e) => setLoanForm({ ...loanForm, borrower_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">— Zgjidh nxënësin ose mësuesin —</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data e marrjes *</label>
                  <input required type="date" value={loanForm.loan_date} onChange={(e) => setLoanForm({ ...loanForm, loan_date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dorëzimi deri *</label>
                  <input required type="date" value={loanForm.due_date} onChange={(e) => setLoanForm({ ...loanForm, due_date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shënime</label>
                <textarea rows={2} value={loanForm.notes} onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowLoanModal(null)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Huazo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
