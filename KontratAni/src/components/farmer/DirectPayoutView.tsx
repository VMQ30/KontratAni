import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import {
  Wallet, CheckCircle2, Clock, Lock, Banknote, ArrowDownToLine,
  Smartphone, AlertCircle, ChevronRight,
  // ── new code starts here ───────────────────────────────────────────────────
  // Three new icons for the verification states added to PayoutStage.
  // ShieldAlert = disputed/frozen, Hourglass = awaiting buyer, ShieldCheck = confirmed
  ShieldAlert, Hourglass, ShieldCheck,
  // ── end ─────────────────────────────────────────────────────────────────────
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
 
// ── modified code starts here ─────────────────────────────────────────────────
// previous PayoutStage:
//   "locked" | "escrow_funded" | "harvest_complete" | "releasing" | "paid"
//
// New PayoutStage adds two stages and renames one:
//   "awaiting_buyer"  — farmer submitted delivery, buyer hasn't confirmed yet
//                       (replaces "harvest_complete" which was premature;
//                        harvest alone is not sufficient to release escrow)
//   "disputed"        — disputeFlag is true; escrow frozen, no payout possible
//   "buyer_confirmed" — buyer called verifyMilestone("delivered"); payout now claimable
//                       (replaces "harvest_complete" as the payout-unlock signal)
type PayoutStage =
  | "locked"
  | "escrow_funded"
  | "awaiting_buyer"
  | "disputed"
  | "buyer_confirmed"
  | "releasing"
  | "paid";
// ── end ───────────────────────────────────────────────────────────────────────
 
// ── modified code starts here ─────────────────────────────────────────────────
// previous getPayoutStage (was named getPayoutStage, now resolvePayoutStage):
//   if (paid)                                              return "paid";
//   if (cropStatus === "harvested" || === "delivered")     return "harvest_complete";
//   if (contractStatus === "funded" || "in_progress")      return "escrow_funded";
//   return "locked";
//
// Crop status alone is no longer sufficient to unlock payout.
// The function now takes the three new Contract fields and uses them:
//   disputeFlag             → "disputed"      (checked first, highest priority)
//   buyerConfirmedDelivery  → "buyer_confirmed"
//   pendingBuyerConfirmation or delivered/harvested → "awaiting_buyer"
// "harvest_complete" removed entirely — "buyer_confirmed" is the new unlock.
function resolvePayoutStage(
  contractStatus: string,
  cropStatus: string,
  disputeFlag: boolean,
  pendingBuyerConfirmation: boolean,
  buyerConfirmedDelivery: boolean,
  paid: boolean,
): PayoutStage {
  if (paid)                    return "paid";
  if (disputeFlag)             return "disputed";
  if (buyerConfirmedDelivery)  return "buyer_confirmed";
  if (pendingBuyerConfirmation || cropStatus === "harvested" || cropStatus === "delivered")
                               return "awaiting_buyer";
  if (contractStatus === "funded" || contractStatus === "in_progress")
                               return "escrow_funded";
  return "locked";
}
// ── end ───────────────────────────────────────────────────────────────────────
 
// ── PAYOUT_METHOD_ICONS / COLORS / LABEL — unchanged ─────────────────────────
const PAYOUT_METHOD_ICONS: Record<string, React.ElementType> = {
  gcash: Smartphone, maya: Smartphone, cash: Banknote,
};
const PAYOUT_METHOD_COLORS: Record<string, string> = {
  gcash: "border-blue-200 bg-blue-50 text-blue-700",
  maya:  "border-violet-200 bg-violet-50 text-violet-700",
  cash:  "border-amber-200 bg-amber-50 text-amber-700",
};
const PAYOUT_METHOD_LABEL: Record<string, string> = {
  gcash: "GCash", maya: "Maya", cash: "Cash Pickup",
};
 
// ── modified code starts here ─────────────────────────────────────────────────
// previous EscrowStatusBanner configs had 5 entries:
//   locked, escrow_funded, harvest_complete, releasing, paid
//
// New configs cover all 7 PayoutStage values:
//   "awaiting_buyer" replaces "harvest_complete" with accurate messaging
//   "disputed"       is entirely new — shown when escrow is frozen
//   "buyer_confirmed" replaces "harvest_complete" as the payout-unlock state
//
// The "harvest_complete" description said "Your crop status is verified. Click
// below to release funds." This was misleading — harvest alone doesn't verify
// anything under the new dual sign-off model.
//
// Also fixed one copy error: "KontratAni admin" → "PalAI admin"
function EscrowStatusBanner({ stage }: { stage: PayoutStage }) {
  const configs: Record<PayoutStage, { icon: React.ElementType; title: string; desc: string; className: string }> = {
    locked: {
      icon: Lock,
      title: "Escrow Not Yet Funded",
      desc: "The buyer hasn't funded escrow yet. Payout unlocks once the contract is funded.",
      className: "border-border bg-muted/50 text-muted-foreground",
    },
    escrow_funded: {
      icon: Lock,
      title: "Escrow Funded & Secured",
      desc: "Buyer's payment is held in escrow. Submit milestone evidence to progress toward payout.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    // new code starts here ─────────────────────────────────────────────────────
    awaiting_buyer: {
      icon: Hourglass,
      title: "Waiting for Buyer Confirmation",
      desc: "You've submitted delivery evidence. The buyer must co-confirm receipt before escrow releases. This protects both parties.",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    disputed: {
      icon: ShieldAlert,
      title: "Escrow Frozen — Dispute Under Review",
      desc: "A dispute has been raised. All funds are frozen and this case is with PalAI admin. No payout will be processed until resolved.",
      className: "border-red-200 bg-red-50 text-red-700",
    },
    buyer_confirmed: {
      icon: ShieldCheck,
      title: "Buyer Confirmed Delivery — Payout Ready",
      desc: "Both parties have confirmed. Your escrow is now unlocked and ready to claim.",
      className: "border-[#2D6A4F]/30 bg-[#2D6A4F]/10 text-[#2D6A4F]",
    },
    // end ───────────────────────────────────────────────────────────────────────
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
// ── end ───────────────────────────────────────────────────────────────────────
 
// ── modified code starts here ─────────────────────────────────────────────────
// previous PayoutAmountCard had 3 visual states: paid, harvest_complete, locked.
// New version has 5:
//   paid             → green
//   buyer_confirmed  → [#2D6A4F] green (payout claimable but not yet transferred)
//   disputed         → red with ShieldAlert icon
//   awaiting_buyer   → amber with Hourglass icon
//   locked / escrow_funded → muted with Wallet icon
function PayoutAmountCard({ amount, volumeKg, pricePerKg, stage }: {
  amount: number; volumeKg: number; pricePerKg: number; stage: PayoutStage;
}) {
  const isDone   = stage === "paid";
  const isActive = stage === "buyer_confirmed";
  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-500",
      isDone              && "border-emerald-200 shadow-md shadow-emerald-100",
      stage === "disputed" && "border-red-200",
    )}>
      <CardContent className="p-0">
        <div className={cn(
          "flex flex-col items-center justify-center py-8 transition-colors duration-500",
          isDone                       ? "bg-emerald-50"
          : isActive                   ? "bg-[#2D6A4F]/5"
          : stage === "disputed"       ? "bg-red-50/50"
          : stage === "awaiting_buyer" ? "bg-amber-50/50"
          : "bg-muted/30",
        )}>
          {isDone                       && <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500" />}
          {stage === "releasing"        && <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-[#2D6A4F]/20 border-t-[#2D6A4F]" />}
          {stage === "disputed"         && <ShieldAlert  className="mb-3 h-10 w-10 text-red-400" />}
          {stage === "awaiting_buyer"   && <Hourglass    className="mb-3 h-10 w-10 text-amber-400" />}
          {isActive                     && <ShieldCheck  className="mb-3 h-10 w-10 text-[#2D6A4F]" />}
          {["locked", "escrow_funded"].includes(stage) && <Wallet className="mb-3 h-10 w-10 text-muted-foreground/30" />}
 
          <p className={cn(
            "text-4xl font-bold tracking-tight transition-colors duration-300",
            isDone                ? "text-emerald-600"
            : isActive            ? "text-[#2D6A4F]"
            : stage === "disputed" ? "text-red-400"
            : "text-muted-foreground/40",
          )}>
            ₱{amount.toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {volumeKg.toLocaleString()} kg × ₱{pricePerKg}/kg
          </p>
        </div>
 
        <div className="border-t border-border px-6 py-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Escrow amount</span>
            <span className="font-medium">₱{amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platform fee</span>
            <span className="font-medium text-muted-foreground">₱0 (waived)</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3 font-bold">
            <span>You receive</span>
            <span className={cn(isDone ? "text-emerald-600" : isActive ? "text-[#2D6A4F]" : "")}>
              ₱{amount.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
// ── end ───────────────────────────────────────────────────────────────────────
 
// ── WalletCard — unchanged ────────────────────────────────────────────────────
function WalletCard({ method, farmerName }: { method: "gcash" | "maya" | "cash"; farmerName: string }) {
  const Icon = PAYOUT_METHOD_ICONS[method] ?? Banknote;
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border p-4", PAYOUT_METHOD_COLORS[method])}>
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
 
// ── modified code starts here ─────────────────────────────────────────────────
// previous PayoutTimeline had 3 steps:
//   "escrow_funded" → "harvest_complete" → "paid"
//
// New PayoutTimeline has 4 steps, replacing "harvest_complete" with two steps
// that reflect the actual dual sign-off sequence:
//   "escrow_funded" → "awaiting_buyer" (farmer submits) →
//   "buyer_confirmed" (buyer confirms) → "paid"
function PayoutTimeline({ stage }: { stage: PayoutStage }) {
  const steps = [
    { id: "escrow_funded",   label: "Escrow funded by buyer",       icon: Lock           },
    { id: "awaiting_buyer",  label: "Farmer submits delivery proof", icon: Upload         },
    { id: "buyer_confirmed", label: "Buyer co-confirms delivery",    icon: ShieldCheck    },
    { id: "paid",            label: "Funds deposited to wallet",     icon: ArrowDownToLine},
  ] as const;
 
  const stageOrder: PayoutStage[] = [
    "locked", "escrow_funded", "awaiting_buyer", "buyer_confirmed", "releasing", "paid",
  ];
  const currentIdx = stageOrder.indexOf(stage);
 
  return (
    <div className="space-y-3">
      {steps.map((step) => {
        const stepIdx = stageOrder.indexOf(step.id as PayoutStage);
        const done    = currentIdx > stepIdx;
        const active  = currentIdx === stepIdx;
        const Icon    = step.icon;
        return (
          <div key={step.id} className="flex items-center gap-3">
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
              done   ? "border-[#2D6A4F] bg-[#2D6A4F] text-white"
              : active ? "border-[#2D6A4F] bg-white text-[#2D6A4F]"
              : "border-border bg-muted text-muted-foreground/30",
            )}>
              <Icon className="h-4 w-4" />
            </div>
            <p className={cn(
              "flex-1 text-sm",
              done || active ? "font-medium text-foreground" : "text-muted-foreground/60",
            )}>
              {step.label}
            </p>
            {done && <CheckCircle2 className="h-4 w-4 text-[#2D6A4F]" />}
            {active && stage !== "disputed" && (
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            )}
          </div>
        );
      })}
    </div>
  );
}
// ── end ───────────────────────────────────────────────────────────────────────
 
// ── new code starts here ──────────────────────────────────────────────────────
// BuyerConfirmationDemoPanel: a demo-only panel visible in the "awaiting_buyer"
// stage. In production the buyer action lives entirely in ContractsView (Buyer
// Portal). This panel is provided here so hackathon judges can demo the full
// dual sign-off flow without switching browser tabs or portals.
// It calls verifyMilestone("delivered") in the store, which:
//   - Sets buyerConfirmedDelivery = true
//   - Sets pendingBuyerConfirmation = false
//   - Advances progress to 100
//   - Sets contract.status = "completed"
// → This triggers stage to become "buyer_confirmed" and the claim button appears.
function BuyerConfirmationDemoPanel({ contractId, crop }: { contractId: string; crop: string }) {
  const verifyMilestone = useAppStore((s) => s.verifyMilestone);
  const [confirmed, setConfirmed] = useState(false);
 
  if (confirmed) return null;
 
  return (
    <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/60 p-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-600">
        Demo — Buyer Sign-off Panel
      </p>
      <p className="mb-3 text-sm text-amber-800">
        In production this action lives in the Buyer Portal. Simulating buyer
        confirmation for <strong>{crop}</strong>:
      </p>
      <button
        onClick={() => {
          verifyMilestone(contractId, "delivered");
          setConfirmed(true);
          toast.success("Buyer confirmed delivery!", {
            description: "Escrow is now unlocked. Farmer may claim payout.",
            duration: 4000,
          });
        }}
        className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 active:scale-[0.98]"
      >
        <ShieldCheck className="h-4 w-4" />
        Confirm Delivery Received (as Buyer)
      </button>
    </div>
  );
}
// ── end ───────────────────────────────────────────────────────────────────────
 
export function DirectPayoutView() {
  const contracts   = useAppStore((s) => s.contracts);
  const soloFarmers = useAppStore((s) => s.soloFarmers);
  const farmer = soloFarmers[0];
 
  const eligibleContracts = contracts.filter((c) =>
    ["funded", "in_progress", "completed"].includes(c.status),
  );
 
  const [selectedId,    setSelectedId]    = useState<string | null>(eligibleContracts[0]?.id ?? null);
  const [paidContracts, setPaidContracts] = useState<Record<string, boolean>>({});
  const [releasing,     setReleasing]     = useState<Record<string, boolean>>({});
 
  const contract    = contracts.find((c) => c.id === selectedId) ?? null;
  const isPaid      = selectedId ? !!paidContracts[selectedId] : false;
  const isReleasing = selectedId ? !!releasing[selectedId] : false;
 
  // ── modified code starts here ───────────────────────────────────────────────
  // previous stage derivation:
  //   resolvePayoutStage(contract.status, contract.cropStatus, isPaid)
  //   — only 3 arguments, no verification fields
  //
  // New derivation passes all 6 arguments including the three new Contract fields.
  // isReleasing short-circuits to "releasing" so the spinner shows immediately
  // on click without waiting for the async setTimeout to finish.
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
  // ── end ─────────────────────────────────────────────────────────────────────
 
  const pricePerKg   = 30;
  const payoutAmount = contract ? contract.volumeKg * pricePerKg : 0;
 
  // ── modified code starts here ───────────────────────────────────────────────
  // previous handleReleasePayout guard: stage !== "harvest_complete"
  // New guard: stage !== "buyer_confirmed"
  // The farmer cannot claim payout until the buyer has explicitly co-confirmed.
  // Calling this when stage is "awaiting_buyer" or "disputed" does nothing
  // because the claim button is not rendered in those states.
  const handleReleasePayout = async () => {
    if (!selectedId || stage !== "buyer_confirmed") return;
    setReleasing((r) => ({ ...r, [selectedId]: true }));
    await new Promise((res) => setTimeout(res, 2200));
    setReleasing((r) => ({ ...r, [selectedId]: false }));
    setPaidContracts((p) => ({ ...p, [selectedId]: true }));
    toast.success("Payout deposited!", {
      description: `₱${payoutAmount.toLocaleString()} sent to your ${PAYOUT_METHOD_LABEL[farmer.payoutMethod]}.`,
      duration: 5000,
    });
  };
  // ── end ─────────────────────────────────────────────────────────────────────
 
  if (!farmer) return null;
 
  if (eligibleContracts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Direct Payout Wallet</h2>
          <p className="text-sm text-muted-foreground">Track and receive your escrow payout here.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium text-muted-foreground">No funded contracts yet</p>
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
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Direct Payout Wallet</h2>
        {/* modified code starts here ─────────────────────────────────────────
            previous subtitle: "Your escrow payout auto-deposits once harvest is confirmed."
            New subtitle makes the dual sign-off requirement explicit.
        ── end ── */}
        <p className="text-sm text-muted-foreground">
          Escrow releases only after <strong>both farmer and buyer confirm delivery</strong>.
          Any disputes freeze funds for admin review.
        </p>
      </div>
 
      {/* Contract selector — unchanged */}
      {eligibleContracts.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {eligibleContracts.map((c) => (
            <button key={c.id} onClick={() => setSelectedId(c.id)}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                selectedId === c.id
                  ? "border-[#2D6A4F] bg-[#2D6A4F] text-white"
                  : "border-border bg-background text-foreground hover:border-[#2D6A4F]/50",
              )}>
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
            <PayoutAmountCard amount={payoutAmount} volumeKg={contract.volumeKg} pricePerKg={pricePerKg} stage={stage} />
 
            {/* new code starts here ─────────────────────────────────────────
                BuyerConfirmationDemoPanel: only shown in "awaiting_buyer" stage.
                Provides the buyer-side dual sign-off action for demo purposes.
            ── end ── */}
            {stage === "awaiting_buyer" && (
              <BuyerConfirmationDemoPanel contractId={contract.id} crop={contract.crop} />
            )}
 
            {/* modified code starts here ─────────────────────────────────────
                previous CTA: shown when stage === "harvest_complete"
                New CTA: shown only when stage === "buyer_confirmed"
                Label changed from "Release Payout" to "Claim Payout" to convey
                that this is the farmer pulling confirmed funds, not releasing them.
            ── end ── */}
            {stage === "buyer_confirmed" && (
              <button onClick={handleReleasePayout}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2D6A4F] px-6 py-4 text-base font-semibold text-white transition-all hover:bg-[#1F4A38] active:scale-[0.98]">
                <ArrowDownToLine className="h-5 w-5" />
                Claim Payout to My {PAYOUT_METHOD_LABEL[farmer.payoutMethod]}
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
                  ₱{payoutAmount.toLocaleString()} deposited to your {PAYOUT_METHOD_LABEL[farmer.payoutMethod]}
                </span>
              </div>
            )}
          </div>
 
          {/* Right column */}
          <div className="space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wallet className="h-4 w-4 text-[#2D6A4F]" /> Linked Payout Wallet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <WalletCard method={farmer.payoutMethod} farmerName={farmer.name} />
                <p className="text-xs text-muted-foreground">
                  To change your payout method, go to <strong>Profile & Land</strong>.
                </p>
              </CardContent>
            </Card>
 
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-[#2D6A4F]" /> Payout Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PayoutTimeline stage={stage} />
              </CardContent>
            </Card>
 
            {stage === "paid" && (
              <Card className="border-emerald-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Transaction Record
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {[
                    ["Contract", contract.crop],
                    ["Amount",   `₱${payoutAmount.toLocaleString()}`],
                    ["Method",   PAYOUT_METHOD_LABEL[farmer.payoutMethod]],
                    ["Date",     new Date().toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span className={cn("font-medium", label === "Amount" && "text-emerald-600")}>{value}</span>
                    </div>
                  ))}
                  {/* new code starts here ─────────────────────────────────────
                      "Verified by" row added to transaction record.
                      Confirms to the farmer that dual sign-off was completed.
                  ── end ── */}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verified by</span>
                    <span className="flex items-center gap-1 font-medium text-emerald-600">
                      <ShieldCheck className="h-3.5 w-3.5" /> Dual sign-off
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className="bg-emerald-100 text-emerald-700">Completed</Badge>
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
 