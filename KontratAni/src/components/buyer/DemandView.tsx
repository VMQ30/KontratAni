import { useState, useMemo, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Leaf,
  MapPin,
  Thermometer,
  CheckCircle2,
  FileSignature,
  ArrowRight,
  Activity,
  ChevronLeft,
  Send,
  Calendar,
  AlertCircle,
} from "lucide-react";

const cropData: Record<string, { daysToGrow: number }> = {
  Tomatoes: { daysToGrow: 90 },
  "Corn (White/Mais)": { daysToGrow: 100 },
  Eggplant: { daysToGrow: 110 },
  "Rice (Sinandomeng)": { daysToGrow: 120 },
  "Onions (Red)": { daysToGrow: 120 },
  Calamansi: { daysToGrow: 150 },
  "Bok Choy (Pechay)": { daysToGrow: 45 },
  "Bitter Gourd (Ampalaya)": { daysToGrow: 75 },
  "Banana (Saging)": { daysToGrow: 210 },
  "Mango (Mangga)": { daysToGrow: 270 },
};

const crops = Object.keys(cropData);

type MatchPhase = "idle" | "searching" | "found" | "review" | "contract";

export function DemandView() {
  const { addContract, matchContract, cooperatives } = useAppStore();
  const [crop, setCrop] = useState("");
  const [volume, setVolume] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");

  const [phase, setPhase] = useState<MatchPhase>("idle");
  const [currentContract, setCurrentContract] = useState<string | null>(null);

  type BaseCoop = (typeof cooperatives)[0];
  type MatchedCoop = BaseCoop & {
    offeredPrice: number;
    deliveryWindow: string;
    matchScore: number;
  };

  const [matchedCoops, setMatchedCoops] = useState<MatchedCoop[]>([]);
  const [selectedCoop, setSelectedCoop] = useState<MatchedCoop | null>(null);

  const minDeliveryDate = useMemo(() => {
    if (!crop) return "";
    const today = new Date();
    const daysNeeded = cropData[crop].daysToGrow;
    today.setDate(today.getDate() + daysNeeded);
    return today.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  }, [crop]);

  useEffect(() => {
    if (crop && targetDate && targetDate < minDeliveryDate) {
      setTargetDate("");
    }
  }, [crop, minDeliveryDate, targetDate]);

  const handleFindMatch = () => {
    if (!crop || !volume || !targetDate || !pricePerKg) return;
    setPhase("searching");

    setTimeout(() => {
      const target = parseFloat(pricePerKg);
      const targetDateObj = new Date(targetDate);

      const shuffled = [...cooperatives]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const enrichedMatches = shuffled.map((coop) => {
        const priceVariance = Math.random() * 6 - 3;
        const offeredPrice = Math.round((target + priceVariance) * 10) / 10;

        const startWindow = new Date(targetDateObj);
        startWindow.setDate(
          startWindow.getDate() - (Math.floor(Math.random() * 3) + 1),
        );
        const deliveryWindow = `${startWindow.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${targetDateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

        const priceDifferencePenalty = Math.abs(offeredPrice - target) * 5;
        const matchScore =
          coop.soilScore + coop.weatherScore - priceDifferencePenalty;

        return { ...coop, offeredPrice, deliveryWindow, matchScore };
      });

      enrichedMatches.sort((a, b) => b.matchScore - a.matchScore);

      setMatchedCoops(enrichedMatches);
      setPhase("found");
    }, 2000);
  };

  const handleReviewMatch = (coop: MatchedCoop) => {
    setSelectedCoop(coop);
    setPhase("review");
  };

  const handleFinalizeContract = () => {
    if (!selectedCoop) return;

    const contract = addContract({
      crop,
      volumeKg: parseInt(volume),
      targetDate,
    });

    matchContract(contract.id, selectedCoop.id);
    setCurrentContract(contract.id);
    setPhase("contract");
  };

  const handleBackToMatches = () => {
    setPhase("found");
  };

  const handleReset = () => {
    setPhase("idle");
    setCrop("");
    setVolume("");
    setTargetDate("");
    setPricePerKg("");
    setCurrentContract(null);
    setSelectedCoop(null);
    setMatchedCoops([]);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Create Demand
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Specify your procurement needs and let AI find the best matches.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* LEFT COLUMN: The Form */}
        <Card className="w-full shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Procurement Details</CardTitle>
            <CardDescription>
              Fill out your requirements to broadcast to the network.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Crop Type</Label>
              <Select
                value={crop}
                onValueChange={setCrop}
                disabled={phase !== "idle"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select crop" />
                </SelectTrigger>
                <SelectContent>
                  {crops.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Volume (kg)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  disabled={phase !== "idle"}
                />
              </div>
              <div className="space-y-2">
                <Label>Target Price (₱/kg)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 59"
                  value={pricePerKg}
                  onChange={(e) => setPricePerKg(e.target.value)}
                  disabled={phase !== "idle"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <Label>Target Delivery Date</Label>
                {/* 💡 Helper text showing the user how long the crop takes to grow */}
                {crop && (
                  <span className="text-[10px] text-muted-foreground font-medium flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1 text-terracotta" />
                    Takes ~{cropData[crop].daysToGrow} days to grow
                  </span>
                )}
              </div>
              {/* 💡 The minimum allowable date is now dynamic */}
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                disabled={!crop || phase !== "idle"}
                min={minDeliveryDate}
              />
              {!crop && (
                <p className="text-xs text-muted-foreground">
                  Select a crop first to determine harvest lead time.
                </p>
              )}
            </div>

            {phase === "idle" ? (
              <Button
                onClick={handleFindMatch}
                disabled={!crop || !volume || !targetDate || !pricePerKg}
                className="w-full bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 mt-4"
              >
                <Search className="mr-2 h-4 w-4" />
                Find AI Matches
              </Button>
            ) : (
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full mt-4"
              >
                Start New Search
              </Button>
            )}
          </CardContent>
        </Card>

        {/* RIGHT COLUMN: AI Results Area */}
        <div className="relative min-h-[500px] w-full rounded-xl border border-dashed border-border/60 bg-accent/20 p-6 overflow-hidden">
          <AnimatePresence mode="wait">
            {phase === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full flex-col items-center justify-center text-center opacity-60"
              >
                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="font-display text-lg font-medium text-foreground">
                  Awaiting Input
                </p>
                <p className="text-sm text-muted-foreground max-w-[250px] mt-1">
                  Fill out the form on the left to activate the AI Matchmaker.
                </p>
              </motion.div>
            )}

            {phase === "searching" && (
              <motion.div
                key="searching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full flex-col items-center justify-center gap-4"
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-accent"
                >
                  <Search className="h-7 w-7 text-primary" />
                </motion.div>
                <div className="text-center">
                  <p className="font-display text-lg font-semibold text-foreground">
                    Analyzing Network...
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Scoring soil, weather, and market rates...
                  </p>
                </div>
              </motion.div>
            )}

            {phase === "found" && (
              <motion.div
                key="found"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">
                      Top Matches Found
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Prioritized by quality (Soil & Weather).
                    </p>
                  </div>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                    {matchedCoops.length} Results
                  </Badge>
                </div>

                <div className="space-y-4">
                  {matchedCoops.map((coop, index) => (
                    <motion.div
                      key={coop.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="border-border/60 hover:border-primary/50 transition-colors relative overflow-hidden">
                        {index === 0 && (
                          <div className="absolute top-0 right-0 bg-terracotta text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                            BEST MATCH
                          </div>
                        )}

                        <CardContent className="p-4 pt-5">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="font-display font-semibold text-foreground">
                                {coop.name}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <MapPin className="h-3 w-3" /> {coop.region}
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="font-display text-2xl font-bold text-primary leading-none">
                                ₱{coop.offeredPrice.toFixed(2)}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">
                                Per Kg
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                            <div className="bg-accent/50 p-2 rounded-md flex flex-col items-center justify-center text-center">
                              <Leaf className="h-3.5 w-3.5 text-forest mb-1" />
                              <span className="font-medium">
                                Soil: {coop.soilScore}
                              </span>
                            </div>
                            <div className="bg-accent/50 p-2 rounded-md flex flex-col items-center justify-center text-center">
                              <Thermometer className="h-3.5 w-3.5 text-terracotta mb-1" />
                              <span className="font-medium">
                                Weather: {coop.weatherScore}
                              </span>
                            </div>
                            <div className="bg-accent/50 p-2 rounded-md flex flex-col items-center justify-center text-center">
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary mb-1" />
                              <span className="font-medium">
                                {coop.members.length} Farmers
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-accent/30 border border-border/50 py-2 rounded-md mb-4">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            <span>
                              Can deliver:{" "}
                              <strong className="text-foreground">
                                {coop.deliveryWindow}
                              </strong>
                            </span>
                          </div>

                          <Button
                            onClick={() => handleReviewMatch(coop)}
                            className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                            variant="ghost"
                          >
                            Review & Offer{" "}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {phase === "review" && selectedCoop && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex h-full flex-col"
              >
                <button
                  onClick={handleBackToMatches}
                  className="flex w-fit items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back to matches
                </button>

                <h3 className="font-display text-xl font-bold text-foreground mb-1">
                  Review Contract Offer
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Verify the negotiated details below before sending.
                </p>

                <div className="rounded-xl border border-border bg-background p-5 space-y-4 text-sm font-body shadow-sm flex-1">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                      Supplier Details
                    </p>
                    <p className="font-medium">{selectedCoop.name}</p>
                    <p className="text-muted-foreground">
                      {selectedCoop.region}
                    </p>
                  </div>

                  <hr className="border-border/50" />

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                      Agreed Terms
                    </p>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Commodity:</span>{" "}
                      <span className="font-medium">{crop}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Volume:</span>{" "}
                      <span className="font-medium">
                        {parseInt(volume).toLocaleString()} kg
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Est. Delivery:
                      </span>{" "}
                      <span className="font-medium text-primary">
                        {selectedCoop.deliveryWindow}
                      </span>
                    </div>

                    <div className="flex justify-between mt-2 pt-2 border-t border-border/40">
                      <span className="text-muted-foreground">
                        Your Target Price:
                      </span>
                      <span className="text-muted-foreground line-through">
                        ₱{parseFloat(pricePerKg).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground font-medium">
                        Coop Offered Price:
                      </span>
                      <span className="font-bold text-primary">
                        ₱{selectedCoop.offeredPrice.toFixed(2)} / kg
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-accent/50 p-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-foreground font-semibold">
                        Total Contract Value:
                      </span>
                      <span className="font-display text-2xl font-bold text-primary">
                        ₱
                        {(
                          parseInt(volume) * selectedCoop.offeredPrice
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleFinalizeContract}
                  className="w-full mt-6 bg-terracotta text-terracotta-foreground hover:bg-terracotta/90"
                >
                  <Send className="mr-2 h-4 w-4" /> Accept & Send Offer
                </Button>
              </motion.div>
            )}

            {phase === "contract" && selectedCoop && (
              <motion.div
                key="contract"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex h-full flex-col justify-center"
              >
                <div className="text-center mb-6">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 mb-4">
                    <FileSignature className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-foreground">
                    Offer Sent!
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Contract{" "}
                    <span className="font-mono font-bold text-foreground">
                      #KA-{currentContract?.slice(-4).toUpperCase()}
                    </span>{" "}
                    has been forwarded to {selectedCoop.name}.
                  </p>
                </div>

                <div className="rounded-lg bg-accent/30 border border-border/50 p-4 text-center">
                  <p className="text-sm text-foreground">
                    You will be notified once the cooperative reviews and signs
                    the agreement.
                  </p>
                </div>

                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full mt-8"
                >
                  Create Another Demand
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
