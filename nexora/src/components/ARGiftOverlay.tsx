import React, { useEffect, useRef } from 'react';
import { GiftItem } from '../types';
import { Sparkles, Flame, Zap, Award, Crown, Rocket, Star } from 'lucide-react';

interface ARGiftOverlayProps {
  gift: GiftItem | null;
  onComplete: () => void;
}

export const ARGiftOverlay: React.FC<ARGiftOverlayProps> = ({ gift, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!gift) return;

    const timer = setTimeout(() => {
      onComplete();
    }, 4500);

    const canvas = canvasRef.current;
    if (!canvas) return () => clearTimeout(timer);

    const ctx = canvas.getContext('2d');
    if (!ctx) return () => clearTimeout(timer);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      life: number;
    }> = [];

    // Particle generator based on gift type
    const createParticleBatch = () => {
      const colors = ['#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#facc15'];
      const count = gift.animationType === 'DRAGON' ? 120 : gift.animationType === 'FIREWORKS' ? 200 : 80;

      for (let i = 0; i < count; i++) {
        particles.push({
          x: gift.animationType === 'FIREWORKS' ? canvas.width * 0.5 + (Math.random() - 0.5) * 300 : Math.random() * canvas.width,
          y: gift.animationType === 'SPORTS_CAR' ? canvas.height * 0.75 : Math.random() * canvas.height * 0.5,
          vx: (Math.random() - 0.5) * (gift.animationType === 'FIREWORKS' ? 12 : 6),
          vy: (Math.random() - 0.5) * 8 - (gift.animationType === 'SPACESHIP' ? 8 : 2),
          size: Math.random() * 8 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          life: 1
        });
      }
    };

    createParticleBatch();

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render & update particles
      particles.forEach((p, idx) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.012;
        p.size = Math.max(0, p.size - 0.05);

        if (p.alpha <= 0) {
          particles.splice(idx, 1);
        }
      });

      if (particles.length > 0) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gift, onComplete]);

  if (!gift) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden backdrop-blur-[2px]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* DRAGON ANIMATION */}
      {gift.animationType === 'DRAGON' && (
        <div className="relative flex flex-col items-center justify-center animate-bounce duration-1000">
          <div className="text-[120px] filter drop-shadow-[0_0_35px_rgba(239,68,68,0.8)] animate-pulse">
            🐉
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 px-6 py-3 rounded-full shadow-2xl border border-amber-300/40 text-white font-black text-2xl tracking-widest uppercase animate-pulse">
            <Flame className="w-8 h-8 text-yellow-300 fill-yellow-300 animate-spin" />
            MYTHIC DRAGON GIFT UNLEASHED!
            <Sparkles className="w-8 h-8 text-yellow-300 fill-yellow-300" />
          </div>
          <p className="text-yellow-200 text-sm font-semibold mt-2 tracking-wide bg-black/60 px-4 py-1 rounded-md backdrop-blur-md">
            Value: {gift.coinPrice.toLocaleString()} Coins ({gift.diamondValue.toLocaleString()} Diamonds)
          </p>
        </div>
      )}

      {/* SPORTS CAR ANIMATION */}
      {gift.animationType === 'SPORTS_CAR' && (
        <div className="absolute bottom-24 w-full flex flex-col items-center animate-[slideRight_3s_ease-in-out]">
          <div className="text-[100px] filter drop-shadow-[0_0_30px_rgba(59,130,246,0.9)]">
            🏎️
          </div>
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-2.5 rounded-2xl border border-blue-400 text-white font-black text-xl tracking-wider uppercase shadow-[0_0_40px_rgba(59,130,246,0.6)] flex items-center gap-3">
            <Zap className="w-6 h-6 text-cyan-300 fill-cyan-300" />
            CYBER SPORTS CAR GIFT ARRIVED!
          </div>
        </div>
      )}

      {/* CASTLE ANIMATION */}
      {gift.animationType === 'CASTLE' && (
        <div className="relative flex flex-col items-center justify-center">
          <div className="text-[110px] filter drop-shadow-[0_0_40px_rgba(168,85,247,0.8)] animate-pulse">
            🏰
          </div>
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 px-8 py-3 rounded-2xl border border-purple-300 text-white font-black text-2xl tracking-wide uppercase shadow-2xl flex items-center gap-3">
            <Crown className="w-8 h-8 text-amber-300 fill-amber-300" />
            CRYSTAL CASTLE GIFT SUMMONED
          </div>
        </div>
      )}

      {/* SPACESHIP ANIMATION */}
      {gift.animationType === 'SPACESHIP' && (
        <div className="relative flex flex-col items-center justify-center animate-[launchUp_2.5s_ease-out]">
          <div className="text-[110px] filter drop-shadow-[0_0_35px_rgba(245,158,11,0.9)]">
            🚀
          </div>
          <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 px-6 py-2.5 rounded-full border border-amber-300 text-white font-extrabold text-xl tracking-wider uppercase flex items-center gap-2 shadow-2xl">
            <Rocket className="w-6 h-6 text-yellow-200" />
            SPACE SHUTTLE LAUNCHED!
          </div>
        </div>
      )}

      {/* PORTAL & FIREWORKS & CONFETTI DEFAULT */}
      {(gift.animationType === 'PORTAL' || gift.animationType === 'FIREWORKS' || gift.animationType === 'CONFETTI' || gift.animationType === 'STANDARD') && (
        <div className="relative flex flex-col items-center justify-center">
          <div className="text-[90px] filter drop-shadow-[0_0_25px_rgba(234,179,8,0.9)] animate-pulse">
            {gift.icon}
          </div>
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-2.5 rounded-full border border-indigo-300 text-white font-extrabold text-lg tracking-wider uppercase flex items-center gap-2 shadow-2xl">
            <Award className="w-5 h-5 text-yellow-300" />
            {gift.name} Gift Sent!
            <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
          </div>
        </div>
      )}
    </div>
  );
};
