'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, SystemRole } from '../types';

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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, role?: SystemRole) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: SystemRole) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => false,
  logout: () => {},
  switchRole: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load persisted session from localStorage
    try {
      const stored = localStorage.getItem('lead2b_active_user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Default to sales rep for instant mobile first experience
        const defaultUser = DEMO_USERS.sales_rep;
        setUser(defaultUser);
        localStorage.setItem('lead2b_active_user', JSON.stringify(defaultUser));
      }
    } catch (e) {
      setUser(DEMO_USERS.sales_rep);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, role?: SystemRole): Promise<boolean> => {
    setIsLoading(true);
    let matchedUser = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!matchedUser && role) {
      matchedUser = DEMO_USERS[role];
    } else if (!matchedUser) {
      // Create dynamically if new
      matchedUser = {
        id: `usr_${Date.now()}`,
        email,
        full_name: email.split('@')[0],
        system_role: role || 'sales_rep',
        tenant_id: '11111111-1111-1111-1111-111111111111',
        is_active: true,
        created_at: new Date().toISOString(),
      };
    }

    setUser(matchedUser);
    localStorage.setItem('lead2b_active_user', JSON.stringify(matchedUser));
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lead2b_active_user');
  };

  const switchRole = (role: SystemRole) => {
    const targetUser = DEMO_USERS[role];
    if (targetUser) {
      setUser(targetUser);
      localStorage.setItem('lead2b_active_user', JSON.stringify(targetUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
