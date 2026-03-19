import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sprout, Wallet, FileText, TrendingUp, ChevronRight, Inbox } from 'lucide-react';
import { motion } from 'framer-motion';

const statusColors: Record<string, string> = {
  pending:  'bg-amber-50  text-amber-800  border-amber-200',
  accepted: 'bg-green-50  text-green-800  border-green-200',
  declined: 'bg-red-50    text-red-800    border-red-200',
};

interface ManagerDashboardProps {
  isSolo: boolean;
  farmerCount: number;
  totalHa: number;
  contracts: {
    id: string;
    crop: string;
    buyer: string;
    volumeKg: number;
    pricePerKg: number;
    escrowAmount: number;
    status: string;
    progress: number;
    targetDate: string;
  }[];
  setActiveView: (view: string) => void;
  selectContract: (id: string) => void;
}

export function ManagerDashboardView({
  isSolo,
  farmerCount,
  totalHa,
  contracts,
  setActiveView,
  selectContract,
}: ManagerDashboardProps) {
  const activeContracts = contracts.filter((c) => c.status === 'accepted');
  const pendingContracts = contracts.filter((c) => c.status === 'pending');
  const totalEscrow = contracts.reduce((s, c) => s + c.escrowAmount, 0);
  const avgProgress = contracts.length
    ? Math.round(contracts.reduce((s, c) => s + c.progress, 0) / contracts.length)
    : 0;

  const metrics = [
    {
      label: 'Active Contracts',
      value: activeContracts.length,
      icon: FileText,
      color: 'text-[#2D6A4F]',
      bg: 'bg-[#EAF3DE]',
    },
    {
      label: isSolo ? 'Your Hectares' : 'Total Land',
      value: `${totalHa.toFixed(1)} ha`,
      icon: Sprout,
      color: 'text-[#2D6A4F]',
      bg: 'bg-[#EAF3DE]',
    },
    {
      label: 'Escrow Held',
      value: `₱${(totalEscrow / 1000).toFixed(0)}k`,
      icon: Wallet,
      color: 'text-terracotta',
      bg: 'bg-terracotta/10',
    },
    {
      label: isSolo ? 'Avg. Progress' : 'Farmers',
      value: isSolo ? `${avgProgress}%` : farmerCount,
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Manager Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSolo ? 'Solo Farmer overview' : 'Cooperative operations at a glance'}
        </p>
      </div>

      {/* Pending inbox alert */}
      {pendingContracts.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setActiveView('inbox')}
          className="flex w-full items-center gap-3 rounded-lg border border-[#C0DD97] bg-[#EAF3DE] px-4 py-3 text-left hover:bg-[#D4EDBB] transition-colors"
        >
          <Inbox className="h-4 w-4 shrink-0 text-[#2D6A4F]" />
          <p className="flex-1 text-sm font-medium text-[#27500A]">
            You have {pendingContracts.length} pending contract{pendingContracts.length > 1 ? 's' : ''} awaiting review.
          </p>
          <ChevronRight className="h-4 w-4 text-[#2D6A4F]/50" />
        </motion.button>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="border-border/60">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${m.bg}`}>
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
            onClick={() => setActiveView('inbox')}
            className="text-sm font-medium text-[#2D6A4F] hover:underline"
          >
            View Inbox →
          </button>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeContracts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No active contracts yet. Accept a contract from the inbox.
            </p>
          ) : (
            activeContracts.map((contract, i) => (
              <motion.div
                key={contract.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <button
                  onClick={() => {
                    selectContract(contract.id);
                    setActiveView('inbox');
                  }}
                  className="group flex w-full items-center gap-4 rounded-lg border border-border/50 p-4 text-left transition-colors hover:border-[#2D6A4F]/30 hover:bg-[#EAF3DE]/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-sm font-semibold text-foreground">{contract.crop}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${statusColors[contract.status]}`}
                      >
                        {contract.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {contract.volumeKg.toLocaleString()} kg · {contract.buyer} · Target: {contract.targetDate}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <Progress value={contract.progress} className="h-2 flex-1" />
                      <span className="text-xs font-medium text-muted-foreground">{contract.progress}%</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                </button>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}