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
  VideoItem, 
  VideoPlaylist, 
  RecentVideo, 
  FavoriteVideo, 
  VideoReport 
} from '../types';

// High-quality royalty-free demo videos for immediate stream playback fallback
export const SEEDED_VIDEOS: VideoItem[] = [
  {
    id: 'video-big-buck-bunny',
    title: 'Nexora Cyberpunk Championship Trailer',
    description: 'Official 2026 Nexora esports tournament live broadcast video background.',
    duration: 596,
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    uploadedBy: 'system',
    uploadedByName: 'Nexora Live Media',
    createdAt: new Date().toISOString(),
    views: 84200,
    likes: 12400,
    category: 'Gaming',
    resolution: '1080p',
    fileSize: 158000000,
    visibility: 'PUBLIC',
    status: 'APPROVED'
  },
  {
    id: 'video-tears-of-steel',
    title: 'Synthwave Live Concert Visualizer 4K',
    description: 'High octane neon visualizer loop for host live streams and party rooms.',
    duration: 734,
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    uploadedBy: 'system',
    uploadedByName: 'Aria Nova',
    createdAt: new Date().toISOString(),
    views: 45100,
    likes: 8900,
    category: 'Music Video',
    resolution: '1080p',
    fileSize: 182000000,
    visibility: 'PUBLIC',
    status: 'APPROVED'
  },
  {
    id: 'video-sintel',
    title: 'Top 10 Live PK Battles Season 8 Highlights',
    description: 'Epic highlights from the highest-stakes diamond PK battles on Nexora.',
    duration: 888,
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    uploadedBy: 'system',
    uploadedByName: 'PK Arena Official',
    createdAt: new Date().toISOString(),
    views: 112000,
    likes: 24500,
    category: 'Highlights',
    resolution: '1080p',
    fileSize: 210000000,
    visibility: 'PUBLIC',
    status: 'APPROVED'
  },
  {
    id: 'video-elephants-dream',
    title: 'AI Avatar Setup & Motion Tracking Masterclass',
    description: 'Complete step-by-step tutorial on customizing 3D virtual avatars.',
    duration: 653,
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    uploadedBy: 'system',
    uploadedByName: 'Nexora Tech Lab',
    createdAt: new Date().toISOString(),
    views: 31800,
    likes: 6200,
    category: 'Tutorial',
    resolution: '1080p',
    fileSize: 145000000,
    visibility: 'PUBLIC',
    status: 'APPROVED'
  }
];

export class VideoService {
  private videosCollection = 'video_library';
  private playlistsCollection = 'video_playlists';
  private recentCollection = 'recent_videos';
  private favoritesCollection = 'favorite_videos';
  private reportsCollection = 'video_reports';

  /**
   * Fetch approved videos with category and search filters
   */
  public async getVideos(options?: {
    category?: string;
    searchQuery?: string;
    includePrivate?: boolean;
    userId?: string;
  }): Promise<VideoItem[]> {
    try {
      const q = query(
        collection(db, this.videosCollection),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      
      let videos: VideoItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VideoItem));

      if (videos.length === 0) {
        videos = [...SEEDED_VIDEOS];
        this.seedInitialVideos().catch(err => console.warn('Seeding initial videos notice:', err));
      }

      return videos.filter(v => {
        if (v.status !== 'APPROVED' && options?.userId && v.uploadedBy !== options.userId) {
          return false;
        }
        if (!options?.includePrivate && v.visibility === 'PRIVATE') {
          if (options?.userId && v.uploadedBy !== options.userId) return false;
        }
        if (options?.category && options.category !== 'All' && v.category?.toLowerCase() !== options.category.toLowerCase()) {
          return false;
        }
        if (options?.searchQuery) {
          const sq = options.searchQuery.toLowerCase();
          const matchTitle = v.title.toLowerCase().includes(sq);
          const matchDesc = v.description?.toLowerCase().includes(sq);
          const matchCat = v.category?.toLowerCase().includes(sq);
          if (!matchTitle && !matchDesc && !matchCat) return false;
        }
        return true;
      });
    } catch (err) {
      console.warn('[VideoService] Fallback to seeded video library:', err);
      return SEEDED_VIDEOS;
    }
  }

  /**
   * Realtime subscription to video library
   */
  public subscribeToVideos(callback: (videos: VideoItem[]) => void) {
    try {
      const q = query(
        collection(db, this.videosCollection),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      return onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          callback(SEEDED_VIDEOS);
        } else {
          const videos = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as VideoItem));
          callback(videos);
        }
      }, (err) => {
        console.warn('[VideoService] Video subscription warning:', err);
        callback(SEEDED_VIDEOS);
      });
    } catch (err) {
      callback(SEEDED_VIDEOS);
      return () => {};
    }
  }

  /**
   * Seed initial demo videos into Firestore
   */
  private async seedInitialVideos(): Promise<void> {
    for (const video of SEEDED_VIDEOS) {
      const videoRef = doc(db, this.videosCollection, video.id);
      await setDoc(videoRef, {
        ...video,
        createdTimestamp: serverTimestamp()
      }, { merge: true });
    }
  }

  /**
   * Create video record in Firestore
   */
  public async createVideo(videoData: Omit<VideoItem, 'id' | 'views' | 'likes' | 'createdAt'>): Promise<string> {
    const newVideo: Omit<VideoItem, 'id'> = {
      ...videoData,
      views: 0,
      likes: 0,
      status: videoData.status || 'APPROVED',
      visibility: videoData.visibility || 'PUBLIC',
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, this.videosCollection), {
      ...newVideo,
      createdTimestamp: serverTimestamp()
    });

    return docRef.id;
  }

  /**
   * Increment view count
   */
  public async incrementViews(videoId: string): Promise<void> {
    try {
      const ref = doc(db, this.videosCollection, videoId);
      await updateDoc(ref, { views: increment(1) });
    } catch (err) {
      console.warn('[VideoService] View increment notice:', err);
    }
  }

  /**
   * Toggle like video
   */
  public async toggleLikeVideo(videoId: string, incValue: number): Promise<void> {
    try {
      const ref = doc(db, this.videosCollection, videoId);
      await updateDoc(ref, { likes: increment(incValue) });
    } catch (err) {
      console.warn('[VideoService] Like increment notice:', err);
    }
  }

  /**
   * Moderation: Delete or update video status
   */
  public async deleteVideo(videoId: string): Promise<void> {
    const ref = doc(db, this.videosCollection, videoId);
    await deleteDoc(ref);
  }

  public async setVideoStatus(videoId: string, status: 'APPROVED' | 'PENDING' | 'REJECTED', copyrightFlag?: boolean): Promise<void> {
    const ref = doc(db, this.videosCollection, videoId);
    await updateDoc(ref, {
      status,
      copyrightFlag: copyrightFlag ?? false
    });
  }

  public async reportVideo(videoId: string, reportedBy: string, reason: string): Promise<string> {
    const report: Omit<VideoReport, 'id'> = {
      videoId,
      reportedBy,
      reason,
      createdAt: new Date().toISOString(),
      status: 'PENDING'
    };
    const ref = await addDoc(collection(db, this.reportsCollection), report);
    return ref.id;
  }

  // ==========================================
  // PLAYLIST MANAGEMENT
  // ==========================================

  public async createPlaylist(title: string, createdBy: string, createdByName?: string, isPublic = true, description = ''): Promise<string> {
    const playlistData: Omit<VideoPlaylist, 'id'> = {
      title,
      description,
      createdBy,
      createdByName,
      isPublic,
      createdAt: new Date().toISOString(),
      videoIds: []
    };
    const ref = await addDoc(collection(db, this.playlistsCollection), playlistData);
    return ref.id;
  }

  public async getPlaylists(userId?: string): Promise<VideoPlaylist[]> {
    try {
      const snap = await getDocs(collection(db, this.playlistsCollection));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as VideoPlaylist));
    } catch (err) {
      return [];
    }
  }

  public async addVideoToPlaylist(playlistId: string, videoId: string): Promise<void> {
    const ref = doc(db, this.playlistsCollection, playlistId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const playlist = snap.data() as VideoPlaylist;
    if (!playlist.videoIds.includes(videoId)) {
      await updateDoc(ref, {
        videoIds: [...playlist.videoIds, videoId]
      });
    }
  }

  public async removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<void> {
    const ref = doc(db, this.playlistsCollection, playlistId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const playlist = snap.data() as VideoPlaylist;
    await updateDoc(ref, {
      videoIds: playlist.videoIds.filter(id => id !== videoId)
    });
  }

  // ==========================================
  // RECENT & FAVORITES
  // ==========================================

  public async recordRecentVideo(userId: string, videoId: string): Promise<void> {
    try {
      const id = `${userId}_${videoId}`;
      const ref = doc(db, this.recentCollection, id);
      await setDoc(ref, {
        userId,
        videoId,
        playedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('[VideoService] Recent video record notice:', err);
    }
  }

  public async toggleFavoriteVideo(userId: string, videoId: string): Promise<boolean> {
    try {
      const id = `${userId}_${videoId}`;
      const ref = doc(db, this.favoritesCollection, id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await deleteDoc(ref);
        this.toggleLikeVideo(videoId, -1);
        return false;
      } else {
        await setDoc(ref, {
          userId,
          videoId,
          addedAt: new Date().toISOString()
        });
        this.toggleLikeVideo(videoId, 1);
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
      return snap.docs.map(d => d.data().videoId);
    } catch (err) {
      return [];
    }
  }
}

export const videoService = new VideoService();
