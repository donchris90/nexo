import React, { useState } from 'react';
import { useEconomy } from '../context/EconomyContext';
import { Family } from '../types';
import { 
  Shield, 
  Crown, 
  Users, 
  Swords, 
  Trophy, 
  MessageSquare, 
  Send, 
  Plus, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  ChevronRight 
} from 'lucide-react';

export const FamiliesView: React.FC = () => {
  const { families, joinFamily, userLevel, addXp } = useEconomy();
  const [selectedFamily, setSelectedFamily] = useState<Family>(families[0]);

  // Family Chat state
  const [familyChat, setFamilyChat] = useState([
    { id: 'fc_1', sender: 'Aria Nova', role: 'VICE_LEADER', text: 'Family PK Battle against Cyber Dragons starts in 20 minutes! Everyone gather in Seat Room #1! 🔥', time: '12:40 PM' },
    { id: 'fc_2', sender: 'Alex Rivers', role: 'LEADER', text: 'Sending 50,000 Family Coins pool to whoever tops tonight’s PK leaderboard! 👑', time: '12:42 PM' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleSendFamilyChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setFamilyChat(prev => [
      ...prev,
      {
        id: `fc_${Date.now()}`,
        sender: 'Alex Rivers (You)',
        role: 'LEADER',
        text: chatInput,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setChatInput('');
    addXp(30);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 text-white font-black shadow-lg">
              <Shield className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-2xl font-black bg-gradient-to-r from-amber-300 via-pink-300 to-red-400 bg-clip-text text-transparent">
                Families & Guilds System
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Join elite Families, participate in Family vs Family PK Battles, climb guild rankings, and claim weekly Coin pools!
              </p>
            </div>
          </div>
        </div>

        {/* ACTIVE FAMILY STATUS */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Your Family</span>
            <span className="text-xs font-black text-amber-300 flex items-center justify-end gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-400" /> {userLevel.familyName || 'No Family Joined'}
            </span>
          </div>
        </div>
      </div>

      {/* FAMILIES GRID & FAMILY DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COL: FAMILY SELECTION & LIST */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" /> Top Ranked Families in Nexora
          </h3>

          <div className="space-y-3">
            {families.map(fam => {
              const isSelected = selectedFamily.id === fam.id;
              return (
                <div
                  key={fam.id}
                  onClick={() => setSelectedFamily(fam)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500/60 shadow-xl ring-1 ring-amber-500/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={fam.logo}
                        alt={fam.name}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-400"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-100 flex items-center gap-1.5">
                          {fam.name}
                          <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[9px] font-black rounded">
                            Rank #{fam.familyRank}
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-400">Leader: {fam.leaderName}</p>
                      </div>
                    </div>

                    {!fam.isUserMember && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          joinFamily(fam.id);
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-red-600 text-white font-extrabold text-xs rounded-xl shadow"
                      >
                        Join Guild
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800/80 text-[11px]">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block">Guild Pool</span>
                      <span className="font-extrabold text-amber-300">🪙 {(fam.totalFamilyCoins / 1000000).toFixed(1)}M</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block">Members</span>
                      <span className="font-extrabold text-purple-300">👥 {fam.membersCount} Members</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT 2 COLS: SELECTED FAMILY HUBS (MEMBERS & FAMILY CHAT) */}
        <div className="lg:col-span-2 space-y-6">
          {/* FAMILY BANNER */}
          <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-red-950 border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={selectedFamily.logo}
                  alt={selectedFamily.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-400 shadow-xl"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                    {selectedFamily.name}
                    <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 font-black text-xs rounded-full border border-amber-500/30">
                      Rank #{selectedFamily.familyRank} Guild
                    </span>
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">{selectedFamily.description}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Guild Coin Pool</span>
                <span className="text-lg font-black text-amber-300">🪙 {selectedFamily.totalFamilyCoins.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* FAMILY PK BATTLE BANNER */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-600/20 border border-red-500/30 rounded-2xl text-red-400">
                <Swords className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-100">Family PK Battle Championship</h4>
                <p className="text-xs text-slate-400">Next match against Cyber Dragons Guild starting in 20 minutes.</p>
              </div>
            </div>

            <button className="px-4 py-2 bg-gradient-to-r from-red-600 to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-lg">
              Enter Family Arena
            </button>
          </div>

          {/* FAMILY CHAT & MEMBER LIST GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FAMILY CHAT */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col h-[340px] shadow-xl">
              <h4 className="font-extrabold text-xs uppercase text-slate-200 border-b border-slate-800 pb-2 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" /> Guild Live Chat
              </h4>

              <div className="flex-1 overflow-y-auto space-y-2.5 text-xs pr-1">
                {familyChat.map(msg => (
                  <div key={msg.id} className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-extrabold text-amber-300">{msg.sender}</span>
                      <span className="text-slate-500">{msg.time}</span>
                    </div>
                    <p className="text-slate-200">{msg.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendFamilyChat} className="pt-3 border-t border-slate-800 flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Chat with guild members..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
                <button type="submit" className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* GUILD MEMBERS LIST */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col h-[340px] shadow-xl">
              <h4 className="font-extrabold text-xs uppercase text-slate-200 border-b border-slate-800 pb-2 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" /> Guild Roster ({selectedFamily.members.length || 2} Members)
              </h4>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {selectedFamily.members.map(m => (
                  <div key={m.id} className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={m.userAvatar}
                        alt={m.userName}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-amber-400"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h5 className="font-extrabold text-slate-100">{m.userName}</h5>
                        <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-300 text-[9px] font-black rounded">
                          {m.role}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block font-bold">Contribution</span>
                      <span className="font-black text-amber-300 text-[11px]">🪙 {m.contributionCoins.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
