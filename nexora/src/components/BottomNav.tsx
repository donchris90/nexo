import React, { useState } from 'react';
import { 
  Tv, 
  Users, 
  Radio, 
  MessageSquare, 
  User, 
  Sparkles, 
  Camera, 
  Mic, 
  Video, 
  Swords, 
  Plus, 
  Flame, 
  Crown,
  Building2,
  Trophy,
  Gamepad2,
  Wallet,
  Clapperboard,
  ShieldCheck,
  X
} from 'lucide-react';
import { useEconomy } from '../context/EconomyContext';

interface BottomNavProps {
  activeTab: string; // 'live' | 'party' | 'chat' | 'me' | 'games' | 'social' etc.
  setActiveTab: (tab: string) => void;
  liveSubTab: 'NEARBY' | 'POPULAR' | 'FEATURED' | 'EXPLORE';
  setLiveSubTab: (subTab: 'NEARBY' | 'POPULAR' | 'FEATURED' | 'EXPLORE') => void;
  partyCategory: string;
  setPartyCategory: (cat: string) => void;
  onOpenGoLiveModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  liveSubTab,
  setLiveSubTab,
  partyCategory,
  setPartyCategory,
  onOpenGoLiveModal
}) => {
  const { notifications, userLevel } = useEconomy();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        
        {/* TAB 1: LIVE (HOME) */}
        <button
          onClick={() => setActiveTab('live')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'live' || activeTab === 'streams'
              ? 'text-pink-400 font-black scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Radio className={`w-5 h-5 ${activeTab === 'live' || activeTab === 'streams' ? 'text-pink-400 animate-pulse' : ''}`} />
            {(activeTab === 'live' || activeTab === 'streams') && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-pink-500 rounded-full animate-ping" />
            )}
          </div>
          <span className="text-[10px] font-extrabold tracking-tight">Live</span>
        </button>

        {/* TAB 2: PARTY */}
        <button
          onClick={() => setActiveTab('party')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'party'
              ? 'text-purple-400 font-black scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Users className="w-5 h-5" />
            {partyCategory && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-purple-500 text-white text-[8px] font-black rounded-full">
                9 SEAT
              </span>
            )}
          </div>
          <span className="text-[10px] font-extrabold tracking-tight">Party</span>
        </button>

        {/* CENTER FLOATING GO LIVE ACTION BUTTON (BIGO STYLE) */}
        <div className="relative -top-4">
          <button
            onClick={onOpenGoLiveModal}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-pink-500 via-purple-600 to-amber-400 p-1 shadow-xl shadow-pink-500/30 hover:scale-110 active:scale-95 transition-all flex items-center justify-center group"
            title="Start Live / Party Stream"
          >
            <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center border border-pink-400/40 group-hover:bg-slate-900 transition-colors">
              <Camera className="w-6 h-6 text-pink-400 group-hover:scale-110 transition-transform" />
            </div>
          </button>
        </div>

        {/* TAB 3: CHAT */}
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'chat'
              ? 'text-cyan-400 font-black scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-pink-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full animate-bounce">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-extrabold tracking-tight">Chat</span>
        </button>

        {/* TAB 4: ME (PROFILE) */}
        <button
          onClick={() => setActiveTab('me')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'me' || activeTab === 'profile'
              ? 'text-amber-400 font-black scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <User className="w-5 h-5" />
            <span className="absolute -bottom-0.5 -right-1 text-[9px]">
              {userLevel.countryFlag}
            </span>
          </div>
          <span className="text-[10px] font-extrabold tracking-tight">Me</span>
        </button>

      </div>
    </div>
  );
};
