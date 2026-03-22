import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { BuyerSidebar } from './BuyerSidebar';
import { DashboardView } from './DashboardView';
import { DemandView } from './DemandView';
import { ContractsView } from './ContractsView';
import { PaymentsView } from './PaymentsView';
import { DemoControlPanel } from "@/components/DemoControlPanel.tsx";

export default function BuyerLayout() {
  const { activeView } = useAppStore();

  return (
    <div className="flex min-h-screen bg-background">
      <BuyerSidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto min-h-screen">
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'demand' && <DemandView />}
        {activeView === 'contracts' && <ContractsView />}
        {activeView === 'payments' && <PaymentsView />}
      </main>
      <DemoControlPanel />
    </div>
  );
}