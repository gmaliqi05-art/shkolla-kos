import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile, UserRole } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isDemo: boolean;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  demoSignIn: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_PROFILES: Record<UserRole, Profile> = {
  drejtor: {
    id: 'demo-drejtor',
    email: 'drejtor@shkolla.ks',
    full_name: 'Arben Hoxha',
    role: 'drejtor',
    created_at: new Date().toISOString(),
  },
  mesues: {
    id: 'demo-mesues',
    email: 'mesues@shkolla.ks',
    full_name: 'Florentina Gashi',
    role: 'mesues',
    created_at: new Date().toISOString(),
  },
  nxenes: {
    id: 'demo-nxenes',
    email: 'nxenes@shkolla.ks',
    full_name: 'Ardi Krasniqi',
    role: 'nxenes',
    created_at: new Date().toISOString(),
  },
  prind: {
    id: 'demo-prind',
    email: 'prind@shkolla.ks',
    full_name: 'Driton Krasniqi',
    role: 'prind',
    created_at: new Date().toISOString(),
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data);
    return data;
  };

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          fetchProfile(s.user.id).then(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Session error:', error);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        (async () => {
          try {
            await fetchProfile(s.user.id);
          } catch (error) {
            console.error('Profile fetch error:', error);
          }
          setLoading(false);
        })();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role,
      });
      if (profileError) return { error: profileError.message };
      await fetchProfile(data.user.id);
    }
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    if (isDemo) {
      setProfile(null);
      setIsDemo(false);
      return;
    }
    await supabase.auth.signOut();
    setProfile(null);
  };

  const demoSignIn = (role: UserRole) => {
    setProfile(DEMO_PROFILES[role]);
    setIsDemo(true);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, isDemo, signUp, signIn, signOut, demoSignIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
