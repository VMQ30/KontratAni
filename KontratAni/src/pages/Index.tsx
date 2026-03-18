import { BuyerSidebar } from '@/components/buyer/BuyerSidebar';
import { DashboardView } from '@/components/buyer/DashboardView';
import { DemandView } from '@/components/buyer/DemandView';
import { ContractsView } from '@/components/buyer/ContractsView';
import { PaymentsView } from '@/components/buyer/PaymentsView';
import { useAppStore } from '@/store/useAppStore';

const Index = () => {
  const activeView = useAppStore((s) => s.activeView);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView />;
      case 'demand': return <DemandView />;
      case 'contracts': return <ContractsView />;
      case 'payments': return <PaymentsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <BuyerSidebar />
      <main className="ml-64 min-h-screen p-8">
        {renderView()}
      </main>
    </div>
  );
};

export default Index;
