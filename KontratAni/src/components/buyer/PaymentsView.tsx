// PaymentsView.tsx (Buyer)

import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  CheckCircle2,
  ShieldAlert,
  Hourglass,
  ShieldCheck,
  Lock,
} from "lucide-react";

export function PaymentsView() {
  const { contracts } = useAppStore();

  const funded = contracts.filter((c) => c.escrowAmount > 0);
  const totalEscrow = funded.reduce((s, c) => s + c.escrowAmount, 0);
  const frozenEscrow = funded
    .filter((c) => c.disputeFlag)
    .reduce((s, c) => s + c.escrowAmount, 0);
  const awaitingEscrow = funded
    .filter(
      (c) =>
        !c.disputeFlag &&
        !c.buyerConfirmedDelivery &&
        c.pendingBuyerConfirmation,
    )
    .reduce((s, c) => s + c.escrowAmount, 0);
  const releasedEscrow = funded
    .filter((c) => c.buyerConfirmedDelivery && !c.disputeFlag)
    .reduce((s, c) => s + c.escrowAmount, 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Payments
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of escrow and payment status
        </p>
      </div>

      {/* ── MODIFIED: summary card split into 3 tiles to show escrow breakdown ──
          previous: single card showing only totalEscrow.
          Now shows: total locked, frozen (disputed), awaiting confirmation,
          and already released — giving the buyer a full picture.
      ── END ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20 bg-accent/30 lg:col-span-1">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Wallet className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Escrowed</p>
              <p className="font-display text-2xl font-bold text-foreground">
                ₱{totalEscrow.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── NEW: frozen escrow tile ─────────────────────────────────────────── */}
        <Card
          className={`lg:col-span-1 ${frozenEscrow > 0 ? "border-red-200 bg-red-50/50" : "border-border/60"}`}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${frozenEscrow > 0 ? "bg-red-100" : "bg-muted"}`}
            >
              <ShieldAlert
                className={`h-6 w-6 ${frozenEscrow > 0 ? "text-red-600" : "text-muted-foreground/40"}`}
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Frozen (Disputed)</p>
              <p
                className={`font-display text-2xl font-bold ${frozenEscrow > 0 ? "text-red-700" : "text-muted-foreground"}`}
              >
                ₱{frozenEscrow.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── NEW: awaiting confirmation tile ─────────────────────────────────── */}
        <Card
          className={`lg:col-span-1 ${awaitingEscrow > 0 ? "border-amber-200 bg-amber-50/50" : "border-border/60"}`}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${awaitingEscrow > 0 ? "bg-amber-100" : "bg-muted"}`}
            >
              <Hourglass
                className={`h-6 w-6 ${awaitingEscrow > 0 ? "text-amber-600" : "text-muted-foreground/40"}`}
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Awaiting Your Confirmation
              </p>
              <p
                className={`font-display text-2xl font-bold ${awaitingEscrow > 0 ? "text-amber-700" : "text-muted-foreground"}`}
              >
                ₱{awaitingEscrow.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── NEW: released tile ──────────────────────────────────────────────── */}
        <Card
          className={`lg:col-span-1 ${releasedEscrow > 0 ? "border-emerald-200 bg-emerald-50/50" : "border-border/60"}`}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${releasedEscrow > 0 ? "bg-emerald-100" : "bg-muted"}`}
            >
              <ShieldCheck
                className={`h-6 w-6 ${releasedEscrow > 0 ? "text-emerald-600" : "text-muted-foreground/40"}`}
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Released to Farmers
              </p>
              <p
                className={`font-display text-2xl font-bold ${releasedEscrow > 0 ? "text-emerald-700" : "text-muted-foreground"}`}
              >
                ₱{releasedEscrow.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        {/* ── END ────────────────────────────────────────────────────────────────── */}
      </div>

      {/* ── NEW: frozen contracts alert section ─────────────────────────────────
          If any contract is disputed, surface a prominent alert so the buyer
          knows they have escrow frozen and needs admin resolution.
      ── END ── */}
      {funded.some((c) => c.disputeFlag) && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">
                Disputed Contracts Detected
              </p>
              <p className="mt-0.5 text-sm text-red-700">
                {funded.filter((c) => c.disputeFlag).length} contract(s) have
                active disputes. Escrow funds are frozen pending PalAI admin
                review. Go to <strong>My Contracts</strong> to view details.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── NEW: pending confirmation alert ─────────────────────────────────────
          If any contract has pending buyer confirmation, prompt the buyer
          to go confirm so farmers aren't left waiting.
      ── END ── */}
      {funded.some((c) => c.pendingBuyerConfirmation && !c.disputeFlag) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <Hourglass className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">
                Delivery Confirmation Required
              </p>
              <p className="mt-0.5 text-sm text-amber-700">
                {
                  funded.filter(
                    (c) => c.pendingBuyerConfirmation && !c.disputeFlag,
                  ).length
                }{" "}
                contract(s) are awaiting your delivery confirmation. Go to{" "}
                <strong>My Contracts</strong> to confirm and release escrow to
                farmers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contract list */}
      <div className="space-y-3">
        {contracts.map((c) => (
          <Card
            key={c.id}
            className={
              c.disputeFlag
                ? "border-red-200"
                : c.pendingBuyerConfirmation && !c.buyerConfirmedDelivery
                  ? "border-amber-200"
                  : c.buyerConfirmedDelivery
                    ? "border-emerald-200"
                    : ""
            }
          >
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-display text-sm font-semibold">{c.crop}</p>
                <p className="text-xs text-muted-foreground">
                  {c.matchedCooperative?.name || "Unmatched"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {c.escrowAmount > 0 ? (
                  <div className="text-right">
                    <p className="font-display text-sm font-bold text-primary">
                      ₱{c.escrowAmount.toLocaleString()}
                    </p>
                    {/* ── MODIFIED: badge reflects verification state instead of always showing "Funded"
                        previous:
                          <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Funded
                          </Badge>
                    ── END ── */}
                    {c.disputeFlag ? (
                      <Badge
                        variant="secondary"
                        className="mt-1 border-red-200 bg-red-50 text-red-700"
                      >
                        <ShieldAlert className="mr-1 h-3 w-3" /> Frozen
                      </Badge>
                    ) : c.buyerConfirmedDelivery ? (
                      <Badge
                        variant="secondary"
                        className="mt-1 border-emerald-200 bg-emerald-50 text-emerald-700"
                      >
                        <ShieldCheck className="mr-1 h-3 w-3" /> Confirmed
                      </Badge>
                    ) : c.pendingBuyerConfirmation ? (
                      <Badge
                        variant="secondary"
                        className="mt-1 border-amber-200 bg-amber-50 text-amber-700"
                      >
                        <Hourglass className="mr-1 h-3 w-3" /> Needs
                        Confirmation
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="mt-1 bg-primary/10 text-primary"
                      >
                        <Lock className="mr-1 h-3 w-3" /> Funded
                      </Badge>
                    )}
                    {/* ── END ────────────────────────────────────────────────── */}
                  </div>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-sand text-sand-foreground"
                  >
                    Pending
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
