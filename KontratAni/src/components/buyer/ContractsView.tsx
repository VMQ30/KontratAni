import { useAppStore, type CropStatus } from "@/store/useAppStore";
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
import { useState, useEffect } from "react";
import {
  Lock,
  CheckCircle2,
  ArrowLeft,
  Sprout,
  Droplets,
  Sun,
  Truck,
  Package,
} from "lucide-react";
import ContractsIndex from "./contracts/ContractsIndex";

const statusOrder: CropStatus[] = [
  "pending",
  "seeds_planted",
  "fertilized",
  "growing",
  "ready_for_harvest",
  "harvested",
  "delivered",
];

export function ContractsView() {
  const {
    contracts,
    selectedContractId,
    selectContract,
    fundContract,
    updateCropStatus,
  } = useAppStore(); // 👈 added updateCropStatus
  const [escrowModal, setEscrowModal] = useState(false);
  const [escrowSuccess, setEscrowSuccess] = useState(false);

  const CROP_STATUS_KEY = "kontratani_crop_status";

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== CROP_STATUS_KEY || !e.newValue) return;
      try {
        const { contractId, cropStatus } = JSON.parse(e.newValue) as {
          contractId: string;
          cropStatus: CropStatus;
          ts: number;
        };
        updateCropStatus(contractId, cropStatus);
      } catch {}
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [updateCropStatus]);

  const contract = contracts.find((c) => c.id === selectedContractId);

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
                  {c.matchedCooperative?.name || "Unmatched"}
                </p>
              </div>
              <Badge variant="secondary">{c.status.replace("_", " ")}</Badge>
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

  return (
    <div className="space-y-6">
      <button
        onClick={() => selectContract(null)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to contracts
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            {contract.crop}
          </h2>
          <p className="text-sm text-muted-foreground">
            {contract.volumeKg.toLocaleString()} kg ·{" "}
            {contract.matchedCooperative?.name || "Unmatched"}
          </p>
        </div>
        {contract.escrowAmount === 0 && contract.status !== "open" && (
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
        {contract.escrowAmount > 0 && (
          <Badge className="bg-primary text-primary-foreground px-3 py-1.5">
            ₱{contract.escrowAmount.toLocaleString()} Escrowed
          </Badge>
        )}
      </div>

      <ContractsIndex />

      {/* Cooperative Details */}
      {contract.matchedCooperative && (
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

      {/* Escrow Modal */}
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
    </div>
  );
}
