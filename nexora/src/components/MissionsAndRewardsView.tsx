import React, { useState, useEffect } from 'react';
import { useEconomy } from '../context/EconomyContext';
import { 
  Trophy, 
  Award, 
  Calendar, 
  Gift, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  Clock, 
  Zap, 
  Crown, 
  Star, 
  ChevronRight,
  Shield,
  Coins
} from 'lucide-react';

export const MissionsAndRewardsView: React.FC = () => {
  const { 
    wallet, 
    userLevel, 
    claimDailyBonus, 
    dailyBonusClaimed, 
    dailyMissions, 
    claimMission,
    treasureBox,
    openTreasureBox
  } = useEconomy();

  const [boxCountdown, setBoxCountdown] = useState<number>(treasureBox.unlockTimeSeconds);

  useEffect(() => {
    if (boxCountdown <= 0 || treasureBox.isUnlocked) return;
    const timer = setInterval(() => {
      setBoxCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [boxCountdown, treasureBox.isUnlocked]);

  const xpPercent = Math.min(100, Math.floor((userLevel.currentXp / userLevel.xpForNextLevel) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* LEVEL HEADER CARD */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-pink-950 border border-purple-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-0.5 shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"
                  alt="Alex Rivers"
                  className="w-full h-full rounded-2xl object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full border border-slate-900 shadow">
                Lv.{userLevel.currentLevel}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-100">Alex Rivers</h2>
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black text-xs rounded-full flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-400" /> {userLevel.userTitle}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                <span>Wealth Level: <strong className="text-amber-300">Lv.{userLevel.wealthLevel}</strong></span>
                <span>Creator Level: <strong className="text-purple-300">Lv.{userLevel.creatorLevel}</strong></span>
                <span>VIP Status: <strong className="text-pink-300">{userLevel.vipTier} VIP</strong></span>
              </p>
            </div>
          </div>

          {/* XP PROGRESS */}
          <div className="w-full md:w-72 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="text-slate-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Level {userLevel.currentLevel} XP
              </span>
              <span className="text-amber-300">{userLevel.currentXp.toLocaleString()} / {userLevel.xpForNextLevel.toLocaleString()}</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-pink-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2 COLS: DAILY CHECK-IN STREAK & FORTUNE TREASURE CHEST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DAILY CHECK-IN STREAK */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-sm text-slate-100">7-Day Daily Check-In Streak</h3>
            </div>

            <button
              onClick={claimDailyBonus}
              disabled={dailyBonusClaimed}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                dailyBonusClaimed
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-pink-600 text-white hover:opacity-90 shadow-lg'
              }`}
            >
              {dailyBonusClaimed ? 'Checked In Today ✓' : 'Claim Daily Bonus'}
            </button>
          </div>

          {/* 7 DAYS CALENDAR GRID */}
          <div className="grid grid-cols-7 gap-1.5 pt-2">
            {[
              { day: 'Day 1', reward: '+100 🪙', active: true },
              { day: 'Day 2', reward: '+200 🪙', active: true },
              { day: 'Day 3', reward: '+300 🪙', active: true },
              { day: 'Day 4', reward: '+500 🪙', active: !dailyBonusClaimed },
              { day: 'Day 5', reward: '+800 🪙', active: false },
              { day: 'Day 6', reward: '+1200 🪙', active: false },
              { day: 'Day 7', reward: '👑 Dragon', active: false }
            ].map((d, i) => (
              <div
                key={i}
                className={`flex flex-col items-center p-2 rounded-2xl border text-center transition-all ${
                  d.active
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <span className="text-[9px] font-black uppercase">{d.day}</span>
                <span className="text-[10px] font-extrabold mt-1">{d.reward}</span>
              </div>
            ))}
          </div>
        </div>

        {/* IN-STREAM FORTUNE TREASURE CHEST */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-400" />
              <h3 className="font-extrabold text-sm text-slate-100">{treasureBox.title}</h3>
            </div>

            <span className="px-2.5 py-1 bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-black rounded-full">
              Timed Drop
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Stay in live party rooms to trigger lucky coin drops! Open the chest once the countdown hits zero.
          </p>

          <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-amber-500 flex items-center justify-center text-white text-2xl shadow-lg">
                🎁
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Chest Contents</span>
                <span className="text-xs font-black text-amber-300">+888 Coins & +2,000 Points</span>
              </div>
            </div>

            {treasureBox.isUnlocked ? (
              <span className="px-4 py-2 bg-emerald-600/20 text-emerald-300 text-xs font-black rounded-xl border border-emerald-500/30">
                Opened ✓
              </span>
            ) : boxCountdown > 0 ? (
              <div className="flex items-center gap-1 text-xs font-black text-pink-400">
                <Clock className="w-4 h-4 animate-spin" /> {boxCountdown}s
              </div>
            ) : (
              <button
                onClick={openTreasureBox}
                className="px-5 py-2 bg-gradient-to-r from-pink-500 to-amber-500 text-white font-black text-xs rounded-xl shadow-lg animate-bounce"
              >
                Open Chest! 🎉
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DAILY MISSIONS LIST */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm text-slate-100">Daily Creator & Viewer Missions</h3>
          </div>
          <span className="text-xs text-slate-400 font-bold">Resets in 14h 22m</span>
        </div>

        <div className="space-y-3">
          {dailyMissions.map((m) => {
            const progressPercent = Math.min(100, Math.floor((m.progress / m.maxProgress) * 100));
            return (
              <div key={m.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-xs text-slate-100">{m.title}</h4>
                    <span className="px-2 py-0.2 bg-amber-500/20 text-amber-300 text-[10px] font-black rounded">
                      +{m.rewardCoins} Coins & +{m.rewardXp} XP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{m.description}</p>

                  <div className="w-full max-w-md h-2 bg-slate-800 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div>
                  {m.claimed ? (
                    <span className="text-xs font-bold text-slate-500">Claimed ✓</span>
                  ) : m.completed ? (
                    <button
                      onClick={() => claimMission(m.id)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-lg hover:opacity-90 animate-pulse"
                    >
                      Claim Reward
                    </button>
                  ) : (
                    <span className="text-xs font-extrabold text-amber-400">
                      {m.progress} / {m.maxProgress}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
