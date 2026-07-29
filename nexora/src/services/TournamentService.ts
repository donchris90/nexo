import { db } from '../lib/firebase';
import { collection, doc, setDoc, getDoc, updateDoc, onSnapshot, query, where, increment } from 'firebase/firestore';
import { Tournament } from '../types';
import { walletService } from './WalletService';

export class TournamentService {
  private collectionName = 'tournaments';

  /**
   * Initial mock/live seed tournaments if database empty
   */
  public getDefaultTournaments(): Tournament[] {
    return [
      {
        id: 'tourn_ludo_champ',
        title: '🏆 Nexora Ludo Master Championship 2026',
        gameId: 'LUDO',
        category: 'CASUAL',
        prizePoolCoins: 50000,
        prizePoolPoints: 250000,
        entryFeePoints: 1000,
        startTime: 'Today, 20:00 UTC',
        registeredCount: 142,
        maxParticipants: 256,
        status: 'UPCOMING',
        bannerImage: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=600&q=80',
        rules: [
          'Knockout tournament format with 4 players per match.',
          'Top 1 player advances to the next round.',
          'Grand prize: 50,000 Coins + VIP Golden Badge + 250k Points.'
        ]
      },
      {
        id: 'tourn_trivia_blitz',
        title: '🧠 AI Speed Trivia Tournament',
        gameId: 'TRIVIA_QUIZ',
        category: 'PARTY',
        prizePoolCoins: 25000,
        prizePoolPoints: 100000,
        entryFeePoints: 500,
        startTime: 'Live Now!',
        registeredCount: 88,
        maxParticipants: 100,
        status: 'LIVE',
        bannerImage: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&w=600&q=80',
        rules: [
          'Answer 20 AI Trivia questions within 10 seconds each.',
          'Highest speed accuracy score wins the grand prize pool.'
        ]
      },
      {
        id: 'tourn_pk_gifting',
        title: '⚔️ Global PK Gifting World Cup',
        gameId: 'COIN_FLIP',
        category: 'PK',
        prizePoolCoins: 150000,
        prizePoolPoints: 500000,
        entryFeePoints: 2500,
        startTime: 'Tomorrow, 18:00 UTC',
        registeredCount: 45,
        maxParticipants: 64,
        status: 'UPCOMING',
        bannerImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80',
        rules: [
          'Head-to-head PK gifting battle rounds.',
          'Winner moves to quarterfinals and finals live broadcast.'
        ]
      }
    ];
  }

  /**
   * Subscribe to real-time tournaments list
   */
  public subscribeToTournaments(callback: (tournaments: Tournament[]) => void) {
    const q = query(collection(db, this.collectionName));
    return onSnapshot(q, (snap) => {
      if (snap.empty) {
        callback(this.getDefaultTournaments());
      } else {
        const items: Tournament[] = [];
        snap.forEach(docSnap => {
          items.push({ id: docSnap.id, ...docSnap.data() } as Tournament);
        });
        callback(items);
      }
    }, () => {
      callback(this.getDefaultTournaments());
    });
  }

  /**
   * Register user into a tournament
   */
  public async registerUser(tournamentId: string, userId: string, entryFeePoints: number): Promise<boolean> {
    try {
      if (entryFeePoints > 0) {
        await walletService.appendLedgerEntry({
          userId,
          type: 'GAME_WAGER',
          currency: 'POINTS',
          amount: -entryFeePoints,
          description: `Tournament registration fee for #${tournamentId}`,
          status: 'COMPLETED',
          timestamp: new Date().toISOString()
        });
      }

      const docRef = doc(db, this.collectionName, tournamentId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, {
          registeredCount: increment(1)
        });
      }
      return true;
    } catch (e) {
      console.warn('Tournament registration warning:', e);
      return false;
    }
  }
}

export const tournamentService = new TournamentService();
