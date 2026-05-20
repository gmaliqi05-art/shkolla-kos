import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  groupBy?: boolean;
  emptyText?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = '— Zgjidh —',
  required = false,
  disabled = false,
  className = '',
  groupBy = false,
  emptyText = 'Asnjë rezultat',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find((o) => o.value === value);
  const filtered = search
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()) ||
        (o.description?.toLowerCase().includes(search.toLowerCase()))
      )
    : options;

  // Group by 'group' field
  const grouped = new Map<string, SearchableOption[]>();
  if (groupBy) {
    filtered.forEach((o) => {
      const key = o.group || 'Të tjera';
      const list = grouped.get(key) || [];
      list.push(o);
      grouped.set(key, list);
    });
  }

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!required) onChange('');
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 border border-slate-200 rounded-xl bg-white text-left text-sm outline-none transition-colors ${
          disabled ? 'bg-slate-50 cursor-not-allowed text-slate-500' : 'hover:border-slate-300 focus:ring-2 focus:ring-blue-500'
        }`}
      >
        <span className={`flex-1 truncate ${selected ? 'text-slate-900' : 'text-slate-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selected && !required && !disabled && (
            <X onClick={handleClear} className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700" />
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-72 overflow-hidden flex flex-col">
          <div className="px-2 py-1.5 border-b border-slate-100 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Kërko..."
                className="w-full pl-7 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs text-center text-slate-400">{emptyText}</p>
            ) : groupBy ? (
              Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([group, items]) => (
                <div key={group}>
                  <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-500 bg-slate-50 sticky top-0">
                    {group} ({items.length})
                  </div>
                  {items.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => handleSelect(o.value)}
                      className={`w-full flex items-start gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50 ${
                        o.value === value ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`truncate ${o.value === value ? 'font-semibold text-blue-700' : 'text-slate-700'}`}>{o.label}</p>
                        {o.description && <p className="text-[10px] text-slate-400 truncate">{o.description}</p>}
                      </div>
                      {o.value === value && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              ))
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handleSelect(o.value)}
                  className={`w-full flex items-start gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50 ${
                    o.value === value ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`truncate ${o.value === value ? 'font-semibold text-blue-700' : 'text-slate-700'}`}>{o.label}</p>
                    {o.description && <p className="text-[10px] text-slate-400 truncate">{o.description}</p>}
                  </div>
                  {o.value === value && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
