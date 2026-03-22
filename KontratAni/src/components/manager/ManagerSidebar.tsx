import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import {
  User,
  Inbox,
  Sliders,
  MessageSquare,
  Wallet,
  Sprout,
  BarChart3,
  LogOut,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "profile", label: "Profile & Land", icon: User },
  { id: "ai-reports", label: "AI Reports", icon: BarChart3 },
  { id: "inbox", label: "Contract Inbox", icon: Inbox },
  { id: "ai-tracker", label: "AI Contract Tracker", icon: Brain },
  { id: "allocation", label: "Quota Allocation", icon: Sliders },
  {id: "contract progress", label: "Contract Progress", icon: Sprout},
  { id: "sms-hub", label: "SMS & Monitoring", icon: MessageSquare },
  { id: "payouts", label: "Payouts", icon: Wallet },
];

export function ManagerSidebar() {
  const { activeView, setActiveView } = useAppStore();
  const navigate = useNavigate();

  // Reusable logout function
  const handleLogout = () => {
    localStorage.removeItem("palai_user_role");
    navigate("/");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent">
          {/* Changed icon color to foreground for better contrast */}
          <Sprout className="h-5 w-5 text-sidebar-foreground" />
        </div>
        <div>
          {/* Changed to text-sidebar-foreground to fix the unreadable green issue */}
          <h1 className="font-display text-lg font-bold tracking-tight text-sidebar-foreground">
            PalAI
          </h1>
          <p className="text-xs text-sidebar-foreground/70">Manager Portal</p>
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Logout Button Section */}
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          // Updated hover classes to exactly match the nav buttons above
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors duration-150"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>

      <div className="border-t border-sidebar-border px-6 py-4">
        {/* Changed these to foreground to ensure readability */}
        <p className="text-xs font-medium text-sidebar-foreground">
          Quezon Farmers Cooperative
        </p>
        <p className="text-xs text-sidebar-foreground/70">
          Cooperative Manager
        </p>
      </div>
    </aside>
  );
}
