import React, { useState } from 'react';
import { useEconomy } from '../context/EconomyContext';
import { 
  ShieldCheck, 
  Users, 
  Radio, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Bot, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Search, 
  BarChart3, 
  SlidersHorizontal,
  Lock,
  Eye,
  Music,
  ShieldAlert,
  UserX
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const { wallet, transactions } = useEconomy();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'AGENCIES' | 'WALLETS' | 'AI_MODERATION'>('OVERVIEW');
  const [searchTerm, setSearchTerm] = useState('');

  // AI Moderation Rules Toggles
  const [modRules, setModRules] = useState({
    nudityVisuals: true,
    violenceWeapons: true,
    spamRateLimiting: true,
    hateSpeechVocab: true,
    copyrightMusic: true,
    fakeAccountDetection: true
  });

  const toggleRule = (key: keyof typeof modRules) => {
    setModRules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-black shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-2xl font-black bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-400 bg-clip-text text-transparent">
                Nexora Admin & Moderation Console
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Full-stack system administration: user controls, agency approvals, AI moderation logs, real-time ledgers & metrics.
              </p>
            </div>
          </div>
        </div>

        {/* ADMIN SECURITY TABS */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'OVERVIEW', label: '📊 Metrics' },
            { id: 'USERS', label: '👥 Users' },
            { id: 'AGENCIES', label: '🏢 Agencies' },
            { id: 'WALLETS', label: '💰 Ledgers' },
            { id: 'AI_MODERATION', label: '🤖 AI Safeguards' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ADMIN METRICS STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Active Users', value: '1,420,850', icon: Users, color: 'text-cyan-400' },
          { label: 'Concurrent Live Rooms', value: '12,450 Streams', icon: Radio, color: 'text-pink-400' },
          { label: 'Daily Coins Volume', value: '🪙 48,900,000', icon: DollarSign, color: 'text-amber-300' },
          { label: 'AI Moderation Health', value: '99.98% Clean', icon: Bot, color: 'text-emerald-400' }
        ].map((s, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">{s.label}</span>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* METRICS & OVERVIEW TAB */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* REAL-TIME LEDGER AUDIT LOGS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" /> Platform Transaction Ledger Stream
            </h3>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {transactions.map(tx => (
                <div key={tx.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-slate-200 block">{tx.description}</span>
                    <span className="text-[10px] text-slate-500">{tx.timestamp} • ID: {tx.id}</span>
                  </div>
                  <span className="font-black text-amber-300">
                    {tx.currency === 'COINS' ? '🪙' : tx.currency === 'POINTS' ? '🎮' : '💎'} {tx.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI MODERATION ALERTS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
              <Bot className="w-4 h-4 text-pink-400" /> AI Automated Room Safeguards & Reports
            </h3>

            <div className="space-y-3">
              {[
                { room: '9-Seat Party Room #412', issue: 'Language Filter Warning', status: 'AUTO-RESOLVED', time: '2m ago' },
                { room: 'PK Battle Arena #88', issue: 'Potential Copyright Audio Detection', status: 'FLAGGED', time: '12m ago' },
                { room: 'Gaming Stream #19', issue: 'Spam Message Rate Limit Exceeded', status: 'AUTO-MUTED', time: '45m ago' }
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-slate-100 block">{item.room}</span>
                    <span className="text-[10px] text-amber-300">{item.issue} • {item.time}</span>
                  </div>

                  <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black rounded-lg">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* USERS MANAGEMENT TAB */}
      {activeTab === 'USERS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-100">User Account & VIP Status Management</h3>
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search user by ID or handle..."
                className="bg-transparent text-xs text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase text-[10px]">
                <tr>
                  <th className="p-3">User Handle</th>
                  <th className="p-3">Wealth Level</th>
                  <th className="p-3">VIP Tier</th>
                  <th className="p-3">Balance (Coins)</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {[
                  { name: 'Alex Rivers', level: 'Level 32 (Master)', vip: 'GOLD VIP', coins: '24,500' },
                  { name: 'Aria Nova', level: 'Level 58 (Legend)', vip: 'DIAMOND VIP', coins: '148,000' },
                  { name: 'DJ Kairos', level: 'Level 51 (Royal)', vip: 'SUPER VIP', coins: '92,400' }
                ].map((u, i) => (
                  <tr key={i} className="hover:bg-slate-950/50">
                    <td className="p-3 font-extrabold text-slate-100">{u.name}</td>
                    <td className="p-3 text-amber-300 font-black">{u.level}</td>
                    <td className="p-3 text-purple-300 font-bold">{u.vip}</td>
                    <td className="p-3 text-emerald-400 font-black">🪙 {u.coins}</td>
                    <td className="p-3">
                      <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold">
                        Inspect Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI MODERATION SAFEGUARDS TAB */}
      {activeTab === 'AI_MODERATION' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div>
            <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-400" /> AI Automated Live Room Moderation Rules
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Real-time multi-modal computer vision and audio stream moderation powered by AI models.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'nudityVisuals', title: 'Nudity & Explicit Vision Filter', desc: 'Auto-blur or terminate video streams with adult or explicit content.', icon: Eye },
              { key: 'violenceWeapons', title: 'Violence & Weapon Scanner', desc: 'Detect dangerous items or physical violence in video frames.', icon: ShieldAlert },
              { key: 'spamRateLimiting', title: 'Spam & Message Rate Limit', desc: 'Auto-mute bots and spam loops sending over 5 msgs/sec.', icon: SlidersHorizontal },
              { key: 'hateSpeechVocab', title: 'Hate Speech & Toxic Vocabulary', desc: 'Filter harassing or toxic keywords in chat and live speech TTS.', icon: AlertTriangle },
              { key: 'copyrightMusic', title: 'Copyrighted Music Matcher', desc: 'Audio fingerprint scanner to avoid DMCA audio strikes.', icon: Music },
              { key: 'fakeAccountDetection', title: 'Bot Network & Fake Account AI', desc: 'Identify multi-account gift laundering and fake viewers.', icon: UserX }
            ].map((rule) => {
              const Icon = rule.icon;
              const isEnabled = modRules[rule.key as keyof typeof modRules];
              return (
                <div key={rule.key} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <span className="font-extrabold text-xs text-slate-200">{rule.title}</span>
                    </div>
                    <button
                      onClick={() => toggleRule(rule.key as keyof typeof modRules)}
                      className={`px-3 py-1 text-[10px] font-black rounded-full transition-all ${
                        isEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {isEnabled ? 'ENABLED ✓' : 'DISABLED'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">{rule.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
