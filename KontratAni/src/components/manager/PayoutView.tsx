// PayoutView.tsx (Manager)

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store/useAppStore";
import {
  Wallet,
  Check,
  Banknote,
  Smartphone,
  ArrowDownToLine,
  ShieldAlert,
  Hourglass,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export function PayoutView() {
  const contracts = useAppStore((s) => s.contracts);
  const fundedContracts = contracts.filter(
    (c) => c.escrowAmount > 0 && c.matchedCooperative,
  );
  const [selectedContract, setSelectedContract] = useState<string | null>(
    fundedContracts[0]?.id || null,
  );
  const contract = fundedContracts.find((c) => c.id === selectedContract);
  const farmers = contract?.matchedCooperative?.members || [];

  const [payoutMethods, setPayoutMethods] = useState<Record<string, string>>(
    () => {
      const init: Record<string, string> = {};
      farmers.forEach((f) => {
        init[f.id] = f.payoutMethod;
      });
      return init;
    },
  );

  const [paidFarmers, setPaidFarmers] = useState<Set<string>>(new Set());
  const [distributing, setDistributing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const perFarmerAmount = contract
    ? Math.floor(contract.escrowAmount / farmers.length)
    : 0;
  const totalDistributed = paidFarmers.size * perFarmerAmount;
  const isEscrowFrozen = contract?.disputeFlag ?? false;
  const isBuyerConfirmed = contract?.buyerConfirmedDelivery ?? false;
  const isPayoutEligible = isBuyerConfirmed && !isEscrowFrozen;

  const handleDistribute = () => {
    if (!isPayoutEligible) {
      if (isEscrowFrozen) {
        toast.error("Cannot distribute — escrow is frozen due to a dispute.");
      } else {
        toast.error(
          "Cannot distribute — awaiting buyer delivery confirmation.",
        );
      }
      return;
    }

    setDistributing(true);
    farmers.forEach((f, i) => {
      setTimeout(
        () => {
          setPaidFarmers((prev) => new Set([...prev, f.id]));
          setWalletBalance((prev) => prev + perFarmerAmount);
          if (i === farmers.length - 1) {
            setDistributing(false);
            toast.success("All payouts distributed successfully!");
          }
        },
        (i + 1) * 600,
      );
    });
  };

  if (fundedContracts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Payout Dashboard
          </h2>
          <p className="text-sm text-muted-foreground">
            Release escrow funds to farmers.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Wallet className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium text-muted-foreground">
              No funded contracts yet
            </p>
            <p className="text-sm text-muted-foreground/60">
              Contracts must be funded by the buyer before payouts.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Payout Dashboard
        </h2>
        <p className="text-sm text-muted-foreground">
          Release escrow funds to individual farmers' wallets.
        </p>
      </div>

      {/* Contract Selector */}
      <div className="flex gap-2">
        {fundedContracts.map((c) => (
          <Button
            key={c.id}
            variant={selectedContract === c.id ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedContract(c.id);
              setPaidFarmers(new Set());
              setWalletBalance(0);
              const fa = c.matchedCooperative?.members || [];
              const init: Record<string, string> = {};
              fa.forEach((f) => {
                init[f.id] = f.payoutMethod;
              });
              setPayoutMethods(init);
            }}
          >
            {c.crop}
            {/* ── NEW: append status indicator to contract tab ────────────────── */}
            {c.disputeFlag && (
              <ShieldAlert className="ml-1.5 h-3.5 w-3.5 text-red-400" />
            )}
            {!c.disputeFlag && !c.buyerConfirmedDelivery && (
              <Hourglass className="ml-1.5 h-3.5 w-3.5 text-amber-400" />
            )}
            {c.buyerConfirmedDelivery && !c.disputeFlag && (
              <ShieldCheck className="ml-1.5 h-3.5 w-3.5 text-emerald-400" />
            )}
            {/* ── END ────────────────────────────────────────────────────────── */}
          </Button>
        ))}
      </div>

      {contract && (
        <>
          {/* ── NEW: escrow status banner — shows before summary cards ───────────
              Informs the manager of the exact reason why payouts are locked or
              available, replacing the previous silent failure mode.
          ── END ── */}
          {isEscrowFrozen && (
            <div className="flex items-start gap-3 rounded-xl border-2 border-red-300 bg-red-50 p-4">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">
                  Escrow Frozen — Dispute Under Review
                </p>
                <p className="mt-0.5 text-sm text-red-700">
                  A dispute has been raised on this contract. Funds are locked
                  until PalAI admin resolves the case. No payouts can be
                  distributed.
                </p>
              </div>
            </div>
          )}

          {!isEscrowFrozen && !isBuyerConfirmed && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <Hourglass className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-800">
                  Awaiting Buyer Delivery Confirmation
                </p>
                <p className="mt-0.5 text-sm text-amber-700">
                  The buyer must confirm that goods were delivered before escrow
                  can be released. This is a required dual sign-off to protect
                  all parties. Please wait for the buyer to confirm in their
                  portal.
                </p>
              </div>
            </div>
          )}

          {!isEscrowFrozen && isBuyerConfirmed && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-800">
                  Buyer Confirmed — Payout Unlocked
                </p>
                <p className="mt-0.5 text-sm text-emerald-700">
                  The buyer has co-confirmed delivery. You may now distribute
                  escrow funds to your member farmers.
                </p>
              </div>
            </div>
          )}
          {/* ── END ────────────────────────────────────────────────────────────── */}

          {/* Summary Cards — unchanged */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Banknote className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Escrow Balance
                    </p>
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
                    <p className="text-sm text-muted-foreground">
                      Total Released
                    </p>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={totalDistributed}
                        initial={{ scale: 1.2, color: "hsl(94, 37%, 39%)" }}
                        animate={{ scale: 1, color: "hsl(220, 20%, 16%)" }}
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

          {/* Farmer Payout Table — unchanged */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Farmer Payouts</CardTitle>
              <CardDescription>
                Select payout method per farmer, then distribute
              </CardDescription>
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
                        <TableCell className="text-muted-foreground">
                          {f.location}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₱{perFarmerAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={payoutMethods[f.id] || "gcash"}
                            onValueChange={(v) =>
                              setPayoutMethods((prev) => ({
                                ...prev,
                                [f.id]: v,
                              }))
                            }
                            disabled={isPaid || !isPayoutEligible}
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
                          ) : isEscrowFrozen ? (
                            <Badge
                              variant="outline"
                              className="border-red-200 text-red-600"
                            >
                              <Lock className="mr-1 h-3 w-3" /> Frozen
                            </Badge>
                          ) : !isBuyerConfirmed ? (
                            <Badge
                              variant="outline"
                              className="border-amber-200 text-amber-600"
                            >
                              <Hourglass className="mr-1 h-3 w-3" /> Awaiting
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground"
                            >
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

          {/* ── MODIFIED: distribute button shows appropriate locked state ─────────
              previous: only disabled when distributing || all paid.
              Now also locked (with icon + tooltip) when escrow is frozen or
              buyer hasn't confirmed, and shows the reason inline.
          ── END ── */}
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={handleDistribute}
            disabled={
              distributing ||
              paidFarmers.size === farmers.length ||
              !isPayoutEligible
            }
          >
            {isEscrowFrozen ? (
              <>
                <ShieldAlert className="h-4 w-4" /> Payouts Locked — Dispute
                Active
              </>
            ) : !isBuyerConfirmed ? (
              <>
                <Hourglass className="h-4 w-4" /> Waiting for Buyer Confirmation
              </>
            ) : paidFarmers.size === farmers.length ? (
              <>
                <Check className="h-4 w-4" /> All Payouts Complete
              </>
            ) : distributing ? (
              <>
                <Wallet className="h-4 w-4" /> Distributing...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4" /> Distribute Payouts
              </>
            )}
          </Button>
          {/* ── END ────────────────────────────────────────────────────────────── */}
        </>
      )}
    </div>
  );
}
