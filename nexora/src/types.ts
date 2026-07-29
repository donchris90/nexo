export type CurrencyType = 'COINS' | 'POINTS' | 'DIAMONDS';

export type WealthTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND' | 'MASTER' | 'LEGEND' | 'ROYAL' | 'EMPEROR' | 'GALAXY' | 'UNIVERSE';

export interface WalletState {
  coins: number;
  points: number;
  diamonds: number;
  lockedCoins: number;
  lockedPoints: number;
  pendingEarnings: number;
  withdrawalBalance: number;
  bonusBalance: number;
  totalSpentCoins: number;
  agencyCommissionCoins: number;
}

export interface UserLevelState {
  currentLevel: number;
  currentXp: number;
  xpForNextLevel: number;
  wealthLevel: number;
  wealthTierName: WealthTier;
  charmLevel: number;
  creatorLevel: number;
  userTitle: string;
  vipTier: 'FREE' | 'VIP1' | 'VIP2' | 'VIP3' | 'VIP4' | 'VIP5' | 'VIP6' | 'VIP7' | 'VIP8' | 'VIP9' | 'VIP10' | 'SILVER' | 'GOLD' | 'DIAMOND' | 'SUPER_VIP';
  equippedFrameId?: string;
  equippedEntranceEffectId?: string;
  equippedTitleId?: string;
  equippedVipBadgeId?: string;
  countryFlag: string;
  countryName: string;
  followersCount: number;
  followingCount: number;
  visitorsCount: number;
  giftsReceivedTotal: number;
  giftsSentTotal: number;
  familyId?: string;
  familyName?: string;
  fanClubName?: string;
}

export interface FamilyMember {
  id: string;
  userName: string;
  userAvatar: string;
  userLevel: number;
  role: 'LEADER' | 'VICE_LEADER' | 'ELITE' | 'MEMBER';
  contributionCoins: number;
}

export interface Family {
  id: string;
  name: string;
  badge?: string;
  logo: string;
  leaderName: string;
  viceLeaderName?: string;
  membersCount: number;
  maxMembers?: number;
  level?: number;
  monthlyDiamonds?: number;
  rank?: number;
  totalFamilyCoins?: number;
  familyRank?: number;
  description?: string;
  members?: FamilyMember[];
  isUserMember?: boolean;
}

export interface FanClub {
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  clubName: string;
  totalFans: number;
  fanLevel: number;
  monthlySubCoins: number;
  subscriberBenefits: string[];
  isSubscribed?: boolean;
}

export interface MissionItem {
  id: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  title: string;
  description: string;
  rewardCoins: number;
  rewardXp: number;
  progress: number;
  maxProgress: number;
  completed: boolean;
  claimed: boolean;
}

export interface AchievementItem {
  id: string;
  category: 'STREAMING' | 'GIFTS' | 'SOCIAL' | 'VIP' | 'GAMES';
  title: string;
  description: string;
  icon: string;
  rewardDiamonds: number;
  rewardTitle?: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  claimed: boolean;
}

export interface UserCustomizationItem {
  id: string;
  category: 'TITLE' | 'FRAME' | 'ENTRANCE_EFFECT' | 'BADGE';
  name: string;
  previewIcon: string;
  description: string;
  minVipLevel?: number;
  minUserLevel?: number;
  isUnlocked: boolean;
  isEquipped: boolean;
}

export interface LevelRewardTrack {
  level: number;
  category: 'USER' | 'CREATOR' | 'WEALTH' | 'CHARM';
  rewardTitle: string;
  rewardCoins: number;
  rewardDiamonds: number;
  unlockedFrameOrTitle?: string;
  claimed: boolean;
}

export interface VipRoom {
  id: string;
  roomName: string;
  minVipLevel: number;
  hostName: string;
  activeViewers: number;
  coverImage: string;
  exclusivePerk: string;
}

export interface ScheduledStream {
  id: string;
  title: string;
  category: string;
  scheduledTime: string;
  description: string;
  ticketPriceCoins: number;
  isPublished: boolean;
}

export interface CreatorGoal {
  id: string;
  title: string;
  category: 'FOLLOWERS' | 'DIAMONDS' | 'STREAM_HOURS' | 'GIFTS';
  currentValue: number;
  targetValue: number;
  rewardBadge: string;
  completed: boolean;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  liveInvitations: boolean;
  pkInvitations: boolean;
  giftAlerts: boolean;
  followerAlerts: boolean;
  creatorNews: boolean;
  systemAnnouncements: boolean;
  securityAlerts: boolean;
}

export interface NotificationItem {
  id: string;
  category: 'GIFTS' | 'FOLLOWERS' | 'LIVE_ALERTS' | 'MESSAGES' | 'REWARDS' | 'GAMES' | 'EVENTS' | 'SECURITY' | 'PK_INVITE' | 'LIVE_INVITE' | 'SYSTEM_ANNOUNCEMENT';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  inviteDetails?: {
    roomId?: string;
    hostName?: string;
    pkDurationSeconds?: number;
  };
}

export interface RedPacket {
  id: string;
  hostName: string;
  totalCoins: number;
  remainingCoins: number;
  totalClaims: number;
  claimedUsers: string[];
  isRaining: boolean;
}

export interface StreamingEffects {
  beautyLevel: number; // 0 to 100
  faceFilter: 'CRYSTAL' | 'GLOW' | 'SUNSET' | 'CYBER' | 'VINTAGE' | 'NONE';
  virtualBackground: 'CYBER_STUDIO' | 'NEON_CLUB' | 'LUXURY_PENTHOUSE' | 'COZY_LOUNGE' | 'BLUR' | 'OFF';
  voiceChanger: 'CHIPMUNK' | 'DEEP_ROBOT' | 'ECHO' | 'DISCO' | 'NORMAL';
  aiFaceEnhance: boolean;
}

export interface AiAssistantMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  timestamp: string;
  recommendedStreamId?: string;
  recommendedGameId?: string;
  actionType?: 'SUGGEST_STREAM' | 'SUGGEST_GAME' | 'TRANSLATE_CHAT' | 'MODERATE_NOTICE';
}

export interface SocialStory {
  id: string;
  authorName: string;
  authorAvatar: string;
  mediaUrl: string;
  isLiveNow?: boolean;
  timestamp: string;
  viewed: boolean;
}

export interface SocialPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorLevel: number;
  authorBadge?: string;
  location?: string;
  content: string;
  mediaUrl?: string;
  voiceNoteUrl?: string;
  voiceNoteDuration?: string;
  likesCount: number;
  commentsCount: number;
  giftsCoinsCount: number;
  timestamp: string;
  isLiked?: boolean;
  category: 'FOR_YOU' | 'FOLLOWING' | 'TRENDING' | 'NEARBY' | 'REELS';
}

export interface FriendRequest {
  id: string;
  userName: string;
  userAvatar: string;
  userLevel: number;
  mutualFriends: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface Agency {
  id: string;
  name: string;
  logo: string;
  founderName?: string;
  ownerName?: string;
  streamersCount?: number;
  totalCreators?: number;
  monthlyGiftsCoins?: number;
  monthlyRevenueUsd?: number;
  commissionRatePercent: number;
  minMonthlyQuotaCoins?: number;
  verificationBadge?: boolean | string;
  description: string;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  rewardXp: number;
  progress: number;
  maxProgress: number;
  completed: boolean;
  claimed: boolean;
}

export interface TreasureBox {
  id: string;
  title: string;
  unlockTimeSeconds: number;
  rewardCoins: number;
  rewardPoints: number;
  isUnlocked: boolean;
}

export interface TransactionRecord {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'GIFT_SEND' | 'GIFT_SENT' | 'GIFT_RECEIVED' | 'REWARD' | 'PURCHASE' | 'GAME_WAGER' | 'GAME_WIN' | 'EXCHANGE' | 'TICKET_PURCHASE' | 'DIGITAL_BUY';
  currency: CurrencyType;
  amount: number;
  description: string;
  timestamp: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  relatedUser?: string;
}

export interface GiftItem {
  id: string;
  name: string;
  icon: string;
  coinPrice: number;
  diamondValue: number;
  category: 'REGULAR' | 'SPECIAL' | 'AR_PREMIUM';
  animationType: 'DRAGON' | 'SPORTS_CAR' | 'CASTLE' | 'SPACESHIP' | 'PORTAL' | 'FIREWORKS' | 'CONFETTI' | 'STANDARD';
  description: string;
  soundEffect?: string;
}

export interface PartySeat {
  seatNumber: number;
  uid?: string;
  userName?: string;
  userAvatar?: string;
  userLevel?: number;
  isMuted?: boolean;
  isCameraOn?: boolean;
  seatGiftsCoins?: number;
  isHost?: boolean;
}

export interface PkBattleInfo {
  isPkActive: boolean;
  opponentName: string;
  opponentAvatar: string;
  opponentLevel: number;
  selfScore: number;
  opponentScore: number;
  timeRemainingSeconds: number;
  winningTeam: 'RED' | 'BLUE' | 'DRAW';
}

export interface LiveStream {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  creatorVerified: boolean;
  creatorLevel?: number;
  location?: string;
  title: string;
  category: 'PARTY_ROOM' | 'PK_BATTLE' | 'GAMING' | 'TALK_SHOW' | 'MUSIC' | 'SHOPPING' | 'PODCAST' | 'MULTI_GUEST';
  viewersCount: number;
  likesCount: number;
  thumbnailUrl: string;
  tags: string[];
  isLive: boolean;
  isPartyRoom?: boolean;
  seatGridSize?: 4 | 6 | 9;
  seats?: PartySeat[];
  pkBattle?: PkBattleInfo;
  pinnedProducts?: ShoppingProduct[];
  aiCohostEnabled: boolean;
  aiCohostMode?: 'MODERATOR' | 'QA' | 'TRIVIA' | 'RECOMMENDER' | 'TRANSLATOR';
}

export interface ChatMessage {
  id: string;
  streamId: string;
  senderName: string;
  senderAvatar: string;
  senderBadge?: string;
  senderWealthLevel?: number;
  text: string;
  timestamp: string;
  isAiCohost?: boolean;
  isGiftNotice?: boolean;
  giftDetails?: {
    giftName: string;
    giftIcon: string;
    amount: number;
    comboCount?: number;
    targetSeatNumber?: number;
  };
}

export interface GameRoom {
  id: string;
  gameId: string;
  gameName: string;
  hostName: string;
  minWagerPoints: number;
  maxPlayers: number;
  currentPlayers: number;
  isPrivate: boolean;
  roomCode?: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
  category?: 'CASUAL' | 'PARTY' | 'COIN' | 'HOST' | 'PK' | 'FAMILY';
}

export type GameCategory = 'CASUAL' | 'PARTY' | 'COIN' | 'HOST' | 'PK' | 'FAMILY';

export interface GameDefinition {
  id: string;
  name: string;
  category: GameCategory;
  description: string;
  iconName: string;
  minPlayers: number;
  maxPlayers: number;
  wagerAllowed: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  supportedModes: ('SOLO' | 'MULTIPLAYER' | 'LIVE_ROOM' | 'PARTY_ROOM' | 'PK_MATCH')[];
  howToPlay: string;
}

export interface Tournament {
  id: string;
  title: string;
  gameId: string;
  category: GameCategory;
  prizePoolCoins: number;
  prizePoolPoints: number;
  entryFeePoints: number;
  startTime: string;
  registeredCount: number;
  maxParticipants: number;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  bannerImage: string;
  rules: string[];
}

export interface DailyGameMission {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  rewardType: 'COINS' | 'POINTS' | 'EXP';
  rewardAmount: number;
  isClaimed: boolean;
  icon: string;
}

export interface GameInvite {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  gameId: string;
  gameName: string;
  wagerPoints: number;
  createdAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
}

export interface ShoppingProduct {
  id: string;
  title: string;
  priceCoins: number;
  priceUsd: number;
  image: string;
  description: string;
  stock: number;
  salesCount: number;
  rating: number;
  creatorName: string;
}

export interface DigitalProduct {
  id: string;
  title: string;
  category: 'COURSE' | 'TEMPLATE' | 'MUSIC' | 'PRESET' | 'EBOOK' | 'PROMPTS';
  priceCoins: number;
  creatorName: string;
  image: string;
  rating: number;
  downloadsCount: number;
  fileSize: string;
}

export interface CreatorService {
  id: string;
  creatorName: string;
  creatorAvatar: string;
  serviceTitle: string;
  description: string;
  priceCoins: number;
  deliveryDays: number;
  rating: number;
  category: 'SHOUTOUT' | 'PROMOTION' | 'PRIVATE_STREAM' | 'CONSULTATION' | 'VOICE_GREETING';
}

export interface TicketedEvent {
  id: string;
  title: string;
  organizerName: string;
  date: string;
  time: string;
  priceCoins: number;
  category: 'CONCERT' | 'MASTERCLASS' | 'TOURNAMENT' | 'COMEDY' | 'CONFERENCE';
  image: string;
  vipTicketCoins: number;
  ticketsSold: number;
  totalCapacity: number;
}

export interface AIAvatar {
  id: string;
  name: string;
  style: 'ANIME' | 'CYBERPUNK' | 'REALISTIC' | 'FANTASY' | '3D_RENDER';
  voiceTone: 'ENERGETIC' | 'CALM' | 'PROFESSIONAL' | 'PLAYFUL';
  avatarUrl: string;
  expressions: string[];
}

export interface WithdrawalRequest {
  id: string;
  amountDiamonds: number;
  amountUsd: number;
  method: 'PAYPAL' | 'BANK_WIRE' | 'STRIPE' | 'CRYPTO';
  accountDetails: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  requestDate: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  duration: number; // in seconds
  coverImage: string;
  audioUrl: string;
  uploadedBy: string; // userId or username
  uploadedByName?: string;
  createdAt: string;
  playCount: number;
  likes: number;
  isPublic: boolean;
  isPrivate?: boolean;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  copyrightFlag?: boolean;
  storagePath?: string;
  fileSizeBytes?: number;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  createdBy: string;
  createdByName?: string;
  isPublic: boolean;
  createdAt: string;
  trackIds: string[];
}

export interface PlaylistTrack {
  id: string;
  playlistId: string;
  trackId: string;
  addedAt: string;
}

export interface RecentlyPlayedTrack {
  id: string;
  userId: string;
  trackId: string;
  playedAt: string;
  track?: MusicTrack;
}

export interface FavoriteTrack {
  id: string;
  userId: string;
  trackId: string;
  addedAt: string;
  track?: MusicTrack;
}

export interface MusicSyncState {
  currentTrackId: string | null;
  trackTitle: string;
  artist: string;
  album?: string;
  coverImage: string;
  audioUrl: string;
  isPlaying: boolean;
  playbackPosition: number; // in seconds
  lastUpdatedTimestamp: number; // Date.now()
  musicVolume: number; // 0 to 1
  micVolume: number; // 0 to 1
  queueTrackIds: string[];
  repeatMode: 'none' | 'one' | 'all';
  isShuffle: boolean;
  streamId: string;
}

export interface MusicReport {
  id: string;
  trackId: string;
  reportedBy: string;
  reason: string;
  createdAt: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
}

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  thumbnail: string;
  videoUrl: string;
  uploadedBy: string; // userId or username
  uploadedByName?: string;
  createdAt: string;
  views: number;
  likes: number;
  category: string;
  resolution?: string;
  fileSize?: number; // in bytes
  visibility: 'PUBLIC' | 'PRIVATE' | 'DRAFT';
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  copyrightFlag?: boolean;
  storagePath?: string;
}

export interface VideoPlaylist {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  createdBy: string;
  createdByName?: string;
  isPublic: boolean;
  createdAt: string;
  videoIds: string[];
}

export interface RecentVideo {
  id: string;
  userId: string;
  videoId: string;
  playedAt: string;
  video?: VideoItem;
}

export interface FavoriteVideo {
  id: string;
  userId: string;
  videoId: string;
  addedAt: string;
  video?: VideoItem;
}

export interface VideoSyncState {
  currentVideoId: string | null;
  videoTitle: string;
  thumbnail: string;
  videoUrl: string;
  isPlaying: boolean;
  playbackPosition: number; // in seconds
  lastUpdatedTimestamp: number; // Date.now()
  videoVolume: number; // 0 to 1
  micVolume: number; // 0 to 1
  layoutMode: 'CAMERA_ONLY' | 'CAMERA_AND_VIDEO' | 'VIDEO_ONLY';
  queueVideoIds: string[];
  streamId: string;
}

export interface VideoReport {
  id: string;
  videoId: string;
  reportedBy: string;
  reason: string;
  createdAt: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
}

