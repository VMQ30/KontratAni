import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppStore, type FarmerSmsStatus } from '@/store/useAppStore';
import { MessageSquare, Send, MapPin, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const statusConfig: Record<FarmerSmsStatus, { label: string; color: string; mapColor: string }> = {
  pending: { label: 'Pending', color: 'bg-muted text-muted-foreground', mapColor: 'bg-muted-foreground/30' },
  notified: { label: 'SMS Sent', color: 'bg-sand/20 text-sand-foreground border-sand/40', mapColor: 'bg-sand' },
  confirmed: { label: 'Confirmed', color: 'bg-accent text-accent-foreground', mapColor: 'bg-secondary' },
  planted: { label: 'Planted', color: 'bg-primary/15 text-primary border-primary/30', mapColor: 'bg-primary' },
  harvested: { label: 'Harvested', color: 'bg-forest/15 text-forest border-forest/30', mapColor: 'bg-forest' },
};

export function SmsHubView() {
  const contracts = useAppStore((s) => s.contracts);
  const updateFarmerSmsStatus = useAppStore((s) => s.updateFarmerSmsStatus);
  const [broadcasting, setBroadcasting] = useState(false);

  const activeContracts = contracts.filter(c => ['accepted', 'funded', 'in_progress'].includes(c.status) && c.matchedCooperative);
  const [selectedContract, setSelectedContract] = useState<string | null>(activeContracts[0]?.id || null);
  const contract = activeContracts.find(c => c.id === selectedContract);
  const farmers = contract?.matchedCooperative?.members || [];

  const handleBroadcast = () => {
    if (!contract) return;
    setBroadcasting(true);
    farmers.forEach((f, i) => {
      setTimeout(() => {
        updateFarmerSmsStatus(contract.id, f.id, 'notified');
        if (i === farmers.length - 1) {
          setBroadcasting(false);
          toast.success(`SMS broadcast sent to ${farmers.length} farmers!`);
        }
      }, (i + 1) * 400);
    });
  };

  const smsStats = {
    total: farmers.length,
    notified: farmers.filter(f => f.smsStatus !== 'pending').length,
    confirmed: farmers.filter(f => ['confirmed', 'planted', 'harvested'].includes(f.smsStatus)).length,
    planted: farmers.filter(f => ['planted', 'harvested'].includes(f.smsStatus)).length,
    harvested: farmers.filter(f => f.smsStatus === 'harvested').length,
  };

  if (activeContracts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">SMS & Monitoring Hub</h2>
          <p className="text-sm text-muted-foreground">Broadcast and track farmer responses.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-medium text-muted-foreground">No active contracts</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">SMS & Monitoring Hub</h2>
          <p className="text-sm text-muted-foreground">Broadcast SMS and monitor farmer planting status.</p>
        </div>
        <Button onClick={handleBroadcast} disabled={broadcasting} className="gap-2">
          {broadcasting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {broadcasting ? 'Sending...' : 'Broadcast SMS'}
        </Button>
      </div>

      {/* Contract Selector */}
      <div className="flex gap-2">
        {activeContracts.map(c => (
          <Button key={c.id} variant={selectedContract === c.id ? 'default' : 'outline'} size="sm" onClick={() => setSelectedContract(c.id)}>
            {c.crop}
          </Button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total', value: smsStats.total, color: 'text-foreground' },
          { label: 'SMS Sent', value: smsStats.notified, color: 'text-sand-foreground' },
          { label: 'Confirmed', value: smsStats.confirmed, color: 'text-secondary' },
          { label: 'Planted', value: smsStats.planted, color: 'text-primary' },
          { label: 'Harvested', value: smsStats.harvested, color: 'text-forest' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Live Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Farmer Status Table</CardTitle>
            <CardDescription>Real-time responses from farmers</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {farmers.map((f) => {
                  const cfg = statusConfig[f.smsStatus];
                  return (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell className="text-muted-foreground">{f.location}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Interactive Farm Map (simplified grid) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-4 w-4 text-terracotta" /> Farm Plot Map
            </CardTitle>
            <CardDescription>Plot colors reflect farmer status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {farmers.map((f) => {
                const cfg = statusConfig[f.smsStatus];
                return (
                  <div key={f.id} className={`flex flex-col items-center justify-center rounded-lg border border-border p-4 transition-colors ${cfg.mapColor}/20`}>
                    <div className={`mb-2 h-8 w-8 rounded-full ${cfg.mapColor}`} />
                    <p className="text-xs font-medium text-foreground">{f.name.split(' ')[0]}</p>
                    <p className="text-[10px] text-muted-foreground">{f.hectares} ha</p>
                    <Badge variant="outline" className={`mt-1 text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              {Object.entries(statusConfig).map(([key, val]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`h-3 w-3 rounded-full ${val.mapColor}`} />
                  <span className="text-muted-foreground">{val.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
