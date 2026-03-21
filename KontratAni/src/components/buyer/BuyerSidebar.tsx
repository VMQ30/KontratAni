import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { LayoutDashboard, FileText, TrendingUp, CreditCard, Sprout, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'demand', label: 'Market Demand', icon: TrendingUp },
  { id: 'contracts', label: 'My Contracts', icon: FileText },
  { id: 'payments', label: 'Payments', icon: CreditCard },
];

export function BuyerSidebar() {
  const { activeView, setActiveView } = useAppStore();
  const navigate = useNavigate();

  // Reusable logout function
  const handleLogout = () => {
    localStorage.removeItem('palai_user_role'); 
    navigate('/'); 
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent">
          {/* Changed icon color to foreground for better contrast */}
          <Sprout className="h-5 w-5 text-sidebar-foreground" />
        </div>
        <div>
          {/* Updated name to PalAI and changed to text-sidebar-foreground for readability */}
          <h1 className="font-display text-lg font-bold tracking-tight text-sidebar-foreground">
            PalAI
          </h1>
          <p className="text-xs text-sidebar-foreground/70">Buyer Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-4 flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
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
          // Hover classes strictly match the nav buttons above for uniformity
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors duration-150"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-6 py-4">
        {/* Changed these to foreground to ensure readability */}
        <p className="text-xs font-medium text-sidebar-foreground">Metro Fresh Foods</p>
        <p className="text-xs text-sidebar-foreground/70">Institutional Buyer</p>
      </div>
    </aside>
  );
}