import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  limit, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';

export interface FamilyDoc {
  id?: string;
  name: string;
  badge: string;
  logo: string;
  leaderId: string;
  leaderName: string;
  level: number;
  membersCount: number;
  maxMembers: number;
  monthlyDiamonds: number;
  rank: number;
  description: string;
  storeItems?: Array<{ id: string; name: string; costPoints: number; badgeIcon: string }>;
  missions?: Array<{ id: string; title: string; diamondGoal: number; currentDiamonds: number; rewardCoins: number; completed: boolean }>;
  createdAt: string;
}

export interface AgencyDoc {
  id?: string;
  name: string;
  logo: string;
  ownerId: string;
  ownerName: string;
  streamersCount: number;
  commissionRatePercent: number;
  monthlyRevenueUsd: number;
  verificationBadge: string;
  description: string;
  ranks?: Array<{ levelName: string; minDiamonds: number; bonusRate: number }>;
  createdAt: string;
}

export interface ApplicationDoc {
  id?: string;
  type: 'FAMILY' | 'AGENCY';
  targetGroupId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface PkBattleMatch {
  id?: string;
  type: 'FAMILY_PK' | 'AGENCY_PK';
  hostA: { id: string; name: string; score: number };
  hostB: { id: string; name: string; score: number };
  status: 'LIVE' | 'COMPLETED';
  timeLeftSeconds: number;
}

class GuildAgencyService {
  private familiesCollection = 'families';
  private agenciesCollection = 'agencies';
  private applicationsCollection = 'guild_applications';
  private pkCollection = 'guild_pk_battles';

  /**
   * Create a new Family
   */
  public async createFamily(data: {
    name: string;
    badge: string;
    logo: string;
    leaderId: string;
    leaderName: string;
    description: string;
  }): Promise<string> {
    const newFam: FamilyDoc = {
      name: data.name,
      badge: data.badge,
      logo: data.logo,
      leaderId: data.leaderId,
      leaderName: data.leaderName,
      level: 1,
      membersCount: 1,
      maxMembers: 50,
      monthlyDiamonds: 0,
      rank: 99,
      description: data.description,
      storeItems: [
        { id: 'item_1', name: '👑 Golden Crown Frame', costPoints: 500, badgeIcon: '👑' },
        { id: 'item-[2]', name: '🔥 Dragon Entrance Visual', costPoints: 1200, badgeIcon: '🐉' }
      ],
      missions: [
        { id: 'm_1', title: 'Stream 100 Hours Total', diamondGoal: 50000, currentDiamonds: 12500, rewardCoins: 10000, completed: false }
      ],
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, this.familiesCollection), {
      ...newFam,
      timestamp: serverTimestamp()
    });

    return docRef.id;
  }

  /**
   * Create a new Agency
   */
  public async createAgency(data: {
    name: string;
    logo: string;
    ownerId: string;
    ownerName: string;
    commissionRatePercent: number;
    description: string;
  }): Promise<string> {
    const newAgency: AgencyDoc = {
      name: data.name,
      logo: data.logo,
      ownerId: data.ownerId,
      ownerName: data.ownerName,
      streamersCount: 1,
      commissionRatePercent: data.commissionRatePercent || 15,
      monthlyRevenueUsd: 0,
      verificationBadge: 'Verified Global Agency',
      description: data.description,
      ranks: [
        { levelName: 'Bronze Tier Agency', minDiamonds: 10000, bonusRate: 2 },
        { levelName: 'Gold Tier Agency', minDiamonds: 100000, bonusRate: 5 },
        { levelName: 'Diamond Platinum Agency', minDiamonds: 1000000, bonusRate: 10 }
      ],
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, this.agenciesCollection), {
      ...newAgency,
      timestamp: serverTimestamp()
    });

    return docRef.id;
  }

  /**
   * Submit Member Application to Family or Agency
   */
  public async submitApplication(type: 'FAMILY' | 'AGENCY', targetGroupId: string, userId: string, userName: string, userAvatar: string): Promise<string> {
    const appDoc: ApplicationDoc = {
      type,
      targetGroupId,
      userId,
      userName,
      userAvatar,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, this.applicationsCollection), {
      ...appDoc,
      timestamp: serverTimestamp()
    });

    return docRef.id;
  }

  /**
   * Subscribe to Families List
   */
  public subscribeToFamilies(callback: (families: FamilyDoc[]) => void) {
    const q = query(collection(db, this.familiesCollection), limit(30));
    return onSnapshot(q, (snapshot) => {
      const list: FamilyDoc[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as FamilyDoc);
      });
      callback(list);
    }, (err) => console.warn('Families sub warning:', err));
  }

  /**
   * Subscribe to Agencies List
   */
  public subscribeToAgencies(callback: (agencies: AgencyDoc[]) => void) {
    const q = query(collection(db, this.agenciesCollection), limit(30));
    return onSnapshot(q, (snapshot) => {
      const list: AgencyDoc[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as AgencyDoc);
      });
      callback(list);
    }, (err) => console.warn('Agencies sub warning:', err));
  }
}

export const guildAgencyService = new GuildAgencyService();
