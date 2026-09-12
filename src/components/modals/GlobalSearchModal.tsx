'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  CheckSquare,
  Bug,
  AlertCircle,
  Sparkles,
  Building2,
  Users,
  GitFork,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTask?: (task: any) => void;
}

export function GlobalSearchModal({
  isOpen,
  onClose,
  onSelectTask,
}: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    tasks: any[];
    clients: any[];
    workflows: any[];
    team: any[];
  }>({
    tasks: [],
    clients: [],
    workflows: [],
    team: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ tasks: [], clients: [], workflows: [], team: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [taskRes, clientRes, wfRes, teamRes] = await Promise.all([
          fetch(`/api/tasks?search=${encodeURIComponent(query)}`),
          fetch('/api/clients'),
          fetch('/api/workflows/runs'),
          fetch('/api/team'),
        ]);

        const tasks = taskRes.ok ? await taskRes.json() : [];
        const clients = clientRes.ok ? await clientRes.json() : [];
        const workflows = wfRes.ok ? await wfRes.json() : [];
        const team = teamRes.ok ? await teamRes.json() : [];

        const filteredClients = clients.filter((c: any) =>
          c.name.toLowerCase().includes(query.toLowerCase())
        );
        const filteredWorkflows = workflows.filter((w: any) =>
          w.name.toLowerCase().includes(query.toLowerCase())
        );
        const filteredTeam = team.filter((t: any) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.role?.toLowerCase().includes(query.toLowerCase())
        );

        setResults({
          tasks: tasks.slice(0, 8),
          clients: filteredClients.slice(0, 4),
          workflows: filteredWorkflows.slice(0, 4),
          team: filteredTeam.slice(0, 4),
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-slate-950">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search tasks, clients (Yanmar, CNH, Zonar), team (Anuj, Bhavish, Krishnadas), workflows..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-white text-base placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-xs font-mono bg-slate-800 border border-slate-700 rounded text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results Stream */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {query.trim() === '' && (
            <div className="py-8 text-center text-slate-500 text-xs">
              Type anything to search across all Pull Logic operations...
            </div>
          )}

          {/* Tasks & Work Items */}
          {results.tasks.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-2 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tasks, Bugs & Work Items ({results.tasks.length})</span>
              </div>
              <div className="space-y-1">
                {results.tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      onClose();
                      if (onSelectTask) onSelectTask(task);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-white/10 transition text-left group"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="text-xs font-semibold text-white group-hover:text-indigo-300 truncate">
                        {task.title}
                      </span>
                      {task.client && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {task.client.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {task.status}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clients */}
          {results.clients.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Clients ({results.clients.length})</span>
              </div>
              <div className="space-y-1">
                {results.clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => {
                      onClose();
                      router.push(`/clients?id=${client.id}`);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-white/10 transition text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300">
                        {client.name}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate max-w-xs">
                        {client.description}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Workflows */}
          {results.workflows.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-2 flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5 text-emerald-400" />
                <span>Workflow Runs ({results.workflows.length})</span>
              </div>
              <div className="space-y-1">
                {results.workflows.map((wf) => (
                  <button
                    key={wf.id}
                    onClick={() => {
                      onClose();
                      router.push(`/workflows/${wf.id}`);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-white/10 transition text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                        {wf.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                        {wf.currentStage}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Team Members */}
          {results.team.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Team Members ({results.team.length})</span>
              </div>
              <div className="space-y-1">
                {results.team.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onClose();
                      router.push(`/team?id=${m.id}`);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-white/10 transition text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 text-amber-300 flex items-center justify-center font-bold text-[10px]">
                        {m.name.slice(0, 2)}
                      </div>
                      <span className="text-xs font-semibold text-white group-hover:text-amber-300">
                        {m.name}
                      </span>
                      <span className="text-[11px] text-slate-400">({m.role})</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
