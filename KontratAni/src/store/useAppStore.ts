import { create } from 'zustand';

// ── Shared / legacy types ─────────────────────────────────────────────────────
export type CropStatus = 'pending' | 'seeds_planted' | 'fertilized' | 'growing' | 'ready_for_harvest' | 'harvested' | 'delivered';
export type ContractStatus = 'open' | 'matched' | 'accepted' | 'funded' | 'in_progress' | 'completed' | 'declined';
export type FarmerSmsStatus = 'pending' | 'notified' | 'confirmed' | 'planted' | 'harvested';

// ── Types from useStore ───────────────────────────────────────────────────────
export type Role = 'buyer' | 'coop_manager' | 'solo_farmer' | 'sub_farmer';
export type EscrowStatus = 'unfunded' | 'locked' | 'released';
export type PlotStatus = 'idle' | 'assigned' | 'planted' | 'harvested' | 'declined';

export interface User {
  id: string;
  name: string;
  role: Role;
  walletBalance: number;
  payoutMethod: 'Cash' | 'GCash' | 'Maya';
  smsStatus?: 'pending' | 'notified' | 'planted' | 'declined';
}

export interface TimelineEvent {
  timestamp: string;
  event: string;
}

export interface FarmPlot {
  id: string;
  ownerId: string;
  assignedFarmerId: string | null;
  coordinates: [number, number];
  status: PlotStatus;
  currentContractId: string | null;
}

// ── Types from useAppStore ────────────────────────────────────────────────────
export interface Farmer {
  id: string;
  name: string;
  hectares: number;
  location: string;
  lat: number;
  lng: number;
  soilType: string;
  smsStatus: FarmerSmsStatus;
  assignedKg: number;
  payoutMethod: 'cash' | 'gcash' | 'maya';
  paid: boolean;
}

export interface Cooperative {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  totalHectares: number;
  members: Farmer[];
  soilScore: number;
  weatherScore: number;
}

export interface SoloFarmer {
  id: string;
  name: string;
  hectares: number;
  location: string;
  lat: number;
  lng: number;
  soilType: string;
  smsStatus: FarmerSmsStatus;
  assignedKg: number;
  payoutMethod: 'cash' | 'gcash' | 'maya';
  paid: boolean;
}

export interface Contract {
  // useAppStore fields
  id: string;
  crop: string;
  volumeKg: number;
  targetDate: string;
  status: ContractStatus;
  cropStatus: CropStatus;
  progress: number;
  buyerName: string;
  matchedCooperative?: Cooperative;
  escrowAmount: number;
  createdAt: string;
  // useStore fields
  buyerId?: string;
  sellerId?: string | null;
  escrowStatus?: EscrowStatus;
  progressPercent?: number;
  timeline?: TimelineEvent[];
}

export interface DemandRequest {
  crop: string;
  volumeKg: number;
  targetDate: string;
}

// ── Broadcast message (manager → farmer SMS) ──────────────────────────────────
export interface BroadcastMessage {
  id: string;
  text: string;
  time: string;
}

// ── Combined state ────────────────────────────────────────────────────────────
interface AppState {
  // ── useAppStore state ──────────────────────────────────────────────────────
  contracts: Contract[];
  cooperatives: Cooperative[];
  soloFarmers: SoloFarmer[];
  activeView: string;
  selectedContractId: string | null;

  broadcastMessages: BroadcastMessage[];
  addBroadcastMessage: (text: string) => void;
  clearBroadcastMessages: () => void;

  setActiveView: (view: string) => void;
  selectContract: (id: string | null) => void;
  addContract: (demand: DemandRequest) => Contract;
  matchContract: (contractId: string, coopId: string) => void;
  acceptContract: (contractId: string) => void;
  declineContract: (contractId: string) => void;
  fundContract: (contractId: string) => void;
  updateCropStatus: (contractId: string, status: CropStatus) => void;
  updateFarmerSmsStatus: (contractId: string, farmerId: string, status: FarmerSmsStatus) => void;
  addCoopMember: (coopId: string, farmer: Farmer) => void;
  removeCoopMember: (coopId: string, farmerId: string) => void;
  updateCoopMemberCrops: (coopId: string, farmerId: string, crops: string[]) => void;

  // ── useStore state ─────────────────────────────────────────────────────────
  activePersona: Role;
  users: User[];
  farmPlots: FarmPlot[];

  switchPersona: (role: Role) => void;
  createDemand: (crop: string, volumeKg: number, targetDate: string) => void;
  simulateAIMatch: (contractId: string) => void;
  fundEscrow: (contractId: string) => void;
  allocateQuota: (contractId: string, farmerIds: string[]) => void;
  broadcastSMS: (contractId: string) => void;
  distributeFunds: (contractId: string) => void;
  updateUserSmsStatus: (farmerId: string, status: 'pending' | 'notified' | 'planted' | 'declined') => void;
}

// ── Mock data (useAppStore) ───────────────────────────────────────────────────
const mockFarmers: Farmer[] = [
  { id: 'f1', name: 'Juan dela Cruz',   hectares: 2.5, location: 'Brgy. San Jose',      lat: 14.58, lng: 121.0,  soilType: 'Loam',       smsStatus: 'pending', assignedKg: 0, payoutMethod: 'gcash', paid: false },
  { id: 'f2', name: 'Maria Santos',     hectares: 1.8, location: 'Brgy. Sta. Rosa',     lat: 14.61, lng: 121.02, soilType: 'Clay Loam',  smsStatus: 'pending', assignedKg: 0, payoutMethod: 'maya',  paid: false },
  { id: 'f3', name: 'Pedro Reyes',      hectares: 3.0, location: 'Brgy. Bagumbayan',    lat: 14.56, lng: 120.98, soilType: 'Sandy Loam', smsStatus: 'pending', assignedKg: 0, payoutMethod: 'cash',  paid: false },
  { id: 'f4', name: 'Ana Flores',       hectares: 2.2, location: 'Brgy. Maligaya',      lat: 14.59, lng: 121.04, soilType: 'Loam',       smsStatus: 'pending', assignedKg: 0, payoutMethod: 'gcash', paid: false },
  { id: 'f5', name: 'Ricardo Mendoza',  hectares: 4.0, location: 'Brgy. Pag-asa',       lat: 14.63, lng: 120.96, soilType: 'Silt Loam',  smsStatus: 'pending', assignedKg: 0, payoutMethod: 'cash',  paid: false },
];

const mockCooperatives: Cooperative[] = [
  {
    id: 'coop1', name: 'Quezon Farmers Cooperative', region: 'Quezon Province',
    lat: 14.59, lng: 121.01, totalHectares: 13.5, soilScore: 87, weatherScore: 92,
    members: mockFarmers.slice(0, 3),
  },
  {
    id: 'coop2', name: 'Laguna Harvest Alliance', region: 'Laguna Province',
    lat: 14.27, lng: 121.41, totalHectares: 9.0, soilScore: 91, weatherScore: 85,
    members: mockFarmers.slice(2, 5),
  },
  {
    id: 'coop3', name: 'Batangas Green Growers', region: 'Batangas Province',
    lat: 13.76, lng: 121.06, totalHectares: 18.2, soilScore: 94, weatherScore: 88,
    members: mockFarmers,
  },
];

const mockSoloFarmers: SoloFarmer[] = [
  {
    id: 'sf1', name: 'Luzviminda Garcia', hectares: 1.5, location: 'Brgy. San Isidro',
    lat: 14.57, lng: 121.03, soilType: 'Loam', smsStatus: 'pending', assignedKg: 0,
    payoutMethod: 'gcash', paid: false,
  },
  {
    id: 'sf2', name: 'Manuel Santos', hectares: 2.0, location: 'Brgy. Santa Cruz',
    lat: 14.60, lng: 121.05, soilType: 'Silt Loam', smsStatus: 'pending', assignedKg: 0,
    payoutMethod: 'maya', paid: false,
  },
];

const mockContracts: Contract[] = [
  {
    id: 'c1', crop: 'Tomatoes', volumeKg: 5000, targetDate: '2026-06-15',
    status: 'in_progress', cropStatus: 'growing', progress: 60,
    buyerName: 'Metro Fresh Foods', matchedCooperative: mockCooperatives[0],
    escrowAmount: 150000, createdAt: '2026-01-10',
    buyerId: 'buyer_01', sellerId: 'coop1', escrowStatus: 'locked', progressPercent: 60, timeline: [],
  },
  {
    id: 'c2', crop: 'Rice (Sinandomeng)', volumeKg: 10000, targetDate: '2026-08-01',
    status: 'funded', cropStatus: 'seeds_planted', progress: 25,
    buyerName: 'Metro Fresh Foods', matchedCooperative: mockCooperatives[2],
    escrowAmount: 450000, createdAt: '2026-02-01',
    buyerId: 'buyer_01', sellerId: 'coop3', escrowStatus: 'locked', progressPercent: 25, timeline: [],
  },
  {
    id: 'c3', crop: 'Onions (Red)', volumeKg: 3000, targetDate: '2026-05-20',
    status: 'matched', cropStatus: 'pending', progress: 10,
    buyerName: 'Metro Fresh Foods', matchedCooperative: mockCooperatives[1],
    escrowAmount: 0, createdAt: '2026-03-05',
    buyerId: 'buyer_01', sellerId: 'coop2', escrowStatus: 'unfunded', progressPercent: 10, timeline: [],
  },
];

// ── Mock data (useStore) ──────────────────────────────────────────────────────
const initialUsers: User[] = [
  { id: 'farmer_01', name: 'Juan Dela Cruz', role: 'sub_farmer', walletBalance: 0, payoutMethod: 'GCash', smsStatus: 'pending' },
  { id: 'farmer_02', name: 'Maria Santos',   role: 'sub_farmer', walletBalance: 0, payoutMethod: 'Cash',  smsStatus: 'pending' },
];

const initialPlots: FarmPlot[] = [
  { id: 'plot_A', ownerId: 'coop_01', assignedFarmerId: null, coordinates: [14.5995, 120.9842], status: 'idle', currentContractId: null },
  { id: 'plot_B', ownerId: 'coop_01', assignedFarmerId: null, coordinates: [14.6010, 120.9850], status: 'idle', currentContractId: null },
];

// ── Store ─────────────────────────────────────────────────────────────────────
export const useAppStore = create<AppState>((set, get) => ({
  // ── useAppStore initial state ──────────────────────────────────────────────
  contracts: mockContracts,
  cooperatives: mockCooperatives,
  soloFarmers: mockSoloFarmers,
  activeView: 'dashboard',
  selectedContractId: null,
  broadcastMessages: [],

  addBroadcastMessage: (text) => {
    const msg: BroadcastMessage = {
      id: `bcast-${Date.now()}`,
      text,
      time: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
    };
    set((s) => ({ broadcastMessages: [...s.broadcastMessages, msg] }));
  },

  clearBroadcastMessages: () => set({ broadcastMessages: [] }),

  setActiveView: (view) => set({ activeView: view }),
  selectContract: (id) => set({ selectedContractId: id }),

  addContract: (demand) => {
    const newContract: Contract = {
      id: `c${Date.now()}`,
      crop: demand.crop,
      volumeKg: demand.volumeKg,
      targetDate: demand.targetDate,
      status: 'open',
      cropStatus: 'pending',
      progress: 0,
      buyerName: 'Metro Fresh Foods',
      escrowAmount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      // useStore defaults
      buyerId: 'buyer_01',
      sellerId: null,
      escrowStatus: 'unfunded',
      progressPercent: 0,
      timeline: [{ timestamp: new Date().toISOString(), event: `Demand created for ${demand.volumeKg}kg of ${demand.crop}` }],
    };
    set((s) => ({ contracts: [...s.contracts, newContract] }));
    return newContract;
  },

  matchContract: (contractId, coopId) => {
    const coop = get().cooperatives.find((c) => c.id === coopId);
    if (!coop) return;
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === contractId
          ? { ...c, status: 'matched' as ContractStatus, matchedCooperative: coop, progress: 10 }
          : c
      ),
    }));
  },

  // acceptContract: merged — updates both useAppStore status and useStore timeline
  acceptContract: (contractId) => {
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === contractId
          ? {
              ...c,
              status: 'accepted' as ContractStatus,
              progress: 15,
              timeline: [
                ...(c.timeline ?? []),
                { timestamp: new Date().toISOString(), event: 'Contract accepted by Cooperative' },
              ],
            }
          : c
      ),
    }));
  },

  declineContract: (contractId) => {
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === contractId ? { ...c, status: 'declined' as ContractStatus, progress: 0 } : c
      ),
    }));
  },

  fundContract: (contractId) => {
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === contractId
          ? {
              ...c,
              status: 'funded' as ContractStatus,
              escrowAmount: c.volumeKg * 30,
              progress: Math.max(c.progress, 20),
            }
          : c
      ),
    }));
  },

  updateCropStatus: (contractId, status) => {
    const progressMap: Record<CropStatus, number> = {
      pending: 0, seeds_planted: 25, fertilized: 40, growing: 60,
      ready_for_harvest: 80, harvested: 95, delivered: 100,
    };
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === contractId
          ? {
              ...c,
              cropStatus: status,
              progress: progressMap[status],
              progressPercent: progressMap[status],
              status: status === 'delivered' ? ('completed' as ContractStatus) : c.status,
            }
          : c
      ),
    }));
  },

  // updateFarmerSmsStatus: merged — updates cooperative members (useAppStore) AND
  // users / farmPlots / contract timeline (useStore)
  updateFarmerSmsStatus: (contractId, farmerId, status) => {
    set((s) => {
      // 1. Update cooperative member smsStatus inside the matched contract (useAppStore)
      const updatedContracts = s.contracts.map((c) => {
        if (c.id !== contractId || !c.matchedCooperative) return c;
        return {
          ...c,
          matchedCooperative: {
            ...c.matchedCooperative,
            members: c.matchedCooperative.members.map((f) =>
              f.id === farmerId ? { ...f, smsStatus: status } : f
            ),
          },
        };
      });

      // 2. Update User smsStatus (useStore) — map FarmerSmsStatus → useStore smsStatus
      const userStatus = (['pending', 'notified', 'planted', 'declined'] as const).includes(
        status as any
      )
        ? (status as 'pending' | 'notified' | 'planted' | 'declined')
        : undefined;

      const updatedUsers = userStatus
        ? s.users.map((u) => (u.id === farmerId ? { ...u, smsStatus: userStatus } : u))
        : s.users;

      // 3. Update farmPlot status (useStore)
      // Cast to string first because FarmerSmsStatus doesn't include 'declined',
      // but this function may be called from useStore paths that pass that value.
      const statusStr = status as string;
      const updatedPlots = s.farmPlots.map((p) =>
        p.assignedFarmerId === farmerId
          ? {
              ...p,
              status:
                statusStr === 'declined'
                  ? ('declined' as PlotStatus)
                  : statusStr === 'planted' || statusStr === 'harvested'
                  ? (statusStr as PlotStatus)
                  : p.status,
            }
          : p
      );

      return { contracts: updatedContracts, users: updatedUsers, farmPlots: updatedPlots };
    });
  },

  addCoopMember: (coopId, farmer) => {
    set((s) => ({
      cooperatives: s.cooperatives.map((coop) =>
        coop.id === coopId
          ? {
              ...coop,
              members: [...coop.members, farmer],
              totalHectares: parseFloat((coop.totalHectares + farmer.hectares).toFixed(2)),
            }
          : coop
      ),
    }));
  },

  removeCoopMember: (coopId, farmerId) => {
    set((s) => ({
      cooperatives: s.cooperatives.map((coop) => {
        if (coop.id !== coopId) return coop;
        const removed = coop.members.find((f) => f.id === farmerId);
        return {
          ...coop,
          members: coop.members.filter((f) => f.id !== farmerId),
          totalHectares: parseFloat(
            (coop.totalHectares - (removed?.hectares ?? 0)).toFixed(2)
          ),
        };
      }),
    }));
  },

  updateCoopMemberCrops: (coopId, farmerId, crops) => {
    set((s) => ({
      cooperatives: s.cooperatives.map((coop) =>
        coop.id !== coopId
          ? coop
          : {
              ...coop,
              members: coop.members.map((f) =>
                f.id === farmerId ? { ...f, crops } as any : f
              ),
            }
      ),
    }));
  },

  // ── useStore initial state ─────────────────────────────────────────────────
  activePersona: 'buyer',
  users: initialUsers,
  farmPlots: initialPlots,

  switchPersona: (role) => set({ activePersona: role }),

  // createDemand: mirrors useStore but also populates useAppStore Contract fields
  createDemand: (crop, volumeKg, targetDate) => {
    set((s) => {
      const newContract: Contract = {
        id: `contract_${Date.now()}`,
        crop,
        volumeKg,
        targetDate,
        status: 'open',
        cropStatus: 'pending',
        progress: 0,
        buyerName: 'Metro Fresh Foods',
        escrowAmount: 0,
        createdAt: new Date().toISOString().split('T')[0],
        // useStore fields
        buyerId: 'buyer_01',
        sellerId: null,
        escrowStatus: 'unfunded',
        progressPercent: 0,
        timeline: [{ timestamp: new Date().toISOString(), event: `Demand created for ${volumeKg}kg of ${crop}` }],
      };
      return { contracts: [...s.contracts, newContract] };
    });
  },

  simulateAIMatch: (contractId) => {
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === contractId
          ? {
              ...c,
              sellerId: 'coop_01',
              status: 'matched' as ContractStatus,
              timeline: [
                ...(c.timeline ?? []),
                { timestamp: new Date().toISOString(), event: 'AI matched with Agrarian Coop #1' },
              ],
            }
          : c
      ),
    }));
  },

  // fundEscrow: mirrors useStore, also sets escrowAmount if not yet set
  fundEscrow: (contractId) => {
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === contractId
          ? {
              ...c,
              escrowStatus: 'locked' as EscrowStatus,
              escrowAmount: c.escrowAmount || c.volumeKg * 30,
              timeline: [
                ...(c.timeline ?? []),
                { timestamp: new Date().toISOString(), event: 'Funds locked in Escrow' },
              ],
            }
          : c
      ),
    }));
  },

  allocateQuota: (contractId, farmerIds) => {
    set((s) => {
      let farmerIndex = 0;
      const updatedPlots = s.farmPlots.map((plot) => {
        if (plot.status === 'idle' && farmerIndex < farmerIds.length) {
          const assignedId = farmerIds[farmerIndex];
          farmerIndex++;
          return { ...plot, assignedFarmerId: assignedId, status: 'assigned' as PlotStatus, currentContractId: contractId };
        }
        return plot;
      });
      const updatedUsers = s.users.map((u) =>
        farmerIds.includes(u.id) ? { ...u, smsStatus: 'notified' as const } : u
      );
      return { farmPlots: updatedPlots, users: updatedUsers };
    });
  },

  broadcastSMS: (contractId) => {
    set((s) => {
      const assignedFarmers = s.farmPlots
        .filter((p) => p.currentContractId === contractId && p.assignedFarmerId)
        .map((p) => p.assignedFarmerId as string);

      const uniqueFarmers = Array.from(new Set(assignedFarmers));
      const shortId = contractId.slice(-4);

      const msgEn = `KontratAni: You are assigned to grow crops for Contract ${shortId}.\n\n1 - Plant\n0 - Decline`;
      const msgTl = `KontratAni: Kayo ay naitalaga para magtanim para sa Kontrata ${shortId}.\n\n1 - Magtanim\n0 - Tumanggi`;
      const fullMessage = `${msgEn}\n\n―――\n\n${msgTl}`;

      const payload = {
        id: `bcast-${Date.now()}`,
        farmersNotified: uniqueFarmers,
        text: fullMessage,
        contractId,
        time: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
      };
      localStorage.setItem('kontratani_broadcast', JSON.stringify(payload));

      return s; // no local state change needed
    });
  },

  distributeFunds: (contractId) => {
    set((s) => {
      const updatedContracts = s.contracts.map((c) =>
        c.id === contractId
          ? {
              ...c,
              escrowStatus: 'released' as EscrowStatus,
              status: 'completed' as ContractStatus,
            }
          : c
      );
      const updatedUsers = s.users.map((u) =>
        u.role === 'sub_farmer' && u.smsStatus !== 'declined'
          ? { ...u, walletBalance: u.walletBalance + 5000 }
          : u
      );
      return { contracts: updatedContracts, users: updatedUsers };
    });
  },

  // Standalone user SMS status updater from useStore (kept separate to avoid
  // breaking callers that pass only farmerId + status without a contractId)
  updateUserSmsStatus: (farmerId, status) => {
    set((s) => ({
      users: s.users.map((u) =>
        u.id === farmerId ? { ...u, smsStatus: status } : u
      ),
      farmPlots: s.farmPlots.map((p) =>
        p.assignedFarmerId === farmerId
          ? {
              ...p,
              status:
                status === 'declined'
                  ? ('declined' as PlotStatus)
                  : status === 'planted'
                  ? ('planted' as PlotStatus)
                  : p.status,
            }
          : p
      ),
      contracts: s.contracts.map((c) => {
        const farmerName = s.users.find((u) => u.id === farmerId)?.name || 'A farmer';
        const isRelevant = s.farmPlots.some(
          (p) => p.assignedFarmerId === farmerId && p.currentContractId === c.id
        );
        if (!isRelevant) return c;
        return {
          ...c,
          progressPercent:
            status === 'planted' ? Math.min((c.progressPercent ?? c.progress) + 50, 100) : c.progressPercent,
          timeline: [
            ...(c.timeline ?? []),
            {
              timestamp: new Date().toISOString(),
              event:
                status === 'planted'
                  ? `${farmerName} confirmed: Planting started. 🌱`
                  : status === 'declined'
                  ? `${farmerName} declined the assignment. ❌`
                  : (c.timeline ?? [])[(c.timeline ?? []).length - 1]?.event ?? '',
            },
          ],
        };
      }),
    }));
  },
}));