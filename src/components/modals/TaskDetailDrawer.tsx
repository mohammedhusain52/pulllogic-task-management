'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Clock,
  Play,
  Square,
  Paperclip,
  MessageSquare,
  History,
  CheckCircle2,
  AlertTriangle,
  User,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  UploadCloud,
  CheckSquare,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Loader2,
} from 'lucide-react';
import {
  formatTime,
  formatDateTime,
  formatDateRelative,
  getStatusBadge,
  getPriorityBadge,
  getEnvironmentBadge,
  cn,
} from '@/lib/utils';
import confetti from 'canvas-confetti';
import { DatePicker } from '@/components/ui/DatePicker';

interface TaskDetailDrawerProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function TaskDetailDrawer({
  taskId,
  isOpen,
  onClose,
  onUpdate,
}: TaskDetailDrawerProps) {
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'COMMENTS' | 'ATTACHMENTS' | 'ACTIVITY'>('DETAILS');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  // Comment input
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // New subtask input
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Live timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (taskId && isOpen) {
      fetchTask();
      fetchMetadata();
    }
  }, [taskId, isOpen]);

  // Live timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const fetchTask = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
        setElapsedSeconds(data.totalTimeSeconds || 0);

        // Check if timer is running
        const running = data.timeEntries?.find((e: any) => e.isRunning);
        if (running) {
          setIsTimerRunning(true);
          setActiveTimerId(running.id);
        } else {
          setIsTimerRunning(false);
          setActiveTimerId(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        fetch('/api/team'),
        fetch('/api/clients'),
      ]);
      if (tRes.ok) setTeamMembers(await tRes.json());
      if (cRes.ok) setClients(await cRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const updateField = async (fields: Record<string, any>) => {
    if (!task) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        const updated = await res.json();
        setTask((prev: any) => ({ ...prev, ...updated }));
        if (onUpdate) onUpdate();
        if (fields.status === 'COMPLETED') {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    if (!confirm(`Are you sure you want to delete task "${task.title}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      if (res.ok) {
        onClose();
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!task) return;
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchTask();
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!task) return;
    if (!confirm('Are you sure you want to delete this attachment?')) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/attachments?attachmentId=${attachmentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchTask();
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTimeEntry = async (timeEntryId: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return;
    try {
      const res = await fetch(`/api/time?id=${timeEntryId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTask();
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartTimer = async () => {
    if (!task) return;
    try {
      const res = await fetch('/api/time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', taskId: task.id }),
      });
      if (res.ok) {
        const entry = await res.json();
        setIsTimerRunning(true);
        setActiveTimerId(entry.id);
        fetchTask();
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStopTimer = async () => {
    if (!task) return;
    try {
      const res = await fetch('/api/time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop', taskId: task.id, timeEntryId: activeTimerId }),
      });
      if (res.ok) {
        setIsTimerRunning(false);
        setActiveTimerId(null);
        fetchTask();
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !task) return;
    setCommentLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          authorName: 'Mohammed Husain',
          entityType: task.type,
        }),
      });
      if (res.ok) {
        setNewComment('');
        fetchTask();
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !task) return;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSubtaskTitle.trim(),
          parentTaskId: task.id,
          clientId: task.clientId,
          type: 'TASK',
          environment: task.environment,
        }),
      });
      if (res.ok) {
        setNewSubtaskTitle('');
        fetchTask();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!task) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploadedData = await uploadRes.json();

      await fetch(`/api/tasks/${task.id}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: uploadedData.fileName,
          fileUrl: uploadedData.fileUrl,
          mimeType: uploadedData.mimeType,
          size: uploadedData.size,
          entityType: task.type,
        }),
      });

      fetchTask();
    } catch (err) {
      console.error(err);
      alert('Failed to upload attachment');
    } finally {
      setUploading(false);
    }
  };

  // Clipboard image paste support
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          await handleFileUpload(file);
          break;
        }
      }
    }
  };

  const handleOverride = async () => {
    if (!task) return;
    const reason = prompt('Reason for overriding dependency requirement:');
    if (!reason) return;

    try {
      const res = await fetch('/api/workflows/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, reason }),
      });
      if (res.ok) {
        fetchTask();
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen || !taskId) return null;

  const statusBadge = task ? getStatusBadge(task.status) : null;
  const priorityBadge = task ? getPriorityBadge(task.priority) : null;
  const envBadge = task ? getEnvironmentBadge(task.environment) : null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-opacity duration-300',
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          'fixed inset-y-0 right-0 max-w-4xl w-full bg-[#090D16] border-l border-white/10 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        onClick={(e) => e.stopPropagation()}
        onPaste={handlePaste}
      >
        {loading && !task ? (
          <div className="flex-1 flex items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-xs text-slate-400">Loading details...</span>
          </div>
        ) : task ? (
          <>
            {/* Header */}
            <div className="p-5 border-b border-white/10 bg-slate-950/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-mono font-semibold">
                  {task.type}
                </span>
                {envBadge && (
                  <span className={cn('text-xs px-2 py-0.5 rounded border font-mono font-semibold', envBadge.color)}>
                    {envBadge.label}
                  </span>
                )}
                {task.workflowRun && (
                  <span className="hidden sm:inline-flex text-xs text-slate-400 truncate max-w-xs">
                    ↳ {task.workflowRun.name}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Live Stopwatch Button */}
                {isTimerRunning ? (
                  <button
                    onClick={handleStopTimer}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-semibold hover:bg-rose-500/30 transition animate-pulse"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>{formatTime(elapsedSeconds)}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartTimer}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 text-xs font-semibold hover:bg-indigo-600/30 transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Timer ({formatTime(task.totalTimeSeconds)})</span>
                  </button>
                )}

                {/* Delete Task Button */}
                <button
                  onClick={handleDeleteTask}
                  title="Delete Task"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-400 hover:bg-rose-900/40 hover:text-rose-200 transition text-xs font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Content + Sidebar Split */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* LEFT / MAIN PANEL */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {/* Title */}
                <div>
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) => setTask({ ...task, title: e.target.value })}
                    onBlur={() => updateField({ title: task.title })}
                    className="w-full text-xl font-bold text-white bg-transparent border-b border-transparent hover:border-white/20 focus:border-indigo-500 focus:outline-none pb-1 transition"
                  />
                </div>

                {/* Waiting for banner if WAITING_FOR_UPDATE */}
                {task.status === 'WAITING_FOR_UPDATE' && (
                  <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Waiting for Update
                      </span>
                      {task.waitingSince && (
                        <span className="text-[11px] text-amber-300 font-mono">
                          Waiting since {formatDateRelative(task.waitingSince)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-amber-200">
                      <strong>Waiting for:</strong>{' '}
                      {task.waitingForName ||
                        (task.waitingForType ? task.waitingForType.replace(/_/g, ' ') : null) ||
                        'Unassigned'}
                    </div>
                    {task.waitingReason && (
                      <div className="text-xs text-slate-300 italic">
                        "{task.waitingReason}"
                      </div>
                    )}
                    {task.followUpDate && (
                      <div className="text-[11px] text-amber-400">
                        Follow-up scheduled: {formatDateTime(task.followUpDate)}
                      </div>
                    )}
                  </div>
                )}

                {/* Blocked banner if BLOCKED */}
                {task.status === 'BLOCKED' && (
                  <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        🔴 Blocked
                      </span>
                      <button
                        onClick={handleOverride}
                        className="text-xs text-rose-200 hover:text-white underline font-medium"
                      >
                        Override Dependency
                      </button>
                    </div>
                    <p className="text-xs text-rose-200">
                      {task.blockReason || 'Blocked without reason.'}
                    </p>
                  </div>
                )}

                {/* Tabs: Details, Comments, Attachments, Activity */}
                <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                  {[
                    { key: 'DETAILS', label: 'Details & Subtasks', icon: CheckSquare },
                    { key: 'COMMENTS', label: `Comments (${task.comments?.length || 0})`, icon: MessageSquare },
                    { key: 'ATTACHMENTS', label: `Attachments (${task.attachments?.length || 0})`, icon: Paperclip },
                    { key: 'ACTIVITY', label: `History (${task.activityHistory?.length || 0})`, icon: History },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition',
                          active
                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* TAB 1: DETAILS & SUBTASKS */}
                {activeTab === 'DETAILS' && (
                  <div className="space-y-5">
                    {/* Description */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Description / Operational Notes
                      </label>
                      <textarea
                        rows={4}
                        value={task.description || ''}
                        onChange={(e) => setTask({ ...task, description: e.target.value })}
                        onBlur={() => updateField({ description: task.description })}
                        placeholder="Add detailed operational context, steps, or logs..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Bug specifics if BUG */}
                    {task.type === 'BUG' && (
                      <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-white/10">
                        <div className="text-xs font-bold text-slate-300">Bug Diagnostics</div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Steps to Reproduce</label>
                          <textarea
                            rows={2}
                            value={task.stepsToReproduce || ''}
                            onChange={(e) => setTask({ ...task, stepsToReproduce: e.target.value })}
                            onBlur={() => updateField({ stepsToReproduce: task.stepsToReproduce })}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Subtasks Checklist */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300">
                          Subtasks & Checklist
                        </label>
                        <span className="text-[11px] text-slate-400">
                          {task.subTasks?.filter((s: any) => s.status === 'COMPLETED').length || 0} of{' '}
                          {task.subTasks?.length || 0} completed
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {task.subTasks?.map((subtask: any) => (
                          <div
                            key={subtask.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-white/5 hover:border-white/15 transition group"
                          >
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={subtask.status === 'COMPLETED'}
                                onChange={async () => {
                                  const nextStatus = subtask.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
                                  await fetch(`/api/tasks/${subtask.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: nextStatus }),
                                  });
                                  fetchTask();
                                }}
                                className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span
                                className={cn(
                                  'text-xs text-slate-200',
                                  subtask.status === 'COMPLETED' && 'line-through text-slate-500'
                                )}
                              >
                                {subtask.title}
                              </span>
                            </label>
                            <button
                              onClick={async () => {
                                await fetch(`/api/tasks/${subtask.id}`, { method: 'DELETE' });
                                fetchTask();
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add subtask input */}
                      <form onSubmit={handleAddSubtask} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add subtask / action item..."
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* TAB 2: COMMENTS / NOTES */}
                {activeTab === 'COMMENTS' && (
                  <div className="space-y-4">
                    <form onSubmit={handleAddComment} className="space-y-2">
                      <textarea
                        rows={3}
                        required
                        placeholder="Add operational update, meeting note, or handoff comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={commentLoading || !newComment.trim()}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition disabled:opacity-50"
                        >
                          {commentLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                          <span>Post Note</span>
                        </button>
                      </div>
                    </form>

                    <div className="space-y-3 pt-2">
                      {task.comments?.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 text-xs">
                          No comments yet. Leave a note above.
                        </div>
                      ) : (
                        task.comments?.map((comment: any) => (
                          <div
                            key={comment.id}
                            className="p-3.5 rounded-xl bg-slate-950 border border-white/5 space-y-1 group relative"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-indigo-300">
                                {comment.authorName}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500">
                                  {formatDateTime(comment.createdAt)}
                                </span>
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  title="Delete comment"
                                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-slate-200 whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: ATTACHMENTS */}
                {activeTab === 'ATTACHMENTS' && (
                  <div className="space-y-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-6 rounded-2xl border-2 border-dashed border-white/15 hover:border-indigo-500/50 bg-slate-950/60 cursor-pointer flex flex-col items-center justify-center text-center group transition"
                    >
                      <UploadCloud className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition mb-2" />
                      <p className="text-xs font-semibold text-white">
                        Click to upload file or screenshot
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Or simply press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px]">Ctrl+V / Cmd+V</kbd> to paste screenshot directly from clipboard
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {task.attachments?.map((att: any) => (
                        <div
                          key={att.id}
                          className="p-3 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <Paperclip className="w-4 h-4 text-indigo-400 shrink-0" />
                            <div className="overflow-hidden">
                              <a
                                href={att.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold text-white hover:text-indigo-300 truncate block"
                              >
                                {att.fileName}
                              </a>
                              <span className="text-[10px] text-slate-500">
                                {Math.round((att.size || 0) / 1024)} KB
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteAttachment(att.id)}
                            title="Delete attachment"
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: ACTIVITY HISTORY */}
                {activeTab === 'ACTIVITY' && (
                  <div className="space-y-3">
                    {task.activityHistory?.map((log: any) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 text-xs p-2.5 rounded-lg bg-slate-950/60 border border-white/5"
                      >
                        <History className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <span className="font-semibold text-slate-200">
                            {log.action.replace('_', ' ')}
                          </span>
                          {log.oldValue && log.newValue && (
                            <span className="text-slate-400 ml-1">
                              from <code className="text-slate-300">{log.oldValue}</code> →{' '}
                              <code className="text-indigo-300">{log.newValue}</code>
                            </span>
                          )}
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            {formatDateTime(log.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT META PANEL */}
              <div className="w-full md:w-80 p-6 border-t md:border-t-0 md:border-l border-white/10 bg-slate-950/50 space-y-5 shrink-0 overflow-y-auto">
                {/* Status */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Status
                  </label>
                  <select
                    value={task.status}
                    onChange={(e) => updateField({ status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-semibold"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WAITING_FOR_UPDATE">Waiting for Update 🟡</option>
                    <option value="BLOCKED">Blocked 🔴</option>
                    <option value="COMPLETED">Completed 🟢</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={task.priority}
                    onChange={(e) => updateField({ priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-semibold"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical 🔴</option>
                  </select>
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Assignee
                  </label>
                  <select
                    value={task.assigneeId || ''}
                    onChange={(e) => updateField({ assigneeId: e.target.value || null })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-semibold"
                  >
                    <option value="">Mohammed Husain (Self / Unassigned)</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Client */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Client
                  </label>
                  <select
                    value={task.clientId || ''}
                    onChange={(e) => updateField({ clientId: e.target.value || null })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-semibold"
                  >
                    <option value="">None / Internal</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Environment */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Environment Stage
                  </label>
                  <select
                    value={task.environment || 'DEV'}
                    onChange={(e) => updateField({ environment: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-semibold"
                  >
                    <option value="DEV">DEV</option>
                    <option value="QA">QA</option>
                    <option value="PROD">PROD</option>
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Due Date
                  </label>
                  <DatePicker
                    value={task.dueDate}
                    onChange={(val) => updateField({ dueDate: val ? new Date(val) : null })}
                    placeholder="YYYY-MM-DD"
                    inputClassName="bg-slate-900 text-xs font-semibold py-2"
                  />
                </div>

                {/* Follow-up / Waiting details (if Waiting for update) */}
                {task.status === 'WAITING_FOR_UPDATE' && (
                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-amber-300 mb-1">
                        Waiting Type
                      </label>
                      <select
                        value={task.waitingForType || 'OTHER'}
                        onChange={(e) => updateField({ waitingForType: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-amber-500/30 text-white text-xs font-medium focus:outline-none focus:border-amber-400"
                      >
                        <option value="TESTING_TEAM">Testing Team</option>
                        <option value="CLIENT">Client</option>
                        <option value="TEAM_MEMBER">Team Member</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-amber-300 mb-1">
                        Waiting For
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bhavish, QA Team"
                        value={task.waitingForName || ''}
                        onChange={(e) => setTask({ ...task, waitingForName: e.target.value })}
                        onBlur={() => updateField({ waitingForName: task.waitingForName })}
                        onKeyDown={(e) => e.key === 'Enter' && updateField({ waitingForName: task.waitingForName })}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-amber-500/30 text-white text-xs font-medium focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-amber-300 mb-1">
                        Waiting Reason
                      </label>
                      <input
                        type="text"
                        placeholder="Reason for waiting..."
                        value={task.waitingReason || ''}
                        onChange={(e) => setTask({ ...task, waitingReason: e.target.value })}
                        onBlur={() => updateField({ waitingReason: task.waitingReason })}
                        onKeyDown={(e) => e.key === 'Enter' && updateField({ waitingReason: task.waitingReason })}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-amber-500/30 text-white text-xs font-medium focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-amber-300 mb-1">
                        Follow-up Date
                      </label>
                      <DatePicker
                        value={task.followUpDate}
                        onChange={(val) => updateField({ followUpDate: val ? new Date(val) : null })}
                        placeholder="YYYY-MM-DD"
                        inputClassName="bg-slate-900 text-xs font-semibold py-1.5 border-amber-500/30"
                      />
                    </div>
                  </div>
                )}

                {/* Blocker Reason (if Blocked) */}
                {task.status === 'BLOCKED' && (
                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-2">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-rose-300">
                      Blocker Reason
                    </label>
                    <input
                      type="text"
                      placeholder="Reason why task is blocked..."
                      value={task.blockReason || ''}
                      onChange={(e) => setTask({ ...task, blockReason: e.target.value })}
                      onBlur={() => updateField({ blockReason: task.blockReason })}
                      onKeyDown={(e) => e.key === 'Enter' && updateField({ blockReason: task.blockReason })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-rose-500/30 text-white text-xs font-medium focus:outline-none focus:border-rose-400"
                    />
                  </div>
                )}

                {/* Time Summary */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-white/10 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      Total Time Tracked
                    </span>
                    <span className="font-bold text-white font-mono">
                      {formatTime(task.totalTimeSeconds)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {task.timeEntries?.length || 0} recorded sessions
                  </p>
                  {task.timeEntries && task.timeEntries.length > 0 && (
                    <div className="pt-2 border-t border-white/5 space-y-1.5 max-h-36 overflow-y-auto">
                      {task.timeEntries.map((entry: any) => (
                        <div key={entry.id} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950 border border-white/5 text-[11px] group">
                          <span className="text-slate-300 font-mono">
                            {formatTime(entry.durationSeconds)} {entry.isRunning && <span className="text-emerald-400 font-bold">(Live)</span>}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteTimeEntry(entry.id)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 transition"
                            title="Delete time entry"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
