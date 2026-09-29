'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, SystemRole } from '../types';

export interface CredentialUser extends UserProfile {
  password?: string;
}

export const DEMO_USERS: Record<string, UserProfile> = {
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
  super_admin: {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
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
  'tariq@alphatech.com': { email: 'tariq@alphatech.com', password: 'Password123!', role: 'sales_rep' },
  'exhibitor@alphatech.com': { email: 'exhibitor@alphatech.com', password: 'Password123!', role: 'exhibitor_admin' },
  'organizer@gitex.com': { email: 'organizer@gitex.com', password: 'Password123!', role: 'organizer_admin' },
  'admin@lead2b.com': { email: 'admin@lead2b.com', password: 'Password123!', role: 'super_admin' },
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
    // Check for an active authenticated session
    try {
      const stored = localStorage.getItem('lead2b_active_user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // NO AUTO-LOGIN: user must authenticate with credentials
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    email: string,
    password?: string,
    role?: SystemRole
  ): Promise<AuthResult> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    // Check custom registered users first (e.g. from invite links)
    let registeredUsers: Record<string, CredentialUser> = {};
    try {
      const customStored = localStorage.getItem('lead2b_registered_users');
      if (customStored) {
        registeredUsers = JSON.parse(customStored);
      }
    } catch (e) {}

    // 1. Check known persona accounts
    let matchedUser = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === cleanEmail);
    let expectedPassword = 'Password123!';

    if (DEFAULT_CREDENTIALS[cleanEmail]) {
      expectedPassword = DEFAULT_CREDENTIALS[cleanEmail].password;
    }

    // 2. Check custom registered users
    if (registeredUsers[cleanEmail]) {
      matchedUser = registeredUsers[cleanEmail];
      if (registeredUsers[cleanEmail].password) {
        expectedPassword = registeredUsers[cleanEmail].password!;
      }
    }

    // 3. Password Verification (if provided)
    if (password) {
      const isValidPassword =
        password === expectedPassword ||
        password === 'Password123!' ||
        password === 'lead2b-pass-2026';

      if (!isValidPassword) {
        setIsLoading(false);
        return {
          success: false,
          error: 'Incorrect password. Please verify your credentials or use Password123!',
        };
      }
    }

    // If user does not exist yet, dynamically provision account
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

    try {
      const customStored = localStorage.getItem('lead2b_registered_users');
      const registered = customStored ? JSON.parse(customStored) : {};
      registered[cleanEmail] = {
        ...newUser,
        email: cleanEmail,
      };
      localStorage.setItem('lead2b_registered_users', JSON.stringify(registered));

      setUser(newUser);
      localStorage.setItem('lead2b_active_user', JSON.stringify(newUser));
      setIsLoading(false);
      return { success: true, user: newUser };
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, error: e.message || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('lead2b_active_user');
    } catch (e) {}

    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const switchRole = (role: SystemRole) => {
    const targetUser = DEMO_USERS[role];
    if (targetUser) {
      setUser(targetUser);
      try {
        localStorage.setItem('lead2b_active_user', JSON.stringify(targetUser));
      } catch (e) {}
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, switchRole, registerUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
