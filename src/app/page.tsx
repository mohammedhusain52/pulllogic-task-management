'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { FollowUpSection } from '@/components/dashboard/FollowUpSection';
import { TeamOverview } from '@/components/dashboard/TeamOverview';
import { MyWorkToday } from '@/components/dashboard/MyWorkToday';
import { TaskDetailDrawer } from '@/components/modals/TaskDetailDrawer';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSummaryFilter = (key: string) => {
    switch (key) {
      case 'active':
        router.push('/tasks');
        break;
      case 'dueToday':
        router.push('/tasks?filter=today');
        break;
      case 'followUps':
        router.push('/tasks?status=WAITING_FOR_UPDATE');
        break;
      case 'blocked':
        router.push('/tasks?status=BLOCKED');
        break;
      case 'teamActive':
        router.push('/team');
        break;
      case 'overdue':
        router.push('/tasks?filter=overdue');
        break;
      default:
        router.push('/tasks');
    }
  };

  if (loading && !data) {
    return (
      <AppLayout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          <p className="text-sm font-semibold text-slate-400">
            Loading Task Management...
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Top KPI Metrics Cards */}
        {data?.metrics && (
          <SummaryCards
            metrics={data.metrics}
            onFilterClick={handleSummaryFilter}
          />
        )}

        {/* Urgent Follow-ups Required Section (Red / Amber Alerts) */}
        {data?.followUps && data.followUps.length > 0 && (
          <FollowUpSection
            followUps={data.followUps}
            onSelectTask={(task) => setSelectedTaskId(task.id)}
            onRefresh={fetchDashboardData}
          />
        )}

        {/* Team Workload & Live Status (Positioned above My Work Today) */}
        {data?.teamOverview && (
          <TeamOverview
            team={data.teamOverview}
            onSelectTask={(task) => setSelectedTaskId(task.id)}
          />
        )}

        {/* Primary Operational Section: My Work Today (Scrollable Box) */}
        <MyWorkToday
          tasks={data?.myWorkToday || []}
          onSelectTask={(task) => setSelectedTaskId(task.id)}
          onRefresh={fetchDashboardData}
        />
      </div>

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={fetchDashboardData}
      />
    </AppLayout>
  );
}
