'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TaskDetailDrawer } from '@/components/modals/TaskDetailDrawer';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  GitFork,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Layers,
  CalendarDays,
  CalendarRange,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isToday,
} from 'date-fns';
import {
  cn,
  getStatusBadge,
  getPriorityBadge,
  getEnvironmentBadge,
  sortByPriority,
} from '@/lib/utils';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK'>('MONTH');
  const [tasks, setTasks] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchCalendarItems();
  }, []);

  const fetchCalendarItems = async () => {
    setLoading(true);
    try {
      const [taskRes, runsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/workflows/runs'),
      ]);
      if (taskRes.ok) {
        const rawTasks = await taskRes.json();
        setTasks(sortByPriority(rawTasks));
      }
      if (runsRes.ok) setRuns(await runsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Month View Calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay(); // 0 = Sunday
  const paddingDays = Array.from({ length: startDayOfWeek });

  // Week View Calculations
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 }); // Saturday
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const handlePrev = () => {
    if (viewMode === 'MONTH') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'MONTH') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-indigo-400" />
              <span>Operations Calendar</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Scheduled pipeline deliveries, task deadlines, follow-up checkpoints, and recurring jobs
            </p>
          </div>

          {/* Controls: View Switcher + Navigation */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-white/10">
              <button
                onClick={() => setViewMode('MONTH')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition',
                  viewMode === 'MONTH'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Monthly</span>
              </button>
              <button
                onClick={() => setViewMode('WEEK')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition',
                  viewMode === 'WEEK'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Weekly</span>
              </button>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToday}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Today
              </button>

              <button
                onClick={handlePrev}
                className="p-2 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-white transition"
                title={viewMode === 'MONTH' ? 'Previous Month' : 'Previous Week'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs sm:text-sm font-bold text-white min-w-[150px] text-center">
                {viewMode === 'MONTH'
                  ? format(currentDate, 'MMMM yyyy')
                  : `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`}
              </div>

              <button
                onClick={handleNext}
                className="p-2 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-white transition"
                title={viewMode === 'MONTH' ? 'Next Month' : 'Next Week'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* CALENDAR BODY */}
        {viewMode === 'MONTH' ? (
          /* MONTH VIEW GRID */
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/15 backdrop-blur-md shadow-xl overflow-hidden">
            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-2 pb-3 mb-2 border-b border-white/10 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty padding for preceding month days */}
              {paddingDays.map((_, idx) => (
                <div
                  key={`pad-${idx}`}
                  className="min-h-[110px] rounded-xl bg-slate-950/20 border border-transparent p-2 opacity-30"
                />
              ))}

              {/* Days in Month */}
              {daysInMonth.map((day) => {
                const dayTasks = tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day));
                const dayFollowUps = tasks.filter(
                  (t) => t.followUpDate && isSameDay(new Date(t.followUpDate), day)
                );
                const dayRuns = runs.filter((r) => isSameDay(new Date(r.createdAt), day));

                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'min-h-[110px] rounded-xl border p-2 flex flex-col justify-between transition-all duration-150',
                      isCurrentDay
                        ? 'bg-indigo-950/30 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-slate-950/60 border-white/5 hover:border-white/15'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'w-6 h-6 rounded-full text-xs font-bold font-mono flex items-center justify-center',
                          isCurrentDay ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      {dayTasks.length + dayFollowUps.length + dayRuns.length > 0 && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {dayTasks.length + dayFollowUps.length + dayRuns.length}
                        </span>
                      )}
                    </div>

                    {/* Scheduled items */}
                    <div className="space-y-1 my-1 overflow-y-auto max-h-[68px]">
                      {dayFollowUps.map((t) => (
                        <div
                          key={`fu-${t.id}`}
                          onClick={() => setSelectedTaskId(t.id)}
                          className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] truncate cursor-pointer hover:bg-amber-500/30 font-medium"
                          title={`Follow-up: ${t.title}`}
                        >
                          🔔 {t.title}
                        </div>
                      ))}

                      {dayTasks.map((t) => {
                        const isCritical = t.priority === 'CRITICAL';
                        const isBlocked = t.status === 'BLOCKED';
                        return (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTaskId(t.id)}
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] truncate cursor-pointer font-medium border transition',
                              isBlocked
                                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                                : isCritical
                                ? 'bg-amber-500/20 border-amber-500/30 text-amber-200 hover:bg-amber-500/30'
                                : 'bg-slate-800 border-white/10 text-slate-200 hover:bg-slate-700'
                            )}
                            title={`${t.priority} - ${t.title}`}
                          >
                            • {t.title}
                          </div>
                        );
                      })}

                      {dayRuns.map((r) => (
                        <div
                          key={r.id}
                          className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] truncate font-medium"
                          title={`Workflow Run: ${r.name}`}
                        >
                          ⚡ {r.name}
                        </div>
                      ))}
                    </div>

                    <div className="h-0.5" />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* WEEK VIEW (7 SPACIOUS DAILY COLUMNS) */
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {daysInWeek.map((day) => {
              const dayTasks = tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day));
              const dayFollowUps = tasks.filter(
                (t) => t.followUpDate && isSameDay(new Date(t.followUpDate), day)
              );
              const dayRuns = runs.filter((r) => isSameDay(new Date(r.createdAt), day));
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'p-3.5 rounded-2xl border flex flex-col justify-between min-h-[360px] backdrop-blur-md transition-all shadow-sm',
                    isCurrentDay
                      ? 'bg-indigo-950/30 border-indigo-500/60 ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/80 border-white/10 hover:border-white/20'
                  )}
                >
                  <div>
                    {/* Day Column Header */}
                    <div className="pb-3 border-b border-white/10 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                          {format(day, 'EEE')}
                        </span>
                        <span
                          className={cn(
                            'text-sm font-extrabold',
                            isCurrentDay ? 'text-indigo-400' : 'text-white'
                          )}
                        >
                          {format(day, 'MMM d')}
                        </span>
                      </div>

                      {isCurrentDay && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-600 text-white shadow">
                          Today
                        </span>
                      )}
                    </div>

                    {/* Cards for this Day */}
                    <div className="mt-3 space-y-2.5 overflow-y-auto max-h-[420px] pr-0.5">
                      {/* Follow-ups */}
                      {dayFollowUps.map((t) => (
                        <div
                          key={`fu-${t.id}`}
                          onClick={() => setSelectedTaskId(t.id)}
                          className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 hover:border-amber-500/70 transition cursor-pointer space-y-1 shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                              Follow-up
                            </span>
                            {t.client && (
                              <span className="text-[10px] text-slate-400 truncate">
                                {t.client.name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-amber-200 line-clamp-2">
                            {t.title}
                          </p>
                          {t.waitingReason && (
                            <p className="text-[10px] text-amber-300/80 italic line-clamp-1">
                              "{t.waitingReason}"
                            </p>
                          )}
                        </div>
                      ))}

                      {/* Scheduled Tasks */}
                      {dayTasks.map((t) => {
                        const statusBadge = getStatusBadge(t.status);
                        const priorityBadge = getPriorityBadge(t.priority);
                        return (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTaskId(t.id)}
                            className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5 hover:border-indigo-500/40 transition cursor-pointer space-y-1.5 shadow-sm group"
                          >
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <span
                                className={cn(
                                  'text-[10px] font-bold px-1.5 py-0.2 rounded border',
                                  priorityBadge.color
                                )}
                              >
                                {priorityBadge.icon} {priorityBadge.label}
                              </span>
                              {t.client && (
                                <span className="text-[10px] text-cyan-300 truncate font-medium">
                                  {t.client.name}
                                </span>
                              )}
                            </div>

                            <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition line-clamp-2">
                              {t.title}
                            </p>

                            <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/5 text-[10px]">
                              <span className={cn('px-1.5 py-0.2 rounded border', statusBadge.color)}>
                                {statusBadge.label}
                              </span>
                              {t.assignee && (
                                <span className="text-slate-400 truncate max-w-[80px]">
                                  {t.assignee.name.split(' ')[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Workflow Runs */}
                      {dayRuns.map((r) => (
                        <div
                          key={r.id}
                          className="p-2 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-1"
                        >
                          <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-300 uppercase">
                            <GitFork className="w-3 h-3 text-cyan-400" />
                            <span>Workflow Run</span>
                          </div>
                          <p className="text-xs font-bold text-cyan-100 truncate">
                            {r.name}
                          </p>
                        </div>
                      ))}

                      {/* Empty State */}
                      {dayTasks.length === 0 && dayFollowUps.length === 0 && dayRuns.length === 0 && (
                        <div className="py-8 text-center text-slate-500 space-y-1">
                          <CheckCircle2 className="w-5 h-5 mx-auto opacity-40" />
                          <p className="text-[11px]">No items scheduled</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={fetchCalendarItems}
      />
    </AppLayout>
  );
}
