import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { VideoItem, VideoPlaylist, VideoSyncState } from '../types';
import { videoService } from '../services/VideoService';
import { videoSyncService } from '../services/VideoSyncService';
import { audioMixingService } from '../services/AudioMixingService';
import { useAuth } from '../hooks/useAuth';

interface VideoPlayerContextType {
  videos: VideoItem[];
  currentVideo: VideoItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0 to 1
  micVolume: number; // 0 to 1
  layoutMode: 'CAMERA_ONLY' | 'CAMERA_AND_VIDEO' | 'VIDEO_ONLY';
  queue: VideoItem[];
  favorites: string[];
  playlists: VideoPlaylist[];
  isHostLiveSync: boolean;
  activeStreamId: string | null;

  // Controls
  playVideo: (video: VideoItem, customQueue?: VideoItem[]) => void;
  pauseVideo: () => void;
  resumeVideo: () => void;
  stopVideo: () => void;
  nextVideo: () => void;
  prevVideo: () => void;
  seekTo: (seconds: number) => void;
  setVideoVolume: (vol: number) => void;
  setMicrophoneVolume: (vol: number) => void;
  setLayoutMode: (mode: 'CAMERA_ONLY' | 'CAMERA_AND_VIDEO' | 'VIDEO_ONLY') => void;
  addToQueue: (video: VideoItem) => void;
  removeFromQueue: (videoId: string) => void;
  toggleFavorite: (videoId: string) => Promise<void>;

  // Live Stream Broadcast Sync
  attachStreamSync: (streamId: string, isHost: boolean) => void;
  detachStreamSync: () => void;
  refreshVideos: () => Promise<void>;

  // Video Element Ref
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const VideoPlayerContext = createContext<VideoPlayerContextType | undefined>(undefined);

export const VideoPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [micVolume, setMicVolumeState] = useState<number>(1.0);
  const [layoutMode, setLayoutModeState] = useState<'CAMERA_ONLY' | 'CAMERA_AND_VIDEO' | 'VIDEO_ONLY'>('CAMERA_AND_VIDEO');
  const [queue, setQueue] = useState<VideoItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<VideoPlaylist[]>([]);

  // Live Sync State
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [isHostLiveSync, setIsHostLiveSync] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const syncUnsubscribeRef = useRef<(() => void) | null>(null);

  // Load initial videos & favorites
  const loadInitialData = async () => {
    const loadedVideos = await videoService.getVideos();
    setVideos(loadedVideos);
    if (user) {
      const favs = await videoService.getFavorites(user.uid);
      setFavorites(favs);
      const userPlaylists = await videoService.getPlaylists(user.uid);
      setPlaylists(userPlaylists);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Subscribe to Firestore video library
    const unsubscribe = videoService.subscribeToVideos((updatedVideos) => {
      setVideos(updatedVideos);
    });

    return () => {
      unsubscribe();
      if (syncUnsubscribeRef.current) syncUnsubscribeRef.current();
    };
  }, [user?.uid]);

  // Handle HTML5 Video Events
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const handleTimeUpdate = () => {
      setCurrentTime(vid.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(vid.duration || currentVideo?.duration || 0);
    };

    const handleEnded = () => {
      nextVideo();
    };

    const handleError = (e: any) => {
      console.warn('[VideoPlayerContext] Video playback error:', e);
      setIsPlaying(false);
    };

    vid.addEventListener('timeupdate', handleTimeUpdate);
    vid.addEventListener('loadedmetadata', handleLoadedMetadata);
    vid.addEventListener('ended', handleEnded);
    vid.addEventListener('error', handleError);

    return () => {
      vid.removeEventListener('timeupdate', handleTimeUpdate);
      vid.removeEventListener('loadedmetadata', handleLoadedMetadata);
      vid.removeEventListener('ended', handleEnded);
      vid.removeEventListener('error', handleError);
    };
  }, [currentVideo, queue]);

  // Connect Web Audio API mixer to video element for broadcasting audio
  useEffect(() => {
    if (videoRef.current) {
      audioMixingService.attachMusicElement(videoRef.current as any);
    }
  }, [videoRef.current]);

  // Broadcast state changes when Host is live syncing
  const broadcastState = (overrideState?: Partial<VideoSyncState>) => {
    if (!isHostLiveSync || !activeStreamId || !currentVideo) return;

    videoSyncService.broadcastHostVideoState(activeStreamId, {
      currentVideoId: currentVideo.id,
      videoTitle: currentVideo.title,
      thumbnail: currentVideo.thumbnail,
      videoUrl: currentVideo.videoUrl,
      isPlaying,
      playbackPosition: videoRef.current ? videoRef.current.currentTime : currentTime,
      videoVolume: volume,
      micVolume,
      layoutMode,
      queueVideoIds: queue.map(v => v.id),
      streamId: activeStreamId,
      ...overrideState
    });
  };

  // Play a video
  const playVideo = (video: VideoItem, customQueue?: VideoItem[]) => {
    setCurrentVideo(video);
    if (customQueue) {
      setQueue(customQueue);
    }

    if (videoRef.current) {
      videoRef.current.src = video.videoUrl;
      videoRef.current.volume = volume;
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          videoService.incrementViews(video.id);
          if (user) {
            videoService.recordRecentVideo(user.uid, video.id);
          }
          broadcastState({ isPlaying: true, currentVideoId: video.id, videoUrl: video.videoUrl, playbackPosition: 0 });
        })
        .catch(err => {
          console.warn('[VideoPlayerContext] Video play error:', err);
        });
    }
  };

  const pauseVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsPlaying(false);
    broadcastState({ isPlaying: false });
  };

  const resumeVideo = () => {
    if (videoRef.current && currentVideo) {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          broadcastState({ isPlaying: true });
        })
        .catch(() => {});
    }
  };

  const stopVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    broadcastState({ isPlaying: false, playbackPosition: 0 });
  };

  const nextVideo = () => {
    if (queue.length > 0) {
      const next = queue[0];
      setQueue(prev => prev.slice(1));
      playVideo(next);
    } else if (videos.length > 0) {
      const currentIndex = videos.findIndex(v => v.id === currentVideo?.id);
      const nextIndex = (currentIndex + 1) % videos.length;
      playVideo(videos[nextIndex]);
    }
  };

  const prevVideo = () => {
    if (videos.length > 0) {
      const currentIndex = videos.findIndex(v => v.id === currentVideo?.id);
      const prevIndex = (currentIndex - 1 + videos.length) % videos.length;
      playVideo(videos[prevIndex]);
    }
  };

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      setCurrentTime(seconds);
      broadcastState({ playbackPosition: seconds });
    }
  };

  const setVideoVolume = (vol: number) => {
    setVolumeState(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
    audioMixingService.setMusicVolume(vol);
    broadcastState({ videoVolume: vol });
  };

  const setMicrophoneVolume = (vol: number) => {
    setMicVolumeState(vol);
    audioMixingService.setMicVolume(vol);
    broadcastState({ micVolume: vol });
  };

  const setLayoutMode = (mode: 'CAMERA_ONLY' | 'CAMERA_AND_VIDEO' | 'VIDEO_ONLY') => {
    setLayoutModeState(mode);
    broadcastState({ layoutMode: mode });
  };

  const addToQueue = (video: VideoItem) => {
    setQueue(prev => [...prev, video]);
  };

  const removeFromQueue = (videoId: string) => {
    setQueue(prev => prev.filter(v => v.id !== videoId));
  };

  const toggleFavorite = async (videoId: string) => {
    if (!user) return;
    const isFav = await videoService.toggleFavoriteVideo(user.uid, videoId);
    if (isFav) {
      setFavorites(prev => [...prev, videoId]);
    } else {
      setFavorites(prev => prev.filter(id => id !== videoId));
    }
  };

  // Attach Stream Live Video Synchronization
  const attachStreamSync = (streamId: string, isHost: boolean) => {
    setActiveStreamId(streamId);
    setIsHostLiveSync(isHost);

    if (syncUnsubscribeRef.current) {
      syncUnsubscribeRef.current();
    }

    if (!isHost) {
      // Viewer Video Sync Listener
      syncUnsubscribeRef.current = videoSyncService.subscribeToStreamVideoSync(
        streamId,
        (syncState) => {
          if (!syncState || !syncState.videoUrl) {
            if (videoRef.current && !videoRef.current.paused) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
            return;
          }

          if (syncState.layoutMode) {
            setLayoutModeState(syncState.layoutMode);
          }

          // Sync video item selection
          if (!currentVideo || currentVideo.id !== syncState.currentVideoId) {
            const matchingVideo = videos.find(v => v.id === syncState.currentVideoId) || {
              id: syncState.currentVideoId || 'remote-video',
              title: syncState.videoTitle,
              description: 'Broadcast stream video',
              duration: 300,
              thumbnail: syncState.thumbnail,
              videoUrl: syncState.videoUrl,
              uploadedBy: 'host',
              createdAt: new Date().toISOString(),
              views: 0,
              likes: 0,
              category: 'Live Broadcast',
              visibility: 'PUBLIC',
              status: 'APPROVED'
            };
            setCurrentVideo(matchingVideo);
            if (videoRef.current) {
              videoRef.current.src = syncState.videoUrl;
            }
          }

          // Sync playback position & state
          if (videoRef.current) {
            const timeDiff = Math.abs(videoRef.current.currentTime - syncState.playbackPosition);
            if (timeDiff > 2.5) {
              videoRef.current.currentTime = syncState.playbackPosition;
            }

            if (syncState.isPlaying && videoRef.current.paused) {
              videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            } else if (!syncState.isPlaying && !videoRef.current.paused) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        }
      );
    }
  };

  const detachStreamSync = () => {
    if (activeStreamId && isHostLiveSync) {
      videoSyncService.clearStreamVideoSync(activeStreamId);
    }
    if (syncUnsubscribeRef.current) {
      syncUnsubscribeRef.current();
      syncUnsubscribeRef.current = null;
    }
    setActiveStreamId(null);
    setIsHostLiveSync(false);
  };

  return (
    <VideoPlayerContext.Provider value={{
      videos,
      currentVideo,
      isPlaying,
      currentTime,
      duration,
      volume,
      micVolume,
      layoutMode,
      queue,
      favorites,
      playlists,
      isHostLiveSync,
      activeStreamId,
      playVideo,
      pauseVideo,
      resumeVideo,
      stopVideo,
      nextVideo,
      prevVideo,
      seekTo,
      setVideoVolume,
      setMicrophoneVolume,
      setLayoutMode,
      addToQueue,
      removeFromQueue,
      toggleFavorite,
      attachStreamSync,
      detachStreamSync,
      refreshVideos: loadInitialData,
      videoRef
    }}>
      {children}
      {/* Hidden HTML5 Video Element for Global Sync & Broadcasting */}
      <video
        ref={videoRef}
        preload="metadata"
        crossOrigin="anonymous"
        playsInline
        className="hidden"
      />
    </VideoPlayerContext.Provider>
  );
};

export const useVideoPlayer = () => {
  const context = useContext(VideoPlayerContext);
  if (!context) {
    throw new Error('useVideoPlayer must be used within a VideoPlayerProvider');
  }
  return context;
};
