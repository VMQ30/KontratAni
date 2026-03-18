import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Leaf, MapPin, Thermometer, CheckCircle2, FileSignature } from 'lucide-react';

const crops = ['Tomatoes', 'Rice (Sinandomeng)', 'Onions (Red)', 'Eggplant', 'Corn (White)', 'Calamansi'];

type MatchPhase = 'idle' | 'searching' | 'found' | 'contract';

export function DemandView() {
  const { addContract, matchContract, cooperatives } = useAppStore();
  const [crop, setCrop] = useState('');
  const [volume, setVolume] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [phase, setPhase] = useState<MatchPhase>('idle');
  const [currentContract, setCurrentContract] = useState<string | null>(null);
  const [matchedCoopIdx, setMatchedCoopIdx] = useState(0);

  const handleFindMatch = () => {
    if (!crop || !volume || !targetDate) return;
    const contract = addContract({ crop, volumeKg: parseInt(volume), targetDate });
    setCurrentContract(contract.id);
    setPhase('searching');
    setMatchedCoopIdx(Math.floor(Math.random() * cooperatives.length));

    setTimeout(() => setPhase('found'), 2000);
  };

  const handleConfirmMatch = () => {
    if (!currentContract) return;
    matchContract(currentContract, cooperatives[matchedCoopIdx].id);
    setPhase('contract');
  };

  const handleClose = () => {
    setPhase('idle');
    setCrop('');
    setVolume('');
    setTargetDate('');
    setCurrentContract(null);
  };

  const matchedCoop = cooperatives[matchedCoopIdx];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Create Demand</h2>
        <p className="mt-1 text-sm text-muted-foreground">Specify your procurement needs and let AI find the best match</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">New Procurement Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Crop Type</Label>
            <Select value={crop} onValueChange={setCrop}>
              <SelectTrigger><SelectValue placeholder="Select crop" /></SelectTrigger>
              <SelectContent>
                {crops.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Volume (kg)</Label>
            <Input type="number" placeholder="e.g. 5000" value={volume} onChange={(e) => setVolume(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Target Delivery Date</Label>
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
          <Button
            onClick={handleFindMatch}
            disabled={!crop || !volume || !targetDate}
            className="w-full bg-terracotta text-terracotta-foreground hover:bg-terracotta/90"
          >
            <Search className="mr-2 h-4 w-4" />
            Find Match
          </Button>
        </CardContent>
      </Card>

      {/* AI Matchmaker Modal */}
      <Dialog open={phase !== 'idle'} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-lg">
          <AnimatePresence mode="wait">
            {phase === 'searching' && (
              <motion.div key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-8">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-accent"
                >
                  <Search className="h-7 w-7 text-primary" />
                </motion.div>
                <div className="text-center">
                  <p className="font-display text-lg font-semibold text-foreground">AI Matchmaker Working...</p>
                  <p className="mt-1 text-sm text-muted-foreground">Analyzing soil data, weather patterns, and capacity</p>
                </div>
              </motion.div>
            )}

            {phase === 'found' && (
              <motion.div key="found" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" /> Match Found
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-4 rounded-lg border border-border bg-accent/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-display font-semibold text-foreground">{matchedCoop.name}</p>
                    <Badge className="bg-primary text-primary-foreground">Best Match</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {matchedCoop.region}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Leaf className="h-3.5 w-3.5" /> Soil Score: {matchedCoop.soilScore}/100
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Thermometer className="h-3.5 w-3.5" /> Weather: {matchedCoop.weatherScore}/100
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Leaf className="h-3.5 w-3.5" /> {matchedCoop.totalHectares} hectares
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{matchedCoop.members.length} member farmers</p>
                </div>
                <DialogFooter className="mt-6">
                  <Button variant="outline" onClick={handleClose}>Cancel</Button>
                  <Button onClick={handleConfirmMatch} className="bg-terracotta text-terracotta-foreground hover:bg-terracotta/90">
                    <FileSignature className="mr-2 h-4 w-4" /> Generate Contract
                  </Button>
                </DialogFooter>
              </motion.div>
            )}

            {phase === 'contract' && (
              <motion.div key="contract" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <DialogHeader>
                  <DialogTitle>Forward Contract Generated</DialogTitle>
                </DialogHeader>
                <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm font-body">
                  <p className="font-display font-semibold">CONTRACT #KA-{currentContract?.slice(-4).toUpperCase()}</p>
                  <p><span className="text-muted-foreground">Buyer:</span> Metro Fresh Foods</p>
                  <p><span className="text-muted-foreground">Supplier:</span> {matchedCoop.name}</p>
                  <p><span className="text-muted-foreground">Crop:</span> {crop}</p>
                  <p><span className="text-muted-foreground">Volume:</span> {parseInt(volume).toLocaleString()} kg</p>
                  <p><span className="text-muted-foreground">Delivery:</span> {targetDate}</p>
                  <p><span className="text-muted-foreground">Est. Value:</span> ₱{(parseInt(volume) * 30).toLocaleString()}</p>
                  <div className="mt-4 flex gap-2 rounded border border-primary/20 bg-accent/50 p-3">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <p className="text-xs text-primary">Both parties have digitally signed. Contract is now active.</p>
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button onClick={handleClose} className="bg-primary text-primary-foreground">Done</Button>
                </DialogFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}
