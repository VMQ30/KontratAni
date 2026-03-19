import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useAppStore } from '@/store/useAppStore';
import { Sliders, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function QuotaAllocationView() {
  const contracts = useAppStore((s) => s.contracts);
  const acceptedContracts = contracts.filter(c => ['accepted', 'funded', 'in_progress'].includes(c.status) && c.matchedCooperative);

  const [selectedContract, setSelectedContract] = useState<string | null>(
    acceptedContracts[0]?.id || null
  );

  const contract = acceptedContracts.find(c => c.id === selectedContract);
  const farmers = contract?.matchedCooperative?.members || [];

  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    farmers.forEach(f => {
      init[f.id] = f.assignedKg || Math.floor((contract?.volumeKg || 0) / farmers.length);
    });
    return init;
  });

  const totalAllocated = Object.values(allocations).reduce((a, b) => a + b, 0);
  const targetKg = contract?.volumeKg || 0;
  const remaining = targetKg - totalAllocated;

  const handleSliderChange = (farmerId: string, value: number[]) => {
    setAllocations(prev => ({ ...prev, [farmerId]: value[0] }));
  };

  const handleConfirm = () => {
    if (remaining < 0) {
      toast.error('Over-allocated! Reduce assignments.');
      return;
    }
    toast.success(`Quota allocated for ${contract?.crop}. Proceed to SMS Broadcast.`);
  };

  if (acceptedContracts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Quota Allocation</h2>
          <p className="text-sm text-muted-foreground">Assign production quotas to member farmers.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Sliders className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium text-muted-foreground">No accepted contracts yet</p>
            <p className="text-sm text-muted-foreground/60">Accept a contract from the inbox first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Quota Allocation</h2>
        <p className="text-sm text-muted-foreground">Distribute production targets among your member farmers.</p>
      </div>

      {/* Contract Selector */}
      <div className="flex gap-2">
        {acceptedContracts.map(c => (
          <Button
            key={c.id}
            variant={selectedContract === c.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedContract(c.id);
              const fa = c.matchedCooperative?.members || [];
              const init: Record<string, number> = {};
              fa.forEach(f => { init[f.id] = Math.floor(c.volumeKg / fa.length); });
              setAllocations(init);
            }}
          >
            {c.crop}
          </Button>
        ))}
      </div>

      {contract && (
        <>
          {/* Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Contract</p>
                  <p className="font-display text-lg font-bold text-foreground">{contract.crop}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target Volume</p>
                  <p className="font-display text-lg font-bold text-foreground">{targetKg.toLocaleString()} kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className={`font-display text-lg font-bold ${remaining < 0 ? 'text-destructive' : remaining === 0 ? 'text-primary' : 'text-sand-foreground'}`}>
                    {remaining.toLocaleString()} kg
                  </p>
                </div>
              </div>
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${remaining < 0 ? 'bg-destructive' : 'bg-primary'}`}
                  style={{ width: `${Math.min((totalAllocated / targetKg) * 100, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Farmer Sliders */}
          <div className="space-y-3">
            {farmers.map((farmer) => (
              <Card key={farmer.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{farmer.name}</p>
                        <Badge variant="outline" className="text-xs">{farmer.hectares} ha</Badge>
                        <Badge variant="outline" className="text-xs capitalize">{farmer.payoutMethod}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{farmer.location} • {farmer.soilType}</p>
                    </div>
                    <div className="ml-6 text-right">
                      <p className="font-display text-xl font-bold text-primary">{(allocations[farmer.id] || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">kg assigned</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Slider
                      value={[allocations[farmer.id] || 0]}
                      onValueChange={(v) => handleSliderChange(farmer.id, v)}
                      max={Math.ceil(targetKg / farmers.length * 2)}
                      step={10}
                    />
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>0 kg</span>
                      <span>Max capacity: ~{Math.ceil(farmer.hectares * 1000)} kg</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {remaining < 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Over-allocated by {Math.abs(remaining).toLocaleString()} kg. Reduce assignments.
            </div>
          )}

          <Button className="w-full gap-2" size="lg" onClick={handleConfirm} disabled={remaining < 0}>
            <Check className="h-4 w-4" /> Confirm Allocation
          </Button>
        </>
      )}
    </div>
  );
}
