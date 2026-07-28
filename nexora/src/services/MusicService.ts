import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  increment, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  MusicTrack, 
  Playlist, 
  RecentlyPlayedTrack, 
  FavoriteTrack, 
  MusicReport 
} from '../types';

// Royalty-free demo tracks for immediate streaming fallback
export const SEEDED_MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'track-cyberpunk-drive',
    title: 'Cyberpunk Midnight Drive',
    artist: 'Kairos Neon',
    album: 'Synthwave Skyline',
    genre: 'Synthwave',
    duration: 214,
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=synthwave-80s-110045.mp3',
    uploadedBy: 'system',
    uploadedByName: 'Nexora Official',
    createdAt: new Date().toISOString(),
    playCount: 14200,
    likes: 890,
    isPublic: true,
    status: 'APPROVED'
  },
  {
    id: 'track-neon-horizon',
    title: 'Neon Horizon Live Beat',
    artist: 'DJ Pulse',
    album: 'Electric Beats Vol. 1',
    genre: 'EDM / Live',
    duration: 185,
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a730bf.mp3?filename=future-bass-15339.mp3',
    uploadedBy: 'system',
    uploadedByName: 'DJ Pulse',
    createdAt: new Date().toISOString(),
    playCount: 9800,
    likes: 640,
    isPublic: true,
    status: 'APPROVED'
  },
  {
    id: 'track-sunset-starlight',
    title: 'Synthwave Sunset Starlight',
    artist: 'Luna Vibes',
    album: 'Cosmic Chill',
    genre: 'Chillhop',
    duration: 198,
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=chill-lofi-song-8444.mp3',
    uploadedBy: 'system',
    uploadedByName: 'Luna Music Studio',
    createdAt: new Date().toISOString(),
    playCount: 18300,
    likes: 1250,
    isPublic: true,
    status: 'APPROVED'
  },
  {
    id: 'track-ambient-groove',
    title: 'Ambient Deep Space Lounge',
    artist: 'Astro Chill',
    album: 'Orion Beats',
    genre: 'Ambient',
    duration: 240,
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f3796d.mp3?filename=ambient-piano-124408.mp3',
    uploadedBy: 'system',
    uploadedByName: 'Astro Beats',
    createdAt: new Date().toISOString(),
    playCount: 7600,
    likes: 410,
    isPublic: true,
    status: 'APPROVED'
  }
];

export class MusicService {
  private tracksCollection = 'music_tracks';
  private playlistsCollection = 'playlists';
  private recentlyPlayedCollection = 'recently_played';
  private favoritesCollection = 'favorites';
  private reportsCollection = 'music_reports';

  /**
   * Fetch all approved music tracks with search/genre filter
   */
  public async getTracks(options?: {
    genre?: string;
    searchQuery?: string;
    includePrivate?: boolean;
    userId?: string;
  }): Promise<MusicTrack[]> {
    try {
      const q = query(
        collection(db, this.tracksCollection),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      
      let tracks: MusicTrack[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MusicTrack));

      // If Firestore database has no tracks yet, seed with default tracks
      if (tracks.length === 0) {
        tracks = [...SEEDED_MUSIC_TRACKS];
        // Save seeded tracks asynchronously to Firestore
        this.seedInitialTracks().catch(err => console.warn('Seeding initial music tracks notice:', err));
      }

      // Filter in memory for maximum search flexibility
      return tracks.filter(t => {
        if (!options?.includePrivate && t.isPrivate) {
          if (options?.userId && t.uploadedBy !== options.userId) return false;
        }
        if (options?.genre && options.genre !== 'All' && t.genre?.toLowerCase() !== options.genre.toLowerCase()) {
          return false;
        }
        if (options?.searchQuery) {
          const sq = options.searchQuery.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(sq);
          const matchArtist = t.artist.toLowerCase().includes(sq);
          const matchAlbum = t.album?.toLowerCase().includes(sq);
          if (!matchTitle && !matchArtist && !matchAlbum) return false;
        }
        return true;
      });
    } catch (err) {
      console.warn('[MusicService] Fallback to seeded music tracks due to Firestore connection:', err);
      return SEEDED_MUSIC_TRACKS;
    }
  }

  /**
   * Realtime subscription to approved public tracks
   */
  public subscribeToTracks(callback: (tracks: MusicTrack[]) => void) {
    try {
      const q = query(
        collection(db, this.tracksCollection),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      return onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          callback(SEEDED_MUSIC_TRACKS);
        } else {
          const tracks = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MusicTrack));
          callback(tracks);
        }
      }, (err) => {
        console.warn('[MusicService] Track subscription warning:', err);
        callback(SEEDED_MUSIC_TRACKS);
      });
    } catch (err) {
      callback(SEEDED_MUSIC_TRACKS);
      return () => {};
    }
  }

  /**
   * Seed initial demo tracks into Firestore if collection is empty
   */
  private async seedInitialTracks(): Promise<void> {
    for (const track of SEEDED_MUSIC_TRACKS) {
      const trackRef = doc(db, this.tracksCollection, track.id);
      await setDoc(trackRef, {
        ...track,
        createdTimestamp: serverTimestamp()
      }, { merge: true });
    }
  }

  /**
   * Add a new track entry to Firestore
   */
  public async createTrack(trackData: Omit<MusicTrack, 'id' | 'playCount' | 'likes' | 'createdAt'>): Promise<string> {
    const newTrack: Omit<MusicTrack, 'id'> = {
      ...trackData,
      playCount: 0,
      likes: 0,
      status: trackData.status || 'APPROVED',
      isPublic: trackData.isPublic ?? true,
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, this.tracksCollection), {
      ...newTrack,
      createdTimestamp: serverTimestamp()
    });

    return docRef.id;
  }

  /**
   * Increment track play count
   */
  public async incrementPlayCount(trackId: string): Promise<void> {
    try {
      const trackRef = doc(db, this.tracksCollection, trackId);
      await updateDoc(trackRef, {
        playCount: increment(1)
      });
    } catch (err) {
      console.warn('[MusicService] Play count update notice:', err);
    }
  }

  /**
   * Toggle Like on a track
   */
  public async toggleLikeTrack(trackId: string, incrementValue: number): Promise<void> {
    try {
      const trackRef = doc(db, this.tracksCollection, trackId);
      await updateDoc(trackRef, {
        likes: increment(incrementValue)
      });
    } catch (err) {
      console.warn('[MusicService] Like track notice:', err);
    }
  }

  /**
   * Moderation: Delete or hide track
   */
  public async deleteTrack(trackId: string): Promise<void> {
    const trackRef = doc(db, this.tracksCollection, trackId);
    await deleteDoc(trackRef);
  }

  public async setTrackStatus(trackId: string, status: 'APPROVED' | 'PENDING' | 'REJECTED', copyrightFlag?: boolean): Promise<void> {
    const trackRef = doc(db, this.tracksCollection, trackId);
    await updateDoc(trackRef, {
      status,
      copyrightFlag: copyrightFlag ?? false
    });
  }

  /**
   * Report track for moderation
   */
  public async reportTrack(trackId: string, reportedBy: string, reason: string): Promise<string> {
    const reportData: Omit<MusicReport, 'id'> = {
      trackId,
      reportedBy,
      reason,
      createdAt: new Date().toISOString(),
      status: 'PENDING'
    };
    const ref = await addDoc(collection(db, this.reportsCollection), reportData);
    return ref.id;
  }

  // ==========================================
  // PLAYLIST MANAGEMENT
  // ==========================================

  public async createPlaylist(title: string, createdBy: string, createdByName?: string, isPublic = true, description = ''): Promise<string> {
    const playlistData: Omit<Playlist, 'id'> = {
      title,
      description,
      createdBy,
      createdByName,
      isPublic,
      createdAt: new Date().toISOString(),
      trackIds: []
    };
    const ref = await addDoc(collection(db, this.playlistsCollection), playlistData);
    return ref.id;
  }

  public async getPlaylists(userId?: string): Promise<Playlist[]> {
    try {
      const snap = await getDocs(collection(db, this.playlistsCollection));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Playlist));
    } catch (err) {
      return [];
    }
  }

  public async addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
    const ref = doc(db, this.playlistsCollection, playlistId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const playlist = snap.data() as Playlist;
    if (!playlist.trackIds.includes(trackId)) {
      await updateDoc(ref, {
        trackIds: [...playlist.trackIds, trackId]
      });
    }
  }

  public async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
    const ref = doc(db, this.playlistsCollection, playlistId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const playlist = snap.data() as Playlist;
    await updateDoc(ref, {
      trackIds: playlist.trackIds.filter(id => id !== trackId)
    });
  }

  // ==========================================
  // RECENTLY PLAYED & FAVORITES
  // ==========================================

  public async recordRecentlyPlayed(userId: string, trackId: string): Promise<void> {
    try {
      const id = `${userId}_${trackId}`;
      const ref = doc(db, this.recentlyPlayedCollection, id);
      await setDoc(ref, {
        userId,
        trackId,
        playedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('[MusicService] Recently played notice:', err);
    }
  }

  public async toggleFavorite(userId: string, trackId: string): Promise<boolean> {
    try {
      const id = `${userId}_${trackId}`;
      const ref = doc(db, this.favoritesCollection, id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await deleteDoc(ref);
        this.toggleLikeTrack(trackId, -1);
        return false;
      } else {
        await setDoc(ref, {
          userId,
          trackId,
          addedAt: new Date().toISOString()
        });
        this.toggleLikeTrack(trackId, 1);
        return true;
      }
    } catch (err) {
      return false;
    }
  }

  public async getFavorites(userId: string): Promise<string[]> {
    try {
      const q = query(collection(db, this.favoritesCollection), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data().trackId);
    } catch (err) {
      return [];
    }
  }
}

export const musicService = new MusicService();
