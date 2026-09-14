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
            Follow-ups & Blockers Required 🔴
          </h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            {followUps.length} Pending
          </span>
        </div>
        <span className="text-xs text-slate-400">
          Critical attention & blockers
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {followUps.map((task) => {
          const isBlocked = task.status === 'BLOCKED';
          const isCritical = task.priority === 'CRITICAL';
          const isWaiting = task.status === 'WAITING_FOR_UPDATE';
          const currentStage = task.stage?.name || task.environment || 'DEV';

          return (
            <div
              key={task.id}
              onClick={() => onSelectTask(task)}
              className={cn(
                'p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-left relative overflow-hidden backdrop-blur-md',
                isBlocked
                  ? 'bg-rose-950/30 border-rose-500/40 hover:border-rose-500/70 shadow-lg shadow-rose-950/40'
                  : isCritical
                  ? 'bg-amber-950/30 border-amber-500/40 hover:border-amber-500/70 shadow-lg shadow-amber-950/40'
                  : 'bg-slate-900/60 border-white/10 hover:border-indigo-500/40'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5">
                    {isBlocked ? '🔴' : isCritical ? '⚡' : '🟡'}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">
                        {task.client?.name || 'Operations'} — {task.title}
                      </span>
                      {isBlocked && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          BLOCKED
                        </span>
                      )}
                      {isCritical && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          CRITICAL
                        </span>
                      )}
                      {isWaiting && !isBlocked && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                          WAITING
                        </span>
                      )}
                    </div>
                    {task.workflowRun && (
                      <span className="text-[11px] text-slate-400 block mt-0.5">
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
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block truncate">
                    {isBlocked ? 'Blocked Reason' : isWaiting ? 'Waiting for' : 'Owner / Attention'}
                  </span>
                  <span
                    className={cn(
                      'font-bold block truncate',
                      isBlocked ? 'text-rose-300' : 'text-slate-200'
                    )}
                    title={
                      isBlocked
                        ? (task.blockReason || task.waitingReason || task.description || 'Blocked - No reason specified')
                        : isWaiting
                        ? (task.waitingForName || (task.waitingForType ? task.waitingForType.replace(/_/g, ' ') : null) || task.assignee?.name || 'Pending assignment')
                        : (task.assignee?.name || 'Critical Priority')
                    }
                  >
                    {isBlocked
                      ? (task.blockReason || task.waitingReason || task.description || 'Blocked - No reason specified')
                      : isWaiting
                      ? (task.waitingForName || (task.waitingForType ? task.waitingForType.replace(/_/g, ' ') : null) || task.assignee?.name || 'Pending assignment')
                      : (task.assignee?.name || 'Critical Priority')}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Stage
                  </span>
                  <span className="font-mono text-slate-300 font-semibold">
                    {currentStage}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    {isBlocked ? 'Blocked Since' : 'Waiting since'}
                  </span>
                  <span className="text-slate-300 font-mono">
                    {formatDateRelative(task.waitingSince || task.createdAt)}
                  </span>
                </div>
              </div>

              {((isBlocked && task.description && task.description !== task.blockReason) ||
                (isWaiting && task.waitingReason) ||
                (!isBlocked && !isWaiting && task.description)) && (
                <div className="mt-2.5 text-[11px] text-slate-300 bg-black/30 p-2.5 rounded-xl border border-white/5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                    {isBlocked ? 'Diagnostic / Description Note:' : isWaiting ? 'Follow-up Note:' : 'Details:'}
                  </span>
                  <span className="italic line-clamp-2">
                    "{isBlocked ? task.description : isWaiting ? task.waitingReason : task.description}"
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
