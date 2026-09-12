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
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';
import { cn } from '@/lib/utils';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
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
      if (taskRes.ok) setTasks(await taskRes.json());
      if (runsRes.ok) setRuns(await runsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Compute offset for starting day of week
  const startDayOfWeek = monthStart.getDay(); // 0 = Sunday
  const paddingDays = Array.from({ length: startDayOfWeek });

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

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm font-bold text-white min-w-[160px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </div>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-white transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CALENDAR GRID */}
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
                        isCurrentDay ? 'bg-indigo-600 text-white' : 'text-slate-400'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {(dayTasks.length > 0 || dayFollowUps.length > 0) && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {dayTasks.length + dayFollowUps.length} items
                      </span>
                    )}
                  </div>

                  {/* Scheduled items */}
                  <div className="space-y-1 my-1 overflow-y-auto max-h-[65px]">
                    {dayFollowUps.map((t) => (
                      <div
                        key={`fu-${t.id}`}
                        onClick={() => setSelectedTaskId(t.id)}
                        className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] truncate cursor-pointer hover:bg-amber-500/30"
                      >
                        🔔 Follow-up: {t.title}
                      </div>
                    ))}

                    {dayTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTaskId(t.id)}
                        className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-200 text-[10px] truncate cursor-pointer hover:bg-slate-700"
                      >
                        • {t.title}
                      </div>
                    ))}

                    {dayRuns.map((r) => (
                      <div
                        key={r.id}
                        className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] truncate"
                      >
                        ⚡ Run: {r.name}
                      </div>
                    ))}
                  </div>

                  <div className="h-1" />
                </div>
              );
            })}
          </div>
        </div>
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
