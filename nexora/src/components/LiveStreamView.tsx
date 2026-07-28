import React, { useState, useEffect, useRef } from 'react';
import { LiveStream, ChatMessage, GiftItem, PartySeat, PkBattleInfo } from '../types';
import { MOCK_STREAMS, MOCK_GIFTS } from '../data/mockData';
import { useEconomy } from '../context/EconomyContext';
import { LiveModerationPanel } from './LiveModerationPanel';
import { moderationService } from '../services/ModerationService';
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
  Check
} from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { useVideoPlayer } from '../context/VideoPlayerContext';
import { videoStorageService } from '../services/VideoStorageService';
import { videoService } from '../services/VideoService';

interface LiveStreamViewProps {
  mode?: 'LIVE' | 'PARTY';
}

export const LiveStreamView: React.FC<LiveStreamViewProps> = ({ mode = 'LIVE' }) => {
  const { wallet, sendGift, purchaseProduct, updateGamePoints, claimRedPacket, redPacket } = useEconomy();
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
    detachStreamSync
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
    queue: videoQueue,
    playVideo,
    pauseVideo,
    resumeVideo,
    stopVideo,
    nextVideo,
    prevVideo,
    seekTo,
    setVideoVolume,
    setMicrophoneVolume: setVideoMicrophoneVolume,
    setLayoutMode,
    addToQueue,
    removeFromQueue,
    toggleFavorite,
    attachStreamSync: attachVideoSync,
    detachStreamSync: detachVideoSync,
    videoRef: syncVideoRef
  } = useVideoPlayer();

  const [streams, setStreams] = useState<LiveStream[]>(MOCK_STREAMS);
  const [selectedStream, setSelectedStream] = useState<LiveStream>(MOCK_STREAMS[0]);

  // Video Selector Modal State
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoModalTab, setVideoModalTab] = useState<'LIBRARY' | 'UPLOAD' | 'LAYOUT' | 'PLAYLISTS'>('LIBRARY');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Gaming');
  const [uploadVisibility, setUploadVisibility] = useState<'PUBLIC' | 'PRIVATE' | 'DRAFT'>('PUBLIC');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Attach real-time Firestore stream audio & video synchronization
  useEffect(() => {
    if (selectedStream?.id) {
      const isHost = selectedStream.creatorName === 'Alex Rivers' || selectedStream.creatorName === 'Aria Nova';
      attachStreamSync(selectedStream.id, isHost);
      attachVideoSync(selectedStream.id, isHost);
    }
    return () => {
      detachStreamSync();
      detachVideoSync();
    };
  }, [selectedStream?.id]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [liveSubTab, setLiveSubTab] = useState<'POPULAR' | 'NEARBY' | 'FEATURED' | 'EXPLORE'>('POPULAR');
  const [partyCategory, setPartyCategory] = useState<string>('9SEAT');

  // Party Room Mode Theme
  const [partyTheme, setPartyTheme] = useState<'KARAOKE' | 'DATING' | 'MUSIC' | 'CHILL' | 'COMEDY' | 'NETWORKING' | 'STUDY'>('KARAOKE');

  // Streaming Effects State (Poppo / BIGO style Filters & Beauty Camera)
  const [showEffectsDrawer, setShowEffectsDrawer] = useState(false);
  const [beautyLevel, setBeautyLevel] = useState(80);
  const [faceFilter, setFaceFilter] = useState<'CRYSTAL' | 'GLOW' | 'SUNSET' | 'CYBER' | 'NONE'>('GLOW');
  const [virtualBackground, setVirtualBackground] = useState<'CYBER_STUDIO' | 'NEON_CLUB' | 'PENTHOUSE' | 'OFF'>('CYBER_STUDIO');
  const [voiceChanger, setVoiceChanger] = useState<'CHIPMUNK' | 'DEEP_ROBOT' | 'ECHO' | 'NORMAL'>('NORMAL');

  // Red Packet Rain Drop Overlay
  const [showRedPacketModal, setShowRedPacketModal] = useState(false);
  const [lastClaimedAmount, setLastClaimedAmount] = useState<number | null>(null);

  // Top Marquee Banner Announcement (Poppo/Bigo style global notice)
  const [marqueeNotice, setMarqueeNotice] = useState<string>(
    '🚀 [VIP Lv.58] Alex Rivers sent 520x Cyber Sports Cars to Host Aria Nova! Lucky Multiplier 10x (+50,000 Coins)!'
  );

  // Live Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      streamId: 'stream_party_1',
      senderName: 'GamerGod99',
      senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
      senderBadge: 'SILVER VIP',
      senderWealthLevel: 42,
      text: 'Poppo party room vibes are electric tonight! 🔥',
      timestamp: '18:22'
    },
    {
      id: 'm2',
      streamId: 'stream_party_1',
      senderName: 'NexAI Co-Host',
      senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80',
      senderBadge: 'AI BOT',
      senderWealthLevel: 99,
      text: 'Welcome to the 9-Seat Party Room! Tap any empty seat to sit down or send gifts to Seat #1!',
      timestamp: '18:23',
      isAiCohost: true
    }
  ]);
  const [inputChat, setInputChat] = useState('');

  // AI Co-Host State
  const [aiCohostMode, setAiCohostMode] = useState<'MODERATOR' | 'QA' | 'TRIVIA' | 'RECOMMENDER' | 'TRANSLATOR'>('MODERATOR');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Gift Drawer & Combos
  const [showGiftDrawer, setShowGiftDrawer] = useState(false);
  const [selectedGiftCombo, setSelectedGiftCombo] = useState<number>(1); // 1, 10, 66, 520, 1314
  const [targetSeatNumber, setTargetSeatNumber] = useState<number>(1); // Target seat for gift
  const [showModerationPanel, setShowModerationPanel] = useState<boolean>(false);

  // Floating Mini Game Overlay Drawer
  const [showInStreamGame, setShowInStreamGame] = useState<boolean>(false);
  const [inStreamGameType, setInStreamGameType] = useState<'LUDO' | 'DICE'>('DICE');
  const [quickDiceVal, setQuickDiceVal] = useState<number>(6);
  const [isQuickRolling, setIsQuickRolling] = useState(false);

  // Webcam State
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Toggle Webcam
  const toggleWebcam = async () => {
    if (webcamEnabled) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setWebcamEnabled(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setWebcamEnabled(true);
      } catch (err) {
        alert('Camera permission denied or camera not available.');
      }
    }
  };

  // Take a Seat in Party Room
  const handleTakeSeat = (seatNum: number) => {
    if (!selectedStream.seats) return;
    const currentSeats = [...selectedStream.seats];
    const targetSeatIdx = currentSeats.findIndex(s => s.seatNumber === seatNum);

    if (targetSeatIdx !== -1) {
      if (currentSeats[targetSeatIdx].userName) {
        // Seat occupied, set as target for gifting
        setTargetSeatNumber(seatNum);
        setShowGiftDrawer(true);
      } else {
        // Seat empty, sit down!
        currentSeats[targetSeatIdx] = {
          seatNumber: seatNum,
          userName: 'Alex Rivers (You)',
          userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
          userLevel: 18,
          isMuted: false,
          isCameraOn: true,
          seatGiftsCoins: 0
        };

        setSelectedStream(prev => ({ ...prev, seats: currentSeats }));
        const seatMsg: ChatMessage = {
          id: `seat_${Date.now()}`,
          streamId: selectedStream.id,
          senderName: 'Alex Rivers',
          senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
          senderBadge: 'GOLD VIP',
          senderWealthLevel: 18,
          text: `🎉 Took Seat #${seatNum}! Mic activated.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, seatMsg]);
      }
    }
  };

  // Send Chat
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputChat.trim()) return;

    const userMsg: ChatMessage = {
      id: `chat_${Date.now()}`,
      streamId: selectedStream.id,
      senderName: 'Alex Rivers',
      senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
      senderBadge: 'GOLD VIP',
      senderWealthLevel: 18,
      text: inputChat.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    const currentInput = inputChat;
    setInputChat('');

    if (selectedStream.aiCohostEnabled) {
      setIsAiProcessing(true);
      try {
        const res = await fetch('/api/ai/cohost', {
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
          text: data.response || 'AI Co-Host active in room!',
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

  // Send Gift with Combos & Seat Target
  const handleSendGiftCombo = (gift: GiftItem) => {
    const totalCost = gift.coinPrice * selectedGiftCombo;
    if (wallet.coins < totalCost) {
      alert(`Insufficient Coins! Needed: ${totalCost.toLocaleString()} Coins for ${selectedGiftCombo}x ${gift.name}. Please recharge.`);
      return;
    }

    const success = sendGift(gift, selectedStream.title, selectedStream.creatorName);
    if (success) {
      // Update seat coin total if targeting seat
      if (selectedStream.seats) {
        const updatedSeats = selectedStream.seats.map(s => {
          if (s.seatNumber === targetSeatNumber) {
            return { ...s, seatGiftsCoins: (s.seatGiftsCoins || 0) + totalCost };
          }
          return s;
        });
        setSelectedStream(prev => ({ ...prev, seats: updatedSeats }));
      }

      // Update PK score if PK battle active
      if (selectedStream.pkBattle) {
        setSelectedStream(prev => {
          if (!prev.pkBattle) return prev;
          return {
            ...prev,
            pkBattle: {
              ...prev.pkBattle,
              selfScore: prev.pkBattle.selfScore + (totalCost * 2)
            }
          };
        });
      }

      // Generate Gift Notice
      const giftNotice: ChatMessage = {
        id: `gift_combo_${Date.now()}`,
        streamId: selectedStream.id,
        senderName: 'Alex Rivers',
        senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
        senderBadge: 'GOD GIFTER',
        senderWealthLevel: 18,
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

      // Trigger Marquee banner for big combo
      if (selectedGiftCombo >= 10 || gift.coinPrice >= 1000) {
        setMarqueeNotice(
          `🚀 [VIP Lv.18] Alex Rivers sent ${selectedGiftCombo}x ${gift.name} (${totalCost.toLocaleString()} Coins) to Seat #${targetSeatNumber}!`
        );
      }
    }
  };

  // Quick In-Stream Dice Roll Game
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
        updateGamePoints(winPts, `In-Stream Dice Roll: +${winPts} Points`, 'Live Room Games');
      }
    }, 100);
  };

  const filteredStreams = activeCategory === 'ALL'
    ? streams
    : streams.filter(s => {
        if (activeCategory === 'PARTY_ROOM') return s.isPartyRoom;
        if (activeCategory === 'PK_BATTLE') return s.pkBattle?.isPkActive;
        return s.category === activeCategory;
      });

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
      {/* GLOBAL POPPO/BIGO MARQUEE TICKER */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-purple-900 border border-purple-500/40 rounded-2xl px-4 py-2 flex items-center gap-3 overflow-hidden shadow-lg">
        <span className="px-2.5 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-md uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Zap className="w-3 h-3" /> HOT GIFT
        </span>
        <div className="text-xs font-bold text-amber-300 truncate tracking-wide animate-pulse">
          {marqueeNotice}
        </div>
      </div>

      {/* BIGO STYLE SUB-TABS NAVIGATION BAR */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800/80 pb-2">
        {mode === 'LIVE' ? (
          <div className="flex items-center gap-2">
            {[
              { id: 'POPULAR', label: '🔥 Popular', badge: 'HOT' },
              { id: 'NEARBY', label: '📍 Nearby', badge: '1.2 km' },
              { id: 'FEATURED', label: '⭐ Featured', badge: 'VIP' },
              { id: 'EXPLORE', label: '🔍 Explore', badge: 'Global' }
            ].map(tab => {
              const isAct = liveSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setLiveSubTab(tab.id as any);
                    if (tab.id === 'POPULAR') setActiveCategory('ALL');
                    else if (tab.id === 'NEARBY') setActiveCategory('ALL');
                    else if (tab.id === 'FEATURED') setActiveCategory('ALL');
                    else setActiveCategory('ALL');
                  }}
                  className={`px-4 py-2 rounded-2xl text-xs font-black tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isAct
                      ? 'bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-lg shadow-pink-500/20 border border-pink-400/40'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                  <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-extrabold ${
                    isAct ? 'bg-white/20 text-white' : 'bg-slate-950 text-slate-400'
                  }`}>
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {[
              { id: '9SEAT', label: '🎙️ Multi-Guest (9-Seats)' },
              { id: 'MUSIC', label: '🎵 Music & Voice' },
              { id: 'DATING', label: '💘 Dating & Chat' },
              { id: 'GAMING', label: '🎮 Gaming Party' },
              { id: 'FAMILY', label: '🛡️ Family Guilds' },
              { id: 'KARAOKE', label: '🎤 Karaoke' }
            ].map(cat => {
              const isAct = partyCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setPartyCategory(cat.id);
                    setActiveCategory('PARTY_ROOM');
                  }}
                  className={`px-4 py-2 rounded-2xl text-xs font-black tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isAct
                      ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white shadow-lg shadow-purple-500/20 border border-purple-400/40'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}

        {/* EXTRA CATEGORY SHORTCUTS */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveCategory('PK_BATTLE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all ${
              activeCategory === 'PK_BATTLE' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-amber-300 border border-amber-500/30'
            }`}
          >
            ⚔️ PK Battles
          </button>
        </div>
      </div>

      {/* MAIN STREAM VIEW / PARTY ROOM CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: STREAM FEED / MULTI-GUEST SEAT GRID / PK SCREEN */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl min-h-[420px] flex flex-col justify-between p-4 group">
            {/* BACKGROUND FEED / VIDEO OR IMAGE */}
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
                  {/* Full background video */}
                  <video
                    src={currentVideo.videoUrl}
                    autoPlay={isVideoPlaying}
                    loop={false}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Host Camera PIP Overlay in bottom right */}
                  {webcamEnabled && (
                    <div className="absolute bottom-4 right-4 w-36 h-28 rounded-2xl overflow-hidden border-2 border-cyan-400/80 shadow-2xl z-10 bg-slate-900">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                      />
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-slate-950/80 text-[8px] font-black text-cyan-300 rounded-md">
                        HOST CAM
                      </div>
                    </div>
                  )}
                </div>
              ) : webcamEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              ) : (
                <img
                  src={selectedStream.thumbnailUrl}
                  alt={selectedStream.title}
                  className="w-full h-full object-cover opacity-30 blur-sm scale-105"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-slate-950/95 pointer-events-none" />
            </div>

            {/* TOP STREAM BAR OVERLAY */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              {/* CREATOR VERIFIED BADGE & WEALTH LEVEL */}
              <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-700/80">
                <img
                  src={selectedStream.creatorAvatar}
                  alt={selectedStream.creatorName}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-500"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-slate-100">{selectedStream.creatorName}</span>
                    <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[9px] font-black rounded-md border border-amber-500/40">
                      Lv.{selectedStream.creatorLevel || 50}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">{selectedStream.location || '🌐 Global Stream'}</p>
                </div>
              </div>

              {/* LIVE VIEWERS & WEBCAM & EFFECTS CONTROLS */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-red-600 text-white font-black text-xs rounded-full flex items-center gap-1 shadow-lg animate-pulse">
                  <Radio className="w-3.5 h-3.5" /> LIVE
                </span>
                <span className="px-3 py-1 bg-slate-900/90 backdrop-blur-md text-slate-200 text-xs font-bold rounded-full border border-slate-700/80 flex items-center gap-1">
                  👁️ {selectedStream.viewersCount.toLocaleString()}
                </span>
                <button
                  onClick={toggleWebcam}
                  className="px-3 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-full border border-slate-700 flex items-center gap-1 transition-all"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  {webcamEnabled ? 'Stop Cam' : 'Live Cam'}
                </button>
                <button
                  onClick={() => setShowEffectsDrawer(true)}
                  className="px-3 py-1 bg-purple-900/90 hover:bg-purple-800 text-pink-300 text-xs font-black rounded-full border border-purple-500/50 flex items-center gap-1 shadow"
                >
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Beauty & Filters
                </button>
                <button
                  onClick={() => setShowRedPacketModal(true)}
                  className="px-3 py-1 bg-gradient-to-r from-red-600 to-amber-500 text-white font-black text-xs rounded-full shadow-lg flex items-center gap-1 animate-bounce"
                >
                  🧧 Red Packet Drop
                </button>
                <button
                  onClick={() => setShowInStreamGame(!showInStreamGame)}
                  className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs rounded-full shadow-lg flex items-center gap-1"
                >
                  <Dices className="w-3.5 h-3.5" /> Mini Game
                </button>
                <button
                  onClick={() => setShowVideoModal(true)}
                  className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs rounded-full shadow-lg flex items-center gap-1.5 transition-all"
                >
                  <Video className="w-3.5 h-3.5 text-cyan-200" />
                  <span>Video Broadcast</span>
                  {currentVideo && isVideoPlaying && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </button>
                <button
                  onClick={() => setShowModerationPanel(true)}
                  className="px-3 py-1 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 font-extrabold text-xs rounded-full border border-cyan-500/40 flex items-center gap-1 shadow-lg transition-all"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" /> Moderation
                </button>
              </div>
            </div>

            {/* SYNCHRONIZED VIDEO STREAM OVERLAY BAR */}
            <div className="relative z-10 bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-3 my-1.5 shadow-xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center shrink-0 overflow-hidden relative">
                  {currentVideo?.thumbnail ? (
                    <img src={currentVideo.thumbnail} className="w-full h-full object-cover" />
                  ) : (
                    <Film className="w-5 h-5 text-cyan-400 animate-pulse" />
                  )}
                  {isVideoPlaying && (
                    <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-100 truncate">
                      🎬 {currentVideo?.title || 'No Video Selected for Stream'}
                    </span>
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 font-mono text-[9px] font-bold rounded-full border border-cyan-500/30 uppercase">
                      SYNC VIDEO • {layoutMode.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {currentVideo ? `${Math.floor(videoTime / 60)}:${('0' + Math.floor(videoTime % 60)).slice(-2)} / ${Math.floor(videoDuration / 60)}:${('0' + Math.floor(videoDuration % 60)).slice(-2)} • ${currentVideo.resolution || '1080p'}` : 'Click Video Broadcast to start synchronized playback for viewers'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!currentVideo && videoLibrary.length > 0) {
                      playVideo(videoLibrary[0]);
                    } else if (isVideoPlaying) {
                      pauseVideo();
                    } else if (currentVideo) {
                      resumeVideo();
                    } else {
                      setShowVideoModal(true);
                    }
                  }}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-md"
                >
                  {isVideoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isVideoPlaying ? 'Pause Video' : 'Play Sync'}
                </button>

                <button
                  onClick={nextVideo}
                  className="p-1.5 text-slate-300 hover:text-white bg-slate-900 rounded-xl border border-slate-800"
                  title="Next Video"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowVideoModal(true)}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1"
                >
                  <ListVideo className="w-3.5 h-3.5" /> Video Hub
                </button>
              </div>
            </div>

            {/* INTERNAL MUSIC & AUDIO MIXER BROADCAST OVERLAY */}
            <div className="relative z-10 bg-slate-950/80 backdrop-blur-md border border-purple-500/40 rounded-2xl p-3 my-2 shadow-xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-900/50 border border-purple-500/40 flex items-center justify-center shrink-0 overflow-hidden">
                  {currentTrack?.coverImage ? (
                    <img src={currentTrack.coverImage} className="w-full h-full object-cover" />
                  ) : (
                    <Disc className="w-5 h-5 text-purple-400 animate-spin" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-100 truncate">
                      🎵 {currentTrack?.title || 'Nexora Internal Music Stream'}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold rounded-full border border-emerald-500/30">
                      SYNCHRONIZED LIVE AUDIO
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {currentTrack?.artist || 'Host Background Track'} • Mic & Music Mixed
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (isPlaying) pauseTrack();
                    else if (currentTrack) resumeTrack();
                    else if (tracks.length > 0) playTrack(tracks[0]);
                  }}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-md"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isPlaying ? 'Pause' : 'Play Music'}
                </button>

                <button
                  onClick={nextTrack}
                  className="p-1.5 text-slate-300 hover:text-white bg-slate-900 rounded-xl border border-slate-800"
                  title="Next Track"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <div className="hidden sm:flex items-center gap-2 border-l border-slate-800 pl-3">
                  <span className="text-[10px] text-slate-400 font-bold">Music Vol:</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => setMusicVolume(Number(e.target.value))}
                    className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <span className="text-[10px] text-slate-400 font-bold ml-2">Mic Vol:</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={micVolume}
                    onChange={(e) => setMicrophoneVolume(Number(e.target.value))}
                    className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* MIDDLE CONTENT: 9-SEAT PARTY ROOM GRID OR 1v1 PK BATTLE */}
            <div className="relative z-10 my-4">
              {/* CASE A: MULTI-GUEST 9-SEAT PARTY ROOM GRID */}
              {selectedStream.isPartyRoom && selectedStream.seats ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {[
                      { id: 'KARAOKE', label: '🎤 Karaoke' },
                      { id: 'DATING', label: '💘 Dating' },
                      { id: 'MUSIC', label: '🎶 Music' },
                      { id: 'CHILL', label: '☕ Chill Room' },
                      { id: 'COMEDY', label: '😂 Comedy' },
                      { id: 'NETWORKING', label: '💼 Business' }
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setPartyTheme(t.id as any)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all ${
                          partyTheme === t.id
                            ? 'bg-amber-400 text-slate-950 shadow'
                            : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                    {selectedStream.seats.map(seat => {
                      const isTargeted = targetSeatNumber === seat.seatNumber;
                      return (
                        <div
                          key={seat.seatNumber}
                          onClick={() => handleTakeSeat(seat.seatNumber)}
                          className={`relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-1.5 backdrop-blur-md ${
                            seat.userName
                              ? isTargeted
                                ? 'bg-purple-950/90 border-amber-400 ring-2 ring-amber-400/50 shadow-xl'
                                : 'bg-slate-900/80 border-slate-700/80 hover:border-purple-500'
                              : 'bg-slate-950/60 border-dashed border-slate-800 hover:border-slate-600 hover:bg-slate-900/60'
                          }`}
                        >
                          {/* SEAT NUMBER BADGE */}
                          <span className="absolute top-2 left-2 px-1.5 py-0.2 bg-slate-950 text-slate-400 text-[9px] font-mono font-black rounded">
                            #{seat.seatNumber} {seat.isHost ? 'HOST' : ''}
                          </span>

                          {seat.userName ? (
                            <>
                              <div className="relative mt-2">
                                <img
                                  src={seat.userAvatar}
                                  alt={seat.userName}
                                  className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-400 shadow-lg"
                                  referrerPolicy="no-referrer"
                                />
                                {seat.isMuted ? (
                                  <MicOff className="w-3.5 h-3.5 text-red-400 absolute bottom-0 right-0 bg-slate-950 rounded-full p-0.5 border border-red-500" />
                                ) : (
                                  <Mic className="w-3.5 h-3.5 text-emerald-400 absolute bottom-0 right-0 bg-slate-950 rounded-full p-0.5 border border-emerald-500" />
                                )}
                              </div>
                              <span className="text-xs font-black text-slate-100 line-clamp-1 max-w-[90px]">
                                {seat.userName}
                              </span>
                              <span className="text-[10px] font-black text-amber-300">
                                🪙 {(seat.seatGiftsCoins || 0).toLocaleString()}
                              </span>
                            </>
                          ) : (
                            <div className="py-2 flex flex-col items-center justify-center text-slate-500 space-y-1">
                              <UserPlus className="w-6 h-6 text-slate-600" />
                              <span className="text-[10px] font-bold">Sit Down</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : selectedStream.pkBattle ? (
                /* CASE B: 1v1 LIVE PK BATTLE (RED VS BLUE) */
                <div className="space-y-4 max-w-xl mx-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-3xl p-5 shadow-2xl">
                  {/* PK SCORE PROGRESS BAR */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-red-400 flex items-center gap-1">
                        🔴 RED: {selectedStream.creatorName} ({selectedStream.pkBattle.selfScore.toLocaleString()} Pts)
                      </span>
                      <span className="text-amber-300 font-mono">
                        ⏳ 02:45 PK
                      </span>
                      <span className="text-cyan-400 flex items-center gap-1">
                        🔵 BLUE: {selectedStream.pkBattle.opponentName} ({selectedStream.pkBattle.opponentScore.toLocaleString()} Pts)
                      </span>
                    </div>

                    <div className="w-full h-5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex shadow-inner">
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

                  {/* SPLIT STAGE CARDS */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* RED TEAM */}
                    <div className="bg-red-950/40 border border-red-500/50 rounded-2xl p-4 text-center space-y-2">
                      <img
                        src={selectedStream.creatorAvatar}
                        alt={selectedStream.creatorName}
                        className="w-16 h-16 rounded-full object-cover mx-auto ring-4 ring-red-500 shadow-xl"
                        referrerPolicy="no-referrer"
                      />
                      <h4 className="font-extrabold text-xs text-red-200">{selectedStream.creatorName}</h4>
                      <button
                        onClick={() => {
                          setTargetSeatNumber(1);
                          setShowGiftDrawer(true);
                        }}
                        className="w-full py-1.5 bg-gradient-to-r from-red-600 to-orange-600 text-white font-black text-[11px] rounded-xl shadow-lg"
                      >
                        Boost Red Team 🔥
                      </button>
                    </div>

                    {/* BLUE TEAM */}
                    <div className="bg-cyan-950/40 border border-cyan-500/50 rounded-2xl p-4 text-center space-y-2">
                      <img
                        src={selectedStream.pkBattle.opponentAvatar}
                        alt={selectedStream.pkBattle.opponentName}
                        className="w-16 h-16 rounded-full object-cover mx-auto ring-4 ring-cyan-500 shadow-xl"
                        referrerPolicy="no-referrer"
                      />
                      <h4 className="font-extrabold text-xs text-cyan-200">{selectedStream.pkBattle.opponentName}</h4>
                      <button
                        onClick={() => {
                          setTargetSeatNumber(2);
                          setShowGiftDrawer(true);
                        }}
                        className="w-full py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-[11px] rounded-xl shadow-lg"
                      >
                        Boost Blue Team ⚡
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* CASE C: STANDARD LIVE STREAM FEED DISPLAY */
                <div className="text-center py-8 space-y-2">
                  <h3 className="text-xl font-black text-slate-100">{selectedStream.title}</h3>
                  <p className="text-xs text-slate-400">Tap below to send AR gifts, chat with AI Co-Host, or play in-stream games!</p>
                </div>
              )}
            </div>

            {/* BOTTOM STREAM CONTROLS */}
            <div className="relative z-10 flex items-center justify-between pt-3 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGiftDrawer(!showGiftDrawer)}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:opacity-95 text-slate-950 font-black text-xs rounded-xl shadow-xl shadow-amber-500/20 flex items-center gap-2"
                >
                  <Gift className="w-4 h-4" />
                  Send Gift (Target Seat #{targetSeatNumber})
                </button>
              </div>

              <div className="text-xs font-extrabold text-amber-300">
                🪙 {wallet.coins.toLocaleString()} Coins
              </div>
            </div>
          </div>

          {/* IN-STREAM MINI GAME DRAWER OVERLAY */}
          {showInStreamGame && (
            <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 space-y-4 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Dices className="w-5 h-5 text-amber-400" />
                  <h4 className="font-extrabold text-sm text-slate-100">In-Stream Live Mini-Game</h4>
                </div>
                <button
                  onClick={() => setShowInStreamGame(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-200"
                >
                  Close
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

          {/* POPPO/BIGO STYLE GIFT COMBO DRAWER */}
          {showGiftDrawer && (
            <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 shadow-2xl space-y-4 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-black text-sm text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> POPPO & BIGO STYLE GIFT COMBO PANEL
                  </h4>
                  <p className="text-[11px] text-slate-400">Targeting Seat #{targetSeatNumber} • Select combo multiplier</p>
                </div>

                {/* COMBO MULTIPLIER BUTTONS */}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 mr-1">Combo:</span>
                  {[
                    { count: 1, label: '1x' },
                    { count: 10, label: '10x' },
                    { count: 66, label: '66x' },
                    { count: 520, label: '520x (❤️)' },
                    { count: 1314, label: '1314x (✨)' }
                  ].map(combo => (
                    <button
                      key={combo.count}
                      onClick={() => setSelectedGiftCombo(combo.count)}
                      className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition-all ${
                        selectedGiftCombo === combo.count
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {combo.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* GIFTS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {MOCK_GIFTS.map(g => {
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
                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="font-black text-amber-300">🪙 {totalCoins.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-cyan-400">{selectedGiftCombo}x</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COL: REAL-TIME CHAT & AI CO-HOST CONTROL */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between h-[620px]">
          {/* CHAT HEADER */}
          <div className="pb-3 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-200">Live Party Chat</h3>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-full">
                Realtime Room
              </span>
            </div>

            {/* AI CO-HOST SELECTOR */}
            <div className="bg-slate-950 p-2.5 rounded-2xl border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-purple-400" />
                  AI Co-Host Mode
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Gemini 3.6</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[
                  { mode: 'MODERATOR', label: 'Mod', icon: ShieldAlert },
                  { mode: 'QA', label: 'Q&A', icon: HelpCircle },
                  { mode: 'TRIVIA', label: 'Trivia', icon: Brain },
                  { mode: 'RECOMMENDER', label: 'Gifts', icon: Gift },
                  { mode: 'TRANSLATOR', label: 'Trans', icon: Globe2 }
                ].map(item => {
                  const Icon = item.icon;
                  const isSel = aiCohostMode === item.mode;
                  return (
                    <button
                      key={item.mode}
                      onClick={() => setAiCohostMode(item.mode as any)}
                      className={`p-1.5 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${
                        isSel
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CHAT MESSAGES SCROLL AREA */}
          <div className="flex-1 overflow-y-auto my-3 space-y-2.5 pr-1">
            {chatMessages.map(msg => (
              <div
                key={msg.id}
                className={`p-2.5 rounded-2xl text-xs space-y-1 transition-all ${
                  msg.isGiftNotice
                    ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent border border-amber-500/40 text-amber-200'
                    : msg.isAiCohost
                    ? 'bg-purple-950/40 border border-purple-500/30 text-purple-200'
                    : 'bg-slate-950/60 border border-slate-800/80 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      className="w-5 h-5 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="font-black text-slate-100">{msg.senderName}</span>
                    {msg.senderWealthLevel && (
                      <span className="px-1 py-0.2 text-[8px] font-black bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                        Lv.{msg.senderWealthLevel}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                </div>
                <p className="text-slate-300 pl-6 leading-relaxed">{msg.text}</p>
              </div>
            ))}
            {isAiProcessing && (
              <div className="p-2 bg-purple-950/30 border border-purple-500/20 rounded-xl text-xs text-purple-300 flex items-center gap-2 animate-pulse">
                <Bot className="w-4 h-4 text-purple-400 animate-spin" />
                AI Co-Host is typing response...
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* CHAT INPUT FORM */}
          <form onSubmit={handleSendChat} className="pt-2 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputChat}
              onChange={(e) => setInputChat(e.target.value)}
              placeholder="Send message or ask AI Co-Host..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:opacity-90 shadow-md shadow-indigo-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* EXPLORE OTHER ROOMS GRID */}
      <div className="space-y-3 pt-2">
        <h3 className="font-black text-base text-slate-100 flex items-center gap-2">
          <Tv className="w-5 h-5 text-indigo-400" />
          Explore Nexora Live Rooms
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredStreams.map(s => (
            <div
              key={s.id}
              onClick={() => {
                setSelectedStream(s);
                setTargetSeatNumber(1);
              }}
              className={`group bg-slate-900 border rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${
                selectedStream.id === s.id ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="relative aspect-video">
                <img
                  src={s.thumbnailUrl}
                  alt={s.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 bg-red-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Radio className="w-3 h-3" /> LIVE
                  </span>
                  {s.isPartyRoom && (
                    <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-black rounded-full uppercase">
                      🎙️ 9-Seats
                    </span>
                  )}
                  {s.pkBattle?.isPkActive && (
                    <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full uppercase flex items-center gap-1">
                      <Swords className="w-3 h-3" /> PK Battle
                    </span>
                  )}
                </div>
                <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-slate-950/80 text-slate-200 text-[10px] font-bold rounded-md border border-slate-700">
                  👁️ {s.viewersCount.toLocaleString()}
                </span>
              </div>
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={s.creatorAvatar}
                      alt={s.creatorName}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-purple-500"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-100">{s.creatorName}</h4>
                      <p className="text-[10px] text-slate-400">{s.location || s.category}</p>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 font-extrabold text-[10px] rounded">
                    Lv.{s.creatorLevel || 40}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-200 line-clamp-1">{s.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* STREAMING EFFECTS DRAWER MODAL */}
      {showEffectsDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400" /> Nexora Live FX & Beauty Camera Studio
              </h3>
              <button onClick={() => setShowEffectsDrawer(false)} className="p-1.5 bg-slate-800 text-slate-400 rounded-xl">
                ✕
              </button>
            </div>

            {/* BEAUTY CAMERA SLIDER */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-200">✨ AI Beauty Enhancement Camera</span>
                <span className="text-pink-400 font-mono">{beautyLevel}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={beautyLevel}
                onChange={(e) => setBeautyLevel(Number(e.target.value))}
                className="w-full accent-pink-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* FACE FILTERS */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-200 block">🎨 Face Filters</span>
              <div className="grid grid-cols-4 gap-2 text-xs font-bold">
                {[
                  { id: 'GLOW', label: '🌸 Glow' },
                  { id: 'CRYSTAL', label: '💎 Crystal' },
                  { id: 'SUNSET', label: '🌅 Sunset' },
                  { id: 'CYBER', label: '⚡ Cyber' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFaceFilter(f.id as any)}
                    className={`p-2.5 rounded-xl border text-[11px] ${
                      faceFilter === f.id
                        ? 'bg-pink-600 text-white border-pink-400 shadow'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* VOICE CHANGER */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-200 block">🎙️ Real-time Voice Changer</span>
              <div className="grid grid-cols-4 gap-2 text-xs font-bold">
                {[
                  { id: 'NORMAL', label: '🎙️ Normal' },
                  { id: 'CHIPMUNK', label: '🐿️ Chipmunk' },
                  { id: 'DEEP_ROBOT', label: '🤖 Robot' },
                  { id: 'ECHO', label: '🔊 Echo' }
                ].map(v => (
                  <button
                    key={v.id}
                    onClick={() => setVoiceChanger(v.id as any)}
                    className={`p-2.5 rounded-xl border text-[11px] ${
                      voiceChanger === v.id
                        ? 'bg-purple-600 text-white border-purple-400 shadow'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowEffectsDrawer(false)}
              className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-extrabold text-xs rounded-2xl shadow-lg"
            >
              Apply Live Effects
            </button>
          </div>
        </div>
      )}

      {/* RED PACKET DROP MODAL */}
      {showRedPacketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-gradient-to-b from-red-900 via-slate-950 to-slate-950 border-2 border-red-500/60 rounded-3xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl relative overflow-hidden">
            <button onClick={() => setShowRedPacketModal(false)} className="absolute top-4 right-4 p-1.5 bg-slate-900/80 text-slate-300 rounded-xl">
              ✕
            </button>

            <div className="w-16 h-16 bg-red-600 rounded-full mx-auto flex items-center justify-center text-3xl shadow-xl animate-bounce">
              🧧
            </div>

            <div>
              <h3 className="font-black text-xl text-amber-300">Lucky Coin Red Packet!</h3>
              <p className="text-xs text-slate-300 mt-1">Host {redPacket.hostName} dropped a 10,000 Coins Lucky Packet!</p>
            </div>

            {lastClaimedAmount !== null ? (
              <div className="p-4 bg-red-950/80 border border-amber-400/50 rounded-2xl space-y-1">
                <span className="text-[10px] text-amber-300 font-bold uppercase block">Congratulations!</span>
                <span className="text-2xl font-black text-amber-300">🪙 +{lastClaimedAmount} Coins</span>
                <p className="text-[10px] text-slate-300">Added directly to your Wallet balance!</p>
              </div>
            ) : (
              <button
                onClick={() => {
                  const amt = claimRedPacket();
                  setLastClaimedAmount(amt);
                }}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 text-slate-950 font-black text-sm rounded-2xl shadow-xl hover:scale-105 transition-all"
              >
                OPEN RED PACKET NOW
              </button>
            )}
          </div>
        </div>
      )}

      {/* SYNCHRONIZED VIDEO BROADCAST & MEDIA HUB MODAL */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-100 flex items-center gap-2">
                    Synchronized Video Broadcast Studio
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold rounded-full border border-emerald-500/30">
                      LIVE REALTIME SYNC
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Play videos stored in Nexora while live. All viewers watch synchronously at exact timestamp.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
              >
                ✕
              </button>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-2 my-4 border-b border-slate-800 pb-3 shrink-0 overflow-x-auto">
              {[
                { id: 'LIBRARY', label: '🎬 Video Library', count: videoLibrary.length },
                { id: 'UPLOAD', label: '📤 Upload Video', badge: 'MP4, WebM, MOV' },
                { id: 'LAYOUT', label: '🎛️ Broadcast Layout & Audio' },
                { id: 'PLAYLISTS', label: '📋 Queue & Playlists' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setVideoModalTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    videoModalTab === tab.id
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20 border border-cyan-400/40'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded-full text-[10px]">
                      {tab.count}
                    </span>
                  )}
                  {tab.badge && (
                    <span className="px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 rounded-full text-[9px] font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* MODAL BODY */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {/* TAB 1: VIDEO LIBRARY */}
              {videoModalTab === 'LIBRARY' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    {videoLibrary.map(v => {
                      const isCurrent = currentVideo?.id === v.id;
                      return (
                        <div
                          key={v.id}
                          className={`bg-slate-950 border rounded-2xl p-3 flex gap-3 transition-all ${
                            isCurrent
                              ? 'border-cyan-500 shadow-lg shadow-cyan-500/10'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="w-28 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0 relative">
                            <img src={v.thumbnail} className="w-full h-full object-cover" />
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-slate-950/80 text-[9px] font-mono font-bold text-slate-200 rounded">
                              {Math.floor(v.duration / 60)}:{('0' + Math.floor(v.duration % 60)).slice(-2)}
                            </span>
                            {isCurrent && isVideoPlaying && (
                              <div className="absolute inset-0 bg-cyan-950/60 backdrop-blur-[2px] flex items-center justify-center">
                                <span className="px-2 py-0.5 bg-cyan-500 text-slate-950 text-[10px] font-black rounded-md animate-pulse">
                                  PLAYING SYNC
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="text-xs font-black text-slate-100 truncate">{v.title}</h4>
                                <span className="px-1.5 py-0.5 bg-slate-900 text-cyan-300 text-[9px] font-bold rounded border border-slate-800 shrink-0">
                                  {v.resolution || '1080p'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{v.description}</p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-medium">
                                <span>👁️ {(v.views || 0).toLocaleString()} views</span>
                                <span>•</span>
                                <span>❤️ {v.likes || 0}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => {
                                  playVideo(v);
                                  setShowVideoModal(false);
                                }}
                                className="flex-1 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] rounded-lg flex items-center justify-center gap-1 shadow"
                              >
                                {isCurrent && isVideoPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                {isCurrent && isVideoPlaying ? 'Pause Sync' : 'Broadcast Video'}
                              </button>
                              <button
                                onClick={() => addToQueue(v)}
                                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-[11px] font-bold border border-slate-800"
                                title="Add to Queue"
                              >
                                +Queue
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: UPLOAD VIDEO */}
              {videoModalTab === 'UPLOAD' && (
                <div className="space-y-4 max-w-xl mx-auto bg-slate-950 p-6 rounded-2xl border border-slate-800">
                  <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 text-center space-y-2 transition-all cursor-pointer">
                    <Upload className="w-8 h-8 text-cyan-400 mx-auto" />
                    <h4 className="font-extrabold text-sm text-slate-200">Select Video File to Upload</h4>
                    <p className="text-xs text-slate-400">
                      Supports MP4, MOV, WebM, M4V (Max 200 MB for live streams)
                    </p>
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,video/x-m4v,video/m4v"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                          if (!uploadTitle) setUploadTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                        }
                      }}
                      className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
                    />
                  </div>

                  {selectedFile && (
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center justify-between">
                      <span className="font-bold truncate">📁 {selectedFile.name}</span>
                      <span className="text-slate-500 font-mono font-bold shrink-0">
                        {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Video Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Cyberpunk Tournament Highlights 2026"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Description</label>
                      <textarea
                        rows={2}
                        placeholder="Describe your video for stream viewers..."
                        value={uploadDesc}
                        onChange={(e) => setUploadDesc(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                        <select
                          value={uploadCategory}
                          onChange={(e) => setUploadCategory(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="Gaming">Gaming</option>
                          <option value="Music Video">Music Video</option>
                          <option value="Highlights">Highlights</option>
                          <option value="Tutorial">Tutorial</option>
                          <option value="Vlog">Vlog</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Visibility</label>
                        <select
                          value={uploadVisibility}
                          onChange={(e) => setUploadVisibility(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="PUBLIC">Public (Available for All Streams)</option>
                          <option value="PRIVATE">Private (My Streams Only)</option>
                          <option value="DRAFT">Draft</option>
                        </select>
                      </div>
                    </div>

                    {uploadProgress !== null && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                          <span>Uploading Video to Storage...</span>
                          <span>{uploadProgress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      disabled={!selectedFile || uploadProgress !== null}
                      onClick={async () => {
                        if (!selectedFile) return;
                        try {
                          setUploadProgress(0);
                          const metadata = await videoStorageService.extractVideoMetadata(selectedFile);
                          const uploadRes = await videoStorageService.uploadVideoFile(selectedFile, 'host_creator', (prog) => {
                            setUploadProgress(prog);
                          });

                          await videoService.createVideo({
                            title: uploadTitle || selectedFile.name,
                            description: uploadDesc || 'Uploaded stream video',
                            duration: metadata.duration,
                            thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
                            videoUrl: uploadRes.videoUrl,
                            uploadedBy: 'host_creator',
                            uploadedByName: selectedStream.creatorName,
                            category: uploadCategory,
                            resolution: metadata.resolution,
                            fileSize: uploadRes.fileSize,
                            visibility: uploadVisibility,
                            status: 'APPROVED',
                            storagePath: uploadRes.storagePath
                          });

                          setUploadProgress(null);
                          setSelectedFile(null);
                          setUploadTitle('');
                          setUploadDesc('');
                          setVideoModalTab('LIBRARY');
                          alert('Video uploaded successfully and added to Nexora Video Library!');
                        } catch (err: any) {
                          setUploadProgress(null);
                          alert(err.message || 'Video upload failed. Please try again.');
                        }
                      }}
                      className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-extrabold text-xs rounded-xl shadow-lg disabled:opacity-50 hover:from-cyan-500 hover:to-blue-500 transition-all"
                    >
                      {uploadProgress !== null ? 'Uploading Video...' : 'Upload & Add to Library'}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: LAYOUT & AUDIO MIX */}
              {videoModalTab === 'LAYOUT' && (
                <div className="space-y-6 max-w-xl mx-auto bg-slate-950 p-6 rounded-2xl border border-slate-800">
                  <div>
                    <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest block mb-3">
                      Host Broadcast Video Layout
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'CAMERA_ONLY', label: '📷 Camera Only', desc: 'Host Webcam Fullscreen' },
                        { id: 'CAMERA_AND_VIDEO', label: '🎬 Camera + Video', desc: 'Video + Host Cam PIP' },
                        { id: 'VIDEO_ONLY', label: '📺 Video Only', desc: 'Pure Video Broadcast' }
                      ].map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => setLayoutMode(mode.id as any)}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            layoutMode === mode.id
                              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-lg'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="font-extrabold text-xs block">{mode.label}</span>
                          <span className="text-[10px] text-slate-400 mt-1 block">{mode.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-4 space-y-4">
                    <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest block">
                      Live Broadcast Audio Mixer
                    </h4>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                        <span>🎬 Video Audio Volume</span>
                        <span className="text-cyan-400">{Math.round(videoVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={videoVolume}
                        onChange={(e) => setVideoVolume(Number(e.target.value))}
                        className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                        <span>🎙️ Host Microphone Volume</span>
                        <span className="text-emerald-400">{Math.round(videoMicVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={videoMicVolume}
                        onChange={(e) => setVideoMicrophoneVolume(Number(e.target.value))}
                        className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>

                    <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>AEC Echo Cancellation and Active Noise Suppression Active</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: QUEUE & PLAYLISTS */}
              {videoModalTab === 'PLAYLISTS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">
                      Up Next Video Queue ({videoQueue.length})
                    </h4>
                  </div>

                  {videoQueue.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                      No videos in queue. Click "+Queue" on any video in the Library to build your live playback queue!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {videoQueue.map((v, i) => (
                        <div key={`${v.id}_${i}`} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-5 text-center font-mono text-xs font-bold text-slate-500">#{i + 1}</span>
                            <img src={v.thumbnail} className="w-12 h-9 rounded-lg object-cover" />
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-slate-200 truncate">{v.title}</h5>
                              <p className="text-[10px] text-slate-500">{Math.floor(v.duration / 60)}:{('0' + Math.floor(v.duration % 60)).slice(-2)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromQueue(v.id)}
                            className="p-1.5 text-red-400 hover:text-red-300 bg-slate-900 rounded-lg border border-slate-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LIVE MODERATION & HOST MANAGEMENT MODAL OVERLAY */}
      {showModerationPanel && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-xl">
            <LiveModerationPanel
              streamId={selectedStream.id}
              hostId="alex_rivers"
              currentUserId="alex_rivers"
              currentUserName="Alex Rivers"
              isHostOrMod={true}
              onClose={() => setShowModerationPanel(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
};
