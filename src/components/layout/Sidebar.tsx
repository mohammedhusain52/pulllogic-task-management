'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Building2,
  GitFork,
  Bug,
  AlertCircle,
  Sparkles,
  Calendar,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'My Tasks', icon: CheckSquare },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/clients', label: 'Clients', icon: Building2 },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#090D16] border-r border-white/10 shrink-0 h-screen sticky top-0">
      {/* Brand Header with Pull Logic Logo */}
      <div className="p-4 border-b border-white/10">
        <Link href="/" className="block space-y-2 group">
          <div className="flex items-center justify-between">
            <div className="h-9 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-white/10 flex items-center gap-2 shadow-md group-hover:border-indigo-500/40 transition">
              <img
                src="/pull-logic-mark.svg"
                alt="Pull Logic"
                className="h-5 w-5 object-contain"
              />
              <span className="text-xs font-bold text-white tracking-tight">Pull Logic</span>
            </div>
            <span className="text-[10px] uppercase font-extrabold tracking-widest px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-500/30">
              OPS
            </span>
          </div>
          <p className="text-[11px] font-medium text-slate-400 pl-0.5">
            Task Management
          </p>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 font-semibold shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 transition-colors',
                  isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Operator User Card */}
      <div className="p-4 border-t border-white/10 bg-slate-950/40">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-white/5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-xs text-white shadow-md">
            MH
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">Mohammed Husain</p>
            <p className="text-[10px] text-slate-400 truncate">Senior Data Scientist</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
