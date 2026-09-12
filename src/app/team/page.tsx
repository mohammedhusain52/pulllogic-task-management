'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { QuickAddModal } from '@/components/modals/QuickAddModal';
import { TaskDetailDrawer } from '@/components/modals/TaskDetailDrawer';
import {
  Users,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Building2,
  ArrowRight,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { formatTime, formatDateRelative, getStatusBadge, cn } from '@/lib/utils';

function TeamContent() {
  const searchParams = useSearchParams();
  const initialMemberId = searchParams.get('id');

  const [team, setTeam] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(initialMemberId);
  const [loading, setLoading] = useState(true);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editActive, setEditActive] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/team');
      if (res.ok) {
        const data = await res.json();
        setTeam(data);
        if (!selectedMemberId && data.length > 0) {
          setSelectedMemberId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedMember = team.find((m) => m.id === (selectedMemberId || team[0]?.id));

  const openEditModal = (member: any) => {
    setEditName(member.name || '');
    setEditRole(member.role || '');
    setEditEmail(member.email || '');
    setEditActive(member.active ?? true);
    setIsEditModalOpen(true);
  };

  const handleSaveMemberEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      const res = await fetch(`/api/team/${selectedMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          role: editRole.trim(),
          email: editEmail.trim(),
          active: editActive,
        }),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchTeam();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    if (!confirm(`Are you sure you want to delete "${selectedMember.name}" from the team? Any assigned tasks will be unassigned.`)) return;
    try {
      const res = await fetch(`/api/team/${selectedMember.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSelectedMemberId(null);
        fetchTeam();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            <span>Team Workload & Capacity</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track operational assignments, live tasks, and time distribution for Mohammed, Anuj Sanklecha, Bhavish Trehan & Krishnadas M
          </p>
        </div>

        <button
          onClick={() => setQuickAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Team Members Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map((member) => {
          const isSelected = member.id === selectedMember?.id;
          const currentWorkClientName =
            typeof member.currentWork?.client === 'object'
              ? member.currentWork?.client?.name
              : member.currentWork?.client || 'Internal';

          return (
            <div
              key={member.id}
              onClick={() => setSelectedMemberId(member.id)}
              className={cn(
                'p-5 rounded-2xl border transition-all duration-200 cursor-pointer space-y-4 backdrop-blur-md relative overflow-hidden group shadow-sm',
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/40'
                  : 'bg-slate-900/80 border-white/10 hover:border-white/20'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-sm shadow">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                      {member.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {member.role || 'Data / ML Engineer'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-indigo-300 block">
                    {member.totalTimeFormatted || '0m'}
                  </span>
                  <span className="text-[10px] text-slate-500">logged</span>
                </div>
              </div>

              {/* Status Chips */}
              <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  🟢 {member.activeCount ?? 0} Active
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                  🟡 {member.waitingCount ?? member.pendingCount ?? 0} Waiting
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                  ⚪ {member.notStartedCount ?? 0} Not Started
                </span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-md border font-semibold',
                    (member.blockedCount ?? 0) > 0
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  )}
                >
                  🔴 {member.blockedCount ?? 0} Blocked
                </span>
                <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20 font-semibold">
                  ✓ {member.completedCount ?? 0} Done
                </span>
              </div>

              {/* Live Task or Available Pill */}
              <div className="pt-3 border-t border-white/5">
                {member.currentWork ? (
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Live Focus Task
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate pr-2">
                        {member.currentWork.title}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    </div>
                    <span className="text-[10px] text-indigo-400 block">
                      {currentWorkClientName} · {member.currentWork.environment || 'DEV'}
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Available — No active task</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SELECTED MEMBER WORKLOAD BREAKDOWN */}
      {selectedMember && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/15 backdrop-blur-md space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white">
                Assigned Work for {selectedMember.name}
              </h2>
              <p className="text-xs text-slate-400">
                {selectedMember.tasks?.length || 0} total tasks in queue · {selectedMember.email || 'No email set'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openEditModal(selectedMember)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-white/10 transition"
              >
                Edit Member
              </button>
              <button
                onClick={handleDeleteMember}
                className="px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:bg-rose-900/50 hover:text-rose-200 text-xs font-semibold transition"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {selectedMember.tasks?.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No active tasks assigned to {selectedMember.name}.
              </div>
            ) : (
              selectedMember.tasks?.map((task: any) => {
                const statusBadge = getStatusBadge(task.status);
                const taskClientName =
                  typeof task.client === 'object' ? task.client?.name : task.client;

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="p-3.5 rounded-xl bg-slate-950 border border-white/5 hover:border-indigo-500/30 transition cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-0.5 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-indigo-300 truncate">
                          {task.title}
                        </span>
                        {taskClientName && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-900 text-cyan-300">
                            {taskClientName}
                          </span>
                        )}
                      </div>
                      {task.workflowRun && (
                        <span className="text-[11px] text-slate-400 block">
                          ↳ {task.workflowRun.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded border', statusBadge.color)}>
                        {statusBadge.label}
                      </span>
                      <span className="text-xs font-mono text-slate-300 font-bold">
                        {formatTime(task.totalTimeSeconds)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Edit Team Member Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>Edit Team Member</span>
            </h3>
            <form onSubmit={handleSaveMemberEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Role / Specialization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Data Engineer"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@pulllogic.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editMemberActive"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="rounded border-white/20 bg-slate-950 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="editMemberActive" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Active Team Member
                </label>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={fetchTeam}
        initialTab="TEAM"
      />

      {/* Task Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={fetchTeam}
      />
    </div>
  );
}

export default function TeamPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading Team Workload...</div>}>
        <TeamContent />
      </Suspense>
    </AppLayout>
  );
}
