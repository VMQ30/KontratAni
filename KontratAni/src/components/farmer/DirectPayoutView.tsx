// DirectPayoutView.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import {
  Wallet,
  CheckCircle2,
  Clock,
  Lock,
  Banknote,
  ArrowDownToLine,
  Smartphone,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
type PayoutStage = "locked" | "escrow_funded" | "harvest_complete" | "releasing" | "paid";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getPayoutStage(
  contractStatus: string,
  cropStatus: string,
  paid: boolean,
): PayoutStage {
  if (paid) return "paid";
  if (cropStatus === "harvested" || cropStatus === "delivered") return "harvest_complete";
  if (contractStatus === "funded" || contractStatus === "in_progress") return "escrow_funded";
  return "locked";
}

const PAYOUT_METHOD_ICONS: Record<string, React.ElementType> = {
  gcash: Smartphone,
  maya: Smartphone,
  cash: Banknote,
};

const PAYOUT_METHOD_COLORS: Record<string, string> = {
  gcash: "border-blue-200 bg-blue-50 text-blue-700",
  maya: "border-violet-200 bg-violet-50 text-violet-700",
  cash: "border-amber-200 bg-amber-50 text-amber-700",
};

const PAYOUT_METHOD_LABEL: Record<string, string> = {
  gcash: "GCash",
  maya: "Maya",
  cash: "Cash Pickup",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function EscrowStatusBanner({ stage }: { stage: PayoutStage }) {
  const configs = {
    locked: {
      icon: Lock,
      title: "Escrow Not Yet Funded",
      desc: "The buyer hasn't funded escrow yet. This will unlock once the contract is funded.",
      className: "border-border bg-muted/50 text-muted-foreground",
    },
    escrow_funded: {
      icon: Lock,
      title: "Escrow Funded & Secured",
      desc: "Buyer's payment is locked in escrow. It will auto-release once harvest is confirmed.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    harvest_complete: {
      icon: CheckCircle2,
      title: "Harvest Confirmed — Payout Ready",
      desc: "Your crop status is verified. Click below to release funds to your wallet.",
      className: "border-[#2D6A4F]/30 bg-[#2D6A4F]/10 text-[#2D6A4F]",
    },
    releasing: {
      icon: ArrowDownToLine,
      title: "Releasing Funds…",
      desc: "Transferring your payout now. This only takes a moment.",
      className: "border-blue-200 bg-blue-50 text-blue-700",
    },
    paid: {
      icon: CheckCircle2,
      title: "Payout Deposited!",
      desc: "Funds have been sent to your wallet. Check your GCash / Maya for confirmation.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
  };

  const cfg = configs[stage];
  const Icon = cfg.icon;

  return (
    <div className={cn("flex items-start gap-3 rounded-xl border p-4", cfg.className)}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">{cfg.title}</p>
        <p className="mt-0.5 text-sm opacity-80">{cfg.desc}</p>
      </div>
    </div>
  );
}

function PayoutAmountCard({
  amount,
  volumeKg,
  pricePerKg,
  stage,
}: {
  amount: number;
  volumeKg: number;
  pricePerKg: number;
  stage: PayoutStage;
}) {
  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-500",
      stage === "paid" && "border-emerald-200 shadow-emerald-100 shadow-md",
    )}>
      <CardContent className="p-0">
        <div className={cn(
          "flex flex-col items-center justify-center py-8 transition-colors duration-500",
          stage === "paid"
            ? "bg-gradient-to-b from-emerald-50 to-white"
            : stage === "harvest_complete"
              ? "bg-[#2D6A4F]/5"
              : "bg-muted/30",
        )}>
          {stage === "paid" && (
            <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500" />
          )}
          {stage === "releasing" && (
            <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-[#2D6A4F]/20 border-t-[#2D6A4F]" />
          )}
          {!["paid", "releasing"].includes(stage) && (
            <Wallet className={cn(
              "mb-3 h-10 w-10 transition-colors duration-300",
              stage === "harvest_complete" ? "text-[#2D6A4F]" : "text-muted-foreground/30",
            )} />
          )}

          <p className={cn(
            "text-4xl font-bold tracking-tight transition-colors duration-300",
            stage === "paid" ? "text-emerald-600" : stage === "harvest_complete" ? "text-[#2D6A4F]" : "text-muted-foreground/50",
          )}>
            ₱{amount.toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {volumeKg.toLocaleString()} kg × ₱{pricePerKg}/kg
          </p>
        </div>

        <div className="border-t border-border px-6 py-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Escrow amount</span>
            <span className="font-medium">₱{amount.toLocaleString()}</span>
          </div>
          <div className="mt-1.5 flex justify-between text-sm">
            <span className="text-muted-foreground">Platform fee</span>
            <span className="font-medium text-muted-foreground">₱0 (waived)</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-bold">
            <span>You receive</span>
            <span className={cn(
              stage === "paid" ? "text-emerald-600" : "text-foreground",
            )}>₱{amount.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WalletCard({
  method,
  farmerName,
}: {
  method: "gcash" | "maya" | "cash";
  farmerName: string;
}) {
  const Icon = PAYOUT_METHOD_ICONS[method] ?? Banknote;
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl border p-4",
      PAYOUT_METHOD_COLORS[method],
    )}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/60">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold">{PAYOUT_METHOD_LABEL[method]}</p>
        <p className="text-sm opacity-70">{farmerName}</p>
      </div>
      <Badge variant="outline" className="ml-auto border-current/30 capitalize">
        {method === "cash" ? "Pickup" : "Linked"}
      </Badge>
    </div>
  );
}

function PayoutTimeline({ stage }: { stage: PayoutStage }) {
  const steps = [
    { id: "escrow_funded", label: "Escrow funded by buyer", icon: Lock },
    { id: "harvest_complete", label: "Harvest confirmed", icon: CheckCircle2 },
    { id: "paid", label: "Funds deposited to wallet", icon: ArrowDownToLine },
  ] as const;

  const stageOrder: PayoutStage[] = ["locked", "escrow_funded", "harvest_complete", "releasing", "paid"];
  const currentIdx = stageOrder.indexOf(stage);

  return (
    <div className="space-y-3">
      {steps.map((step, idx) => {
        const stepStageIdx = stageOrder.indexOf(step.id as PayoutStage);
        const done = currentIdx >= stepStageIdx;
        const active = currentIdx === stepStageIdx;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center gap-3">
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
              done
                ? "border-[#2D6A4F] bg-[#2D6A4F] text-white"
                : active
                  ? "border-[#2D6A4F] bg-white text-[#2D6A4F]"
                  : "border-border bg-muted text-muted-foreground/30",
            )}>
              <Icon className="h-4 w-4" />
            </div>
            <p className={cn(
              "text-sm",
              done ? "font-medium text-foreground" : "text-muted-foreground/60",
            )}>
              {step.label}
            </p>
            {done && <CheckCircle2 className="ml-auto h-4 w-4 text-[#2D6A4F]" />}
          </div>
        );
      })}
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function DirectPayoutView() {
  const contracts = useAppStore((s) => s.contracts);
  const soloFarmers = useAppStore((s) => s.soloFarmers);
  const updateCropStatus = useAppStore((s) => s.updateCropStatus);

  const farmer = soloFarmers[0];

  // Eligible contracts: funded or in_progress
  const eligibleContracts = contracts.filter((c) =>
    ["funded", "in_progress", "completed"].includes(c.status),
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    eligibleContracts[0]?.id ?? null,
  );
  // Track per-contract paid state locally (store has global paid on soloFarmer)
  const [paidContracts, setPaidContracts] = useState<Record<string, boolean>>({});
  const [releasing, setReleasing] = useState<Record<string, boolean>>({});

  const contract = contracts.find((c) => c.id === selectedId) ?? null;

  const isPaid = selectedId ? !!paidContracts[selectedId] : false;
  const isReleasing = selectedId ? !!releasing[selectedId] : false;

  const stage: PayoutStage = selectedId
    ? isReleasing
      ? "releasing"
      : getPayoutStage(
          contract?.status ?? "",
          contract?.cropStatus ?? "",
          isPaid,
        )
    : "locked";

  const pricePerKg = 30; // matches ContractInboxView estimate
  const payoutAmount = contract ? contract.volumeKg * pricePerKg : 0;

  const handleReleasePayout = async () => {
    if (!selectedId || stage !== "harvest_complete") return;
    setReleasing((r) => ({ ...r, [selectedId]: true }));

    await new Promise((res) => setTimeout(res, 2200)); // simulate transfer

    setReleasing((r) => ({ ...r, [selectedId]: false }));
    setPaidContracts((p) => ({ ...p, [selectedId]: true }));

    toast.success("Payout deposited!", {
      description: `₱${payoutAmount.toLocaleString()} sent to your ${PAYOUT_METHOD_LABEL[farmer.payoutMethod]}.`,
      duration: 5000,
    });
  };

  if (!farmer) return null;

  if (eligibleContracts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Direct Payout Wallet
          </h2>
          <p className="text-sm text-muted-foreground">
            Track and receive your escrow payout here.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium text-muted-foreground">
              No funded contracts yet
            </p>
            <p className="text-sm text-muted-foreground/60">
              Payouts appear here once a buyer funds escrow for your contract.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Direct Payout Wallet
        </h2>
        <p className="text-sm text-muted-foreground">
          Your escrow payout auto-deposits once harvest is confirmed.
        </p>
      </div>

      {/* Contract selector */}
      {eligibleContracts.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {eligibleContracts.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                selectedId === c.id
                  ? "border-[#2D6A4F] bg-[#2D6A4F] text-white"
                  : "border-border bg-background text-foreground hover:border-[#2D6A4F]/50",
              )}
            >
              {c.crop}
            </button>
          ))}
        </div>
      )}

      {contract && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Left column */}
          <div className="space-y-5">
            {/* Escrow status banner */}
            <EscrowStatusBanner stage={stage} />

            {/* Payout amount */}
            <PayoutAmountCard
              amount={payoutAmount}
              volumeKg={contract.volumeKg}
              pricePerKg={pricePerKg}
              stage={stage}
            />

            {/* CTA button */}
            {stage === "harvest_complete" && (
              <button
                onClick={handleReleasePayout}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2D6A4F] px-6 py-4 text-base font-semibold text-white transition-all hover:bg-[#1F4A38] active:scale-[0.98]"
              >
                <ArrowDownToLine className="h-5 w-5" />
                Release Payout to My {PAYOUT_METHOD_LABEL[farmer.payoutMethod]}
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {stage === "releasing" && (
              <div className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#2D6A4F]/30 bg-[#2D6A4F]/5 px-6 py-4 text-[#2D6A4F]">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#2D6A4F]/30 border-t-[#2D6A4F]" />
                <span className="font-semibold">Transferring funds…</span>
              </div>
            )}

            {stage === "paid" && (
              <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">
                  ₱{payoutAmount.toLocaleString()} deposited to your{" "}
                  {PAYOUT_METHOD_LABEL[farmer.payoutMethod]}
                </span>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Linked wallet */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wallet className="h-4 w-4 text-[#2D6A4F]" />
                  Linked Payout Wallet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <WalletCard
                  method={farmer.payoutMethod}
                  farmerName={farmer.name}
                />
                <p className="text-xs text-muted-foreground">
                  To change your payout method, go to{" "}
                  <strong>Profile & Land</strong>.
                </p>
              </CardContent>
            </Card>

            {/* Payout timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-[#2D6A4F]" />
                  Payout Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PayoutTimeline stage={stage} />
              </CardContent>
            </Card>

            {/* Transaction history (shows after paid) */}
            {stage === "paid" && (
              <Card className="border-emerald-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Transaction Record
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contract</span>
                    <span className="font-medium">{contract.crop}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold text-emerald-600">
                      ₱{payoutAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span className="font-medium">
                      {PAYOUT_METHOD_LABEL[farmer.payoutMethod]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">
                      {new Date().toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className="bg-emerald-100 text-emerald-700">
                      Completed
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}