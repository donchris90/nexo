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
  Coins,
  Palette,
  DoorOpen,
  Lock,
  Check
} from 'lucide-react';

export const MissionsAndRewardsView: React.FC = () => {
  const { 
    wallet, 
    userLevel, 
    claimDailyBonus, 
    dailyBonusClaimed, 
    dailyMissions, 
    weeklyMissions,
    monthlyMissions,
    achievements,
    customizations,
    levelRewards,
    vipRooms,
    claimMission,
    claimAchievement,
    equipCustomization,
    claimLevelReward,
    treasureBox,
    openTreasureBox
  } = useEconomy();

  const [activeTab, setActiveTab] = useState<'MISSIONS' | 'ACHIEVEMENTS' | 'LEVEL_REWARDS' | 'CUSTOMIZATIONS' | 'VIP_SUITE'>('MISSIONS');
  const [missionFreq, setMissionFreq] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [boxCountdown, setBoxCountdown] = useState<number>(treasureBox.unlockTimeSeconds);

  useEffect(() => {
    if (boxCountdown <= 0 || treasureBox.isUnlocked) return;
    const timer = setInterval(() => {
      setBoxCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [boxCountdown, treasureBox.isUnlocked]);

  const xpPercent = Math.min(100, Math.floor((userLevel.currentXp / userLevel.xpForNextLevel) * 100));

  const activeMissionsList = missionFreq === 'DAILY' ? dailyMissions : missionFreq === 'WEEKLY' ? weeklyMissions : monthlyMissions;

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
              <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                <span>Wealth Level: <strong className="text-amber-300">Lv.{userLevel.wealthLevel} ({userLevel.wealthTierName})</strong></span>
                <span>Charm Level: <strong className="text-pink-300">Lv.{userLevel.charmLevel}</strong></span>
                <span>Creator Level: <strong className="text-purple-300">Lv.{userLevel.creatorLevel}</strong></span>
                <span>VIP Status: <strong className="text-pink-300">{userLevel.vipTier}</strong></span>
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

      {/* SYSTEM NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('MISSIONS')}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'MISSIONS'
              ? 'bg-amber-500 text-slate-950 shadow-lg'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4" /> Missions & Chests
        </button>

        <button
          onClick={() => setActiveTab('ACHIEVEMENTS')}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ACHIEVEMENTS'
              ? 'bg-amber-500 text-slate-950 shadow-lg'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Award className="w-4 h-4" /> Achievements & Titles
        </button>

        <button
          onClick={() => setActiveTab('LEVEL_REWARDS')}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'LEVEL_REWARDS'
              ? 'bg-amber-500 text-slate-950 shadow-lg'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" /> Level Milestones
        </button>

        <button
          onClick={() => setActiveTab('CUSTOMIZATIONS')}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'CUSTOMIZATIONS'
              ? 'bg-amber-500 text-slate-950 shadow-lg'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" /> Frames & Entrance Effects
        </button>

        <button
          onClick={() => setActiveTab('VIP_SUITE')}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'VIP_SUITE'
              ? 'bg-amber-500 text-slate-950 shadow-lg'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Crown className="w-4 h-4" /> VIP Perks & Exclusive Rooms
        </button>
      </div>

      {activeTab === 'MISSIONS' && (
        <div className="space-y-6">
          {/* 2 COLS: DAILY CHECK-IN STREAK & FORTUNE TREASURE CHEST */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DAILY CHECK-IN STREAK */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <h3 className="font-extrabold text-sm text-slate-100">7-Day Check-In Streak</h3>
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

          {/* MISSIONS FREQUENCY SWITCHER */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm text-slate-100">Live Missions & Quests</h3>
              </div>

              <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setMissionFreq('DAILY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    missionFreq === 'DAILY' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setMissionFreq('WEEKLY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    missionFreq === 'WEEKLY' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setMissionFreq('MONTHLY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    missionFreq === 'MONTHLY' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {activeMissionsList.map((m) => {
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
                      ) : m.completed || m.progress >= m.maxProgress ? (
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
      )}

      {activeTab === 'ACHIEVEMENTS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-lg text-slate-100">Achievements & Hall of Fame</h3>
              <p className="text-xs text-slate-400">Unlock rare titles and earn Diamonds for your streaming accomplishments.</p>
            </div>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black rounded-full">
              {achievements.filter(a => a.unlocked).length} / {achievements.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((ach) => (
              <div key={ach.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
                  {ach.icon}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-slate-100">{ach.title}</h4>
                    <span className="text-xs font-black text-cyan-300">+{ach.rewardDiamonds} 💎</span>
                  </div>

                  <p className="text-xs text-slate-400">{ach.description}</p>

                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.floor((ach.progress / ach.maxProgress) * 100))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] text-slate-500 font-bold">Progress: {ach.progress} / {ach.maxProgress}</span>
                    {ach.claimed ? (
                      <span className="text-xs font-black text-slate-500">Claimed ✓</span>
                    ) : ach.unlocked ? (
                      <button
                        onClick={() => claimAchievement(ach.id)}
                        className="px-3 py-1 bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow hover:opacity-90 animate-bounce"
                      >
                        Claim Reward
                      </button>
                    ) : (
                      <span className="text-xs text-slate-600 font-extrabold">In Progress</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'LEVEL_REWARDS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div>
            <h3 className="font-extrabold text-lg text-slate-100">Level Milestones & Rewards Track</h3>
            <p className="text-xs text-slate-400">Level up by streaming, sending gifts, and gaming to unlock coins and exclusive frames.</p>
          </div>

          <div className="space-y-4">
            {levelRewards.map((track) => {
              const isUnlocked = userLevel.currentLevel >= track.level;
              return (
                <div key={track.level} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  isUnlocked ? 'bg-slate-950 border-amber-500/40' : 'bg-slate-950/50 border-slate-800 opacity-60'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 font-black text-sm flex items-center justify-center border border-amber-500/30">
                      Lv.{track.level}
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-slate-100">{track.rewardTitle}</h4>
                      <p className="text-xs text-amber-300 font-bold flex items-center gap-2">
                        <span>+{track.rewardCoins.toLocaleString()} Coins</span>
                        <span>+{track.rewardDiamonds.toLocaleString()} Diamonds</span>
                        {track.unlockedFrameOrTitle && <span className="text-pink-400">• Unlocks {track.unlockedFrameOrTitle}</span>}
                      </p>
                    </div>
                  </div>

                  <div>
                    {track.claimed ? (
                      <span className="text-xs font-black text-slate-500">Claimed ✓</span>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => claimLevelReward(track.level, track.category)}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-pink-600 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:opacity-90"
                      >
                        Claim Reward
                      </button>
                    ) : (
                      <span className="text-xs font-extrabold text-slate-500 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Locked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'CUSTOMIZATIONS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div>
            <h3 className="font-extrabold text-lg text-slate-100">Avatar Frames, Entrance Effects & Titles</h3>
            <p className="text-xs text-slate-400">Equip your VIP decorations to stand out in party room seats and live chat logs.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {customizations.map((item) => (
              <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-2xl flex items-center justify-center border border-purple-500/30">
                    {item.previewIcon}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-100">{item.name}</h4>
                    <span className="text-[10px] text-purple-300 font-bold uppercase">{item.category}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400">{item.description}</p>

                <button
                  onClick={() => equipCustomization(item.id)}
                  disabled={!item.isUnlocked}
                  className={`w-full py-2 rounded-xl text-xs font-black transition-all ${
                    item.isEquipped
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : item.isUnlocked
                      ? 'bg-amber-500 text-slate-950 hover:opacity-90'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {item.isEquipped ? 'Equipped ✓' : item.isUnlocked ? 'Equip Item' : `Unlocks at VIP ${item.minVipLevel}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'VIP_SUITE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div>
            <h3 className="font-extrabold text-lg text-slate-100">Crown VIP Suite & Exclusive Rooms</h3>
            <p className="text-xs text-slate-400">VIP Members receive double coin drop multipliers, priority mic seat requests, and entry to VIP party lounges.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vipRooms.map((room) => (
              <div key={room.id} className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden group hover:border-amber-500/50 transition-all">
                <div className="h-36 relative">
                  <img src={room.coverImage} alt={room.roomName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full">
                    Min VIP {room.minVipLevel}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-100">{room.roomName}</h4>
                  <p className="text-xs text-slate-400">Host: <strong className="text-amber-300">{room.hostName}</strong> • {room.activeViewers} Viewers</p>
                  <p className="text-xs text-pink-300 font-bold">✨ Perk: {room.exclusivePerk}</p>

                  <button className="w-full py-2.5 mt-2 bg-gradient-to-r from-amber-500 to-pink-600 text-white font-black text-xs rounded-xl shadow hover:opacity-90 flex items-center justify-center gap-2">
                    <DoorOpen className="w-4 h-4" /> Enter VIP Lounge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
