'use client';

import React from 'react';
import Link from 'next/link';
import {
  GitFork,
  Calendar,
  Play,
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react';

interface UpcomingWorkflowsProps {
  recurringTemplates: any[];
  activeRuns: any[];
  onOpenRunWorkflow: () => void;
}

export function UpcomingWorkflows({
  recurringTemplates,
  activeRuns,
  onOpenRunWorkflow,
}: UpcomingWorkflowsProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitFork className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Upcoming & Recurring Workflows
          </h2>
        </div>
        <button
          onClick={onOpenRunWorkflow}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Trigger Workflow</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Recurring Schedules */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Automated Cadence
            </span>
            <span className="text-[11px] text-slate-400">
              {recurringTemplates.length} Configured
            </span>
          </div>

          <div className="space-y-2">
            {recurringTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-2.5 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">
                      {tpl.client?.name} · {tpl.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-cyan-400" />
                    {tpl.recurrence === 'FIRST_THURSDAY_OF_MONTH'
                      ? 'First Thursday of every month'
                      : tpl.recurrence}
                  </span>
                </div>

                <button
                  onClick={onOpenRunWorkflow}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 text-[11px] font-semibold transition"
                >
                  Run
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Active Runs Pipeline Snapshot */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Active Pipeline Runs
            </span>
            <Link
              href="/tasks?type=WORKFLOW_STEP"
              className="text-[11px] text-indigo-400 hover:underline"
            >
              All Runs →
            </Link>
          </div>

          <div className="space-y-2">
            {activeRuns.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs">
                No active runs in progress.
              </div>
            ) : (
              activeRuns.map((run) => (
                <Link
                  key={run.id}
                  href={`/workflows/${run.id}`}
                  className="p-2.5 rounded-xl bg-slate-950 border border-white/5 hover:border-indigo-500/30 flex items-center justify-between transition group block"
                >
                  <div className="overflow-hidden pr-2">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 block truncate">
                      {run.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {run.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0} /{' '}
                      {run.tasks?.length || 0} tasks done
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {run.currentStage}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
