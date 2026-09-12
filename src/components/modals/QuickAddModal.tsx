'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckSquare,
  Bug,
  AlertCircle,
  Sparkles,
  Building2,
  Users,
  Play,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialTab?: 'TASK' | 'BUG' | 'ISSUE' | 'FEATURE' | 'CLIENT' | 'TEAM';
}

export function QuickAddModal({
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'TASK',
}: QuickAddModalProps) {
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Task / Bug / Issue / Feature form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [severity, setSeverity] = useState('HIGH');
  const [environment, setEnvironment] = useState('DEV');
  const [status, setStatus] = useState('NOT_STARTED');
  const [dueDate, setDueDate] = useState('');
  const [waitingForType, setWaitingForType] = useState('TESTING_TEAM');
  const [waitingForName, setWaitingForName] = useState('');
  const [waitingReason, setWaitingReason] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [targetRelease, setTargetRelease] = useState('');

  // Client / Team Member form fields
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      fetchOptions();
    }
  }, [isOpen, initialTab]);

  const fetchOptions = async () => {
    try {
      const [cRes, tRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/team'),
      ]);
      if (cRes.ok) setClients(await cRes.json());
      if (tRes.ok) {
        const tData = await tRes.json();
        setTeamMembers(tData);
        const selfMember = tData.find((m: any) => m.name?.toLowerCase().includes('mohammed'));
        if (selfMember) {
          setAssigneeId(selfMember.id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setClientId('');
    const selfMember = teamMembers.find((m: any) => m.name?.toLowerCase().includes('mohammed'));
    setAssigneeId(selfMember?.id || '');
    setPriority('MEDIUM');
    setSeverity('HIGH');
    setEnvironment('DEV');
    setStatus('NOT_STARTED');
    setDueDate('');
    setWaitingForType('TESTING_TEAM');
    setWaitingForName('');
    setWaitingReason('');
    setFollowUpDate('');
    setBlockReason('');
    setStepsToReproduce('');
    setTargetRelease('');
    setName('');
    setRole('');
    setEmail('');
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (['TASK', 'BUG', 'ISSUE', 'FEATURE'].includes(tab)) {
        const payload: any = {
          title,
          description,
          type: tab,
          priority,
          environment,
          clientId: clientId || null,
          assigneeId: assigneeId || null,
          status,
          dueDate: dueDate ? new Date(dueDate) : null,
        };

        if (tab === 'BUG') {
          payload.severity = severity;
          payload.stepsToReproduce = stepsToReproduce;
        }

        if (tab === 'FEATURE') {
          payload.targetRelease = targetRelease;
        }

        if (status === 'WAITING_FOR_UPDATE') {
          payload.waitingForType = waitingForType;
          payload.waitingForName = waitingForName;
          payload.waitingReason = waitingReason;
          payload.followUpDate = followUpDate ? new Date(followUpDate) : null;
        }

        if (status === 'BLOCKED') {
          payload.blockReason = blockReason;
        }

        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create task');
        }
      } else if (tab === 'CLIENT') {
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description }),
        });
        if (!res.ok) throw new Error('Failed to create client');
      } else if (tab === 'TEAM') {
        const res = await fetch('/api/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, role, email }),
        });
        if (!res.ok) throw new Error('Failed to create team member');
      }

      resetForm();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white">Quick Add</span>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-medium">
              Create New
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 px-6 pt-3 pb-2 border-b border-white/10 overflow-x-auto bg-slate-900/50">
          {[
            { key: 'TASK', label: 'Task', icon: CheckSquare },
            { key: 'BUG', label: 'Bug', icon: Bug },
            { key: 'ISSUE', label: 'Issue', icon: AlertCircle },
            { key: 'FEATURE', label: 'Feature', icon: Sparkles },
            { key: 'CLIENT', label: 'Client', icon: Building2 },
            { key: 'TEAM', label: 'Team Member', icon: Users },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key as any)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition',
                  active
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {['TASK', 'BUG', 'ISSUE', 'FEATURE'].includes(tab) && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder={`Enter ${tab.toLowerCase()} title...`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description / Context
                </label>
                <textarea
                  rows={3}
                  placeholder="Details, specifications, notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Client
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select client (optional)</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assignee
                  </label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.name?.toLowerCase().includes('mohammed') ? '(You)' : `(${m.role || 'Member'})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical 🔴</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Environment / Stage
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="DEV">DEV</option>
                    <option value="QA">QA</option>
                    <option value="PROD">PROD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="WAITING_FOR_UPDATE">Waiting for Update 🟡</option>
                  <option value="BLOCKED">Blocked 🔴</option>
                  <option value="COMPLETED">Completed 🟢</option>
                </select>
              </div>

              {/* Waiting for Update Fields */}
              {status === 'WAITING_FOR_UPDATE' && (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-3 animate-in fade-in duration-150">
                  <div className="text-xs font-bold text-amber-300">
                    Waiting for Update Details
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-200 mb-1">
                        Waiting for Type
                      </label>
                      <select
                        value={waitingForType}
                        onChange={(e) => setWaitingForType(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-amber-500/30 text-white text-xs"
                      >
                        <option value="TESTING_TEAM">Testing Team</option>
                        <option value="CLIENT">Client</option>
                        <option value="TEAM_MEMBER">Team Member</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-200 mb-1">
                        Waiting For (Person / Team Name)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bhavish, QA Team"
                        value={waitingForName}
                        onChange={(e) => setWaitingForName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-amber-500/30 text-white text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-200 mb-1">
                        Follow-up Date
                      </label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-amber-500/30 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-200 mb-1">
                        Waiting Reason
                      </label>
                      <input
                        type="text"
                        placeholder="Reason for waiting..."
                        value={waitingReason}
                        onChange={(e) => setWaitingReason(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-amber-500/30 text-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Blocked Fields */}
              {status === 'BLOCKED' && (
                <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2 animate-in fade-in duration-150">
                  <div className="text-xs font-bold text-rose-300">
                    🔴 Block Reason & Notes
                  </div>
                  <textarea
                    rows={2}
                    required
                    placeholder="Specify why this task is blocked and what is needed to unblock it..."
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-rose-500/30 text-white text-xs"
                  />
                </div>
              )}

              {/* Bug-Specific Fields */}
              {tab === 'BUG' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-3">
                  <div className="text-xs font-bold text-slate-200">Bug Details</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Severity
                      </label>
                      <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                      >
                        <option value="CRITICAL">Critical 🔴</option>
                        <option value="HIGH">High 🟠</option>
                        <option value="MEDIUM">Medium 🔵</option>
                        <option value="LOW">Low ⚪</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Steps to Reproduce
                    </label>
                    <textarea
                      rows={2}
                      placeholder="1. Step one... 2. Step two..."
                      value={stepsToReproduce}
                      onChange={(e) => setStepsToReproduce(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Feature-Specific Fields */}
              {tab === 'FEATURE' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Target Release Version
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. v1.2, Q4 Release"
                    value={targetRelease}
                    onChange={(e) => setTargetRelease(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                  />
                </div>
              )}
            </>
          )}

          {tab === 'CLIENT' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yanmar, CNH, Zonar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description / Operational Scope
                </label>
                <textarea
                  rows={3}
                  placeholder="Client overview, modules, key contacts..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                />
              </div>
            </div>
          )}

          {tab === 'TEAM' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Member Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bhavish, Anuj"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Role / Specialization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Data Engineer, ML Ops"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="member@pulllogic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition active:scale-95 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Create {tab.toLowerCase()}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
