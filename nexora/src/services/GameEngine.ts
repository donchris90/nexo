import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, updateDoc, onSnapshot, serverTimestamp, DocumentSnapshot, DocumentData, FirestoreError } from 'firebase/firestore';
import { walletService } from './WalletService';
import { GameDefinition, GameCategory } from '../types';
import { getBuiltInGameModules } from './GameRegistry';

export interface GamePlayer {
  userId: string;
  userName: string;
  avatar?: string;
  score: number;
  status: 'READY' | 'PLAYING' | 'FINISHED';
  customData?: Record<string, any>;
}

export interface EngineGameSession {
  id: string;
  gameId: string;
  gameName: string;
  category: GameCategory;
  players: GamePlayer[];
  currentTurnUserId: string;
  wagerPoints: number;
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
  winnerUserId?: string;
  gameStateData: Record<string, any>;
  historyLogs: string[];
  createdAt: string;
  liveRoomId?: string;
}

export interface IGameSDK {
  playEffectSound: (soundName: string) => void;
  broadcastLiveGameUpdate: (roomId: string, message: string) => void;
  deductWager: (userId: string, amount: number, gameName: string) => Promise<boolean>;
  payoutWinnings: (userId: string, amount: number, gameName: string) => Promise<boolean>;
}

export interface IGameModule {
  id: string;
  definition: GameDefinition;
  initSessionState: (players: GamePlayer[]) => Record<string, any>;
  onTurnMove: (currentState: Record<string, any>, userId: string, move: any) => { nextState: Record<string, any>; nextTurnUserId: string; winnerUserId?: string; logMessage: string };
}

export class GameEngine {
  private modules: Map<string, IGameModule> = new Map();
  private collectionName = 'game_sessions';

  constructor() {
    try {
      const builtIns = getBuiltInGameModules();
      builtIns.forEach(m => this.registerModule(m));
    } catch (e) {
      console.warn('GameEngine module initialization error:', e);
    }
  }

  // Standard SDK helper for plugins
  public sdk: IGameSDK = {
    playEffectSound: (soundName: string) => {
      console.log(`[GameSDK] Playing sound: ${soundName}`);
    },
    broadcastLiveGameUpdate: (roomId: string, message: string) => {
      console.log(`[GameSDK] Broadcast to live room ${roomId}: ${message}`);
    },
    deductWager: async (userId: string, amount: number, gameName: string) => {
      if (amount <= 0) return true;
      try {
        await walletService.appendLedgerEntry({
          userId,
          type: 'GAME_WAGER',
          currency: 'POINTS',
          amount: -amount,
          description: `Wager entry for ${gameName}`,
          status: 'COMPLETED',
          timestamp: new Date().toISOString()
        });
        return true;
      } catch (e) {
        console.warn('Wager deduction failed:', e);
        return false;
      }
    },
    payoutWinnings: async (userId: string, amount: number, gameName: string) => {
      if (amount <= 0) return true;
      try {
        await walletService.appendLedgerEntry({
          userId,
          type: 'GAME_WIN',
          currency: 'POINTS',
          amount,
          description: `Victory prize pool in ${gameName}`,
          status: 'COMPLETED',
          timestamp: new Date().toISOString()
        });
        return true;
      } catch (e) {
        console.warn('Payout failed:', e);
        return false;
      }
    }
  };

  /**
   * Register a game module plugin into the core engine
   */
  public registerModule(module: IGameModule): void {
    this.modules.set(module.id, module);
  }

  public getModule(gameId: string): IGameModule | undefined {
    return this.modules.get(gameId);
  }

  public getAllDefinitions(): GameDefinition[] {
    return Array.from(this.modules.values()).map(m => m.definition);
  }

  public getDefinitionsByCategory(category: GameCategory): GameDefinition[] {
    return this.getAllDefinitions().filter(d => d.category === category);
  }

  /**
   * Create a new match session powered by the registered GameModule
   */
  public async createMatch(
    gameId: string,
    hostUser: { id: string; name: string; avatar?: string },
    wagerPoints: number = 0,
    liveRoomId?: string
  ): Promise<string> {
    const module = this.getModule(gameId);
    if (!module) throw new Error(`Game module '${gameId}' is not registered in Nexora Game Engine.`);

    const sessionId = `match_${gameId.toLowerCase()}_${Date.now()}`;
    const initialPlayers: GamePlayer[] = [
      { userId: hostUser.id, userName: hostUser.name, avatar: hostUser.avatar, score: 0, status: 'READY' }
    ];

    const initialGameState = module.initSessionState(initialPlayers);

    const sessionData: EngineGameSession = {
      id: sessionId,
      gameId,
      gameName: module.definition.name,
      category: module.definition.category,
      players: initialPlayers,
      currentTurnUserId: hostUser.id,
      wagerPoints,
      status: 'WAITING',
      gameStateData: initialGameState,
      historyLogs: [`Match initialized by ${hostUser.name}`],
      createdAt: new Date().toISOString(),
      liveRoomId
    };

    const docRef = doc(db, this.collectionName, sessionId);
    await setDoc(docRef, { ...sessionData, createdAtTimestamp: serverTimestamp() });

    if (wagerPoints > 0) {
      await this.sdk.deductWager(hostUser.id, wagerPoints, module.definition.name);
    }

    return sessionId;
  }

  /**
   * Join an existing match
   */
  public async joinMatch(sessionId: string, player: { id: string; name: string; avatar?: string }): Promise<void> {
    const docRef = doc(db, this.collectionName, sessionId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Match session not found');

    const session = snap.data() as EngineGameSession;
    const module = this.getModule(session.gameId);

    if (session.players.some(p => p.userId === player.id)) {
      return; // Already joined
    }

    if (module && session.players.length >= module.definition.maxPlayers) {
      throw new Error('Match room is full');
    }

    const updatedPlayers: GamePlayer[] = [
      ...session.players,
      { userId: player.id, userName: player.name, avatar: player.avatar, score: 0, status: 'READY' }
    ];

    const isFull = module ? updatedPlayers.length >= module.definition.minPlayers : true;

    await updateDoc(docRef, {
      players: updatedPlayers,
      status: isFull ? 'IN_PROGRESS' : session.status,
      historyLogs: [...(session.historyLogs || []), `${player.name} joined the room.`]
    });

    if (session.wagerPoints > 0 && module) {
      await this.sdk.deductWager(player.id, session.wagerPoints, module.definition.name);
    }
  }

  /**
   * Execute player move via modular engine processing
   */
  public async submitMove(sessionId: string, userId: string, movePayload: any): Promise<void> {
    const docRef = doc(db, this.collectionName, sessionId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Session not found');

    const session = snap.data() as EngineGameSession;
    const module = this.getModule(session.gameId);
    if (!module) throw new Error('Game module definition missing');

    const { nextState, nextTurnUserId, winnerUserId, logMessage } = module.onTurnMove(
      session.gameStateData,
      userId,
      movePayload
    );

    const isFinished = !!winnerUserId;
    const newLogs = [...(session.historyLogs || []), logMessage];

    await updateDoc(docRef, {
      gameStateData: nextState,
      currentTurnUserId: nextTurnUserId || session.currentTurnUserId,
      status: isFinished ? 'FINISHED' : session.status,
      winnerUserId: winnerUserId || null,
      historyLogs: newLogs
    });

    if (isFinished && winnerUserId) {
      const prizePool = session.wagerPoints * session.players.length;
      if (prizePool > 0) {
        await this.sdk.payoutWinnings(winnerUserId, prizePool, session.gameName);
      }
    }
  }

  /**
   * Cancel match and refund all joined players' wagers
   */
  public async cancelMatch(sessionId: string, requestingUserId: string): Promise<void> {
    const docRef = doc(db, this.collectionName, sessionId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const session = snap.data() as EngineGameSession;
    if (session.status === 'FINISHED') return;

    await updateDoc(docRef, {
      status: 'FINISHED',
      historyLogs: [...(session.historyLogs || []), `Match cancelled by user.`]
    });

    if (session.wagerPoints > 0) {
      for (const player of session.players) {
        await this.sdk.payoutWinnings(player.userId, session.wagerPoints, `${session.gameName} Refund`);
      }
    }
  }

  /**
   * Leave match (handles forfeiture/refund if waiting)
   */
  public async leaveMatch(sessionId: string, userId: string): Promise<void> {
    const docRef = doc(db, this.collectionName, sessionId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const session = snap.data() as EngineGameSession;
    const remainingPlayers = session.players.filter(p => p.userId !== userId);

    if (session.status === 'WAITING') {
      // Waiting room: refund leaving player
      if (session.wagerPoints > 0) {
        await this.sdk.payoutWinnings(userId, session.wagerPoints, `${session.gameName} Cancellation Refund`);
      }

      if (remainingPlayers.length === 0) {
        await updateDoc(docRef, { status: 'FINISHED' });
      } else {
        await updateDoc(docRef, {
          players: remainingPlayers,
          currentTurnUserId: remainingPlayers[0].userId,
          historyLogs: [...(session.historyLogs || []), `Player left waiting lobby.`]
        });
      }
    } else if (session.status === 'IN_PROGRESS') {
      // In progress: forfeit match to remaining player if only 1 remains
      if (remainingPlayers.length === 1) {
        const winner = remainingPlayers[0];
        const prizePool = session.wagerPoints * session.players.length;
        await updateDoc(docRef, {
          players: remainingPlayers,
          status: 'FINISHED',
          winnerUserId: winner.userId,
          historyLogs: [...(session.historyLogs || []), `${userId} forfeited. Winner: ${winner.userName}`]
        });

        if (prizePool > 0) {
          await this.sdk.payoutWinnings(winner.userId, prizePool, session.gameName);
        }
      }
    }
  }

  /**
   * Real-time match state listener
   */
  public subscribeToSession(sessionId: string, callback: (session: EngineGameSession | null) => void) {
    const docRef = doc(db, this.collectionName, sessionId);
    return onSnapshot(docRef, (snap: DocumentSnapshot<DocumentData>) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as EngineGameSession);
      } else {
        callback(null);
      }
    }, (err: FirestoreError) => {
      console.warn('Game engine snapshot warning:', err);
    });
  }
}

export const gameEngine = new GameEngine();

