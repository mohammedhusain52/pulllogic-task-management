'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { TaskDetailDrawer } from '@/components/modals/TaskDetailDrawer';
import { QuickAddModal } from '@/components/modals/QuickAddModal';
import { RunWorkflowModal } from '@/components/modals/RunWorkflowModal';
import {
  CheckSquare,
  List,
  Kanban,
  Plus,
  Search,
  CheckCircle2,
  GitFork,
  Bug,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
  User,
  Clock,
  Play,
  FileCode,
  Calendar,
  Building2,
  Trash2,
  Edit,
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

const TASK_TABS = [
  { key: 'TASK', label: 'Tasks', icon: CheckSquare, color: 'text-indigo-400' },
  { key: 'WORKFLOW_STEP', label: 'Workflow', icon: GitFork, color: 'text-cyan-400' },
  { key: 'BUG', label: 'Bug', icon: Bug, color: 'text-rose-400' },
  { key: 'ISSUE', label: 'Issues', icon: AlertCircle, color: 'text-amber-400' },
  { key: 'FEATURE', label: 'Features', icon: Sparkles, color: 'text-purple-400' },
];

const KANBAN_COLUMNS = [
  { key: 'NOT_STARTED', label: 'Not Started', color: 'border-slate-700 bg-slate-900/40' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-blue-500/30 bg-blue-950/20' },
  { key: 'WAITING_FOR_UPDATE', label: 'Waiting for Update', color: 'border-amber-500/30 bg-amber-950/20' },
  { key: 'BLOCKED', label: 'Blocked', color: 'border-rose-500/30 bg-rose-950/20' },
  { key: 'COMPLETED', label: 'Completed', color: 'border-emerald-500/30 bg-emerald-950/20' },
];

function TasksContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'TASK';
  const initialStatus = searchParams.get('status') || 'ALL';

  const [activeTab, setActiveTab] = useState<string>(initialType);
  const [workflowSubView, setWorkflowSubView] = useState<'RUNS' | 'TASKS' | 'TEMPLATES'>('RUNS');
  const [tasks, setTasks] = useState<any[]>([]);
  const [workflowRuns, setWorkflowRuns] = useState<any[]>([]);
  const [workflowTemplates, setWorkflowTemplates] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'LIST' | 'KANBAN'>('LIST');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [clientFilter, setClientFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [envFilter, setEnvFilter] = useState('ALL');

  // Modals & Selection
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [runWorkflowModalOpen, setRunWorkflowModalOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    fetchMetadata();
    fetchTabCounts();
    fetchWorkflowData();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [activeTab, statusFilter, clientFilter, assigneeFilter, priorityFilter, envFilter]);

  const fetchMetadata = async () => {
    try {
      const [cRes, tRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/team'),
      ]);
      if (cRes.ok) setClients(await cRes.json());
      if (tRes.ok) setTeamMembers(await tRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWorkflowData = async () => {
    try {
      const [runsRes, tplRes] = await Promise.all([
        fetch('/api/workflows/runs'),
        fetch('/api/workflows/templates'),
      ]);
      if (runsRes.ok) setWorkflowRuns(await runsRes.json());
      if (tplRes.ok) setWorkflowTemplates(await tplRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTabCounts = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const all = await res.json();
        const map: Record<string, number> = {
          TASK: 0,
          WORKFLOW_STEP: 0,
          BUG: 0,
          ISSUE: 0,
          FEATURE: 0,
        };
        all.forEach((item: any) => {
          if (map[item.type] !== undefined) {
            map[item.type]++;
          }
        });
        setCounts(map);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('type', activeTab);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (clientFilter !== 'ALL') params.append('clientId', clientFilter);
      if (assigneeFilter !== 'ALL') params.append('assigneeId', assigneeFilter);
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter);
      if (envFilter !== 'ALL') params.append('environment', envFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTaskDirect = async (e: React.MouseEvent, taskId: string, title: string) => {
    e.stopPropagation();
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTasks();
        fetchTabCounts();
        fetchWorkflowData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWorkflowRun = async (e: React.MouseEvent, runId: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete workflow run "${name}"? All associated tasks will be removed.`)) return;
    try {
      const res = await fetch(`/api/workflows/runs/${runId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchWorkflowData();
        fetchTasks();
        fetchTabCounts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTemplate = async (e: React.MouseEvent, templateId: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete workflow template "${name}"?`)) return;
    try {
      const res = await fetch(`/api/workflows/templates/${templateId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchWorkflowData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentTabObj = TASK_TABS.find((t) => t.key === activeTab) || TASK_TABS[0];

  const getQuickAddInitialTab = (): 'TASK' | 'BUG' | 'ISSUE' | 'FEATURE' => {
    if (activeTab === 'BUG') return 'BUG';
    if (activeTab === 'ISSUE') return 'ISSUE';
    if (activeTab === 'FEATURE') return 'FEATURE';
    return 'TASK';
  };

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* 5 PRIMARY TABS (Tasks, Workflow, Bug, Issues, Features) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-white/10" suppressHydrationWarning>
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-950/80 rounded-2xl border border-white/10" suppressHydrationWarning>
          {TASK_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const count = counts[tab.key] || 0;

            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setStatusFilter('ALL');
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 whitespace-nowrap',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-white' : tab.color)} />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'px-2 py-0.2 rounded-full text-[10px] font-mono font-bold',
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-900 text-slate-400'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Buttons for Current Tab */}
        {activeTab === 'WORKFLOW_STEP' ? (
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/workflows/builder"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold border border-white/10 transition"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>Template Builder</span>
            </Link>

            <button
              onClick={() => setRunWorkflowModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run Workflow</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-white/10">
              <button
                onClick={() => setViewMode('LIST')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition',
                  viewMode === 'LIST'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
              <button
                onClick={() => setViewMode('KANBAN')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition',
                  viewMode === 'KANBAN'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
            </div>

            <button
              onClick={() => setQuickAddOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add {currentTabObj.label}</span>
            </button>
          </div>
        )}
      </div>

      {/* WORKFLOW TAB: COMPLETE UNIFIED HUB (Runs, Step Tasks, Blueprints) */}
      {activeTab === 'WORKFLOW_STEP' && (
        <div className="space-y-5">
          {/* Sub-navigation inside Workflow Tab */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWorkflowSubView('RUNS')}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition',
                  workflowSubView === 'RUNS'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Pipeline Runs ({workflowRuns.length})</span>
              </button>

              <button
                onClick={() => setWorkflowSubView('TASKS')}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition',
                  workflowSubView === 'TASKS'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Pipeline Step Tasks ({tasks.length})</span>
              </button>

              <button
                onClick={() => setWorkflowSubView('TEMPLATES')}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition',
                  workflowSubView === 'TEMPLATES'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>Templates & Blueprints ({workflowTemplates.length})</span>
              </button>
            </div>

            {workflowSubView === 'TASKS' && (
              <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-white/10">
                <button
                  onClick={() => setViewMode('LIST')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition',
                    viewMode === 'LIST'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>List</span>
                </button>
                <button
                  onClick={() => setViewMode('KANBAN')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition',
                    viewMode === 'KANBAN'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  <Kanban className="w-3.5 h-3.5" />
                  <span>Kanban</span>
                </button>
              </div>
            )}
          </div>

          {/* SUB-VIEW 1: PIPELINE RUNS */}
          {workflowSubView === 'RUNS' && (
            <div className="space-y-3">
              {workflowRuns.length === 0 ? (
                <div className="p-12 rounded-2xl bg-slate-900/60 border border-white/10 text-center space-y-3">
                  <GitFork className="w-10 h-10 text-cyan-400 mx-auto opacity-70" />
                  <h3 className="text-base font-bold text-white">No Workflow Runs Active</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Instantiate your recurring data/ML workflow pipeline for Yanmar, CNH, or Zonar.
                  </p>
                  <button
                    onClick={() => setRunWorkflowModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                  >
                    Run First Workflow
                  </button>
                </div>
              ) : (
                workflowRuns.map((run) => {
                  const totalTasks = run.tasks?.length || 0;
                  const completedTasks =
                    run.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
                  const progressPct =
                    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                  const statusBadge = getStatusBadge(run.status);

                  return (
                    <Link
                      key={run.id}
                      href={`/workflows/${run.id}`}
                      className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-white/10 hover:border-cyan-500/40 transition-all duration-200 block group backdrop-blur-md space-y-3 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition">
                              {run.name}
                            </h3>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                              {run.client?.name}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Period: <span className="font-mono text-slate-200">{run.period}</span> · Template:{' '}
                            {run.workflowTemplate?.name}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'px-2.5 py-1 rounded-lg border text-xs font-semibold',
                              statusBadge.color
                            )}
                          >
                            {statusBadge.label}
                          </span>
                          <div className="px-3 py-1 rounded-lg bg-slate-950 border border-white/10 text-xs font-mono font-bold text-indigo-300">
                            Current: {run.currentStage}
                          </div>
                          <button
                            onClick={(e) => handleDeleteWorkflowRun(e, run.id, run.name)}
                            title="Delete Run"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition" />
                        </div>
                      </div>

                      {/* Progress Bar & Stage Flow */}
                      <div className="space-y-1.5 pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>
                            {completedTasks} of {totalTasks} tasks completed ({progressPct}%)
                          </span>
                          <span className="font-mono text-slate-300">
                            {run.workflowTemplate?.stages?.map((s: any) => s.name).join(' → ')}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          )}

          {/* SUB-VIEW 3: TEMPLATES & BLUEPRINTS */}
          {workflowSubView === 'TEMPLATES' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflowTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3 flex flex-col justify-between backdrop-blur-md group hover:border-cyan-500/40 transition"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                        {tpl.client?.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400">
                        {tpl.recurrence}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mt-2 group-hover:text-cyan-300 transition">
                      {tpl.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {tpl.description || 'Custom data operations workflow blueprint.'}
                    </p>

                    <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        Defined Stages ({tpl.stages?.length || 0})
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {tpl.stages?.map((st: any) => (
                          <span
                            key={st.id}
                            className="px-2 py-0.5 rounded bg-slate-950 border border-white/10 text-[10px] font-mono text-slate-300"
                          >
                            {st.name} ({st.taskTemplates?.length || 0})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {tpl._count?.runs || 0} historical runs
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleDeleteTemplate(e, tpl.id, tpl.name)}
                        title="Delete Blueprint"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setRunWorkflowModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                      >
                        <Play className="w-3 h-3" />
                        <span>Run</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FILTER BAR (Active on normal tabs OR workflow step tasks sub-view) */}
      {(activeTab !== 'WORKFLOW_STEP' || workflowSubView === 'TASKS') && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {/* Search */}
            <div className="relative sm:col-span-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder={`Search ${currentTabObj.label.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchTasks()}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_UPDATE">Waiting for Update</option>
              <option value="BLOCKED">Blocked</option>
              <option value="COMPLETED">Completed</option>
            </select>

            {/* Client */}
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"
            >
              <option value="ALL">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Assignee */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"
            >
              <option value="ALL">All Assignees</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            {/* Priority */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Stage */}
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"
            >
              <option value="ALL">All Stages</option>
              <option value="DEV">DEV</option>
              <option value="QA">QA</option>
              <option value="PROD">PROD</option>
            </select>
          </div>
        </div>
      )}

      {/* TASK / BUG / ISSUE / FEATURE LIST & KANBAN OR WORKFLOW STEP TASKS */}
      {(activeTab !== 'WORKFLOW_STEP' || workflowSubView === 'TASKS') && (
        <>
          {/* LIST VIEW */}
          {viewMode === 'LIST' && (
            <div className="space-y-2.5">
              {tasks.length === 0 ? (
                <div className="p-12 rounded-2xl bg-slate-900/60 border border-white/10 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
                  <h3 className="text-sm font-bold text-white">
                    No {currentTabObj.label} Found
                  </h3>
                  <p className="text-xs text-slate-400">
                    Try clearing your filters or create a new {currentTabObj.label.toLowerCase()}.
                  </p>
                </div>
              ) : (
                tasks.map((task) => {
                  const statusBadge = getStatusBadge(task.status);
                  const priorityBadge = getPriorityBadge(task.priority);
                  const envBadge = getEnvironmentBadge(task.environment);
                  const taskClientName =
                    typeof task.client === 'object' ? task.client?.name : task.client;

                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-white/10 hover:border-indigo-500/40 transition-all duration-150 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group backdrop-blur-md"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition truncate">
                              {task.title}
                            </span>
                            {taskClientName && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                                {taskClientName}
                              </span>
                            )}
                            {task.workflowRun && (
                              <span className="text-[11px] text-slate-400 hidden sm:inline">
                                ↳ {task.workflowRun.name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold',
                                statusBadge.color
                              )}
                            >
                              <span className={cn('w-1.5 h-1.5 rounded-full', statusBadge.dot)} />
                              {statusBadge.label}
                            </span>

                            {envBadge && (
                              <span
                                className={cn(
                                  'text-[10px] font-mono px-1.5 py-0.5 rounded border',
                                  envBadge.color
                                )}
                              >
                                {envBadge.label}
                              </span>
                            )}

                            <span
                              className={cn(
                                'text-[10px] font-semibold px-1.5 py-0.5 rounded border',
                                priorityBadge.color
                              )}
                            >
                              {priorityBadge.icon} {priorityBadge.label}
                            </span>

                            {task.dueDate && (
                              <span className="text-[11px] text-slate-400 font-mono">
                                Due: {formatDateRelative(task.dueDate)}
                              </span>
                            )}

                            {task.assignee && (
                              <span className="text-[11px] text-indigo-300 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {task.assignee.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <span className="text-xs font-mono text-slate-300 font-bold">
                          {formatTime(task.totalTimeSeconds)}
                        </span>
                        <button
                          onClick={(e) => handleDeleteTaskDirect(e, task.id, task.title)}
                          title="Delete"
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* KANBAN VIEW */}
          {viewMode === 'KANBAN' && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-6">
              {KANBAN_COLUMNS.map((col) => {
                const colTasks = tasks.filter((t) => t.status === col.key);

                return (
                  <div
                    key={col.key}
                    className={cn(
                      'p-3.5 rounded-2xl border flex flex-col min-h-[500px] backdrop-blur-md',
                      col.color
                    )}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        {col.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                        {colTasks.length}
                      </span>
                    </div>

                    <div className="flex-1 space-y-2.5 overflow-y-auto">
                      {colTasks.map((task) => {
                        const priorityBadge = getPriorityBadge(task.priority);
                        const envBadge = getEnvironmentBadge(task.environment);
                        const taskClientName =
                          typeof task.client === 'object' ? task.client?.name : task.client;

                        return (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTaskId(task.id)}
                            className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-white/10 hover:border-indigo-500/40 transition cursor-pointer space-y-2 group shadow-sm"
                          >
                            <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 line-clamp-2">
                              {task.title}
                            </h4>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              {taskClientName && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-900 text-cyan-300">
                                  {taskClientName}
                                </span>
                              )}
                              {envBadge && (
                                <span
                                  className={cn(
                                    'text-[9px] font-mono px-1 py-0.2 rounded border',
                                    envBadge.color
                                  )}
                                >
                                  {envBadge.label}
                                </span>
                              )}
                              <span
                                className={cn(
                                  'text-[9px] font-semibold px-1.5 py-0.2 rounded border',
                                  priorityBadge.color
                                )}
                              >
                                {priorityBadge.label}
                              </span>
                            </div>

                            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                              <span>{task.assignee ? task.assignee.name : 'Unassigned'}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-slate-300">
                                  {formatTime(task.totalTimeSeconds)}
                                </span>
                                <button
                                  onClick={(e) => handleDeleteTaskDirect(e, task.id, task.title)}
                                  title="Delete"
                                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Task Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={() => {
          fetchTasks();
          fetchTabCounts();
          fetchWorkflowData();
        }}
      />

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={() => {
          fetchTasks();
          fetchTabCounts();
        }}
        initialTab={getQuickAddInitialTab()}
      />

      {/* Run Workflow Modal */}
      <RunWorkflowModal
        isOpen={runWorkflowModalOpen}
        onClose={() => setRunWorkflowModalOpen(false)}
        onSuccess={() => {
          fetchWorkflowData();
          fetchTasks();
          fetchTabCounts();
        }}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading Tasks & Workflows...</div>}>
        <TasksContent />
      </Suspense>
    </AppLayout>
  );
}
