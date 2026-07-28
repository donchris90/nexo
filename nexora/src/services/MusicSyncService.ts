import { db } from '../lib/firebase';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { MusicSyncState, MusicTrack } from '../types';

export class MusicSyncService {
  private collectionName = 'streams';

  /**
   * Broadcast Host's live music player state change to Firestore
   */
  public async broadcastHostMusicState(streamId: string, state: Partial<MusicSyncState>): Promise<void> {
    if (!streamId) return;

    try {
      const syncDocRef = doc(db, this.collectionName, streamId, 'live_data', 'music_sync');
      
      const payload: Partial<MusicSyncState> = {
        ...state,
        streamId,
        lastUpdatedTimestamp: Date.now()
      };

      await setDoc(syncDocRef, {
        ...payload,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn('[MusicSyncService] broadcastHostMusicState notice:', err);
    }
  }

  /**
   * Real-time listener for viewers to receive host music playback changes
   */
  public subscribeToStreamMusicSync(
    streamId: string, 
    onSyncUpdated: (syncState: MusicSyncState | null) => void
  ) {
    if (!streamId) return () => {};

    const syncDocRef = doc(db, this.collectionName, streamId, 'live_data', 'music_sync');
    
    return onSnapshot(syncDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as MusicSyncState;
        
        // Calculate exact real-time playback position for late joiners
        let realTimePosition = data.playbackPosition || 0;
        if (data.isPlaying && data.lastUpdatedTimestamp) {
          const elapsedSeconds = (Date.now() - data.lastUpdatedTimestamp) / 1000;
          if (elapsedSeconds > 0 && elapsedSeconds < 3600) {
            realTimePosition += elapsedSeconds;
          }
        }

        onSyncUpdated({
          ...data,
          playbackPosition: realTimePosition
        });
      } else {
        onSyncUpdated(null);
      }
    }, (err) => {
      console.warn('[MusicSyncService] Sync subscription error:', err);
    });
  }

  /**
   * Stop music sync when stream ends
   */
  public async clearStreamMusicSync(streamId: string): Promise<void> {
    if (!streamId) return;
    try {
      const syncDocRef = doc(db, this.collectionName, streamId, 'live_data', 'music_sync');
      await updateDoc(syncDocRef, {
        isPlaying: false,
        currentTrackId: null,
        audioUrl: '',
        lastUpdatedTimestamp: Date.now()
      });
    } catch (err) {
      console.warn('[MusicSyncService] clearStreamMusicSync notice:', err);
    }
  }
}

export const musicSyncService = new MusicSyncService();
