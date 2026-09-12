'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { TaskDetailDrawer } from '@/components/modals/TaskDetailDrawer';
import {
  GitFork,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Lock,
  Unlock,
  AlertTriangle,
  Play,
  Square,
  User,
  Check,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Trash2,
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

export default function WorkflowRunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.id as string;

  const [run, setRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchRunDetails();
  }, [runId]);

  const fetchRunDetails = async () => {
    if (!runId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workflows/runs/${runId}`);
      if (res.ok) {
        const data = await res.json();
        setRun(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRun = async () => {
    if (!confirm(`Are you sure you want to delete workflow run "${run.name}" and all of its associated stage tasks? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/workflows/runs/${runId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/tasks?type=WORKFLOW_STEP');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTaskStatus = async (task: any) => {
    const nextStatus = task.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';

    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (nextStatus === 'COMPLETED') {
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      }

      fetchRunDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOverride = async (task: any) => {
    const reason = prompt('Specify operational reason for dependency override:');
    if (!reason) return;

    try {
      await fetch('/api/workflows/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, reason }),
      });
      fetchRunDetails();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !run) {
    return (
      <AppLayout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-xs text-slate-400">Loading Pipeline State...</p>
        </div>
      </AppLayout>
    );
  }

  if (!run) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-slate-400">
          Workflow run not found.{' '}
          <Link href="/tasks?type=WORKFLOW_STEP" className="text-indigo-400 underline">
            Back to Workflows
          </Link>
        </div>
      </AppLayout>
    );
  }

  const stages = run.stageProgress || [];
  const statusBadge = getStatusBadge(run.status);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back Link & Header */}
        <div className="space-y-3">
          <Link
            href="/tasks?type=WORKFLOW_STEP"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Workflows</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {run.name}
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                  {run.client?.name}
                </span>
                <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full border', statusBadge.color)}>
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Period: <span className="font-mono text-slate-200">{run.period}</span> · Created: {formatDateRelative(run.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Current Stage</span>
                <span className="text-sm font-extrabold text-indigo-300 font-mono">
                  {run.currentStage}
                </span>
              </div>
              <button
                onClick={handleDeleteRun}
                title="Delete Workflow Run"
                className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:bg-rose-900/50 hover:text-rose-200 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* VISUAL DEV → QA → PROD PROGRESSION PIPELINE */}
        <section className="p-6 rounded-2xl bg-slate-900/90 border border-white/15 backdrop-blur-md space-y-5 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <GitFork className="w-4 h-4 text-cyan-400" />
              <span>Visual Pipeline Lifecycle (DEV → QA → PROD)</span>
            </h2>
            <span className="text-[11px] text-slate-400">
              Stages unlock automatically once prerequisite stage tasks complete
            </span>
          </div>

          {/* Stepper Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
            {stages.map((stage: any, idx: number) => {
              const isLocked = stage.isLocked;
              const isComplete = stage.isComplete;
              const inProgress = !isLocked && !isComplete;

              return (
                <div
                  key={stage.stageId}
                  className={cn(
                    'p-4 rounded-xl border transition-all duration-200 space-y-3 relative overflow-hidden',
                    isComplete && 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300',
                    inProgress && 'bg-indigo-950/30 border-indigo-500/50 text-indigo-200 shadow-md ring-1 ring-indigo-500/30',
                    isLocked && 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-80'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs font-mono bg-slate-900 border border-white/10">
                        {idx + 1}
                      </span>
                      <span className="font-extrabold text-sm tracking-wide">
                        {stage.name} STAGE
                      </span>
                    </div>

                    <div>
                      {isComplete && (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" /> Done
                        </span>
                      )}
                      {inProgress && (
                        <span className="flex items-center gap-1 text-xs font-bold text-indigo-400 animate-pulse">
                          <Clock className="w-4 h-4" /> Active
                        </span>
                      )}
                      {isLocked && (
                        <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
                          <Lock className="w-4 h-4" /> Locked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stage Task Summary */}
                  <div className="text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Tasks Complete</span>
                      <span className="font-mono">
                        {stage.completedTasks} / {stage.totalTasks}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          isComplete ? 'bg-emerald-500' : inProgress ? 'bg-indigo-500' : 'bg-slate-800'
                        )}
                        style={{
                          width: `${stage.totalTasks > 0 ? (stage.completedTasks / stage.totalTasks) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Lock Warning Message */}
                  {isLocked && (
                    <div className="p-2 rounded-lg bg-black/40 text-[11px] text-amber-400/90 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span>{stage.lockReason || 'Waiting for prerequisite stage'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* STAGES & ORDERED TASKS BREAKDOWN */}
        <div className="space-y-6">
          {stages.map((stage: any) => (
            <div
              key={stage.stageId}
              className={cn(
                'p-5 rounded-2xl bg-slate-900/80 border space-y-4 backdrop-blur-md',
                stage.isLocked ? 'border-slate-800/80 opacity-75' : 'border-white/10'
              )}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                    {stage.name} Stage
                  </span>
                  <span className="text-xs text-slate-400">
                    ({stage.completedTasks} of {stage.totalTasks} completed)
                  </span>
                </div>

                {stage.isLocked && (
                  <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Stage Locked
                  </span>
                )}
              </div>

              {/* Tasks List */}
              <div className="space-y-2">
                {stage.tasks?.map((task: any, index: number) => {
                  const statusBadge = getStatusBadge(task.status);
                  const isDone = task.status === 'COMPLETED';

                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={cn(
                        'p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 group',
                        isDone
                          ? 'bg-slate-950/40 border-white/5 opacity-80'
                          : task.status === 'WAITING_FOR_UPDATE'
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : task.status === 'BLOCKED'
                          ? 'bg-rose-950/20 border-rose-500/30'
                          : 'bg-slate-950 border-white/10 hover:border-indigo-500/40'
                      )}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTaskStatus(task);
                          }}
                          className={cn(
                            'w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0',
                            isDone
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'border-slate-700 hover:border-indigo-400 bg-slate-900'
                          )}
                        >
                          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div className="space-y-0.5 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-500">
                              #{index + 1}
                            </span>
                            <span
                              className={cn(
                                'text-xs font-bold text-white group-hover:text-indigo-300 truncate',
                                isDone && 'line-through text-slate-500'
                              )}
                            >
                              {task.title}
                            </span>
                          </div>

                          {task.waitingForName && (
                            <span className="text-[11px] text-amber-300 block">
                              Waiting for: {task.waitingForName}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {task.isOverridden && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Overridden
                          </span>
                        )}

                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded border', statusBadge.color)}>
                          {statusBadge.label}
                        </span>

                        {task.assignee && (
                          <span className="text-[11px] text-slate-300 hidden sm:inline">
                            {task.assignee.name}
                          </span>
                        )}

                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={fetchRunDetails}
      />
    </AppLayout>
  );
}
