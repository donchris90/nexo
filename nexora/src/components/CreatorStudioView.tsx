import React, { useState } from 'react';
import { useEconomy } from '../context/EconomyContext';
import { useVideoPlayer } from '../context/VideoPlayerContext';
import { 
  Clapperboard, 
  TrendingUp, 
  Globe2, 
  Users, 
  Award, 
  Download,
  DollarSign,
  Video,
  ShoppingBag,
  Ticket,
  Bot,
  Receipt,
  PlusCircle,
  PlayCircle,
  Briefcase,
  Crown,
  Heart,
  CheckCircle2,
  XCircle,
  Send,
  MessageSquare,
  Radio,
  Music,
  Swords,
  Dices,
  Target,
  Gift,
  BarChart3,
  Shield,
  Camera,
  Sparkles,
  Settings,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sliders,
  Eye,
  Zap,
  RotateCw,
  Smile,
  Layers,
  SlidersHorizontal,
  Wifi,
  Activity,
  Maximize2,
  Minimize2,
  ChevronRight,
  Search,
  Lock,
  Bell,
  Flame,
  UserCheck,
  UserX,
  Share2
} from 'lucide-react';

interface CreatorStudioViewProps {
  isOverlay?: boolean;
  onClose?: () => void;
}

export const CreatorStudioView: React.FC<CreatorStudioViewProps> = ({ isOverlay = false, onClose }) => {
  const { wallet, userLevel, authUser } = useEconomy();
  const { videos: videoLibrary, playVideo } = useVideoPlayer();

  // Selected Section State
  const [activeModule, setActiveModule] = useState<
    | 'CONTROLS'
    | 'GUESTS'
    | 'AUDIO'
    | 'VIDEO'
    | 'MUSIC'
    | 'PK'
    | 'GAMES'
    | 'GOALS'
    | 'GIFTS'
    | 'ANALYTICS'
    | 'MODERATION'
    | 'CAMERA'
    | 'BEAUTY'
    | 'EVENTS'
    | 'SETTINGS'
  >('CONTROLS');

  // Stream Live Status State
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [streamTitle, setStreamTitle] = useState<string>('🔥 9-Seat Celebrity Karaoke Party & Gifting War!');
  const [streamCategory, setStreamCategory] = useState<string>('PARTY_ROOM');
  const [allowComments, setAllowComments] = useState<boolean>(true);
  const [allowGifts, setAllowGifts] = useState<boolean>(true);
  const [followersOnly, setFollowersOnly] = useState<boolean>(false);

  // Audio & Mic States
  const [micVolume, setMicVolume] = useState<number>(85);
  const [musicVolume, setMusicVolume] = useState<number>(60);
  const [videoVolume, setVideoVolume] = useState<number>(70);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [echoCancellation, setEchoCancellation] = useState<boolean>(true);
  const [noiseSuppression, setNoiseSuppression] = useState<boolean>(true);
  const [speakerMonitoring, setSpeakerMonitoring] = useState<boolean>(true);

  // Camera & Beauty States
  const [isFrontCamera, setIsFrontCamera] = useState<boolean>(true);
  const [isMirrorMode, setIsMirrorMode] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [virtualBg, setVirtualBg] = useState<string>('NONE');
  const [skinSmoothing, setSkinSmoothing] = useState<number>(75);
  const [faceShaping, setFaceShaping] = useState<number>(50);
  const [brightnessLevel, setBrightnessLevel] = useState<number>(60);
  const [activeFilter, setActiveFilter] = useState<string>('GLAMOUR');

  // Goals State
  const [coinGoal, setCoinGoal] = useState<{ current: number; target: number }>({ current: 65000, target: 100000 });
  const [followerGoal, setFollowerGoal] = useState<{ current: 420, target: 500 }>({ current: 420, target: 500 });

  // Moderation Lists
  const [pinnedMessage, setPinnedMessage] = useState<string>('🏆 Welcome to the official Party Stream! Send a Dragon to get top seat mic priority!');
  const [blockedWords, setBlockedWords] = useState<string[]>(['spam', 'scam', 'hate']);
  const [newWord, setNewWord] = useState<string>('');

  // PK & Invite State
  const [pkOpponent, setPkOpponent] = useState<string | null>('Sophia Vance (UK)');
  const [pkStatus, setPkStatus] = useState<'OFFLINE' | 'MATCHED' | 'BATTLE_ACTIVE'>('BATTLE_ACTIVE');

  // Guests list
  const [guests, setGuests] = useState([
    { id: '1', name: 'Sophia Vance 👑', role: 'Co-Host', micOn: true, seat: 1 },
    { id: '2', name: 'Lord Sterling ✨', role: 'VIP Supporter', micOn: true, seat: 2 },
    { id: '3', name: 'CyberKnight 🎮', role: 'Guest', micOn: false, seat: 3 }
  ]);
  const [pendingRequests] = useState([
    { id: 'p1', name: 'AriaFanatic', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80' },
    { id: 'p2', name: 'GamerGod99', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80' }
  ]);

  // Floating Mini Preview State
  const [isPreviewExpanded, setIsPreviewExpanded] = useState<boolean>(true);

  return (
    <div className={`relative w-full ${isOverlay ? 'bg-slate-950/95 backdrop-blur-2xl text-white h-full max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-purple-500/40 p-4 sm:p-6 shadow-2xl z-50' : 'max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6 pb-28'}`}>
      
      {/* 1. TOP HEADER & FLOATING MINI LIVE PREVIEW BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-red-600/90 text-white font-black text-xs rounded-full border border-red-400/40 flex items-center gap-1.5 animate-pulse shadow">
              <Radio className="w-3.5 h-3.5" /> LIVE CONTROL CENTER
            </span>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 font-black text-xs rounded-full border border-purple-500/30 uppercase tracking-widest flex items-center gap-1">
              <Clapperboard className="w-3.5 h-3.5" /> Creator Studio
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 mt-2">
            Broadcaster Live Command Deck
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time audio, video, PK battles, guest seats, beauty filters, and monetization controls.
          </p>
        </div>

        {/* TOP QUICK ACTION STATUS BUTTONS */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLiveActive(!isLiveActive)}
            className={`px-4 py-2 rounded-2xl text-xs font-black shadow-lg flex items-center gap-2 transition-all ${
              isLiveActive
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
            }`}
          >
            <Radio className="w-4 h-4" />
            {isLiveActive ? 'End Live Broadcast' : 'Start Live Broadcast'}
          </button>

          {isOverlay && onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-700"
              title="Close Control Center"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. PERSISTENT FLOATING MINI PREVIEW WINDOW (LIVE STREAM STAYS VISIBLE) */}
      <div className="bg-slate-900/90 border border-purple-500/40 rounded-3xl p-3 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* CAMERA PREVIEW CONTAINER */}
          <div className="relative w-36 h-24 rounded-2xl overflow-hidden bg-slate-950 border-2 border-pink-500/80 shadow-xl shrink-0">
            <img
              src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80"
              alt="Live Stage Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-black rounded-md flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE
            </div>
            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-[9px] font-bold rounded-md">
              👁️ 3,890
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-purple-400 font-mono font-bold uppercase tracking-wider block">
              Active Broadcast Stream Feed
            </span>
            <h4 className="text-xs font-black text-white line-clamp-1">{streamTitle}</h4>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1 text-emerald-400"><Wifi className="w-3 h-3" /> 1080p 60fps (28ms)</span>
              <span>•</span>
              <span className="text-amber-300">💎 +14.2K Coins Earned</span>
            </div>
          </div>
        </div>

        {/* QUICK CONTROL TOGGLES IN FLOATING BAR */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setIsMicMuted(!isMicMuted)}
            className={`p-2.5 rounded-2xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
              isMicMuted ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-slate-800 text-slate-200 border-slate-700'
            }`}
          >
            {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
            <span>{isMicMuted ? 'Muted' : 'Mic On'}</span>
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2.5 rounded-2xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
              isPaused ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-200 border-slate-700'
            }`}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4 text-amber-400" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
        </div>
      </div>

      {/* 3. MODULE NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-slate-800">
        {[
          { id: 'CONTROLS', label: '🎛️ Stream Controls' },
          { id: 'GUESTS', label: '🎙️ Guests & Seats' },
          { id: 'AUDIO', label: '🔊 Audio Mixer' },
          { id: 'VIDEO', label: '🎬 Video Player' },
          { id: 'MUSIC', label: '🎵 Music System' },
          { id: 'PK', label: '⚔️ PK Battle Center' },
          { id: 'GAMES', label: '🎲 Mini Games' },
          { id: 'GOALS', label: '🎯 Live Goals' },
          { id: 'GIFTS', label: '🎁 Gift Center' },
          { id: 'ANALYTICS', label: '📊 Live Analytics' },
          { id: 'MODERATION', label: '🛡️ Moderation' },
          { id: 'CAMERA', label: '📷 Camera & Mirror' },
          { id: 'BEAUTY', label: '✨ Beauty & Filters' },
          { id: 'EVENTS', label: '🎉 Interactive Events' },
          { id: 'SETTINGS', label: '⚙️ Stream Settings' }
        ].map(mod => {
          const isAct = activeModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isAct
                  ? 'bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-lg shadow-pink-500/20 border border-pink-400/40'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{mod.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. ACTIVE MODULE CONTROLS */}

      {/* MODULE 1: LIVE CONTROLS */}
      {activeModule === 'CONTROLS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-5 shadow-xl">
          <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500" /> Broadcast Details & Mode Toggles
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-bold block mb-1">Stream Title</label>
              <input
                type="text"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">Stream Category</label>
                <select
                  value={streamCategory}
                  onChange={(e) => setStreamCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="PARTY_ROOM">🎉 9-Seat Party Room</option>
                  <option value="PK_BATTLE">⚔️ PK Gifting Battle</option>
                  <option value="MUSIC_TALENT">🎵 Music & Singing</option>
                  <option value="GAMING">🎮 Gaming & Esports</option>
                  <option value="CHAT_VLOG">💬 Chat & Talk Show</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">Broadcaster Tag</label>
                <input
                  type="text"
                  defaultValue="#Karaoke #GiftingWar #VIP"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* TOGGLES */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer">
                <span className="text-xs font-bold text-slate-200">Allow Chat Comments</span>
                <input
                  type="checkbox"
                  checked={allowComments}
                  onChange={() => setAllowComments(!allowComments)}
                  className="w-4 h-4 accent-purple-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer">
                <span className="text-xs font-bold text-slate-200">Allow Virtual Gifts</span>
                <input
                  type="checkbox"
                  checked={allowGifts}
                  onChange={() => setAllowGifts(!allowGifts)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer">
                <span className="text-xs font-bold text-slate-200">Followers-Only Chat</span>
                <input
                  type="checkbox"
                  checked={followersOnly}
                  onChange={() => setFollowersOnly(!followersOnly)}
                  className="w-4 h-4 accent-pink-500 rounded"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: GUESTS & SEATS */}
      {activeModule === 'GUESTS' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" /> 9-Seat Guest Mic Management
              </h3>
              <span className="px-3 py-1 bg-purple-950 text-purple-300 border border-purple-800 text-xs font-bold rounded-full">
                {guests.length} / 9 Seats Filled
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {guests.map(g => (
                <div key={g.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                      #{g.seat}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{g.name}</h4>
                      <span className="text-[10px] text-cyan-300 font-mono">{g.role}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setGuests(prev => prev.map(x => x.id === g.id ? { ...x, micOn: !x.micOn } : x))}
                      className={`p-1.5 rounded-xl text-xs ${g.micOn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}
                      title="Mute Guest"
                    >
                      {g.micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setGuests(prev => prev.filter(x => x.id !== g.id))}
                      className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-xs"
                      title="Remove Seat Guest"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PENDING REQUESTS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
            <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">
              Pending Seat Join Requests ({pendingRequests.length})
            </h4>
            <div className="space-y-2">
              {pendingRequests.map(p => (
                <div key={p.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-purple-400" />
                    <span className="text-xs font-bold text-slate-100">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setGuests(prev => [...prev, { id: Date.now().toString(), name: p.name, role: 'Guest', micOn: true, seat: prev.length + 1 }]);
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow"
                    >
                      Approve Seat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 3: AUDIO MIXER */}
      {activeModule === 'AUDIO' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-5 shadow-xl">
          <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-cyan-400" /> Multi-Track Audio Master Mixer
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                <span>🎤 Host Microphone Volume</span>
                <span>{micVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={micVolume}
                onChange={(e) => setMicVolume(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                <span>🎵 Background Music Volume</span>
                <span>{musicVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={musicVolume}
                onChange={(e) => setMusicVolume(Number(e.target.value))}
                className="w-full accent-pink-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                <span>🎬 Video Reel Sound Volume</span>
                <span>{videoVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={videoVolume}
                onChange={(e) => setVideoVolume(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                onClick={() => setEchoCancellation(!echoCancellation)}
                className={`p-3 rounded-2xl text-xs font-bold border text-left flex items-center justify-between ${
                  echoCancellation ? 'bg-purple-950/60 border-purple-500/40 text-purple-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span>Echo Cancellation</span>
                <span>{echoCancellation ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => setNoiseSuppression(!noiseSuppression)}
                className={`p-3 rounded-2xl text-xs font-bold border text-left flex items-center justify-between ${
                  noiseSuppression ? 'bg-purple-950/60 border-purple-500/40 text-purple-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span>AI Noise Suppression</span>
                <span>{noiseSuppression ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => setSpeakerMonitoring(!speakerMonitoring)}
                className={`p-3 rounded-2xl text-xs font-bold border text-left flex items-center justify-between ${
                  speakerMonitoring ? 'bg-purple-950/60 border-purple-500/40 text-purple-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span>Earphone Monitoring</span>
                <span>{speakerMonitoring ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 4: VIDEO PLAYER */}
      {activeModule === 'VIDEO' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
            <Video className="w-4 h-4 text-cyan-400" /> Live Stream Reel & Video Broadcast
          </h3>
          <p className="text-xs text-slate-400">Play video highlights or background clips directly to your live stream audience.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {videoLibrary.map(v => (
              <div key={v.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{v.title}</h4>
                    <span className="text-[10px] text-slate-500">Likes: {v.likes}</span>
                  </div>
                </div>
                <button
                  onClick={() => playVideo(v)}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow"
                >
                  Broadcast Clip
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODULE 5: MUSIC SYSTEM */}
      {activeModule === 'MUSIC' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
            <Music className="w-4 h-4 text-pink-400" /> Background Karaoke & Music Player
          </h3>
          <div className="space-y-2">
            {[
              { title: 'Nexora Midnight Anthem (Karaoke Instrumental)', artist: 'Official DJ', duration: '3:45' },
              { title: 'Chill Lo-Fi Live Beats 2026', artist: 'Cyber Beats', duration: '4:12' },
              { title: 'Top 40 Party EDM Remix', artist: 'VIBE Records', duration: '3:20' }
            ].map((m, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button className="w-8 h-8 rounded-full bg-pink-600 text-white flex items-center justify-center shadow">
                    <Play className="w-4 h-4 ml-0.5 fill-white" />
                  </button>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{m.title}</h4>
                    <span className="text-[10px] text-slate-500">{m.artist} • {m.duration}</span>
                  </div>
                </div>
                <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-pink-300 font-bold text-xs rounded-xl border border-pink-500/20">
                  Add to Live Queue
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODULE 6: PK BATTLE CENTER */}
      {activeModule === 'PK' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
              <Swords className="w-4 h-4 text-purple-400" /> Red vs Blue PK Gifting Battle Arena
            </h3>
            <span className="px-3 py-1 bg-red-600/90 text-white text-xs font-black rounded-full animate-pulse">
              {pkStatus === 'BATTLE_ACTIVE' ? '⚔️ PK IN PROGRESS' : 'READY TO MATCH'}
            </span>
          </div>

          <div className="bg-slate-950 border border-purple-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span className="text-pink-400">🔥 You: 48,500 Pts</span>
              <span className="text-purple-400">⚔️ Opponent: {pkOpponent} (42,100 Pts)</span>
            </div>
            <div className="h-4 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
              <div className="h-full bg-gradient-to-r from-pink-500 to-red-500 transition-all" style={{ width: '54%' }} />
              <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all" style={{ width: '46%' }} />
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPkStatus(pkStatus === 'BATTLE_ACTIVE' ? 'OFFLINE' : 'BATTLE_ACTIVE')}
                className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs rounded-2xl shadow-lg"
              >
                {pkStatus === 'BATTLE_ACTIVE' ? 'End Current PK' : 'Start PK Battle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 7: LIVE GOALS */}
      {activeModule === 'GOALS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" /> Broadcaster Live Goal Trackers
          </h3>

          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-amber-400">🪙 Live Coin Gift Goal</span>
                <span className="text-slate-300">{coinGoal.current.toLocaleString()} / {coinGoal.target.toLocaleString()} Coins</span>
              </div>
              <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${(coinGoal.current / coinGoal.target) * 100}%` }} />
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-pink-400">👥 New Followers Goal</span>
                <span className="text-slate-300">{followerGoal.current} / {followerGoal.target} Followers</span>
              </div>
              <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500" style={{ width: `${(followerGoal.current / followerGoal.target) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 8: ANALYTICS */}
      {activeModule === 'ANALYTICS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" /> Real-Time Stream Performance & Telemetry
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Peak Viewers</span>
              <span className="text-lg font-black text-white">4,820</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Avg Watch Time</span>
              <span className="text-lg font-black text-cyan-300">14m 20s</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Coins Earned</span>
              <span className="text-lg font-black text-amber-300">🪙 142.5K</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Network Latency</span>
              <span className="text-lg font-black text-emerald-400">24ms (A+)</span>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 9: MODERATION */}
      {activeModule === 'MODERATION' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" /> Stream Chat Moderation & Pinned Rules
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-bold block mb-1">Pinned Announcement Message</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pinnedMessage}
                  onChange={(e) => setPinnedMessage(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white"
                />
                <button
                  onClick={() => alert('Updated pinned announcement!')}
                  className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-2xl"
                >
                  Pin
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-bold block mb-1">Blocked Words Filter</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Add word to block..."
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white"
                />
                <button
                  onClick={() => {
                    if (newWord.trim()) {
                      setBlockedWords(prev => [...prev, newWord.trim().toLowerCase()]);
                      setNewWord('');
                    }
                  }}
                  className="px-4 py-2 bg-slate-800 text-slate-200 font-bold text-xs rounded-2xl border border-slate-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {blockedWords.map((word, i) => (
                  <span key={i} className="px-2.5 py-1 bg-red-950 text-red-300 border border-red-800 text-xs font-bold rounded-xl flex items-center gap-1">
                    {word}
                    <button onClick={() => setBlockedWords(prev => prev.filter(w => w !== word))} className="ml-1 text-red-400 hover:text-white">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 10: CAMERA CONTROLS */}
      {activeModule === 'CAMERA' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
            <Camera className="w-4 h-4 text-purple-400" /> Host Camera Hardware & Virtual Studio
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setIsFrontCamera(!isFrontCamera)}
              className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-left font-bold text-xs text-slate-200 flex items-center justify-between"
            >
              <span>Camera Direction</span>
              <span className="text-purple-400">{isFrontCamera ? '📷 Front Selfie' : '📷 Rear Lens'}</span>
            </button>

            <button
              onClick={() => setIsMirrorMode(!isMirrorMode)}
              className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-left font-bold text-xs text-slate-200 flex items-center justify-between"
            >
              <span>Mirror Camera Flip</span>
              <span className="text-cyan-400">{isMirrorMode ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      )}

      {/* MODULE 11: BEAUTY & FILTERS */}
      {activeModule === 'BEAUTY' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400" /> Real-Time Face Beauty & Color Filters
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                <span>✨ Skin Smoothing Level</span>
                <span>{skinSmoothing}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={skinSmoothing}
                onChange={(e) => setSkinSmoothing(Number(e.target.value))}
                className="w-full accent-pink-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                <span>💎 Face Slimming & Shaping</span>
                <span>{faceShaping}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={faceShaping}
                onChange={(e) => setFaceShaping(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODULE 12: EVENTS */}
      {activeModule === 'EVENTS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" /> Launch Interactive Live Events
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => alert('Treasure Box Drop launched! 1,000 Coins dropped to chat viewers.')}
              className="p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-2xl text-left space-y-1"
            >
              <h4 className="text-xs font-black text-amber-300">📦 Treasure Box Drop</h4>
              <p className="text-[10px] text-slate-400">Drop 1,000 Coins for lucky chat viewers</p>
            </button>

            <button
              onClick={() => alert('Coin Rain activated! Falling coins animation in live room.')}
              className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-2xl text-left space-y-1"
            >
              <h4 className="text-xs font-black text-pink-300">🌧️ Coin Rain Event</h4>
              <p className="text-[10px] text-slate-400">Trigger room-wide coin catching mini-game</p>
            </button>

            <button
              onClick={() => alert('Live Viewer Poll started!')}
              className="p-4 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 rounded-2xl text-left space-y-1"
            >
              <h4 className="text-xs font-black text-cyan-300">📊 Start Live Poll</h4>
              <p className="text-[10px] text-slate-400">Ask your viewers a live voting question</p>
            </button>
          </div>
        </div>
      )}

      {/* MODULE 13: SETTINGS */}
      {activeModule === 'SETTINGS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-400" /> Broadcast Encoding & Quality Settings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-bold block mb-1">Stream Resolution</label>
              <select className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white">
                <option value="1080p">1080p Ultra HD (60fps)</option>
                <option value="720p">720p High Def (30fps)</option>
                <option value="480p">480p Standard (Data Saver)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-bold block mb-1">Auto-Save Stream Replays</label>
              <select className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white">
                <option value="YES">Yes, save HD replays to profile</option>
                <option value="NO">No, do not record</option>
              </select>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
