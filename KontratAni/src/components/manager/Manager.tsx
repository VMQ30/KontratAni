import { useEffect } from "react";
import { ManagerSidebar } from "@/components/manager/ManagerSidebar";
import { ProfileView } from "@/components/manager/ProfileView";
import { ContractInboxView } from "@/components/manager/ContractInboxView";
import { QuotaAllocationView } from "@/components/manager/QuotaAllocationView";
import { SmsHubView } from "@/components/manager/SmsHubView";
import { PayoutView } from "@/components/manager/PayoutView";
import { AiReportView } from "@/components/manager/AiReportView";
import { AiChatbot } from "@/components/manager/AiChatbot";
import { ContractAiAssistant } from "@/components/manager/ContractAiAssistant";
import { ContractProgress } from "@/components/farmer/ContractProgress";
import { useAppStore } from "@/store/useAppStore";
import { DemoControlPanel } from "@/components/DemoControlPanel.tsx";
const Manager = () => {
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);

  useEffect(() => {
    setActiveView("profile");
  }, []);

  const renderView = () => {
    switch (activeView) {
      case "profile":
        return <ProfileView />;
      case "inbox":
        return <ContractInboxView />;
      case "ai-tracker":
        return <ContractAiAssistant />;
      case "allocation":
        return <QuotaAllocationView />;
      case "contract progress":
        return <ContractProgress />;
      case "sms-hub":
        return <SmsHubView />;
      case "payouts":
        return <PayoutView />;
      case "ai-reports":
        return <AiReportView />;
      default:
        return <ProfileView />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ManagerSidebar />
      <main className="ml-64 min-h-screen p-8">{renderView()}</main>
      <AiChatbot />
      <DemoControlPanel />
    </div>
  );
};

export default Manager;
