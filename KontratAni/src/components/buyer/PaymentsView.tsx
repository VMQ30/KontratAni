import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, CheckCircle2 } from 'lucide-react';

export function PaymentsView() {
  const { contracts } = useAppStore();

  const funded = contracts.filter((c) => c.escrowAmount > 0);
  const totalEscrow = funded.reduce((s, c) => s + c.escrowAmount, 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Payments</h2>
        <p className="mt-1 text-sm text-muted-foreground">Overview of escrow and payment status</p>
      </div>

      <Card className="border-primary/20 bg-accent/30">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Wallet className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Escrowed</p>
            <p className="font-display text-3xl font-bold text-foreground">₱{totalEscrow.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {contracts.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-display text-sm font-semibold">{c.crop}</p>
                <p className="text-xs text-muted-foreground">{c.matchedCooperative?.name || 'Unmatched'}</p>
              </div>
              <div className="text-right">
                {c.escrowAmount > 0 ? (
                  <>
                    <p className="font-display text-sm font-bold text-primary">₱{c.escrowAmount.toLocaleString()}</p>
                    <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Funded
                    </Badge>
                  </>
                ) : (
                  <Badge variant="secondary" className="bg-sand text-sand-foreground">Pending</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
