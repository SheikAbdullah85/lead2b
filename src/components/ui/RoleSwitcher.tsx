'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { SystemRole } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import { Shield, UserCheck, Building2, Smartphone, ChevronDown, Check, Sparkles, LogOut, ArrowRight, Move } from 'lucide-react';

export function RoleSwitcher() {
  const { user, switchRole, logout, isDemoMode } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Position for touch / mobile drag
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number; hasMoved: boolean }>({
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0,
    hasMoved: false,
  });

  // ONLY render when explicitly in demo mode or on the /demo route!
  const isDemo = isDemoMode || (typeof pathname === 'string' && pathname.startsWith('/demo'));
  if (!user || !isDemo) return null;

  const roles: { role: SystemRole; label: string; route: string; icon: any; color: string; badge: string }[] = [
    {
      role: 'sales_rep',
      label: 'Sales Rep (Mobile PWA)',
      route: '/app/dashboard',
      icon: Smartphone,
      color: 'text-teal-700 bg-teal-50 border-teal-200/80',
      badge: 'Booth Rep',
    },
    {
      role: 'exhibitor_admin',
      label: 'Exhibitor Portal Admin',
      route: '/exhibitor/dashboard',
      icon: Building2,
      color: 'text-slate-800 bg-slate-100 border-slate-300',
      badge: 'Exhibitor Admin',
    },
    {
      role: 'organizer_admin',
      label: 'Event Organizer Admin',
      route: '/admin/dashboard',
      icon: UserCheck,
      color: 'text-amber-700 bg-amber-50 border-amber-200/80',
      badge: 'Event Organizer',
    },
    {
      role: 'super_admin',
      label: 'Super Admin (lead2b)',
      route: '/admin/dashboard',
      icon: Shield,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
      badge: 'Super Admin',
    },
  ];

  const handleSelectRole = (role: SystemRole, route: string) => {
    switchRole(role);
    setIsOpen(false);
    router.push(route);
  };

  const handleExitDemoToLive = () => {
    logout();
    setIsOpen(false);
    router.push('/login');
  };

  // Touch drag handlers for mobile screens
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const currentX = pos ? pos.x : window.innerWidth - 170;
    const currentY = pos ? pos.y : 10;

    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startPosX: currentX,
      startPosY: currentY,
      hasMoved: false,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const dx = touch.clientX - dragRef.current.startX;
    const dy = touch.clientY - dragRef.current.startY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragRef.current.hasMoved = true;
    }

    const newX = Math.max(10, Math.min(window.innerWidth - 160, dragRef.current.startPosX + dx));
    const newY = Math.max(10, Math.min(window.innerHeight - 80, dragRef.current.startPosY + dy));
    setPos({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    // If not dragged, toggle menu
    if (!dragRef.current.hasMoved) {
      setIsOpen((prev) => !prev);
    }
  };

  const currentConfig = roles.find((r) => r.role === user.system_role) || roles[0];
  const Icon = currentConfig.icon;

  const stylePosition: React.CSSProperties = pos
    ? { left: `${pos.x}px`, top: `${pos.y}px`, right: 'auto', bottom: 'auto' }
    : { top: '10px', right: '10px' };

  return (
    <div
      style={stylePosition}
      className="fixed z-50 select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative">
        <button
          onClick={() => {
            // For desktop mouse clicks
            if (!dragRef.current.hasMoved) {
              setIsOpen(!isOpen);
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border backdrop-blur-md transition-all active:scale-95 ${currentConfig.color}`}
          title="Drag to move across screen • Tap to switch persona"
        >
          <Move className="w-3 h-3 text-slate-400 opacity-60" />
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-medium text-slate-700">{user.full_name} •</span>
          <span>{currentConfig.badge}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white p-2.5 shadow-2xl border border-slate-200/90 text-slate-800 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span>Demo Environment</span>
              <span className="text-teal-600 font-bold">Touch Movable</span>
            </div>

            {/* Switch to Live App Button */}
            <div className="py-2 border-b border-slate-100">
              <button
                type="button"
                onClick={handleExitDemoToLive}
                className="w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-bold shadow-xs hover:brightness-105 active:scale-98 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <div className="text-left">
                    <span className="block leading-tight font-black">Switch to Live Application</span>
                    <span className="text-[10px] text-emerald-100 font-normal">Sign in as sheik85@gmail.com</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-200" />
              </button>
            </div>

            <div className="mt-2 space-y-1">
              <span className="px-2 text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Evaluate Demo Persona:
              </span>
              {roles.map((item) => {
                const ItemIcon = item.icon;
                const isSelected = user.system_role === item.role;
                return (
                  <button
                    key={item.role}
                    onClick={() => handleSelectRole(item.role, item.route)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition ${
                      isSelected
                        ? 'bg-teal-50 text-teal-900 border border-teal-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <ItemIcon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="leading-tight font-bold">{item.label}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.route}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Logout option */}
            <div className="pt-2 mt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleExitDemoToLive}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Demo</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
