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
  ShieldAlert,
  Hourglass,
  ShieldCheck,
  Upload,
  Landmark,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PayoutStage =
  | "locked"
  | "escrow_funded"
  | "awaiting_buyer"
  | "disputed"
  | "buyer_confirmed"
  | "releasing"
  | "paid";

function resolvePayoutStage(
  contractStatus: string,
  cropStatus: string,
  disputeFlag: boolean,
  pendingBuyerConfirmation: boolean,
  buyerConfirmedDelivery: boolean,
  paid: boolean,
): PayoutStage {
  if (paid) return "paid";
  if (disputeFlag) return "disputed";
  if (buyerConfirmedDelivery) return "buyer_confirmed";
  if (
    pendingBuyerConfirmation ||
    cropStatus === "harvested" ||
    cropStatus === "delivered"
  )
    return "awaiting_buyer";
  if (contractStatus === "funded" || contractStatus === "in_progress")
    return "escrow_funded";
  return "locked";
}

const PAYOUT_METHOD_ICONS: Record<string, React.ElementType> = {
  gcash: Smartphone,
  maya: Smartphone,
  cash: Banknote,
  bank: Landmark,
};

const PAYOUT_METHOD_LABEL: Record<string, string> = {
  gcash: "GCash",
  maya: "Maya",
  cash: "Cash Pickup",
  bank: "Bank Transfer",
};

function EscrowStatusBanner({ stage }: { stage: PayoutStage }) {
  const configs: Record<
    PayoutStage,
    { icon: React.ElementType; title: string; desc: string; iconColor: string }
  > = {
    locked: {
      icon: Lock,
      title: "Escrow Not Yet Funded",
      desc: "The buyer hasn't funded escrow yet. Payout unlocks once the contract is funded.",
      iconColor: "text-muted-foreground",
    },
    escrow_funded: {
      icon: Lock,
      title: "Escrow Funded & Secured",
      desc: "Buyer's payment is held in escrow. Submit milestone evidence to progress toward payout.",
      iconColor: "text-emerald-600",
    },
    awaiting_buyer: {
      icon: Hourglass,
      title: "Waiting for Buyer Confirmation",
      desc: "You've submitted delivery evidence. The buyer must co-confirm receipt before escrow releases.",
      iconColor: "text-amber-500",
    },
    disputed: {
      icon: ShieldAlert,
      title: "Escrow Frozen — Dispute Under Review",
      desc: "A dispute has been raised. All funds are frozen and this case is with PalAI admin.",
      iconColor: "text-destructive",
    },
    buyer_confirmed: {
      icon: ShieldCheck,
      title: "Buyer Confirmed Delivery — Payout Ready",
      desc: "Both parties have confirmed. Your escrow is now unlocked and ready to claim.",
      iconColor: "text-primary",
    },
    releasing: {
      icon: ArrowDownToLine,
      title: "Releasing Funds…",
      desc: "Transferring your payout now. This only takes a moment.",
      iconColor: "text-blue-500",
    },
    paid: {
      icon: CheckCircle2,
      title: "Payout Deposited!",
      desc: "Funds have been sent to your wallet. Check your app for confirmation.",
      iconColor: "text-emerald-500",
    },
  };

  const cfg = configs[stage];
  const Icon = cfg.icon;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", cfg.iconColor)} />
      <div>
        <p className="font-semibold text-foreground">{cfg.title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{cfg.desc}</p>
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
  const isDone = stage === "paid";
  const isActive = stage === "buyer_confirmed";

  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      <CardContent className="p-0">
        <div className="flex flex-col items-center justify-center py-8">
          {isDone && (
            <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500" />
          )}
          {stage === "releasing" && (
            <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          )}
          {stage === "disputed" && (
            <ShieldAlert className="mb-3 h-10 w-10 text-destructive" />
          )}
          {stage === "awaiting_buyer" && (
            <Hourglass className="mb-3 h-10 w-10 text-amber-500" />
          )}
          {isActive && <ShieldCheck className="mb-3 h-10 w-10 text-primary" />}
          {stage === "escrow_funded" && (
            <Wallet className="mb-3 h-10 w-10 text-foreground" />
          )}
          {stage === "locked" && (
            <Wallet className="mb-3 h-10 w-10 text-muted-foreground/40" />
          )}

          <p
            className={cn(
              "text-4xl font-bold tracking-tight transition-colors",
              isDone
                ? "text-emerald-600"
                : isActive
                  ? "text-primary"
                  : stage === "disputed"
                    ? "text-destructive"
                    : stage === "locked"
                      ? "text-muted-foreground/50" // Only gray out if not yet funded
                      : "text-foreground", // Solid black for awaiting_buyer, escrow_funded, etc.
            )}
          >
            ₱{amount.toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {volumeKg.toLocaleString()} kg × ₱{pricePerKg}/kg
          </p>
        </div>

        <div className="border-t border-border bg-muted/20 px-6 py-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Escrow amount</span>
            <span className="font-medium text-muted-foreground">
              ₱{amount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platform fee</span>
            <span className="font-medium text-muted-foreground">
              ₱0 (waived)
            </span>
          </div>
          <div
            className={cn(
              "flex justify-between border-t border-border pt-3 font-bold",
              stage === "locked" ? "text-muted-foreground" : "text-foreground",
            )}
          >
            <span>You receive</span>
            <span
              className={cn(
                isDone
                  ? "text-emerald-600"
                  : isActive
                    ? "text-primary"
                    : stage === "locked"
                      ? "text-muted-foreground/50"
                      : "text-foreground", // Matches the solid black logic above
              )}
            >
              ₱{amount.toLocaleString()}
            </span>
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
  method: string;
  farmerName: string;
}) {
  const Icon = PAYOUT_METHOD_ICONS[method] ?? Banknote;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background border border-border">
        <Icon className="h-5 w-5 text-foreground" />
      </div>
      <div>
        <p className="font-semibold text-foreground">
          {PAYOUT_METHOD_LABEL[method] || "Unknown"}
        </p>
        <p className="text-sm text-muted-foreground">{farmerName}</p>
      </div>
      <Badge variant="secondary" className="ml-auto capitalize">
        {method === "cash" ? "Pickup" : "Linked"}
      </Badge>
    </div>
  );
}

function PayoutTimeline({ stage }: { stage: PayoutStage }) {
  const steps = [
    { id: "escrow_funded", label: "Escrow funded by buyer", icon: Lock },
    {
      id: "awaiting_buyer",
      label: "Farmer submits delivery proof",
      icon: Upload,
    },
    {
      id: "buyer_confirmed",
      label: "Buyer co-confirms delivery",
      icon: ShieldCheck,
    },
    { id: "paid", label: "Funds deposited to wallet", icon: ArrowDownToLine },
  ] as const;

  const stageOrder: PayoutStage[] = [
    "locked",
    "escrow_funded",
    "awaiting_buyer",
    "buyer_confirmed",
    "releasing",
    "paid",
  ];
  const currentIdx = stageOrder.indexOf(stage);

  return (
    <div className="space-y-4">
      {steps.map((step) => {
        const stepIdx = stageOrder.indexOf(step.id as PayoutStage);
        const done = currentIdx > stepIdx;
        const active = currentIdx === stepIdx;
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                done
                  ? "border-primary bg-primary text-primary-foreground"
                  : active
                    ? "border-primary bg-background text-primary shadow-sm"
                    : "border-border bg-muted text-muted-foreground/40",
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <p
              className={cn(
                "flex-1 text-sm",
                done || active
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {step.label}
            </p>
            {done && <CheckCircle2 className="h-4 w-4 text-primary" />}
            {active && stage !== "disputed" && (
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function BuyerConfirmationDemoPanel({
  contractId,
  crop,
}: {
  contractId: string;
  crop: string;
}) {
  const verifyMilestone = useAppStore((s) => s.verifyMilestone);
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed) return null;

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Demo — Buyer Sign-off
      </p>
      <p className="mb-3 text-sm text-foreground">
        Simulating buyer confirmation for <strong>{crop}</strong>:
      </p>
      <button
        onClick={() => {
          verifyMilestone(contractId, "delivered");
          setConfirmed(true);
          toast.success("Buyer confirmed delivery!", {
            description: "Escrow is now unlocked. Farmer may claim payout.",
          });
        }}
        className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/80 active:scale-[0.98]"
      >
        <ShieldCheck className="h-4 w-4" />
        Confirm Delivery Received
      </button>
    </div>
  );
}

export function DirectPayoutView() {
  const contracts = useAppStore((s) => s.contracts);
  const soloFarmers = useAppStore((s) => s.soloFarmers);
  const farmer = soloFarmers[0];

  const eligibleContracts = contracts.filter((c) =>
    ["funded", "in_progress", "completed"].includes(c.status),
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    eligibleContracts[0]?.id ?? null,
  );
  const [paidContracts, setPaidContracts] = useState<Record<string, boolean>>(
    {},
  );
  const [releasing, setReleasing] = useState<Record<string, boolean>>({});

  const contract = contracts.find((c) => c.id === selectedId) ?? null;
  const isPaid = selectedId ? !!paidContracts[selectedId] : false;
  const isReleasing = selectedId ? !!releasing[selectedId] : false;

  const stage: PayoutStage = selectedId
    ? isReleasing
      ? "releasing"
      : resolvePayoutStage(
          contract?.status ?? "",
          contract?.cropStatus ?? "",
          contract?.disputeFlag ?? false,
          contract?.pendingBuyerConfirmation ?? false,
          contract?.buyerConfirmedDelivery ?? false,
          isPaid,
        )
    : "locked";

  const pricePerKg = 30;
  const payoutAmount = contract ? contract.volumeKg * pricePerKg : 0;

  const handleReleasePayout = async () => {
    if (!selectedId || stage !== "buyer_confirmed") return;
    setReleasing((r) => ({ ...r, [selectedId]: true }));
    await new Promise((res) => setTimeout(res, 2200));
    setReleasing((r) => ({ ...r, [selectedId]: false }));
    setPaidContracts((p) => ({ ...p, [selectedId]: true }));
    toast.success("Payout deposited!", {
      description: `₱${payoutAmount.toLocaleString()} sent to your ${
        PAYOUT_METHOD_LABEL[farmer.payoutMethod]
      }.`,
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
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium text-foreground">
              No funded contracts yet
            </p>
            <p className="text-sm text-muted-foreground">
              Payouts appear here once a buyer funds escrow for your contract.
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
          Direct Payout Wallet
        </h2>
        <p className="text-sm text-muted-foreground">
          Escrow releases only after{" "}
          <strong>both farmer and buyer confirm delivery</strong>. Any disputes
          freeze funds for admin review.
        </p>
      </div>

      {eligibleContracts.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {eligibleContracts.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={cn(
                "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                selectedId === c.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-accent",
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
            <EscrowStatusBanner stage={stage} />
            <PayoutAmountCard
              amount={payoutAmount}
              volumeKg={contract.volumeKg}
              pricePerKg={pricePerKg}
              stage={stage}
            />

            {stage === "awaiting_buyer" && (
              <BuyerConfirmationDemoPanel
                contractId={contract.id}
                crop={contract.crop}
              />
            )}

            {stage === "buyer_confirmed" && (
              <button
                onClick={handleReleasePayout}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
              >
                <ArrowDownToLine className="h-5 w-5" />
                Claim Payout to My {PAYOUT_METHOD_LABEL[farmer.payoutMethod]}
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {stage === "releasing" && (
              <div className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-accent/50 px-6 py-4 text-foreground">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
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
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wallet className="h-4 w-4 text-muted-foreground" /> Linked
                  Payout Wallet
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

            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-muted-foreground" /> Payout
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PayoutTimeline stage={stage} />
              </CardContent>
            </Card>

            {stage === "paid" && (
              <Card className="border-border shadow-sm bg-muted/10">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />{" "}
                    Transaction Record
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {[
                    ["Contract", contract.crop],
                    ["Amount", `₱${payoutAmount.toLocaleString()}`],
                    ["Method", PAYOUT_METHOD_LABEL[farmer.payoutMethod]],
                    [
                      "Date",
                      new Date().toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }),
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span
                        className={cn(
                          "font-medium text-foreground",
                          label === "Amount" && "text-emerald-600",
                        )}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verified by</span>
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Dual
                      sign-off
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      variant="secondary"
                      className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                    >
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
