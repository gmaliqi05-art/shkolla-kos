import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-slate-200 mb-4">404</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Faqja nuk u gjet</h1>
        <p className="text-slate-500 mb-8">
          Faqja qe po kerkoni nuk ekziston ose eshte zhvendosur.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kthehu mbrapa
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-900 text-white rounded-xl text-sm font-medium hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/25"
          >
            <Home className="w-4 h-4" />
            Faqja Kryesore
          </Link>
        </div>
      </div>
    </div>
  );
}
