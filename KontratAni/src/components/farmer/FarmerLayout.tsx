import { useEffect } from "react";
import { FarmerSidebar } from "@/components/farmer/FarmerSidebar";
import { ProfileView } from "@/components/farmer/ProfileView";
import { ContractInboxView } from "@/components/manager/ContractInboxView";
import { useAppStore } from "@/store/useAppStore";
import { ContractProgress } from "./ContractProgress";
import { AiReportView } from "@/components/manager/AiReportView";
import { AiChatbot } from "@/components/manager/AiChatbot";
import { ContractAiAssistant } from "@/components/manager/ContractAiAssistant";
import { DirectPayoutView } from "./DirectPayoutView";
import { DemoControlPanel } from "@/components/DemoControlPanel.tsx";

export function FarmerLayout() {
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);

  useEffect(() => {
    setActiveView("profile");
  }, [setActiveView]);

  const renderView = () => {
    switch (activeView) {
      case "profile":
        return <ProfileView />;
      case "inbox":
        return <ContractInboxView />;
      case "contract progress":
        return <ContractProgress />;
      case "ai-tracker":
        return <ContractAiAssistant />;
      case "direct payout":
        return <DirectPayoutView />;
      case "ai-reports":
        return <AiReportView />;
      default:
        return <ProfileView />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <FarmerSidebar />
      <main className="ml-64 min-h-screen p-8">{renderView()}</main>
      <AiChatbot />
      <DemoControlPanel />
    </div>
  );
}
