import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { MapContainer, TileLayer, Rectangle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Tractor, Users, Inbox, Map as MapIcon,
  Send, DollarSign, User, CheckCircle2, XCircle, MessageSquare
} from 'lucide-react';

const SMS_STATUS_KEY = 'kontratani_sms_status';

export default function FarmerPortal() {
  const {
    activePersona,
    switchPersona,
    contracts,
    farmPlots,
    users,
    acceptContract,
    allocateQuota,
    broadcastSMS,
    distributeFunds,
    updateFarmerSmsStatus,
    updateUserSmsStatus,
  } = useAppStore();

  // ✅ Listen for SMS status changes from the mobile view tab
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== SMS_STATUS_KEY || !e.newValue) return;
      try {
        const payload = JSON.parse(e.newValue) as {
          contractId: string;
          farmerId: string;
          userId: string;         // farmer_01 — matches the users array
          smsStatus: string;
          ts: number;
        };
        // Update cooperative member (f1) inside the contract
        updateFarmerSmsStatus(payload.contractId, payload.farmerId, payload.smsStatus as any);
        // ✅ Update the users array (farmer_01) — this is what the member ledger reads
        updateUserSmsStatus(payload.userId, payload.smsStatus as any);
      } catch {}
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [updateFarmerSmsStatus, updateUserSmsStatus]);

  const getSmsStatusBadge = (status?: string) => {
    switch (status) {
      case 'planted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            <CheckCircle2 size={11} /> Accepted
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
            <XCircle size={11} /> Declined
          </span>
        );
      case 'notified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
            <MessageSquare size={11} /> Notified
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-500">
            Pending
          </span>
        );
    }
  };

  const getPlotColor = (status: string) => {
    switch (status) {
      case 'idle':      return '#94a3b8';
      case 'assigned':  return '#3b82f6';
      case 'planted':   return '#eab308';
      case 'harvested': return '#22c55e';
      default:          return '#94a3b8';
    }
  };

  const getBounds = (lat: number, lng: number): [[number, number], [number, number]] => {
    const offset = 0.0005;
    return [[lat - offset, lng - offset], [lat + offset, lng + offset]];
  };

  const pendingContracts = contracts.filter(c => c.status === 'matched');
  const activeContracts  = contracts.filter(c =>
    c.status === 'in_progress' || c.status === 'funded' || c.status === 'accepted'
  );

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-10 font-sans text-stone-900">

      {/* Header */}
      <div className="mb-8 flex justify-between items-center bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 p-3 rounded-lg text-emerald-800">
            {activePersona === 'coop_manager' ? <Users size={24} /> : <Tractor size={24} />}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              {activePersona === 'coop_manager' ? 'Agrarian Cooperative Hub' : 'Solo Farmer Dashboard'}
            </h1>
            <p className="text-stone-500 text-sm">Manage Contracts, Plots & Payouts</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-lg border border-stone-200">
          <button
            onClick={() => switchPersona('solo_farmer')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activePersona === 'solo_farmer' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Solo Mode
          </button>
          <button
            onClick={() => switchPersona('coop_manager')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activePersona === 'coop_manager' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Coop Mode
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── Left column ── */}
        <div className="lg:col-span-5 space-y-6">

          {/* Pending contracts */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="bg-stone-100 border-b border-stone-200 p-4 flex items-center gap-2 font-semibold text-stone-700">
              <Inbox size={18} /> Pending Contracts ({pendingContracts.length})
            </div>
            <div className="p-4">
              {pendingContracts.length === 0 ? (
                <p className="text-sm text-stone-500 text-center py-4">No new contract requests.</p>
              ) : (
                pendingContracts.map(contract => (
                  <div key={contract.id} className="border border-emerald-200 bg-emerald-50 rounded-lg p-4 mb-3">
                    <h4 className="font-bold text-lg">{contract.volumeKg}kg {contract.crop}</h4>
                    <p className="text-sm text-stone-600 mb-4">
                      Buyer: {contract.buyerName} • Target: {contract.targetDate}
                    </p>
                    <button
                      onClick={() => acceptContract(contract.id)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-md font-medium transition-colors"
                    >
                      Accept Contract
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active contracts */}
          {activeContracts.map(contract => {
            const isFunded         = contract.escrowStatus === 'locked';
            const plotsAssigned    = farmPlots.some(p => p.currentContractId === contract.id);
            const progress         = contract.progressPercent ?? contract.progress;
            const isReadyForPayout = progress === 100;

            return (
              <div key={contract.id} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-stone-100">
                  <h3 className="font-bold text-xl mb-1">Active: {contract.crop} Order</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-500">Progress: {progress}%</span>
                    <span className={`font-medium ${isFunded ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {isFunded ? 'Escrow Funded' : 'Awaiting Buyer Funds'}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-4 bg-stone-50">
                  {!plotsAssigned ? (
                    <button
                      onClick={() => {
                        const idsToAssign = activePersona === 'coop_manager'
                          ? users.map(u => u.id)
                          : ['solo_farmer_01'];
                        allocateQuota(contract.id, idsToAssign);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <MapIcon size={18} /> Allocate Plots & Assign Farmers
                    </button>
                  ) : (
                    <div className="p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-md text-sm text-center font-medium">
                      Plots Assigned Successfully
                    </div>
                  )}

                  {plotsAssigned && !isReadyForPayout && (
                    <button
                      onClick={() => broadcastSMS(contract.id)}
                      className="w-full bg-stone-900 hover:bg-stone-800 text-white py-2.5 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Send size={18} /> Broadcast SMS to Farmers
                    </button>
                  )}

                  {isReadyForPayout && (
                    <button
                      onClick={() => distributeFunds(contract.id)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-md font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 animate-pulse"
                    >
                      <DollarSign size={20} /> Release Payouts via E-Wallets
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Right column ── */}
        <div className="lg:col-span-7 space-y-6">

          {/* Map */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden h-[500px] flex flex-col">
            <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <h3 className="font-bold text-stone-800 flex items-center gap-2">
                <MapIcon className="text-blue-600" /> Interactive Farm Map
              </h3>
              <div className="flex gap-3 text-xs font-medium text-stone-600">
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-400 rounded-sm" /> Idle</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-sm" /> Assigned</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded-sm" /> Planted</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm" /> Harvested</span>
              </div>
            </div>
            <div className="flex-1 bg-stone-200 relative z-0">
              <MapContainer
                center={[14.6000, 120.9845]}
                zoom={17}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="Tiles &copy; Esri"
                />
                {farmPlots.map((plot) => (
                  <Rectangle
                    key={plot.id}
                    bounds={getBounds(plot.coordinates[0], plot.coordinates[1])}
                    pathOptions={{
                      color: getPlotColor(plot.status),
                      fillColor: getPlotColor(plot.status),
                      fillOpacity: 0.7,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="font-sans">
                        <p className="font-bold text-sm mb-1">Plot ID: {plot.id}</p>
                        <p className="text-xs text-stone-600 uppercase">Status: {plot.status}</p>
                        {plot.assignedFarmerId && (
                          <p className="text-xs mt-1 border-t pt-1">Farmer ID: {plot.assignedFarmerId}</p>
                        )}
                      </div>
                    </Popup>
                  </Rectangle>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Member ledger */}
          {activePersona === 'coop_manager' && (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
              <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                <User className="text-stone-500" /> Member Ledger
              </h3>
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-stone-500 uppercase bg-stone-50 border-y border-stone-200">
                  <tr>
                    <th className="px-4 py-2">Farmer</th>
                    <th className="px-4 py-2">SMS Status</th>
                    <th className="px-4 py-2">Wallet Balance</th>
                    <th className="px-4 py-2">Payout Method</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-stone-100 last:border-0">
                      <td className="px-4 py-3 font-medium">{user.name}</td>
                      <td className="px-4 py-3">{getSmsStatusBadge(user.smsStatus)}</td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">
                        ₱{user.walletBalance.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-stone-100 px-2 py-1 rounded text-xs">{user.payoutMethod}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}