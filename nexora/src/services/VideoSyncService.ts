import { db } from '../lib/firebase';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { VideoSyncState } from '../types';

export class VideoSyncService {
  private collectionName = 'streams';

  /**
   * Broadcast Host's live video player state change to Firestore
   */
  public async broadcastHostVideoState(streamId: string, state: Partial<VideoSyncState>): Promise<void> {
    if (!streamId) return;

    try {
      const syncDocRef = doc(db, this.collectionName, streamId, 'live_data', 'video_sync');
      
      const payload: Partial<VideoSyncState> = {
        ...state,
        streamId,
        lastUpdatedTimestamp: Date.now()
      };

      await setDoc(syncDocRef, {
        ...payload,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn('[VideoSyncService] broadcastHostVideoState notice:', err);
    }
  }

  /**
   * Real-time listener for viewers to receive host video playback changes
   */
  public subscribeToStreamVideoSync(
    streamId: string, 
    onSyncUpdated: (syncState: VideoSyncState | null) => void
  ) {
    if (!streamId) return () => {};

    const syncDocRef = doc(db, this.collectionName, streamId, 'live_data', 'video_sync');
    
    return onSnapshot(syncDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as VideoSyncState;
        
        // Calculate exact real-time playback position for late joiners
        let realTimePosition = data.playbackPosition || 0;
        if (data.isPlaying && data.lastUpdatedTimestamp) {
          const elapsedSeconds = (Date.now() - data.lastUpdatedTimestamp) / 1000;
          if (elapsedSeconds > 0 && elapsedSeconds < 14400) { // max 4 hours video
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
      console.warn('[VideoSyncService] Sync subscription error:', err);
    });
  }

  /**
   * Stop video sync when stream ends
   */
  public async clearStreamVideoSync(streamId: string): Promise<void> {
    if (!streamId) return;
    try {
      const syncDocRef = doc(db, this.collectionName, streamId, 'live_data', 'video_sync');
      await updateDoc(syncDocRef, {
        isPlaying: false,
        currentVideoId: null,
        videoUrl: '',
        lastUpdatedTimestamp: Date.now()
      });
    } catch (err) {
      console.warn('[VideoSyncService] clearStreamVideoSync notice:', err);
    }
  }
}

export const videoSyncService = new VideoSyncService();
