import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/useAppStore';
import { Wallet, Check, Banknote, Smartphone, ArrowDownToLine } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const BROADCAST_KEY = 'kontratani_broadcast';

export function PayoutView() {
  const contracts = useAppStore((s) => s.contracts);
  const fundedContracts = contracts.filter(c => c.escrowAmount > 0 && c.matchedCooperative);
  const [selectedContract, setSelectedContract] = useState<string | null>(fundedContracts[0]?.id || null);
  const contract = fundedContracts.find(c => c.id === selectedContract);
  const farmers = contract?.matchedCooperative?.members || [];

  const [payoutMethods, setPayoutMethods] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    farmers.forEach(f => { init[f.id] = f.payoutMethod; });
    return init;
  });

  const [paidFarmers, setPaidFarmers] = useState<Set<string>>(new Set());
  const [distributing, setDistributing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const perFarmerAmount = contract ? Math.floor(contract.escrowAmount / farmers.length) : 0;
  const totalDistributed = paidFarmers.size * perFarmerAmount;

  const buildSmsText = (
    farmerFirstName: string,
    amount: number,
    method: string,
  ): string => {
    const methodLabel: Record<string, string> = {
      gcash: 'GCash',
      maya: 'Maya',
      cash: 'Cash',
    };

    if (method === 'cash') {
      return [
        `[KontratAni] 💰 Hi ${farmerFirstName}! Your payment of ₱${amount.toLocaleString()} is ready for pick-up. Please visit the KontratAni office to claim your cash payout. 🏢`,
        ``,
        `Kumusta ${farmerFirstName}! Ang inyong bayad na ₱${amount.toLocaleString()} ay handa na. Mangyaring pumunta sa opisina ng KontratAni para kunin ang inyong bayad sa cash. 🏢`,
      ].join('\n');
    }

    const label = methodLabel[method] ?? method;
    return [
      `[KontratAni] 💸 Hi ${farmerFirstName}! Your payment of ₱${amount.toLocaleString()} has been sent to your ${label} account. Please check your ${label} wallet. ✅`,
      ``,
      `Kumusta ${farmerFirstName}! Ang inyong bayad na ₱${amount.toLocaleString()} ay naipadala na sa inyong ${label} account. Mangyaring suriin ang inyong ${label} wallet. ✅`,
    ].join('\n');
  };

  const JUAN_ID = 'f1';

  const handleDistribute = () => {
    setDistributing(true);
    farmers.forEach((f, i) => {
      setTimeout(() => {
        const method = payoutMethods[f.id] || 'gcash';
        const firstName = f.name.split(' ')[0];

        // Only send the SMS broadcast to Juan dela Cruz
        if (f.id === JUAN_ID) {
          const smsText = buildSmsText(firstName, perFarmerAmount, method);
          localStorage.setItem(
            BROADCAST_KEY,
            JSON.stringify({
              id: `payout-${f.id}-${Date.now()}`,
              text: smsText,
              time: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
            }),
          );
        }

        setPaidFarmers(prev => new Set([...prev, f.id]));
        setWalletBalance(prev => prev + perFarmerAmount);

        if (i === farmers.length - 1) {
          setDistributing(false);
          toast.success('All payouts distributed successfully!');
        }
      }, (i + 1) * 600);
    });
  };

  if (fundedContracts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Payout Dashboard</h2>
          <p className="text-sm text-muted-foreground">Release escrow funds to farmers.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Wallet className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium text-muted-foreground">No funded contracts yet</p>
            <p className="text-sm text-muted-foreground/60">Contracts must be funded by the buyer before payouts.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Payout Dashboard</h2>
        <p className="text-sm text-muted-foreground">Release escrow funds to individual farmers' wallets.</p>
      </div>

      {/* Contract Selector */}
      <div className="flex gap-2">
        {fundedContracts.map(c => (
          <Button
            key={c.id}
            variant={selectedContract === c.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedContract(c.id);
              setPaidFarmers(new Set());
              setWalletBalance(0);
              const fa = c.matchedCooperative?.members || [];
              const init: Record<string, string> = {};
              fa.forEach(f => { init[f.id] = f.payoutMethod; });
              setPayoutMethods(init);
            }}
          >
            {c.crop}
          </Button>
        ))}
      </div>

      {contract && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Banknote className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Escrow Balance</p>
                    <p className="font-display text-xl font-bold text-foreground">
                      ₱{contract.escrowAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sand/20">
                    <ArrowDownToLine className="h-5 w-5 text-sand-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Per Farmer</p>
                    <p className="font-display text-xl font-bold text-foreground">
                      ₱{perFarmerAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest/10">
                    <Wallet className="h-5 w-5 text-forest" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Released</p>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={totalDistributed}
                        initial={{ scale: 1.2, color: 'hsl(94, 37%, 39%)' }}
                        animate={{ scale: 1, color: 'hsl(220, 20%, 16%)' }}
                        className="font-display text-xl font-bold"
                      >
                        ₱{totalDistributed.toLocaleString()}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Farmer Payout Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Farmer Payouts</CardTitle>
              <CardDescription>Select payout method per farmer, then distribute</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Farmer</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payout Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {farmers.map((f) => {
                    const isPaid = paidFarmers.has(f.id);
                    return (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.name}</TableCell>
                        <TableCell className="text-muted-foreground">{f.location}</TableCell>
                        <TableCell className="font-semibold">₱{perFarmerAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Select
                            value={payoutMethods[f.id] || 'gcash'}
                            onValueChange={(v) =>
                              setPayoutMethods(prev => ({ ...prev, [f.id]: v }))
                            }
                            disabled={isPaid}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gcash">
                                <span className="flex items-center gap-1.5">
                                  <Smartphone className="h-3 w-3" /> GCash
                                </span>
                              </SelectItem>
                              <SelectItem value="maya">
                                <span className="flex items-center gap-1.5">
                                  <Smartphone className="h-3 w-3" /> Maya
                                </span>
                              </SelectItem>
                              <SelectItem value="cash">
                                <span className="flex items-center gap-1.5">
                                  <Banknote className="h-3 w-3" /> Cash
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {isPaid ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="inline-flex"
                            >
                              <Badge className="gap-1 bg-primary text-primary-foreground">
                                <Check className="h-3 w-3" /> Paid
                              </Badge>
                            </motion.div>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Button
            className="w-full gap-2"
            size="lg"
            onClick={handleDistribute}
            disabled={distributing || paidFarmers.size === farmers.length}
          >
            <Wallet className="h-4 w-4" />
            {paidFarmers.size === farmers.length
              ? 'All Payouts Complete'
              : distributing
              ? 'Distributing...'
              : 'Distribute Payouts'}
          </Button>
        </>
      )}
    </div>
  );
}