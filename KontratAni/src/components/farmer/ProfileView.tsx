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
  const [payoutMethod, setPayoutMethod] = useState(
    currentFarmer?.payoutMethod || "gcash",
  );

  const [profileEdit, setProfileEdit] = useState(false);

  const handleSaveProfile = () => {
    if (!farmName || !location || !hectares) {
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
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
          >
            <Pencil className="h-3 w-3" />
            {profileEdit ? "Save" : "Edit"}
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Farm Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Farm Name / Your Name</Label>
            {profileEdit ? (
              <Input
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="Enter farm or your name"
                className="focus:border-[#2D6A4F] focus:outline-none"
              />
            ) : (
              <p className="text-sm font-medium text-foreground">{farmName}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Location / Barangay</Label>
            {profileEdit ? (
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location"
                className="focus:border-[#2D6A4F] focus:outline-none"
              />
            ) : (
              <p className="text-sm font-medium text-foreground">{location}</p>
            )}
          </div>

          {/* Hectares and Soil Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Total Hectares</Label>
              {profileEdit ? (
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={hectares}
                  onChange={(e) => setHectares(e.target.value)}
                  placeholder="0.0"
                  className="focus:border-[#2D6A4F] focus:outline-none"
                />
              ) : (
                <p className="text-sm font-medium text-foreground">
                  {hectares} ha
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Primary Soil Type</Label>
              {profileEdit ? (
                <Input
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  placeholder="e.g., Loam, Clay Loam"
                  className="focus:border-[#2D6A4F] focus:outline-none"
                />
              ) : (
                <p className="text-sm font-medium text-foreground">
                  {soilType}
                </p>
              )}
            </div>
          </div>

          {/* Payout Method */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Preferred Payout Method
            </Label>
            {profileEdit ? (
              <select
                value={payoutMethod}
                onChange={(e) =>
                  setPayoutMethod(e.target.value as "cash" | "gcash" | "maya")
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-[#2D6A4F] focus:outline-none"
              >
                <option value="gcash">GCash</option>
                <option value="maya">Maya</option>
                <option value="cash">Cash</option>
              </select>
            ) : (
              <div>
                <Badge variant="outline" className="capitalize">
                  {payoutMethod}
                </Badge>
              </div>
            )}
          </div>

          {profileEdit && (
            <Button
              onClick={handleSaveProfile}
              className="w-full bg-[#2D6A4F] hover:bg-[#1F4A38]"
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
            Land Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-accent p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Hectares
              </p>
              <p className="mt-2 text-xl font-semibold text-foreground">
                {hectares} ha
              </p>
            </div>
            <div className="rounded-lg bg-accent p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Soil Type
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {soilType}
              </p>
            </div>
            <div className="rounded-lg bg-accent p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </p>
              <Badge className="mt-2 bg-green-100 text-green-800">Active</Badge>
            </div>
          </div>

          <div className="rounded-lg border border-[#9FE1CB] bg-[#E1F5EE] p-4">
            <p className="text-sm leading-relaxed text-[#085041]">
              <span className="font-semibold">Solo Farmer Status Active.</span>{" "}
              You are registered as the sole fulfiller for all your accepted
              contracts. All produce will be assigned directly to you.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
