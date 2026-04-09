import { useEffect, useState } from "react";
import { FarmerSidebar } from "@/components/farmer/FarmerSidebar";
import { FarmerMobileNav } from "@/components/farmer/FarmerMobileNav";
import { ProfileView } from "@/components/farmer/ProfileView";
import { ContractInboxView } from "@/components/farmer/ContractInboxView";
import { useAppStore } from "@/store/useAppStore";
import { ContractProgress } from "./ContractProgress";
import { AiReportView } from "@/components/manager/AiReportView";
import { AiChatbot } from "@/components/manager/AiChatbot";
import { ContractAiAssistant } from "@/components/manager/ContractAiAssistant";
import { DirectPayoutView } from "./DirectPayoutView";
import { DemoControlPanel } from "@/components/DemoControlPanel.tsx";
import { useIsMobile } from "@/hooks/use-mobile";

export function FarmerLayout() {
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <FarmerMobileNav
          isOpen={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
          onNavClick={handleNavClick}
        />
        <main className="flex-1 overflow-y-auto pb-20 p-4">{renderView()}</main>
        <AiChatbot />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <FarmerSidebar />
      <main className="ml-64 min-h-screen p-8">{renderView()}</main>
      <AiChatbot />
      <DemoControlPanel />
    </div>
  );
}
