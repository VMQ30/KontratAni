import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import BuyerPortal from './BuyerPortal';
import FarmerPortal from './FarmerPortal';
import { Sprout, Building2, Users, Tractor } from 'lucide-react';

export default function KontratAniApp() {
  const { activePersona, switchPersona } = useAppStore();

  return (
    <div className="min-h-screen flex flex-col relative bg-slate-50">

      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-1.5 rounded-md">
              <Sprout className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-emerald-500">
              KontratAni
            </span>
          </div>

          {/* Persona Switcher */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => switchPersona('buyer')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activePersona === 'buyer'
                  ? 'bg-white shadow-sm text-blue-700 border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Building2 size={16} /> View as Buyer
            </button>

            <div className="w-px h-6 bg-slate-300 mx-1"></div>

            <button
              onClick={() => switchPersona('coop_manager')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activePersona === 'coop_manager'
                  ? 'bg-white shadow-sm text-emerald-700 border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users size={16} /> View as Coop
            </button>

            <button
              onClick={() => switchPersona('solo_farmer')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activePersona === 'solo_farmer'
                  ? 'bg-white shadow-sm text-amber-700 border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Tractor size={16} /> View as Solo
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1600px] mx-auto">
        {activePersona === 'buyer' ? <BuyerPortal /> : <FarmerPortal />}
      </main>
    </div>
  );
}