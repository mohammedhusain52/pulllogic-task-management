'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  FileCode,
  ArrowLeft,
  Plus,
  Trash2,
  GitFork,
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  Loader2,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TaskTemplateForm {
  name: string;
  description: string;
  defaultAssigneeId?: string;
  estimatedMinutes: number;
}

interface StageForm {
  name: string;
  environment: string;
  taskTemplates: TaskTemplateForm[];
}

export default function WorkflowTemplateBuilderPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [clientId, setClientId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [recurrence, setRecurrence] = useState('MONTHLY');

  const [stages, setStages] = useState<StageForm[]>([
    {
      name: 'DEV',
      environment: 'DEV',
      taskTemplates: [
        { name: 'Receive Ingestion Files', description: 'Raw data ingestion', estimatedMinutes: 30 },
        { name: 'Run Transformation & Model Code', description: 'Execution', estimatedMinutes: 45 },
        { name: 'DEV Validation', description: 'Sanity checks', estimatedMinutes: 30 },
      ],
    },
    {
      name: 'QA',
      environment: 'QA',
      taskTemplates: [
        { name: 'QA Staging Deployment', description: 'Move to QA', estimatedMinutes: 20 },
        { name: 'QA Regression Testing', description: 'Full validation', estimatedMinutes: 45 },
      ],
    },
    {
      name: 'PROD',
      environment: 'PROD',
      taskTemplates: [
        { name: 'Production Deployment', description: 'Live deployment', estimatedMinutes: 30 },
        { name: 'Final Confirmation', description: 'Sign-off', estimatedMinutes: 15 },
      ],
    },
  ]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [cRes, tRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/team'),
      ]);
      if (cRes.ok) {
        const cData = await cRes.json();
        setClients(cData);
        if (cData.length > 0) setClientId(cData[0].id);
      }
      if (tRes.ok) setTeamMembers(await tRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = (stageIndex: number) => {
    const updated = [...stages];
    updated[stageIndex].taskTemplates.push({
      name: '',
      description: '',
      estimatedMinutes: 30,
    });
    setStages(updated);
  };

  const handleRemoveTask = (stageIndex: number, taskIndex: number) => {
    const updated = [...stages];
    updated[stageIndex].taskTemplates.splice(taskIndex, 1);
    setStages(updated);
  };

  const handleTaskChange = (
    stageIndex: number,
    taskIndex: number,
    field: keyof TaskTemplateForm,
    value: any
  ) => {
    const updated = [...stages];
    updated[stageIndex].taskTemplates[taskIndex] = {
      ...updated[stageIndex].taskTemplates[taskIndex],
      [field]: value,
    };
    setStages(updated);
  };

  const handleAddStage = () => {
    setStages([
      ...stages,
      {
        name: `STAGE ${stages.length + 1}`,
        environment: 'DEV',
        taskTemplates: [],
      },
    ]);
  };

  const handleRemoveStage = (stageIndex: number) => {
    const updated = [...stages];
    updated.splice(stageIndex, 1);
    setStages(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !name.trim()) {
      alert('Please fill in Client and Template Name');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/workflows/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          name: name.trim(),
          description: description.trim(),
          recurrence,
          stages: stages.map((s, idx) => ({
            name: s.name,
            environment: s.environment,
            sequence: idx + 1,
            taskTemplates: s.taskTemplates.map((t, tIdx) => ({
              name: t.name || `Task ${tIdx + 1}`,
              description: t.description,
              sequence: tIdx + 1,
              defaultAssigneeId: t.defaultAssigneeId || null,
              estimatedMinutes: Number(t.estimatedMinutes) || 30,
            })),
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save workflow template');
      }

      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      router.push('/tasks?type=WORKFLOW_STEP');
    } catch (err: any) {
      alert(err.message || 'Error creating template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Back Link */}
        <Link
          href="/tasks?type=WORKFLOW_STEP"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workflows</span>
        </Link>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <FileCode className="w-6 h-6 text-cyan-400" />
                <span>Workflow Template Builder</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Design custom operational pipelines with stages, ordered tasks, dependencies, and cadences
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Workflow Blueprint</span>
            </button>
          </div>

          {/* General Metadata Box */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              1. General Blueprint Configuration
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Client *
                </label>
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Workflow Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales, Demand Forecast, Inventory"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Recurrence Schedule
                </label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
                >
                  <option value="MANUAL">Manual / On-Demand</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="FIRST_THURSDAY_OF_MONTH">First Thursday of Month</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Description / Purpose
              </label>
              <textarea
                rows={2}
                placeholder="Explain the pipeline objective, data sources, and operational deliverables..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm"
              />
            </div>
          </div>

          {/* Stages & Ordered Task Templates */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Pipeline Stages & Ordered Subtasks
              </h2>
              <button
                type="button"
                onClick={handleAddStage}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Stage</span>
              </button>
            </div>

            <div className="space-y-4">
              {stages.map((stage, stageIdx) => (
                <div
                  key={stageIdx}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-cyan-300 font-mono text-xs flex items-center justify-center font-bold">
                        {stageIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={stage.name}
                        onChange={(e) => {
                          const updated = [...stages];
                          updated[stageIdx].name = e.target.value;
                          setStages(updated);
                        }}
                        className="font-bold text-sm text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-white/10"
                      />
                      <select
                        value={stage.environment}
                        onChange={(e) => {
                          const updated = [...stages];
                          updated[stageIdx].environment = e.target.value;
                          setStages(updated);
                        }}
                        className="text-xs bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 text-slate-300 font-mono"
                      >
                        <option value="DEV">DEV</option>
                        <option value="QA">QA</option>
                        <option value="PROD">PROD</option>
                      </select>
                    </div>

                    {stages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStage(stageIdx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Task templates in stage */}
                  <div className="space-y-2.5">
                    {stage.taskTemplates.map((taskTpl, taskIdx) => (
                      <div
                        key={taskIdx}
                        className="p-3 rounded-xl bg-slate-950 border border-white/5 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                      >
                        <span className="text-xs font-mono text-slate-500 sm:col-span-1">
                          #{taskIdx + 1}
                        </span>

                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            required
                            placeholder="Task step title..."
                            value={taskTpl.name}
                            onChange={(e) => handleTaskChange(stageIdx, taskIdx, 'name', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            placeholder="Details / description..."
                            value={taskTpl.description}
                            onChange={(e) => handleTaskChange(stageIdx, taskIdx, 'description', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-300 text-xs"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <select
                            value={taskTpl.defaultAssigneeId || ''}
                            onChange={(e) => handleTaskChange(stageIdx, taskIdx, 'defaultAssigneeId', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-300 text-xs"
                          >
                            <option value="">Default Assignee</option>
                            {teamMembers.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-1">
                          <input
                            type="number"
                            placeholder="Mins"
                            value={taskTpl.estimatedMinutes}
                            onChange={(e) => handleTaskChange(stageIdx, taskIdx, 'estimatedMinutes', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-300 text-xs font-mono"
                          />
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveTask(stageIdx, taskIdx)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleAddTask(stageIdx)}
                      className="w-full py-2 rounded-xl border border-dashed border-white/15 hover:border-indigo-500/40 text-slate-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Step to {stage.name} Stage</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
