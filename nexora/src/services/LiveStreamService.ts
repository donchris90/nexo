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
  QuerySnapshot,
  DocumentData,
  FirestoreError
} from 'firebase/firestore';
import { LiveStream, GiftItem } from '../types';

class LiveStreamService {
  private streamsCollection = 'streams';
  private giftsCollection = 'gift_catalog';

  /**
   * Subscribe to real-time list of live streams
   */
  public subscribeToStreams(callback: (streams: LiveStream[]) => void, streamLimit = 50) {
    const q = query(collection(db, this.streamsCollection), limit(streamLimit));
    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const streams: LiveStream[] = [];
        snapshot.forEach((docSnap) => {
          streams.push({ id: docSnap.id, ...docSnap.data() } as LiveStream);
        });
        callback(streams);
      },
      (err: FirestoreError) => console.warn('Streams subscription warning:', err)
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
}

export const liveStreamService = new LiveStreamService();
