import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../supabase';
import { translations, type Language, type TranslationKey } from './translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = 'shkolla-kos-language';

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'sq';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'sq' || stored === 'sr' || stored === 'tr' || stored === 'bs') return stored;
  const browserLang = navigator.language.slice(0, 2);
  if (browserLang === 'sr' || browserLang === 'tr' || browserLang === 'bs') return browserLang;
  return 'sq';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('profiles')
          .select('preferred_language')
          .eq('id', user.id)
          .maybeSingle();
        if (data?.preferred_language) {
          const lang = data.preferred_language as Language;
          setLanguageState(lang);
          localStorage.setItem(STORAGE_KEY, lang);
          document.documentElement.lang = lang;
        }
      } catch {
        // Silently ignore - use default language
      }
    })();
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').update({ preferred_language: lang }).eq('id', user.id);
        }
      } catch {
        // Silently ignore persistence errors
      }
    })();
  };

  const t = (key: TranslationKey): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[language] || entry.sq || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
