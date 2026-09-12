'use client';

import React from 'react';
import {
  CheckSquare,
  Calendar,
  AlertTriangle,
  Ban,
  Users,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  metrics: {
    active: number;
    dueToday: number;
    followUps: number;
    blocked: number;
    teamActive: number;
    overdue: number;
  };
  onFilterClick?: (filterKey: string) => void;
}

export function SummaryCards({ metrics, onFilterClick }: SummaryCardsProps) {
  const cards = [
    {
      key: 'active',
      title: 'My Tasks',
      value: metrics.active,
      subtitle: 'Active workload',
      icon: CheckSquare,
      color: 'text-indigo-400',
      bgGlow: 'hover:border-indigo-500/40',
      borderAccent: 'border-indigo-500/20',
      badgeBg: 'bg-indigo-500/15',
    },
    {
      key: 'dueToday',
      title: 'Due Today',
      value: metrics.dueToday,
      subtitle: 'Requires completion',
      icon: Calendar,
      color: 'text-cyan-400',
      bgGlow: 'hover:border-cyan-500/40',
      borderAccent: 'border-cyan-500/20',
      badgeBg: 'bg-cyan-500/15',
    },
    {
      key: 'followUps',
      title: 'Follow-ups',
      value: metrics.followUps,
      subtitle: 'Waiting on updates',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgGlow: 'hover:border-amber-500/40',
      borderAccent: 'border-amber-500/20',
      badgeBg: 'bg-amber-500/15',
      alert: metrics.followUps > 0,
    },
    {
      key: 'blocked',
      title: 'Blocked',
      value: metrics.blocked,
      subtitle: 'Requires unblocking',
      icon: Ban,
      color: 'text-rose-400',
      bgGlow: 'hover:border-rose-500/40',
      borderAccent: 'border-rose-500/20',
      badgeBg: 'bg-rose-500/15',
      alert: metrics.blocked > 0,
    },
    {
      key: 'teamActive',
      title: 'Team Active',
      value: metrics.teamActive,
      subtitle: 'Members in progress',
      icon: Users,
      color: 'text-emerald-400',
      bgGlow: 'hover:border-emerald-500/40',
      borderAccent: 'border-emerald-500/20',
      badgeBg: 'bg-emerald-500/15',
    },
    {
      key: 'overdue',
      title: 'Overdue',
      value: metrics.overdue,
      subtitle: 'Past target date',
      icon: Clock,
      color: 'text-red-400',
      bgGlow: 'hover:border-red-500/40',
      borderAccent: 'border-red-500/20',
      badgeBg: 'bg-red-500/15',
      alert: metrics.overdue > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.key}
            onClick={() => onFilterClick && onFilterClick(card.key)}
            className={cn(
              'p-4 rounded-2xl bg-slate-900/80 border text-left transition-all duration-200 group relative overflow-hidden backdrop-blur-md',
              card.borderAccent,
              card.bgGlow
            )}
          >
            {/* Ambient Background Glow */}
            <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-white/[0.02] rounded-full blur-xl pointer-events-none group-hover:bg-white/[0.05] transition" />

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">
                {card.title}
              </span>
              <div
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110',
                  card.badgeBg,
                  card.color
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {card.value}
              </span>
              {card.alert && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>

            <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">
              {card.subtitle}
            </p>
          </button>
        );
      })}
    </div>
  );
}
