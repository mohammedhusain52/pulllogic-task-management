'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Play,
  GitFork,
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RunWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RunWorkflowModal({ isOpen, onClose, onSuccess }: RunWorkflowModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [period, setPeriod] = useState('');
  const [customAssigneeId, setCustomAssigneeId] = useState('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Default period: Current Month Year e.g. "September 2026"
      const now = new Date();
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];
      setPeriod(`${monthNames[now.getMonth()]} ${now.getFullYear()}`);
      fetchInitialData();
    }
  }, [isOpen]);

  const fetchInitialData = async () => {
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

  // Fetch templates when client changes
  useEffect(() => {
    if (selectedClientId) {
      fetch(`/api/workflows/templates?clientId=${selectedClientId}`)
        .then((res) => res.json())
        .then((data) => {
          setTemplates(data);
          if (data.length > 0) {
            setSelectedTemplateId(data[0].id);
          } else {
            setSelectedTemplateId('');
          }
        })
        .catch((err) => console.error(err));
    } else {
      setTemplates([]);
      setSelectedTemplateId('');
    }
  }, [selectedClientId]);

  if (!isOpen) return null;

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId || !period.trim()) {
      setError('Please select a template and period');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/workflows/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowTemplateId: selectedTemplateId,
          period: period.trim(),
          customAssigneeId: customAssigneeId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate workflow run');
      }

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });

      onClose();
      if (onSuccess) onSuccess();
      router.push(`/workflows/${data.id}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Play className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Run Workflow</h2>
              <p className="text-[11px] text-slate-400">
                Instantiate an operational pipeline with ordered subtasks & DEV → QA → PROD gating
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Select Client */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              1. Select Client *
            </label>
            <select
              required
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Choose a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.workflowTemplates?.length || 0} templates)
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Workflow Template */}
          {selectedClientId && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                2. Select Workflow Template *
              </label>
              {templates.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-950 border border-white/5 text-slate-400 text-xs">
                  No workflow templates found for this client. Create one in Workflows builder.
                </div>
              ) : (
                <select
                  required
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — ({t.recurrence})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Step 3: Run Period */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              3. Period / Execution Label *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. September 2026, Week 37 2026, Q3 Final"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Step 4: Optional Assignee */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              4. Default Assignee (Optional Override)
            </label>
            <select
              value={customAssigneeId}
              onChange={(e) => setCustomAssigneeId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Use template defaults / Unassigned</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          {/* Template Preview Box */}
          {selectedTemplate && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-white/10 space-y-2 text-xs">
              <div className="font-semibold text-slate-200 flex items-center justify-between">
                <span>Stages Preview</span>
                <span className="text-slate-400">
                  {selectedTemplate.stages?.length || 0} Stages
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {selectedTemplate.stages?.map((stage: any, idx: number) => (
                  <React.Fragment key={stage.id}>
                    <div className="px-2.5 py-1 rounded bg-slate-900 border border-white/10 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                      {stage.name} ({stage.taskTemplates?.length || 0} tasks)
                    </div>
                    {idx < selectedTemplate.stages.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
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
              disabled={loading || !selectedTemplateId}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>Create Workflow Run</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
