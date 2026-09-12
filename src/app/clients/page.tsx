'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { QuickAddModal } from '@/components/modals/QuickAddModal';
import { TaskDetailDrawer } from '@/components/modals/TaskDetailDrawer';
import {
  Building2,
  Plus,
  GitFork,
  CheckSquare,
  Bug,
  AlertCircle,
  Sparkles,
  Users,
  ArrowRight,
  History,
  Clock,
  Layers,
  Loader2,
} from 'lucide-react';
import { formatDateRelative, formatTime, cn } from '@/lib/utils';

function ClientsContent() {
  const searchParams = useSearchParams();
  const initialClientId = searchParams.get('id');

  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(initialClientId);
  const [clientDetail, setClientDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editActive, setEditActive] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      fetchClientDetails(selectedClientId);
    }
  }, [selectedClientId]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
        if (!selectedClientId && data.length > 0) {
          setSelectedClientId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/clients/${id}`);
      if (res.ok) {
        const data = await res.json();
        setClientDetail(data);
        setEditName(data.name);
        setEditDescription(data.description || '');
        setEditActive(data.active);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveClientEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;
    try {
      const res = await fetch(`/api/clients/${selectedClientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim(),
          active: editActive,
        }),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchClients();
        fetchClientDetails(selectedClientId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClientId || !clientDetail) return;
    if (!confirm(`Are you sure you want to delete client "${clientDetail.name}" and all associated data? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/clients/${selectedClientId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSelectedClientId(null);
        fetchClients();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-cyan-400" />
            <span>Client Operations Hub</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Client operational profiles, pipelines, assigned engineers, and activity streams
          </p>
        </div>

        <button
          onClick={() => setQuickAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Client Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {clients.map((client) => {
          const isSelected = client.id === (selectedClientId || selectedClient?.id);

          return (
            <button
              key={client.id}
              onClick={() => setSelectedClientId(client.id)}
              className={cn(
                'p-4 rounded-2xl border text-left transition-all duration-200 backdrop-blur-md relative overflow-hidden group',
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/40'
                  : 'bg-slate-900/80 border-white/10 hover:border-white/20'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-extrabold text-white group-hover:text-indigo-300 transition">
                  {client.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400">
                  {client.workflowTemplates?.length || 0} Workflows
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {client.description || 'Active industrial client.'}
              </p>

              <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-[11px]">
                <span className="text-emerald-400 font-semibold">
                  {client.activeTasksCount || 0} active
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-rose-400 font-semibold">
                  {client.bugsCount || 0} bugs
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* CLIENT DETAILS DASHBOARD */}
      {clientDetail && (
        <div className="space-y-6">
          {/* Client Header Info with Edit & Delete */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/15 backdrop-blur-md space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {clientDetail.name} Operations
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  {clientDetail.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                  🟢 {clientDetail.active ? 'Active Account' : 'Archived'}
                </span>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-white/10 transition"
                >
                  Edit Client
                </button>
                <button
                  onClick={handleDeleteClient}
                  title="Delete Client"
                  className="px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:bg-rose-900/50 hover:text-rose-200 text-xs font-semibold transition"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Workflows for this Client */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Configured Workflows & Modules ({clientDetail.workflowTemplates?.length || 0})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {clientDetail.workflowTemplates?.map((wf: any) => (
                  <div
                    key={wf.id}
                    className="p-3 rounded-xl bg-slate-950 border border-white/10 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{wf.name}</span>
                      <span className="text-[10px] font-mono text-cyan-400">{wf.recurrence}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {wf.stages?.map((s: any) => s.name).join(' → ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Split: Tasks / Bugs / Issues vs Activity History */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Active Tasks & Bugs */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Work Items & Pipeline Tasks ({clientDetail.tasks?.length || 0})
                  </h3>
                </div>

                <div className="space-y-2">
                  {clientDetail.tasks?.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-xs">
                      No tasks currently recorded for {clientDetail.name}.
                    </div>
                  ) : (
                    clientDetail.tasks?.map((task: any) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="p-3 rounded-xl bg-slate-950 border border-white/5 hover:border-indigo-500/30 transition cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="space-y-0.5 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white group-hover:text-indigo-300 truncate">
                              {task.title}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400">
                              {task.type}
                            </span>
                          </div>
                          {task.waitingForName && (
                            <span className="text-[11px] text-amber-400">
                              Waiting for: {task.waitingForName}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono font-bold text-slate-300">
                            {task.status}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Client Activity Stream */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" />
                  <span>Recent Operational Activity</span>
                </h3>

                <div className="space-y-2.5 max-h-[400px] overflow-y-auto">
                  {clientDetail.activityHistory?.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-xs">
                      No activity recorded yet.
                    </div>
                  ) : (
                    clientDetail.activityHistory?.map((log: any) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5 text-xs space-y-0.5"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-bold text-indigo-300">
                            {log.action.replace('_', ' ')}
                          </span>
                          <span>{formatDateRelative(log.createdAt)}</span>
                        </div>
                        <p className="text-slate-300 text-[11px]">
                          {log.newValue || log.oldValue || 'Status updated'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              <span>Edit Client Profile</span>
            </h3>
            <form onSubmit={handleSaveClientEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Client Name *
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
                  Description / Operational Scope
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editClientActive"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="rounded border-white/20 bg-slate-950 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="editClientActive" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Active Account
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
        onSuccess={fetchClients}
        initialTab="CLIENT"
      />

      {/* Task Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={() => {
          if (selectedClientId) fetchClientDetails(selectedClientId);
        }}
      />
    </div>
  );
}

export default function ClientsPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading Clients...</div>}>
        <ClientsContent />
      </Suspense>
    </AppLayout>
  );
}
