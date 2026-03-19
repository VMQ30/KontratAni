import { create } from 'zustand';

export type CropStatus = 'pending' | 'seeds_planted' | 'fertilized' | 'growing' | 'ready_for_harvest' | 'harvested' | 'delivered';
export type ContractStatus = 'open' | 'matched' | 'accepted' | 'funded' | 'in_progress' | 'completed' | 'declined';
export type FarmerSmsStatus = 'pending' | 'notified' | 'confirmed' | 'planted' | 'harvested';

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

export interface Contract {
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

interface AppState {
  contracts: Contract[];
  cooperatives: Cooperative[];
  activeView: string;
  selectedContractId: string | null;

  // Broadcast messages from manager to farmers
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
}

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

const mockContracts: Contract[] = [
  {
    id: 'c1', crop: 'Tomatoes', volumeKg: 5000, targetDate: '2026-06-15',
    status: 'in_progress', cropStatus: 'growing', progress: 60,
    buyerName: 'Metro Fresh Foods', matchedCooperative: mockCooperatives[0],
    escrowAmount: 150000, createdAt: '2026-01-10',
  },
  {
    id: 'c2', crop: 'Rice (Sinandomeng)', volumeKg: 10000, targetDate: '2026-08-01',
    status: 'funded', cropStatus: 'seeds_planted', progress: 25,
    buyerName: 'Metro Fresh Foods', matchedCooperative: mockCooperatives[2],
    escrowAmount: 450000, createdAt: '2026-02-01',
  },
  {
    id: 'c3', crop: 'Onions (Red)', volumeKg: 3000, targetDate: '2026-05-20',
    status: 'matched', cropStatus: 'pending', progress: 10,
    buyerName: 'Metro Fresh Foods', matchedCooperative: mockCooperatives[1],
    escrowAmount: 0, createdAt: '2026-03-05',
  },
];

export const useAppStore = create<AppState>((set, get) => ({
  contracts: mockContracts,
  cooperatives: mockCooperatives,
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

  acceptContract: (contractId) => {
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === contractId ? { ...c, status: 'accepted' as ContractStatus, progress: 15 } : c
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
          ? { ...c, status: 'funded' as ContractStatus, escrowAmount: c.volumeKg * 30, progress: Math.max(c.progress, 20) }
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
              status: status === 'delivered' ? ('completed' as ContractStatus) : c.status,
            }
          : c
      ),
    }));
  },

  updateFarmerSmsStatus: (contractId, farmerId, status) => {
    set((s) => ({
      contracts: s.contracts.map((c) => {
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
      }),
    }));
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
}));