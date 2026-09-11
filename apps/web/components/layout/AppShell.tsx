'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { FloatingSoftphone } from '../dialer/FloatingSoftphone';
import { DispositionModal } from '../dialer/DispositionModal';
import { CreateDealModal } from '../crm/CreateDealModal';
import { LeadDrawer } from '../crm/LeadDrawer';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicStandalonePage = pathname === '/' || pathname === '/login' || pathname === '/auth' || pathname === '/register';

  if (isPublicStandalonePage) {
    return (
      <main className="min-h-screen w-full bg-background text-foreground flex flex-col">
        {children}
      </main>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-slate-100">
      {/* Top Navbar */}
      <Navbar />

      {/* Body Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main App Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950/40 relative">
          {children}
        </main>
      </div>

      {/* Global Floating Modals & Softphone */}
      <FloatingSoftphone />
      <DispositionModal />
      <CreateDealModal />
      <LeadDrawer />
    </div>
  );
}
