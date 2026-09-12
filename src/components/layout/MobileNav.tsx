'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  GitFork,
  Users,
  Building2,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  onOpenQuickAdd: () => void;
}

export function MobileNav({ onOpenQuickAdd }: MobileNavProps) {
  const pathname = usePathname();

  const items = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/team', label: 'Team', icon: Users },
    { href: '/clients', label: 'Clients', icon: Building2 },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090D16]/95 backdrop-blur-xl border-t border-white/10 px-4 py-2 flex items-center justify-around shadow-2xl">
      {items.slice(0, 2).map((item) => {
        const Icon = item.icon;
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 text-xs py-1 px-3 rounded-lg transition',
              isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400'
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}

      {/* Center Floating Quick Add */}
      <button
        onClick={onOpenQuickAdd}
        className="w-12 h-12 -mt-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 border-2 border-[#090D16] active:scale-95 transition"
      >
        <Plus className="w-6 h-6" />
      </button>

      {items.slice(2).map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 text-xs py-1 px-3 rounded-lg transition',
              isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400'
            )}
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
