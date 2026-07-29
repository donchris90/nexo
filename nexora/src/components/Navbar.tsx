import React, { useState } from 'react';
import { useEconomy } from '../context/EconomyContext';
import { 
  Tv, 
  Gamepad2, 
  Wallet, 
  Clapperboard, 
  ShoppingBag, 
  Music, 
  ShieldCheck, 
  PlusCircle, 
  Sparkles, 
  Crown,
  Gift,
  ArrowRightLeft,
  ChevronDown,
  Bell,
  Building2,
  Trophy,
  Users,
  Mail,
  Lock,
  X,
  Loader2
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenRechargeModal: () => void;
  onOpenExchangeModal: () => void;
  onOpenWithdrawalModal: () => void;
  onOpenNotifications: () => void;
  onOpenWealthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenRechargeModal,
  onOpenExchangeModal,
  onOpenWithdrawalModal,
  onOpenNotifications,
  onOpenWealthModal
}) => {
  const {
    wallet, dailyBonusClaimed, claimDailyBonus, vipTier, userLevel, notifications,
    authUser, authError, loginWithGoogle, loginWithFacebook, loginWithEmail, signUpWithEmail, logout
  } = useEconomy();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = authMode === 'signin'
      ? await loginWithEmail(email, password)
      : await signUpWithEmail(email, password, displayName);
    setIsSubmitting(false);
    if (success) {
      setShowLoginModal(false);
      setEmail('');
      setPassword('');
      setDisplayName('');
    }
  };

  const handleGoogleClick = async () => {
    await loginWithGoogle();
    setShowLoginModal(false);
  };

  const handleFacebookClick = async () => {
    await loginWithFacebook();
    setShowLoginModal(false);
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const tabs = [
    { id: 'streams', label: 'Live & Party Rooms', icon: Tv, badge: '9 SEATS' },
    { id: 'social', label: 'Feed & Reels', icon: Sparkles, badge: 'NEW' },
    { id: 'families', label: 'Families & Guilds', icon: Users, badge: 'RANK #1' },
    { id: 'agencies', label: 'Agencies', icon: Building2 },
    { id: 'missions', label: 'Missions & Rewards', icon: Trophy, badge: 'XP' },
    { id: 'games', label: 'Gaming Arena', icon: Gamepad2, badge: 'LUDO' },
    { id: 'wallet', label: 'Wallet & Ledger', icon: Wallet },
    { id: 'creator', label: 'Creator Studio', icon: Clapperboard },
    { id: 'admin', label: 'Admin Console', icon: ShieldCheck }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-xl">
      {/* TOP STATUS BAR & WALLET STATS */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
        {/* BRAND LOGO */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('streams')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 via-purple-600 to-amber-500 p-0.5 shadow-lg shadow-pink-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-xl text-pink-400">
              NEX
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-pink-400 via-purple-300 to-amber-300 bg-clip-text text-transparent">
                Nexora
              </span>
              <span className="px-2 py-0.5 text-[10px] font-black tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                V3.0 Platform
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Nexora Next-Gen Live Streaming & Virtual Economy Platform
            </p>
          </div>
        </div>

        {/* DUAL CURRENCY WALLET BAR */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          {/* COINS (PREMIUM) */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-lg border border-amber-500/30">
            <span className="text-lg">🪙</span>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-amber-400/80">Coins</div>
              <div className="text-xs font-black text-amber-300">{wallet.coins.toLocaleString()}</div>
            </div>
            <button
              onClick={onOpenRechargeModal}
              className="ml-1 p-1 hover:bg-amber-500/20 rounded-md text-amber-400 transition-colors"
              title="Recharge Coins"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>

          {/* POINTS (GAMING) */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-lg border border-purple-500/30">
            <span className="text-lg">🎯</span>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-purple-400/80">Points</div>
              <div className="text-xs font-black text-purple-300">{wallet.points.toLocaleString()}</div>
            </div>
            <button
              onClick={onOpenExchangeModal}
              className="ml-1 p-1 hover:bg-purple-500/20 rounded-md text-purple-400 transition-colors"
              title="Exchange Coins to Points"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* DIAMONDS (EARNINGS) */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-lg border border-cyan-500/30">
            <span className="text-lg">💎</span>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-cyan-400/80">Diamonds</div>
              <div className="text-xs font-black text-cyan-300">{wallet.diamonds.toLocaleString()}</div>
            </div>
            <button
              onClick={onOpenWithdrawalModal}
              className="ml-1 px-2 py-0.5 text-[10px] font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded border border-cyan-500/40"
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* RIGHT QUICK ACTIONS & VIP USER PROFILE */}
        <div className="flex items-center gap-2">
          {/* DAILY BONUS CLAIMER */}
          {!dailyBonusClaimed ? (
            <button
              onClick={claimDailyBonus}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 animate-pulse"
            >
              <Gift className="w-4 h-4" />
              Claim Daily Bonus
            </button>
          ) : (
            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Streak Claimed
            </span>
          )}

          {/* NOTIFICATION BADGE */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-400 hover:text-slate-100 bg-slate-800/60 rounded-xl hover:bg-slate-800 transition-colors"
            title="Notification Center"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-pink-500 rounded-full animate-ping" />
            )}
          </button>

          {/* USER PROFILE CARD OR LOGIN BUTTON */}
          {!authUser ? (
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 text-white px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-lg shadow-pink-500/20 transition-all"
            >
              <span>Sign In</span>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 transition-all"
              >
                <img
                  src={authUser.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
                  alt={authUser.displayName || "User"}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-amber-400/60"
                  referrerPolicy="no-referrer"
                />
                <div className="text-left hidden md:block">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1">
                    {authUser.displayName || "Alex Rivers"} {userLevel.countryFlag}
                    <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </div>
                  <div className="text-[10px] text-amber-400 font-semibold">
                    Lv.{userLevel.wealthLevel} {userLevel.wealthTierName} Tier
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 space-y-1">
                  <div className="pb-2 border-b border-slate-800 mb-2">
                    <p className="text-xs font-bold text-slate-200">{authUser.displayName || 'Alex Rivers'} {userLevel.countryFlag}</p>
                    <p className="text-[10px] text-slate-400">{authUser.email}</p>
                    <p className="text-[10px] text-amber-300 font-bold mt-0.5">
                      Level {userLevel.wealthLevel} • {userLevel.wealthTierName} Tier
                    </p>
                  </div>
                  <button
                    onClick={() => { onOpenWealthModal(); setShowProfileMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" /> Wealth & Charm Levels
                  </button>
                  <button
                    onClick={() => { setActiveTab('families'); setShowProfileMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                  >
                    <Users className="w-3.5 h-3.5 text-pink-400" /> My Family Guild
                  </button>
                  <button
                    onClick={() => { setActiveTab('wallet'); setShowProfileMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                  >
                    <Wallet className="w-3.5 h-3.5 text-amber-400" /> Wallet Ledger & History
                  </button>
                  <button
                    onClick={() => { logout(); setShowProfileMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-slate-800 rounded-lg flex items-center gap-2 font-bold"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM TAB NAVIGATION BAR */}
      <nav className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-1.5 py-0.2 text-[9px] font-black rounded-full uppercase ${
                  tab.badge === 'LIVE' ? 'bg-red-500 text-white animate-pulse' : 'bg-purple-500/20 text-purple-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* SIGN IN / SIGN UP MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => { setShowLoginModal(false); }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <h2 className="text-lg font-extrabold text-slate-100">
                {authMode === 'signin' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {authMode === 'signin' ? 'Sign in to continue to Nexora' : 'Join Nexora in seconds'}
              </p>
            </div>

            {/* GOOGLE SIGN-IN */}
            <button
              onClick={handleGoogleClick}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-900 px-4 py-2.5 rounded-xl font-bold text-sm transition-all mb-4"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* FACEBOOK SIGN-IN */}
            <button
              onClick={handleFacebookClick}
              className="w-full flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#166FE5] text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all mb-4"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z"/>
              </svg>
              Continue with Facebook
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">or</span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            {/* EMAIL/PASSWORD FORM */}
            <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
              {authMode === 'signup' && (
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>

              {authError && (
                <p className="text-xs text-rose-400 font-medium">{authError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl font-extrabold text-sm shadow-lg shadow-pink-500/20 transition-all"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p className="text-xs text-slate-400 text-center mt-4">
              {authMode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); }}
                className="text-pink-400 font-bold hover:underline"
              >
                {authMode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      )}
    </header>
  );
};
