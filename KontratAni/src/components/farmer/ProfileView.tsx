import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { MapPin, Leaf, Pencil } from "lucide-react";
import { toast } from "sonner";

export function ProfileView() {
  const soloFarmers = useAppStore((s) => s.soloFarmers);
  const currentFarmer = soloFarmers[0];

  // Local edit state for profile
  const [farmName, setFarmName] = useState(currentFarmer?.name || "");
  const [location, setLocation] = useState(currentFarmer?.location || "");
  const [hectares, setHectares] = useState(
    currentFarmer?.hectares.toString() || "",
  );
  const [soilType, setSoilType] = useState(currentFarmer?.soilType || "");
  const [payoutMethod, setPayoutMethod] = useState<"cash" | "gcash" | "maya" | "bank">(
  (currentFarmer?.payoutMethod as "cash" | "gcash" | "maya" | "bank") || "gcash"
);

  const [profileEdit, setProfileEdit] = useState(false);

  const handleSaveProfile = () => {
    if (!farmName || !location || !hectares || !soilType) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success("Profile saved successfully");
    setProfileEdit(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Farm Profile & Land Registry
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage your solo farm information and land details.
        </p>
      </div>

      {/* Farm Details Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-4 w-4 text-terracotta" />
            Farm Details
          </CardTitle>
          <button
            onClick={() => setProfileEdit(!profileEdit)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent transition-colors"
          >
            <Pencil className="h-3 w-3" />
            {profileEdit ? "Cancel" : "Edit"}
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Farm Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[11px]">Farm Name / Your Name</Label>
            {profileEdit ? (
              <Input
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="Enter farm or your name"
                className="focus:border-primary focus:outline-none"
              />
            ) : (
              <div className="flex w-full items-center rounded-md border border-border bg-accent/30 px-3 py-2 text-sm font-medium text-foreground">
                {farmName}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[11px]">Location / Barangay</Label>
            {profileEdit ? (
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location"
                className="focus:border-primary focus:outline-none"
              />
            ) : (
              <div className="flex w-full items-center rounded-md border border-border bg-accent/30 px-3 py-2 text-sm font-medium text-foreground">
                {location}
              </div>
            )}
          </div>

          {/* Hectares and Soil Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[11px]">Total Hectares</Label>
              {profileEdit ? (
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={hectares}
                  onChange={(e) => setHectares(e.target.value)}
                  placeholder="0.0"
                  className="focus:border-primary focus:outline-none"
                />
              ) : (
                <div className="flex w-full items-center rounded-md border border-border bg-accent/30 px-3 py-2 text-sm font-medium text-foreground">
                  {hectares} ha
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[11px]">Primary Soil Type</Label>
              {profileEdit ? (
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-10"
                >
                  <option value="" disabled>Select Soil Type</option>
                  <option value="Loam">Loam</option>
                  <option value="Clay Loam">Clay Loam</option>
                  <option value="Sandy Loam">Sandy Loam</option>
                  <option value="Silt Loam">Silt Loam</option>
                  <option value="Clay">Clay</option>
                  <option value="Sand">Sand</option>
                </select>
              ) : (
                <div className="flex w-full items-center rounded-md border border-border bg-accent/30 px-3 py-2 text-sm font-medium text-foreground">
                  {soilType || "Not specified"}
                </div>
              )}
            </div>
          </div>

          {/* Payout Method */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[11px]">
              Preferred Payout Method
            </Label>
            {profileEdit ? (
              <select
                value={payoutMethod}
                onChange={(e) =>
                  setPayoutMethod(e.target.value as "cash" | "gcash" | "maya" | "bank")
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-10"
              >
                <option value="gcash">GCash</option>
                <option value="maya">Maya</option>
                <option value="bank">Bank Transfer</option>
                <option value="cash">Cash</option>
              </select>
            ) : (
              <div className="flex w-full items-center rounded-md border border-border bg-accent/30 px-3 py-2 text-sm font-medium text-foreground">
                <Badge variant="outline" className="capitalize bg-background">
                  {payoutMethod === "bank" ? "Bank Transfer" : payoutMethod}
                </Badge>
              </div>
            )}
          </div>

          {profileEdit && (
            <Button
              onClick={handleSaveProfile}
              className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save Changes
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Land Quality Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Leaf className="h-4 w-4 text-primary" />
            Land Information Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-accent/50 p-3 border border-border/50">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Hectares
              </p>
              <p className="mt-2 text-xl font-semibold text-foreground">
                {hectares || "0"} ha
              </p>
            </div>
            <div className="rounded-lg bg-accent/50 p-3 border border-border/50">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Soil Type
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {soilType || "Not Set"}
              </p>
            </div>
            <div className="rounded-lg bg-accent/50 p-3 border border-border/50 flex flex-col justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </p>
              <div className="mt-2">
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Active</Badge>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
            <p className="text-sm leading-relaxed text-foreground">
              <span className="font-semibold text-primary">Solo Farmer Status Active.</span>{" "}
              You are registered as the sole fulfiller for all your accepted
              contracts. All produce will be assigned directly to you.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}