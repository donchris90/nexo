import { db } from '../lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
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

  public async joinRoom(roomId: string): Promise<void> {
    await updateDoc(doc(db, this.roomsCollection, roomId), {
      currentPlayers: increment(1)
    });
  }

  public async updateRoomStatus(roomId: string, status: GameRoom['status']): Promise<void> {
    await updateDoc(doc(db, this.roomsCollection, roomId), { status });
  }
}

export const gamingLobbyService = new GamingLobbyService();
