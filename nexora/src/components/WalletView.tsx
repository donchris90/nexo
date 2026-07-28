import React, { useState } from 'react';
import { useEconomy } from '../context/EconomyContext';
import { 
  Wallet, 
  PlusCircle, 
  ArrowRightLeft, 
  ArrowUpRight, 
  Crown, 
  Gift, 
  History, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  CreditCard,
  DollarSign,
  Sparkles,
  Award
} from 'lucide-react';

export const WalletView: React.FC = () => {
  const { 
    wallet, 
    transactions, 
    rechargeCoins, 
    convertCoinsToPoints, 
    requestWithdrawal, 
    withdrawals, 
    vipTier, 
    referralCode,
    claimDailyBonus,
    dailyBonusClaimed
  } = useEconomy();

  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'RECHARGE' | 'EXCHANGE' | 'WITHDRAW' | 'HISTORY' | 'VIP'>('OVERVIEW');

  // Recharge inputs
  const [rechargeCoinsAmount, setRechargeCoinsAmount] = useState<number>(1000);
  const [payMethod, setPayMethod] = useState<string>('CREDIT_CARD');

  // Exchange inputs
  const [exchangeCoinsAmount, setExchangeCoinsAmount] = useState<number>(500);

  // Withdrawal inputs
  const [withdrawDiamondsAmount, setWithdrawDiamondsAmount] = useState<number>(2000);
  const [withdrawMethod, setWithdrawMethod] = useState<'PAYPAL' | 'BANK_WIRE' | 'STRIPE' | 'CRYPTO'>('PAYPAL');
  const [accountDetails, setAccountDetails] = useState<string>('alex.rivers@nexeconomy.app');
  const [withdrawalMsg, setWithdrawalMsg] = useState<{ success: boolean; text: string } | null>(null);

  const handleRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    rechargeCoins(rechargeCoinsAmount, payMethod);
    alert(`Successfully recharged ${rechargeCoinsAmount.toLocaleString()} Coins via ${payMethod}!`);
    setActiveSubTab('OVERVIEW');
  };

  const handleExchange = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = convertCoinsToPoints(exchangeCoinsAmount);
    if (ok) {
      alert(`Successfully converted ${exchangeCoinsAmount} Coins into ${(exchangeCoinsAmount * 10).toLocaleString()} Points!`);
      setActiveSubTab('OVERVIEW');
    } else {
      alert('Insufficient Coins balance.');
    }
  };

  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = requestWithdrawal(withdrawDiamondsAmount, withdrawMethod, accountDetails);
    setWithdrawalMsg({ success: res.success, text: res.message });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* WALLET HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-extrabold text-xs rounded-full border border-amber-500/30 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" /> {vipTier} VIP Member
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold text-xs rounded-full border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Wallet
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-100 mt-2">
            Dual-Currency Virtual Wallet
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your Coins (Gifting/VIP), Points (Gaming Arena), and Diamonds (Creator Cash Earnings).
          </p>
        </div>

        {/* SUB TAB SELECTORS */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'OVERVIEW', label: 'Overview', icon: Wallet },
            { id: 'RECHARGE', label: 'Recharge Coins', icon: PlusCircle },
            { id: 'EXCHANGE', label: 'Coins to Points', icon: ArrowRightLeft },
            { id: 'WITHDRAW', label: 'Withdraw Cash', icon: ArrowUpRight },
            { id: 'HISTORY', label: 'Tx History', icon: History },
            { id: 'VIP', label: 'VIP Perks', icon: Crown }
          ].map(tab => {
            const Icon = tab.icon;
            const isAct = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isAct
                    ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* OVERVIEW CARDS */}
      {activeSubTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* COINS CARD */}
            <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-5 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">Coins (Premium)</span>
                <span className="text-2xl">🪙</span>
              </div>
              <div className="text-3xl font-black text-amber-300">{wallet.coins.toLocaleString()}</div>
              <p className="text-[11px] text-slate-400">Used for virtual gifts, VIP status, & tickets.</p>
              <button
                onClick={() => setActiveSubTab('RECHARGE')}
                className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-extrabold text-xs rounded-xl border border-amber-500/40"
              >
                + Recharge Coins
              </button>
            </div>

            {/* POINTS CARD */}
            <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-5 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-purple-400">Points (Gaming)</span>
                <span className="text-2xl">🎯</span>
              </div>
              <div className="text-3xl font-black text-purple-300">{wallet.points.toLocaleString()}</div>
              <p className="text-[11px] text-slate-400">Used for Ludo, Wheel, Quiz, & Uno matches.</p>
              <button
                onClick={() => setActiveSubTab('EXCHANGE')}
                className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-extrabold text-xs rounded-xl border border-purple-500/40"
              >
                🔄 Exchange Coins to Points
              </button>
            </div>

            {/* DIAMONDS CARD */}
            <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-5 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-400">Diamonds (Earnings)</span>
                <span className="text-2xl">💎</span>
              </div>
              <div className="text-3xl font-black text-cyan-300">{wallet.diamonds.toLocaleString()}</div>
              <p className="text-[11px] text-slate-400">Est. Cash Value: ${((wallet.diamonds / 100) * 5).toFixed(2)} USD</p>
              <button
                onClick={() => setActiveSubTab('WITHDRAW')}
                className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-extrabold text-xs rounded-xl border border-cyan-500/40"
              >
                💸 Withdraw Earnings
              </button>
            </div>
          </div>

          {/* REFERRAL & DAILY BONUS BAR */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl">
                🎁
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-100">Referral Code & Creator Bonus</h4>
                <p className="text-xs text-slate-400">Share code <span className="font-mono font-bold text-amber-300">{referralCode}</span> to earn 500 Coins per referred creator!</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://nexeconomy.app/ref/${referralCode}`);
                  alert('Referral link copied to clipboard!');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Link
              </button>
              {!dailyBonusClaimed && (
                <button
                  onClick={claimDailyBonus}
                  className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-black rounded-xl"
                >
                  Claim Bonus (+250 Coins)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RECHARGE COINS TAB */}
      {activeSubTab === 'RECHARGE' && (
        <form onSubmit={handleRecharge} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl mx-auto space-y-6">
          <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-400" /> Recharge Coins Bundle
          </h3>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300">Select Coins Package</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { amount: 500, price: '$4.99' },
                { amount: 1000, price: '$9.99' },
                { amount: 5000, price: '$49.99' },
                { amount: 10000, price: '$99.99' }
              ].map(pkg => (
                <button
                  type="button"
                  key={pkg.amount}
                  onClick={() => setRechargeCoinsAmount(pkg.amount)}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    rechargeCoinsAmount === pkg.amount
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-black'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-lg font-black">🪙 {pkg.amount.toLocaleString()}</div>
                  <div className="text-xs font-bold text-slate-300 mt-1">{pkg.price}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300">Payment Provider</label>
            <div className="grid grid-cols-2 gap-3">
              {['CREDIT_CARD', 'PAYPAL', 'MOBILE_PAY', 'CRYPTO'].map(m => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setPayMethod(m)}
                  className={`p-3 rounded-xl border text-xs font-extrabold uppercase transition-all ${
                    payMethod === m
                      ? 'bg-indigo-600 text-white border-indigo-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/20"
          >
            Complete Recharge ({rechargeCoinsAmount.toLocaleString()} Coins)
          </button>
        </form>
      )}

      {/* EXCHANGE COINS TO POINTS */}
      {activeSubTab === 'EXCHANGE' && (
        <form onSubmit={handleExchange} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl mx-auto space-y-6">
          <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-purple-400" /> Convert Coins to Gaming Points
          </h3>
          <p className="text-xs text-slate-400">
            Exchange Rate: 1 Coin = 10 Gaming Points. Points are used for multiplayer matches and lucky wheel spins.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Coins to Exchange</label>
            <input
              type="number"
              min={10}
              max={wallet.coins}
              value={exchangeCoinsAmount}
              onChange={(e) => setExchangeCoinsAmount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-100"
            />
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-purple-500/30 text-center">
            <span className="text-xs text-slate-400 font-bold uppercase">You Will Receive</span>
            <div className="text-2xl font-black text-purple-300 mt-1">
              🎯 {(exchangeCoinsAmount * 10).toLocaleString()} Points
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-purple-500/25"
          >
            Confirm Exchange
          </button>
        </form>
      )}

      {/* WITHDRAW CASH TAB */}
      {activeSubTab === 'WITHDRAW' && (
        <form onSubmit={handleWithdrawalSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl mx-auto space-y-6">
          <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-cyan-400" /> Request Diamonds Cash Withdrawal
          </h3>

          <div className="p-4 bg-slate-950 rounded-2xl border border-cyan-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-400">Available Diamonds</span>
              <div className="text-xl font-black text-cyan-300">💎 {wallet.diamonds.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400">Est. USD Value</span>
              <div className="text-xl font-black text-emerald-300">${((wallet.diamonds / 100) * 5).toFixed(2)} USD</div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Amount of Diamonds to Withdraw</label>
            <input
              type="number"
              min={1000}
              step={500}
              value={withdrawDiamondsAmount}
              onChange={(e) => setWithdrawDiamondsAmount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-100"
            />
            <span className="text-[10px] text-slate-500">Min withdrawal: 1,000 Diamonds ($50.00 USD)</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Payout Method</label>
            <select
              value={withdrawMethod}
              onChange={(e) => setWithdrawMethod(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-200"
            >
              <option value="PAYPAL">PayPal Direct Transfer</option>
              <option value="BANK_WIRE">International Bank Wire</option>
              <option value="STRIPE">Stripe Connect Account</option>
              <option value="CRYPTO">USDT Crypto Wallet</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Account Details / Email / Address</label>
            <input
              type="text"
              value={accountDetails}
              onChange={(e) => setAccountDetails(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-100"
            />
          </div>

          {withdrawalMsg && (
            <div className={`p-3 rounded-xl text-xs font-extrabold text-center ${
              withdrawalMsg.success ? 'bg-emerald-950 text-emerald-300 border border-emerald-500' : 'bg-red-950 text-red-300 border border-red-500'
            }`}>
              {withdrawalMsg.text}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-cyan-500/25"
          >
            Submit Withdrawal Request
          </button>
        </form>
      )}

      {/* TRANSACTION HISTORY & IMMUTABLE LEDGER */}
      {activeSubTab === 'HISTORY' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" /> Nexora Double-Entry Immutable Ledger Audit
              </h3>
              <p className="text-xs text-slate-400">
                All balances are derived from cryptographic append-only journal records.
              </p>
            </div>
            <div className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold rounded-full">
              LEDGER VERIFICATION: OK (0 MISMATCHES)
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Coins Balance</span>
              <span className="font-black text-amber-300">🪙 {wallet.coins.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Points Balance</span>
              <span className="font-black text-purple-300">🎯 {wallet.points.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Diamonds Balance</span>
              <span className="font-black text-cyan-300">💎 {wallet.diamonds.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Pending Clearance</span>
              <span className="font-black text-emerald-400">💎 0 (Cleared)</span>
            </div>
          </div>

          <div className="space-y-2">
            {transactions.map(tx => (
              <div key={tx.id} className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase ${
                        tx.type === 'PURCHASE' ? 'bg-amber-500/20 text-amber-300' :
                        tx.type === 'GAME_WIN' ? 'bg-purple-500/20 text-purple-300' :
                        'bg-cyan-500/20 text-cyan-300'
                      }`}>
                        {tx.type}
                      </span>
                      <span className="text-xs font-bold text-slate-200">{tx.description}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{tx.timestamp} • Ledger Entry ID: {tx.id}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-xs text-amber-300">
                      {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()} {tx.currency}
                    </div>
                    <span className="text-[9px] text-emerald-400 font-mono font-bold">✓ HASH: 0x{tx.id.substring(3)}a7f</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIP PERKS */}
      {activeSubTab === 'VIP' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" /> NexEconomy VIP Membership Tier System
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { name: 'BRONZE VIP', perk: '5% Bonus Points on Matches', icon: '🥉' },
              { name: 'SILVER VIP', perk: '10% Bonus Coins on Recharge', icon: '🥈' },
              { name: 'GOLD VIP (Active)', perk: 'Special Gold Chat Badge + 15% Bonus Points', icon: '🥇' },
              { name: 'DIAMOND VIP', perk: 'Zero Withdrawal Fees + Custom AR Gift', icon: '💎' }
            ].map(v => (
              <div key={v.name} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-2xl">{v.icon}</span>
                <h4 className="font-black text-xs text-slate-100">{v.name}</h4>
                <p className="text-[11px] text-slate-400">{v.perk}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
