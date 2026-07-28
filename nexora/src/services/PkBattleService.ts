import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { walletService } from './WalletService';

export interface PkBattleMatch {
  id?: string;
  host1Id: string;
  host1Name: string;
  host1Avatar?: string;
  host1Score: number;
  
  host2Id: string;
  host2Name: string;
  host2Avatar?: string;
  host2Score: number;

  status: 'INVITED' | 'ACTIVE' | 'FINISHED' | 'DECLINED';
  battleType: 'SOLO' | 'TEAM' | 'FAMILY' | 'AGENCY' | 'COUNTRY';
  durationSeconds: number;
  remainingSeconds: number;
  winnerId?: string;
  createdAt: string;
  streamRoomId: string;
}

export class PkBattleService {
  private collectionName = 'pk_battles';

  /**
   * Initiate a PK Battle with another streamer/host
   */
  public async initiateBattle(params: {
    host1Id: string;
    host1Name: string;
    host1Avatar?: string;
    host2Id: string;
    host2Name: string;
    host2Avatar?: string;
    streamRoomId: string;
    battleType?: 'SOLO' | 'TEAM' | 'FAMILY' | 'AGENCY' | 'COUNTRY';
    durationSeconds?: number;
  }): Promise<string> {
    const matchData: PkBattleMatch = {
      host1Id: params.host1Id,
      host1Name: params.host1Name,
      host1Avatar: params.host1Avatar || '',
      host1Score: 0,
      host2Id: params.host2Id,
      host2Name: params.host2Name,
      host2Avatar: params.host2Avatar || '',
      host2Score: 0,
      status: 'ACTIVE',
      battleType: params.battleType || 'SOLO',
      durationSeconds: params.durationSeconds || 300,
      remainingSeconds: params.durationSeconds || 300,
      createdAt: new Date().toISOString(),
      streamRoomId: params.streamRoomId
    };

    const docRef = await addDoc(collection(db, this.collectionName), {
      ...matchData,
      createdTimestamp: serverTimestamp()
    });

    return docRef.id;
  }

  /**
   * Alias method for createChallenge
   */
  public async createChallenge(params: any): Promise<string> {
    return this.initiateBattle(params);
  }

  /**
   * Contribute score points to a host during a live PK battle
   */
  public async contributeScore(battleId: string, hostId: string, scoreAmount: number, contributorId?: string): Promise<void> {
    const battleRef = doc(db, this.collectionName, battleId);
    const snap = await getDoc(battleRef);
    if (!snap.exists()) return;

    const data = snap.data() as PkBattleMatch;
    if (data.status !== 'ACTIVE') return;

    if (data.host1Id === hostId) {
      await updateDoc(battleRef, {
        host1Score: (data.host1Score || 0) + scoreAmount
      });
    } else if (data.host2Id === hostId) {
      await updateDoc(battleRef, {
        host2Score: (data.host2Score || 0) + scoreAmount
      });
    }
  }

  /**
   * Alias for addGiftScore
   */
  public async addGiftScore(battleId: string, hostId: string, giftScorePoints: number, senderId?: string): Promise<void> {
    return this.contributeScore(battleId, hostId, giftScorePoints, senderId);
  }

  /**
   * Conclude battle, calculate winner based on real-time scores, and write reward ledger
   */
  public async calculateWinner(battleId: string): Promise<string> {
    const battleRef = doc(db, this.collectionName, battleId);
    const snap = await getDoc(battleRef);
    if (!snap.exists()) return 'DRAW';

    const data = snap.data() as PkBattleMatch;
    let winnerId = 'DRAW';

    if (data.host1Score > data.host2Score) {
      winnerId = data.host1Id;
    } else if (data.host2Score > data.host1Score) {
      winnerId = data.host2Id;
    }

    await updateDoc(battleRef, {
      status: 'FINISHED',
      winnerId,
      remainingSeconds: 0
    });

    if (winnerId !== 'DRAW') {
      walletService.rewardUser(
        winnerId,
        'DIAMONDS',
        500,
        `PK Battle Victory Bonus Match #${battleId.substring(0, 6)}`
      ).catch(err => console.warn('PkBattle reward warning:', err));
    }

    return winnerId;
  }

  /**
   * Alias for finishBattle
   */
  public async finishBattle(battleId: string): Promise<string> {
    return this.calculateWinner(battleId);
  }

  /**
   * Real-time Firestore snapshot listener for LiveStreamView components
   */
  public subscribeToBattle(battleId: string, callback: (match: PkBattleMatch | null) => void) {
    const battleRef = doc(db, this.collectionName, battleId);
    return onSnapshot(battleRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as PkBattleMatch);
      } else {
        callback(null);
      }
    });
  }
}

export const pkBattleService = new PkBattleService();
export const PKBattleService = PkBattleService;
