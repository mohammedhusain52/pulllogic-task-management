'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Settings,
  User,
  Building2,
  Bell,
  Download,
  Save,
  CheckCircle2,
  GitFork,
  Clock,
  Shield,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChangePasswordModal } from '@/components/modals/ChangePasswordModal';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [user, setUser] = useState({
    name: 'Mohammed Husain',
    role: 'Senior Data Scientist',
    organization: 'Pull Logic',
    email: 'mohammed@pulllogic.com',
  });

  const [settings, setSettings] = useState({
    company_name: 'Pull Logic',
    follow_up_threshold_days: '1',
    timezone: 'America/Chicago',
    date_format: 'EEEE, d MMMM yyyy',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.user) setUser(data.user);
        if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, settings }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = () => {
    window.location.href = '/api/export';
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header Bar */}
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-300" />
            <span>Operations & System Settings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure operator profile, follow-up notification rules, company branding, and database backups
          </p>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Settings successfully saved and applied!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Operator Profile */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <User className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Primary Operator Profile
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={user.name}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Role Title
                </label>
                <input
                  type="text"
                  value={user.role}
                  onChange={(e) => setUser({ ...user, role: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Organization
                </label>
                <input
                  type="text"
                  value={user.organization}
                  onChange={(e) => setUser({ ...user, organization: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Follow-up & Notification Rules */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Bell className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Follow-up & Operational Notification Rules
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Follow-up Alert Threshold (Days)
                </label>
                <select
                  value={settings.follow_up_threshold_days}
                  onChange={(e) =>
                    setSettings({ ...settings, follow_up_threshold_days: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="1">1 Day (Default — Immediate Daily Catch)</option>
                  <option value="2">2 Days</option>
                  <option value="3">3 Days</option>
                  <option value="7">7 Days (Weekly)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Timezone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="America/Chicago">America/Chicago (Central)</option>
                  <option value="America/New_York">America/New_York (Eastern)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (Pacific)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Links & Workflow Builders */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <GitFork className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Workflows & Resources Management
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/workflows/builder"
                className="p-4 rounded-xl bg-slate-950 border border-white/5 hover:border-indigo-500/30 flex items-center justify-between group transition"
              >
                <div>
                  <span className="text-xs font-bold text-white group-hover:text-cyan-300 block">
                    Workflow Template Builder
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Add or modify pipelines, stages, and steps
                  </span>
                </div>
                <GitFork className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
              </Link>

              <Link
                href="/clients"
                className="p-4 rounded-xl bg-slate-950 border border-white/5 hover:border-indigo-500/30 flex items-center justify-between group transition"
              >
                <div>
                  <span className="text-xs font-bold text-white group-hover:text-indigo-300 block">
                    Client Profiles & Workflows
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Manage Yanmar, CNH, Zonar accounts
                  </span>
                </div>
                <Building2 className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
              </Link>
            </div>
          </div>

          {/* Security & Authentication */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Security & Authentication
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold shadow transition"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Reset / Change Password</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Your account is secured with encrypted PBKDF2 authentication. You can change your password at any time.
            </p>
          </div>

          {/* Data Backup & Export */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Data Backup & Portability
                </h2>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Backup</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Download complete, timestamped JSON snapshot of all tasks, workflows, clients, team time entries, and audit logs.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save System Settings</span>
            </button>
          </div>
        </form>

        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={passwordModalOpen}
          onClose={() => setPasswordModalOpen(false)}
        />
      </div>
    </AppLayout>
  );
}
