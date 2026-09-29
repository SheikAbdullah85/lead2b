'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, SystemRole } from '../types';
import { supabase } from '../supabase/client';

export interface CredentialUser extends UserProfile {
  password?: string;
}

export const DEMO_USERS: Record<string, UserProfile> = {
  super_admin: {
    id: 'd1c88448-0a1a-4b35-8f50-32aea5420067',
    email: 'sheik85@gmail.com',
    full_name: 'Sheik Abdullah',
    mobile: '+971 50 123 4567',
    system_role: 'super_admin',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    is_active: true,
    created_at: '2026-09-01T00:00:00Z',
  },
  sales_rep: {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    email: 'tariq@alphatech.com',
    full_name: 'Tariq Mansoor',
    mobile: '+971 55 111 2233',
    system_role: 'sales_rep',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    is_active: true,
    booth_number: 'H3-B24',
    organization: {
      id: '11111111-1111-1111-1111-111111111111',
      company_name: 'Alpha Technology Group',
      company_code: 'ALPHA-TECH',
      email: 'admin@alphatech.com',
      active_status: true,
      subscription_plan: 'event_pro',
      license_count: 10,
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
    },
    created_at: '2026-09-01T00:00:00Z',
  },
  exhibitor_admin: {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    email: 'exhibitor@alphatech.com',
    full_name: 'David Miller',
    mobile: '+971 52 333 4444',
    system_role: 'exhibitor_admin',
    tenant_id: '11111111-1111-1111-1111-111111111111',
    is_active: true,
    organization: {
      id: '11111111-1111-1111-1111-111111111111',
      company_name: 'Alpha Technology Group',
      company_code: 'ALPHA-TECH',
      email: 'admin@alphatech.com',
      active_status: true,
      subscription_plan: 'event_pro',
      license_count: 10,
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
    },
    created_at: '2026-09-01T00:00:00Z',
  },
  organizer_admin: {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    email: 'organizer@gitex.com',
    full_name: 'Rashid Al-Nuaimi',
    mobile: '+971 50 987 6543',
    system_role: 'organizer_admin',
    is_active: true,
    created_at: '2026-09-01T00:00:00Z',
  },
  lead2b_admin: {
    id: 'e3c151e6-54a3-428d-a482-85f084ffde2a',
    email: 'admin@lead2b.com',
    full_name: 'System Administrator',
    mobile: '+971 50 123 4567',
    system_role: 'super_admin',
    is_active: true,
    created_at: '2026-09-01T00:00:00Z',
  },
};

// Standard pre-configured accounts with password credentials
export const DEFAULT_CREDENTIALS: Record<string, { email: string; password: string; role: SystemRole }> = {
  'sheik85@gmail.com': { email: 'sheik85@gmail.com', password: 'Craftix@2026', role: 'super_admin' },
  'admin@lead2b.com': { email: 'admin@lead2b.com', password: 'Craftix@2026', role: 'super_admin' },
  'organizer@gitex.com': { email: 'organizer@gitex.com', password: 'Craftix@2026', role: 'organizer_admin' },
  'exhibitor@alphatech.com': { email: 'exhibitor@alphatech.com', password: 'Craftix@2026', role: 'exhibitor_admin' },
  'tariq@alphatech.com': { email: 'tariq@alphatech.com', password: 'Craftix@2026', role: 'sales_rep' },
  'sarah@alphatech.com': { email: 'sarah@alphatech.com', password: 'Craftix@2026', role: 'sales_rep' },
};

interface AuthResult {
  success: boolean;
  error?: string;
  user?: UserProfile;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password?: string, role?: SystemRole) => Promise<AuthResult>;
  logout: () => void;
  switchRole: (role: SystemRole) => void;
  registerUser: (newUser: UserProfile & { password?: string }) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: () => {},
  switchRole: () => {},
  registerUser: async () => ({ success: false }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Initial check for active Supabase session
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const mappedUser: UserProfile = {
              id: profile.id,
              email: profile.email,
              full_name: profile.full_name || profile.email.split('@')[0],
              mobile: profile.mobile,
              system_role: profile.system_role as SystemRole,
              tenant_id: profile.tenant_id,
              is_active: profile.is_active,
              created_at: profile.created_at,
            };
            setUser(mappedUser);
            localStorage.setItem('lead2b_active_user', JSON.stringify(mappedUser));
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Supabase session check error:', err);
      }

      // Fallback: Check local storage for offline session
      try {
        const stored = localStorage.getItem('lead2b_active_user');
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkSession();

    // Listen to Supabase auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const mappedUser: UserProfile = {
              id: profile.id,
              email: profile.email,
              full_name: profile.full_name || profile.email.split('@')[0],
              mobile: profile.mobile,
              system_role: profile.system_role as SystemRole,
              tenant_id: profile.tenant_id,
              is_active: profile.is_active,
              created_at: profile.created_at,
            };
            setUser(mappedUser);
            localStorage.setItem('lead2b_active_user', JSON.stringify(mappedUser));
          }
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
    role?: SystemRole
  ): Promise<AuthResult> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const inputPassword = password || 'Craftix@2026';

    // 1. Try real Supabase Auth
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: inputPassword,
      });

      if (!authError && authData.user) {
        // Fetch user profile from database
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        const authenticatedUser: UserProfile = {
          id: authData.user.id,
          email: authData.user.email || cleanEmail,
          full_name: profile?.full_name || authData.user.user_metadata?.full_name || cleanEmail.split('@')[0],
          mobile: profile?.mobile,
          system_role: (profile?.system_role as SystemRole) || role || 'super_admin',
          tenant_id: profile?.tenant_id || '11111111-1111-1111-1111-111111111111',
          is_active: true,
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

    // 2. Fallback for offline mode or local persona verification
    let matchedUser = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === cleanEmail);
    let expectedPassword = 'Craftix@2026';

    if (DEFAULT_CREDENTIALS[cleanEmail]) {
      expectedPassword = DEFAULT_CREDENTIALS[cleanEmail].password;
    }

    if (password) {
      const isValidPassword =
        password === expectedPassword ||
        password === 'Craftix@2026' ||
        password === 'Password123!' ||
        password === 'lead2b-pass-2026';

      if (!isValidPassword) {
        setIsLoading(false);
        return {
          success: false,
          error: 'Incorrect password. Use Craftix@2026 or Password123!',
        };
      }
    }

    if (!matchedUser) {
      matchedUser = {
        id: `usr_${Date.now()}`,
        email: cleanEmail,
        full_name: cleanEmail.split('@')[0],
        system_role: role || 'sales_rep',
        tenant_id: '11111111-1111-1111-1111-111111111111',
        is_active: true,
        created_at: new Date().toISOString(),
      };
    }

    setUser(matchedUser);
    try {
      localStorage.setItem('lead2b_active_user', JSON.stringify(matchedUser));
    } catch (e) {}

    setIsLoading(false);
    return { success: true, user: matchedUser };
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
    const updated = { ...user, system_role: newRole };
    setUser(updated);
    try {
      localStorage.setItem('lead2b_active_user', JSON.stringify(updated));
    } catch (e) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
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
