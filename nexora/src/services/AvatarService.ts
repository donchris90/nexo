import { db } from '../lib/firebase';
import {
  collection,
  addDoc,
  query,
  limit,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  FirestoreError
} from 'firebase/firestore';
import { AIAvatar } from '../types';

class AvatarService {
  private avatarsCollection = 'ai_avatars';

  public subscribeToAvatars(callback: (avatars: AIAvatar[]) => void, itemLimit = 100) {
    const q = query(collection(db, this.avatarsCollection), limit(itemLimit));
    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const avatars: AIAvatar[] = [];
        snapshot.forEach((docSnap) => avatars.push({ id: docSnap.id, ...docSnap.data() } as AIAvatar));
        callback(avatars);
      },
      (err: FirestoreError) => console.warn('Avatars subscription warning:', err)
    );
  }

  public async createAvatar(avatar: Omit<AIAvatar, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, this.avatarsCollection), avatar);
    return docRef.id;
  }
}

export const avatarService = new AvatarService();
