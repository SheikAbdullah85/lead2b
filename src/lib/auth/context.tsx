'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, SystemRole } from '../types';
import { supabase } from '../supabase/client';

export interface CredentialUser extends UserProfile {
  password?: string;
}

export const LIVE_USER: UserProfile = {
  id: 'd1c88448-0a1a-4b35-8f50-32aea5420067',
  email: 'sheik85@gmail.com',
  full_name: 'Sheik Abdullah',
  mobile: '+971 50 123 4567',
  system_role: 'super_admin',
  is_active: true,
  is_demo: false,
  created_at: '2026-09-29T11:43:38.168858+00:00',
};

export const DEMO_USERS: Record<string, UserProfile> = {
  sales_rep: {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    email: 'tariq@alphatech.com',
    full_name: 'Tariq Mansoor (Demo)',
    mobile: '+971 55 111 2233',
    system_role: 'sales_rep',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    is_active: true,
    is_demo: true,
    booth_number: 'H3-B24',
    created_at: '2026-09-01T00:00:00Z',
  },
  booth_staff: {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    email: 'sarah@alphatech.com',
    full_name: 'Sarah Jenkins (Demo)',
    mobile: '+971 55 444 5566',
    system_role: 'sales_rep',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    is_active: true,
    is_demo: true,
    booth_number: 'H3-B24',
    created_at: '2026-09-01T00:00:00Z',
  },
  exhibitor_admin: {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    email: 'exhibitor@alphatech.com',
    full_name: 'David Miller (Demo)',
    mobile: '+971 52 333 4444',
    system_role: 'exhibitor_admin',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    is_active: true,
    is_demo: true,
    booth_number: 'H3-B24',
    created_at: '2026-09-01T00:00:00Z',
  },
  healthcare_rep: {
    id: '33333333-aaaa-bbbb-cccc-333333333333',
    email: 'layla@biohealth.com',
    full_name: 'Dr. Layla Al-Hashimi (Demo)',
    mobile: '+971 50 611 8800',
    system_role: 'sales_rep',
    tenant_id: '33333333-3333-3333-3333-333333333333',
    is_active: true,
    is_demo: true,
    booth_number: 'Hall 4-C12',
    created_at: '2026-09-01T00:00:00Z',
  },
  mobility_manager: {
    id: '44444444-aaaa-bbbb-cccc-444444444444',
    email: 'marcus@voltmobility.com',
    full_name: 'Marcus Vance (Demo)',
    mobile: '+1 415 555 0192',
    system_role: 'exhibitor_admin',
    tenant_id: '44444444-4444-4444-4444-444444444444',
    is_active: true,
    is_demo: true,
    booth_number: 'Hall 1-A05',
    created_at: '2026-09-01T00:00:00Z',
  },
  organizer_admin: {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    email: 'organizer@gitex.com',
    full_name: 'Rashid Al-Nuaimi (Demo)',
    mobile: '+971 50 987 6543',
    system_role: 'organizer_admin',
    is_active: true,
    is_demo: true,
    created_at: '2026-09-01T00:00:00Z',
  },
  super_admin: {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    email: 'admin@demo-lead2b.com',
    full_name: 'Demo Platform Super Admin',
    mobile: '+971 50 123 4567',
    system_role: 'super_admin',
    is_active: true,
    is_demo: true,
    created_at: '2026-09-01T00:00:00Z',
  },
};

// Standard pre-configured accounts with password credentials
export const DEFAULT_CREDENTIALS: Record<string, { email: string; password: string; role: SystemRole }> = {
  'sheik85@gmail.com': { email: 'sheik85@gmail.com', password: 'Craftix@2026', role: 'super_admin' },
  'tariq@alphatech.com': { email: 'tariq@alphatech.com', password: 'Craftix@2026', role: 'sales_rep' },
  'sarah@alphatech.com': { email: 'sarah@alphatech.com', password: 'Craftix@2026', role: 'sales_rep' },
  'exhibitor@alphatech.com': { email: 'exhibitor@alphatech.com', password: 'Craftix@2026', role: 'exhibitor_admin' },
  'layla@biohealth.com': { email: 'layla@biohealth.com', password: 'Craftix@2026', role: 'sales_rep' },
  'marcus@voltmobility.com': { email: 'marcus@voltmobility.com', password: 'Craftix@2026', role: 'exhibitor_admin' },
  'organizer@gitex.com': { email: 'organizer@gitex.com', password: 'Craftix@2026', role: 'organizer_admin' },
  'admin@demo-lead2b.com': { email: 'admin@demo-lead2b.com', password: 'Craftix@2026', role: 'super_admin' },
};

interface AuthResult {
  success: boolean;
  error?: string;
  user?: UserProfile;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isDemoMode: boolean;
  login: (email: string, password?: string, role?: SystemRole, isDemoLogin?: boolean) => Promise<AuthResult>;
  logout: () => void;
  switchRole: (role: SystemRole) => void;
  registerUser: (newUser: UserProfile & { password?: string }) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isDemoMode: false,
  login: async () => ({ success: false }),
  logout: () => {},
  switchRole: () => {},
  registerUser: async () => ({ success: false }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lead2b_active_user');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('lead2b_active_user');
        if (stored) return false;
      } catch (e) {}
    }
    return true;
  });

  useEffect(() => {
    // 1. Initial check for active Supabase session
    async function checkSession() {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      // Fast-path: Check local storage for offline session first
      let cachedUser: UserProfile | null = null;
      try {
        const stored = localStorage.getItem('lead2b_active_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          // If legacy mock user without is_demo (e.g. tariq from older auto-login), purge it
          if (parsed && parsed.email !== 'sheik85@gmail.com' && !parsed.is_demo) {
            localStorage.removeItem('lead2b_active_user');
          } else if (parsed) {
            cachedUser = parsed;
            setUser(cachedUser);
            setIsLoading(false);
          }
        }
      } catch (e) {}

      // If offline, preserve cached user if available
      if (!isOnline) {
        setIsLoading(false);
        return;
      }

      // Online: Verify with Supabase Auth
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const isLiveSheik = session.user.email?.toLowerCase() === 'sheik85@gmail.com';
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const mappedUser: UserProfile = {
            id: session.user.id,
            email: session.user.email || profile?.email || 'sheik85@gmail.com',
            full_name: profile?.full_name || session.user.user_metadata?.full_name || (isLiveSheik ? 'Sheik Abdullah' : 'User'),
            mobile: profile?.mobile || (isLiveSheik ? '+971 50 123 4567' : undefined),
            system_role: (profile?.system_role as SystemRole) || (isLiveSheik ? 'super_admin' : 'sales_rep'),
            tenant_id: profile?.tenant_id || (isLiveSheik ? '2d14ae23-567f-457f-be97-f8cfb1bbd6dd' : '11111111-1111-1111-1111-111111111111'),
            booth_number: isLiveSheik ? 'TK-01' : (profile?.booth_number || 'Stand TK-01'),
            is_active: profile?.is_active ?? true,
            is_demo: !isLiveSheik && !!cachedUser?.is_demo,
            created_at: profile?.created_at || session.user.created_at || new Date().toISOString(),
          };
          setUser(mappedUser);
          localStorage.setItem('lead2b_active_user', JSON.stringify(mappedUser));
        } else {
          // If no active session and no valid cached user, remain unauthenticated
          if (!cachedUser) {
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('Supabase session check error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    checkSession();

    // Listen to Supabase auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          const isLiveSheik = session.user.email?.toLowerCase() === 'sheik85@gmail.com';
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const mappedUser: UserProfile = {
            id: session.user.id,
            email: session.user.email || profile?.email || session.user.email || 'sheik85@gmail.com',
            full_name: profile?.full_name || (isLiveSheik ? 'Sheik Abdullah' : (session.user.email?.split('@')[0] || 'User')),
            mobile: profile?.mobile || (isLiveSheik ? '+971 50 123 4567' : undefined),
            system_role: (profile?.system_role as SystemRole) || (isLiveSheik ? 'super_admin' : 'sales_rep'),
            tenant_id: profile?.tenant_id || (isLiveSheik ? '2d14ae23-567f-457f-be97-f8cfb1bbd6dd' : '11111111-1111-1111-1111-111111111111'),
            booth_number: isLiveSheik ? 'TK-01' : (profile?.booth_number || 'Stand TK-01'),
            is_active: profile?.is_active ?? true,
            is_demo: !isLiveSheik,
            created_at: profile?.created_at || new Date().toISOString(),
          };
          setUser(mappedUser);
          localStorage.setItem('lead2b_active_user', JSON.stringify(mappedUser));
        } catch (e) {}
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (
    email: string,
    password?: string,
    role?: SystemRole,
    isDemoLogin?: boolean
  ): Promise<AuthResult> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const inputPassword = password || 'Craftix@2026';

    // 1. Separation Enforcement: If NOT a demo login, restrict access EXCLUSIVELY to sheik85@gmail.com
    if (!isDemoLogin) {
      if (cleanEmail !== 'sheik85@gmail.com') {
        setIsLoading(false);
        return {
          success: false,
          error: 'Access restricted: Live production workspace is authorized for sheik85@gmail.com only. For evaluating or testing other roles, please use the Interactive Demo Sandbox.',
        };
      }

      if (inputPassword !== 'Craftix@2026' && inputPassword !== 'Password123!') {
        setIsLoading(false);
        return {
          success: false,
          error: 'Invalid password. Please check your credentials and try again.',
        };
      }
    }

    // Attempt real Supabase Auth
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: inputPassword,
      });

      if (!authError && authData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        const isLiveSheik = cleanEmail === 'sheik85@gmail.com';
        const authenticatedUser: UserProfile = {
          id: authData.user.id,
          email: authData.user.email || cleanEmail,
          full_name: profile?.full_name || authData.user.user_metadata?.full_name || (isLiveSheik ? 'Sheik Abdullah' : cleanEmail.split('@')[0]),
          mobile: profile?.mobile || (isLiveSheik ? '+971 50 123 4567' : undefined),
          system_role: (profile?.system_role as SystemRole) || role || (isLiveSheik ? 'super_admin' : 'sales_rep'),
          tenant_id: profile?.tenant_id || (isLiveSheik ? '2d14ae23-567f-457f-be97-f8cfb1bbd6dd' : '11111111-1111-1111-1111-111111111111'),
          booth_number: isLiveSheik ? 'TK-01' : (profile?.booth_number || 'Stand TK-01'),
          is_active: true,
          is_demo: !!isDemoLogin,
          created_at: profile?.created_at || new Date().toISOString(),
        };

        setUser(authenticatedUser);
        localStorage.setItem('lead2b_active_user', JSON.stringify(authenticatedUser));
        setIsLoading(false);
        return { success: true, user: authenticatedUser };
      }
    } catch (sbErr) {
      console.warn('Supabase auth network attempt failed, checking local credentials fallback...', sbErr);
    }

    // Local fallback for sheik85@gmail.com
    if (cleanEmail === 'sheik85@gmail.com') {
      const liveAdmin: UserProfile = { ...LIVE_USER };
      setUser(liveAdmin);
      try {
        localStorage.setItem('lead2b_active_user', JSON.stringify(liveAdmin));
      } catch (e) {}
      setIsLoading(false);
      return { success: true, user: liveAdmin };
    }

    // If Demo Login allowed
    if (isDemoLogin) {
      let matchedUser = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === cleanEmail);
      if (!matchedUser) {
        matchedUser = {
          id: `demo_${Date.now()}`,
          email: cleanEmail,
          full_name: cleanEmail.split('@')[0] + ' (Demo)',
          system_role: role || 'sales_rep',
          tenant_id: '11111111-1111-1111-1111-111111111111',
          is_active: true,
          is_demo: true,
          created_at: new Date().toISOString(),
        };
      }
      setUser(matchedUser);
      try {
        localStorage.setItem('lead2b_active_user', JSON.stringify(matchedUser));
      } catch (e) {}
      setIsLoading(false);
      return { success: true, user: matchedUser };
    }

    setIsLoading(false);
    return { success: false, error: 'Unauthorized access.' };
  };

  const registerUser = async (
    newUser: UserProfile & { password?: string }
  ): Promise<AuthResult> => {
    setIsLoading(true);
    const cleanEmail = newUser.email.trim().toLowerCase();

    // 1. Try Supabase signUp
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: newUser.password || 'Craftix@2026',
        options: {
          data: {
            full_name: newUser.full_name,
            system_role: newUser.system_role,
            tenant_id: newUser.tenant_id,
          },
        },
      });

      if (!signUpError && signUpData.user) {
        const registered: UserProfile = {
          ...newUser,
          id: signUpData.user.id,
          email: cleanEmail,
        };
        setUser(registered);
        localStorage.setItem('lead2b_active_user', JSON.stringify(registered));
        setIsLoading(false);
        return { success: true, user: registered };
      }
    } catch (e) {
      console.warn('Supabase registration failed, falling back to local storage:', e);
    }

    // 2. Local Storage Fallback
    try {
      const stored = localStorage.getItem('lead2b_registered_users');
      const existing = stored ? JSON.parse(stored) : {};
      existing[cleanEmail] = newUser;
      localStorage.setItem('lead2b_registered_users', JSON.stringify(existing));
    } catch (e) {}

    setUser(newUser);
    localStorage.setItem('lead2b_active_user', JSON.stringify(newUser));
    setIsLoading(false);
    return { success: true, user: newUser };
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
    try {
      localStorage.removeItem('lead2b_active_user');
    } catch (e) {}
  };

  const switchRole = (newRole: SystemRole) => {
    if (!user) return;
    if (user.is_demo) {
      const persona = Object.values(DEMO_USERS).find((u) => u.system_role === newRole) || { ...user, system_role: newRole };
      setUser(persona);
      try {
        localStorage.setItem('lead2b_active_user', JSON.stringify(persona));
      } catch (e) {}
    } else {
      // In live mode, super_admin can switch preview between rep, exhibitor admin, organizer admin
      const updatedUser = { ...user, system_role: newRole };
      setUser(updatedUser);
      try {
        localStorage.setItem('lead2b_active_user', JSON.stringify(updatedUser));
      } catch (e) {}
    }
  };

  const isDemoMode = !!(user && user.is_demo);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isDemoMode,
        login,
        logout,
        switchRole,
        registerUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
