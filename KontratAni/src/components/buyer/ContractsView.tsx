import {
  useAppStore,
  CropStatus,
  VERIFIED_PROGRESS_MAP,
} from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Lock,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Hourglass,
} from "lucide-react";
import ContractsIndex from "./contracts/ContractsIndex";

const MILESTONE_LABELS: Record<CropStatus, string> = {
  seeds_planted: "Seeds Planted",
  fertilized: "Fertilized",
  growing: "Growing",
  ready_for_harvest: "Ready for Harvest",
  harvested: "Harvested",
  delivered: "Delivered",
  pending: "Pending",
};

function getMilestoneLabel(status: CropStatus) {
  return MILESTONE_LABELS[status] ?? status.replace(/_/g, " ");
}

export function ContractsView() {
  const {
    contracts,
    selectedContractId,
    selectContract,
    fundContract,
    verifyMilestone,
    disputeMilestone,
  } = useAppStore();

  const [escrowModal, setEscrowModal] = useState(false);
  const [escrowSuccess, setEscrowSuccess] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [disputeModal, setDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [activeEvidenceStatus, setActiveEvidenceStatus] =
    useState<CropStatus | null>(null);
  const contract = contracts.find((c) => c.id === selectedContractId);

  const currentMilestoneProgress =
    VERIFIED_PROGRESS_MAP[contract?.cropStatus || "pending"] || 0;
  const needsVerification =
    contract &&
    contract.cropStatus !== "pending" &&
    contract.progress < currentMilestoneProgress;

  const currentMilestoneEvidence = contract?.milestoneEvidence?.find(
    (e) => e.cropStatus === contract.cropStatus,
  );

  const isCancelled = contract?.status === "declined";
  const displayVolumeKg = isCancelled ? 0 : (contract?.volumeKg ?? 0);
  const displayEscrowAmount = isCancelled ? 0 : (contract?.escrowAmount ?? 0);

  const hasDisputedEvidence =
    contract?.milestoneEvidence?.some(
      (e) => e.verificationStatus === "disputed",
    ) ?? false;

  if (!contract) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            My Contracts
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a contract to view details and traceability
          </p>
        </div>
        <div className="grid gap-3">
          {contracts.map((c) => (
            <button
              key={c.id}
              onClick={() => selectContract(c.id)}
              className="flex items-center justify-between rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent/50"
            >
              <div>
                <p className="font-display font-semibold">{c.crop}</p>
                <p className="text-sm text-muted-foreground">
                  {c.volumeKg.toLocaleString()} kg ·{" "}
                  {c.matchedCooperative?.name || c.buyerName || "Unmatched"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* ── NEW: show dispute/pending badges in contract list ─────── */}
                {c.disputeFlag && (
                  <Badge className="border-red-200 bg-red-50 text-red-700 text-xs">
                    <ShieldAlert className="mr-1 h-3 w-3" /> Disputed
                  </Badge>
                )}
                {c.pendingBuyerConfirmation && !c.disputeFlag && (
                  <Badge className="border-amber-200 bg-amber-50 text-amber-700 text-xs">
                    <Hourglass className="mr-1 h-3 w-3" /> Needs Confirmation
                  </Badge>
                )}
                {/* ── END ──────────────────────────────────────────────────── */}
                {c.status === "declined" ? (
                  <Badge className="border-red-200 bg-red-50 text-red-700 text-xs">
                    Declined
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    {c.status.replace("_", " ")}
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const handleFundEscrow = () => {
    fundContract(contract.id);
    setEscrowSuccess(true);
  };
  const handleConfirmEvidence = () => {
    if (!activeEvidenceStatus) return;
    verifyMilestone(contract.id, activeEvidenceStatus);
    setConfirmModal(false);
    setActiveEvidenceStatus(null);
  };
  const handleRaiseDispute = () => {
    if (!activeEvidenceStatus || !disputeReason.trim()) return;
    disputeMilestone(contract.id, activeEvidenceStatus, disputeReason.trim());
    setDisputeReason("");
    setDisputeModal(false);
    setActiveEvidenceStatus(null);
  };

  return (
    <div className="space-y-6" style={{ opacity: isCancelled ? 0.75 : 1 }}>
      <button
        onClick={() => selectContract(null)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to contracts
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h2
            className={`font-display text-2xl font-bold ${
              isCancelled ? "text-muted-foreground" : "text-foreground"
            }`}
          >
            {contract.crop}
          </h2>
          <p className="text-sm text-muted-foreground">
            {displayVolumeKg.toLocaleString()} kg ·{" "}
            {contract.matchedCooperative?.name ||
              contract.buyerName ||
              "Unmatched"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {contract.escrowAmount === 0 &&
            contract.status !== "open" &&
            !isCancelled && (
              <Button
                onClick={() => {
                  setEscrowModal(true);
                  setEscrowSuccess(false);
                }}
                className="bg-terracotta text-terracotta-foreground hover:bg-terracotta/90"
              >
                <Lock className="mr-2 h-4 w-4" /> Lock Funds in Escrow
              </Button>
            )}
          {displayEscrowAmount > 0 && (
            <Badge className="bg-primary text-primary-foreground px-3 py-1.5">
              ₱{displayEscrowAmount.toLocaleString()} Escrowed
            </Badge>
          )}
          {/* ── NEW: dispute frozen badge ─────────────────────────────────── */}
          {contract.disputeFlag && (
            <Badge className="border-red-200 bg-red-50 text-red-700 px-3 py-1.5">
              <ShieldAlert className="mr-1.5 h-3.5 w-3.5" /> Escrow Frozen
            </Badge>
          )}
          {/* ── END ────────────────────────────────────────────────────────── */}
        </div>
      </div>

      {/* ── NEW: Buyer milestone verifier banner ───────────────────────────────
          Appears when the farmer has advanced the crop status to a milestone
          that needs buyer verification, regardless of evidence submission.
      ── END ── */}
      {needsVerification && !contract.disputeFlag && !isCancelled && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <Hourglass className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">
                Action Required: Verify Progress Update
              </p>
              <p className="mt-1 text-sm text-amber-700">
                The farmer has reported reaching the{" "}
                <span className="font-semibold">
                  {getMilestoneLabel(contract.cropStatus)}
                </span>{" "}
                milestone. Please review and confirm or dispute this progress
                update.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-amber-800">
                  {getMilestoneLabel(contract.cropStatus)} milestone reported
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  {currentMilestoneEvidence ? (
                    <>
                      {currentMilestoneEvidence.photoFileName ? (
                        <>Photo: {currentMilestoneEvidence.photoFileName}. </>
                      ) : (
                        "No photo evidence submitted. "
                      )}
                      Reported:{" "}
                      {new Date(
                        currentMilestoneEvidence.submittedAt,
                      ).toLocaleString("en-PH", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </>
                  ) : (
                    "No evidence submitted for this milestone."
                  )}
                </p>
                {currentMilestoneEvidence?.disputeReason && (
                  <p className="mt-2 text-xs text-red-600">
                    Dispute reason: {currentMilestoneEvidence.disputeReason}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setActiveEvidenceStatus(contract.cropStatus);
                    setDisputeModal(true);
                  }}
                >
                  <ShieldAlert className="h-4 w-4" /> Dispute
                </Button>
                <Button
                  size="sm"
                  className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => {
                    setActiveEvidenceStatus(contract.cropStatus);
                    setConfirmModal(true);
                  }}
                >
                  <ShieldCheck className="h-4 w-4" /> Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="rounded-xl border border-border bg-muted p-5 text-muted-foreground">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-semibold text-muted-foreground">
                Contract Cancelled
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                This contract has been cancelled. All values are frozen at zero,
                actions are disabled, and the view is presented in muted style.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── NEW: dispute frozen banner ─────────────────────────────────────────
          Shown when any party has raised a dispute. Escrow is locked and the
          buyer is informed that admin review is underway.
      ── END ── */}
      {contract.disputeFlag && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">
                Escrow Frozen — Dispute Under Review
              </p>
              <p className="mt-1 text-sm text-red-700">
                A dispute has been raised on this contract. The escrow of{" "}
                <strong>₱{contract.escrowAmount.toLocaleString()}</strong> is
                frozen. PalAI admin has been notified and will resolve this
                case. No funds will be released until the dispute is resolved.
              </p>
              {contract.milestoneEvidence
                .filter((e) => e.verificationStatus === "disputed")
                .map((e, i) => (
                  <p key={i} className="mt-1 text-xs text-red-600">
                    Dispute reason: {e.disputeReason}
                  </p>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ── NEW: buyer confirmed delivery success banner ───────────────────────
          Shown after buyerConfirmedDelivery = true, replacing the action banner.
      ── END ── */}
      {contract.buyerConfirmedDelivery && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-800">
                Delivery Confirmed — Escrow Released
              </p>
              <p className="text-sm text-emerald-700">
                You have co-confirmed delivery. Funds have been released to the
                cooperative for distribution to farmers.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isCancelled && <ContractsIndex />}

      {/* Cooperative Details — unchanged */}
      {!isCancelled && contract.matchedCooperative && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cooperative Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>{" "}
                {contract.matchedCooperative.name}
              </div>
              <div>
                <span className="text-muted-foreground">Region:</span>{" "}
                {contract.matchedCooperative.region}
              </div>
              <div>
                <span className="text-muted-foreground">Total Hectares:</span>{" "}
                {contract.matchedCooperative.totalHectares}
              </div>
              <div>
                <span className="text-muted-foreground">Members:</span>{" "}
                {contract.matchedCooperative.members.length}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Escrow Modal — unchanged */}
      <Dialog open={escrowModal} onOpenChange={setEscrowModal}>
        <DialogContent>
          {!escrowSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle>Lock Funds in Escrow</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-4">
                <p className="text-sm text-muted-foreground">
                  You are about to lock{" "}
                  <span className="font-semibold text-foreground">
                    ₱{(contract.volumeKg * 30).toLocaleString()}
                  </span>{" "}
                  in a secure escrow account for this contract.
                </p>
                <p className="text-xs text-muted-foreground">
                  Funds will be released to the cooperative upon verified
                  delivery.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEscrowModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleFundEscrow}
                  className="bg-terracotta text-terracotta-foreground hover:bg-terracotta/90"
                >
                  <Lock className="mr-2 h-4 w-4" /> Confirm & Lock Funds
                </Button>
              </DialogFooter>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-primary"
              >
                <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
              </motion.div>
              <div className="text-center">
                <p className="font-display text-lg font-bold text-foreground">
                  Funds Locked Successfully
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  ₱{contract.escrowAmount.toLocaleString()} is now in escrow
                </p>
              </div>
              <Button onClick={() => setEscrowModal(false)} className="mt-2">
                Close
              </Button>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── NEW: Progress verification modal ───────────────────────────────────
          Buyer confirms milestone evidence submitted by the farmer. This calls
          verifyMilestone(cropStatus) in the store for the selected milestone.
      ── END ── */}
      <Dialog open={confirmModal} onOpenChange={setConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Confirm Progress Update
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              You are confirming the farmer's report that the{" "}
              <span className="font-semibold text-foreground">
                {getMilestoneLabel(activeEvidenceStatus || "pending")}
              </span>{" "}
              milestone has been reached.
            </p>
            <p className="text-sm text-muted-foreground">
              This will update the contract progress and mark this milestone as
              verified.
            </p>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
              ⚠️ This action is irreversible. Only confirm if you believe the
              progress report is accurate.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmEvidence}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <ShieldCheck className="mr-2 h-4 w-4" /> Yes, Confirm Progress
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── NEW: Dispute modal ───────────────────────────────────────────────────
          Buyer raises a dispute on the submitted delivery evidence.
          This calls disputeMilestone("delivered", reason) which sets
          disputeFlag = true, freezing the escrow for admin review.
      ── END ── */}
      <Dialog open={disputeModal} onOpenChange={setDisputeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              Raise a Dispute
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              Raising a dispute will immediately freeze the escrow of{" "}
              <span className="font-semibold text-foreground">
                ₱{contract.escrowAmount.toLocaleString()}
              </span>{" "}
              and escalate this case to PalAI admin for review.
            </p>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Reason for dispute <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="e.g. Goods received were below agreed quality / wrong quantity delivered..."
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-400 focus:outline-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDisputeModal(false);
                setDisputeReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRaiseDispute}
              disabled={!disputeReason.trim()}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
            >
              <ShieldAlert className="mr-2 h-4 w-4" /> Freeze Escrow & Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
