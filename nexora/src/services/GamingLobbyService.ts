import { db } from '../lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  limit,
  onSnapshot,
  increment,
  QuerySnapshot,
  DocumentData,
  FirestoreError
} from 'firebase/firestore';
import { GameRoom } from '../types';

/**
 * Manages the public lobby list of joinable game rooms.
 * Distinct from GameService, which manages the live state of a single
 * in-progress match once a room has been joined.
 */
class GamingLobbyService {
  private roomsCollection = 'game_rooms';

  /**
   * Subscribe to real-time list of open/in-progress game rooms
   */
  public subscribeToRooms(callback: (rooms: GameRoom[]) => void, roomLimit = 50) {
    const q = query(
      collection(db, this.roomsCollection),
      where('status', 'in', ['WAITING', 'IN_PROGRESS']),
      limit(roomLimit)
    );
    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const rooms: GameRoom[] = [];
        snapshot.forEach((docSnap) => {
          rooms.push({ id: docSnap.id, ...docSnap.data() } as GameRoom);
        });
        callback(rooms);
      },
      (err: FirestoreError) => console.warn('Game rooms subscription warning:', err)
    );
  }

  public async createRoom(room: Omit<GameRoom, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, this.roomsCollection), room);
    return docRef.id;
  }

  /**
   * Create a private room with a 6-digit Invite Code
   */
  public async createPrivateRoom(room: Omit<GameRoom, 'id' | 'isPrivate' | 'roomCode'>): Promise<{ roomId: string; roomCode: string }> {
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    const docRef = await addDoc(collection(db, this.roomsCollection), {
      ...room,
      isPrivate: true,
      roomCode
    });
    return { roomId: docRef.id, roomCode };
  }

  /**
   * Join room by 6-digit invite code
   */
  public async joinByRoomCode(roomCode: string): Promise<GameRoom> {
    const q = query(
      collection(db, this.roomsCollection),
      where('roomCode', '==', roomCode),
      where('status', '==', 'WAITING'),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      throw new Error('Invalid or expired room code');
    }

    const roomDoc = snap.docs[0];
    await updateDoc(roomDoc.ref, {
      currentPlayers: increment(1)
    });

    return { id: roomDoc.id, ...roomDoc.data() } as GameRoom;
  }

  /**
   * Find an available Quick Match for a specific gameId & wager
   */
  public async findQuickMatch(gameId: string, maxWager: number = 1000): Promise<GameRoom | null> {
    const q = query(
      collection(db, this.roomsCollection),
      where('gameId', '==', gameId),
      where('status', '==', 'WAITING'),
      where('isPrivate', '==', false),
      limit(5)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const matchedDoc = snap.docs.find(d => {
      const r = d.data() as GameRoom;
      return r.currentPlayers < r.maxPlayers && r.minWagerPoints <= maxWager;
    });

    if (!matchedDoc) return null;

    await updateDoc(matchedDoc.ref, {
      currentPlayers: increment(1)
    });

    return { id: matchedDoc.id, ...matchedDoc.data() } as GameRoom;
  }

  public async joinRoom(roomId: string): Promise<void> {
    await updateDoc(doc(db, this.roomsCollection, roomId), {
      currentPlayers: increment(1)
    });
  }

  public async updateRoomStatus(roomId: string, status: GameRoom['status']): Promise<void> {
    await updateDoc(doc(db, this.roomsCollection, roomId), { status });
  }

  public async cancelRoom(roomId: string): Promise<void> {
    await updateDoc(doc(db, this.roomsCollection, roomId), {
      status: 'COMPLETED'
    });
  }
}

export const gamingLobbyService = new GamingLobbyService();

