'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Search,
  Plus,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  Lock,
  LogOut,
  User,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { ChangePasswordModal } from '../modals/ChangePasswordModal';

interface HeaderProps {
  onOpenQuickAdd: () => void;
  onOpenSearch: () => void;
  onOpenRunWorkflow: () => void;
}

export function Header({ onOpenQuickAdd, onOpenSearch, onOpenRunWorkflow }: HeaderProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState('Saturday, 12 September 2026');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [activeTimers, setActiveTimers] = useState<any[]>([]);

  useEffect(() => {
    try {
      setCurrentDate(format(new Date(), 'EEEE, d MMMM yyyy'));
    } catch {
      // ignore
    }
    fetchNotifications();
    fetchActiveTimers();

    const interval = setInterval(() => {
      fetchNotifications();
      fetchActiveTimers();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?unread=true');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActiveTimers = async () => {
    try {
      const res = await fetch('/api/time');
      if (res.ok) {
        const data = await res.json();
        setActiveTimers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const stopActiveTimer = async (timeEntryId: string) => {
    try {
      await fetch('/api/time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop', timeEntryId }),
      });
      fetchActiveTimers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      console.error(err);
      window.location.href = '/login';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#090D16]/90 backdrop-blur-md">
      {/* Left: Greeting & Current Date */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-white">
            Good Morning, Mohammed
          </h1>
          <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-3 h-3 mr-1" />
            Senior Data Scientist · Pull Logic
          </span>
        </div>
        <p className="text-xs font-medium text-slate-400 mt-0.5" suppressHydrationWarning>
          {currentDate || 'Saturday, 12 September 2026'}
        </p>
      </div>

      {/* Right Controls: Active Timers, Search, Notifications, Quick Add, User Profile */}
      <div className="flex items-center gap-3">
        {/* Active Timer Pill if any */}
        {activeTimers.length > 0 && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 text-xs font-medium animate-pulse-subtle">
            <Clock className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
            <span className="truncate max-w-[150px]">
              {activeTimers[0].task?.title || 'Timer Active'}
            </span>
            <button
              onClick={() => stopActiveTimer(activeTimers[0].id)}
              title="Stop Timer"
              className="p-1 hover:bg-rose-500/20 hover:text-rose-300 rounded transition"
            >
              <Square className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20 transition text-sm"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 border border-slate-700 rounded text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Run Workflow Shortcut */}
        <button
          onClick={onOpenRunWorkflow}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-200 text-sm font-medium transition"
        >
          <Play className="w-3.5 h-3.5 text-indigo-400" />
          <span>Run Workflow</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded-lg bg-slate-900/80 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-white/15 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-semibold text-white">Notifications</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-400">
                    {notifications.length}
                  </span>
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="mt-3 max-h-80 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-400 opacity-60" />
                    No unread notifications. All caught up!
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5 hover:border-white/15 transition text-left"
                    >
                      <p className="text-xs font-semibold text-slate-200">{notif.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{notif.message}</p>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {format(new Date(notif.createdAt), 'd MMM, HH:mm')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Global Quick Add Button */}
        <button
          onClick={onOpenQuickAdd}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add</span>
        </button>

        {/* Mohammed Profile Dropdown & Button */}
        <div className="relative pl-2 border-l border-white/10">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-800/60 transition group cursor-pointer focus:outline-none"
            aria-label="User Profile"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-md group-hover:ring-2 group-hover:ring-indigo-400/50 transition">
              MH
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-white/15 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
              {/* User Details */}
              <div className="p-3 rounded-xl bg-slate-950 border border-white/5 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 font-bold text-xs flex items-center justify-center">
                    MH
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-tight">Mohammed Husain</div>
                    <div className="text-[10px] text-indigo-400 font-mono">@mohammed</div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-white/5">
                  Senior Data Scientist · Pull Logic
                </div>
              </div>

              {/* Menu Actions */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setIsPasswordModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition text-left"
                >
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Reset / Change Password</span>
                </button>

                <Link
                  href="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition text-left"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>System Settings</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </header>
  );
}

