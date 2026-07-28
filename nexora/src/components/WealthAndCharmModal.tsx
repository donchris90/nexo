import React, { useState } from 'react';
import { useEconomy } from '../context/EconomyContext';
import { WealthTier } from '../types';
import { 
  Crown, 
  Sparkles, 
  Heart, 
  ShieldCheck, 
  Zap, 
  X, 
  CheckCircle2, 
  ChevronRight,
  Gift
} from 'lucide-react';

interface WealthAndCharmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WealthAndCharmModal: React.FC<WealthAndCharmModalProps> = ({ isOpen, onClose }) => {
  const { userLevel } = useEconomy();
  const [activeTab, setActiveTab] = useState<'WEALTH' | 'CHARM' | 'FAN_CLUB'>('WEALTH');

  if (!isOpen) return null;

  const WEALTH_TIERS: { tier: WealthTier; coinsRequired: string; badge: string; color: string; perk: string }[] = [
    { tier: 'BRONZE', coinsRequired: '0 Coins', badge: '🥉 Bronze Gifter', color: 'text-amber-600', perk: 'Standard entrance animation & badge' },
    { tier: 'SILVER', coinsRequired: '10,000 Coins', badge: '🥈 Silver Noble', color: 'text-slate-300', perk: 'Silver name highlight & +5% bonus XP' },
    { tier: 'GOLD', coinsRequired: '50,000 Coins', badge: '🥇 Gold VIP', color: 'text-amber-400', perk: 'Gold VIP seat frame, exclusive entrance sound' },
    { tier: 'DIAMOND', coinsRequired: '200,000 Coins', badge: '💎 Diamond Lord', color: 'text-cyan-400', perk: 'Full-screen AR Dragon entrance, priority seat queue' },
    { tier: 'MASTER', coinsRequired: '500,000 Coins', badge: '👑 Master Gifter', color: 'text-purple-400', perk: '3D Cyber Sports Car entrance & custom gift badges' },
    { tier: 'LEGEND', coinsRequired: '1,500,000 Coins', badge: '⚡ Legend Sovereign', color: 'text-pink-400', perk: 'Personalized stream banner & 10% cash rebate' },
    { tier: 'ROYAL', coinsRequired: '5,000,000 Coins', badge: '🏰 Royal Highness', color: 'text-yellow-300', perk: 'Exclusive Royal Guard title & anti-kick immunity' },
    { tier: 'EMPEROR', coinsRequired: '15,000,000 Coins', badge: '🔥 Imperial Emperor', color: 'text-red-400', perk: 'Global ticker announcement when entering any room' },
    { tier: 'GALAXY', coinsRequired: '50,000,000 Coins', badge: '🌌 Galaxy Supreme', color: 'text-indigo-300', perk: 'Custom 3D avatar & dedicated agency manager' },
    { tier: 'UNIVERSE', coinsRequired: '100,000,000+ Coins', badge: '✨ Universal Titan', color: 'text-emerald-300', perk: 'Ultimate Universe Crown & 1-on-1 creator dinner trips' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
        {/* HEADER */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 text-slate-950 shadow-lg font-black">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                Wealth & Charm Tier System
              </h3>
              <p className="text-xs text-slate-400">Unlock VIP perks, entrance effects, and badges as your spending & gifts grow</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-2 p-3 bg-slate-950 border-b border-slate-800">
          {[
            { id: 'WEALTH', label: '👑 10 Wealth Tiers' },
            { id: 'CHARM', label: '💖 Creator Charm Level' },
            { id: 'FAN_CLUB', label: '⭐ Creator Fan Clubs' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-pink-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {activeTab === 'WEALTH' && (
            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-r from-amber-950 to-slate-950 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Your Current Wealth Status</span>
                  <h4 className="text-lg font-black text-amber-300 flex items-center gap-1.5">
                    Level {userLevel.wealthLevel} • {userLevel.wealthTierName} Tier
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Spent</span>
                  <span className="text-sm font-black text-slate-100">🪙 {userLevel.giftsSentTotal.toLocaleString()} Coins</span>
                </div>
              </div>

              <div className="space-y-2">
                {WEALTH_TIERS.map((wt, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                      userLevel.wealthTierName === wt.tier
                        ? 'bg-amber-500/20 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-black text-sm ${wt.color}`}>{wt.badge}</span>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Req: {wt.coinsRequired}</span>
                        <p className="text-slate-200 font-medium">{wt.perk}</p>
                      </div>
                    </div>

                    {userLevel.wealthTierName === wt.tier ? (
                      <span className="px-2.5 py-1 bg-amber-500 text-slate-950 text-[10px] font-black rounded-lg">
                        ACTIVE
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'CHARM' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-gradient-to-r from-purple-950 to-slate-950 border border-purple-500/30 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Creator Charm Level</span>
                  <h4 className="text-lg font-black text-purple-300">Level {userLevel.charmLevel} Charm</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Gifts Received</span>
                  <span className="text-sm font-black text-pink-400">💎 {userLevel.giftsReceivedTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: '💖 Gifts Received Score', value: '+10 Charm Points per 100 Diamonds received' },
                  { title: '⏱️ Live Watch Time', value: '+5 Charm Points per 10 mins host streaming' },
                  { title: '👥 Fan Club Subscribers', value: '+50 Charm Points per active Subscriber' },
                  { title: '🏆 PK Battle Victories', value: '+200 Charm Points per PK match won' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <h5 className="font-extrabold text-slate-100">{item.title}</h5>
                    <p className="text-[11px] text-slate-400">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'FAN_CLUB' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <h4 className="font-extrabold text-sm text-amber-300">Aria Nova’s Star Squad Fan Club</h4>
                <p className="text-slate-400 leading-relaxed">
                  Join for 500 Coins/month to unlock subscriber badges, private subscriber chat rooms, and monthly gift boxes!
                </p>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-slate-300 font-extrabold">🪙 500 Coins / Month</span>
                  <button className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-extrabold rounded-xl shadow">
                    Subscribe Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
