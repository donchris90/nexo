import { db } from '../lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  limit,
  onSnapshot,
  runTransaction,
  QuerySnapshot,
  DocumentData,
  FirestoreError
} from 'firebase/firestore';
import { LiveStream, GiftItem, PartySeat } from '../types';
import { MOCK_STREAMS } from '../data/mockData';

export interface SeatGuest {
  uid: string;
  userName: string;
  userAvatar: string;
  userLevel?: number;
}

class LiveStreamService {
  private streamsCollection = 'streams';
  private giftsCollection = 'gift_catalog';

  /**
   * Subscribe to real-time list of live streams (only active live streams)
   */
  public subscribeToStreams(callback: (streams: LiveStream[]) => void, streamLimit = 50) {
    const q = query(collection(db, this.streamsCollection), limit(streamLimit));
    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const streams: LiveStream[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as LiveStream;
          if (data.isLive !== false) {
            streams.push({ id: docSnap.id, ...data });
          }
        });
        if (streams.length > 0) {
          callback(streams);
        } else {
          callback(MOCK_STREAMS.filter(s => s.isLive !== false));
        }
      },
      (err: FirestoreError) => {
        console.warn('Streams subscription warning:', err);
        callback(MOCK_STREAMS.filter(s => s.isLive !== false));
      }
    );
  }

  /**
   * Subscribe to the gift catalog (admin-managed, rarely changes)
   */
  public subscribeToGiftCatalog(callback: (gifts: GiftItem[]) => void) {
    const q = query(collection(db, this.giftsCollection), limit(200));
    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const gifts: GiftItem[] = [];
        snapshot.forEach((docSnap) => {
          gifts.push({ id: docSnap.id, ...docSnap.data() } as GiftItem);
        });
        callback(gifts);
      },
      (err: FirestoreError) => console.warn('Gift catalog subscription warning:', err)
    );
  }

  /**
   * Create a new live stream / party room
   */
  public async createStream(stream: Omit<LiveStream, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, this.streamsCollection), stream);
    return docRef.id;
  }

  public async updateStream(streamId: string, updates: Partial<LiveStream>): Promise<void> {
    await updateDoc(doc(db, this.streamsCollection, streamId), updates as DocumentData);
  }

  public async endStream(streamId: string): Promise<void> {
    await updateDoc(doc(db, this.streamsCollection, streamId), { isLive: false });
  }

  public async deleteStream(streamId: string): Promise<void> {
    await deleteDoc(doc(db, this.streamsCollection, streamId));
  }

  /**
   * Atomically seat a guest into a specific open seat. Fails (returns false) if the seat
   * is already occupied or the guest already holds another seat, so two concurrent
   * "sit down" taps can never both succeed on the same seat.
   */
  public async takeSeat(streamId: string, seatNumber: number, guest: SeatGuest): Promise<boolean> {
    const streamRef = doc(db, this.streamsCollection, streamId);
    return runTransaction(db, async (tx) => {
      const snap = await tx.get(streamRef);
      if (!snap.exists()) return false;
      const stream = snap.data() as LiveStream;
      const seats = stream.seats ? [...stream.seats] : [];

      const alreadySeated = seats.some(s => s.uid === guest.uid);
      if (alreadySeated) return false;

      const idx = seats.findIndex(s => s.seatNumber === seatNumber);
      if (idx === -1 || seats[idx].userName) return false;

      seats[idx] = {
        ...seats[idx],
        seatNumber,
        uid: guest.uid,
        userName: guest.userName,
        userAvatar: guest.userAvatar,
        userLevel: guest.userLevel,
        isMuted: false,
        isCameraOn: true,
        seatGiftsCoins: seats[idx].seatGiftsCoins || 0
      };

      tx.update(streamRef, { seats });
      return true;
    });
  }

  /**
   * Atomically assign a guest to the next open seat (used by the moderated
   * approve-to-join flow, where the host doesn't pick a specific seat number).
   * Returns the assigned seat number, or null if the room is full or the guest is
   * already seated.
   */
  public async assignNextOpenSeat(streamId: string, guest: SeatGuest): Promise<number | null> {
    const streamRef = doc(db, this.streamsCollection, streamId);
    return runTransaction(db, async (tx) => {
      const snap = await tx.get(streamRef);
      if (!snap.exists()) return null;
      const stream = snap.data() as LiveStream;
      const seats = stream.seats ? [...stream.seats] : [];

      const existingSeat = seats.find(s => s.uid === guest.uid);
      if (existingSeat) return existingSeat.seatNumber;

      const idx = seats.findIndex(s => !s.userName);
      if (idx === -1) return null;

      seats[idx] = {
        ...seats[idx],
        uid: guest.uid,
        userName: guest.userName,
        userAvatar: guest.userAvatar,
        userLevel: guest.userLevel,
        isMuted: false,
        isCameraOn: true,
        seatGiftsCoins: seats[idx].seatGiftsCoins || 0
      };

      tx.update(streamRef, { seats });
      return seats[idx].seatNumber;
    });
  }

  /**
   * Clear whichever seat a given uid occupies (self-service "leave seat").
   */
  public async leaveSeat(streamId: string, uid: string): Promise<void> {
    const streamRef = doc(db, this.streamsCollection, streamId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(streamRef);
      if (!snap.exists()) return;
      const stream = snap.data() as LiveStream;
      const seats = stream.seats ? [...stream.seats] : [];
      const idx = seats.findIndex(s => s.uid === uid);
      if (idx === -1) return;

      seats[idx] = { seatNumber: seats[idx].seatNumber, isHost: seats[idx].isHost };
      tx.update(streamRef, { seats });
    });
  }

  /**
   * Host-initiated removal of whoever occupies a seat (kick). Also clearable by uid.
   */
  public async clearSeat(streamId: string, seatNumber: number): Promise<PartySeat | null> {
    const streamRef = doc(db, this.streamsCollection, streamId);
    return runTransaction(db, async (tx) => {
      const snap = await tx.get(streamRef);
      if (!snap.exists()) return null;
      const stream = snap.data() as LiveStream;
      const seats = stream.seats ? [...stream.seats] : [];
      const idx = seats.findIndex(s => s.seatNumber === seatNumber);
      if (idx === -1 || !seats[idx].userName) return null;

      const removed = seats[idx];
      seats[idx] = { seatNumber, isHost: removed.isHost };
      tx.update(streamRef, { seats });
      return removed;
    });
  }

  public async setSeatMuted(streamId: string, seatNumber: number, isMuted: boolean): Promise<void> {
    const streamRef = doc(db, this.streamsCollection, streamId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(streamRef);
      if (!snap.exists()) return;
      const stream = snap.data() as LiveStream;
      const seats = stream.seats ? [...stream.seats] : [];
      const idx = seats.findIndex(s => s.seatNumber === seatNumber);
      if (idx === -1) return;
      seats[idx] = { ...seats[idx], isMuted };
      tx.update(streamRef, { seats });
    });
  }
}

export const liveStreamService = new LiveStreamService();
