'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { SystemRole } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: SystemRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Enforce strict login redirect if not authenticated
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.system_role)) {
        // Enforce role-based access control (RBAC)
        if (user.system_role === 'sales_rep') {
          router.replace('/app/dashboard');
        } else if (user.system_role === 'exhibitor_admin') {
          router.replace('/exhibitor/dashboard');
        } else {
          router.replace('/admin/dashboard');
        }
      }
    }
  }, [user, isLoading, allowedRoles, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[#22d3ee] animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-300">Verifying security session...</p>
      </div>
    );
  }

  // Not authenticated or role mismatch: return null while redirect takes effect
  if (!user) {
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.system_role)) {
    return null;
  }

  return <>{children}</>;
}
