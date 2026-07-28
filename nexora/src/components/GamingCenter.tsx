import React, { useState, useRef, useEffect } from 'react';
import { GameRoom } from '../types';
import { MOCK_GAMES } from '../data/mockData';
import { useEconomy } from '../context/EconomyContext';
import { 
  Gamepad2, 
  Trophy, 
  Users, 
  Play, 
  RotateCw, 
  Sparkles, 
  Brain, 
  Coins, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Award,
  Crown,
  Dices,
  Lock
} from 'lucide-react';

export const GamingCenter: React.FC = () => {
  const { wallet, updateGamePoints } = useEconomy();
  const [activeGameTab, setActiveGameTab] = useState<'LUDO' | 'LUCKY_WHEEL' | 'QUIZ' | 'UNO' | 'CHESS' | 'LOBBY'>('LUDO');

  // Ludo state engine
  const [ludoWager, setLudoWager] = useState<number>(500);
  const [ludoDice, setLudoDice] = useState<number>(6);
  const [isRolling, setIsRolling] = useState(false);
  const [ludoTokens, setLudoTokens] = useState<number[]>([0, 0, 0, 0]); // 4 tokens positions 0 to 28
  const [ludoMessage, setLudoMessage] = useState<string>('Roll the dice to start your turn!');
  const [ludoScore, setLudoScore] = useState<number>(0);

  // Lucky Wheel state
  const [wheelWager, setWheelWager] = useState<number>(200);
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [wheelResultMsg, setWheelResultMsg] = useState<string>('Select your wager and spin!');

  // Quiz Battle state
  const [quizQuestion, setQuizQuestion] = useState<{ question: string; options: string[]; correctIndex: number; rewardPoints: number } | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<string | null>(null);

  // Uno Card Game state
  const [unoPlayerHand, setUnoPlayerHand] = useState<Array<{ color: string; val: string }>>([
    { color: 'red', val: '7' },
    { color: 'blue', val: 'Wild' },
    { color: 'green', val: '4' },
    { color: 'yellow', val: '+2' }
  ]);
  const [unoTopCard, setUnoTopCard] = useState<{ color: string; val: string }>({ color: 'red', val: '5' });
  const [unoMessage, setUnoMessage] = useState<string>('Match color or number!');

  // Roll Ludo Dice
  const handleRollLudoDice = () => {
    if (wallet.points < ludoWager) {
      alert(`Insufficient Points! You need ${ludoWager} Points to play.`);
      return;
    }
    setIsRolling(true);
    let rolls = 0;
    const interval = setInterval(() => {
      setLudoDice(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls >= 8) {
        clearInterval(interval);
        const finalDice = Math.floor(Math.random() * 6) + 1;
        setLudoDice(finalDice);
        setIsRolling(false);

        // Advance token
        setLudoTokens(prev => {
          const next = [...prev];
          next[0] = Math.min(28, next[0] + finalDice);
          return next;
        });

        if (finalDice === 6) {
          const winPoints = ludoWager * 2;
          updateGamePoints(winPoints, `Rolled a 6 in Ludo! Won +${winPoints} Points!`, 'Ludo Master');
          setLudoMessage(`🎉 JACKPOT ROLL! You rolled a 6 and won +${winPoints} Points!`);
          setLudoScore(s => s + winPoints);
        } else {
          setLudoMessage(`Rolled a ${finalDice}! Moved token forward. Roll again or capture!`);
        }
      }
    }, 100);
  };

  // Spin Lucky Wheel
  const handleSpinWheel = () => {
    if (wallet.points < wheelWager) {
      alert(`Insufficient Points to spin! Please exchange Coins or claim Daily Bonus.`);
      return;
    }

    setIsWheelSpinning(true);
    setWheelResultMsg('Spinning the Lucky Wheel...');

    // Deduct wager first
    updateGamePoints(-wheelWager, `Wheel Wager: -${wheelWager} Points`, 'Lucky Wheel');

    const extraTurns = Math.floor(Math.random() * 5) + 5;
    const multipliers = [0, 0.5, 1.5, 2, 3, 5, 10, 50];
    const randomIndex = Math.floor(Math.random() * multipliers.length);
    const chosenMultiplier = multipliers[randomIndex];

    const degreesPerSlice = 360 / multipliers.length;
    const targetDeg = wheelRotation + (extraTurns * 360) + (randomIndex * degreesPerSlice);

    setWheelRotation(targetDeg);

    setTimeout(() => {
      setIsWheelSpinning(false);
      const prize = Math.floor(wheelWager * chosenMultiplier);

      if (prize > 0) {
        updateGamePoints(prize, `Lucky Wheel Landed ${chosenMultiplier}x! Won +${prize.toLocaleString()} Points!`, 'Lucky Wheel');
        setWheelResultMsg(`🎉 LANDED ${chosenMultiplier}x MULTIPLIER! Won +${prize.toLocaleString()} Points!`);
      } else {
        setWheelResultMsg(`💔 Landed 0x. Try again on the next spin!`);
      }
    }, 3500);
  };

  // Fetch AI Quiz Question
  const handleFetchQuiz = async () => {
    setQuizLoading(true);
    setSelectedAnswer(null);
    setQuizResult(null);

    try {
      const res = await fetch('/api/ai/trivia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'Gaming & Virtual Economy', difficulty: 'Medium' })
      });
      const data = await res.json();
      setQuizQuestion(data);
    } catch (err) {
      setQuizQuestion({
        question: 'Which currency is used exclusively for multiplayer games & tournaments in NexEconomy?',
        options: ['Coins', 'Points', 'Diamonds', 'Credits'],
        correctIndex: 1,
        rewardPoints: 250
      });
    } finally {
      setQuizLoading(false);
    }
  };

  useEffect(() => {
    if (activeGameTab === 'QUIZ' && !quizQuestion) {
      handleFetchQuiz();
    }
  }, [activeGameTab]);

  const handleAnswerQuiz = (index: number) => {
    if (!quizQuestion || selectedAnswer !== null) return;
    setSelectedAnswer(index);

    if (index === quizQuestion.correctIndex) {
      setQuizResult(`CORRECT! Won +${quizQuestion.rewardPoints} Points!`);
      updateGamePoints(quizQuestion.rewardPoints, `Quiz Battle Win: +${quizQuestion.rewardPoints} Points`, 'Quiz Battle');
    } else {
      setQuizResult(`INCORRECT! Correct answer was: ${quizQuestion.options[quizQuestion.correctIndex]}`);
    }
  };

  // Play Uno Card
  const handlePlayUnoCard = (card: { color: string; val: string }, idx: number) => {
    setUnoTopCard(card);
    setUnoPlayerHand(prev => prev.filter((_, i) => i !== idx));

    if (unoPlayerHand.length <= 1) {
      const reward = 1000;
      updateGamePoints(reward, `Uno Victory! Won +${reward} Points!`, 'Uno Blitz');
      setUnoMessage(`🎉 UNO VICTORY! Cleared all cards and earned +${reward} Points!`);
    } else {
      setUnoMessage(`Played ${card.color.toUpperCase()} ${card.val}! Opponent is thinking...`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* GAMING HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 font-black text-xs rounded-full border border-purple-500/30 uppercase tracking-widest flex items-center gap-1">
              <Gamepad2 className="w-4 h-4 text-purple-400" /> Multi-Game Hub
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold text-xs rounded-full border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Anti-Cheat Protected
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-100 mt-2">
            Entertainment Gaming Arena
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Wager Points, compete in tournaments, climb season leaderboards, and win rewards. (Points cannot be withdrawn as cash).
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-950 px-5 py-3 rounded-2xl border border-slate-800">
          <div>
            <div className="text-[10px] uppercase font-extrabold text-purple-400">Available Gaming Points</div>
            <div className="text-lg font-black text-purple-300 flex items-center gap-1">
              🎯 {wallet.points.toLocaleString()} Points
            </div>
          </div>
        </div>
      </div>

      {/* GAME TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: 'LUDO', label: 'Ludo Arena', icon: Dices },
          { id: 'LUCKY_WHEEL', label: 'Lucky Wheel', icon: Sparkles },
          { id: 'QUIZ', label: 'AI Quiz Battle', icon: Brain },
          { id: 'UNO', label: 'Uno Blitz', icon: Play },
          { id: 'LOBBY', label: 'Public Game Rooms', icon: Users }
        ].map(tab => {
          const Icon = tab.icon;
          const isAct = activeGameTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveGameTab(tab.id as any)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black tracking-wide flex items-center gap-2 transition-all whitespace-nowrap ${
                isAct
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 border border-purple-400/40'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 text-amber-300" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* GAME 1: LUDO ARENA */}
      {activeGameTab === 'LUDO' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800 pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
                    <Dices className="w-5 h-5 text-amber-400" /> Real-time Ludo Match Server
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold rounded-full">
                    ROOM #LUDO-8821 • SERVER AUTHORITATIVE
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Player 1: Alex Rivers (You) VS Player 2: DragonMaster (AI Opponent)</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">Match Wager:</span>
                {[100, 500, 1000].map(w => (
                  <button
                    key={w}
                    onClick={() => setLudoWager(w)}
                    className={`px-3 py-1 text-xs font-black rounded-lg ${
                      ludoWager === w ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {w} Pts
                  </button>
                ))}
              </div>
            </div>

            {/* LUDO BOARD CANVAS / GRID */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-6">
              <div className="w-full max-w-md aspect-square bg-slate-900 rounded-2xl border-2 border-amber-500/30 grid grid-cols-5 gap-2 p-4 relative">
                {/* 4 CORNER HOUSES */}
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 flex flex-col items-center justify-center">
                  <span className="text-xs font-extrabold text-red-400">RED HOUSE</span>
                  <div className="w-6 h-6 rounded-full bg-red-500 mt-2 shadow-lg animate-pulse" />
                </div>
                <div className="col-span-3 bg-slate-950/80 rounded-xl border border-slate-800 p-2 text-center flex items-center justify-center text-xs font-bold text-slate-400">
                  TRACK WAY
                </div>
                <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-3 flex flex-col items-center justify-center">
                  <span className="text-xs font-extrabold text-green-400">GREEN HOUSE</span>
                  <div className="w-6 h-6 rounded-full bg-green-500 mt-2 shadow-lg" />
                </div>

                <div className="col-span-5 bg-slate-950/90 rounded-xl p-4 border border-amber-500/40 text-center space-y-2">
                  <span className="text-xs font-extrabold text-amber-300 uppercase tracking-widest">
                    Token Track Progress ({ludoTokens[0]} / 28)
                  </span>
                  <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 transition-all duration-500"
                      style={{ width: `${(ludoTokens[0] / 28) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-3 flex flex-col items-center justify-center">
                  <span className="text-xs font-extrabold text-yellow-400">YELLOW HOUSE</span>
                  <div className="w-6 h-6 rounded-full bg-yellow-500 mt-2 shadow-lg" />
                </div>
                <div className="col-span-3 bg-slate-950/80 rounded-xl border border-slate-800 p-2 text-center flex items-center justify-center text-xs font-bold text-amber-400 font-mono">
                  ★ HOME FINISH GOAL ★
                </div>
                <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-3 flex flex-col items-center justify-center">
                  <span className="text-xs font-extrabold text-blue-400">BLUE HOUSE</span>
                  <div className="w-6 h-6 rounded-full bg-blue-500 mt-2 shadow-lg" />
                </div>
              </div>

              {/* DICE ROLL CONTROL */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-4xl font-black text-slate-950 shadow-2xl ring-4 ring-amber-300/40 animate-bounce">
                  {ludoDice}
                </div>
                <p className="text-xs font-bold text-amber-300 text-center max-w-sm">{ludoMessage}</p>
                <button
                  onClick={handleRollLudoDice}
                  disabled={isRolling}
                  className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/20 uppercase tracking-wider flex items-center gap-2"
                >
                  <RotateCw className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
                  {isRolling ? 'Rolling Dice...' : `Roll Dice (-${ludoWager} Pts)`}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COL: MATCH STATS & LEADERBOARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" /> Season 8 Ludo Champions
            </h3>
            <div className="space-y-2">
              {[
                { rank: 1, name: 'DragonMasterX', pts: '128,500', badge: '🥇 Gold' },
                { rank: 2, name: 'Aria Nova', pts: '94,200', badge: '🥈 Silver' },
                { rank: 3, name: 'Alex Rivers (You)', pts: wallet.points.toLocaleString(), badge: '🥉 Bronze' },
                { rank: 4, name: 'CyberGamer', pts: '41,000', badge: 'Top 10' }
              ].map(r => (
                <div key={r.rank} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-xs text-amber-400">#{r.rank}</span>
                    <div>
                      <p className="font-bold text-xs text-slate-200">{r.name}</p>
                      <span className="text-[10px] text-slate-500">{r.badge}</span>
                    </div>
                  </div>
                  <span className="font-extrabold text-xs text-purple-300">🎯 {r.pts} Pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GAME 2: LUCKY WHEEL */}
      {activeGameTab === 'LUCKY_WHEEL' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-slate-100 flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" /> Lucky Spin Wheel Jackpot
            </h3>
            <p className="text-xs text-slate-400 max-w-md">
              Spin the wheel to win up to 50x your Points wager!
            </p>
          </div>

          {/* SPINNING WHEEL DISPLAY */}
          <div className="relative w-72 h-72 rounded-full border-8 border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.3)] flex items-center justify-center overflow-hidden bg-slate-950">
            <div
              className="absolute inset-0 rounded-full transition-transform duration-3000 ease-out flex items-center justify-center"
              style={{ transform: `rotate(${wheelRotation}deg)` }}
            >
              <div className="w-full h-full rounded-full border-4 border-amber-400/20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-purple-950 to-slate-950 flex items-center justify-center">
                <span className="text-3xl font-black text-amber-300 tracking-widest">
                  0x • 1.5x • 2x • 5x • 10x • 50x
                </span>
              </div>
            </div>
            {/* WHEEL POINTER */}
            <div className="absolute top-2 w-6 h-8 bg-amber-400 clip-path-polygon text-slate-950 flex items-center justify-center font-black text-xs z-10 rounded-b-md shadow-lg">
              ▼
            </div>
          </div>

          {/* RESULT MSG */}
          <p className="text-sm font-extrabold text-amber-300 bg-slate-950 px-6 py-2 rounded-xl border border-amber-500/30">
            {wheelResultMsg}
          </p>

          {/* WAGER CONTROLS */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-400">Wager:</span>
              {[100, 200, 500, 1000].map(w => (
                <button
                  key={w}
                  onClick={() => setWheelWager(w)}
                  className={`px-3 py-1 text-xs font-black rounded-lg ${
                    wheelWager === w ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {w} Pts
                </button>
              ))}
            </div>

            <button
              onClick={handleSpinWheel}
              disabled={isWheelSpinning}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:opacity-90 text-white font-black text-sm rounded-2xl shadow-xl shadow-purple-500/25 uppercase tracking-wider flex items-center gap-2"
            >
              <RotateCw className={`w-4 h-4 ${isWheelSpinning ? 'animate-spin' : ''}`} />
              {isWheelSpinning ? 'Spinning...' : `Spin Wheel (-${wheelWager} Pts)`}
            </button>
          </div>
        </div>
      )}

      {/* GAME 3: AI QUIZ BATTLE */}
      {activeGameTab === 'QUIZ' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-400" />
              <h3 className="font-extrabold text-lg text-slate-100">AI Trivia Speed Showdown</h3>
            </div>
            <button
              onClick={handleFetchQuiz}
              disabled={quizLoading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <RotateCw className={`w-3.5 h-3.5 ${quizLoading ? 'animate-spin' : ''}`} />
              Next Question
            </button>
          </div>

          {quizLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm font-medium animate-pulse">
              Generating dynamic Gemini 3.6 AI trivia question...
            </div>
          ) : quizQuestion ? (
            <div className="space-y-6">
              <div className="p-5 bg-slate-950 rounded-2xl border border-purple-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">AI Live Question</span>
                  <span className="text-xs font-extrabold text-amber-400">Reward: +{quizQuestion.rewardPoints} Points</span>
                </div>
                <h4 className="text-base font-black text-slate-100 leading-snug">{quizQuestion.question}</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quizQuestion.options.map((opt, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === quizQuestion.correctIndex;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerQuiz(idx)}
                      disabled={selectedAnswer !== null}
                      className={`p-4 rounded-xl border text-left font-bold text-xs transition-all ${
                        selectedAnswer === null
                          ? 'bg-slate-950 border-slate-800 hover:border-purple-500 text-slate-200'
                          : isCorrect
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                          : isSelected
                          ? 'bg-red-950/80 border-red-500 text-red-200'
                          : 'bg-slate-950/50 border-slate-900 text-slate-500'
                      }`}
                    >
                      <span className="mr-2 text-slate-500">{String.fromCharCode(65 + idx)}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {quizResult && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center font-black text-sm text-amber-300 animate-fadeIn">
                  {quizResult}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* GAME 4: UNO BLITZ */}
      {activeGameTab === 'UNO' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
              <Play className="w-5 h-5 text-indigo-400" /> Uno Color Blitz Match
            </h3>
            <span className="text-xs font-bold text-purple-300">Reward: +1,000 Points on Clearance</span>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-6">
            <p className="text-xs font-bold text-amber-300">{unoMessage}</p>

            {/* TOP CARD DISCARD PILE */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] text-slate-500 uppercase font-black">Top Discard Pile</span>
              <div className="w-24 h-36 rounded-2xl bg-slate-900 border-2 border-slate-700 flex flex-col items-center justify-center p-3 shadow-2xl">
                <span className="text-xs font-black uppercase text-amber-400">{unoTopCard.color}</span>
                <span className="text-3xl font-black text-slate-100">{unoTopCard.val}</span>
              </div>
            </div>

            {/* PLAYER HAND */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-extrabold">Your Card Hand ({unoPlayerHand.length})</span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {unoPlayerHand.map((c, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePlayUnoCard(c, idx)}
                    className="w-20 h-32 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 flex flex-col items-center justify-center p-2 shadow-xl hover:scale-105 transition-all"
                  >
                    <span className="text-[10px] font-extrabold uppercase text-cyan-400">{c.color}</span>
                    <span className="text-2xl font-black text-slate-100">{c.val}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GAME 5: PUBLIC LOBBY ROOMS */}
      {activeGameTab === 'LOBBY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_GAMES.map(g => (
            <div key={g.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-purple-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-black rounded-full uppercase">
                  {g.gameId}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {g.currentPlayers} / {g.maxPlayers} Players
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-100">{g.gameName}</h4>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span>Host: {g.hostName}</span>
                <span className="font-bold text-amber-400">Min {g.minWagerPoints} Pts</span>
              </div>
              <button
                onClick={() => {
                  setActiveGameTab('LUDO');
                  alert(`Joined ${g.gameName}! Match ready.`);
                }}
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs rounded-xl hover:opacity-90 transition-all"
              >
                Join Room
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
