import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Wand2, Volume2, Smile, Check } from 'lucide-react';
import { avatarService } from '../services/AvatarService';
import { apiFetch } from '../lib/apiConfig';
import { AIAvatar } from '../types';

export const AIAvatarStudio: React.FC = () => {
  const [avatars, setAvatars] = useState<AIAvatar[]>([]);

  // Real-time Firestore subscription
  useEffect(() => {
    const unsub = avatarService.subscribeToAvatars((liveAvatars) => {
      setAvatars(liveAvatars || []);
    });
    return () => unsub();
  }, []);
  const [style, setStyle] = useState('CYBERPUNK');
  const [keywords, setKeywords] = useState('neon armor, floating crown, fiery eyes');
  const [generatedResult, setGeneratedResult] = useState<{ prompt: string; suggestedName: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleGenerateAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGenerateError(null);

    try {
      const res = await apiFetch('/api/ai/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style, keywords })
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setGeneratedResult(data);
    } catch (err) {
      console.error('Avatar generation error:', err);
      setGeneratedResult(null);
      setGenerateError('Could not generate an avatar concept right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 font-black text-xs rounded-full border border-cyan-500/30 uppercase tracking-widest flex items-center gap-1">
            <Bot className="w-4 h-4 text-cyan-400" /> AI Avatar Customization Studio
          </span>
          <h2 className="text-2xl font-black text-slate-100 mt-2">
            Personalized AI Avatars & Voice Cloning
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generate animated avatars, configure expression controls, and stream using custom AI personas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GENERATOR FORM */}
        <form onSubmit={handleGenerateAvatar} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-cyan-400" /> AI Prompt & Style Engine
          </h3>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Avatar Style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200"
            >
              <option value="CYBERPUNK">Cyberpunk Neon</option>
              <option value="ANIME">Japanese Anime 3D</option>
              <option value="REALISTIC">Hyper-Realistic Streamer</option>
              <option value="FANTASY">Fantasy Mythic Mage</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Custom Visual Keywords</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-xs rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Generating AI Prompt...' : 'Generate AI Avatar Concept'}
          </button>

          {generateError && (
            <div className="p-3 bg-red-950/60 border border-red-500/30 rounded-2xl text-[11px] text-red-300 font-medium">
              {generateError}
            </div>
          )}

          {generatedResult && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-cyan-500/30 space-y-2">
              <span className="text-[10px] uppercase font-black text-cyan-400">Generated Concept</span>
              <h4 className="font-black text-xs text-slate-100">{generatedResult.suggestedName}</h4>
              <p className="text-[11px] text-slate-400 font-mono">{generatedResult.prompt}</p>
            </div>
          )}
        </form>

        {/* AVATAR GALLERY */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {avatars.length === 0 && (
            <div className="sm:col-span-2 text-center py-10 text-sm text-slate-500">
              No saved avatars yet — generate one to get started.
            </div>
          )}
          {avatars.map(av => (
            <div key={av.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
              <img
                src={av.avatarUrl}
                alt={av.name}
                className="w-full h-44 object-cover rounded-2xl"
                referrerPolicy="no-referrer"
              />
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-slate-100">{av.name}</h4>
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-[10px] font-black rounded uppercase">
                  {av.style}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Voice Tone: {av.voiceTone}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
