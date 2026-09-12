'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  Clock,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamOverviewProps {
  team: any[];
  onSelectTask?: (task: any) => void;
}

export function TeamOverview({ team, onSelectTask }: TeamOverviewProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Team Workload & Status
          </h2>
        </div>
        <Link
          href="/team"
          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
        >
          <span>View Team</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {team.map((member) => {
          const clientName =
            typeof member.currentWork?.client === 'object'
              ? member.currentWork?.client?.name
              : member.currentWork?.client || 'Internal';

          return (
            <div
              key={member.id}
              className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-indigo-500/30 transition-all duration-200 backdrop-blur-md space-y-3 flex flex-col justify-between group shadow-sm"
            >
              <div>
                {/* Member Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shadow">
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
                        {member.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">
                        {member.role || 'Data / ML Engineer'}
                      </p>
                    </div>
                  </div>

                  {/* Time Today Pill */}
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-white/5 text-xs font-mono text-indigo-300 font-bold">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    <span>{member.timeToday || '0m'}</span>
                  </div>
                </div>

                {/* Status Chips */}
                <div className="flex items-center gap-2 mt-3 text-xs">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    🟢 {member.activeCount} Active
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                    🟡 {member.pendingCount} Pending
                  </span>
                  {member.blockedCount > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                      🔴 {member.blockedCount} Blocked
                    </span>
                  )}
                </div>

                {/* Current Live Work or Available Indicator */}
                <div className="mt-3.5 pt-3 border-t border-white/5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Current Focus
                  </span>
                  {member.currentWork ? (
                    <div
                      onClick={() => onSelectTask && onSelectTask(member.currentWork)}
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5 hover:border-indigo-500/30 cursor-pointer transition flex items-center justify-between"
                    >
                      <div className="overflow-hidden pr-2">
                        <span className="text-xs font-bold text-slate-200 block truncate">
                          {member.currentWork.title}
                        </span>
                        <span className="text-[10px] text-indigo-400">
                          {clientName} · {member.currentWork.environment || 'DEV'}
                        </span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                      <span>Available — No active task</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
