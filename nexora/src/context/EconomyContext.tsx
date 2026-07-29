import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  WalletState, 
  TransactionRecord, 
  GiftItem, 
  ShoppingProduct, 
  DigitalProduct, 
  TicketedEvent, 
  WithdrawalRequest,
  UserLevelState,
  DailyMission,
  MissionItem,
  AchievementItem,
  UserCustomizationItem,
  LevelRewardTrack,
  VipRoom,
  ScheduledStream,
  CreatorGoal,
  NotificationPreferences,
  TreasureBox,
  NotificationItem,
  RedPacket,
  AiAssistantMessage,
  Family
} from '../types';
import { 
  MOCK_WEEKLY_MISSIONS,
  MOCK_MONTHLY_MISSIONS,
  MOCK_ACHIEVEMENTS,
  MOCK_CUSTOMIZATIONS,
  MOCK_LEVEL_REWARDS,
  MOCK_VIP_ROOMS,
  MOCK_SCHEDULED_STREAMS,
  MOCK_CREATOR_GOALS,
  INITIAL_NOTIFICATION_PREFERENCES
} from '../data/mockData';
import { 
  auth, 
  db, 
  googleProvider, 
  facebookProvider,
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  FirebaseUser,
  testConnection
} from '../lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { walletService } from '../services/WalletService';
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';

interface EconomyContextType {
  authUser: FirebaseUser | null;
  authError: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  wallet: WalletState;
  transactions: TransactionRecord[];
  activeARGift: GiftItem | null;
  clearARGift: () => void;
  sendGift: (gift: GiftItem, streamTitle: string, creatorName: string) => boolean;
  rechargeCoins: (coinsAmount: number, paymentMethod: string) => void;
  convertCoinsToPoints: (coinsAmount: number) => boolean;
  requestWithdrawal: (diamondsAmount: number, method: 'PAYPAL' | 'BANK_WIRE' | 'STRIPE' | 'CRYPTO', accountDetails: string) => { success: boolean; message: string };
  updateGamePoints: (deltaPoints: number, description: string, gameName: string) => void;
  purchaseProduct: (product: ShoppingProduct) => boolean;
  purchaseDigitalGood: (product: DigitalProduct) => boolean;
  purchaseTicket: (event: TicketedEvent, isVip: boolean) => boolean;
  claimDailyBonus: () => void;
  dailyBonusClaimed: boolean;
  withdrawals: WithdrawalRequest[];
  vipTier: 'FREE' | 'VIP1' | 'VIP2' | 'VIP3' | 'VIP4' | 'VIP5' | 'VIP6' | 'VIP7' | 'VIP8' | 'VIP9' | 'VIP10' | 'SILVER' | 'GOLD' | 'DIAMOND' | 'SUPER_VIP';
  referralCode: string;
  userLevel: UserLevelState;
  addXp: (xpAmount: number) => void;
  dailyMissions: DailyMission[];
  weeklyMissions: MissionItem[];
  monthlyMissions: MissionItem[];
  achievements: AchievementItem[];
  customizations: UserCustomizationItem[];
  levelRewards: LevelRewardTrack[];
  vipRooms: VipRoom[];
  scheduledStreams: ScheduledStream[];
  creatorGoals: CreatorGoal[];
  notificationPreferences: NotificationPreferences;
  claimMission: (missionId: string) => void;
  claimAchievement: (achievementId: string) => void;
  equipCustomization: (customizationId: string) => void;
  claimLevelReward: (level: number, category: string) => void;
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
  addScheduledStream: (stream: Omit<ScheduledStream, 'id'>) => void;
  sendLiveInvite: (hostName: string, roomId: string) => void;
  sendPkInvite: (opponentName: string, durationSeconds?: number) => void;
  triggerPushNotification: (title: string, body: string) => void;
  treasureBox: TreasureBox;
  openTreasureBox: () => void;
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  redPacket: RedPacket;
  claimRedPacket: () => number;
  aiMessages: AiAssistantMessage[];
  sendAiAssistantQuery: (text: string) => void;
  families: Family[];
  joinFamily: (familyId: string) => void;
}

const INITIAL_WALLET: WalletState = {
  coins: 24500,
  points: 78000,
  diamonds: 18400,
  lockedCoins: 500,
  lockedPoints: 1200,
  pendingEarnings: 1250.00,
  withdrawalBalance: 820.00,
  bonusBalance: 3500,
  totalSpentCoins: 84000,
  agencyCommissionCoins: 5200
};

const INITIAL_USER_LEVEL: UserLevelState = {
  currentLevel: 24,
  currentXp: 6800,
  xpForNextLevel: 8000,
  wealthLevel: 32,
  wealthTierName: 'MASTER',
  charmLevel: 28,
  creatorLevel: 16,
  userTitle: '👑 Master Gifter & Guild Leader',
  vipTier: 'GOLD',
  countryFlag: '🇺🇸',
  countryName: 'United States',
  followersCount: 12400,
  followingCount: 380,
  visitorsCount: 89000,
  giftsReceivedTotal: 145000,
  giftsSentTotal: 84000,
  familyId: 'fam_1',
  familyName: '🔥 Phoenix Royals',
  fanClubName: 'Aria\'s Star Squad'
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'not_1', category: 'GIFTS', title: '🎁 Mega Gift Received!', body: 'CyberKnight sent you a Cyber Sports Car (2,500 Coins) in Party Room #1!', timestamp: '2m ago', read: false },
  { id: 'not_2', category: 'LIVE_ALERTS', title: '🔴 Aria Nova is LIVE!', body: 'Aria Nova started a 9-Seat Party Room & Karaoke Stream.', timestamp: '10m ago', read: false },
  { id: 'not_3', category: 'GAMES', title: '🎲 Ludo Tournament Victory', body: 'You won +5,000 Points in the Nexora PvP Championship!', timestamp: '1h ago', read: true },
  { id: 'not_4', category: 'REWARDS', title: '👑 Wealth Level Upgrade', body: 'Congratulations! You reached Wealth Level 32 (Master Tier).', timestamp: '3h ago', read: true }
];

const INITIAL_RED_PACKET: RedPacket = {
  id: 'rp_101',
  hostName: 'Aria Nova',
  totalCoins: 10000,
  remainingCoins: 4200,
  totalClaims: 50,
  claimedUsers: [],
  isRaining: true
};

const INITIAL_AI_MESSAGES: AiAssistantMessage[] = [
  {
    id: 'ai_1',
    sender: 'AI',
    text: 'Hello Alex! I am your Nexora AI Companion 🤖. I can recommend live party rooms, translate live chat in real-time, explain game strategies, and moderate your streams!',
    timestamp: 'Just now'
  }
];

const INITIAL_FAMILIES: Family[] = [
  {
    id: 'fam_1',
    name: 'Phoenix Royals',
    logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    leaderName: 'Alex Rivers',
    viceLeaderName: 'Aria Nova',
    membersCount: 48,
    totalFamilyCoins: 12500000,
    familyRank: 1,
    description: 'The #1 Competitive Guild in Nexora. Daily PK Battles & Family Rewards!',
    isUserMember: true,
    members: [
      { id: 'm_1', userName: 'Alex Rivers', userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', userLevel: 24, role: 'LEADER', contributionCoins: 84000 },
      { id: 'm_2', userName: 'Aria Nova', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', userLevel: 58, role: 'VICE_LEADER', contributionCoins: 120000 }
    ]
  },
  {
    id: 'fam_2',
    name: 'Cyber Dragons Guild',
    logo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    leaderName: 'CyberKnight',
    viceLeaderName: 'DJ Kairos',
    membersCount: 35,
    totalFamilyCoins: 8900000,
    familyRank: 2,
    description: 'Top Gaming & Ludo Guild. High wagers and weekly tournament prizes!',
    isUserMember: false,
    members: []
  }
];

const INITIAL_MISSIONS: DailyMission[] = [
  { id: 'm1', title: '📺 Watch Live Streams (30 Mins)', description: 'Watch any Nexora 9-seat party room or live stream for 30 minutes', rewardCoins: 300, rewardXp: 200, progress: 20, maxProgress: 30, completed: false, claimed: false },
  { id: 'm2', title: '🎁 Send 3 Live Gifts', description: 'Send any AR gift or combo to hosts or party seats', rewardCoins: 500, rewardXp: 350, progress: 2, maxProgress: 3, completed: false, claimed: false },
  { id: 'm3', title: '🎮 Play 3 Ludo Games', description: 'Participate in gaming arena matches or lucky wheel rolls', rewardCoins: 400, rewardXp: 250, progress: 3, maxProgress: 3, completed: true, claimed: false },
  { id: 'm4', title: '👥 Join Party Room Seat', description: 'Take a seat in a 9-guest live party room', rewardCoins: 250, rewardXp: 150, progress: 1, maxProgress: 1, completed: true, claimed: true }
];

const INITIAL_TREASURE_BOX: TreasureBox = {
  id: 'tb_1',
  title: '🎁 Live Room Fortune Chest',
  unlockTimeSeconds: 45,
  rewardCoins: 888,
  rewardPoints: 2000,
  isUnlocked: false
};

function getAuthErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Try signing in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
    default:
      return (err as Error)?.message || 'Something went wrong. Please try again.';
  }
}

const EconomyContext = createContext<EconomyContextType | undefined>(undefined);

export const EconomyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const [wallet, setWallet] = useState<WalletState>(() => {
    const saved = localStorage.getItem('nexora_wallet');
    return saved ? JSON.parse(saved) : INITIAL_WALLET;
  });

  const [userLevel, setUserLevel] = useState<UserLevelState>(() => {
    const saved = localStorage.getItem('nexora_user_level');
    return saved ? JSON.parse(saved) : INITIAL_USER_LEVEL;
  });

  const [dailyMissions, setDailyMissions] = useState<DailyMission[]>(() => {
    const saved = localStorage.getItem('nexora_missions');
    return saved ? JSON.parse(saved) : INITIAL_MISSIONS;
  });

  const [weeklyMissions, setWeeklyMissions] = useState<MissionItem[]>(MOCK_WEEKLY_MISSIONS);
  const [monthlyMissions, setMonthlyMissions] = useState<MissionItem[]>(MOCK_MONTHLY_MISSIONS);
  const [achievements, setAchievements] = useState<AchievementItem[]>(MOCK_ACHIEVEMENTS);
  const [customizations, setCustomizations] = useState<UserCustomizationItem[]>(MOCK_CUSTOMIZATIONS);
  const [levelRewards, setLevelRewards] = useState<LevelRewardTrack[]>(MOCK_LEVEL_REWARDS);
  const [vipRooms, setVipRooms] = useState<VipRoom[]>(MOCK_VIP_ROOMS);
  const [scheduledStreams, setScheduledStreams] = useState<ScheduledStream[]>(MOCK_SCHEDULED_STREAMS);
  const [creatorGoals, setCreatorGoals] = useState<CreatorGoal[]>(MOCK_CREATOR_GOALS);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(INITIAL_NOTIFICATION_PREFERENCES);

  const [treasureBox, setTreasureBox] = useState<TreasureBox>(INITIAL_TREASURE_BOX);

  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => {
    const saved = localStorage.getItem('nexora_txs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'tx_101',
        type: 'PURCHASE',
        currency: 'COINS',
        amount: 10000,
        description: 'Coins Bundle Recharged via Google Pay / Stripe',
        timestamp: new Date(Date.now() - 3600000 * 4).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'COMPLETED'
      },
      {
        id: 'tx_102',
        type: 'GAME_WIN',
        currency: 'POINTS',
        amount: 5000,
        description: 'Won Ludo Master PvP Tournament Final',
        timestamp: new Date(Date.now() - 3600000 * 2).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'COMPLETED'
      },
      {
        id: 'tx_103',
        type: 'GIFT_SENT',
        currency: 'COINS',
        amount: 2500,
        description: 'Sent Cyber Sports Car Combo to Aria Nova (Seat #1)',
        timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'COMPLETED',
        relatedUser: 'Aria Nova'
      }
    ];
  });

  // FIREBASE AUTH & FIRESTORE LISTENERS FOR USER PROFILE AND ECONOMY STATE
  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      setAuthUser(user);
      if (user) {
        // 1. Sync user profile with Firestore /users/{uid}
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.wallet) setWallet(data.wallet);
          if (data.userLevel) setUserLevel(data.userLevel);
        } else {
          await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName || 'Nexora VIP User',
            photoURL: user.photoURL || '',
            wallet,
            userLevel,
            createdAt: new Date().toISOString()
          });
        }

        // 2. Sync economy state (missions, achievements, customizations, scheduled streams, creator goals)
        const econRef = doc(db, 'user_economy_data', user.uid);
        const unsubEcon = onSnapshot(econRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.dailyMissions) setDailyMissions(data.dailyMissions);
            if (data.weeklyMissions) setWeeklyMissions(data.weeklyMissions);
            if (data.monthlyMissions) setMonthlyMissions(data.monthlyMissions);
            if (data.achievements) setAchievements(data.achievements);
            if (data.customizations) setCustomizations(data.customizations);
            if (data.levelRewards) setLevelRewards(data.levelRewards);
            if (data.vipRooms) setVipRooms(data.vipRooms);
            if (data.scheduledStreams) setScheduledStreams(data.scheduledStreams);
            if (data.creatorGoals) setCreatorGoals(data.creatorGoals);
            if (data.notificationPreferences) setNotificationPreferences(data.notificationPreferences);
          } else {
            // Seed Firestore with default initial state
            setDoc(econRef, {
              dailyMissions,
              weeklyMissions,
              monthlyMissions,
              achievements,
              customizations,
              levelRewards,
              vipRooms,
              scheduledStreams,
              creatorGoals,
              notificationPreferences,
              updatedAt: new Date().toISOString()
            }).catch(err => console.warn('Economy initial Firestore seed warning:', err));
          }
        }, (err) => {
          console.warn('Economy Firestore listener notice:', err);
        });

        return () => unsubEcon();
      }
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google Auth Login Error:', err);
      setAuthError(getAuthErrorMessage(err));
    }
  };

  const loginWithFacebook = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, facebookProvider);
    } catch (err) {
      console.error('Facebook Auth Login Error:', err);
      setAuthError(getAuthErrorMessage(err));
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthError(null);
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (err) {
      console.error('Email Sign In Error:', err);
      setAuthError(getAuthErrorMessage(err));
      return false;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string): Promise<boolean> => {
    try {
      setAuthError(null);
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && cred.user) {
        await updateProfile(cred.user, { displayName });
      }
      return true;
    } catch (err) {
      console.error('Email Sign Up Error:', err);
      setAuthError(getAuthErrorMessage(err));
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout Error:', err);
    }
  };

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([
    {
      id: 'wd_1',
      amountDiamonds: 10000,
      amountUsd: 500.00,
      method: 'BANK_WIRE',
      accountDetails: 'Nexora Creator #9924',
      status: 'PROCESSED',
      requestDate: '2026-07-26'
    }
  ]);

  const [activeARGift, setActiveARGift] = useState<GiftItem | null>(null);
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState<boolean>(false);
  const vipTier = 'GOLD';
  const referralCode = 'NEXORA-ALEX-992';

  useEffect(() => {
    localStorage.setItem('nexora_wallet', JSON.stringify(wallet));
  }, [wallet]);

  useEffect(() => {
    localStorage.setItem('nexora_user_level', JSON.stringify(userLevel));
  }, [userLevel]);

  useEffect(() => {
    localStorage.setItem('nexora_missions', JSON.stringify(dailyMissions));
  }, [dailyMissions]);

  useEffect(() => {
    localStorage.setItem('nexora_txs', JSON.stringify(transactions));
  }, [transactions]);

  const clearARGift = () => setActiveARGift(null);

  const addXp = (xpAmount: number) => {
    setUserLevel(prev => {
      let newXp = prev.currentXp + xpAmount;
      let newLevel = prev.currentLevel;
      let nextReq = prev.xpForNextLevel;

      if (newXp >= nextReq) {
        newLevel += 1;
        newXp -= nextReq;
        nextReq = Math.floor(nextReq * 1.25);
      }

      return {
        ...prev,
        currentLevel: newLevel,
        currentXp: newXp,
        xpForNextLevel: nextReq
      };
    });
  };

  const addTransaction = (record: Omit<TransactionRecord, 'id' | 'timestamp'>) => {
    const newTx: TransactionRecord = {
      ...record,
      id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setTransactions(prev => [newTx, ...prev]);

    // Persist immutable ledger entry via WalletService if signed in
    if (auth.currentUser) {
      walletService.appendLedgerEntry({
        userId: auth.currentUser.uid,
        type: newTx.type,
        currency: newTx.currency,
        amount: newTx.amount,
        description: newTx.description,
        status: newTx.status || 'COMPLETED',
        relatedUser: newTx.relatedUser,
        timestamp: new Date().toISOString()
      }).catch(err => {
        console.warn('WalletService ledger record warning:', err);
      });
    }
  };

  const sendGift = (gift: GiftItem, streamTitle: string, creatorName: string): boolean => {
    if (wallet.coins < gift.coinPrice) {
      return false;
    }

    // 70% converted to creator Diamonds, 30% platform/agency commission
    const creatorDiamonds = Math.floor(gift.coinPrice * 0.7);

    setWallet(prev => ({
      ...prev,
      coins: prev.coins - gift.coinPrice,
      totalSpentCoins: prev.totalSpentCoins + gift.coinPrice,
      agencyCommissionCoins: prev.agencyCommissionCoins + Math.floor(gift.coinPrice * 0.1)
    }));

    addXp(Math.floor(gift.coinPrice / 5));

    addTransaction({
      type: 'GIFT_SENT',
      currency: 'COINS',
      amount: gift.coinPrice,
      description: `Sent ${gift.name} (${gift.icon}) during "${streamTitle}" (Host receives +${creatorDiamonds} 💎)`,
      status: 'COMPLETED',
      relatedUser: creatorName
    });

    setActiveARGift(gift);
    return true;
  };

  const rechargeCoins = (coinsAmount: number, paymentMethod: string) => {
    setWallet(prev => ({
      ...prev,
      coins: prev.coins + coinsAmount
    }));

    addXp(100);

    addTransaction({
      type: 'PURCHASE',
      currency: 'COINS',
      amount: coinsAmount,
      description: `Recharged ${coinsAmount.toLocaleString()} Coins via ${paymentMethod}`,
      status: 'COMPLETED'
    });
  };

  const convertCoinsToPoints = (coinsAmount: number): boolean => {
    if (wallet.coins < coinsAmount) return false;

    const pointsReceived = coinsAmount * 10;

    setWallet(prev => ({
      ...prev,
      coins: prev.coins - coinsAmount,
      points: prev.points + pointsReceived
    }));

    addTransaction({
      type: 'EXCHANGE',
      currency: 'POINTS',
      amount: pointsReceived,
      description: `Exchanged ${coinsAmount} Coins for ${pointsReceived.toLocaleString()} Points`,
      status: 'COMPLETED'
    });

    return true;
  };

  const requestWithdrawal = (diamondsAmount: number, method: 'PAYPAL' | 'BANK_WIRE' | 'STRIPE' | 'CRYPTO', accountDetails: string) => {
    if (diamondsAmount < 1000) {
      return { success: false, message: 'Minimum withdrawal is 1,000 Diamonds ($50.00 USD).' };
    }
    if (wallet.diamonds < diamondsAmount) {
      return { success: false, message: 'Insufficient Diamonds balance.' };
    }

    const usdValue = (diamondsAmount / 100) * 5;

    setWallet(prev => ({
      ...prev,
      diamonds: prev.diamonds - diamondsAmount,
      withdrawalBalance: prev.withdrawalBalance + usdValue
    }));

    const newWd: WithdrawalRequest = {
      id: `wd_${Date.now()}`,
      amountDiamonds: diamondsAmount,
      amountUsd: usdValue,
      method,
      accountDetails,
      status: 'PENDING',
      requestDate: new Date().toISOString().split('T')[0]
    };

    setWithdrawals(prev => [newWd, ...prev]);

    addTransaction({
      type: 'WITHDRAWAL',
      currency: 'DIAMONDS',
      amount: diamondsAmount,
      description: `Requested withdrawal of ${diamondsAmount} Diamonds ($${usdValue.toFixed(2)} USD)`,
      status: 'PENDING'
    });

    return { success: true, message: `Withdrawal request for $${usdValue.toFixed(2)} submitted successfully!` };
  };

  const updateGamePoints = (deltaPoints: number, description: string, _gameName: string) => {
    setWallet(prev => ({
      ...prev,
      points: Math.max(0, prev.points + deltaPoints)
    }));

    addXp(50);

    addTransaction({
      type: deltaPoints >= 0 ? 'GAME_WIN' : 'GAME_WAGER',
      currency: 'POINTS',
      amount: Math.abs(deltaPoints),
      description,
      status: 'COMPLETED'
    });
  };

  const purchaseProduct = (product: ShoppingProduct): boolean => {
    if (wallet.coins < product.priceCoins) return false;

    setWallet(prev => ({ ...prev, coins: prev.coins - product.priceCoins }));

    addTransaction({
      type: 'PURCHASE',
      currency: 'COINS',
      amount: product.priceCoins,
      description: `Bought Live Shopping item: ${product.title}`,
      status: 'COMPLETED',
      relatedUser: product.creatorName
    });

    return true;
  };

  const purchaseDigitalGood = (product: DigitalProduct): boolean => {
    if (wallet.coins < product.priceCoins) return false;

    setWallet(prev => ({ ...prev, coins: prev.coins - product.priceCoins }));

    addTransaction({
      type: 'DIGITAL_BUY',
      currency: 'COINS',
      amount: product.priceCoins,
      description: `Downloaded Digital Asset: ${product.title}`,
      status: 'COMPLETED',
      relatedUser: product.creatorName
    });

    return true;
  };

  const purchaseTicket = (event: TicketedEvent, isVip: boolean): boolean => {
    const cost = isVip ? event.vipTicketCoins : event.priceCoins;
    if (wallet.coins < cost) return false;

    setWallet(prev => ({ ...prev, coins: prev.coins - cost }));

    addTransaction({
      type: 'TICKET_PURCHASE',
      currency: 'COINS',
      amount: cost,
      description: `Purchased ${isVip ? 'VIP' : 'Standard'} Ticket for ${event.title}`,
      status: 'COMPLETED',
      relatedUser: event.organizerName
    });

    return true;
  };

  const claimDailyBonus = () => {
    if (dailyBonusClaimed) return;

    setWallet(prev => ({
      ...prev,
      coins: prev.coins + 500,
      points: prev.points + 2000
    }));

    addXp(300);

    setDailyBonusClaimed(true);

    addTransaction({
      type: 'REWARD',
      currency: 'COINS',
      amount: 500,
      description: 'Daily Check-in Reward (+500 Coins, +2,000 Points & +300 XP)',
      status: 'COMPLETED'
    });
  };

  const persistEconomyState = (updates: Record<string, any>) => {
    if (auth.currentUser) {
      const econRef = doc(db, 'user_economy_data', auth.currentUser.uid);
      setDoc(econRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(err => console.warn('Failed to persist economy state to Firestore:', err));
    }
  };

  const claimMission = (missionId: string) => {
    // Check Daily
    const dailyTarget = dailyMissions.find(m => m.id === missionId);
    if (dailyTarget && !dailyTarget.claimed && dailyTarget.completed) {
      const updated = dailyMissions.map(m => m.id === missionId ? { ...m, claimed: true } : m);
      setDailyMissions(updated);
      persistEconomyState({ dailyMissions: updated });
      setWallet(prev => ({ ...prev, coins: prev.coins + dailyTarget.rewardCoins }));
      addXp(dailyTarget.rewardXp);
      addTransaction({ type: 'REWARD', currency: 'COINS', amount: dailyTarget.rewardCoins, description: `Claimed Daily Mission: ${dailyTarget.title}`, status: 'COMPLETED' });
      return;
    }

    // Check Weekly
    const weeklyTarget = weeklyMissions.find(m => m.id === missionId);
    if (weeklyTarget && !weeklyTarget.claimed && weeklyTarget.completed) {
      const updated = weeklyMissions.map(m => m.id === missionId ? { ...m, claimed: true } : m);
      setWeeklyMissions(updated);
      persistEconomyState({ weeklyMissions: updated });
      setWallet(prev => ({ ...prev, coins: prev.coins + weeklyTarget.rewardCoins }));
      addXp(weeklyTarget.rewardXp);
      addTransaction({ type: 'REWARD', currency: 'COINS', amount: weeklyTarget.rewardCoins, description: `Claimed Weekly Mission: ${weeklyTarget.title}`, status: 'COMPLETED' });
      return;
    }

    // Check Monthly
    const monthlyTarget = monthlyMissions.find(m => m.id === missionId);
    if (monthlyTarget && !monthlyTarget.claimed && monthlyTarget.completed) {
      const updated = monthlyMissions.map(m => m.id === missionId ? { ...m, claimed: true } : m);
      setMonthlyMissions(updated);
      persistEconomyState({ monthlyMissions: updated });
      setWallet(prev => ({ ...prev, coins: prev.coins + monthlyTarget.rewardCoins }));
      addXp(monthlyTarget.rewardXp);
      addTransaction({ type: 'REWARD', currency: 'COINS', amount: monthlyTarget.rewardCoins, description: `Claimed Monthly Mission: ${monthlyTarget.title}`, status: 'COMPLETED' });
      return;
    }
  };

  const claimAchievement = (achievementId: string) => {
    const ach = achievements.find(a => a.id === achievementId);
    if (!ach || ach.claimed || !ach.unlocked) return;

    const updated = achievements.map(a => a.id === achievementId ? { ...a, claimed: true } : a);
    setAchievements(updated);
    persistEconomyState({ achievements: updated });
    setWallet(prev => ({ ...prev, diamonds: prev.diamonds + ach.rewardDiamonds }));
    addXp(1000);

    if (ach.rewardTitle) {
      setUserLevel(prev => ({ ...prev, userTitle: `✨ ${ach.rewardTitle}` }));
    }

    addTransaction({
      type: 'REWARD',
      currency: 'DIAMONDS',
      amount: ach.rewardDiamonds,
      description: `Unlocked Achievement Reward: ${ach.title}`,
      status: 'COMPLETED'
    });
  };

  const equipCustomization = (customizationId: string) => {
    const item = customizations.find(c => c.id === customizationId);
    if (!item || !item.isUnlocked) return;

    const updated = customizations.map(c => {
      if (c.category === item.category) {
        return { ...c, isEquipped: c.id === customizationId };
      }
      return c;
    });

    setCustomizations(updated);
    persistEconomyState({ customizations: updated });

    setUserLevel(prev => {
      const updatedUser = { ...prev };
      if (item.category === 'FRAME') updatedUser.equippedFrameId = customizationId;
      if (item.category === 'ENTRANCE_EFFECT') updatedUser.equippedEntranceEffectId = customizationId;
      if (item.category === 'TITLE') updatedUser.equippedTitleId = customizationId;
      if (item.category === 'BADGE') updatedUser.equippedVipBadgeId = customizationId;
      return updatedUser;
    });
  };

  const claimLevelReward = (level: number, category: string) => {
    const target = levelRewards.find(r => r.level === level && r.category === category);
    if (!target || target.claimed) return;

    const updated = levelRewards.map(r => (r.level === level && r.category === category) ? { ...r, claimed: true } : r);
    setLevelRewards(updated);
    persistEconomyState({ levelRewards: updated });

    setWallet(prev => ({
      ...prev,
      coins: prev.coins + target.rewardCoins,
      diamonds: prev.diamonds + target.rewardDiamonds
    }));

    addXp(500);

    addTransaction({
      type: 'REWARD',
      currency: 'COINS',
      amount: target.rewardCoins,
      description: `Claimed Level ${level} Milestone Reward (+${target.rewardCoins} Coins & +${target.rewardDiamonds} Diamonds)`,
      status: 'COMPLETED'
    });
  };

  const updateNotificationPreferences = (prefs: Partial<NotificationPreferences>) => {
    setNotificationPreferences(prev => {
      const updated = { ...prev, ...prefs };
      persistEconomyState({ notificationPreferences: updated });
      return updated;
    });
  };

  const addScheduledStream = (streamData: Omit<ScheduledStream, 'id'>) => {
    const newStream: ScheduledStream = {
      ...streamData,
      id: `sched_${Date.now()}`
    };
    const updated = [newStream, ...scheduledStreams];
    setScheduledStreams(updated);
    persistEconomyState({ scheduledStreams: updated });

    triggerPushNotification('📅 Stream Scheduled!', `Your live stream "${newStream.title}" is published for ${newStream.scheduledTime}.`);
  };

  const triggerPushNotification = (title: string, body: string) => {
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      category: 'SYSTEM_ANNOUNCEMENT',
      title,
      body,
      timestamp: 'Just now',
      read: false
    };

    setNotifications(prev => [newNotif, ...prev]);
  };

  const sendLiveInvite = (hostName: string, roomId: string) => {
    const inviteNotif: NotificationItem = {
      id: `invite_${Date.now()}`,
      category: 'LIVE_INVITE',
      title: `🎙️ Live Room Co-Host Invitation from ${hostName}`,
      body: `${hostName} invited you to take a mic seat in Live Room #${roomId}!`,
      timestamp: 'Just now',
      read: false,
      inviteDetails: {
        roomId,
        hostName
      }
    };
    setNotifications(prev => [inviteNotif, ...prev]);
  };

  const sendPkInvite = (opponentName: string, durationSeconds: number = 300) => {
    const inviteNotif: NotificationItem = {
      id: `pk_invite_${Date.now()}`,
      category: 'PK_INVITE',
      title: `⚔️ Live PK Battle Challenge from ${opponentName}`,
      body: `${opponentName} challenged you to a ${Math.round(durationSeconds / 60)}-minute live PK battle!`,
      timestamp: 'Just now',
      read: false,
      inviteDetails: {
        hostName: opponentName,
        pkDurationSeconds: durationSeconds
      }
    };
    setNotifications(prev => [inviteNotif, ...prev]);
  };

  const openTreasureBox = () => {
    if (treasureBox.isUnlocked) return;

    setWallet(prev => ({
      ...prev,
      coins: prev.coins + treasureBox.rewardCoins,
      points: prev.points + treasureBox.rewardPoints
    }));

    addXp(400);

    setTreasureBox(prev => ({ ...prev, isUnlocked: true }));

    addTransaction({
      type: 'REWARD',
      currency: 'COINS',
      amount: treasureBox.rewardCoins,
      description: `Opened ${treasureBox.title} (+${treasureBox.rewardCoins} Coins & +${treasureBox.rewardPoints} Points)`,
      status: 'COMPLETED'
    });
  };

  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [redPacket, setRedPacket] = useState<RedPacket>(INITIAL_RED_PACKET);
  const [aiMessages, setAiMessages] = useState<AiAssistantMessage[]>(INITIAL_AI_MESSAGES);
  const [families, setFamilies] = useState<Family[]>(INITIAL_FAMILIES);

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const claimRedPacket = (): number => {
    if (!redPacket.isRaining || redPacket.remainingCoins <= 0) return 0;

    const claimedAmount = Math.floor(Math.random() * 300) + 50;

    setRedPacket(prev => ({
      ...prev,
      remainingCoins: Math.max(0, prev.remainingCoins - claimedAmount),
      totalClaims: prev.totalClaims + 1,
      claimedUsers: [...prev.claimedUsers, 'Alex Rivers']
    }));

    setWallet(prev => ({
      ...prev,
      coins: prev.coins + claimedAmount
    }));

    addXp(100);

    addTransaction({
      type: 'REWARD',
      currency: 'COINS',
      amount: claimedAmount,
      description: `Claimed Red Packet Drop from ${redPacket.hostName} (+${claimedAmount} Coins)`,
      status: 'COMPLETED'
    });

    return claimedAmount;
  };

  const sendAiAssistantQuery = (text: string) => {
    const userMsg: AiAssistantMessage = {
      id: `ai_${Date.now()}`,
      sender: 'USER',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAiMessages(prev => [...prev, userMsg]);

    // AI Response simulation
    setTimeout(() => {
      let aiText = "I checked Nexora's active streams & games for you!";
      let actionType: 'SUGGEST_STREAM' | 'SUGGEST_GAME' | 'TRANSLATE_CHAT' | 'MODERATE_NOTICE' | undefined = undefined;

      const lower = text.toLowerCase();
      if (lower.includes('live') || lower.includes('party') || lower.includes('stream') || lower.includes('recommend')) {
        aiText = "🔥 Check out Aria Nova's 9-Seat Party & Karaoke Room! Top gifter wins a Cyber Sports Car!";
        actionType = 'SUGGEST_STREAM';
      } else if (lower.includes('game') || lower.includes('ludo') || lower.includes('points')) {
        aiText = "🎲 Ludo Master PvP Table #3 is looking for a challenger with a 5,000 Points wager!";
        actionType = 'SUGGEST_GAME';
      } else if (lower.includes('translate') || lower.includes('spanish') || lower.includes('japanese')) {
        aiText = "🌐 Real-Time Chat Translator active! Translating all stream comments into English.";
        actionType = 'TRANSLATE_CHAT';
      } else {
        aiText = `Got it! As your Nexora AI Companion, I can help you claim daily rewards, find top agency creators, or guide your stream moderation.`;
      }

      const aiReply: AiAssistantMessage = {
        id: `ai_${Date.now() + 1}`,
        sender: 'AI',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType
      };

      setAiMessages(prev => [...prev, aiReply]);
    }, 600);
  };

  const joinFamily = (familyId: string) => {
    setFamilies(prev => prev.map(f => {
      if (f.id === familyId) {
        return {
          ...f,
          isUserMember: true,
          membersCount: f.membersCount + 1
        };
      }
      return { ...f, isUserMember: false };
    }));

    const joinedFam = families.find(f => f.id === familyId);
    if (joinedFam) {
      setUserLevel(prev => ({
        ...prev,
        familyId: joinedFam.id,
        familyName: joinedFam.name
      }));
      addXp(200);
    }
  };

  return (
    <EconomyContext.Provider
      value={{
        authUser,
        authError,
        loginWithGoogle,
        loginWithFacebook,
        loginWithEmail,
        signUpWithEmail,
        logout,
        wallet,
        transactions,
        activeARGift,
        clearARGift,
        sendGift,
        rechargeCoins,
        convertCoinsToPoints,
        requestWithdrawal,
        updateGamePoints,
        purchaseProduct,
        purchaseDigitalGood,
        purchaseTicket,
        claimDailyBonus,
        dailyBonusClaimed,
        withdrawals,
        vipTier,
        referralCode,
        userLevel,
        addXp,
        dailyMissions,
        weeklyMissions,
        monthlyMissions,
        achievements,
        customizations,
        levelRewards,
        vipRooms,
        scheduledStreams,
        creatorGoals,
        notificationPreferences,
        claimMission,
        claimAchievement,
        equipCustomization,
        claimLevelReward,
        updateNotificationPreferences,
        addScheduledStream,
        sendLiveInvite,
        sendPkInvite,
        triggerPushNotification,
        treasureBox,
        openTreasureBox,
        notifications,
        markNotificationRead,
        clearAllNotifications,
        redPacket,
        claimRedPacket,
        aiMessages,
        sendAiAssistantQuery,
        families,
        joinFamily
      }}
    >
      {children}
    </EconomyContext.Provider>
  );
};

export const useEconomy = () => {
  const context = useContext(EconomyContext);
  if (!context) {
    throw new Error('useEconomy must be used within an EconomyProvider');
  }
  return context;
};
