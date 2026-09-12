'use client';

import React from 'react';
import {
  AlertTriangle,
  Clock,
  ArrowRight,
  Send,
  User,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { formatDateRelative, formatDateTime, cn } from '@/lib/utils';

interface FollowUpSectionProps {
  followUps: any[];
  onSelectTask: (task: any) => void;
  onRefresh?: () => void;
}

export function FollowUpSection({
  followUps,
  onSelectTask,
  onRefresh,
}: FollowUpSectionProps) {
  if (!followUps || followUps.length === 0) {
    return null;
  }

  const handleQuickFollowUp = async (e: React.MouseEvent, task: any) => {
    e.stopPropagation();
    try {
      // Post comment: "Followed up on [Date]"
      await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `⚡ Automated Follow-up logged by Mohammed Husain to ${
            task.waitingForName || 'assigned team'
          }.`,
          authorName: 'Mohammed Husain',
          entityType: task.type,
        }),
      });

      // Update follow-up date to tomorrow
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUpDate: tomorrow }),
      });

      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-rose-300">
            Follow-ups Required 🔴
          </h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            {followUps.length} Pending
          </span>
        </div>
        <span className="text-xs text-slate-400">
          Threshold: &gt;1 day waiting
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {followUps.map((task) => {
          const isCritical = task.priority === 'CRITICAL' || task.status === 'BLOCKED';
          const stageProgression = task.workflowRun ? `${task.environment || 'DEV'} → QA` : null;

          return (
            <div
              key={task.id}
              onClick={() => onSelectTask(task)}
              className={cn(
                'p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-left relative overflow-hidden backdrop-blur-md',
                isCritical
                  ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/60 shadow-lg shadow-rose-950/30'
                  : 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/60 shadow-lg shadow-amber-950/30'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">{isCritical ? '🔴' : '🟡'}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {task.client?.name || 'Operations'} — {task.title}
                      </span>
                    </div>
                    {task.workflowRun && (
                      <span className="text-[11px] text-slate-400">
                        Workflow: {task.workflowRun.name}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => handleQuickFollowUp(e, task)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 transition active:scale-95 shrink-0 shadow"
                >
                  <Send className="w-3 h-3 text-indigo-400" />
                  <span>Follow Up</span>
                </button>
              </div>

              {/* Info Matrix */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-3 border-t border-white/5">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Waiting for
                  </span>
                  <span className="font-bold text-slate-200">
                    {task.waitingForName || task.waitingForType || task.assignee?.name || 'Testing Team'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Stage
                  </span>
                  <span className="font-mono text-slate-300">
                    {stageProgression || task.environment || 'DEV'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Waiting since
                  </span>
                  <span className="text-slate-300 font-mono">
                    {formatDateRelative(task.waitingSince)}
                  </span>
                </div>
              </div>

              {task.waitingReason && (
                <div className="mt-2 text-[11px] text-slate-300 italic bg-black/20 p-2 rounded-lg">
                  "{task.waitingReason}"
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
