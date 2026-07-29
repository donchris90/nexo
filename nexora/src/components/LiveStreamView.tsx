import React, { useState, useEffect, useRef } from 'react';
import { LiveStream, ChatMessage, GiftItem, PartySeat, PkBattleInfo } from '../types';
import { useEconomy } from '../context/EconomyContext';
import { useAuth } from '../hooks/useAuth';
import { LiveModerationPanel } from './LiveModerationPanel';
import { moderationService, RoomModerationState } from '../services/ModerationService';
import { liveStreamService } from '../services/LiveStreamService';
import { apiFetch } from '../lib/apiConfig';
import { CreatorStudioView } from './CreatorStudioView';
import { 
  Tv, 
  Users, 
  Heart, 
  Send, 
  Bot, 
  Gift, 
  ShoppingBag, 
  Sparkles, 
  Radio, 
  ShieldAlert, 
  MessageSquare,
  HelpCircle,
  Brain,
  Globe2,
  CheckCircle2,
  Share2,
  Camera,
  Swords,
  Mic,
  MicOff,
  Crown,
  Flame,
  RotateCw,
  Dices,
  Zap,
  Award,
  Trophy,
  Volume2,
  UserPlus,
  Music,
  Play,
  Pause,
  SkipForward,
  Disc,
  Video,
  Film,
  Upload,
  FolderPlus,
  Trash2,
  Maximize,
  Plus,
  ListVideo,
  Eye,
  Sliders,
  Check,
  X,
  Settings,
  MoreHorizontal,
  ChevronDown,
  BarChart3,
  UserCheck,
  Search,
  SlidersHorizontal,
  Grid,
  Maximize2,
  Layers,
  ChevronRight,
  Star,
  UserX,
  VolumeX,
  Target,
  Box,
  Smile,
  LayoutGrid
} from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { useVideoPlayer } from '../context/VideoPlayerContext';
import { videoStorageService } from '../services/VideoStorageService';
import { videoService } from '../services/VideoService';
import { agoraEngine } from '../lib/agora';
import { musicStorageService } from '../services/MusicStorageService';
import { musicService } from '../services/MusicService';

interface LiveStreamViewProps {
  mode?: 'LIVE' | 'PARTY';
  onOpenGoLiveModal?: () => void;
  focusStreamId?: string;
}

export const LiveStreamView: React.FC<LiveStreamViewProps> = ({ mode = 'LIVE', onOpenGoLiveModal, focusStreamId }) => {
  const { user } = useAuth();
  const { wallet, sendGift, purchaseProduct, updateGamePoints, claimRedPacket, redPacket, userLevel } = useEconomy();

  const myUserId = user?.uid || 'guest_' + (typeof window !== 'undefined' ? 'local' : 'server');
  const myDisplayName = user?.displayName || 'Guest';
  const myAvatarUrl = user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${myUserId}`;
  const myBadge = `${userLevel.vipTier} VIP`;

  const {
    tracks,
    currentTrack,
    isPlaying,
    volume,
    micVolume,
    playTrack,
    pauseTrack,
    resumeTrack,
    nextTrack,
    setMusicVolume,
    setMicrophoneVolume,
    attachStreamSync,
    detachStreamSync,
    refreshTracks
  } = useMusicPlayer();

  const {
    videos: videoLibrary,
    currentVideo,
    isPlaying: isVideoPlaying,
    currentTime: videoTime,
    duration: videoDuration,
    volume: videoVolume,
    micVolume: videoMicVolume,
    layoutMode,
    playVideo,
    pauseVideo,
    resumeVideo,
    nextVideo,
    setVideoVolume,
    setMicrophoneVolume: setVideoMicrophoneVolume,
    setLayoutMode,
    attachStreamSync: attachVideoSync,
    detachStreamSync: detachVideoSync
  } = useVideoPlayer();

  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [streamsLoaded, setStreamsLoaded] = useState(false);

  // Floating Heart Particle Animations
  const [hearts, setHearts] = useState<{ id: number; left: number }[]>([]);

  const triggerHeartAnimation = () => {
    const newHeart = {
      id: Date.now() + Math.random(),
      left: Math.random() * 60 + 20
    };
    setHearts(prev => [...prev.slice(-15), newHeart]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 2000);
  };

  // Real-time Firestore subscriptions
  useEffect(() => {
    const unsubStreams = liveStreamService.subscribeToStreams((liveStreams) => {
      setStreams(liveStreams || []);
      setSelectedStream((prev) => {
        if (!prev) return null; // Stay on Homepage Discovery if user is on Homepage
        if (!liveStreams || liveStreams.length === 0) return null;
        return liveStreams.find(s => s.id === prev.id) || null;
      });
      setStreamsLoaded(true);
    });
    const unsubGifts = liveStreamService.subscribeToGiftCatalog((liveGifts) => {
      if (liveGifts && liveGifts.length > 0) setGifts(liveGifts);
    });
    return () => {
      unsubStreams();
      unsubGifts();
    };
  }, []);

  // Real-time moderation state (mic/co-host requests) for the currently open stream
  useEffect(() => {
    if (!selectedStream?.id) {
      setModState(null);
      return;
    }
    const unsubMod = moderationService.subscribeToModeration(selectedStream.id, setModState);
    return () => unsubMod();
  }, [selectedStream?.id]);

  // Leaving the room used to just null out `selectedStream` and rely on every effect's
  // cleanup to happen to fire correctly on the way out. It didn't always: a seated
  // guest's camera/mic could keep publishing into Agora in the background, their seat
  // stayed occupied in Firestore forever, and a stale sheet/webcam flag could linger —
  // which is why leaving only fully "worked" after a hard page refresh. Every step
  // below is independently try/caught so one failure (e.g. offline) never blocks exit.
  const handleCloseStream = async () => {
    if (!selectedStream) return;
    const streamId = selectedStream.id;

    if (guestPublishing || myActiveSeat) {
      try { await agoraEngine.leaveChannel(); } catch (err) { console.warn('Leave (guest) Agora cleanup warning:', err); }
      try { await liveStreamService.leaveSeat(streamId, myUserId); } catch (err) { console.warn('Leave seat cleanup warning:', err); }
      try { await moderationService.removeCoHost(streamId, modState?.coHosts || [], myUserId, myUserId); } catch (err) { console.warn('Remove co-host cleanup warning:', err); }
    }

    if (webcamEnabled) {
      try { await agoraEngine.leaveChannel(); } catch (err) { console.warn('Leave (host webcam) Agora cleanup warning:', err); }
    }

    if (isHost) {
      try { await liveStreamService.endStream(streamId); } catch (err) { console.warn('Failed to end stream:', err); }
    }

    setGuestPublishing(false);
    setWebcamEnabled(false);
    setActiveSheet('NONE');
    setSelectedStream(null);
  };

  // Jump to created stream on "Go Live"
  useEffect(() => {
    if (!focusStreamId) return;
    const match = streams.find(s => s.id === focusStreamId);
    if (match) setSelectedStream(match);
  }, [focusStreamId, streams]);

  // Bottom Sheets / Modal States
  const [activeSheet, setActiveSheet] = useState<
    'NONE' | 'GIFT' | 'MUSIC' | 'VIDEO' | 'PK' | 'GAMES' | 'EFFECTS' | 'GUESTS' | 'DASHBOARD' | 'MORE_TOOLS' | 'TREASURE'
  >('NONE');

  // Video Selector & Upload Modal State
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showMusicUploadModal, setShowMusicUploadModal] = useState(false);
  const [musicUploadFile, setMusicUploadFile] = useState<File | null>(null);
  const [musicUploadTitle, setMusicUploadTitle] = useState('');
  const [musicUploadArtist, setMusicUploadArtist] = useState('');
  const [musicUploadIsPublic, setMusicUploadIsPublic] = useState(false);
  const [musicUploadError, setMusicUploadError] = useState<string | null>(null);
  const [musicUploadProgress, setMusicUploadProgress] = useState<number | null>(null);

  // Navigation Sub-tabs for Discovery
  const [activeCategory, setActiveCategory] = useState<string>('RECOMMENDED');
  const [discoverySearch, setDiscoverySearch] = useState<string>('');
  const [discoveryCountry, setDiscoveryCountry] = useState<string>('ALL');
  const [discoveryGender, setDiscoveryGender] = useState<string>('ALL');
  const [discoverySortBy, setDiscoverySortBy] = useState<'POPULAR' | 'GIFTS' | 'NEWEST'>('POPULAR');
  const [discoveryLayout, setDiscoveryLayout] = useState<'2_COL' | 'HERO' | 'COMPACT'>('2_COL');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState<number>(0);
  const [followedHosts, setFollowedHosts] = useState<string[]>(['Alex Rivers', 'Sophia Vance', 'Elena Vance']);
  const [reminders, setReminders] = useState<Record<string, boolean>>({});

  const [liveSubTab, setLiveSubTab] = useState<'POPULAR' | 'NEARBY' | 'FEATURED' | 'EXPLORE'>('POPULAR');
  const [partyCategory, setPartyCategory] = useState<string>('9SEAT');
  const [partyTheme, setPartyTheme] = useState<'KARAOKE' | 'DATING' | 'MUSIC' | 'CHILL' | 'COMEDY' | 'NETWORKING'>('KARAOKE');

  // Streaming Effects State
  const [beautyLevel, setBeautyLevel] = useState(80);
  const [faceFilter, setFaceFilter] = useState<'CRYSTAL' | 'GLOW' | 'SUNSET' | 'CYBER' | 'NONE'>('GLOW');
  const [virtualBackground, setVirtualBackground] = useState<'CYBER_STUDIO' | 'NEON_CLUB' | 'PENTHOUSE' | 'OFF'>('CYBER_STUDIO');
  const [voiceChanger, setVoiceChanger] = useState<'CHIPMUNK' | 'DEEP_ROBOT' | 'ECHO' | 'NORMAL'>('NORMAL');

  // Red Packet Drop Overlay
  const [showRedPacketModal, setShowRedPacketModal] = useState(false);

  // Marquee Announcement
  const [marqueeNotice, setMarqueeNotice] = useState<string>(
    '🔥 Welcome to Nexora Live! Send gifts, take a seat, or challenge hosts in PK!'
  );

  // Live Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputChat, setInputChat] = useState('');
  const [isChatInputOpen, setIsChatInputOpen] = useState(false);

  // AI Co-Host State
  const [aiCohostMode, setAiCohostMode] = useState<'MODERATOR' | 'QA' | 'TRIVIA' | 'RECOMMENDER' | 'TRANSLATOR'>('MODERATOR');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Gift Drawer & Combos
  const [selectedGiftCombo, setSelectedGiftCombo] = useState<number>(1);
  const [targetSeatNumber, setTargetSeatNumber] = useState<number>(1);
  const [showModerationPanel, setShowModerationPanel] = useState<boolean>(false);

  // Quick Dice Game
  const [quickDiceVal, setQuickDiceVal] = useState<number>(6);
  const [isQuickRolling, setIsQuickRolling] = useState(false);

  // Guest Queue State — backed by the real per-stream moderation document
  // (moderationService), not local mock data. See guest-join effects below.
  const [modState, setModState] = useState<RoomModerationState | null>(null);
  const guestRequests = (modState?.micRequests || []).filter(r => r.status === 'PENDING');
  const myActiveSeat = selectedStream?.seats?.find(s => s.uid === myUserId) || null;
  // Only party/multi-guest rooms have an on-camera guest stage. A Solo Live stream
  // has no seats at all — viewers there should only ever see video + chat + gifting,
  // never a "become a guest" prompt.
  const supportsGuests = !!selectedStream?.isPartyRoom;
  // Multi-Guest rooms are a video conference: every seat should show a full camera
  // tile, not the small avatar-circle used by voice-focused party/karaoke rooms.
  const isConferenceMode = selectedStream?.category === 'MULTI_GUEST';
  const [controlsVisible, setControlsVisible] = useState(false);
  const [guestJoinBusy, setGuestJoinBusy] = useState(false);
  const [guestPublishing, setGuestPublishing] = useState(false);
  const wasSeatedRef = useRef(false);
  const seatVideoRefCache = useRef<Map<number, { uid: string; cb: (el: HTMLDivElement | null) => void }>>(new Map());

  // Stable per-seat ref callback (only recreated when the seat's occupant changes) so
  // binding a seat's video element doesn't churn on every unrelated re-render (e.g. a
  // new chat message), which would otherwise cause the guest's video to flicker.
  const getSeatVideoRef = (seatNumber: number, uid?: string) => {
    const cached = seatVideoRefCache.current.get(seatNumber);
    if (cached && cached.uid === (uid || '')) return cached.cb;

    const cb = (el: HTMLDivElement | null) => {
      if (!uid) return;
      if (uid === myUserId) {
        if (el) agoraEngine.getLocalVideoTrack()?.play(el);
      } else {
        agoraEngine.bindRemoteVideoElement(uid, el);
      }
    };
    seatVideoRefCache.current.set(seatNumber, { uid: uid || '', cb });
    return cb;
  };

  // Stream Goal State
  const [streamGoal, setStreamGoal] = useState({ currentCoins: 14200, targetCoins: 20000 });

  // Timed Treasure Box
  const [treasureTimeLeft, setTreasureTimeLeft] = useState(90); // 90 seconds
  const [treasureClaimed, setTreasureClaimed] = useState(false);

  useEffect(() => {
    if (treasureTimeLeft <= 0 || treasureClaimed) return;
    const timer = setInterval(() => {
      setTreasureTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [treasureTimeLeft, treasureClaimed]);

  // Webcam & Agora State
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [agoraJoining, setAgoraJoining] = useState(false);
  const videoRef = useRef<HTMLDivElement | null>(null);
  const [remoteVideoActive, setRemoteVideoActive] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    setChatMessages([]);
    // A bottom sheet left open from a previous room (e.g. Guest Queue in a party
    // room) must not carry over when jumping straight into a different stream.
    setActiveSheet('NONE');
  }, [selectedStream?.id]);

  // Toggle Webcam
  const toggleWebcam = async () => {
    if (!selectedStream?.id) return;

    if (webcamEnabled) {
      await agoraEngine.leaveChannel();
      setWebcamEnabled(false);
      return;
    }

    setAgoraJoining(true);
    try {
      await agoraEngine.joinChannel(selectedStream.id, 'host', user?.uid);
      setWebcamEnabled(true);
    } catch (err) {
      console.warn('Failed to go live via Agora:', err);
    } finally {
      setAgoraJoining(false);
    }
  };

  useEffect(() => {
    if (!webcamEnabled) return;
    const localVideoTrack = agoraEngine.getLocalVideoTrack();
    if (localVideoTrack && videoRef.current) {
      localVideoTrack.play(videoRef.current);
    }
  }, [webcamEnabled]);

  // Viewers Agora Join (plain audience mode — skipped for the host and for guests who
  // are actively publishing from a seat, since they join as a publisher instead; see
  // the guest auto-join effect below)
  useEffect(() => {
    if (!selectedStream?.id) return;
    const viewerIsHost = !!user && selectedStream.creatorId === user.uid;
    if (viewerIsHost || myActiveSeat) return;

    let unsubscribeRemote: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      try {
        await agoraEngine.joinChannel(selectedStream.id, 'audience', user?.uid);
        if (cancelled) return;
        if (videoRef.current) {
          unsubscribeRemote = agoraEngine.onRemoteVideo(videoRef.current, setRemoteVideoActive);
        }
      } catch (err) {
        console.warn('Agora audience notice:', err);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribeRemote?.();
      setRemoteVideoActive(false);
      agoraEngine.leaveChannel();
    };
  }, [selectedStream?.id, selectedStream?.creatorId, user?.uid, !!myActiveSeat]);

  // Guest auto-join: once the host approves a mic/seat request (moderationService
  // micRequests -> APPROVED), the approved guest's own client reacts here by claiming
  // an open seat and actually publishing camera/mic into the Agora channel. Nothing
  // upstream of this effect ever did that, which is why an "approved" guest never
  // actually appeared with video/audio.
  useEffect(() => {
    if (!selectedStream?.id || !user?.uid || !supportsGuests) return;
    const myRequest = modState?.micRequests?.find(r => r.userId === myUserId && r.status === 'APPROVED');
    if (!myRequest || guestPublishing || guestJoinBusy || myActiveSeat) return;

    let cancelled = false;
    setGuestJoinBusy(true);

    (async () => {
      try {
        const seatNumber = await liveStreamService.assignNextOpenSeat(selectedStream.id, {
          uid: myUserId,
          userName: myDisplayName,
          userAvatar: myAvatarUrl,
          userLevel: userLevel.currentLevel
        });
        if (cancelled) return;
        if (seatNumber == null) {
          console.warn('[LiveStream] Guest was approved but no open seats remain.');
          return;
        }

        await agoraEngine.joinChannel(selectedStream.id, 'host', myUserId);
        if (cancelled) return;
        setGuestPublishing(true);

        await moderationService.activateCoHost(
          selectedStream.id,
          modState?.coHosts || [],
          modState?.micRequests || [],
          myUserId,
          myDisplayName,
          myAvatarUrl,
          seatNumber
        );
      } catch (err) {
        console.warn('[LiveStream] Guest auto-join failed:', err);
      } finally {
        if (!cancelled) setGuestJoinBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedStream?.id, modState?.micRequests, myUserId, guestPublishing, guestJoinBusy, !!myActiveSeat, supportsGuests]);

  // If I'm actively publishing as a seated guest but my seat disappears (host removed
  // me, or I left from another tab), stop publishing immediately instead of continuing
  // to broadcast into a room I'm no longer seated in.
  useEffect(() => {
    if (!guestPublishing) {
      wasSeatedRef.current = !!myActiveSeat;
      return;
    }
    if (myActiveSeat) {
      wasSeatedRef.current = true;
      return;
    }
    if (wasSeatedRef.current) {
      agoraEngine.leaveChannel();
      setGuestPublishing(false);
      wasSeatedRef.current = false;
    }
  }, [myActiveSeat, guestPublishing]);

  // Single source of truth for a seated guest's mute state is the seat's Firestore
  // isMuted flag — this keeps the actual Agora mic mute in sync whether the toggle
  // came from the guest themselves or was force-applied by the host.
  useEffect(() => {
    if (!guestPublishing) return;
    agoraEngine.setMicMuted(!!myActiveSeat?.isMuted);
  }, [myActiveSeat?.isMuted, guestPublishing]);

  const handleToggleSeatMute = (seatNumber: number, currentlyMuted: boolean | undefined) => {
    if (!selectedStream?.id) return;
    liveStreamService.setSeatMuted(selectedStream.id, seatNumber, !currentlyMuted).catch(err =>
      console.warn('[LiveStream] Failed to toggle seat mute:', err)
    );
  };

  const handleLeaveSeat = async () => {
    if (!selectedStream?.id) return;
    try {
      await agoraEngine.leaveChannel();
      setGuestPublishing(false);
      await liveStreamService.leaveSeat(selectedStream.id, myUserId);
      await moderationService.removeCoHost(selectedStream.id, modState?.coHosts || [], myUserId, myUserId);
    } catch (err) {
      console.warn('[LiveStream] Failed to leave seat:', err);
    }
  };

  const handleKickFromSeat = async (seatNumber: number) => {
    if (!selectedStream?.id) return;
    try {
      const removed = await liveStreamService.clearSeat(selectedStream.id, seatNumber);
      if (removed?.uid) {
        await moderationService.removeCoHost(selectedStream.id, modState?.coHosts || [], removed.uid, myUserId);
      }
    } catch (err) {
      console.warn('[LiveStream] Failed to remove guest from seat:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (webcamEnabled) agoraEngine.leaveChannel();
    };
  }, [selectedStream?.id]);

  // Attach real-time Audio & Video sync
  useEffect(() => {
    if (selectedStream?.id) {
      const isHost = !!user && selectedStream.creatorId === user.uid;
      attachStreamSync(selectedStream.id, isHost);
      attachVideoSync(selectedStream.id, isHost);
    }
    return () => {
      detachStreamSync();
      detachVideoSync();
    };
  }, [selectedStream?.id, selectedStream?.creatorId, user?.uid]);

  // Music upload submit
  const handleMusicUploadSubmit = async () => {
    if (!musicUploadFile || !musicUploadTitle.trim() || !musicUploadArtist.trim()) {
      setMusicUploadError('File, title and artist are required.');
      return;
    }

    setMusicUploadError(null);
    setMusicUploadProgress(10);
    try {
      const audioResult = await musicStorageService.uploadAudioFile(
        musicUploadFile,
        musicUploadArtist.trim(),
        'single',
        (progress) => setMusicUploadProgress(Math.floor(progress * 0.9))
      );

      const newTrackId = await musicService.createTrack({
        title: musicUploadTitle.trim(),
        artist: musicUploadArtist.trim(),
        genre: 'Live Upload',
        duration: 180,
        coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
        audioUrl: audioResult.audioUrl,
        uploadedBy: user?.uid || 'guest_creator',
        uploadedByName: myDisplayName,
        isPublic: musicUploadIsPublic,
        isPrivate: !musicUploadIsPublic,
        status: 'APPROVED',
        fileSizeBytes: audioResult.fileSizeBytes
      });

      setMusicUploadProgress(100);
      await refreshTracks();
      setTimeout(() => {
        setShowMusicUploadModal(false);
        setMusicUploadFile(null);
        setMusicUploadTitle('');
        setMusicUploadArtist('');
        setMusicUploadProgress(null);
      }, 500);
    } catch (err: any) {
      setMusicUploadError(err.message || 'Music upload failed.');
      setMusicUploadProgress(null);
    }
  };

  // Seat taking — persists to Firestore via a transaction (so two people tapping the
  // same empty seat at once can't both "win" it) and actually publishes the guest's
  // camera/mic into the Agora channel. Previously this only mutated local component
  // state, so nobody else ever saw the seat fill and no media was ever published.
  const handleTakeSeat = async (seatNum: number) => {
    if (!selectedStream?.seats) return;
    const seat = selectedStream.seats.find(s => s.seatNumber === seatNum);
    if (!seat) return;

    if (seat.userName) {
      setTargetSeatNumber(seatNum);
      setActiveSheet('GIFT');
      return;
    }

    if (myActiveSeat || guestJoinBusy) return;

    setGuestJoinBusy(true);
    try {
      const acquired = await liveStreamService.takeSeat(selectedStream.id, seatNum, {
        uid: myUserId,
        userName: myDisplayName,
        userAvatar: myAvatarUrl,
        userLevel: userLevel.currentLevel
      });
      if (!acquired) return; // someone else took this seat first

      await agoraEngine.joinChannel(selectedStream.id, 'host', myUserId);
      setGuestPublishing(true);

      const seatMsg: ChatMessage = {
        id: `seat_${Date.now()}`,
        streamId: selectedStream.id,
        senderName: myDisplayName,
        senderAvatar: myAvatarUrl,
        senderBadge: myBadge,
        senderWealthLevel: userLevel.wealthLevel,
        text: `🎉 Took Seat #${seatNum}! Mic activated.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, seatMsg]);
    } catch (err) {
      console.warn('[LiveStream] Failed to take seat:', err);
    } finally {
      setGuestJoinBusy(false);
    }
  };

  // Send Chat
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputChat.trim() || !selectedStream) return;

    const userMsg: ChatMessage = {
      id: `chat_${Date.now()}`,
      streamId: selectedStream.id,
      senderName: myDisplayName,
      senderAvatar: myAvatarUrl,
      senderBadge: myBadge,
      senderWealthLevel: userLevel.wealthLevel,
      text: inputChat.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    const currentInput = inputChat;
    setInputChat('');

    if (selectedStream.aiCohostEnabled) {
      setIsAiProcessing(true);
      try {
        const res = await apiFetch('/api/ai/cohost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: currentInput,
            mode: aiCohostMode,
            streamContext: {
              title: selectedStream.title,
              creatorName: selectedStream.creatorName
            },
            chatHistory: chatMessages.slice(-5)
          })
        });
        const data = await res.json();

        const aiMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          streamId: selectedStream.id,
          senderName: `AI Co-Host (${aiCohostMode})`,
          senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80',
          senderBadge: 'AI BOT',
          senderWealthLevel: 99,
          text: data.response || 'AI Co-Host active!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAiCohost: true
        };

        setChatMessages(prev => [...prev, aiMsg]);
      } catch (err) {
        console.error('AI Co-Host error', err);
      } finally {
        setIsAiProcessing(false);
      }
    }
  };

  // Gift sending
  const handleSendGiftCombo = (gift: GiftItem) => {
    if (!selectedStream) return;
    const totalCost = gift.coinPrice * selectedGiftCombo;
    if (wallet.coins < totalCost) {
      alert(`Need ${totalCost.toLocaleString()} Coins for ${selectedGiftCombo}x ${gift.name}. Please recharge.`);
      return;
    }

    const success = sendGift(gift, selectedStream.title, selectedStream.creatorName);
    if (success) {
      if (selectedStream.seats) {
        const updatedSeats = selectedStream.seats.map(s => {
          if (s.seatNumber === targetSeatNumber) {
            return { ...s, seatGiftsCoins: (s.seatGiftsCoins || 0) + totalCost };
          }
          return s;
        });
        setSelectedStream(prev => (prev ? { ...prev, seats: updatedSeats } : prev));
      }

      setStreamGoal(prev => ({ ...prev, currentCoins: prev.currentCoins + totalCost }));

      if (selectedStream.pkBattle) {
        setSelectedStream(prev => {
          if (!prev?.pkBattle) return prev;
          return {
            ...prev,
            pkBattle: {
              ...prev.pkBattle,
              selfScore: prev.pkBattle.selfScore + (totalCost * 2)
            }
          };
        });
      }

      const giftNotice: ChatMessage = {
        id: `gift_combo_${Date.now()}`,
        streamId: selectedStream.id,
        senderName: myDisplayName,
        senderAvatar: myAvatarUrl,
        senderBadge: myBadge,
        senderWealthLevel: userLevel.wealthLevel,
        text: `🎁 SENT ${selectedGiftCombo}x ${gift.name} ${gift.icon} (${totalCost.toLocaleString()} Coins) to Seat #${targetSeatNumber}!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isGiftNotice: true,
        giftDetails: {
          giftName: gift.name,
          giftIcon: gift.icon,
          amount: totalCost,
          comboCount: selectedGiftCombo,
          targetSeatNumber
        }
      };

      setChatMessages(prev => [...prev, giftNotice]);
      triggerHeartAnimation();

      if (selectedGiftCombo >= 10 || gift.coinPrice >= 1000) {
        setMarqueeNotice(
          `🚀 [${myBadge}] ${myDisplayName} sent ${selectedGiftCombo}x ${gift.name} (${totalCost.toLocaleString()} Coins)!`
        );
      }
    }
  };

  // Roll Dice Game
  const handleRollQuickDice = () => {
    setIsQuickRolling(true);
    let count = 0;
    const inv = setInterval(() => {
      setQuickDiceVal(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count >= 6) {
        clearInterval(inv);
        const finalVal = Math.floor(Math.random() * 6) + 1;
        setQuickDiceVal(finalVal);
        setIsQuickRolling(false);
        const winPts = finalVal * 100;
        updateGamePoints(winPts, `Dice Roll: +${winPts} Points`, 'Live Room Games');
      }
    }, 100);
  };

  const isHost = !!user && selectedStream?.creatorId === user.uid;

  // Render Discovery Homepage if no stream selected
  if (!selectedStream) {
    const liveOnlyStreams = streams.filter(s => s.isLive !== false);
    
    // Country flag mapping helper
    const getCountryFlag = (loc?: string, hostName?: string) => {
      if (loc?.includes('US') || loc?.includes('Los Angeles') || loc?.includes('New York')) return '🇺🇸';
      if (loc?.includes('UK') || loc?.includes('London')) return '🇬🇧';
      if (loc?.includes('JP') || loc?.includes('Tokyo')) return '🇯🇵';
      if (loc?.includes('BR') || loc?.includes('Rio')) return '🇧🇷';
      if (loc?.includes('NG') || loc?.includes('Lagos')) return '🇳🇬';
      if (loc?.includes('CA') || loc?.includes('Toronto')) return '🇨🇦';
      if (loc?.includes('DE') || loc?.includes('Berlin')) return '🇩🇪';
      if (hostName === 'Sophia Vance') return '🇬🇧';
      if (hostName === 'Elena Vance') return '🇯🇵';
      if (hostName === 'Marcus Chen') return '🇺🇸';
      if (hostName === 'Lucas Silva') return '🇧🇷';
      return '🇺🇸';
    };

    // Filter Logic
    let filteredStreams = liveOnlyStreams.filter(s => {
      // Search query
      if (discoverySearch.trim()) {
        const q = discoverySearch.toLowerCase();
        const matchTitle = s.title.toLowerCase().includes(q);
        const matchHost = s.creatorName.toLowerCase().includes(q);
        const matchCategory = s.category.toLowerCase().includes(q);
        const matchTags = s.tags?.some(t => t.toLowerCase().includes(q));
        const matchLocation = s.location?.toLowerCase().includes(q);
        if (!matchTitle && !matchHost && !matchCategory && !matchTags && !matchLocation) {
          return false;
        }
      }

      // Country Filter
      if (discoveryCountry !== 'ALL') {
        const flag = getCountryFlag(s.location, s.creatorName);
        if (!flag.includes(discoveryCountry) && !s.location?.toLowerCase().includes(discoveryCountry.toLowerCase())) {
          return false;
        }
      }

      // Category Filter
      if (activeCategory === 'LIVE') return !s.isPartyRoom;
      if (activeCategory === 'SOLO_LIVE') return (s.category === 'TALK_SHOW' || s.category === 'MUSIC') && !s.isPartyRoom;
      if (activeCategory === 'PARTY_ROOM') return s.isPartyRoom || s.category === 'PARTY_ROOM';
      if (activeCategory === 'AUDIO_LIVE') return s.category === 'PODCAST' || s.tags?.includes('PODCAST') || s.tags?.includes('LiveVoice');
      if (activeCategory === 'GAME_LIVE') return s.category === 'GAMING' || s.tags?.includes('GAMING');
      if (activeCategory === 'PK_BATTLE') return s.pkBattle?.isPkActive || s.category === 'PK_BATTLE';
      if (activeCategory === 'FOLLOWING') return followedHosts.includes(s.creatorName);
      if (activeCategory === 'NEARBY') return true;
      if (activeCategory === 'NEW') return s.viewersCount < 2000;
      if (activeCategory === 'TRENDING') return s.viewersCount > 3000;
      if (activeCategory === 'RECOMMENDED') return true;
      if (activeCategory === 'EVENTS') return true;

      return s.category === activeCategory;
    });

    // Sorting Logic
    filteredStreams = [...filteredStreams].sort((a, b) => {
      if (discoverySortBy === 'GIFTS') return b.likesCount - a.likesCount;
      if (discoverySortBy === 'NEWEST') return b.id.localeCompare(a.id);
      return b.viewersCount - a.viewersCount; // POPULAR
    });

    const banners = [
      {
        id: 1,
        title: '⚔️ GLOBAL PK CHAMPIONSHIP LEAGUE',
        subtitle: 'Top Hosts Battle Live! 500,000 Coin Prize Pool & Crown Badge!',
        bg: 'from-pink-900 via-purple-900 to-red-950',
        badge: 'GRAND TOURNAMENT'
      },
      {
        id: 2,
        title: '💎 TREASURE BOX & COIN RAIN',
        subtitle: 'Random 10,000 Coin Drops in 9-Seat Party Rooms every 15 mins!',
        bg: 'from-amber-950 via-purple-950 to-indigo-950',
        badge: 'LIVE REWARDS'
      },
      {
        id: 3,
        title: '🎙️ VIP AUDIO LOUNGES & PODCASTS',
        subtitle: 'Tune into live voice chat, music & open mic sessions!',
        bg: 'from-blue-950 via-slate-900 to-purple-950',
        badge: 'AUDIO LIVE'
      }
    ];

    const upcomingEvents = [
      { id: 'ev1', title: '🔥 Global PK Final Showdown', host: 'Elena Vance vs Marcus Chen', time: 'Tonight 20:00 UTC', viewers: '14.2K Registered' },
      { id: 'ev2', title: '🎙️ 9-Seat Celebrity Karaoke Night', host: 'Alex Rivers & Friends', time: 'Tomorrow 18:00 UTC', viewers: '8.9K Registered' },
      { id: 'ev3', title: '🎮 Ludo Master Creator Cup', host: 'Gaming Legends Guild', time: 'Friday 21:00 UTC', viewers: '5.1K Registered' }
    ];

    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5 pb-24">
        
        {/* 1. TOP DISCOVERY SEARCH & FILTER HEADER BAR */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800/90 rounded-3xl p-3 shadow-xl backdrop-blur-xl">
          {/* SEARCH INPUT */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={discoverySearch}
              onChange={(e) => setDiscoverySearch(e.target.value)}
              placeholder="Search hosts, live rooms, countries, games, tags..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-pink-500/80 transition-all"
            />
            {discoverySearch && (
              <button
                onClick={() => setDiscoverySearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* FILTER & LAYOUT CONTROLS */}
          <div className="flex items-center gap-2 justify-between sm:justify-end">
            {/* QUICK FILTER BUTTON */}
            <button
              onClick={() => setShowFilterModal(!showFilterModal)}
              className={`px-3 py-2 rounded-2xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                discoveryCountry !== 'ALL' || discoveryGender !== 'ALL' || discoverySortBy !== 'POPULAR'
                  ? 'bg-pink-500/20 border-pink-500/60 text-pink-300'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-pink-400" />
              <span>Filters</span>
              {(discoveryCountry !== 'ALL' || discoveryGender !== 'ALL') && (
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
              )}
            </button>

            {/* GRID LAYOUT TOGGLE */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-2xl p-1">
              <button
                onClick={() => setDiscoveryLayout('2_COL')}
                className={`p-1.5 rounded-xl transition-all ${
                  discoveryLayout === '2_COL' ? 'bg-slate-800 text-pink-400 shadow' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="2-Column Grid"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDiscoveryLayout('HERO')}
                className={`p-1.5 rounded-xl transition-all ${
                  discoveryLayout === 'HERO' ? 'bg-slate-800 text-pink-400 shadow' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Large Hero Card"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDiscoveryLayout('COMPACT')}
                className={`p-1.5 rounded-xl transition-all ${
                  discoveryLayout === 'COMPACT' ? 'bg-slate-800 text-pink-400 shadow' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Compact Grid"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* GO LIVE BUTTON */}
            {onOpenGoLiveModal && (
              <button
                onClick={onOpenGoLiveModal}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:opacity-90 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-pink-500/20 flex items-center gap-1.5 shrink-0"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Go Live</span>
              </button>
            )}
          </div>
        </div>

        {/* FILTER MODAL / DRAWER */}
        {showFilterModal && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-4 shadow-2xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-pink-400" /> Filter & Sort Live Streams
              </h4>
              <button onClick={() => setShowFilterModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* COUNTRY SELECTOR */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 block">Country / Region</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'ALL', label: '🌐 All' },
                    { id: 'US', label: '🇺🇸 USA' },
                    { id: 'UK', label: '🇬🇧 UK' },
                    { id: 'JP', label: '🇯🇵 Japan' },
                    { id: 'BR', label: '🇧🇷 Brazil' },
                    { id: 'NG', label: '🇳🇬 Nigeria' }
                  ].map(c => (
                    <button
                      key={c.id}
                      onClick={() => setDiscoveryCountry(c.id)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                        discoveryCountry === c.id
                          ? 'bg-pink-500/20 border-pink-500 text-pink-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SORT BY */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 block">Sort Order</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'POPULAR', label: '🔥 Most Popular' },
                    { id: 'GIFTS', label: '💎 Top Gifted' },
                    { id: 'NEWEST', label: '✨ Newest First' }
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setDiscoverySortBy(s.id as any)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                        discoverySortBy === s.id
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* RESET FILTERS */}
              <div className="flex items-end justify-end">
                <button
                  onClick={() => {
                    setDiscoveryCountry('ALL');
                    setDiscoveryGender('ALL');
                    setDiscoverySortBy('POPULAR');
                    setDiscoverySearch('');
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. FEATURED EVENTS CAROUSEL BANNER */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
          <div className={`p-5 sm:p-6 bg-gradient-to-r ${banners[activeBannerIndex].bg} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-500`}>
            <div className="space-y-1.5 max-w-xl">
              <span className="px-2.5 py-0.5 text-[10px] font-black tracking-wider bg-white/10 backdrop-blur-md text-amber-300 border border-white/20 rounded-full uppercase inline-block">
                {banners[activeBannerIndex].badge}
              </span>
              <h3 className="text-base sm:text-xl font-black text-white tracking-tight">
                {banners[activeBannerIndex].title}
              </h3>
              <p className="text-xs text-slate-200 font-medium leading-relaxed">
                {banners[activeBannerIndex].subtitle}
              </p>
            </div>
            <button
              onClick={() => {
                if (activeCategory !== 'PK_BATTLE') setActiveCategory('PK_BATTLE');
              }}
              className="px-4 py-2.5 bg-white text-slate-950 font-black text-xs rounded-2xl shadow-xl hover:bg-slate-100 transition-all shrink-0 flex items-center gap-1.5"
            >
              <span>Explore Event</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* BANNER INDICATOR DOTS */}
          <div className="absolute bottom-2 right-4 flex items-center gap-1.5 z-10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveBannerIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  activeBannerIndex === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 3. HORIZONTAL DISCOVERY CATEGORIES SCROLL BAR */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-slate-800/80">
          {[
            { id: 'RECOMMENDED', label: '🔥 Recommended' },
            { id: 'LIVE', label: '📹 Live' },
            { id: 'PARTY_ROOM', label: '🥳 Party (9 Seats)' },
            { id: 'AUDIO_LIVE', label: '🎙️ Audio & Voice' },
            { id: 'GAME_LIVE', label: '🎮 Game Live' },
            { id: 'PK_BATTLE', label: '⚔️ PK Battles' },
            { id: 'FOLLOWING', label: '⭐ Following' },
            { id: 'NEARBY', label: '📍 Nearby' },
            { id: 'NEW', label: '✨ New' },
            { id: 'TRENDING', label: '🚀 Trending' },
            { id: 'EVENTS', label: '📅 Events' }
          ].map(cat => {
            const isAct = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-black tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isAct
                    ? 'bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-lg shadow-pink-500/25 border border-pink-400/40 scale-105'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* 4. FOLLOWING TAB SPECIFIC VIEW */}
        {activeCategory === 'FOLLOWING' && (
          <div className="space-y-4 bg-slate-900/40 border border-slate-800/60 rounded-3xl p-4">
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Followed Creators
            </h4>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
              {['Alex Rivers', 'Sophia Vance', 'Elena Vance', 'Marcus Chen'].map((name, i) => (
                <div key={i} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer">
                  <div className="relative">
                    <img
                      src={`https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80`}
                      alt={name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-pink-500 p-0.5"
                    />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 truncate max-w-[70px]">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. EVENTS TAB SPECIFIC VIEW */}
        {activeCategory === 'EVENTS' && (
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> Upcoming Live Tournaments & Shows
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {upcomingEvents.map(ev => (
                <div key={ev.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2">
                  <span className="px-2 py-0.5 text-[9px] font-black bg-purple-950 text-purple-300 border border-purple-800 rounded-full">
                    UPCOMING
                  </span>
                  <h5 className="text-xs font-bold text-slate-100">{ev.title}</h5>
                  <p className="text-[11px] text-slate-400">{ev.host}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                    <span>⏰ {ev.time}</span>
                    <button
                      onClick={() => setReminders(prev => ({ ...prev, [ev.id]: !prev[ev.id] }))}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all ${
                        reminders[ev.id] ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {reminders[ev.id] ? '✓ Reminder Set' : 'Set Reminder'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. MAIN LIVE STREAM CARDS GRID */}
        {!streamsLoaded ? (
          <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-10 h-10 border-2 border-slate-700 border-t-pink-500 rounded-full animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Discovering live streams…</p>
          </div>
        ) : filteredStreams.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-8">
            <Radio className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-black text-slate-200">No active streams found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are no live broadcasts matching your search query or filters. Start your own live broadcast right now!
            </p>
            {onOpenGoLiveModal && (
              <button
                onClick={onOpenGoLiveModal}
                className="px-5 py-2.5 bg-gradient-to-r from-pink-500 via-purple-600 to-amber-500 text-white font-black text-xs rounded-2xl shadow-xl mx-auto flex items-center gap-2 inline-flex"
              >
                <Camera className="w-4 h-4" /> Start Broadcast
              </button>
            )}
          </div>
        ) : (
          <div className={`grid gap-4 ${
            discoveryLayout === 'HERO'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : discoveryLayout === 'COMPACT'
              ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
          }`}>
            {filteredStreams.map(stream => {
              const countryFlag = getCountryFlag(stream.location, stream.creatorName);
              const isPk = stream.pkBattle?.isPkActive;

              return (
                <div
                  key={stream.id}
                  onClick={() => setSelectedStream(stream)}
                  className="group relative bg-slate-900 border border-slate-800 hover:border-pink-500/60 rounded-3xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-500/10 flex flex-col"
                >
                  {/* CARD PREVIEW IMAGE */}
                  <div className={`relative bg-slate-950 overflow-hidden ${
                    discoveryLayout === 'HERO' ? 'aspect-[16/10]' : 'aspect-[3/4]'
                  }`}>
                    <img
                      src={stream.thumbnailUrl}
                      alt={stream.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-slate-950/20" />

                    {/* TOP BADGES LAYER */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 z-10">
                      {/* LIVE BADGE WITH PULSE */}
                      <span className="px-2 py-0.5 bg-red-600/90 backdrop-blur-md text-white font-black text-[9px] rounded-full flex items-center gap-1 shadow-lg animate-pulse">
                        <Radio className="w-2.5 h-2.5" /> LIVE
                      </span>

                      {/* VIEWER COUNT */}
                      <span className="px-2 py-0.5 bg-slate-950/80 backdrop-blur-md text-slate-200 text-[9px] font-extrabold rounded-full border border-white/10 flex items-center gap-1 shadow">
                        👁️ {stream.viewersCount.toLocaleString()}
                      </span>
                    </div>

                    {/* TYPE TAGS */}
                    <div className="absolute top-9 left-2.5 z-10 flex flex-col items-start gap-1">
                      {stream.isPartyRoom && (
                        <span className="px-2 py-0.5 bg-purple-600/90 text-white font-black text-[8px] rounded-full uppercase tracking-wider shadow">
                          🎙️ 9 SEATS ({stream.seats?.filter(s => s.userName).length || 6}/9)
                        </span>
                      )}
                      {isPk && (
                        <span className="px-2 py-0.5 bg-gradient-to-r from-red-600 to-blue-600 text-white font-black text-[8px] rounded-full uppercase tracking-wider shadow">
                          ⚔️ PK BATTLE
                        </span>
                      )}
                      {stream.category === 'GAMING' && (
                        <span className="px-2 py-0.5 bg-emerald-600/90 text-white font-black text-[8px] rounded-full uppercase tracking-wider shadow">
                          🎮 GAME LIVE
                        </span>
                      )}
                    </div>

                    {/* PK BATTLE SCORE OVERLAY IF PK ACTIVE */}
                    {isPk && stream.pkBattle && (
                      <div className="absolute top-1/2 left-2 right-2 -translate-y-1/2 z-10 bg-slate-950/85 backdrop-blur-md border border-red-500/40 rounded-xl p-1.5 flex items-center justify-between text-[10px] font-black text-white shadow-xl">
                        <span className="text-red-400">RED: {stream.pkBattle.selfScore}</span>
                        <span className="text-amber-400">VS</span>
                        <span className="text-blue-400">BLUE: {stream.pkBattle.opponentScore}</span>
                      </div>
                    )}

                    {/* HOST INFO & TITLE OVERLAY AT BOTTOM */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={stream.creatorAvatar}
                          alt={stream.creatorName}
                          className="w-6 h-6 rounded-full object-cover ring-2 ring-pink-500 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <span className="font-extrabold text-xs text-slate-100 truncate flex items-center gap-1">
                          {stream.creatorName}
                          <span className="text-[11px]">{countryFlag}</span>
                        </span>
                      </div>
                      <p className="text-[11px] font-extrabold text-slate-200 line-clamp-1 group-hover:text-pink-300 transition-colors">
                        {stream.title}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // FULL SCREEN LIVE EXPERIENCE FOR SELECTED STREAM
  return (
    <div className="fixed inset-0 z-[60] w-full h-full bg-slate-950 overflow-hidden flex flex-col justify-between selection:bg-pink-500">
      
      {/* 1. BACKGROUND FULL-SCREEN STAGE / VIDEO LAYER */}
      <div className="absolute inset-0 z-0">
        {layoutMode === 'VIDEO_ONLY' && currentVideo ? (
          <video
            src={currentVideo.videoUrl}
            autoPlay={isVideoPlaying}
            loop={false}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : layoutMode === 'CAMERA_AND_VIDEO' && currentVideo ? (
          <div className="w-full h-full relative">
            <video
              src={currentVideo.videoUrl}
              autoPlay={isVideoPlaying}
              loop={false}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {webcamEnabled && (
              <div className="absolute bottom-24 right-4 w-40 h-32 rounded-2xl overflow-hidden border-2 border-pink-500/80 shadow-2xl z-20 bg-slate-900">
                <div ref={videoRef} className="w-full h-full object-cover [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
                <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-slate-950/80 text-[8px] font-black text-pink-300 rounded">
                  HOST CAM
                </span>
              </div>
            )}
          </div>
        ) : (isHost && webcamEnabled) || (!isHost && remoteVideoActive) ? (
          <div ref={videoRef} className="w-full h-full object-cover [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
        ) : (
          <div className="w-full h-full relative flex items-center justify-center">
            <img
              src={selectedStream.thumbnailUrl}
              alt={selectedStream.title}
              className="w-full h-full object-cover opacity-40 blur-md scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/30 to-slate-950/95" />
          </div>
        )}
      </div>

      {/* FLOATING HEART PARTICLES OVERLAY */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        {hearts.map(h => (
          <div
            key={h.id}
            className="absolute bottom-20 text-3xl animate-float-heart"
            style={{ left: `${h.left}%` }}
          >
            ❤️
          </div>
        ))}
      </div>

      {/* 2. OVERLAID TOP HEADER STRIP */}
      <div className="relative z-20 p-3 flex items-center justify-between gap-2 pointer-events-auto max-w-full">
        {/* HOST CARD & GOAL */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-950/70 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
            <img
              src={selectedStream.creatorAvatar}
              alt={selectedStream.creatorName}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-pink-500 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 pr-1">
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-xs text-slate-100 truncate max-w-[100px]">{selectedStream.creatorName}</span>
                <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 text-[8px] font-black rounded uppercase">
                  Lv.{selectedStream.creatorLevel}
                </span>
              </div>
              <span className="text-[9px] text-pink-300 font-bold block truncate">{selectedStream.title}</span>
            </div>
            {!isHost && (
              <button
                onClick={() => alert(`Followed ${selectedStream.creatorName}!`)}
                className="px-2.5 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-[10px] rounded-full shadow hover:opacity-90 shrink-0"
              >
                + Follow
              </button>
            )}
          </div>

          {/* STREAM GOAL PILL */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-950/70 backdrop-blur-xl border border-amber-500/30 px-3 py-1.5 rounded-full text-amber-300 text-[11px] font-black">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>Goal: {streamGoal.currentCoins.toLocaleString()} / {streamGoal.targetCoins.toLocaleString()} 🪙</span>
          </div>
        </div>

        {/* RIGHT TOP STATUS: LIVE BADGE, VIEWERS, TREASURE BOX, CLOSE STREAM */}
        <div className="flex items-center gap-2">
          {/* TIMED TREASURE BOX */}
          <button
            onClick={() => {
              if (treasureTimeLeft === 0 && !treasureClaimed) {
                setTreasureClaimed(true);
                updateGamePoints(500, 'Treasure Box Reward: +500 Points', 'Live Stream');
                alert('🎁 Treasure Box Claimed! +500 Gaming Points added to your wallet.');
              } else {
                setActiveSheet('TREASURE');
              }
            }}
            className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] rounded-full flex items-center gap-1 shadow-lg animate-pulse"
          >
            🎁 {treasureClaimed ? 'Claimed' : treasureTimeLeft > 0 ? `${Math.floor(treasureTimeLeft / 60)}:${('0' + (treasureTimeLeft % 60)).slice(-2)}` : 'OPEN!'}
          </button>

          <span className="px-2.5 py-1 bg-red-600/90 text-white font-black text-[10px] rounded-full flex items-center gap-1 shadow-lg animate-pulse">
            <Radio className="w-3 h-3" /> LIVE
          </span>

          <span className="px-2.5 py-1 bg-slate-950/70 backdrop-blur-xl text-slate-200 text-[10px] font-bold rounded-full border border-white/10 flex items-center gap-1">
            👁️ {selectedStream.viewersCount.toLocaleString()}
          </span>

          <button
            onClick={handleCloseStream}
            className="p-1.5 bg-slate-950/70 backdrop-blur-xl hover:bg-slate-800 text-slate-300 rounded-full border border-white/10 transition-colors"
            title="Leave Stream Room"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* GLOBAL TICKER MARQUEE OVERLAY */}
      <div className="relative z-20 px-4 pointer-events-auto">
        <div className="max-w-xl mx-auto bg-slate-950/60 backdrop-blur-md border border-purple-500/30 rounded-full px-3 py-1 flex items-center gap-2 text-xs font-bold text-amber-300 truncate shadow-lg">
          <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black text-[9px] rounded uppercase">HOT</span>
          <span className="truncate">{marqueeNotice}</span>
        </div>
      </div>

      {/* 3. CENTER STAGE: MULTI-GUEST 9-SEAT GRID OR 1v1 PK BATTLE */}
      <div className="relative z-10 my-auto p-4 max-w-2xl mx-auto w-full pointer-events-auto">
        {selectedStream.isPartyRoom && selectedStream.seats ? (
          /* 9-SEAT PARTY ROOM FROSTED GLASS GRID */
          <div className="space-y-3 bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                {isConferenceMode ? '🎥 Multi-Guest Video Conference' : `🎙️ 9-Seat Voice Party • ${partyTheme} Theme`}
              </span>
              {!isConferenceMode && (
              <div className="flex items-center gap-1">
                {['KARAOKE', 'DATING', 'CHILL'].map(t => (
                  <button
                    key={t}
                    onClick={() => setPartyTheme(t as any)}
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${
                      partyTheme === t ? 'bg-amber-400 text-slate-950' : 'bg-slate-900/80 text-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              )}
            </div>

            <div className={isConferenceMode ? 'grid grid-cols-2 gap-2.5' : 'grid grid-cols-3 gap-2.5'}>
              {selectedStream.seats.map(seat => {
                const isTargeted = targetSeatNumber === seat.seatNumber;
                return (
                  <div
                    key={seat.seatNumber}
                    onClick={() => handleTakeSeat(seat.seatNumber)}
                    className={`relative p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-1 backdrop-blur-md ${
                      seat.userName
                        ? isTargeted
                          ? 'bg-purple-950/90 border-amber-400 ring-2 ring-amber-400/50 shadow-xl'
                          : 'bg-slate-900/70 border-white/10 hover:border-purple-400'
                        : 'bg-slate-950/40 border-dashed border-white/10 hover:border-white/30 hover:bg-slate-900/40'
                    }`}
                  >
                    <span className="absolute top-1 left-1 px-1 py-0.2 bg-slate-950/80 text-slate-400 text-[8px] font-mono font-black rounded">
                      #{seat.seatNumber} {seat.isHost ? 'HOST' : ''}
                    </span>

                    {(isHost || seat.uid === myUserId) && seat.userName && !seat.isHost && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (seat.uid === myUserId) handleLeaveSeat();
                          else handleKickFromSeat(seat.seatNumber);
                        }}
                        title={seat.uid === myUserId ? 'Leave seat' : 'Remove from seat'}
                        className="absolute top-1 right-1 p-0.5 bg-slate-950/80 text-slate-400 hover:text-rose-400 rounded-full z-10"
                      >
                        <UserX className="w-3 h-3" />
                      </button>
                    )}

                    {seat.userName ? (
                      <>
                        <div className={isConferenceMode
                          ? 'relative w-full aspect-video rounded-xl overflow-hidden ring-1 ring-white/15 shadow-lg bg-slate-800'
                          : 'relative mt-2 w-10 h-10 rounded-full overflow-hidden ring-2 ring-amber-400 shadow-lg bg-slate-800'
                        }>
                          <img
                            src={seat.userAvatar}
                            alt={seat.userName}
                            className={isConferenceMode ? 'absolute inset-0 w-full h-full object-cover' : 'absolute inset-0 w-10 h-10 rounded-full object-cover'}
                            referrerPolicy="no-referrer"
                          />
                          {seat.uid && seat.isCameraOn !== false && (
                            <div
                              ref={getSeatVideoRef(seat.seatNumber, seat.uid)}
                              className="absolute inset-0 [&>video]:!w-full [&>video]:!h-full [&>video]:object-cover"
                            />
                          )}
                          {isConferenceMode && (
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.2 bg-slate-950/80 text-slate-100 text-[9px] font-bold rounded truncate max-w-[75%]">
                              {seat.userName}
                            </span>
                          )}
                          {(isHost || seat.uid === myUserId) ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleSeatMute(seat.seatNumber, seat.isMuted); }}
                              title={seat.isMuted ? 'Unmute' : 'Mute'}
                              className={`absolute bottom-0 right-0 rounded-full p-0.5 border z-10 ${
                                seat.isMuted ? 'bg-slate-950 border-red-500' : 'bg-slate-950 border-emerald-500'
                              }`}
                            >
                              {seat.isMuted ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3 text-emerald-400" />}
                            </button>
                          ) : seat.isMuted ? (
                            <MicOff className="w-3 h-3 text-red-400 absolute bottom-0 right-0 bg-slate-950 rounded-full p-0.5 border border-red-500 z-10" />
                          ) : (
                            <Mic className="w-3 h-3 text-emerald-400 absolute bottom-0 right-0 bg-slate-950 rounded-full p-0.5 border border-emerald-500 z-10" />
                          )}
                        </div>
                        <span className={isConferenceMode ? 'hidden' : 'text-[11px] font-extrabold text-slate-100 line-clamp-1 max-w-[80px]'}>
                          {seat.userName}
                        </span>
                        <span className="text-[9px] font-black text-amber-300">
                          🪙 {(seat.seatGiftsCoins || 0).toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <div className="py-1.5 flex flex-col items-center justify-center text-slate-500 space-y-0.5">
                        <UserPlus className="w-5 h-5 text-slate-400" />
                        <span className="text-[9px] font-bold">{guestJoinBusy ? 'Joining…' : 'Sit Down'}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : selectedStream.pkBattle ? (
          /* 1v1 PK BATTLE SPLIT STAGE OVERLAY */
          <div className="space-y-3 max-w-lg mx-auto bg-slate-950/60 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-red-400 flex items-center gap-1">
                  🔴 RED: {selectedStream.creatorName} ({selectedStream.pkBattle.selfScore.toLocaleString()} Pts)
                </span>
                <span className="text-amber-300 font-mono text-[11px]">
                  ⏳ 02:45 PK
                </span>
                <span className="text-cyan-400 flex items-center gap-1">
                  🔵 BLUE: {selectedStream.pkBattle.opponentName} ({selectedStream.pkBattle.opponentScore.toLocaleString()} Pts)
                </span>
              </div>

              <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-white/10 flex shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-500"
                  style={{
                    width: `${
                      (selectedStream.pkBattle.selfScore /
                        (selectedStream.pkBattle.selfScore + selectedStream.pkBattle.opponentScore || 1)) * 100
                    }%`
                  }}
                />
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 flex-1 transition-all duration-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-950/40 border border-red-500/50 rounded-2xl p-3 text-center space-y-1.5">
                <img
                  src={selectedStream.creatorAvatar}
                  alt={selectedStream.creatorName}
                  className="w-12 h-12 rounded-full object-cover mx-auto ring-2 ring-red-500 shadow-xl"
                  referrerPolicy="no-referrer"
                />
                <h4 className="font-extrabold text-xs text-red-200">{selectedStream.creatorName}</h4>
                <button
                  onClick={() => {
                    setTargetSeatNumber(1);
                    setActiveSheet('GIFT');
                  }}
                  className="w-full py-1 bg-gradient-to-r from-red-600 to-orange-600 text-white font-black text-[10px] rounded-xl shadow"
                >
                  Boost Red 🔥
                </button>
              </div>

              <div className="bg-cyan-950/40 border border-cyan-500/50 rounded-2xl p-3 text-center space-y-1.5">
                <img
                  src={selectedStream.pkBattle.opponentAvatar}
                  alt={selectedStream.pkBattle.opponentName}
                  className="w-12 h-12 rounded-full object-cover mx-auto ring-2 ring-cyan-500 shadow-xl"
                  referrerPolicy="no-referrer"
                />
                <h4 className="font-extrabold text-xs text-cyan-200">{selectedStream.pkBattle.opponentName}</h4>
                <button
                  onClick={() => {
                    setTargetSeatNumber(2);
                    setActiveSheet('GIFT');
                  }}
                  className="w-full py-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-[10px] rounded-xl shadow"
                >
                  Boost Blue ⚡
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* 4. RIGHT SIDE VERTICALLY ALIGNED FLOATING ACTION BUTTONS RAIL — hidden by
          default behind a single toggle so the video isn't permanently covered by
          9 icon buttons; tap the toggle to reveal/hide the rest. */}
      <div className="absolute right-3 top-20 z-30 flex flex-col items-center gap-2.5 pointer-events-auto">
        <button
          onClick={() => setControlsVisible(v => !v)}
          title={controlsVisible ? 'Hide controls' : 'Show controls'}
          className={`w-10 h-10 rounded-full backdrop-blur-xl border border-white/15 flex items-center justify-center transition-all shadow-xl ${
            controlsVisible ? 'bg-pink-600' : 'bg-slate-950/70 hover:bg-slate-800'
          }`}
        >
          {controlsVisible ? <X className="w-5 h-5 text-white" /> : <MoreHorizontal className="w-5 h-5 text-slate-100" />}
        </button>

        {controlsVisible && (
        <>
        {isHost && (
          <button
            onClick={toggleWebcam}
            disabled={agoraJoining}
            title={agoraJoining ? 'Connecting...' : webcamEnabled ? 'Stop Cam' : 'Live Cam'}
            className="w-10 h-10 rounded-full bg-slate-950/70 backdrop-blur-xl hover:bg-slate-800 border border-white/15 flex items-center justify-center transition-all shadow-xl disabled:opacity-50"
          >
            <Camera className={`w-5 h-5 ${webcamEnabled ? 'text-emerald-400' : 'text-amber-400'}`} />
          </button>
        )}

        {isHost && (
          <button
            onClick={() => setActiveSheet(activeSheet === 'DASHBOARD' ? 'NONE' : 'DASHBOARD')}
            title="Host Live Dashboard"
            className="w-10 h-10 rounded-full bg-slate-950/70 backdrop-blur-xl hover:bg-slate-800 border border-white/15 flex items-center justify-center transition-all shadow-xl"
          >
            <BarChart3 className="w-5 h-5 text-indigo-400" />
          </button>
        )}

        {supportsGuests && (
        <button
          onClick={() => setActiveSheet(activeSheet === 'GUESTS' ? 'NONE' : 'GUESTS')}
          title="Guest Requests Queue"
          className="relative w-10 h-10 rounded-full bg-slate-950/70 backdrop-blur-xl hover:bg-slate-800 border border-white/15 flex items-center justify-center transition-all shadow-xl"
        >
          <Users className="w-5 h-5 text-pink-400" />
          {guestRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
              {guestRequests.length}
            </span>
          )}
        </button>
        )}

        <button
          onClick={() => setActiveSheet(activeSheet === 'MUSIC' ? 'NONE' : 'MUSIC')}
          title="Music Broadcast"
          className="relative w-10 h-10 rounded-full bg-slate-950/70 backdrop-blur-xl hover:bg-purple-900/60 border border-white/15 flex items-center justify-center transition-all shadow-xl"
        >
          <Music className="w-5 h-5 text-purple-300" />
          {isPlaying && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveSheet(activeSheet === 'VIDEO' ? 'NONE' : 'VIDEO')}
          title="Sync Video Hub"
          className="relative w-10 h-10 rounded-full bg-slate-950/70 backdrop-blur-xl hover:bg-cyan-900/60 border border-white/15 flex items-center justify-center transition-all shadow-xl"
        >
          <Video className="w-5 h-5 text-cyan-300" />
          {currentVideo && isVideoPlaying && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveSheet(activeSheet === 'PK' ? 'NONE' : 'PK')}
          title="1v1 PK Battle"
          className="w-10 h-10 rounded-full bg-slate-950/70 backdrop-blur-xl hover:bg-amber-900/60 border border-white/15 flex items-center justify-center transition-all shadow-xl"
        >
          <Swords className="w-5 h-5 text-amber-400" />
        </button>

        <button
          onClick={() => setActiveSheet(activeSheet === 'GAMES' ? 'NONE' : 'GAMES')}
          title="Mini Games"
          className="w-10 h-10 rounded-full bg-slate-950/70 backdrop-blur-xl hover:bg-slate-800 border border-white/15 flex items-center justify-center transition-all shadow-xl"
        >
          <Dices className="w-5 h-5 text-amber-300" />
        </button>

        <button
          onClick={() => setActiveSheet(activeSheet === 'EFFECTS' ? 'NONE' : 'EFFECTS')}
          title="Beauty & Filters"
          className="w-10 h-10 rounded-full bg-slate-950/70 backdrop-blur-xl hover:bg-pink-900/60 border border-white/15 flex items-center justify-center transition-all shadow-xl"
        >
          <Sparkles className="w-5 h-5 text-pink-400" />
        </button>

        <button
          onClick={() => setShowRedPacketModal(true)}
          title="Red Packet Drop"
          className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center shadow-2xl animate-bounce"
        >
          🧧
        </button>

        <button
          onClick={() => setActiveSheet(activeSheet === 'MORE_TOOLS' ? 'NONE' : 'MORE_TOOLS')}
          title="More Room Tools"
          className="w-10 h-10 rounded-full bg-slate-950/70 backdrop-blur-xl hover:bg-slate-800 border border-white/15 flex items-center justify-center transition-all shadow-xl"
        >
          <Plus className="w-5 h-5 text-slate-100" />
        </button>
        </>
        )}
      </div>

      {/* 5. OVERLAID TRANSLUCENT CHAT LOG (LOWER-LEFT) */}
      <div className="absolute bottom-20 left-3 z-20 max-w-[280px] sm:max-w-xs max-h-48 overflow-y-auto pointer-events-auto space-y-1.5 p-2.5 bg-slate-950/50 backdrop-blur-md rounded-2xl border border-white/10 no-scrollbar">
        {chatMessages.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic">Welcome to the stream! Say hello in chat...</p>
        ) : (
          chatMessages.map(msg => (
            <div
              key={msg.id}
              className={`p-2 rounded-xl text-[11px] space-y-0.5 transition-all ${
                msg.isGiftNotice
                  ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent border border-amber-500/40 text-amber-200 font-bold'
                  : msg.isAiCohost
                  ? 'bg-purple-950/60 border border-purple-500/30 text-purple-200'
                  : 'bg-slate-950/60 text-slate-200 border border-white/5'
              }`}
            >
              <div className="flex items-center gap-1">
                <img
                  src={msg.senderAvatar}
                  alt={msg.senderName}
                  className="w-4 h-4 rounded-full object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
                <span className="font-extrabold text-[10px] text-amber-300 truncate">{msg.senderName}</span>
                {msg.senderBadge && (
                  <span className="px-1 py-0.2 bg-purple-500/30 text-purple-300 text-[8px] font-black rounded uppercase">
                    {msg.senderBadge}
                  </span>
                )}
              </div>
              <p className="leading-snug break-words">{msg.text}</p>
            </div>
          ))
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* 6. BOTTOM ACTION CONTROL BAR */}
      <div className="relative z-30 p-3 pointer-events-auto max-w-xl mx-auto w-full">
        <div className="flex items-center justify-between gap-2 bg-slate-950/80 backdrop-blur-xl border border-white/10 px-3 py-2 rounded-full shadow-2xl">
          {/* CHAT INPUT TRIGGER BUTTON OR INLINE FORM */}
          {isChatInputOpen ? (
            <form onSubmit={handleSendChat} className="flex-1 flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                placeholder="Say something..."
                value={inputChat}
                onChange={(e) => setInputChat(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-full px-3 py-1 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
              <button
                type="submit"
                className="p-1.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsChatInputOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsChatInputOpen(true)}
              className="flex-1 text-left px-3.5 py-2 bg-slate-900/70 hover:bg-slate-900 text-slate-400 text-xs font-medium rounded-full border border-white/5 truncate flex items-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>Say something in chat...</span>
            </button>
          )}

          {/* LIKE / HEART BUTTON */}
          <button
            onClick={() => {
              triggerHeartAnimation();
              setSelectedStream(prev => prev ? { ...prev, likesCount: prev.likesCount + 1 } : prev);
            }}
            className="p-2.5 bg-slate-900/80 hover:bg-pink-950/60 text-pink-400 rounded-full border border-pink-500/30 transition-all active:scale-90 shadow-lg"
            title="Send Likes"
          >
            <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
          </button>

          {/* GIFT TRIGGER BUTTON */}
          <button
            onClick={() => setActiveSheet(activeSheet === 'GIFT' ? 'NONE' : 'GIFT')}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:opacity-95 text-slate-950 font-black text-xs rounded-full shadow-lg shadow-amber-500/20 flex items-center gap-1.5 shrink-0"
          >
            <Gift className="w-4 h-4" />
            <span>Gift</span>
          </button>

          {/* MORE TOOLS (+) BUTTON */}
          <button
            onClick={() => setActiveSheet(activeSheet === 'MORE_TOOLS' ? 'NONE' : 'MORE_TOOLS')}
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-full border border-white/10 transition-all shadow-lg"
            title="More Options"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7. FLOATING BOTTOM SHEETS / DRAWERS OVERLAYS */}

      {/* A. GIFT DRAWER BOTTOM SHEET */}
      {activeSheet === 'GIFT' && (
        <div className="absolute inset-x-0 bottom-0 z-[70] bg-slate-900/95 backdrop-blur-2xl border-t border-amber-500/40 rounded-t-3xl p-4 shadow-2xl animate-fade-in space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h4 className="font-black text-sm text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> GIFT CATALOG & COMBOS
              </h4>
              <p className="text-[11px] text-slate-400">Targeting Seat #{targetSeatNumber} • Balance: 🪙 {wallet.coins.toLocaleString()} Coins</p>
            </div>
            <button onClick={() => setActiveSheet('NONE')} className="p-1 text-slate-400 hover:text-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* COMBO MULTIPLIER BUTTONS */}
          <div className="flex items-center justify-between bg-slate-950 p-2 rounded-2xl border border-slate-800">
            <span className="text-xs font-extrabold text-amber-400">Combo Multiplier:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { count: 1, label: '1x' },
                { count: 10, label: '10x' },
                { count: 66, label: '66x' },
                { count: 520, label: '520x' },
                { count: 1314, label: '1314x' }
              ].map(combo => (
                <button
                  key={combo.count}
                  onClick={() => setSelectedGiftCombo(combo.count)}
                  className={`px-3 py-1 text-xs font-black rounded-xl transition-all ${
                    selectedGiftCombo === combo.count
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {combo.label}
                </button>
              ))}
            </div>
          </div>

          {/* GIFTS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {gifts.map(g => {
              const totalCoins = g.coinPrice * selectedGiftCombo;
              return (
                <button
                  key={g.id}
                  onClick={() => handleSendGiftCombo(g)}
                  className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-400/80 rounded-2xl text-left transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">{g.icon}</div>
                    <h5 className="font-extrabold text-xs text-slate-100">{g.name}</h5>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{g.description}</p>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="font-black text-amber-300">🪙 {totalCoins.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-cyan-400">{selectedGiftCombo}x</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* B. MUSIC BOTTOM SHEET */}
      {activeSheet === 'MUSIC' && (
        <div className="absolute inset-x-0 bottom-0 z-[70] bg-slate-900/95 backdrop-blur-2xl border-t border-purple-500/40 rounded-t-3xl p-4 shadow-2xl animate-fade-in space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-purple-400" />
              <h4 className="font-black text-sm text-slate-100">Live Stream Music Broadcast</h4>
            </div>
            <button onClick={() => setActiveSheet('NONE')} className="p-1 text-slate-400 hover:text-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* CURRENT TRACK CONTROL */}
          <div className="bg-slate-950 p-3 rounded-2xl border border-purple-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-900/50 flex items-center justify-center shrink-0 overflow-hidden">
                {currentTrack?.coverImage ? (
                  <img src={currentTrack.coverImage} className="w-full h-full object-cover" />
                ) : (
                  <Disc className="w-5 h-5 text-purple-400 animate-spin" />
                )}
              </div>
              <div className="min-w-0">
                <h5 className="font-extrabold text-xs text-slate-100 truncate">{currentTrack?.title || 'No Track Playing'}</h5>
                <p className="text-[10px] text-slate-400 truncate">{currentTrack?.artist || 'Select a track below'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (isPlaying) pauseTrack();
                  else if (currentTrack) resumeTrack();
                  else if (tracks.length > 0) playTrack(tracks[0]);
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button onClick={nextTrack} className="p-1.5 bg-slate-800 text-slate-300 rounded-xl">
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TRACKS LIST */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Track Library ({tracks.length})</span>
              {isHost && (
                <button
                  onClick={() => setShowMusicUploadModal(true)}
                  className="text-amber-400 text-[11px] hover:underline flex items-center gap-1"
                >
                  <Upload className="w-3 h-3" /> Upload Custom MP3
                </button>
              )}
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {tracks.map(t => (
                <div
                  key={t.id}
                  onClick={() => playTrack(t)}
                  className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer ${
                    currentTrack?.id === t.id ? 'bg-purple-950/80 border border-purple-500/50 text-purple-200' : 'bg-slate-950 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="font-bold truncate">{t.title} - {t.artist}</span>
                  <Play className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* C. VIDEO BOTTOM SHEET */}
      {activeSheet === 'VIDEO' && (
        <div className="absolute inset-x-0 bottom-0 z-[70] bg-slate-900/95 backdrop-blur-2xl border-t border-cyan-500/40 rounded-t-3xl p-4 shadow-2xl animate-fade-in space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-cyan-400" />
              <h4 className="font-black text-sm text-slate-100">Synchronized Video Broadcast Hub</h4>
            </div>
            <button onClick={() => setActiveSheet('NONE')} className="p-1 text-slate-400 hover:text-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {[
              { mode: 'FULL_VIDEO', label: 'Full Video' },
              { mode: 'CAMERA_AND_VIDEO', label: 'Cam + Video PIP' },
              { mode: 'VIDEO_ONLY', label: 'Video Only' }
            ].map(l => (
              <button
                key={l.mode}
                onClick={() => setLayoutMode(l.mode as any)}
                className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                  layoutMode === l.mode ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <h5 className="text-xs font-bold text-slate-300">Video Library ({videoLibrary.length})</h5>
            <div className="grid grid-cols-2 gap-2">
              {videoLibrary.map(v => (
                <div
                  key={v.id}
                  onClick={() => playVideo(v)}
                  className={`p-2 rounded-2xl border cursor-pointer flex items-center gap-2 ${
                    currentVideo?.id === v.id ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200' : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <Film className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs font-bold truncate">{v.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* D. GUEST QUEUE BOTTOM SHEET */}
      {activeSheet === 'GUESTS' && supportsGuests && (
        <div className="absolute inset-x-0 bottom-0 z-[70] bg-slate-900/95 backdrop-blur-2xl border-t border-pink-500/40 rounded-t-3xl p-4 shadow-2xl animate-fade-in space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-400" />
              <h4 className="font-black text-sm text-slate-100">Guest Join Request Queue</h4>
            </div>
            <button onClick={() => setActiveSheet('NONE')} className="p-1 text-slate-400 hover:text-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          {!isHost && !myActiveSeat && (
            <button
              disabled={guestJoinBusy || guestRequests.some(r => r.userId === myUserId)}
              onClick={() => {
                if (!selectedStream) return;
                moderationService.submitMicRequest(selectedStream.id, modState?.micRequests || [], myUserId, myDisplayName, myAvatarUrl);
              }}
              className="w-full py-2.5 bg-pink-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              {guestRequests.some(r => r.userId === myUserId) ? 'Request Sent — Waiting for Host' : 'Request to Join as Guest'}
            </button>
          )}

          {guestRequests.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No pending guest requests right now.</p>
          ) : (
            <div className="space-y-2">
              {guestRequests.map(req => (
                <div key={req.userId} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img src={req.userAvatar} alt={req.userName} className="w-9 h-9 rounded-full object-cover ring-2 ring-pink-500" referrerPolicy="no-referrer" />
                    <span className="font-extrabold text-xs text-slate-100 block">{req.userName}</span>
                  </div>
                  {isHost && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => moderationService.handleMicRequest(selectedStream!.id, modState?.micRequests || [], req.userId, true, myUserId)}
                        className="px-3 py-1.5 bg-emerald-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => moderationService.handleMicRequest(selectedStream!.id, modState?.micRequests || [], req.userId, false, myUserId)}
                        className="p-1.5 bg-slate-800 text-slate-400 hover:text-rose-400 rounded-xl"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* E. HOST DASHBOARD SHEET */}
      {activeSheet === 'DASHBOARD' && (
        <div className="absolute inset-x-0 bottom-0 z-[70] bg-slate-950/95 backdrop-blur-2xl border-t border-purple-500/40 rounded-t-3xl shadow-2xl animate-fade-in max-h-[85vh] overflow-y-auto">
          <CreatorStudioView isOverlay={true} onClose={() => setActiveSheet('NONE')} />
        </div>
      )}

      {/* F. BEAUTY & EFFECTS SHEET */}
      {activeSheet === 'EFFECTS' && (
        <div className="absolute inset-x-0 bottom-0 z-[70] bg-slate-900/95 backdrop-blur-2xl border-t border-pink-500/40 rounded-t-3xl p-4 shadow-2xl animate-fade-in space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-400" />
              <h4 className="font-black text-sm text-slate-100">AI Beauty & Camera Effects</h4>
            </div>
            <button onClick={() => setActiveSheet('NONE')} className="p-1 text-slate-400 hover:text-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                <span>Face Glow & Smoothing</span>
                <span className="text-pink-400">{beautyLevel}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={beautyLevel}
                onChange={(e) => setBeautyLevel(Number(e.target.value))}
                className="w-full accent-pink-500"
              />
            </div>

            <div>
              <span className="text-xs font-bold text-slate-300 block mb-1">Face Filters</span>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {['CRYSTAL', 'GLOW', 'SUNSET', 'CYBER'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFaceFilter(f as any)}
                    className={`py-2 rounded-xl font-bold border ${faceFilter === f ? 'bg-pink-600 border-pink-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* G. MINI GAMES SHEET */}
      {activeSheet === 'GAMES' && (
        <div className="absolute inset-x-0 bottom-0 z-[70] bg-slate-900/95 backdrop-blur-2xl border-t border-amber-500/40 rounded-t-3xl p-4 shadow-2xl animate-fade-in space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Dices className="w-5 h-5 text-amber-400" />
              <h4 className="font-black text-sm text-slate-100">In-Stream Mini-Game</h4>
            </div>
            <button onClick={() => setActiveSheet('NONE')} className="p-1 text-slate-400 hover:text-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center space-y-3 p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-3xl font-black text-slate-950 shadow-xl animate-bounce">
              {quickDiceVal}
            </div>
            <p className="text-xs text-amber-300 font-bold">Roll die to earn instant Gaming Points while watching!</p>
            <button
              onClick={handleRollQuickDice}
              disabled={isQuickRolling}
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs rounded-xl shadow-lg"
            >
              {isQuickRolling ? 'Rolling...' : 'Roll Die (+Points)'}
            </button>
          </div>
        </div>
      )}

      {/* H. MORE ROOM TOOLS BOTTOM SHEET */}
      {activeSheet === 'MORE_TOOLS' && (
        <div className="absolute inset-x-0 bottom-0 z-[70] bg-slate-900/95 backdrop-blur-2xl border-t border-slate-700/80 rounded-t-3xl p-5 shadow-2xl animate-fade-in space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="font-black text-sm text-slate-100 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-amber-400" /> ALL ROOM TOOLS & FEATURES
            </h4>
            <button onClick={() => setActiveSheet('NONE')} className="p-1 text-slate-400 hover:text-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {[
              { id: 'MUSIC', label: 'Music Stream', icon: Music, color: 'text-purple-400' },
              { id: 'VIDEO', label: 'Sync Video', icon: Video, color: 'text-cyan-400' },
              { id: 'PK', label: 'PK Battle', icon: Swords, color: 'text-amber-400' },
              { id: 'GUESTS', label: 'Guest Queue', icon: Users, color: 'text-pink-400' },
              { id: 'GAMES', label: 'Mini Games', icon: Dices, color: 'text-emerald-400' },
              { id: 'EFFECTS', label: 'Beauty FX', icon: Sparkles, color: 'text-amber-300' },
              { id: 'GIFT', label: 'Send Gifts', icon: Gift, color: 'text-rose-400' },
              { id: 'DASHBOARD', label: 'Analytics', icon: BarChart3, color: 'text-indigo-400' }
            ].map(tool => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveSheet(tool.id as any)}
                  className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all group"
                >
                  <Icon className={`w-6 h-6 ${tool.color} group-hover:scale-110 transition-transform`} />
                  <span className="text-xs font-extrabold text-slate-200">{tool.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MUSIC UPLOAD MODAL */}
      {showMusicUploadModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
            <button onClick={() => setShowMusicUploadModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-100">
              <X className="w-5 h-5" />
            </button>
            <h4 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-400" /> Upload Live Track
            </h4>

            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setMusicUploadFile(f);
                  if (!musicUploadTitle) setMusicUploadTitle(f.name.replace(/\.[^/.]+$/, ''));
                }
              }}
              className="text-xs text-slate-400"
            />

            <input
              type="text"
              placeholder="Track Title"
              value={musicUploadTitle}
              onChange={(e) => setMusicUploadTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
            />

            <input
              type="text"
              placeholder="Artist Name"
              value={musicUploadArtist}
              onChange={(e) => setMusicUploadArtist(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
            />

            {/* PRIVACY SELECTOR */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Track Visibility:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMusicUploadIsPublic(false)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all ${
                    !musicUploadIsPublic
                      ? 'bg-purple-950/80 border-purple-400 text-purple-200 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🔒 Personal Only
                </button>
                <button
                  type="button"
                  onClick={() => setMusicUploadIsPublic(true)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all ${
                    musicUploadIsPublic
                      ? 'bg-purple-950/80 border-purple-400 text-purple-200 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🌐 Public Shared
                </button>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                {!musicUploadIsPublic ? 'Saved only to your private library.' : 'Visible to all users on Nexora.'}
              </p>
            </div>

            {musicUploadError && <p className="text-xs text-rose-400 font-bold">{musicUploadError}</p>}

            <button
              onClick={handleMusicUploadSubmit}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg"
            >
              Upload & Broadcast Track
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
