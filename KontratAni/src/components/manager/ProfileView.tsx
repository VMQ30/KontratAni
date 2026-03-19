import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppStore } from "@/store/useAppStore";
import { MapPin, Users, Leaf, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function ProfileView() {
  const cooperatives = useAppStore((s) => s.cooperatives);
  const coop = cooperatives[0];
  const [isSolo, setIsSolo] = useState(false);
  const [coopName, setCoopName] = useState(coop.name);
  const [region, setRegion] = useState(coop.region);
  const [totalHectares, setTotalHectares] = useState(
    coop.totalHectares.toString(),
  );
  const [soilType, setSoilType] = useState("Loam / Clay Loam");

  const [newFarmer, setNewFarmer] = useState({
    name: "",
    phone: "",
    wallet: "",
    hectares: "",
  });
  const [members, setMembers] = useState(
    coop.members.map((m) => ({
      id: m.id,
      name: m.name,
      phone: "09" + Math.floor(Math.random() * 900000000 + 100000000),
      wallet:
        m.payoutMethod === "cash"
          ? "—"
          : "09" + Math.floor(Math.random() * 900000000 + 100000000),
      hectares: m.hectares,
      payoutMethod: m.payoutMethod,
    })),
  );

  const handleAddFarmer = () => {
    if (!newFarmer.name || !newFarmer.phone) return;
    setMembers((prev) => [
      ...prev,
      {
        id: `f-${Date.now()}`,
        name: newFarmer.name,
        phone: newFarmer.phone,
        wallet: newFarmer.wallet || "—",
        hectares: parseFloat(newFarmer.hectares) || 1,
        payoutMethod: "gcash" as const,
      },
    ]);
    setNewFarmer({ name: "", phone: "", wallet: "", hectares: "" });
    toast.success("Farmer added to registry");
  };

  const handleRemoveFarmer = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    toast.info("Farmer removed");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Profile & Land Registry
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage your cooperative profile and member farmers.
        </p>
      </div>

      {/* Account Type Toggle */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Account Type</p>
              <p className="text-sm text-muted-foreground">
                Cooperative — manage multiple member farmers
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-4 w-4 text-terracotta" />
              {isSolo ? "Farm Details" : "Cooperative Details"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{isSolo ? "Farm Name" : "Cooperative Name"}</Label>
              <Input
                value={isSolo ? "Juan dela Cruz Farm" : coopName}
                onChange={(e) => setCoopName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Region / Location</Label>
              <Input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Hectares</Label>
                <Input
                  type="number"
                  value={isSolo ? "2.5" : totalHectares}
                  onChange={(e) => setTotalHectares(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Primary Soil Type</Label>
                <Input
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => toast.success("Profile saved!")}
            >
              Save Profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Leaf className="h-4 w-4 text-primary" />
              Land Quality Scores
            </CardTitle>
            <CardDescription>
              Based on simulated satellite & weather data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Soil Quality</span>
                <span className="font-semibold text-foreground">
                  {coop.soilScore}/100
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${coop.soilScore}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Weather Suitability
                </span>
                <span className="font-semibold text-foreground">
                  {coop.weatherScore}/100
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-sand transition-all"
                  style={{ width: `${coop.weatherScore}%` }}
                />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-accent/50 p-4">
              <p className="text-sm font-medium text-foreground">
                Recommendation
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Excellent conditions for tomatoes, onions, and root crops this
                season.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Farmer Registry (Coop Only) */}
      {!isSolo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-4 w-4 text-forest" />
              Member Farmers
            </CardTitle>
            <CardDescription>
              {members.length} registered farmers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Wallet (GCash/Maya)</TableHead>
                  <TableHead>Hectares</TableHead>
                  <TableHead>Payout</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.phone}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.wallet}
                    </TableCell>
                    <TableCell>{m.hectares} ha</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {m.payoutMethod}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFarmer(m.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Add Farmer */}
            <div className="mt-4 flex items-end gap-3 rounded-lg border border-dashed border-border bg-muted/50 p-4">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Name</Label>
                <Input
                  placeholder="Farmer name"
                  value={newFarmer.name}
                  onChange={(e) =>
                    setNewFarmer((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>
              <div className="w-36 space-y-1">
                <Label className="text-xs">Phone</Label>
                <Input
                  placeholder="09xxxxxxxxx"
                  value={newFarmer.phone}
                  onChange={(e) =>
                    setNewFarmer((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </div>
              <div className="w-36 space-y-1">
                <Label className="text-xs">Wallet #</Label>
                <Input
                  placeholder="GCash/Maya"
                  value={newFarmer.wallet}
                  onChange={(e) =>
                    setNewFarmer((p) => ({ ...p, wallet: e.target.value }))
                  }
                />
              </div>
              <div className="w-20 space-y-1">
                <Label className="text-xs">Hectares</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newFarmer.hectares}
                  onChange={(e) =>
                    setNewFarmer((p) => ({ ...p, hectares: e.target.value }))
                  }
                />
              </div>
              <Button onClick={handleAddFarmer} className="gap-1">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isSolo && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-accent p-4">
              <Leaf className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">
                  Solo Farmer Mode Active
                </p>
                <p className="text-sm text-muted-foreground">
                  You are registered as the sole fulfiller. All contracts will
                  be assigned directly to you.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
