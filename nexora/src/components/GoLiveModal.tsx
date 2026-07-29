import React, { useState } from 'react';
import { 
  Camera, 
  Mic, 
  Swords, 
  Video, 
  X, 
  Sparkles, 
  Bot, 
  Globe2, 
  Users, 
  Zap, 
  Award, 
  ShieldCheck, 
  CheckCircle2 
} from 'lucide-react';
import { useEconomy } from '../context/EconomyContext';

interface GoLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStreamType: (
    type: 'VIDEO' | 'PARTY_9SEAT' | 'PK_BATTLE' | 'REEL',
    details: { title: string; tag: string }
  ) => void;
}

export const GoLiveModal: React.FC<GoLiveModalProps> = ({
  isOpen,
  onClose,
  onSelectStreamType
}) => {
  const { userLevel, vipTier } = useEconomy();
  const [streamTitle, setStreamTitle] = useState('Chill Vibes & Music Party Session 🎵');
  const [beautyMode, setBeautyMode] = useState(true);
  const [selectedTag, setSelectedTag] = useState('Music & Chat');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="text-center space-y-2">
          <span className="px-3 py-1 bg-pink-500/20 text-pink-300 text-xs font-black rounded-full border border-pink-500/30 uppercase tracking-widest inline-flex items-center gap-1">
            <Camera className="w-3.5 h-3.5 text-pink-400" /> Live Streaming Center
          </span>
          <h2 className="text-2xl font-black bg-gradient-to-r from-pink-400 via-purple-300 to-amber-300 bg-clip-text text-transparent">
            Go Live & Host Party
          </h2>
          <p className="text-xs text-slate-400">
            Choose your broadcast mode with AI Beauty Camera, 9-Seat Party audio, or PK Battles!
          </p>
        </div>

        {/* STREAM TITLE INPUT */}
        <div className="space-y-1 text-xs">
          <label className="font-bold text-slate-300 block">Stream Room Title</label>
          <input
            type="text"
            value={streamTitle}
            onChange={(e) => setStreamTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-slate-100 focus:border-pink-500 font-medium"
            placeholder="Enter stream title..."
          />
        </div>

        {/* SELECT BROADCAST MODE OPTIONS */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              id: 'VIDEO',
              title: '📹 Live Video Stream',
              sub: 'Solo webcam with AI Beauty FX',
              color: 'from-pink-600 to-purple-600'
            },
            {
              id: 'PARTY_9SEAT',
              title: '🎙️ 9-Seat Party Room',
              sub: 'Voice seats, Karaoke & Dating',
              color: 'from-purple-600 to-indigo-600'
            },
            {
              id: 'PK_BATTLE',
              title: '⚔️ Challenge PK Battle',
              sub: '1v1 Gift Battle with Host',
              color: 'from-amber-500 to-red-600'
            },
            {
              id: 'REEL',
              title: '🎬 Post Video Reel',
              sub: 'Upload short video highlight',
              color: 'from-cyan-600 to-blue-600'
            }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                onSelectStreamType(mode.id as any, { title: streamTitle, tag: selectedTag });
                onClose();
              }}
              className={`p-4 bg-slate-950 border border-slate-800 hover:border-pink-500/50 rounded-2xl text-left space-y-1.5 transition-all group hover:scale-[1.02] shadow-md`}
            >
              <h4 className="font-black text-xs text-slate-100 group-hover:text-pink-300">{mode.title}</h4>
              <p className="text-[10px] text-slate-400 leading-tight">{mode.sub}</p>
            </button>
          ))}
        </div>

        {/* AI BEAUTY CAMERA TOGGLE */}
        <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div>
              <span className="font-extrabold text-slate-200 block">AI Crystal Beauty Filter (80%)</span>
              <span className="text-[10px] text-slate-500">Auto face smoothing, glow & lighting</span>
            </div>
          </div>
          <button
            onClick={() => setBeautyMode(!beautyMode)}
            className={`px-3 py-1 font-black text-[10px] rounded-full transition-all ${
              beautyMode
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            {beautyMode ? 'ON ✓' : 'OFF'}
          </button>
        </div>

        {/* ACTION BUTTON */}
        <button
          onClick={() => {
            onSelectStreamType('VIDEO', { title: streamTitle, tag: selectedTag });
            onClose();
          }}
          className="w-full py-3 bg-gradient-to-r from-pink-500 via-purple-600 to-amber-500 text-white font-black text-xs rounded-2xl shadow-xl hover:opacity-90 flex items-center justify-center gap-2"
        >
          <Camera className="w-4 h-4" /> Broadcast Live Now
        </button>
      </div>
    </div>
  );
};
