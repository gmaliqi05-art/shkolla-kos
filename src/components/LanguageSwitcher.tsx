import { useState, useRef, useEffect } from 'react';
import { Languages, Check } from 'lucide-react';
import { useI18n } from '../lib/i18n/I18nProvider';
import { LANGUAGES, type Language } from '../lib/i18n/translations';

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm ${
          compact ? 'px-2 py-1.5' : 'px-3 py-2'
        }`}
        aria-label="Change language"
      >
        <Languages className="w-4 h-4 text-slate-500" />
        <span className="font-medium text-slate-700">{current.flag}</span>
        {!compact && <span className="text-slate-600">{current.native}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
          {LANGUAGES.map((l) => {
            const active = l.code === language;
            return (
              <button
                key={l.code}
                onClick={() => {
                  setLanguage(l.code as Language);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 ${
                  active ? 'text-blue-700 font-medium' : 'text-slate-700'
                }`}
              >
                <span className="font-mono text-xs w-7">{l.flag}</span>
                <span className="flex-1 text-left">{l.native}</span>
                {active && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
