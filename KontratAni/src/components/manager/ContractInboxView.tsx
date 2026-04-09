// ContractInboxView.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import {
  Check,
  X,
  FileText,
  Calendar,
  Package,
  Building2,
  ShieldCheck,
  Hourglass,
  ShieldAlert,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

export function ContractInboxView() {
  const contracts = useAppStore((s) => s.contracts);
  const acceptContract = useAppStore((s) => s.acceptContract);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const selectContract = useAppStore((s) => s.selectContract);

  const pendingContracts = contracts.filter(
    (c) => c.status === "matched" || c.status === "open",
  );
  const activeContracts = contracts.filter((c) =>
    ["accepted", "funded", "in_progress"].includes(c.status),
  );

  const handleAccept = (id: string) => {
    acceptContract(id);
    toast.success("Contract accepted!");
  };

  const handleReject = (id: string) => {
    toast.error("Contract declined.");
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "matched":
        return "bg-sand/20 text-sand-foreground border-sand/40";
      case "accepted":
        return "bg-accent text-accent-foreground";
      case "funded":
        return "bg-primary/10 text-primary border-primary/30";
      case "in_progress":
        return "bg-forest/10 text-forest border-forest/30";
      default:
        return "";
    }
  };
  function getVerificationSummary(contractId: string) {
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract?.milestoneEvidence?.length) return null;

    const pending = contract.milestoneEvidence.filter(
      (e) => e.verificationStatus === "pending_verification",
    ).length;
    const disputed = contract.milestoneEvidence.filter(
      (e) => e.verificationStatus === "disputed",
    ).length;
    const verified = contract.milestoneEvidence.filter(
      (e) => e.verificationStatus === "verified",
    ).length;

    return { pending, disputed, verified };
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Contract Inbox
        </h2>
        <p className="text-sm text-muted-foreground">
          Review and respond to incoming contract offers from buyers.
        </p>
      </div>

      {/* Pending Offers */}
      {pendingContracts.length > 0 && (
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <FileText className="h-4 w-4" /> Pending Offers (
            {pendingContracts.length})
          </h3>
          {pendingContracts.map((contract) => {
            return (
              <Card
                key={contract.id}
                className="border-sand/30 bg-card transition-shadow hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-display text-lg font-bold text-foreground">
                          {contract.crop}
                        </h4>
                        <Badge
                          variant="outline"
                          className={statusColor(contract.status)}
                        >
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
                        Estimated value:{" "}
                        <span className="font-semibold text-primary">
                          ₱{(contract.volumeKg * 30).toLocaleString()}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={() => handleReject(contract.id)}
                      >
                        <X className="h-4 w-4" /> Decline
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          selectContract(contract.id);
                          setActiveView("allocation");
                        }}
                      >
                        <Eye className="h-4 w-4" /> View
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1"
                        onClick={() => handleAccept(contract.id)}
                      >
                        <Check className="h-4 w-4" /> Accept
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {pendingContracts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium text-muted-foreground">
              No pending contract offers
            </p>
            <p className="text-sm text-muted-foreground/60">
              New buyer requests will appear here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Active Contracts */}
      {activeContracts.length > 0 && (
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Active Contracts ({activeContracts.length})
          </h3>
          {activeContracts.map((contract) => {
            const summary = getVerificationSummary(contract.id);
            return (
              <Card key={contract.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="font-display font-semibold text-foreground">
                          {contract.crop}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {contract.volumeKg.toLocaleString()} kg •{" "}
                          {contract.buyerName}
                        </p>
                        {/* ── MODIFIED: replaced plain cropStatus text with verified-aware display ──
                            previous:
                              {contract.cropStatus && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Crop status:{' '}
                                  <span className="font-medium text-foreground">
                                    {contract.cropStatus.replace(/_/g, ' ')}
                                  </span>
                                </p>
                              )}
                            Reason: raw cropStatus no longer reflects trust level;
                            must show whether the latest milestone is verified or pending.
                        ── END ── */}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Crop status:{" "}
                          <span className="font-medium text-foreground">
                            {contract.cropStatus.replace(/_/g, " ")}
                          </span>
                          {/* ── NEW: append verification state inline ──────────────── */}
                          {summary && summary.pending > 0 && (
                            <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                              <Hourglass className="h-3 w-3" />
                              {summary.pending} awaiting buyer sign-off
                            </span>
                          )}
                          {summary && summary.disputed > 0 && (
                            <span className="ml-2 inline-flex items-center gap-1 text-red-600">
                              <ShieldAlert className="h-3 w-3" />
                              {summary.disputed} disputed — escrow frozen
                            </span>
                          )}
                          {summary &&
                            summary.disputed === 0 &&
                            summary.pending === 0 &&
                            summary.verified > 0 && (
                              <span className="ml-2 inline-flex items-center gap-1 text-emerald-600">
                                <ShieldCheck className="h-3 w-3" />
                                {summary.verified} verified
                              </span>
                            )}
                          {/* ── END ──────────────────────────────────────────────── */}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* ── NEW: dispute freeze badge on contract card ─────────── */}
                      {contract.disputeFlag && (
                        <Badge className="border-red-200 bg-red-50 text-red-700">
                          <ShieldAlert className="mr-1 h-3 w-3" /> Escrow Frozen
                        </Badge>
                      )}
                      {/* ── END ────────────────────────────────────────────────── */}
                      <Badge
                        variant="outline"
                        className={statusColor(contract.status)}
                      >
                        {contract.status.replace("_", " ")}
                      </Badge>
                      <div className="w-32">
                        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          {/* ── MODIFIED: label reflects that progress = verified only ─
                              previous: <span>{contract.progress}%</span>
                          ── END ── */}
                          <span>{contract.progress}% verified</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${contract.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
