import { NavLink } from 'react-router-dom';
import { GraduationCap, X } from 'lucide-react';
import type { UserRole } from '../../types/database';
import type { LucideIcon } from 'lucide-react';
import { useI18n } from '../../lib/i18n/I18nProvider';
import type { TranslationKey } from '../../lib/i18n/translations';

export interface NavItem {
  label: string;
  labelKey?: TranslationKey;
  path: string;
  icon: LucideIcon;
}

interface SidebarProps {
  items: NavItem[];
  role: UserRole;
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_COLORS: Record<UserRole, { bg: string; accent: string; text: string }> = {
  drejtor: { bg: 'from-blue-900 to-blue-800', accent: 'bg-blue-700', text: 'text-blue-200' },
  mesues: { bg: 'from-teal-900 to-teal-800', accent: 'bg-teal-700', text: 'text-teal-200' },
  nxenes: { bg: 'from-cyan-900 to-cyan-800', accent: 'bg-cyan-700', text: 'text-cyan-200' },
  prind: { bg: 'from-slate-900 to-slate-800', accent: 'bg-slate-700', text: 'text-slate-300' },
  pedagog: { bg: 'from-pink-900 to-pink-800', accent: 'bg-pink-700', text: 'text-pink-200' },
  drejtor_komunal: { bg: 'from-amber-900 to-amber-800', accent: 'bg-amber-700', text: 'text-amber-200' },
  ministri: { bg: 'from-purple-900 to-purple-800', accent: 'bg-purple-700', text: 'text-purple-200' },
  inspektor: { bg: 'from-orange-900 to-orange-800', accent: 'bg-orange-700', text: 'text-orange-200' },
};

const ROLE_LABEL_KEYS: Record<UserRole, TranslationKey> = {
  drejtor: 'sidebar.role.drejtor',
  mesues: 'sidebar.role.mesues',
  nxenes: 'sidebar.role.nxenes',
  prind: 'sidebar.role.prind',
  pedagog: 'sidebar.role.pedagog',
  drejtor_komunal: 'sidebar.role.drejtor_komunal',
  ministri: 'sidebar.role.ministri',
  inspektor: 'sidebar.role.inspektor',
};

export default function Sidebar({ items, role, isOpen, onClose }: SidebarProps) {
  const { t } = useI18n();
  const colors = ROLE_COLORS[role];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b ${colors.bg} text-white transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${colors.accent} rounded-xl flex items-center justify-center`}>
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Shkolla</h1>
              <p className={`text-xs ${colors.text}`}>{t(ROLE_LABEL_KEYS[role])}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Mbyll menunë" className="lg:hidden text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? `bg-white/15 text-white shadow-lg shadow-black/10`
                    : `${colors.text} hover:bg-white/10 hover:text-white`
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.labelKey ? t(item.labelKey) : item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className={`text-xs ${colors.text} text-center`}>
            {t('sidebar.academic_year')} 2025-2026
          </div>
        </div>
      </aside>
    </>
  );
}
