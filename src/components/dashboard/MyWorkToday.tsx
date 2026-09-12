'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  Play,
  Square,
  AlertTriangle,
  User,
  ArrowRight,
  MoreVertical,
  Check,
} from 'lucide-react';
import {
  formatTime,
  formatDateRelative,
  getStatusBadge,
  getPriorityBadge,
  getEnvironmentBadge,
  cn,
} from '@/lib/utils';
import confetti from 'canvas-confetti';

interface MyWorkTodayProps {
  tasks: any[];
  onSelectTask: (task: any) => void;
  onRefresh?: () => void;
}

export function MyWorkToday({ tasks, onSelectTask, onRefresh }: MyWorkTodayProps) {
  const handleToggleComplete = async (e: React.MouseEvent, task: any) => {
    e.stopPropagation();
    const nextStatus = task.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';

    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (nextStatus === 'COMPLETED') {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      }

      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTimer = async (e: React.MouseEvent, task: any) => {
    e.stopPropagation();
    const isRunning = task.timeEntries?.some((entry: any) => entry.isRunning);
    const action = isRunning ? 'stop' : 'start';

    try {
      await fetch('/api/time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, taskId: task.id }),
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
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            My Work Today
          </h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            {tasks.length}
          </span>
        </div>
        <span className="text-xs text-slate-400">
          Sorted by priority & deadline
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-white/10 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
          <h3 className="text-sm font-bold text-white">🎉 You're all caught up!</h3>
          <p className="text-xs text-slate-400">
            No active tasks currently pending for today.
          </p>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md shadow-inner">
          <div className="max-h-[380px] overflow-y-auto pr-1.5 space-y-2.5">
            {tasks.map((task) => {
              const statusBadge = getStatusBadge(task.status);
              const priorityBadge = getPriorityBadge(task.priority);
              const envBadge = getEnvironmentBadge(task.environment);
              const isRunning = task.timeEntries?.some((e: any) => e.isRunning);

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-white/5 hover:border-indigo-500/40 transition-all duration-150 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group shadow-sm hover:shadow-md"
                >
                  {/* Left Side: Checkbox + Title + Metadata */}
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={(e) => handleToggleComplete(e, task)}
                      className={cn(
                        'mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0',
                        task.status === 'COMPLETED'
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'border-slate-700 hover:border-indigo-400 bg-slate-900'
                      )}
                    >
                      {task.status === 'COMPLETED' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            'text-sm font-bold text-white group-hover:text-indigo-300 transition truncate',
                            task.status === 'COMPLETED' && 'line-through text-slate-500'
                          )}
                        >
                          {task.title}
                        </span>

                        {/* Client Tag */}
                        {task.client && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                            {task.client.name}
                          </span>
                        )}

                        {/* Workflow / Module badge */}
                        {task.workflowRun && (
                          <span className="text-[11px] text-slate-400 hidden sm:inline">
                            ↳ {task.workflowRun.name}
                          </span>
                        )}
                      </div>

                      {/* Secondary meta pills */}
                      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
                        {/* Status */}
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold', statusBadge.color)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', statusBadge.dot)} />
                          {statusBadge.label}
                        </span>

                        {/* Stage DEV/QA/PROD */}
                        {envBadge && (
                          <span className={cn('text-[10px] font-mono px-1.5 py-0.5 rounded border', envBadge.color)}>
                            {envBadge.label}
                          </span>
                        )}

                        {/* Priority */}
                        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border', priorityBadge.color)}>
                          {priorityBadge.icon} {priorityBadge.label}
                        </span>

                        {/* Due Date */}
                        {task.dueDate && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                            Due: {formatDateRelative(task.dueDate)}
                          </span>
                        )}

                        {/* Assignee if not Mohammed */}
                        {task.assignee && (
                          <span className="text-[11px] text-indigo-300 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {task.assignee.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Timer Controls & Time Spent */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-white block">
                        {formatTime(task.totalTimeSeconds)}
                      </span>
                      <span className="text-[10px] text-slate-500">logged</span>
                    </div>

                    <button
                      onClick={(e) => handleToggleTimer(e, task)}
                      title={isRunning ? 'Stop Timer' : 'Start Timer'}
                      className={cn(
                        'p-2 rounded-xl border transition shadow-sm',
                        isRunning
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30 animate-pulse'
                          : 'bg-slate-900 border-white/10 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/40'
                      )}
                    >
                      {isRunning ? (
                        <Square className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current" />
                      )}
                    </button>

                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
