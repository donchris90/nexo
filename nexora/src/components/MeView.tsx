import React, { useState } from 'react';
import { useEconomy } from '../context/EconomyContext';
import { 
  User, 
  Crown, 
  Sparkles, 
  Wallet, 
  Trophy, 
  Building2, 
  Clapperboard, 
  Gamepad2, 
  ShieldCheck, 
  PlusCircle, 
  ArrowUpRight, 
  ChevronRight, 
  Settings, 
  Heart, 
  Users, 
  Share2, 
  Award, 
  Flame, 
  Lock, 
  Gift, 
  QrCode,
  DollarSign,
  Ticket,
  Percent
} from 'lucide-react';

interface MeViewProps {
  setActiveTab: (tab: string) => void;
  onOpenRechargeModal: () => void;
  onOpenExchangeModal: () => void;
  onOpenWithdrawalModal: () => void;
  onOpenWealthModal: () => void;
}

export const MeView: React.FC<MeViewProps> = ({
  setActiveTab,
  onOpenRechargeModal,
  onOpenExchangeModal,
  onOpenWithdrawalModal,
  onOpenWealthModal
}) => {
  const { wallet, userLevel, vipTier } = useEconomy();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* PROFILE HEADER CARD (BIGO STYLE) */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                alt="Alex Rivers"
                className="w-20 h-20 rounded-full object-cover ring-4 ring-pink-500 shadow-xl"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 p-1 bg-amber-500 rounded-full text-slate-950 shadow-md">
                <Crown className="w-4 h-4 fill-slate-950" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-100">Alex Rivers</h2>
                <span className="text-lg">{userLevel.countryFlag}</span>
                <button
                  onClick={onOpenWealthModal}
                  className="px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black rounded-full uppercase flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" /> {vipTier}
                </button>
              </div>

              <p className="text-xs text-slate-400 mt-1 font-mono">
                Nexora ID: <span className="text-cyan-300 font-extrabold">#NEX-889021</span>
              </p>

              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-pink-500 text-slate-950 font-black text-[10px] rounded-full">
                  Wealth Lv.{userLevel.wealthLevel}
                </span>
                <span className="px-2.5 py-0.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-black text-[10px] rounded-full">
                  Charm Lv.{userLevel.charmLevel}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('Sharing Nexora Profile Card & QR Code...')}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-700"
              title="Share Profile"
            >
              <QrCode className="w-4 h-4 text-cyan-300" />
            </button>
            <button
              onClick={() => alert('Opening Profile & Privacy Settings...')}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-700"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>

        {/* FOLLOWER & GIFTING STATS BAR */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 text-center">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Followers</span>
            <span className="text-base font-black text-slate-100">{userLevel.followersCount.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Following</span>
            <span className="text-base font-black text-slate-100">142</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Charm Diamonds</span>
            <span className="text-base font-black text-cyan-300">💎 {wallet.diamonds.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* DUAL WALLET QUICK RECHARGE & WITHDRAWAL CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm text-slate-100">My Nexora Balance & Wallet</h3>
          </div>
          <button
            onClick={() => setActiveTab('wallet')}
            className="text-xs text-cyan-400 font-black hover:underline flex items-center gap-1"
          >
            Full Ledger →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* COINS */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-400 font-bold flex items-center gap-1">🪙 Premium Coins</span>
              <span className="text-[10px] text-slate-500">For Gifting & Games</span>
            </div>
            <div className="text-2xl font-black text-amber-300">🪙 {wallet.coins.toLocaleString()}</div>
            <button
              onClick={onOpenRechargeModal}
              className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:opacity-90"
            >
              Recharge Coins (+10% Bonus)
            </button>
          </div>

          {/* DIAMONDS */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/30 space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-cyan-400 font-bold flex items-center gap-1">💎 Creator Diamonds</span>
              <span className="text-[10px] text-slate-500">Earned from Gifts</span>
            </div>
            <div className="text-2xl font-black text-cyan-300">💎 {wallet.diamonds.toLocaleString()}</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onOpenExchangeModal}
                className="py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-xl border border-cyan-500/30"
              >
                Exchange Coins
              </button>
              <button
                onClick={onOpenWithdrawalModal}
                className="py-2 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/30"
              >
                Withdraw Cash
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK SERVICES & APP MODULES GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { id: 'families', title: 'Families & Guilds', sub: 'Rank #1 StarLight', icon: Users, color: 'text-purple-400', badge: 'Guild' },
          { id: 'agencies', title: 'Agencies Portal', sub: 'Contracts & Roster', icon: Building2, color: 'text-amber-400', badge: 'Official' },
          { id: 'missions', title: 'Missions & Daily XP', sub: 'Claim Rewards', icon: Trophy, color: 'text-emerald-400', badge: '+XP' },
          { id: 'creator', title: 'Creator Studio', sub: 'Reels, Taxes & Store', icon: Clapperboard, color: 'text-pink-400', badge: 'Revenue' },
          { id: 'games', title: 'Gaming Arena', sub: 'Ludo PvP & Wheels', icon: Gamepad2, color: 'text-cyan-400', badge: 'Ludo' },
          { id: 'admin', title: 'Admin Console', sub: 'System Controls', icon: ShieldCheck, color: 'text-blue-400', badge: 'Secure' }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-3xl text-left space-y-2 group transition-all shadow-md"
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-6 h-6 ${item.color} group-hover:scale-110 transition-transform`} />
                <span className="px-2 py-0.5 bg-slate-950 text-slate-300 font-mono text-[9px] font-black rounded-full border border-slate-800">
                  {item.badge}
                </span>
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-100">{item.title}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
