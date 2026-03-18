import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FileText, Package, Wallet, TrendingUp, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const statusColors: Record<string, string> = {
  open: 'bg-sand text-sand-foreground',
  matched: 'bg-accent text-accent-foreground',
  accepted: 'bg-primary/10 text-primary',
  funded: 'bg-primary text-primary-foreground',
  in_progress: 'bg-terracotta/10 text-terracotta',
  completed: 'bg-primary text-primary-foreground',
};

const cropStatusLabels: Record<string, string> = {
  pending: 'Pending',
  seeds_planted: 'Seeds Planted',
  fertilized: 'Fertilized',
  growing: 'Growing',
  ready_for_harvest: 'Ready for Harvest',
  harvested: 'Harvested',
  delivered: 'Delivered',
};

export function DashboardView() {
  const { contracts, setActiveView, selectContract } = useAppStore();

  const activeContracts = contracts.filter((c) => c.status !== 'completed');
  const totalVolume = contracts.reduce((sum, c) => sum + c.volumeKg, 0);
  const totalEscrow = contracts.reduce((sum, c) => sum + c.escrowAmount, 0);
  const avgProgress = Math.round(contracts.reduce((s, c) => s + c.progress, 0) / contracts.length);

  const metrics = [
    { label: 'Active Contracts', value: activeContracts.length, icon: FileText, color: 'text-primary' },
    { label: 'Total Volume', value: `${(totalVolume / 1000).toFixed(1)}t`, icon: Package, color: 'text-forest' },
    { label: 'Funds in Escrow', value: `₱${(totalEscrow / 1000).toFixed(0)}k`, icon: Wallet, color: 'text-terracotta' },
    { label: 'Avg. Progress', value: `${avgProgress}%`, icon: TrendingUp, color: 'text-primary' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Procurement Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your command center for contract farming operations</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="border-border/60">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent">
                    <Icon className={`h-5 w-5 ${m.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
                    <p className="font-display text-2xl font-bold text-foreground">{m.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Contract List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">Active Contracts</CardTitle>
          <button
            onClick={() => setActiveView('demand')}
            className="text-sm font-medium text-terracotta hover:underline"
          >
            + New Demand
          </button>
        </CardHeader>
        <CardContent className="space-y-3">
          {contracts.map((contract, i) => (
            <motion.div
              key={contract.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <button
                onClick={() => {
                  selectContract(contract.id);
                  setActiveView('contracts');
                }}
                className="group flex w-full items-center gap-4 rounded-lg border border-border/50 p-4 text-left transition-colors duration-150 hover:border-primary/30 hover:bg-accent/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-sm font-semibold text-foreground">{contract.crop}</p>
                    <Badge variant="secondary" className={statusColors[contract.status]}>
                      {contract.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {contract.volumeKg.toLocaleString()} kg · Target: {contract.targetDate}
                    {contract.matchedCooperative && ` · ${contract.matchedCooperative.name}`}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <Progress value={contract.progress} className="h-2 flex-1" />
                    <span className="text-xs font-medium text-muted-foreground">{contract.progress}%</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{cropStatusLabels[contract.cropStatus]}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
              </button>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
