import React, { useState, useEffect } from 'react';
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
  UserX,
  Flag,
  ArrowUpRight,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import { moderationService, ReportItem, ModeratorLog } from '../services/ModerationService';
import { paymentGatewayService, WithdrawalRequestDoc, RefundRequestDoc } from '../services/PaymentGatewayService';

export const AdminDashboardView: React.FC = () => {
  const { wallet, transactions } = useEconomy();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'REPORTS' | 'WITHDRAWALS' | 'REFUNDS' | 'AI_MODERATION' | 'MOD_LOGS'>('OVERVIEW');
  const [searchTerm, setSearchTerm] = useState('');

  // Data states
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequestDoc[]>([]);
  const [refunds, setRefunds] = useState<RefundRequestDoc[]>([]);
  const [modLogs, setModLogs] = useState<ModeratorLog[]>([]);

  // AI Moderation Rules Toggles
  const [modRules, setModRules] = useState({
    nudityVisuals: true,
    violenceWeapons: true,
    spamRateLimiting: true,
    hateSpeechVocab: true,
    copyrightMusic: true,
    fakeAccountDetection: true
  });

  const fetchData = async () => {
    const rList = await moderationService.getReports('PENDING');
    setReports(rList);

    const wList = await paymentGatewayService.getWithdrawalRequests();
    setWithdrawals(wList);

    const refList = await paymentGatewayService.getRefundRequests();
    setRefunds(refList);

    const logList = await moderationService.getModeratorLogs();
    setModLogs(logList);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleRule = (key: keyof typeof modRules) => {
    setModRules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleResolveReport = async (reportId: string, action: 'DISMISS' | 'BAN_USER' | 'TERMINATE_STREAM', targetId?: string, streamId?: string) => {
    await moderationService.resolveReport(reportId, action, targetId);
    if (action === 'TERMINATE_STREAM' && streamId) {
      await moderationService.terminateStream(streamId, 'Stream terminated by admin via report action', 'admin_1');
    }
    fetchData();
  };

  const handleApproveWithdrawal = async (wDoc: WithdrawalRequestDoc) => {
    if (!wDoc.id) return;
    const res = await paymentGatewayService.approveAndProcessWithdrawal(wDoc.id, wDoc, 'admin_1');
    alert(res.message);
    fetchData();
  };

  const handleRejectWithdrawal = async (requestId: string) => {
    await paymentGatewayService.rejectWithdrawal(requestId, 'Rejected by compliance admin');
    alert('Withdrawal request rejected.');
    fetchData();
  };

  const handleApproveRefund = async (rDoc: RefundRequestDoc) => {
    await paymentGatewayService.approveRefund(rDoc, 'admin_1');
    alert('Refund approved and coins credited!');
    fetchData();
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
                Full-stack system administration: user reports, withdrawals, refund requests, AI moderation logs & ledger audits.
              </p>
            </div>
          </div>
        </div>

        {/* ADMIN SECURITY TABS */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'OVERVIEW', label: '📊 Metrics' },
            { id: 'REPORTS', label: `🚩 Reports (${reports.length})` },
            { id: 'WITHDRAWALS', label: `💸 Withdrawals (${withdrawals.filter(w => w.status === 'PENDING').length})` },
            { id: 'REFUNDS', label: `🔄 Refunds (${refunds.filter(r => r.status === 'PENDING').length})` },
            { id: 'AI_MODERATION', label: '🤖 AI Safeguards' },
            { id: 'MOD_LOGS', label: '📜 Audit Logs' }
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

      {/* METRICS STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Active Users', value: '1,420,850', icon: Users, color: 'text-cyan-400' },
          { label: 'Concurrent Live Rooms', value: '12,450 Streams', icon: Radio, color: 'text-pink-400' },
          { label: 'Pending Withdrawals', value: `$${withdrawals.filter(w => w.status === 'PENDING').reduce((acc, w) => acc + w.amountUsd, 0).toLocaleString()} USD`, icon: ArrowUpRight, color: 'text-amber-300' },
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

      {/* OVERVIEW TAB */}
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

          {/* RECENT REPORTS OVERVIEW */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
              <Flag className="w-4 h-4 text-red-400" /> Live Stream Abuse & Violation Queue
            </h3>

            {reports.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No pending user reports.</p>
            ) : (
              <div className="space-y-3">
                {reports.slice(0, 4).map((r) => (
                  <div key={r.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-slate-100 block">{r.category}: {r.targetName}</span>
                      <span className="text-[10px] text-slate-400">{r.reason}</span>
                    </div>

                    <button
                      onClick={() => setActiveTab('REPORTS')}
                      className="px-3 py-1 bg-red-600/20 text-red-300 border border-red-500/30 text-[10px] font-black rounded-lg"
                    >
                      Review Report
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* USER REPORTS TAB */}
      {activeTab === 'REPORTS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-xs">
          <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
            <Flag className="w-4 h-4 text-red-400" /> Pending User Reports & Violations
          </h3>

          {reports.length === 0 ? (
            <p className="text-slate-500 italic">No pending reports.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div key={rep.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-300 font-extrabold text-[10px] rounded uppercase">
                        {rep.category}
                      </span>
                      <span className="font-black text-slate-100">Target: {rep.targetName} ({rep.targetId})</span>
                    </div>
                    <p className="text-slate-300">{rep.reason}</p>
                    <span className="text-[10px] text-slate-500 font-mono">Reported by: {rep.reporterName} • {rep.createdAt}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResolveReport(rep.id!, 'BAN_USER', rep.targetId)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-[10px]"
                    >
                      Ban Account
                    </button>
                    {rep.streamId && (
                      <button
                        onClick={() => handleResolveReport(rep.id!, 'TERMINATE_STREAM', rep.targetId, rep.streamId)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl text-[10px]"
                      >
                        Terminate Stream
                      </button>
                    )}
                    <button
                      onClick={() => handleResolveReport(rep.id!, 'DISMISS')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-[10px]"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WITHDRAWAL APPROVALS TAB */}
      {activeTab === 'WITHDRAWALS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-xs">
          <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-amber-400" /> Pending Creator Cash Withdrawals
          </h3>

          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div key={w.id || w.requestDate} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-100">{w.userName || w.userId}</span>
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px] rounded">
                      {w.method}
                    </span>
                    {w.fraudFlag && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold text-[10px] rounded">
                        ⚠️ HIGH VOLUME
                      </span>
                    )}
                  </div>
                  <p className="font-extrabold text-emerald-400">💎 {w.amountDiamonds.toLocaleString()} Diamonds (${w.amountUsd.toFixed(2)} USD)</p>
                  <p className="text-slate-400 font-mono text-[11px]">Payout Account: {w.accountDetails}</p>
                </div>

                {w.status === 'PENDING' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveWithdrawal(w)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-[10px]"
                    >
                      Approve & Discard Payout
                    </button>
                    <button
                      onClick={() => handleRejectWithdrawal(w.id!)}
                      className="px-3 py-2 bg-red-600/30 hover:bg-red-600 text-red-200 font-bold rounded-xl text-[10px]"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="px-3 py-1 bg-slate-800 text-slate-400 font-bold uppercase rounded-lg text-[10px]">
                    {w.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REFUND REQUESTS TAB */}
      {activeTab === 'REFUNDS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-xs">
          <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-purple-400" /> User Purchase Refund Requests
          </h3>

          <div className="space-y-3">
            {refunds.map((refDoc) => (
              <div key={refDoc.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-black text-slate-100 block">User: {refDoc.userId}</span>
                  <p className="text-slate-300">Reason: {refDoc.reason}</p>
                  <span className="text-[10px] text-amber-300 font-bold">Coins to Refund: 🪙 {refDoc.amountCoins.toLocaleString()}</span>
                </div>

                {refDoc.status === 'PENDING' ? (
                  <button
                    onClick={() => handleApproveRefund(refDoc)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-[10px]"
                  >
                    Approve & Issue Refund
                  </button>
                ) : (
                  <span className="px-3 py-1 bg-slate-800 text-emerald-400 font-bold uppercase rounded-lg text-[10px]">
                    {refDoc.status}
                  </span>
                )}
              </div>
            ))}
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
                <div key={rule.key} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <span className="font-extrabold text-slate-200">{rule.title}</span>
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

      {/* AUDIT LOGS TAB */}
      {activeTab === 'MOD_LOGS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-xs">
          <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Moderator & Host Action Audit Trail
          </h3>

          <div className="space-y-2">
            {modLogs.map((log) => (
              <div key={log.id || log.timestamp} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between font-mono text-[11px]">
                <div>
                  <span className="text-cyan-300 font-bold">{log.action}</span>
                  <span className="text-slate-400"> by {log.moderatorId} in Room {log.streamId}</span>
                  {log.details && <p className="text-slate-500 font-sans mt-0.5">{log.details}</p>}
                </div>
                <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
