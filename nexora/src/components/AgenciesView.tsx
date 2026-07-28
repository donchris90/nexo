import React, { useState } from 'react';
import { useEconomy } from '../context/EconomyContext';
import { Agency } from '../types';
import { 
  Building2, 
  ShieldCheck, 
  Users, 
  Award, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight, 
  UserPlus, 
  Calculator, 
  Crown,
  Briefcase,
  KeyRound,
  FileCheck2,
  Gift,
  Send,
  Download,
  Percent,
  Lock,
  Search
} from 'lucide-react';

interface RecruitedHost {
  id: string;
  name: string;
  avatar: string;
  level: number;
  monthlyGiftsCoins: number;
  streamHoursMonth: number;
  quotaStatus: 'MET' | 'IN_PROGRESS' | 'BEHIND';
  bonusEarnedCoins: number;
  contractEndDate: string;
  commissionCutPercent: number;
}

export const AgenciesView: React.FC = () => {
  const { wallet, addXp } = useEconomy();
  const [activeTab, setActiveTab] = useState<'EXPLORE' | 'MANAGER_PORTAL'>('EXPLORE');
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [appliedAgencyId, setAppliedAgencyId] = useState<string | null>('ag_1');
  const [calcGiftAmount, setCalcGiftAmount] = useState<number>(100000);

  // Agency Manager Login Credentials state
  const [isAgencyLoggedIn, setIsAgencyLoggedIn] = useState(false);
  const [agencyCode, setAgencyCode] = useState('STARLIGHT-2026');
  const [managerPin, setManagerPin] = useState('');
  const [inviteHostName, setInviteHostName] = useState('');
  const [inviteCommissionCut, setInviteCommissionCut] = useState(12);

  // Managed Hosts List for Manager Portal
  const [recruitedHosts, setRecruitedHosts] = useState<RecruitedHost[]>([
    {
      id: 'host_1',
      name: 'Aria Nova',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      level: 48,
      monthlyGiftsCoins: 1850000,
      streamHoursMonth: 124,
      quotaStatus: 'MET',
      bonusEarnedCoins: 222000,
      contractEndDate: '2026-12-31',
      commissionCutPercent: 12
    },
    {
      id: 'host_2',
      name: 'CyberKnight',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
      level: 36,
      monthlyGiftsCoins: 420000,
      streamHoursMonth: 68,
      quotaStatus: 'IN_PROGRESS',
      bonusEarnedCoins: 50400,
      contractEndDate: '2026-09-30',
      commissionCutPercent: 10
    },
    {
      id: 'host_3',
      name: 'Luna Spark',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
      level: 28,
      monthlyGiftsCoins: 95000,
      streamHoursMonth: 32,
      quotaStatus: 'BEHIND',
      bonusEarnedCoins: 0,
      contractEndDate: '2026-11-15',
      commissionCutPercent: 10
    }
  ]);

  // Top Agencies List
  const [agencies] = useState<Agency[]>([
    {
      id: 'ag_1',
      name: 'StarLight Talent Agency',
      logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      founderName: 'Aria Nova',
      totalCreators: 480,
      monthlyGiftsCoins: 24500000,
      commissionRatePercent: 12,
      minMonthlyQuotaCoins: 50000,
      verificationBadge: true,
      description: 'The #1 premier live streaming agency. We provide 24/7 host training, banner promotion, and monthly cash bonuses.'
    },
    {
      id: 'ag_2',
      name: 'Empire Creators Guild',
      logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      founderName: 'DJ Kairos',
      totalCreators: 320,
      monthlyGiftsCoins: 18200000,
      commissionRatePercent: 10,
      minMonthlyQuotaCoins: 30000,
      verificationBadge: true,
      description: 'Specializing in music streams, podcasts, and 9-seat party rooms. Direct manager support and instant payouts.'
    },
    {
      id: 'ag_3',
      name: 'Cyber Gaming & PK League',
      logo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
      founderName: 'CyberKnight',
      totalCreators: 210,
      monthlyGiftsCoins: 12900000,
      commissionRatePercent: 15,
      minMonthlyQuotaCoins: 20000,
      verificationBadge: false,
      description: 'The ultimate esports and PK battle guild. Tournament prize pools and weekly Ludo PvP bonuses for top players.'
    }
  ]);

  // Handle Host Invite
  const handleInviteHost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteHostName.trim()) return;
    const newHost: RecruitedHost = {
      id: `host_${Date.now()}`,
      name: inviteHostName,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      level: 1,
      monthlyGiftsCoins: 0,
      streamHoursMonth: 0,
      quotaStatus: 'IN_PROGRESS',
      bonusEarnedCoins: 0,
      contractEndDate: '2027-01-01',
      commissionCutPercent: inviteCommissionCut
    };
    setRecruitedHosts([newHost, ...recruitedHosts]);
    setInviteHostName('');
    alert(`Agency Recruitment Contract sent to ${inviteHostName}! Host will appear in active roster upon acceptance.`);
  };

  const handleApply = (agencyId: string) => {
    setAppliedAgencyId(agencyId);
    addXp(150);
    alert('Application submitted! The agency manager will review your stream stats.');
  };

  // Commission breakdown calculation
  const hostDiamonds = Math.floor(calcGiftAmount * 0.7);
  const agencyCommission = Math.floor(calcGiftAmount * 0.12);
  const platformFee = calcGiftAmount - hostDiamonds - agencyCommission;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 text-white font-black shadow-lg">
              <Building2 className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-2xl font-black bg-gradient-to-r from-amber-300 via-pink-300 to-purple-400 bg-clip-text text-transparent">
                Agencies & Talent Guilds Portal
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Join verified agencies or manage your agency talent roster, recruit hosts, set contracts, and collect commission payouts.
              </p>
            </div>
          </div>
        </div>

        {/* MODE SWITCHER TABS */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('EXPLORE')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'EXPLORE'
                ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Explore Agencies
          </button>
          <button
            onClick={() => setActiveTab('MANAGER_PORTAL')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
              activeTab === 'MANAGER_PORTAL'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-300" /> Agency Manager Portal
          </button>
        </div>
      </div>

      {/* VIEW 1: EXPLORE & JOIN AGENCIES */}
      {activeTab === 'EXPLORE' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {agencies.map((ag) => {
              const isApplied = appliedAgencyId === ag.id;
              return (
                <div key={ag.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
                  {ag.verificationBadge && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                      <Crown className="w-3 h-3 text-amber-400" /> OFFICIAL
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <img
                      src={ag.logo}
                      alt={ag.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-500"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-100">{ag.name}</h3>
                      <p className="text-[11px] text-slate-400">Founder: {ag.founderName}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{ag.description}</p>

                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Monthly Gifts</span>
                      <span className="font-extrabold text-amber-300">🪙 {(ag.monthlyGiftsCoins / 1000000).toFixed(1)}M</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Total Creators</span>
                      <span className="font-extrabold text-purple-300">👥 {ag.totalCreators} Hosts</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Agency Cut</span>
                      <span className="font-extrabold text-emerald-400">💰 {ag.commissionRatePercent}% Bonus</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Min. Quota</span>
                      <span className="font-extrabold text-cyan-300">🎯 {(ag.minMonthlyQuotaCoins / 1000).toFixed(0)}K</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedAgency(ag)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-200"
                    >
                      View Requirements →
                    </button>

                    <button
                      onClick={() => handleApply(ag.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                        isApplied
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-gradient-to-r from-amber-500 to-purple-600 text-white hover:opacity-90 shadow-md'
                      }`}
                    >
                      {isApplied ? 'Joined ✓' : 'Apply to Join'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm text-slate-100">Live Stream Gift Commission Split Calculator</h3>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Gift Amount (Coins)</span>
                  <span className="text-amber-300 font-black">🪙 {calcGiftAmount.toLocaleString()} Coins</span>
                </label>
                <input
                  type="range"
                  min="1000"
                  max="1000000"
                  step="5000"
                  value={calcGiftAmount}
                  onChange={(e) => setCalcGiftAmount(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Host Earns</span>
                  <span className="text-sm font-black text-cyan-300">💎 {hostDiamonds.toLocaleString()}</span>
                  <span className="text-[9px] text-slate-500 block">70% Value</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Agency Cut</span>
                  <span className="text-sm font-black text-emerald-400">🪙 {agencyCommission.toLocaleString()}</span>
                  <span className="text-[9px] text-slate-500 block">12% Bonus</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Platform Ops</span>
                  <span className="text-sm font-black text-purple-400">🪙 {platformFee.toLocaleString()}</span>
                  <span className="text-[9px] text-slate-500 block">18% Infrastructure</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-400" />
                <h3 className="font-extrabold text-sm text-slate-100">Why Join a Nexora Agency?</h3>
              </div>

              <div className="space-y-3 text-xs">
                {[
                  { title: '🚀 Priority Live Room Recommendations', desc: 'Agency hosts get placed in top "For You" & "PK Battles" feeds.' },
                  { title: '💵 Monthly Cash & Coin Bonuses', desc: 'Reach 50K Coins quota to receive +15% extra monthly Diamonds payout.' },
                  { title: '🛡️ Account Protection & Official Verification', desc: 'Direct 24/7 agency manager support and anti-ban security protection.' },
                  { title: '⚔️ Guild Wars & Tournament Entries', desc: 'Compete in monthly agency vs agency PK battles for $10,000 prize pools.' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-slate-200">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: AGENCY MANAGER PORTAL */}
      {activeTab === 'MANAGER_PORTAL' && (
        <div className="space-y-6">
          {!isAgencyLoggedIn ? (
            <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-purple-600/20 text-purple-400 rounded-2xl mx-auto flex items-center justify-center font-black">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-100">Agency Manager Login Portal</h3>
                <p className="text-xs text-slate-400">
                  Enter your official Agency Code & Security PIN to access host management & commission payouts.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Agency Identification Code</label>
                  <input
                    type="text"
                    value={agencyCode}
                    onChange={(e) => setAgencyCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Manager Secret Security PIN</label>
                  <input
                    type="password"
                    value={managerPin}
                    onChange={(e) => setManagerPin(e.target.value)}
                    placeholder="Enter PIN (e.g. 1234)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:border-purple-500"
                  />
                </div>
                <button
                  onClick={() => {
                    setIsAgencyLoggedIn(true);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-lg hover:opacity-90"
                >
                  Login to StarLight Agency Portal
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* MANAGER TOP SUMMARY METRICS */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Total Recruited Hosts</span>
                  <div className="text-xl font-black text-slate-100">{recruitedHosts.length} Active</div>
                  <span className="text-[10px] text-emerald-400 font-semibold">+2 Joined This Week</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Agency Monthly Gift Total</span>
                  <div className="text-xl font-black text-amber-300">🪙 2,365,000</div>
                  <span className="text-[10px] text-amber-400 font-semibold">Quota Target: 1.5M (Achieved!)</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Agency Commission Cut (12%)</span>
                  <div className="text-xl font-black text-emerald-400">🪙 283,800</div>
                  <span className="text-[10px] text-cyan-300 font-semibold">~$1,419.00 USD</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Manager Payout Status</span>
                  <button
                    onClick={() => alert('Agency Commission Payout processed directly to Agency Bank / Crypto Ledger!')}
                    className="w-full py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-xl font-black text-xs hover:bg-emerald-600/30"
                  >
                    Withdraw Commission
                  </button>
                </div>
              </div>

              {/* RECRUIT NEW HOST FORM */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-purple-400" /> Recruit & Send Agency Host Contract
                </h3>
                <form onSubmit={handleInviteHost} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="Host Username or Creator ID..."
                    value={inviteHostName}
                    onChange={(e) => setInviteHostName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:border-purple-500"
                  />
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl">
                    <span className="text-slate-400 font-bold">Host Cut:</span>
                    <input
                      type="number"
                      min="5"
                      max="20"
                      value={inviteCommissionCut}
                      onChange={(e) => setInviteCommissionCut(Number(e.target.value))}
                      className="w-16 bg-transparent text-amber-300 font-black focus:outline-none"
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                  <button
                    type="submit"
                    className="py-2.5 bg-gradient-to-r from-amber-500 to-purple-600 text-white font-black rounded-xl hover:opacity-90"
                  >
                    Send Official Contract
                  </button>
                </form>
              </div>

              {/* HOSTS MANAGEMENT TABLE */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl overflow-x-auto">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-400" /> Managed Agency Hosts Roster
                  </h3>
                  <button
                    onClick={() => alert('Exporting Host Performance CSV...')}
                    className="text-xs text-slate-400 hover:text-slate-200 font-bold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Report
                  </button>
                </div>

                <table className="w-full text-left text-xs text-slate-300 min-w-[650px]">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Host Name</th>
                      <th className="p-3">Monthly Gifts</th>
                      <th className="p-3">Hours Streamed</th>
                      <th className="p-3">Quota Status</th>
                      <th className="p-3">Contract End</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recruitedHosts.map((host) => (
                      <tr key={host.id} className="hover:bg-slate-950/40">
                        <td className="p-3 flex items-center gap-2.5">
                          <img src={host.avatar} alt={host.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-purple-500" />
                          <div>
                            <p className="font-bold text-slate-100">{host.name}</p>
                            <p className="text-[10px] text-amber-400">Lv.{host.level} • {host.commissionCutPercent}% Cut</p>
                          </div>
                        </td>
                        <td className="p-3 font-black text-amber-300">🪙 {host.monthlyGiftsCoins.toLocaleString()}</td>
                        <td className="p-3 font-mono">{host.streamHoursMonth} hrs</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            host.quotaStatus === 'MET' ? 'bg-emerald-500/20 text-emerald-300' :
                            host.quotaStatus === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'
                          }`}>
                            {host.quotaStatus}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-400">{host.contractEndDate}</td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => alert(`Issued +10,000 Coins Performance Bonus to ${host.name}!`)}
                            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-lg text-[10px]"
                          >
                            +Bonus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
