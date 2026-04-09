import { Menu, X, Sprout, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  User,
  Inbox,
  BarChart3,
  Brain,
} from "lucide-react";

const navItems = [
  { id: "profile", label: "Profile & Land", icon: User },
  { id: "ai-reports", label: "AI Reports", icon: BarChart3 },
  { id: "inbox", label: "Contract Inbox", icon: Inbox },
  { id: "ai-tracker", label: "AI Contract Tracker", icon: Brain },
  { id: "contract progress", label: "Contract Progress", icon: Sprout },
];

interface FarmerMobileNavProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onNavClick: () => void;
}

export function FarmerMobileNav({ 
  isOpen, 
  onOpenChange,
  onNavClick 
}: FarmerMobileNavProps) {
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const navigate = useNavigate();

  const handleNavItemClick = (viewId: string) => {
    setActiveView(viewId);
    onNavClick();
  };

  const handleLogout = () => {
    localStorage.removeItem("palai_user_role");
    onNavClick();
    navigate("/");
  };

  return (
    <div className="bg-sidebar text-sidebar-foreground sticky top-0 z-50 border-b border-sidebar-border">
      <div className="flex items-center justify-between px-4 py-4">
        {/* Logo/Branding */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-accent">
            <Sprout className="h-4 w-4 text-sidebar-accent-foreground" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold text-sidebar-foreground">
              PalAI
            </h1>
            <p className="text-xs text-sidebar-foreground/70">Farmer</p>
          </div>
        </div>

        {/* Hamburger Menu */}
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
          <SheetTrigger asChild>
            <button className="p-2 hover:bg-sidebar-accent/50 rounded-lg transition-colors">
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </SheetTrigger>

          <SheetContent side="left" className="w-64 bg-sidebar text-sidebar-foreground p-0">
            {/* Sheet Content */}
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent">
                  <Sprout className="h-5 w-5 text-sidebar-accent-foreground" />
                </div>
                <div>
                  <h1 className="font-display text-lg font-bold tracking-tight text-sidebar-foreground">
                    PalAI
                  </h1>
                  <p className="text-xs text-sidebar-foreground/70">Farmer Portal</p>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="mt-4 flex-1 space-y-1 px-3 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavItemClick(item.id)}
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

              {/* Logout and User Info */}
              <div className="border-t border-sidebar-border space-y-3 px-3 py-4">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors duration-150"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>

                {/* User Info */}
                <div className="px-3 py-3 rounded-lg bg-sidebar-accent/20">
                  <p className="text-xs font-medium text-sidebar-foreground">
                    Luzviminda Garcia
                  </p>
                  <p className="text-xs text-sidebar-foreground/70">Solo Farmer</p>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
