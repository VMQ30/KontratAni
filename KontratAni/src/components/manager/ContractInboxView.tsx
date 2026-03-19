import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore, type CropStatus } from '@/store/useAppStore';
import { Check, X, FileText, Calendar, Package, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react'; // 👈 added

const CROP_STATUS_KEY = 'kontratani_crop_status'; // 👈 added — must match ContractsView

export function ContractInboxView() {
  const contracts = useAppStore((s) => s.contracts);
  const acceptContract = useAppStore((s) => s.acceptContract);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const updateCropStatus = useAppStore((s) => s.updateCropStatus); // 👈 added

  // 👇 Mirror the same cross-tab sync that ContractsView uses
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== CROP_STATUS_KEY || !e.newValue) return;
      try {
        const { contractId, cropStatus } = JSON.parse(e.newValue) as {
          contractId: string;
          cropStatus: CropStatus;
          ts: number;
        };
        updateCropStatus(contractId, cropStatus);
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [updateCropStatus]);

  const pendingContracts = contracts.filter(c => c.status === 'matched' || c.status === 'open');
  const activeContracts = contracts.filter(c => ['accepted', 'funded', 'in_progress'].includes(c.status));

  const handleAccept = (id: string) => {
    acceptContract(id);
    toast.success('Contract accepted! Proceed to Quota Allocation.');
    setTimeout(() => setActiveView('allocation'), 800);
  };

  const handleReject = (id: string) => {
    toast.error('Contract declined.');
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'matched': return 'bg-sand/20 text-sand-foreground border-sand/40';
      case 'accepted': return 'bg-accent text-accent-foreground';
      case 'funded': return 'bg-primary/10 text-primary border-primary/30';
      case 'in_progress': return 'bg-forest/10 text-forest border-forest/30';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Contract Inbox</h2>
        <p className="text-sm text-muted-foreground">Review and respond to incoming contract offers from buyers.</p>
      </div>

      {/* Pending Offers */}
      {pendingContracts.length > 0 && (
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <FileText className="h-4 w-4" /> Pending Offers ({pendingContracts.length})
          </h3>
          {pendingContracts.map((contract) => (
            <Card key={contract.id} className="border-sand/30 bg-card transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-display text-lg font-bold text-foreground">{contract.crop}</h4>
                      <Badge variant="outline" className={statusColor(contract.status)}>
                        {contract.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" />
                        {contract.volumeKg.toLocaleString()} kg
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Deliver by {contract.targetDate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        {contract.buyerName}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Estimated value: <span className="font-semibold text-primary">₱{(contract.volumeKg * 30).toLocaleString()}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleReject(contract.id)}>
                      <X className="h-4 w-4" /> Decline
                    </Button>
                    <Button size="sm" className="gap-1" onClick={() => handleAccept(contract.id)}>
                      <Check className="h-4 w-4" /> Accept
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pendingContracts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium text-muted-foreground">No pending contract offers</p>
            <p className="text-sm text-muted-foreground/60">New buyer requests will appear here.</p>
          </CardContent>
        </Card>
      )}

      {/* Active Contracts */}
      {activeContracts.length > 0 && (
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Active Contracts ({activeContracts.length})
          </h3>
          {activeContracts.map((contract) => (
            <Card key={contract.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-display font-semibold text-foreground">{contract.crop}</h4>
                      <p className="text-sm text-muted-foreground">{contract.volumeKg.toLocaleString()} kg • {contract.buyerName}</p>
                      {/* 👇 Show live crop status so the manager sees real-time field updates */}
                      {contract.cropStatus && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Crop status:{' '}
                          <span className="font-medium text-foreground">
                            {contract.cropStatus.replace(/_/g, ' ')}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={statusColor(contract.status)}>
                      {contract.status.replace('_', ' ')}
                    </Badge>
                    <div className="w-32">
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{contract.progress}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${contract.progress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}