import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { MusicTrack, Playlist, MusicSyncState } from '../types';
import { musicService } from '../services/MusicService';
import { musicSyncService } from '../services/MusicSyncService';
import { audioMixingService } from '../services/AudioMixingService';
import { useAuth } from '../hooks/useAuth';

interface MusicPlayerContextType {
  tracks: MusicTrack[];
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0 to 1
  micVolume: number; // 0 to 1
  queue: MusicTrack[];
  favorites: string[];
  playlists: Playlist[];
  repeatMode: 'none' | 'one' | 'all';
  isShuffle: boolean;
  isHostLiveSync: boolean;
  activeStreamId: string | null;
  
  // Controls
  playTrack: (track: MusicTrack, customQueue?: MusicTrack[]) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  stopTrack: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  setMusicVolume: (vol: number) => void;
  setMicrophoneVolume: (vol: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (track: MusicTrack) => void;
  removeFromQueue: (trackId: string) => void;
  toggleFavorite: (trackId: string) => Promise<void>;
  
  // Live Stream Broadcast Sync
  attachStreamSync: (streamId: string, isHost: boolean) => void;
  detachStreamSync: () => void;
  refreshTracks: () => Promise<void>;
  
  // Audio Element Ref for Mixer
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [micVolume, setMicVolumeState] = useState<number>(1.0);
  const [queue, setQueue] = useState<MusicTrack[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [isShuffle, setIsShuffle] = useState<boolean>(false);

  // Live Sync State
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [isHostLiveSync, setIsHostLiveSync] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const syncUnsubscribeRef = useRef<(() => void) | null>(null);

  // Load initial music tracks & favorites
  const loadInitialData = async () => {
    const loadedTracks = await musicService.getTracks();
    setTracks(loadedTracks);
    if (user) {
      const favs = await musicService.getFavorites(user.uid);
      setFavorites(favs);
      const userPlaylists = await musicService.getPlaylists(user.uid);
      setPlaylists(userPlaylists);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Subscribe to Firestore music track collection for real-time updates
    const unsubscribe = musicService.subscribeToTracks((updatedTracks) => {
      setTracks(updatedTracks);
    }, user?.uid);

    return () => {
      unsubscribe();
      if (syncUnsubscribeRef.current) syncUnsubscribeRef.current();
    };
  }, [user?.uid]);

  // Handle HTML5 Audio Events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || currentTrack?.duration || 0);
    };

    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        nextTrack();
      }
    };

    const handleError = (e: any) => {
      console.warn('[MusicPlayerContext] Audio playback error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [currentTrack, repeatMode, queue]);

  // Attach Web Audio Mixer when audio element is ready
  useEffect(() => {
    if (audioRef.current) {
      audioMixingService.attachMusicElement(audioRef.current);
    }
  }, [audioRef.current]);

  // Broadcast state changes when Host is live syncing
  const broadcastState = (overrideState?: Partial<MusicSyncState>) => {
    if (!isHostLiveSync || !activeStreamId || !currentTrack) return;

    musicSyncService.broadcastHostMusicState(activeStreamId, {
      currentTrackId: currentTrack.id,
      trackTitle: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album,
      coverImage: currentTrack.coverImage,
      audioUrl: currentTrack.audioUrl,
      isPlaying,
      playbackPosition: audioRef.current ? audioRef.current.currentTime : currentTime,
      musicVolume: volume,
      micVolume,
      queueTrackIds: queue.map(t => t.id),
      repeatMode,
      isShuffle,
      streamId: activeStreamId,
      ...overrideState
    });
  };

  // Play a track
  const playTrack = (track: MusicTrack, customQueue?: MusicTrack[]) => {
    setCurrentTrack(track);
    if (customQueue) {
      setQueue(customQueue);
    }

    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.volume = volume;
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          musicService.incrementPlayCount(track.id);
          if (user) {
            musicService.recordRecentlyPlayed(user.uid, track.id);
          }
          broadcastState({ isPlaying: true, currentTrackId: track.id, audioUrl: track.audioUrl, playbackPosition: 0 });
        })
        .catch(err => {
          console.warn('[MusicPlayerContext] Play interrupted:', err);
        });
    }
  };

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    broadcastState({ isPlaying: false });
  };

  const resumeTrack = () => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          broadcastState({ isPlaying: true });
        })
        .catch(() => {});
    }
  };

  const stopTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    broadcastState({ isPlaying: false, playbackPosition: 0 });
  };

  const nextTrack = () => {
    if (queue.length > 0) {
      const next = queue[0];
      setQueue(prev => prev.slice(1));
      playTrack(next);
    } else if (tracks.length > 0) {
      const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
      let nextIndex = (currentIndex + 1) % tracks.length;
      if (isShuffle) {
        nextIndex = Math.floor(Math.random() * tracks.length);
      }
      playTrack(tracks[nextIndex]);
    }
  };

  const prevTrack = () => {
    if (tracks.length > 0) {
      const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
      let prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
      playTrack(tracks[prevIndex]);
    }
  };

  const seekTo = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
      broadcastState({ playbackPosition: seconds });
    }
  };

  const setMusicVolume = (vol: number) => {
    setVolumeState(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    audioMixingService.setMusicVolume(vol);
    broadcastState({ musicVolume: vol });
  };

  const setMicrophoneVolume = (vol: number) => {
    setMicVolumeState(vol);
    audioMixingService.setMicVolume(vol);
    broadcastState({ micVolume: vol });
  };

  const toggleShuffle = () => {
    setIsShuffle(prev => !prev);
    broadcastState({ isShuffle: !isShuffle });
  };

  const toggleRepeat = () => {
    const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
    const nextMode = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(nextMode);
    broadcastState({ repeatMode: nextMode });
  };

  const addToQueue = (track: MusicTrack) => {
    setQueue(prev => [...prev, track]);
  };

  const removeFromQueue = (trackId: string) => {
    setQueue(prev => prev.filter(t => t.id !== trackId));
  };

  const toggleFavorite = async (trackId: string) => {
    if (!user) return;
    const isFav = await musicService.toggleFavorite(user.uid, trackId);
    if (isFav) {
      setFavorites(prev => [...prev, trackId]);
    } else {
      setFavorites(prev => prev.filter(id => id !== trackId));
    }
  };

  // Attach Stream Live Synchronization
  const attachStreamSync = (streamId: string, isHost: boolean) => {
    setActiveStreamId(streamId);
    setIsHostLiveSync(isHost);

    if (syncUnsubscribeRef.current) {
      syncUnsubscribeRef.current();
    }

    if (!isHost) {
      // Viewer Sync Listener
      syncUnsubscribeRef.current = musicSyncService.subscribeToStreamMusicSync(
        streamId,
        (syncState) => {
          if (!syncState || !syncState.audioUrl) {
            if (audioRef.current && !audioRef.current.paused) {
              audioRef.current.pause();
              setIsPlaying(false);
            }
            return;
          }

          // Sync track selection
          if (!currentTrack || currentTrack.id !== syncState.currentTrackId) {
            const matchingTrack = tracks.find(t => t.id === syncState.currentTrackId) || {
              id: syncState.currentTrackId || 'remote-track',
              title: syncState.trackTitle,
              artist: syncState.artist,
              album: syncState.album,
              coverImage: syncState.coverImage,
              audioUrl: syncState.audioUrl,
              duration: 180,
              uploadedBy: 'host',
              createdAt: new Date().toISOString(),
              playCount: 0,
              likes: 0,
              isPublic: true,
              status: 'APPROVED'
            };
            setCurrentTrack(matchingTrack);
            if (audioRef.current) {
              audioRef.current.src = syncState.audioUrl;
            }
          }

          // Sync playback position & state
          if (audioRef.current) {
            const timeDiff = Math.abs(audioRef.current.currentTime - syncState.playbackPosition);
            if (timeDiff > 2) {
              audioRef.current.currentTime = syncState.playbackPosition;
            }

            if (syncState.isPlaying && audioRef.current.paused) {
              audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            } else if (!syncState.isPlaying && !audioRef.current.paused) {
              audioRef.current.pause();
              setIsPlaying(false);
            }
          }
        }
      );
    }
  };

  const detachStreamSync = () => {
    if (activeStreamId && isHostLiveSync) {
      musicSyncService.clearStreamMusicSync(activeStreamId);
    }
    if (syncUnsubscribeRef.current) {
      syncUnsubscribeRef.current();
      syncUnsubscribeRef.current = null;
    }
    setActiveStreamId(null);
    setIsHostLiveSync(false);
  };

  return (
    <MusicPlayerContext.Provider value={{
      tracks,
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      volume,
      micVolume,
      queue,
      favorites,
      playlists,
      repeatMode,
      isShuffle,
      isHostLiveSync,
      activeStreamId,
      playTrack,
      pauseTrack,
      resumeTrack,
      stopTrack,
      nextTrack,
      prevTrack,
      seekTo,
      setMusicVolume,
      setMicrophoneVolume,
      toggleShuffle,
      toggleRepeat,
      addToQueue,
      removeFromQueue,
      toggleFavorite,
      attachStreamSync,
      detachStreamSync,
      refreshTracks: loadInitialData,
      audioRef
    }}>
      {children}
      {/* Hidden HTML5 Audio Element for Global Music Playback & Audio Mixing */}
      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};
