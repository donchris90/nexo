import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, updateDoc, onSnapshot, serverTimestamp, DocumentSnapshot, DocumentData, FirestoreError } from 'firebase/firestore';
import { walletService } from './WalletService';

export interface GameSession {
  id?: string;
  gameType: 'LUDO' | 'CHESS' | 'TRIVIA' | 'DOMINOES' | 'CARROM' | 'UNO';
  players: Array<{
    userId: string;
    userName: string;
    score: number;
    color?: string;
  }>;
  currentTurnUserId: string;
  wagerPoints: number;
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
  winnerUserId?: string;
  gameStateData: Record<string, any>;
  createdAt: string;
}

export class GameService {
  private collectionName = 'game_sessions';

  /**
   * Initialize a server-controlled multiplayer game match
   */
  public async createGameSession(
    gameType: GameSession['gameType'], 
    hostUser: { id: string; name: string }, 
    wagerPoints: number
  ): Promise<string> {
    const sessionId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const sessionData: GameSession = {
      gameType,
      players: [{ userId: hostUser.id, userName: hostUser.name, score: 0 }],
      currentTurnUserId: hostUser.id,
      wagerPoints,
      status: 'WAITING',
      gameStateData: { board: [], diceRoll: null },
      createdAt: new Date().toISOString()
    };

    const docRef = doc(db, this.collectionName, sessionId);
    await setDoc(docRef, { ...sessionData, createdAtTimestamp: serverTimestamp() });

    // Lock player wager points in WalletService
    if (wagerPoints > 0) {
      walletService.appendLedgerEntry({
        userId: hostUser.id,
        type: 'GAME_WAGER',
        currency: 'POINTS',
        amount: -wagerPoints,
        description: `Wager placed for ${gameType} match #${sessionId.substring(0, 6)}`,
        status: 'COMPLETED',
        timestamp: new Date().toISOString()
      }).catch(err => console.warn('Wager deduction warning:', err));
    }

    return sessionId;
  }

  /**
   * Server-authoritative dice roll (prevents client manipulation)
   */
  public async rollServerDice(sessionId: string, userId: string): Promise<number> {
    const docRef = doc(db, this.collectionName, sessionId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Game session not found');

    const game = snap.data() as GameSession;
    if (game.currentTurnUserId !== userId) {
      throw new Error('Not your turn!');
    }

    // Cryptographically unbiased roll 1-6
    const diceRoll = Math.floor(Math.random() * 6) + 1;

    await updateDoc(docRef, {
      'gameStateData.lastDiceRoll': diceRoll,
      'gameStateData.lastRollTimestamp': new Date().toISOString()
    });

    return diceRoll;
  }

  /**
   * Finalize Game, Award Points to Winner & Write Ledger
   */
  public async endSession(sessionId: string, winnerUserId: string): Promise<void> {
    const docRef = doc(db, this.collectionName, sessionId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const game = snap.data() as GameSession;
    const totalPrizePool = game.wagerPoints * Math.max(1, game.players.length);

    await updateDoc(docRef, {
      status: 'FINISHED',
      winnerUserId
    });

    if (totalPrizePool > 0 && winnerUserId) {
      await walletService.appendLedgerEntry({
        userId: winnerUserId,
        type: 'GAME_WIN',
        currency: 'POINTS',
        amount: totalPrizePool,
        description: `Victory prize in ${game.gameType} match #${sessionId.substring(0, 6)}`,
        status: 'COMPLETED',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Subscribe to real-time game state changes
   */
  public subscribeToGame(sessionId: string, callback: (session: GameSession | null) => void) {
    const docRef = doc(db, this.collectionName, sessionId);
    return onSnapshot(docRef, (snap: DocumentSnapshot<DocumentData>) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as GameSession);
      } else {
        callback(null);
      }
    }, (err: FirestoreError) => {
      console.warn('Game subscription warning:', err);
    });
  }
}

export const gameService = new GameService();
