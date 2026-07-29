import React, { useState } from 'react';
import { useEconomy } from '../context/EconomyContext';
import { useAuth } from '../hooks/useAuth';
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
  Ticket,
  Video,
  Music,
  Image as ImageIcon,
  MessageSquare,
  Radio,
  Swords,
  Star,
  Eye,
  Calendar,
  Clock,
  CheckCircle2,
  ShieldAlert,
  UserPlus,
  UserCheck,
  MoreHorizontal,
  Bell,
  Play,
  ThumbsUp,
  MessageCircle,
  EyeOff,
  Shield,
  Zap,
  Globe,
  Camera,
  Layers,
  Grid,
  Sparkle,
  Sliders
} from 'lucide-react';

interface MeViewProps {
  setActiveTab: (tab: string) => void;
  onOpenRechargeModal: () => void;
  onOpenExchangeModal: () => void;
  onOpenWithdrawalModal: () => void;
  onOpenWealthModal: () => void;
  onJoinStream?: (streamId: string) => void;
}

// Sample Creator Data for switching between Self and Featured Creators
const SAMPLE_CREATORS = [
  {
    id: 'self',
    name: 'Alex Rivers',
    nexoraId: 'NEX-889021',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    isVerified: true,
    vipTier: 'DIAMOND VIP',
    countryFlag: '🇺🇸',
    countryName: 'United States',
    wealthLevel: 42,
    charmLevel: 58,
    isLive: true,
    liveStreamId: 'stream_alex_1',
    liveTitle: '🔥 9-Seat Celebrity Karaoke Party & Gifting War!',
    liveViewers: 3890,
    liveCategory: 'PARTY_ROOM',
    followersCount: 124500,
    followingCount: 342,
    friendsCount: 128,
    visitorsCount: 45200,
    likesCount: 892000,
    totalGiftsCount: 15420,
    totalDiamondsEarned: 4850000,
    pkWins: 142,
    totalStreams: 320,
    videosCount: 48,
    photosCount: 96,
    musicCount: 12,
    familyId: 'fam_starlight',
    familyName: 'StarLight Guild',
    familyBadge: '⭐ STARLIGHT',
    familyRole: 'Leader',
    agencyName: 'Apex Creators Agency',
    agencyLevel: 'Gold Agency',
    bio: '✨ Official Nexora Host & Music Producer | Join my 9-Seat Party Room nightly! 🎤 Sending Dragons to top gifters 🔥',
    isSelf: true
  },
  {
    id: 'sophia',
    name: 'Sophia Vance',
    nexoraId: 'NEX-554192',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    isVerified: true,
    vipTier: 'SUPER VIP',
    countryFlag: '🇬🇧',
    countryName: 'United Kingdom',
    wealthLevel: 65,
    charmLevel: 80,
    isLive: true,
    liveStreamId: 'stream_sophia_2',
    liveTitle: '⚔️ PK BATTLE CHAMPIONSHIP: Red vs Blue Gifting War!',
    liveViewers: 5420,
    liveCategory: 'PK_BATTLE',
    followersCount: 340000,
    followingCount: 180,
    friendsCount: 95,
    visitorsCount: 120000,
    likesCount: 2400000,
    totalGiftsCount: 42000,
    totalDiamondsEarned: 12500000,
    pkWins: 289,
    totalStreams: 580,
    videosCount: 110,
    photosCount: 240,
    musicCount: 25,
    familyId: 'fam_phoenix',
    familyName: 'Phoenix Dynasty',
    familyBadge: '🔥 PHOENIX',
    familyRole: 'Vice Leader',
    agencyName: 'Global Royalty Agency',
    agencyLevel: 'Platinum Agency',
    bio: '👑 #1 PK Battle Queen in Europe | Singing & acoustic vibes | Daily streams at 20:00 GMT 💎',
    isSelf: false
  },
  {
    id: 'elena',
    name: 'Elena Vance',
    nexoraId: 'NEX-331044',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    isVerified: true,
    vipTier: 'GOLD VIP',
    countryFlag: '🇯🇵',
    countryName: 'Japan',
    wealthLevel: 30,
    charmLevel: 45,
    isLive: false,
    liveStreamId: '',
    liveTitle: '',
    liveViewers: 0,
    liveCategory: '',
    followersCount: 89000,
    followingCount: 210,
    friendsCount: 64,
    visitorsCount: 28000,
    likesCount: 410000,
    totalGiftsCount: 8900,
    totalDiamondsEarned: 2100000,
    pkWins: 78,
    totalStreams: 190,
    videosCount: 34,
    photosCount: 72,
    musicCount: 8,
    familyId: 'fam_sakura',
    familyName: 'Sakura Kings',
    familyBadge: '🌸 SAKURA',
    familyRole: 'Elite',
    agencyName: 'Tokyo Talent Management',
    agencyLevel: 'Silver Agency',
    bio: '🌸 J-Pop vocal coach & VR gamer! Stream every Mon/Wed/Fri 🇯🇵 ✨',
    isSelf: false
  }
];

export const MeView: React.FC<MeViewProps> = ({
  setActiveTab,
  onOpenRechargeModal,
  onOpenExchangeModal,
  onOpenWithdrawalModal,
  onOpenWealthModal,
  onJoinStream
}) => {
  const { wallet, userLevel, vipTier } = useEconomy();
  const { user } = useAuth();

  // Selected Creator Profile State (defaults to self 'self')
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>('self');
  const [activeProfileTab, setActiveProfileTab] = useState<
    'OVERVIEW' | 'LIVE' | 'VIDEOS' | 'PHOTOS' | 'MUSIC' | 'POSTS' | 'ACHIEVEMENTS' | 'PK' | 'GIFTS' | 'FAMILY' | 'VISITORS' | 'ABOUT'
  >('OVERVIEW');

  // Interactive local states for Creator Profile actions
  const [isFollowing, setIsFollowing] = useState<Record<string, boolean>>({
    sophia: true,
    elena: false
  });
  const [followedCount, setFollowedCount] = useState<number>(userLevel.followersCount);
  const [customCover, setCustomCover] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showGiftModal, setShowGiftModal] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [reminders, setReminders] = useState<Record<string, boolean>>({});
  const [isAnonymousVisitor, setIsAnonymousVisitor] = useState<boolean>(false);
  const [hideFollowersList, setHideFollowersList] = useState<boolean>(false);
  const [hideVisitorHistory, setHideVisitorHistory] = useState<boolean>(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  // Get active creator details
  const currentCreatorData = SAMPLE_CREATORS.find(c => c.id === selectedCreatorId) || SAMPLE_CREATORS[0];
  const isViewingSelf = selectedCreatorId === 'self';

  // Toggle follow
  const handleToggleFollow = (creatorId: string) => {
    setIsFollowing(prev => {
      const nextState = !prev[creatorId];
      return { ...prev, [creatorId]: nextState };
    });
  };

  // Live replays data
  const mockReplays = [
    { id: 'rep1', title: '🔥 500K Dragon Gifting War Final', duration: '1h 42m', views: '28.4K', likes: '12.8K', date: 'Yesterday' },
    { id: 'rep2', title: '🎙️ 9-Seat Celebrity Karaoke Special', duration: '2h 15m', views: '45.1K', likes: '19.4K', date: '3 days ago' },
    { id: 'rep3', title: '⚔️ PK Championship vs Sophia Vance', duration: '58m', views: '62.0K', likes: '31.2K', date: '1 week ago' }
  ];

  // Scheduled streams
  const mockScheduledStreams = [
    { id: 'sch1', title: '💎 Grand Weekend 1,000,000 Coin Treasure Drops', time: 'Tomorrow at 20:00 UTC', category: 'PARTY_ROOM' },
    { id: 'sch2', title: '⚔️ International PK Finals: US vs UK', time: 'Friday at 21:00 UTC', category: 'PK_BATTLE' }
  ];

  // Gift Wall items
  const mockGiftWall = [
    { id: 'g1', name: 'Golden Dragon 🐉', count: 142, icon: '🐲', rarity: 'LEGENDARY' },
    { id: 'g2', name: 'Supercar Phantom 🏎️', count: 89, icon: '🏎️', rarity: 'MYTHIC' },
    { id: 'g3', name: 'Royal Castle 🏰', count: 45, icon: '🏰', rarity: 'EPIC' },
    { id: 'g4', name: 'Diamond Crown 👑', count: 310, icon: '👑', rarity: 'RARE' },
    { id: 'g5', name: 'Love Rocket 🚀', count: 620, icon: '🚀', rarity: 'RARE' },
    { id: 'g6', name: 'Magic Ring 💍', count: 1250, icon: '💍', rarity: 'UNCOMMON' }
  ];

  // Top Supporters
  const mockSupporters = [
    { rank: 1, name: 'Lord Sterling 👑', amount: '2.4M Coins', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80' },
    { rank: 2, name: 'Lady Victoria ✨', amount: '1.8M Coins', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80' },
    { rank: 3, name: 'Captain Drake 🔥', amount: '950K Coins', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80' }
  ];

  // Achievements
  const mockAchievements = [
    { title: 'Top Gifter Master', desc: 'Gifted over 5,000,000 Coins in live streams', icon: Trophy, unlocked: true },
    { title: 'PK Battle Champion', desc: 'Won 100+ Red vs Blue PK battles', icon: Swords, unlocked: true },
    { title: 'VIP Royal Emperor', desc: 'Attained Emperor VIP status level', icon: Crown, unlocked: true },
    { title: '9-Seat Party Host', desc: 'Hosted over 200 multi-guest party rooms', icon: Radio, unlocked: true },
    { title: 'Lucky Star Winner', desc: 'Hit the 500x Jackpot on Treasure Wheel', icon: Sparkles, unlocked: true },
    { title: 'Official Nexora Host', desc: 'Verified official platform broadcaster', icon: CheckCircle2, unlocked: true }
  ];

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 space-y-6 pb-28">

      {/* 0. CREATOR SWITCHER BAR (EXPLORE CREATOR PROFILES) */}
      <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-3 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-pink-400" /> Inspect Profile:
          </span>
          {SAMPLE_CREATORS.map(c => {
            const isSel = selectedCreatorId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCreatorId(c.id)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
                  isSel
                    ? 'bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-lg shadow-pink-500/20 border border-pink-400/40'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <img src={c.avatar} alt={c.name} className="w-5 h-5 rounded-full object-cover ring-1 ring-white/40" />
                <span>{c.isSelf ? 'My Profile' : c.name}</span>
                {c.isLive && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
              </button>
            );
          })}
        </div>

        {isViewingSelf && (
          <button
            onClick={() => setActiveTab('settings')}
            className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-2xl border border-slate-800 shrink-0"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 1. PREMIUM CREATOR COVER & HEADER CARD */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden relative">
        {/* HERO COVER IMAGE WITH GRADIENT OVERLAY */}
        <div className="relative h-48 sm:h-64 w-full bg-slate-950 overflow-hidden">
          <img
            src={customCover || currentCreatorData.coverImage}
            alt="Cover"
            className="w-full h-full object-cover opacity-90 transition-all duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-black/30" />

          {/* COVER CUSTOMIZATION BUTTON (FOR SELF) */}
          {isViewingSelf && (
            <label className="absolute top-4 right-4 cursor-pointer px-3 py-1.5 bg-slate-950/70 hover:bg-slate-950 backdrop-blur-md text-white rounded-2xl text-xs font-bold border border-white/10 flex items-center gap-1.5 transition-all shadow-lg">
              <Camera className="w-3.5 h-3.5 text-pink-400" />
              <span>Change Cover</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setCustomCover(url);
                  }
                }}
              />
            </label>
          )}

          {/* LIVE STATUS BANNER OVERLAY */}
          {currentCreatorData.isLive && (
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className="px-3 py-1 bg-red-600/90 backdrop-blur-md text-white text-xs font-black rounded-full shadow-lg flex items-center gap-1.5 animate-pulse border border-red-400/40">
                <Radio className="w-3.5 h-3.5" /> LIVE NOW
              </span>
              <span className="px-3 py-1 bg-slate-950/80 backdrop-blur-md text-slate-100 text-xs font-bold rounded-full border border-white/10">
                👁️ {currentCreatorData.liveViewers.toLocaleString()} Viewers
              </span>
            </div>
          )}
        </div>

        {/* HEADER USER DETAILS CONTENT */}
        <div className="px-5 sm:px-8 pb-6 pt-0 relative -mt-16 sm:-mt-20 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            
            {/* AVATAR + BADGES */}
            <div className="flex items-end gap-4">
              <div className="relative group">
                <img
                  src={isViewingSelf && user?.photoURL ? user.photoURL : currentCreatorData.avatar}
                  alt={currentCreatorData.name}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl object-cover ring-4 ring-pink-500 shadow-2xl border-4 border-slate-900"
                  referrerPolicy="no-referrer"
                />
                
                {/* ONLINE / LIVE RING INDICATOR */}
                {currentCreatorData.isLive ? (
                  <button
                    onClick={() => {
                      if (onJoinStream && currentCreatorData.liveStreamId) {
                        onJoinStream(currentCreatorData.liveStreamId);
                      } else {
                        setActiveTab('live');
                      }
                    }}
                    className="absolute -bottom-2 -right-2 p-1.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl shadow-xl border-2 border-slate-900 text-[10px] font-black tracking-wider flex items-center gap-1 animate-bounce"
                  >
                    <Radio className="w-3 h-3" /> JOIN
                  </button>
                ) : (
                  <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 shadow" title="Online Now" />
                )}
              </div>

              {/* NAME, BADGES, ID */}
              <div className="space-y-1 pb-1">
                <div className="flex items-center flex-wrap gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {isViewingSelf && user?.displayName ? user.displayName : currentCreatorData.name}
                  </h2>
                  <span className="text-xl">{currentCreatorData.countryFlag}</span>
                  {currentCreatorData.isVerified && (
                    <span title="Official Verified Host">
                      <CheckCircle2 className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
                    </span>
                  )}
                  <button
                    onClick={onOpenWealthModal}
                    className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black rounded-full uppercase flex items-center gap-1 shadow-sm"
                  >
                    <Crown className="w-3 h-3 text-amber-400" /> {currentCreatorData.vipTier}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span>ID: <strong className="text-cyan-300">{currentCreatorData.nexoraId}</strong></span>
                  <span>•</span>
                  <span>{currentCreatorData.countryName}</span>
                </div>

                {/* LEVEL BADGES */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] rounded-full shadow-md flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Wealth Lv.{currentCreatorData.wealthLevel}
                  </span>
                  <span className="px-2.5 py-0.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-black text-[10px] rounded-full shadow-md flex items-center gap-1">
                    <Heart className="w-3 h-3" /> Charm Lv.{currentCreatorData.charmLevel}
                  </span>
                  <span className="px-2.5 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 font-extrabold text-[10px] rounded-full">
                    {currentCreatorData.familyBadge}
                  </span>
                </div>
              </div>
            </div>

            {/* PRIMARY ACTION BUTTONS (FOLLOW, MESSAGE, GIFT, JOIN LIVE, SHARE) */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-stretch sm:justify-end">
              {!isViewingSelf ? (
                <>
                  <button
                    onClick={() => handleToggleFollow(currentCreatorData.id)}
                    className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl text-xs font-black transition-all shadow-xl flex items-center justify-center gap-1.5 ${
                      isFollowing[currentCreatorData.id]
                        ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                        : 'bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white hover:opacity-90 shadow-pink-500/20'
                    }`}
                  >
                    {isFollowing[currentCreatorData.id] ? (
                      <>
                        <UserCheck className="w-4 h-4 text-emerald-400" /> Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" /> Follow
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('chat')}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-2xl border border-slate-700 shadow-md"
                    title="Send Direct Message"
                  >
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                  </button>

                  <button
                    onClick={() => setShowGiftModal(true)}
                    className="p-2.5 bg-gradient-to-r from-amber-500 to-pink-500 hover:opacity-90 text-slate-950 font-black rounded-2xl shadow-lg"
                    title="Send Virtual Gift"
                  >
                    <Gift className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setActiveTab('creator')}
                  className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs rounded-2xl shadow-xl hover:opacity-90 flex items-center gap-2"
                >
                  <Clapperboard className="w-4 h-4" /> Creator Studio & Taxes
                </button>
              )}

              <button
                onClick={() => setShowShareModal(true)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-700 shadow-md"
                title="Share Profile Card"
              >
                <Share2 className="w-4 h-4 text-slate-300" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-700 shadow-md"
                  title="More Options"
                >
                  <MoreHorizontal className="w-4 h-4 text-slate-300" />
                </button>

                {showMoreMenu && (
                  <div className="absolute right-0 top-12 w-48 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl z-50 space-y-1 text-xs">
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        alert(`Copied Nexora Profile Link: https://nexora.live/u/${currentCreatorData.nexoraId}`);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 flex items-center gap-2 font-bold"
                    >
                      <QrCode className="w-3.5 h-3.5 text-cyan-400" /> Copy Profile URL
                    </button>
                    {!isViewingSelf && (
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          alert(`Blocked ${currentCreatorData.name}. You will no longer see their streams.`);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 flex items-center gap-2 font-bold"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" /> Block Creator
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* BIO DESCRIPTION */}
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            {currentCreatorData.bio}
          </p>

          {/* STATS METRICS BAR */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Followers</span>
              <span className="text-base font-black text-slate-100">{currentCreatorData.followersCount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Following</span>
              <span className="text-base font-black text-slate-100">{currentCreatorData.followingCount}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Likes</span>
              <span className="text-base font-black text-pink-400">❤️ {currentCreatorData.likesCount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Gifts Recv</span>
              <span className="text-base font-black text-amber-300">🎁 {currentCreatorData.totalGiftsCount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">PK Wins</span>
              <span className="text-base font-black text-purple-400">⚔️ {currentCreatorData.pkWins}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Diamonds</span>
              <span className="text-base font-black text-cyan-300">💎 {(currentCreatorData.totalDiamondsEarned / 1000).toFixed(1)}K</span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. DUAL WALLET SUMMARY CARD (FOR OWN PROFILE) */}
      {isViewingSelf && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
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
      )}

      {/* 3. PROFILE HORIZONTAL TAB SYSTEM */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-slate-800">
        {[
          { id: 'OVERVIEW', label: '🌟 Overview' },
          { id: 'LIVE', label: '📹 Live & Replays' },
          { id: 'VIDEOS', label: '🎬 Videos & Clips' },
          { id: 'PHOTOS', label: '🖼️ Photos' },
          { id: 'MUSIC', label: '🎵 Music & Tracks' },
          { id: 'POSTS', label: '💬 Posts' },
          { id: 'ACHIEVEMENTS', label: '🏆 Achievements' },
          { id: 'PK', label: '⚔️ PK Battles' },
          { id: 'GIFTS', label: '🎁 Gift Wall' },
          { id: 'FAMILY', label: '🏰 Family & Agency' },
          { id: 'VISITORS', label: '👀 Visitors' },
          { id: 'ABOUT', label: 'ℹ️ About & Settings' }
        ].map(tab => {
          const isAct = activeProfileTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveProfileTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isAct
                  ? 'bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-lg shadow-pink-500/20 border border-pink-400/40'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT SECTIONS */}

      {/* TAB A: OVERVIEW */}
      {activeProfileTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* TOP SUPPORTERS PODIUM */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" /> Top Gift Supporters & Fans
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {mockSupporters.map(sup => (
                <div key={sup.rank} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 flex items-center gap-3 relative overflow-hidden">
                  <span className={`text-base font-black ${sup.rank === 1 ? 'text-amber-400' : sup.rank === 2 ? 'text-slate-300' : 'text-amber-600'}`}>
                    #{sup.rank}
                  </span>
                  <img src={sup.avatar} alt={sup.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400/50" />
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-100">{sup.name}</h5>
                    <p className="text-[11px] font-bold text-amber-300">{sup.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QUICK BADGES SHOWCASE */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" /> Unlocked Creator Badges
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {mockAchievements.map((ach, idx) => {
                const Icon = ach.icon;
                return (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col items-center text-center gap-1.5">
                    <div className="p-2.5 bg-purple-950/80 rounded-2xl text-purple-400 border border-purple-800/60">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-200 leading-tight">{ach.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB B: LIVE & REPLAYS */}
      {activeProfileTab === 'LIVE' && (
        <div className="space-y-6">
          {/* ACTIVE LIVE STREAM BANNER IF STREAMING */}
          {currentCreatorData.isLive ? (
            <div className="bg-gradient-to-r from-red-950 via-purple-950 to-slate-900 border border-red-500/40 rounded-3xl p-5 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-red-600 text-white font-black text-xs rounded-full flex items-center gap-1.5 animate-pulse">
                  <Radio className="w-4 h-4" /> BROADCASTING LIVE NOW
                </span>
                <span className="text-xs font-bold text-slate-300">👁️ {currentCreatorData.liveViewers.toLocaleString()} Viewers</span>
              </div>
              <h3 className="text-lg font-black text-white">{currentCreatorData.liveTitle}</h3>
              <button
                onClick={() => {
                  if (onJoinStream && currentCreatorData.liveStreamId) {
                    onJoinStream(currentCreatorData.liveStreamId);
                  } else {
                    setActiveTab('live');
                  }
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white font-black text-xs rounded-2xl shadow-xl hover:opacity-90 flex items-center gap-2"
              >
                <Radio className="w-4 h-4" /> Enter Live Stream Room
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-center space-y-2">
              <Radio className="w-8 h-8 text-slate-600 mx-auto" />
              <h4 className="text-sm font-black text-slate-300">Broadcaster is currently offline</h4>
              <p className="text-xs text-slate-500">Last stream was 4 hours ago. Turn on stream reminders below!</p>
            </div>
          )}

          {/* SCHEDULED UPCOMING STREAMS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" /> Scheduled Upcoming Broadcasts
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mockScheduledStreams.map(s => (
                <div key={s.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
                  <h5 className="text-xs font-bold text-slate-100">{s.title}</h5>
                  <p className="text-[11px] text-cyan-300 font-mono">⏰ {s.time}</p>
                  <button
                    onClick={() => setReminders(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                    className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all ${
                      reminders[s.id] ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {reminders[s.id] ? '✓ Reminder Set' : '🔔 Set Reminder'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* LIVE REPLAYS GRID */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Play className="w-4 h-4 text-pink-400" /> Past Stream Replays
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {mockReplays.map(rep => (
                <div key={rep.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden group shadow-lg">
                  <div className="relative aspect-video bg-slate-950">
                    <img src={currentCreatorData.coverImage} alt={rep.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-pink-500/90 text-white flex items-center justify-center shadow-xl">
                        <Play className="w-5 h-5 ml-0.5 fill-white" />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white text-[10px] font-bold rounded-md">
                      {rep.duration}
                    </span>
                  </div>
                  <div className="p-3 space-y-1">
                    <h5 className="text-xs font-bold text-slate-100 line-clamp-1">{rep.title}</h5>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>👁️ {rep.views} Views</span>
                      <span>❤️ {rep.likes} Likes</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB C: VIDEOS */}
      {activeProfileTab === 'VIDEOS' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(idx => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative aspect-[9/16] group cursor-pointer shadow-lg">
              <img
                src={`https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80`}
                alt="Reel"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-bold text-white">
                <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {(idx * 14.2).toFixed(1)}K</span>
                <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-pink-500 fill-pink-500" /> {(idx * 3.4).toFixed(1)}K</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB D: PHOTOS */}
      {activeProfileTab === 'PHOTOS' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6].map(idx => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden aspect-square group cursor-pointer shadow-lg">
              <img
                src={`https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80`}
                alt="Photo Moment"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
          ))}
        </div>
      )}

      {/* TAB E: MUSIC */}
      {activeProfileTab === 'MUSIC' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
          <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Music className="w-4 h-4 text-purple-400" /> Audio Tracks & Podcasts
          </h4>
          <div className="space-y-2">
            {[
              { id: 'm1', title: 'Nexora Midnight Anthem (Acoustic Version)', duration: '3:45', plays: '124.5K' },
              { id: 'm2', title: 'Live Podcast: How to Become a Verified Creator', duration: '18:20', plays: '42.1K' },
              { id: 'm3', title: 'Late Night Chill Synthwave Beats', duration: '4:12', plays: '89.3K' }
            ].map(track => (
              <div key={track.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPlayingTrackId(playingTrackId === track.id ? null : track.id)}
                    className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform"
                  >
                    <Play className="w-5 h-5 ml-0.5 fill-white" />
                  </button>
                  <div>
                    <h5 className="text-xs font-bold text-slate-100">{track.title}</h5>
                    <span className="text-[10px] text-slate-500">🎧 {track.plays} plays • {track.duration}</span>
                  </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-pink-400">
                  <Heart className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB F: POSTS */}
      {activeProfileTab === 'POSTS' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center gap-3">
              <img src={currentCreatorData.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover ring-2 ring-pink-500" />
              <div>
                <h5 className="text-xs font-bold text-slate-100">{currentCreatorData.name}</h5>
                <span className="text-[10px] text-slate-500">2 hours ago • Pinned Post 📌</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Who is joining our 9-Seat Party Room tonight? Sending 10x Dragons to the top seat gifter! 🔥✨ #NexoraVibes #NexoraLive
            </p>
            <img src={currentCreatorData.coverImage} alt="Post media" className="rounded-2xl w-full h-48 object-cover border border-slate-800" />
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1 hover:text-pink-400 cursor-pointer"><Heart className="w-4 h-4" /> 1,420 Likes</span>
              <span className="flex items-center gap-1 hover:text-cyan-400 cursor-pointer"><MessageCircle className="w-4 h-4" /> 238 Comments</span>
              <span className="flex items-center gap-1 hover:text-amber-400 cursor-pointer"><Share2 className="w-4 h-4" /> Share</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB G: ACHIEVEMENTS */}
      {activeProfileTab === 'ACHIEVEMENTS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mockAchievements.map((ach, idx) => {
            const Icon = ach.icon;
            return (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-start gap-3 shadow-lg">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-pink-500 text-slate-950 rounded-2xl shadow-md">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-xs font-black text-slate-100">{ach.title}</h5>
                  <p className="text-[11px] text-slate-400 leading-tight">{ach.desc}</p>
                  <span className="inline-block px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold rounded-full mt-1">
                    ✓ Unlocked Badge
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB H: GIFTS WALL */}
      {activeProfileTab === 'GIFTS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-400" /> Rare Virtual Gifts Showcase
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {mockGiftWall.map(g => (
              <div key={g.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 flex flex-col items-center text-center gap-1">
                <span className="text-3xl p-2">{g.icon}</span>
                <span className="text-[11px] font-bold text-slate-200">{g.name}</span>
                <span className="text-[10px] font-black text-amber-300">x{g.count} Received</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB I: FAMILY & AGENCY */}
      {activeProfileTab === 'FAMILY' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" /> Family Guild Membership
              </h4>
              <span className="px-2.5 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-black rounded-full">
                {currentCreatorData.familyBadge}
              </span>
            </div>
            <h3 className="text-base font-black text-white">{currentCreatorData.familyName}</h3>
            <p className="text-xs text-slate-400">Role: <strong className="text-amber-300">{currentCreatorData.familyRole}</strong></p>
            <button
              onClick={() => setActiveTab('families')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs rounded-2xl border border-purple-800/40"
            >
              View Family Guild Hall →
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" /> Official Agency Contract
              </h4>
              <span className="px-2.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-black rounded-full">
                {currentCreatorData.agencyLevel}
              </span>
            </div>
            <h3 className="text-base font-black text-white">{currentCreatorData.agencyName}</h3>
            <p className="text-xs text-slate-400">Broadcaster Roster Contract: <strong className="text-emerald-400">Active VIP Broadcaster</strong></p>
            <button
              onClick={() => setActiveTab('agencies')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-2xl border border-amber-800/40"
            >
              View Agency Portal →
            </button>
          </div>
        </div>
      )}

      {/* TAB J: VISITORS */}
      {activeProfileTab === 'VISITORS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" /> Profile Visitor History
            </h4>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
              <span>Incognito / Stealth Mode</span>
              <input
                type="checkbox"
                checked={isAnonymousVisitor}
                onChange={() => setIsAnonymousVisitor(!isAnonymousVisitor)}
                className="w-4 h-4 accent-pink-500 rounded"
              />
            </label>
          </div>

          <div className="space-y-2">
            {[
              { name: 'Lord Sterling 👑', time: '10 mins ago', vip: 'EMPEROR VIP', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80' },
              { name: 'Lady Victoria ✨', time: '1 hour ago', vip: 'DIAMOND VIP', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80' },
              { name: 'Anonymous Stealth Guest 🕵️', time: '3 hours ago', vip: 'GHOST VIP', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80' }
            ].map((vis, i) => (
              <div key={i} className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={vis.avatar} alt={vis.name} className="w-9 h-9 rounded-full object-cover ring-1 ring-cyan-500" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-100">{vis.name}</h5>
                    <span className="text-[10px] text-cyan-300 font-mono">{vis.vip}</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">⏰ {vis.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB K: ABOUT & PRIVACY SETTINGS */}
      {activeProfileTab === 'ABOUT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-5 shadow-xl">
          <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-pink-400" /> Account Details & Privacy Options
          </h4>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <span className="font-bold text-slate-200 block">Hide Followers & Following List</span>
                <span className="text-[11px] text-slate-500">Only friends can see your social list</span>
              </div>
              <input
                type="checkbox"
                checked={hideFollowersList}
                onChange={() => setHideFollowersList(!hideFollowersList)}
                className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <span className="font-bold text-slate-200 block">Hide Visitor History</span>
                <span className="text-[11px] text-slate-500">Prevent other users from seeing when you visit profiles</span>
              </div>
              <input
                type="checkbox"
                checked={hideVisitorHistory}
                onChange={() => setHideVisitorHistory(!hideVisitorHistory)}
                className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* SHARE PROFILE CARD MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl animate-in zoom-in-95">
            <div className="relative p-6 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 rounded-2xl border border-pink-500/40 space-y-3">
              <img src={currentCreatorData.avatar} alt="Avatar" className="w-20 h-20 rounded-full mx-auto ring-4 ring-pink-500 shadow-xl" />
              <h3 className="text-lg font-black text-white">{currentCreatorData.name}</h3>
              <p className="text-xs font-mono text-cyan-300">Nexora ID: {currentCreatorData.nexoraId}</p>
              <div className="w-28 h-28 bg-white p-2 rounded-xl mx-auto shadow-lg flex items-center justify-center">
                <QrCode className="w-full h-full text-slate-950" />
              </div>
              <p className="text-[10px] text-slate-400">Scan QR Code to follow on Nexora Live</p>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl"
            >
              Close Share Card
            </button>
          </div>
        </div>
      )}

      {/* VIRTUAL GIFTING QUICK MODAL */}
      {showGiftModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-400" /> Send Gift to {currentCreatorData.name}
              </h3>
              <button onClick={() => setShowGiftModal(false)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { name: 'Rose 🌹', cost: 10, icon: '🌹' },
                { name: 'Crown 👑', cost: 500, icon: '👑' },
                { name: 'Dragon 🐉', cost: 10000, icon: '🐲' }
              ].map(g => (
                <button
                  key={g.name}
                  onClick={() => {
                    setShowGiftModal(false);
                    alert(`Sent ${g.name} to ${currentCreatorData.name}! ✨`);
                  }}
                  className="bg-slate-950 border border-slate-800 hover:border-amber-500 p-3 rounded-2xl flex flex-col items-center gap-1 text-center"
                >
                  <span className="text-2xl">{g.icon}</span>
                  <span className="text-[11px] font-bold text-slate-200">{g.name}</span>
                  <span className="text-[10px] font-black text-amber-300">🪙 {g.cost}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
