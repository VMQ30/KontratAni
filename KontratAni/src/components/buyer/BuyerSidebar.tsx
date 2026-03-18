import { useAppStore } from '@/store/useAppStore';
import { LayoutDashboard, FileText, TrendingUp, CreditCard, Sprout } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'demand', label: 'Market Demand', icon: TrendingUp },
  { id: 'contracts', label: 'My Contracts', icon: FileText },
  { id: 'payments', label: 'Payments', icon: CreditCard },
];

export function BuyerSidebar() {
  const { activeView, setActiveView } = useAppStore();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent">
          <Sprout className="h-5 w-5 text-sidebar-primary" />
        </div>
        <div>
          <h1 className="font-display text-lg font-bold tracking-tight text-sidebar-primary">KontratAni</h1>
          <p className="text-xs text-sidebar-muted">Buyer Portal</p>
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

      {/* Footer */}
      <div className="border-t border-sidebar-border px-6 py-4">
        <p className="text-xs text-sidebar-muted">Metro Fresh Foods</p>
        <p className="text-xs text-sidebar-muted/60">Institutional Buyer</p>
      </div>
    </aside>
  );
}
