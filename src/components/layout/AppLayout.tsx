'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { QuickAddModal } from '../modals/QuickAddModal';
import { RunWorkflowModal } from '../modals/RunWorkflowModal';
import { GlobalSearchModal } from '../modals/GlobalSearchModal';
import { TaskDetailDrawer } from '../modals/TaskDetailDrawer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [runWorkflowOpen, setRunWorkflowOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-[#090D16] text-white items-center justify-center" suppressHydrationWarning>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">Loading Operations Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#090D16] text-white" suppressHydrationWarning>
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0" suppressHydrationWarning>
        <Header
          onOpenQuickAdd={() => setQuickAddOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenRunWorkflow={() => setRunWorkflowOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav onOpenQuickAdd={() => setQuickAddOpen(true)} />
      </div>

      {/* Global Modals */}
      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
      />

      <RunWorkflowModal
        isOpen={runWorkflowOpen}
        onClose={() => setRunWorkflowOpen(false)}
      />

      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectTask={(task) => setSelectedTaskId(task.id)}
      />

      <TaskDetailDrawer
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  );
}
