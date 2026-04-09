import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  Leaf, Search, ShieldCheck, Clock, MapPin,
  CheckCircle2, Loader2
} from 'lucide-react';

export default function BuyerPortal() {
  const {
    contracts,
    createDemand,
    simulateAIMatch,
    fundEscrow
  } = useAppStore();

  const [crop, setCrop] = useState('');
  const [volume, setVolume] = useState('');
  const [date, setDate] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleCreateDemand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!crop || !volume || !date) return;
    createDemand(crop, parseInt(volume), date);
    setCrop(''); setVolume(''); setDate('');
  };

  const handleAIMatch = (contractId: string) => {
    setLoadingId(contractId);
    setTimeout(() => {
      simulateAIMatch(contractId);
      setLoadingId(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-900">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Procurement Dashboard</h1>
          <p className="text-slate-500 mt-1">Institutional Buyer: MegaMart Groceries</p>
        </div>
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium flex items-center gap-2">
          <ShieldCheck size={18} /> Verified Corporate Buyer
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Leaf className="text-green-600" /> Create Demand
            </h2>
            <form onSubmit={handleCreateDemand} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Crop Type</label>
                <input
                  type="text" value={crop} onChange={(e) => setCrop(e.target.value)}
                  placeholder="e.g., Roma Tomatoes"
                  className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Volume (kg)</label>
                <input
                  type="number" value={volume} onChange={(e) => setVolume(e.target.value)}
                  placeholder="e.g., 5000"
                  className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Harvest Date</label>
                <input
                  type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-md transition-colors"
              >
                Draft Forward Contract
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {contracts.length === 0 ? (
            <div className="bg-white p-10 rounded-xl border border-slate-200 border-dashed text-center text-slate-500">
              <Leaf className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p>No active contracts. Create a demand request to get started.</p>
            </div>
          ) : (
            contracts.map(contract => (
              <div key={contract.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 p-6 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-2xl font-bold">{contract.volumeKg}kg of {contract.crop}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide
                        ${contract.status === 'open' || contract.status === 'matched' ? 'bg-slate-100 text-slate-600' :
                          contract.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'}`}>
                        {contract.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 flex items-center gap-4">
                      <span className="flex items-center gap-1"><Clock size={14} /> Target: {contract.targetDate}</span>
                      {contract.sellerId && <span className="flex items-center gap-1"><MapPin size={14} /> Seller: {contract.sellerId}</span>}
                    </p>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="mb-6">
                      <div className="flex justify-between text-sm font-medium mb-2">
                        <span>Fulfillment Progress</span>
                        <span className="text-green-600">{contract.progressPercent ?? contract.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div
                          className="bg-green-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${contract.progressPercent ?? contract.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {contract.status === 'open' && (
                        <button
                          onClick={() => handleAIMatch(contract.id)}
                          disabled={loadingId === contract.id}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                        >
                          {loadingId === contract.id ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                          {loadingId === contract.id ? 'Analyzing Soil & Weather Data...' : 'Find AI Match'}
                        </button>
                      )}

                      {contract.status === 'matched' && (
                        <div className="p-3 bg-amber-50 text-amber-800 rounded-md text-sm text-center border border-amber-200">
                          Waiting for Cooperative to accept terms...
                        </div>
                      )}

                      {contract.status === 'accepted' && contract.escrowStatus === 'unfunded' && (
                        <button
                          onClick={() => fundEscrow(contract.id)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-md flex items-center justify-center gap-2 transition-colors shadow-sm shadow-green-200"
                        >
                          <ShieldCheck size={18} /> Lock Funds in Escrow
                        </button>
                      )}

                      {contract.escrowStatus === 'locked' && (
                        <div className="p-3 bg-green-50 text-green-800 rounded-md text-sm text-center border border-green-200 flex items-center justify-center gap-2 font-medium">
                          <CheckCircle2 size={18} /> Funds Secured in Escrow
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Traceability Log</h4>
                    <div className="space-y-4">
                      {(contract.timeline ?? []).map((item, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1.5" />
                            {idx !== (contract.timeline ?? []).length - 1 && <div className="w-px h-full bg-green-200 my-1" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{item.event}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}