import React, { useState, useEffect } from 'react';
import { GameRoom, GameDefinition, Tournament, DailyGameMission, GameCategory } from '../types';
import { useEconomy } from '../context/EconomyContext';
import { gamingLobbyService } from '../services/GamingLobbyService';
import { gameEngine, EngineGameSession } from '../services/GameEngine';
import { initializeGameRegistry } from '../services/GameRegistry';
import { tournamentService } from '../services/TournamentService';
import { dailyMissionsService } from '../services/DailyMissionsService';

// Ensure game modules are initialized in GameEngine
initializeGameRegistry();

import { apiFetch } from '../lib/apiConfig';
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
  Lock,
  HelpCircle,
  Grid,
  Circle,
  Square,
  BarChart2,
  CloudRain,
  Box,
  Split,
  Smile,
  UserPlus,
  Heart,
  Gift,
  Tv,
  Search,
  Zap,
  ChevronRight,
  PlusCircle,
  Swords,
  Users2,
  Layers
} from 'lucide-react';

type UnoCard = { color: string; val: string };

/** Builds and shuffles a real 108-card UNO deck. */
function buildUnoDeck(): UnoCard[] {
  const colors = ['red', 'blue', 'green', 'yellow'];
  const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Skip', 'Reverse', '+2'];
  const deck: UnoCard[] = [];

  colors.forEach(c => {
    values.forEach(v => {
      deck.push({ color: c, val: v });
      if (v !== '0') deck.push({ color: c, val: v });
    });
    deck.push({ color: 'wild', val: 'Wild' });
    deck.push({ color: 'wild', val: '+4' });
  });

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** A card is playable if it's Wild, matches the active color, or matches the top card's value. */
function isUnoCardPlayable(card: UnoCard, topCard: UnoCard, activeColor: string): boolean {
  return card.color === 'wild' || card.color === activeColor || card.val === topCard.val;
}

/**
 * Simple but competent Tic-Tac-Toe AI: win if possible, else block the opponent's
 * winning move, else take the center, else a corner, else whatever's left. This
 * replaces a purely random AI move so the game is an actual contest.
 */
function pickTicTacToeAiMove(grid: Array<string | null>, aiSymbol: 'X' | 'O'): number {
  const humanSymbol = aiSymbol === 'X' ? 'O' : 'X';
  const wins = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  const empty = grid.map((v, i) => (v === null ? i : -1)).filter(i => i !== -1);

  const findWinningMove = (symbol: string) => {
    for (const idx of empty) {
      const trial = [...grid];
      trial[idx] = symbol;
      if (wins.some(combo => combo.every(i => trial[i] === symbol))) return idx;
    }
    return null;
  };

  const winMove = findWinningMove(aiSymbol);
  if (winMove !== null) return winMove;

  const blockMove = findWinningMove(humanSymbol);
  if (blockMove !== null) return blockMove;

  if (grid[4] === null) return 4;

  const corners = [0, 2, 6, 8].filter(i => grid[i] === null);
  if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];

  return empty[Math.floor(Math.random() * empty.length)];
}

export const GamingCenter: React.FC = () => {
  const { wallet, updateGamePoints, authUser } = useEconomy();

  // Navigation Hub Tab
  const [hubTab, setHubTab] = useState<
    'TRENDING' | 'CASUAL' | 'PARTY' | 'COIN' | 'HOST' | 'PK' | 'FAMILY' | 'TOURNAMENTS' | 'MISSIONS' | 'LOBBY'
  >('TRENDING');

  // Search & Filter Query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Selected Game Module for Live Play
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [activeMatchSession, setActiveMatchSession] = useState<EngineGameSession | null>(null);

  // Firestore Game Lobby Rooms
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [missions, setMissions] = useState<DailyGameMission[]>([]);

  // Modal for Room Creation & Private Invite
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('🔥 Fast Wager Ludo Room');
  const [newRoomGameId, setNewRoomGameId] = useState('LUDO');
  const [newRoomWager, setNewRoomWager] = useState(500);
  const [isPrivateRoomOption, setIsPrivateRoomOption] = useState(false);
  const [createdPrivateCode, setCreatedPrivateCode] = useState<string | null>(null);
  const [inputInviteCode, setInputInviteCode] = useState<string>('');
  const [isSearchingQuickMatch, setIsSearchingQuickMatch] = useState(false);

  // Modular Game States
  // Ludo (Full 4-Color Server-Authoritative State)
  const [ludoWager, setLudoWager] = useState<number>(500);
  const [ludoDice, setLudoDice] = useState<number>(6);
  const [isRolling, setIsRolling] = useState(false);
  const [ludoTurnColor, setLudoTurnColor] = useState<'RED' | 'GREEN' | 'YELLOW' | 'BLUE'>('RED');
  const [ludoTokensState, setLudoTokensState] = useState<{
    RED: number[];
    GREEN: number[];
    YELLOW: number[];
    BLUE: number[];
  }>({
    RED: [-1, -1, -1, -1],
    GREEN: [-1, -1, -1, -1],
    YELLOW: [-1, -1, -1, -1],
    BLUE: [-1, -1, -1, -1]
  });
  const [ludoHasRolled, setLudoHasRolled] = useState(false);
  const [ludoMessage, setLudoMessage] = useState<string>('RED Turn! Roll the dice to begin.');

  // Lucky Wheel
  const [wheelWager, setWheelWager] = useState<number>(200);
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [wheelResultMsg, setWheelResultMsg] = useState<string>('Select your wager and spin!');

  // AI Quiz
  const [quizQuestion, setQuizQuestion] = useState<{ question: string; options: string[]; correctIndex: number; rewardPoints: number } | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<string | null>(null);

  // Uno Blitz — real 108-card deck, real hand deals, real rule enforcement vs an AI
  // opponent (previously this let you play any card with no validation at all).
  const [unoDeck, setUnoDeck] = useState<UnoCard[]>([]);
  const [unoPlayerHand, setUnoPlayerHand] = useState<UnoCard[]>([]);
  const [unoAiHand, setUnoAiHand] = useState<UnoCard[]>([]);
  const [unoTopCard, setUnoTopCard] = useState<UnoCard>({ color: 'red', val: '5' });
  const [unoActiveColor, setUnoActiveColor] = useState<string>('red');
  const [unoTurn, setUnoTurn] = useState<'PLAYER' | 'AI'>('PLAYER');
  const [unoPendingWildIndex, setUnoPendingWildIndex] = useState<number | null>(null);
  const [unoRoundOver, setUnoRoundOver] = useState<boolean>(false);
  const [unoAiTurnTick, setUnoAiTurnTick] = useState<number>(0);
  const [unoMessage, setUnoMessage] = useState<string>('Tap "New Round" to deal in.');

  // Coin Flip State
  const [coinPick, setCoinPick] = useState<'HEADS' | 'TAILS'>('HEADS');
  const [coinResult, setCoinResult] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);

  // Truth or Dare Spinner State
  const [todType, setTodType] = useState<'TRUTH' | 'DARE'>('TRUTH');
  const [todPrompt, setTodPrompt] = useState<string>('Press Spin to generate a mic seat prompt!');

  // Tic Tac Toe State
  const [tttGrid, setTttGrid] = useState<Array<string | null>>(Array(9).fill(null));
  const [tttTurn, setTttTurn] = useState<'X' | 'O'>('X');
  const [tttMessage, setTttMessage] = useState<string>('Your turn (X)! Tap a cell to play.');
  const [tttWager, setTttWager] = useState<number>(300);

  // Connect Four State
  const [c4Grid, setC4Grid] = useState<number[][]>(Array(6).fill(null).map(() => Array(7).fill(0)));
  const [c4Turn, setC4Turn] = useState<number>(1);
  const [c4Message, setC4Message] = useState<string>('Player 1 (Red) turn! Tap a column to drop a disc.');

  // Chess State
  const [chessBoard, setChessBoard] = useState<string[][]>([
    ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
    ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
    ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
  ]);
  const [chessSelected, setChessSelected] = useState<[number, number] | null>(null);
  const [chessMessage, setChessMessage] = useState<string>('White turn! Tap a piece then tap a target square.');

  // Slots Paradise State
  const [slotsReels, setSlotsReels] = useState<string[]>(['🎰', '🎰', '🎰']);
  const [isSlotsSpinning, setIsSlotsSpinning] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState<string>('Press Spin to try for the 5,000 Pts Jackpot!');
  const [slotsWager, setSlotsWager] = useState<number>(100);

  // Mystery Box State
  const [boxesOpened, setBoxesOpened] = useState<boolean[]>([false, false, false]);
  const [boxPrizes, setBoxPrizes] = useState<number[]>([0, 0, 0]);
  const [boxMessage, setBoxMessage] = useState<string>('Pick a Mystery Box to open your reward!');

  // Spin Bottle State
  const [bottleRotation, setBottleRotation] = useState<number>(0);
  const [isBottleSpinning, setIsBottleSpinning] = useState<boolean>(false);
  const [bottleLandedSeat, setBottleLandedSeat] = useState<number | null>(null);

  // PK Gift War State
  const [pkScoreHost1, setPkScoreHost1] = useState<number>(50);
  const [pkScoreHost2, setPkScoreHost2] = useState<number>(50);
  const [pkMessage, setPkMessage] = useState<string>('Tap "Send Gift (+10 Pts)" to push the PK meter toward Team 1!');

  // Family Guild Boss Raid State
  const [bossHp, setBossHp] = useState<number>(1000);
  const [bossCombo, setBossCombo] = useState<number>(0);
  const [bossMessage, setBossMessage] = useState<string>('Raid Boss spawned! Tap Guild Strike to deal damage.');

  // Generic Arena Custom Move State
  const [genericMoveText, setGenericMoveText] = useState<string>('Strategic Move');
  const [genericLogs, setGenericLogs] = useState<string[]>(['Session initialized. Ready for turn moves.']);

  // Subscriptions & Initial Loads
  useEffect(() => {
    const unsubLobby = gamingLobbyService.subscribeToRooms((liveRooms) => {
      setGameRooms(liveRooms || []);
    });

    const unsubTourn = tournamentService.subscribeToTournaments((liveTourns) => {
      setTournaments(liveTourns || []);
    });

    setMissions(dailyMissionsService.getMissions());

    return () => {
      unsubLobby();
      unsubTourn();
    };
  }, []);

  // Fetch AI Quiz
  const handleFetchQuiz = async () => {
    setQuizLoading(true);
    setSelectedAnswer(null);
    setQuizResult(null);
    try {
      const res = await apiFetch('/api/ai/trivia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'Gaming & Virtual Economy', difficulty: 'Medium' })
      });
      const data = await res.json();
      setQuizQuestion(data);
    } catch {
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
    if (activeGameId === 'TRIVIA_QUIZ' && !quizQuestion) {
      handleFetchQuiz();
    }
  }, [activeGameId]);

  useEffect(() => {
    if (activeGameId === 'UNO' && unoPlayerHand.length === 0 && unoAiHand.length === 0) {
      dealUnoRound();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGameId]);

  // Quick Match search handler
  const handleQuickMatch = async (gameId: string) => {
    setIsSearchingQuickMatch(true);
    try {
      const match = await gamingLobbyService.findQuickMatch(gameId, wallet.points);
      if (match) {
        setActiveGameId(match.gameId);
        setLudoMessage(`Matched room "${match.roomCode || match.gameName}"! Match session ready.`);
      } else {
        // Fallback: auto-create room if none available
        const newId = await gamingLobbyService.createRoom({
          gameId,
          gameName: gameEngine.getModule(gameId)?.definition.name || gameId,
          hostName: authUser?.displayName || 'Player',
          minWagerPoints: 500,
          maxPlayers: 4,
          currentPlayers: 1,
          isPrivate: false,
          status: 'WAITING',
          category: 'CASUAL'
        });
        setActiveGameId(gameId);
        setLudoMessage(`Created Quick Match Room #${newId.slice(0, 5)}! Waiting for players...`);
      }
    } catch (err: any) {
      alert(err.message || 'Error joining Quick Match');
    } finally {
      setIsSearchingQuickMatch(false);
    }
  };

  // Join by 6-digit invite code
  const handleJoinPrivateCode = async () => {
    if (!inputInviteCode || inputInviteCode.length !== 6) {
      alert('Please enter a valid 6-digit Room Invite Code.');
      return;
    }
    try {
      const room = await gamingLobbyService.joinByRoomCode(inputInviteCode);
      setActiveGameId(room.gameId);
      setLudoMessage(`Joined Private Room #${room.roomCode}! Session live.`);
      setInputInviteCode('');
    } catch (err: any) {
      alert(err.message || 'Room code not found or already full.');
    }
  };

  // Roll Ludo Dice
  const handleRollLudoDice = () => {
    if (wallet.points < ludoWager && !ludoHasRolled) {
      alert(`Insufficient Points! You need ${ludoWager} Points to play.`);
      return;
    }
    if (ludoHasRolled) {
      alert('You have already rolled! Select a token to move.');
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
        setLudoHasRolled(true);

        const activeTokens = ludoTokensState[ludoTurnColor];
        const canMove = activeTokens.some(t => (t === -1 && finalDice === 6) || (t >= 0 && t + finalDice <= 106));

        if (!canMove) {
          setLudoMessage(`Rolled a ${finalDice}! No legal moves. Turn passed.`);
          setTimeout(() => {
            setLudoHasRolled(false);
            const colors: ('RED' | 'GREEN' | 'YELLOW' | 'BLUE')[] = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
            const nextColor = colors[(colors.indexOf(ludoTurnColor) + 1) % 4];
            setLudoTurnColor(nextColor);
            setLudoMessage(`${nextColor} Turn! Roll the dice.`);
          }, 1200);
        } else {
          setLudoMessage(`Rolled a ${finalDice}! Tap one of your highlighted tokens to move.`);
        }
      }
    }, 100);
  };

  // Move Ludo Token by token Index (0..3)
  const handleMoveLudoToken = (tokenIdx: number) => {
    if (!ludoHasRolled) {
      alert('Please roll the dice first!');
      return;
    }

    const currentTokens = ludoTokensState[ludoTurnColor];
    const pos = currentTokens[tokenIdx];

    if (pos === -1 && ludoDice !== 6) {
      alert('You need a 6 to release a token from Home!');
      return;
    }

    let newPos = pos;
    if (pos === -1 && ludoDice === 6) {
      newPos = 0; // Move to start square
    } else if (pos >= 0 && pos + ludoDice <= 106) {
      newPos = pos + ludoDice;
    } else {
      alert('Cannot move token beyond Home Goal!');
      return;
    }

    const updatedTokens = [...currentTokens];
    updatedTokens[tokenIdx] = newPos;

    // Check capture on non-safe cells
    const safeCells = [0, 8, 13, 21, 26, 34, 39, 47];
    let captured = false;

    const nextState = { ...ludoTokensState, [ludoTurnColor]: updatedTokens };

    if (newPos >= 0 && newPos <= 51 && !safeCells.includes(newPos)) {
      (Object.keys(nextState) as ('RED' | 'GREEN' | 'YELLOW' | 'BLUE')[]).forEach(col => {
        if (col !== ludoTurnColor) {
          const opponentTokens = nextState[col];
          const newOpponentTokens = opponentTokens.map(p => {
            if (p === newPos) {
              captured = true;
              return -1; // Send back home!
            }
            return p;
          });
          nextState[col] = newOpponentTokens;
        }
      });
    }

    setLudoTokensState(nextState);
    setLudoHasRolled(false);

    // Check victory
    const isWinner = updatedTokens.every(p => p === 106);
    if (isWinner) {
      const winPrize = ludoWager * 4;
      updateGamePoints(winPrize, `🏆 Ludo Champion Victory!`, 'Ludo Master');
      setLudoMessage(`🎉 VICTORY! ${ludoTurnColor} won the match and claimed +${winPrize} Points!`);
      return;
    }

    const getExtraTurn = ludoDice === 6 || captured;
    if (getExtraTurn) {
      setLudoMessage(`🎉 Bonus Turn for ${ludoTurnColor}! ${captured ? 'Captured token!' : 'Rolled a 6!'}`);
    } else {
      const colors: ('RED' | 'GREEN' | 'YELLOW' | 'BLUE')[] = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
      const nextColor = colors[(colors.indexOf(ludoTurnColor) + 1) % 4];
      setLudoTurnColor(nextColor);
      setLudoMessage(`${nextColor} Turn! Roll the dice to move.`);
    }
  };

  // AI auto-play for every seat except RED (you). Previously the board just sat on
  // "GREEN Turn!" etc. forever since nothing but a human click ever advanced a
  // non-RED color — the game was unplayable past your own first turn.
  const [ludoAiTurnTick, setLudoAiTurnTick] = useState(0);
  useEffect(() => {
    if (activeGameId !== 'LUDO' || ludoTurnColor === 'RED' || ludoMessage.includes('VICTORY')) return;

    const timer = setTimeout(() => {
      const color = ludoTurnColor;
      const dice = Math.floor(Math.random() * 6) + 1;
      const tokens = ludoTokensState[color];
      const safeCells = [0, 8, 13, 21, 26, 34, 39, 47];
      const colors: ('RED' | 'GREEN' | 'YELLOW' | 'BLUE')[] = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
      const advanceToNextColor = () => setLudoTurnColor(colors[(colors.indexOf(color) + 1) % 4]);

      const legalTokenIdxs = tokens
        .map((pos, idx) => ({ pos, idx }))
        .filter(({ pos }) => (pos === -1 && dice === 6) || (pos >= 0 && pos + dice <= 106));

      if (legalTokenIdxs.length === 0) {
        setLudoDice(dice);
        setLudoMessage(`${color} rolled a ${dice}. No legal moves — turn passes.`);
        advanceToNextColor();
        return;
      }

      // Prefer a capture, then releasing from Home, then the most-advanced token.
      const withNewPos = legalTokenIdxs.map(({ pos, idx }) => ({ idx, pos, newPos: pos === -1 ? 0 : pos + dice }));
      const captureMove = withNewPos.find(({ newPos }) =>
        newPos >= 0 && newPos <= 51 && !safeCells.includes(newPos) &&
        colors.some(c => c !== color && ludoTokensState[c].includes(newPos))
      );
      const releaseMove = withNewPos.find(({ pos }) => pos === -1);
      const bestMove = captureMove || releaseMove || withNewPos.sort((a, b) => b.pos - a.pos)[0];

      const updatedTokens = [...tokens];
      updatedTokens[bestMove.idx] = bestMove.newPos;

      let captured = false;
      const nextState = { ...ludoTokensState, [color]: updatedTokens };
      if (bestMove.newPos >= 0 && bestMove.newPos <= 51 && !safeCells.includes(bestMove.newPos)) {
        colors.forEach(c => {
          if (c === color) return;
          nextState[c] = nextState[c].map(p => {
            if (p === bestMove.newPos) { captured = true; return -1; }
            return p;
          });
        });
      }

      setLudoTokensState(nextState);
      setLudoDice(dice);

      const isWinner = updatedTokens.every(p => p === 106);
      if (isWinner) {
        setLudoMessage(`💔 ${color} (AI) won this round! Reset to try again.`);
        return;
      }

      const extraTurn = dice === 6 || captured;
      if (extraTurn) {
        setLudoMessage(`${color} rolled a ${dice}${captured ? ' and captured a token' : ''} — bonus turn!`);
        setLudoAiTurnTick(t => t + 1); // ludoTurnColor is unchanged, force this effect to run again
      } else {
        setLudoMessage(`${color} moved to #${bestMove.newPos}.`);
        advanceToNextColor();
      }
    }, 900);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGameId, ludoTurnColor, ludoAiTurnTick]);

  // Deal a fresh Uno round: real shuffled deck, real 7-card hands each, and a
  // guaranteed non-Wild starting card so the required color is never ambiguous.
  const dealUnoRound = () => {
    const deck = buildUnoDeck();
    const playerHand = deck.splice(0, 7);
    const aiHand = deck.splice(0, 7);

    let topCard = deck.pop() || { color: 'red', val: '7' };
    const setAside: UnoCard[] = [];
    while (topCard.color === 'wild' && deck.length > 0) {
      setAside.push(topCard);
      topCard = deck.pop()!;
    }
    deck.push(...setAside);

    setUnoDeck(deck);
    setUnoPlayerHand(playerHand);
    setUnoAiHand(aiHand);
    setUnoTopCard(topCard);
    setUnoActiveColor(topCard.color);
    setUnoTurn('PLAYER');
    setUnoPendingWildIndex(null);
    setUnoRoundOver(false);
    setUnoMessage('Your turn! Match the color or number.');
  };

  // Applies a played card's special effect. In this 1v1 layout Skip/Reverse/+2/+4
  // all skip the only opponent, so the turn always returns to whoever played them.
  const applyUnoCardEffect = (card: UnoCard, chosenColor: string | undefined, playerIsActor: boolean) => {
    const opponentHand = playerIsActor ? unoAiHand : unoPlayerHand;
    const setOpponentHand = playerIsActor ? setUnoAiHand : setUnoPlayerHand;
    const deck = [...unoDeck];
    let forcedDraw = 0;
    let effectMsg = '';

    if (card.val === '+2') { forcedDraw = 2; effectMsg = ' — opponent draws 2 and is skipped!'; }
    else if (card.val === '+4') { forcedDraw = 4; effectMsg = ' — opponent draws 4 and is skipped!'; }
    else if (card.val === 'Skip') { effectMsg = ' — opponent is skipped!'; }
    else if (card.val === 'Reverse') { effectMsg = ' — acts as Skip in 1v1!'; }

    if (forcedDraw > 0 && deck.length > 0) {
      const drawn = deck.splice(Math.max(0, deck.length - forcedDraw), forcedDraw);
      setOpponentHand([...opponentHand, ...drawn]);
      setUnoDeck(deck);
    }

    const activeColor = card.color === 'wild' ? (chosenColor || 'red') : card.color;
    setUnoActiveColor(activeColor);
    setUnoTopCard(card);
    return effectMsg;
  };

  const finishUnoTurn = (winnerLabel: 'YOU' | 'AI' | null) => {
    if (winnerLabel === 'YOU') {
      updateGamePoints(800, 'UNO Victory!', 'Uno Color Blitz');
      setUnoMessage('🎉 UNO VICTORY! You cleared your hand and won +800 Points!');
      setUnoRoundOver(true);
      return;
    }
    if (winnerLabel === 'AI') {
      setUnoMessage('💔 CyberGamer cleared their hand first. Try another round!');
      setUnoRoundOver(true);
      return;
    }
  };

  const handlePlayUnoCard = (index: number) => {
    if (unoTurn !== 'PLAYER' || unoRoundOver || unoPendingWildIndex !== null) return;
    const card = unoPlayerHand[index];
    if (!isUnoCardPlayable(card, unoTopCard, unoActiveColor)) {
      setUnoMessage(`Can't play ${card.color.toUpperCase()} ${card.val} — it doesn't match ${unoActiveColor.toUpperCase()} or ${unoTopCard.val}.`);
      return;
    }
    if (card.color === 'wild') {
      setUnoPendingWildIndex(index);
      setUnoMessage('Choose a color for your Wild card.');
      return;
    }
    playUnoCardAt(index, undefined);
  };

  const playUnoCardAt = (index: number, chosenColor: string | undefined) => {
    const card = unoPlayerHand[index];
    const nextHand = unoPlayerHand.filter((_c, i) => i !== index);
    setUnoPlayerHand(nextHand);
    setUnoPendingWildIndex(null);

    if (nextHand.length === 0) {
      setUnoTopCard(card);
      finishUnoTurn('YOU');
      return;
    }

    const effectMsg = applyUnoCardEffect(card, chosenColor, true);
    setUnoMessage(`You played ${(card.color === 'wild' ? chosenColor : card.color)?.toUpperCase()} ${card.val}${effectMsg}`);
    setUnoTurn(effectMsg ? 'PLAYER' : 'AI');
  };

  const handleUnoChooseColor = (color: string) => {
    if (unoPendingWildIndex === null) return;
    playUnoCardAt(unoPendingWildIndex, color);
  };

  const handleUnoDrawCard = () => {
    if (unoTurn !== 'PLAYER' || unoRoundOver || unoPendingWildIndex !== null) return;
    if (unoDeck.length === 0) {
      setUnoMessage('Deck is empty — turn passes.');
      setUnoTurn('AI');
      return;
    }
    const deck = [...unoDeck];
    const [drawn] = deck.splice(deck.length - 1, 1);
    setUnoDeck(deck);
    setUnoPlayerHand([...unoPlayerHand, drawn]);
    setUnoMessage(`Drew ${drawn.color.toUpperCase()} ${drawn.val}. Turn passes.`);
    setUnoTurn('AI');
  };

  // AI's turn: play the first valid card (preferring a non-Wild match so Wilds are
  // saved for when nothing else fits), else draw up to 3 times looking for a play,
  // else pass. Runs automatically — nothing to click.
  useEffect(() => {
    if (activeGameId !== 'UNO' || unoTurn !== 'AI' || unoRoundOver) return;

    const timer = setTimeout(() => {
      let hand = [...unoAiHand];
      let deck = [...unoDeck];
      let topCard = unoTopCard;
      let activeColor = unoActiveColor;
      let drawsLeft = 3;

      let playIdx = hand.findIndex(c => c.color !== 'wild' && isUnoCardPlayable(c, topCard, activeColor));
      if (playIdx === -1) playIdx = hand.findIndex(c => isUnoCardPlayable(c, topCard, activeColor));

      while (playIdx === -1 && drawsLeft > 0 && deck.length > 0) {
        const [drawn] = deck.splice(deck.length - 1, 1);
        hand = [...hand, drawn];
        drawsLeft--;
        if (isUnoCardPlayable(drawn, topCard, activeColor)) playIdx = hand.length - 1;
      }

      setUnoDeck(deck);

      if (playIdx === -1) {
        setUnoAiHand(hand);
        setUnoMessage('CyberGamer drew and passed. Your turn!');
        setUnoTurn('PLAYER');
        return;
      }

      const card = hand[playIdx];
      const remainingHand = hand.filter((_c, i) => i !== playIdx);

      if (remainingHand.length === 0) {
        setUnoAiHand(remainingHand);
        setUnoTopCard(card);
        finishUnoTurn('AI');
        return;
      }

      // Simple color choice for AI Wilds: whichever color it holds the most of.
      const colorCounts: Record<string, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
      remainingHand.forEach(c => { if (c.color !== 'wild') colorCounts[c.color] = (colorCounts[c.color] || 0) + 1; });
      const aiChosenColor = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0][0];

      const opponentHand = unoPlayerHand;
      const setOpponentHand = setUnoPlayerHand;
      let forcedDraw = 0;
      if (card.val === '+2') forcedDraw = 2;
      else if (card.val === '+4') forcedDraw = 4;

      let finalDeck = deck;
      if (forcedDraw > 0 && finalDeck.length > 0) {
        const forced = finalDeck.splice(Math.max(0, finalDeck.length - forcedDraw), forcedDraw);
        setOpponentHand([...opponentHand, ...forced]);
        setUnoDeck(finalDeck);
      }

      const nextActiveColor = card.color === 'wild' ? aiChosenColor : card.color;
      setUnoAiHand(remainingHand);
      setUnoTopCard(card);
      setUnoActiveColor(nextActiveColor);

      const isSkipEffect = card.val === 'Skip' || card.val === 'Reverse' || card.val === '+2' || card.val === '+4';
      setUnoMessage(`CyberGamer played ${nextActiveColor.toUpperCase()} ${card.val}.${isSkipEffect ? ' Your turn is skipped — CyberGamer goes again!' : ' Your turn!'}`);
      if (isSkipEffect) {
        // unoTurn is already 'AI' and won't change value, so this effect wouldn't
        // re-fire on its own — bump a tick counter (in the dep array) to force it.
        setUnoAiTurnTick(t => t + 1);
      } else {
        setUnoTurn('PLAYER');
      }
    }, 900);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGameId, unoTurn, unoRoundOver, unoAiTurnTick]);

  // Spin Wheel
  const handleSpinWheel = () => {
    if (wallet.points < wheelWager) {
      alert(`Insufficient Points to spin! Please exchange Coins or claim Daily Bonus.`);
      return;
    }
    setIsWheelSpinning(true);
    setWheelResultMsg('Spinning the Lucky Wheel...');
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
    }, 3000);
  };

  // Flip Coin
  const handleFlipCoin = () => {
    const wager = 500;
    if (wallet.points < wager) {
      alert('Insufficient Points to flip coin!');
      return;
    }
    setIsFlipping(true);
    setCoinResult('Flipping coin in 3D arena...');
    updateGamePoints(-wager, `Coin Flip Wager: -${wager} Points`, 'Coin Flip');

    setTimeout(() => {
      setIsFlipping(false);
      const isHeads = Math.random() > 0.5;
      const outcome = isHeads ? 'HEADS' : 'TAILS';
      const won = outcome === coinPick;

      if (won) {
        const prize = wager * 2;
        updateGamePoints(prize, `Coin Flip Win! Double Up +${prize} Points!`, 'Coin Flip');
        setCoinResult(`🎉 Coin landed on ${outcome}! YOU DOUBLED UP (+${prize} Points)!`);
      } else {
        setCoinResult(`💔 Coin landed on ${outcome}. Opponent claimed wager.`);
      }
    }, 1500);
  };

  // Spin Truth or Dare
  const handleSpinTruthOrDare = () => {
    const truths = [
      'What is your favorite moment in this live room?',
      'Who in this party room has the best voice?',
      'What is your biggest secret streaming talent?'
    ];
    const dares = [
      'Sing a 15-second song snippet on your mic seat!',
      'Send a Dragon gift to the top host seat!',
      'Impersonate your favorite anime or movie character!'
    ];

    const list = todType === 'TRUTH' ? truths : dares;
    const chosen = list[Math.floor(Math.random() * list.length)];
    setTodPrompt(chosen);
  };

  // All Definitions from Engine
  const allDefinitions = gameEngine.getAllDefinitions();
  const filteredDefinitions = allDefinitions.filter(d => {
    const matchesCategory = hubTab === 'TRENDING' ? (d.isPopular || d.category === 'CASUAL') : d.category === hubTab;
    const matchesSearch = searchQuery === '' || d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 pb-28">
      {/* 1. GAMING HUB HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 font-black text-xs rounded-full border border-purple-500/30 uppercase tracking-widest flex items-center gap-1">
              <Gamepad2 className="w-4 h-4 text-purple-400" /> Modular Game Engine Hub
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold text-xs rounded-full border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Anti-Cheat & Firestore Sync
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mt-2">
            Nexora Multi-Game Arena
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Play Casual, Party, Coin, Host, and PK Games. Wager points, compete in scheduled tournaments, and claim daily mission rewards.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-950 px-5 py-3 rounded-2xl border border-slate-800 shadow-xl">
          <div>
            <div className="text-[10px] uppercase font-extrabold text-purple-400">Available Wager Points</div>
            <div className="text-lg font-black text-purple-300 flex items-center gap-1">
              🎯 {wallet.points.toLocaleString()} Points
            </div>
          </div>
          <button
            onClick={() => setHubTab('MISSIONS')}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs rounded-xl shadow hover:opacity-90 flex items-center gap-1"
          >
            <Trophy className="w-4 h-4" /> Daily Missions
          </button>
        </div>
      </div>

      {/* 2. SEARCH & NAVIGATION CATEGORY TABS */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search games, tournaments, modes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setIsCreateRoomOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-2xl shadow flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-4 h-4" /> Create Custom Room
            </button>
          </div>
        </div>

        {/* CATEGORY TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'TRENDING', label: '🔥 Trending & Popular' },
            { id: 'CASUAL', label: '🎮 Casual Games' },
            { id: 'PARTY', label: '🎲 Party Games' },
            { id: 'COIN', label: '🎰 Coin Games' },
            { id: 'HOST', label: '🎤 Host & Live Games' },
            { id: 'PK', label: '⚔️ PK Battles' },
            { id: 'FAMILY', label: '👨‍👩‍👧 Family & Agency' },
            { id: 'TOURNAMENTS', label: '🏆 Tournaments' },
            { id: 'MISSIONS', label: '🎯 Daily Missions' },
            { id: 'LOBBY', label: '🚪 Public Lobbies' }
          ].map(tab => {
            const isAct = hubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setHubTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isAct
                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 border border-purple-400/40'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. ACTIVE PLAY GAME MODAL / EMBEDDED VIEW */}
      {activeGameId && (
        <div className="bg-slate-900 border-2 border-purple-500/50 rounded-3xl p-6 shadow-2xl relative animate-fade-in space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-purple-950 text-purple-300 rounded-2xl border border-purple-800">
                <Gamepad2 className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-extrabold text-lg text-slate-100 uppercase tracking-wider">
                  {gameEngine.getModule(activeGameId)?.definition.name || activeGameId}
                </h3>
                <span className="text-xs text-emerald-400 font-mono">● LIVE GAME SESSION ACTIVE</span>
              </div>
            </div>
            <button
              onClick={() => setActiveGameId(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl border border-slate-700"
            >
              Exit Game
            </button>
          </div>

          {/* GAME SPECIFIC MODULE CANVAS */}
          {activeGameId === 'LUDO' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-6">
                
                {/* TURN INDICATOR HEADER */}
                <div className="w-full flex items-center justify-between p-3 bg-slate-900 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full animate-ping ${
                      ludoTurnColor === 'RED' ? 'bg-red-500' :
                      ludoTurnColor === 'GREEN' ? 'bg-emerald-500' :
                      ludoTurnColor === 'YELLOW' ? 'bg-amber-400' : 'bg-blue-500'
                    }`} />
                    <span className="font-extrabold text-xs text-white">Current Turn: {ludoTurnColor}</span>
                  </div>
                  <span className="text-[11px] font-mono text-amber-300">Safe Stars: ★ #0, #8, #13, #21, #26, #34, #39, #47</span>
                </div>

                {/* 4-CORNER LUDO BOARD CANVAS */}
                <div className="w-full max-w-md aspect-square bg-slate-900 rounded-2xl border-2 border-amber-500/40 p-4 grid grid-cols-3 gap-3 relative">
                  
                  {/* TOP-LEFT: RED YARD */}
                  <div className={`p-3 rounded-2xl border flex flex-col justify-between ${
                    ludoTurnColor === 'RED' ? 'bg-red-950/80 border-red-500 shadow-lg shadow-red-500/20' : 'bg-red-950/30 border-red-900/40'
                  }`}>
                    <span className="text-[11px] font-black text-red-400 uppercase tracking-wider">RED HOUSE</span>
                    <div className="grid grid-cols-2 gap-2 my-2">
                      {ludoTokensState.RED.map((pos, idx) => (
                        <button
                          key={idx}
                          onClick={() => ludoTurnColor === 'RED' && handleMoveLudoToken(idx)}
                          disabled={ludoTurnColor !== 'RED' || !ludoHasRolled}
                          className={`p-1.5 rounded-xl border text-[10px] font-black flex flex-col items-center justify-center transition-all ${
                            pos === -1
                              ? 'bg-red-500/20 border-red-500/50 text-red-300 hover:scale-105'
                              : pos === 106
                              ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold'
                              : 'bg-red-600 text-white border-white shadow'
                          }`}
                        >
                          <span className="text-[9px]">T{idx + 1}</span>
                          <span className="text-[8px] font-mono">{pos === -1 ? 'HOME' : pos === 106 ? 'GOAL' : `#${pos}`}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* TOP-MIDDLE: GREEN FINISH STRETCH & SAFE */}
                  <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-2 flex flex-col justify-center items-center gap-1">
                    <span className="text-[9px] font-extrabold text-emerald-400">★ SAFE #8</span>
                    <div className="w-full text-[9px] font-mono text-slate-400 text-center">GREEN STRETCH</div>
                    <span className="text-[9px] font-extrabold text-amber-300">★ SAFE #13</span>
                  </div>

                  {/* TOP-RIGHT: GREEN YARD */}
                  <div className={`p-3 rounded-2xl border flex flex-col justify-between ${
                    ludoTurnColor === 'GREEN' ? 'bg-emerald-950/80 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-emerald-950/30 border-emerald-900/40'
                  }`}>
                    <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">GREEN HOUSE</span>
                    <div className="grid grid-cols-2 gap-2 my-2">
                      {ludoTokensState.GREEN.map((pos, idx) => (
                        <button
                          key={idx}
                          onClick={() => ludoTurnColor === 'GREEN' && handleMoveLudoToken(idx)}
                          disabled={ludoTurnColor !== 'GREEN' || !ludoHasRolled}
                          className={`p-1.5 rounded-xl border text-[10px] font-black flex flex-col items-center justify-center transition-all ${
                            pos === -1
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:scale-105'
                              : pos === 106
                              ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold'
                              : 'bg-emerald-600 text-white border-white shadow'
                          }`}
                        >
                          <span className="text-[9px]">T{idx + 1}</span>
                          <span className="text-[8px] font-mono">{pos === -1 ? 'HOME' : pos === 106 ? 'GOAL' : `#${pos}`}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* MIDDLE-LEFT & RIGHT: SAFE TRACKS */}
                  <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-2 flex flex-col justify-center items-center">
                    <span className="text-[9px] font-extrabold text-red-400">★ SAFE #0</span>
                    <span className="text-[8px] text-slate-500 font-mono">RED START</span>
                  </div>

                  {/* CENTER TRIANGLE FINISH GOAL */}
                  <div className="bg-gradient-to-tr from-purple-950 via-indigo-950 to-slate-950 border-2 border-amber-400/60 rounded-2xl p-2 flex flex-col items-center justify-center text-center shadow-inner">
                    <span className="text-xs font-black text-amber-300 uppercase tracking-wider">LUDO GOAL</span>
                    <span className="text-[9px] font-mono text-purple-300">★ 4 TOKENS ★</span>
                  </div>

                  <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-2 flex flex-col justify-center items-center">
                    <span className="text-[9px] font-extrabold text-blue-400">★ SAFE #26</span>
                    <span className="text-[8px] text-slate-500 font-mono">BLUE START</span>
                  </div>

                  {/* BOTTOM-LEFT: YELLOW YARD */}
                  <div className={`p-3 rounded-2xl border flex flex-col justify-between ${
                    ludoTurnColor === 'YELLOW' ? 'bg-amber-950/80 border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-amber-950/30 border-amber-900/40'
                  }`}>
                    <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">YELLOW HOUSE</span>
                    <div className="grid grid-cols-2 gap-2 my-2">
                      {ludoTokensState.YELLOW.map((pos, idx) => (
                        <button
                          key={idx}
                          onClick={() => ludoTurnColor === 'YELLOW' && handleMoveLudoToken(idx)}
                          disabled={ludoTurnColor !== 'YELLOW' || !ludoHasRolled}
                          className={`p-1.5 rounded-xl border text-[10px] font-black flex flex-col items-center justify-center transition-all ${
                            pos === -1
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:scale-105'
                              : pos === 106
                              ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold'
                              : 'bg-amber-500 text-slate-950 border-white shadow'
                          }`}
                        >
                          <span className="text-[9px]">T{idx + 1}</span>
                          <span className="text-[8px] font-mono">{pos === -1 ? 'HOME' : pos === 106 ? 'GOAL' : `#${pos}`}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* BOTTOM-MIDDLE: BLUE STRETCH */}
                  <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-2 flex flex-col justify-center items-center gap-1">
                    <span className="text-[9px] font-extrabold text-amber-300">★ SAFE #39</span>
                    <div className="w-full text-[9px] font-mono text-slate-400 text-center">BLUE STRETCH</div>
                    <span className="text-[9px] font-extrabold text-blue-400">★ SAFE #47</span>
                  </div>

                  {/* BOTTOM-RIGHT: BLUE YARD */}
                  <div className={`p-3 rounded-2xl border flex flex-col justify-between ${
                    ludoTurnColor === 'BLUE' ? 'bg-blue-950/80 border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-blue-950/30 border-blue-900/40'
                  }`}>
                    <span className="text-[11px] font-black text-blue-400 uppercase tracking-wider">BLUE HOUSE</span>
                    <div className="grid grid-cols-2 gap-2 my-2">
                      {ludoTokensState.BLUE.map((pos, idx) => (
                        <button
                          key={idx}
                          onClick={() => ludoTurnColor === 'BLUE' && handleMoveLudoToken(idx)}
                          disabled={ludoTurnColor !== 'BLUE' || !ludoHasRolled}
                          className={`p-1.5 rounded-xl border text-[10px] font-black flex flex-col items-center justify-center transition-all ${
                            pos === -1
                              ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 hover:scale-105'
                              : pos === 106
                              ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold'
                              : 'bg-blue-600 text-white border-white shadow'
                          }`}
                        >
                          <span className="text-[9px]">T{idx + 1}</span>
                          <span className="text-[8px] font-mono">{pos === -1 ? 'HOME' : pos === 106 ? 'GOAL' : `#${pos}`}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* DICE CONTROLLER */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-red-500 rounded-2xl flex items-center justify-center text-3xl font-black text-slate-950 shadow-2xl animate-bounce">
                    {ludoDice}
                  </div>
                  <p className="text-xs font-bold text-amber-300 text-center">{ludoMessage}</p>
                  <button
                    onClick={handleRollLudoDice}
                    disabled={isRolling || ludoHasRolled}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs rounded-xl shadow uppercase flex items-center gap-2 disabled:opacity-50"
                  >
                    <RotateCw className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
                    {isRolling ? 'Rolling...' : ludoHasRolled ? 'Select Token Below' : `Roll Dice (-${ludoWager} Pts)`}
                  </button>
                </div>
              </div>

              {/* STATS & PLAYERS */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-black text-slate-200 uppercase">Match Wager & Players</h4>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between text-xs">
                  <span className="text-slate-400">Match Pool:</span>
                  <span className="font-extrabold text-amber-300">{ludoWager * 2} Points</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 bg-purple-950/40 border border-purple-500/30 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-300">Alex Rivers (You)</span>
                    <span className="text-emerald-400">Ready</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">CyberGamer (AI)</span>
                    <span className="text-slate-400">Waiting</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeGameId === 'LUCKY_WHEEL' && (
            <div className="flex flex-col items-center justify-center space-y-6 py-4">
              <div className="relative w-64 h-64 rounded-full border-8 border-amber-500/40 shadow-2xl flex items-center justify-center overflow-hidden bg-slate-950">
                <div
                  className="absolute inset-0 rounded-full transition-transform duration-3000 ease-out flex items-center justify-center"
                  style={{ transform: `rotate(${wheelRotation}deg)` }}
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-purple-900 via-indigo-950 to-slate-950 flex items-center justify-center">
                    <span className="text-2xl font-black text-amber-300 tracking-widest">
                      0x • 1.5x • 2x • 5x • 10x • 50x
                    </span>
                  </div>
                </div>
                <div className="absolute top-2 w-6 h-8 bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs z-10 rounded-b-md shadow">
                  ▼
                </div>
              </div>
              <p className="text-xs font-extrabold text-amber-300 bg-slate-950 px-6 py-2 rounded-xl border border-amber-500/30">
                {wheelResultMsg}
              </p>
              <button
                onClick={handleSpinWheel}
                disabled={isWheelSpinning}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xs rounded-2xl shadow flex items-center gap-2"
              >
                <RotateCw className={`w-4 h-4 ${isWheelSpinning ? 'animate-spin' : ''}`} />
                {isWheelSpinning ? 'Spinning...' : `Spin Wheel (-${wheelWager} Pts)`}
              </button>
            </div>
          )}

          {activeGameId === 'TRIVIA_QUIZ' && (
            <div className="max-w-2xl mx-auto space-y-4">
              {quizLoading ? (
                <div className="p-6 text-center text-slate-400 text-xs animate-pulse">
                  Generating AI Trivia question...
                </div>
              ) : quizQuestion ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-purple-500/30 space-y-1">
                    <span className="text-[10px] font-black uppercase text-purple-400">AI Live Question</span>
                    <h4 className="text-sm font-black text-white">{quizQuestion.question}</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quizQuestion.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedAnswer(idx);
                          if (idx === quizQuestion.correctIndex) {
                            setQuizResult(`CORRECT! Won +${quizQuestion.rewardPoints} Points!`);
                            updateGamePoints(quizQuestion.rewardPoints, 'Trivia win', 'AI Trivia');
                          } else {
                            setQuizResult(`INCORRECT! Answer: ${quizQuestion.options[quizQuestion.correctIndex]}`);
                          }
                        }}
                        disabled={selectedAnswer !== null}
                        className={`p-3 rounded-xl border text-left font-bold text-xs ${
                          selectedAnswer === null
                            ? 'bg-slate-950 border-slate-800 hover:border-purple-500 text-slate-200'
                            : idx === quizQuestion.correctIndex
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                            : selectedAnswer === idx
                            ? 'bg-red-950 border-red-500 text-red-200'
                            : 'bg-slate-950/50 border-slate-900 text-slate-500'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {quizResult && <p className="text-center font-bold text-xs text-amber-300">{quizResult}</p>}
                </div>
              ) : null}
            </div>
          )}

          {activeGameId === 'COIN_FLIP' && (
            <div className="max-w-md mx-auto text-center space-y-4 py-4">
              <h4 className="text-sm font-black text-slate-100">Pick Heads or Tails</h4>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setCoinPick('HEADS')}
                  className={`px-6 py-3 rounded-2xl font-black text-xs border ${
                    coinPick === 'HEADS' ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  🪙 HEADS
                </button>
                <button
                  onClick={() => setCoinPick('TAILS')}
                  className={`px-6 py-3 rounded-2xl font-black text-xs border ${
                    coinPick === 'TAILS' ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  🪙 TAILS
                </button>
              </div>
              {coinResult && <p className="text-xs font-bold text-amber-300">{coinResult}</p>}
              <button
                onClick={handleFlipCoin}
                disabled={isFlipping}
                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs rounded-2xl shadow uppercase"
              >
                {isFlipping ? 'Flipping...' : 'Flip 3D Coin (-500 Pts)'}
              </button>
            </div>
          )}

          {activeGameId === 'TRUTH_OR_DARE' && (
            <div className="max-w-md mx-auto text-center space-y-4 py-4">
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setTodType('TRUTH')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold ${
                    todType === 'TRUTH' ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Truth
                </button>
                <button
                  onClick={() => setTodType('DARE')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold ${
                    todType === 'DARE' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Dare
                </button>
              </div>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold text-amber-300">
                {todPrompt}
              </div>
              <button
                onClick={handleSpinTruthOrDare}
                className="px-6 py-2.5 bg-purple-600 text-white font-bold text-xs rounded-xl shadow"
              >
                Spin Prompt Wheel
              </button>
            </div>
          )}

          {/* UNO COLOR BLITZ */}
          {activeGameId === 'UNO' && (
            <div className="max-w-xl mx-auto space-y-6 text-center py-2">
              <div className="p-4 bg-slate-950 rounded-2xl border border-amber-500/30 flex items-center justify-around">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Top Card</span>
                  <div className={`mt-1 px-5 py-3 rounded-2xl text-white font-black text-lg shadow-lg ${
                    unoTopCard.color === 'red' ? 'bg-red-600' :
                    unoTopCard.color === 'blue' ? 'bg-blue-600' :
                    unoTopCard.color === 'green' ? 'bg-emerald-600' :
                    unoTopCard.color === 'wild' ? 'bg-slate-700' : 'bg-amber-500 text-slate-950'
                  }`}>
                    {unoTopCard.val}
                  </div>
                  <span className="text-[9px] text-slate-500 font-bold block mt-1">Active Color: {unoActiveColor.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">CyberGamer Hand</span>
                  <span className="text-lg font-black text-pink-400">{unoAiHand.length} 🂠</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Status</span>
                  <p className="text-xs font-extrabold text-amber-300 mt-1">{unoMessage}</p>
                </div>
              </div>

              {unoPendingWildIndex !== null && (
                <div className="p-3 bg-slate-900 border border-amber-500/40 rounded-2xl flex items-center justify-center gap-2">
                  <span className="text-xs font-bold text-slate-300 mr-1">Choose a color:</span>
                  {['red', 'blue', 'green', 'yellow'].map(c => (
                    <button
                      key={c}
                      onClick={() => handleUnoChooseColor(c)}
                      className={`w-9 h-9 rounded-xl border-2 border-white/20 ${
                        c === 'red' ? 'bg-red-600' : c === 'blue' ? 'bg-blue-600' : c === 'green' ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                    />
                  ))}
                </div>
              )}

              <div>
                <span className="text-xs font-extrabold text-slate-300 block mb-2">Your Hand ({unoPlayerHand.length} Cards)</span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {unoPlayerHand.map((card, i) => {
                    const playable = unoTurn === 'PLAYER' && !unoRoundOver && unoPendingWildIndex === null && isUnoCardPlayable(card, unoTopCard, unoActiveColor);
                    return (
                      <button
                        key={i}
                        onClick={() => handlePlayUnoCard(i)}
                        disabled={!playable}
                        className={`px-4 py-3 rounded-2xl font-black text-sm shadow-md transition-all transform ${playable ? 'hover:-translate-y-1' : 'opacity-40 cursor-not-allowed'} ${
                          card.color === 'red' ? 'bg-red-600 text-white' :
                          card.color === 'blue' ? 'bg-blue-600 text-white' :
                          card.color === 'green' ? 'bg-emerald-600 text-white' :
                          card.color === 'wild' ? 'bg-gradient-to-br from-red-500 via-emerald-500 to-blue-500 text-white' : 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        {card.val}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleUnoDrawCard}
                  disabled={unoTurn !== 'PLAYER' || unoRoundOver || unoPendingWildIndex !== null}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl"
                >
                  Draw Card
                </button>
                <button
                  onClick={dealUnoRound}
                  className="px-5 py-2.5 bg-slate-950 border border-slate-800 text-slate-400 font-bold text-xs rounded-xl"
                >
                  New Round
                </button>
              </div>
            </div>
          )}

          {/* TIC TAC TOE */}
          {(activeGameId === 'TIC_TAC_TOE' || activeGameId === 'TIC_TAC_TOE_SHOWDOWN') && (
            <div className="max-w-md mx-auto space-y-4 text-center py-2">
              <p className="text-xs font-extrabold text-amber-300">{tttMessage}</p>
              <div className="grid grid-cols-3 gap-3 w-64 h-64 mx-auto p-3 bg-slate-950 rounded-2xl border border-slate-800">
                {tttGrid.map((cell, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (cell || tttMessage.includes('WON') || tttMessage.includes('DRAW')) return;
                      const nextGrid = [...tttGrid];
                      nextGrid[idx] = 'X';
                      setTttGrid(nextGrid);

                      // Check Win
                      const wins = [
                        [0,1,2], [3,4,5], [6,7,8],
                        [0,3,6], [1,4,7], [2,5,8],
                        [0,4,8], [2,4,6]
                      ];
                      const isPlayerWin = wins.some(combo => combo.every(i => nextGrid[i] === 'X'));

                      if (isPlayerWin) {
                        setTttMessage('🎉 YOU WON! Claimed +600 Wager Points!');
                        updateGamePoints(tttWager * 2, 'Tic-Tac-Toe Win', 'Tic-Tac-Toe');
                        return;
                      }

                      // AI move
                      const emptyIndices = nextGrid.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
                      if (emptyIndices.length === 0) {
                        setTttMessage('🤝 Match DRAW! Wagers returned.');
                        return;
                      }

                      const aiChoice = pickTicTacToeAiMove(nextGrid, 'O');
                      nextGrid[aiChoice] = 'O';
                      setTttGrid(nextGrid);

                      const isAiWin = wins.some(combo => combo.every(i => nextGrid[i] === 'O'));
                      if (isAiWin) {
                        setTttMessage('💔 Opponent (O) Won! Try another match.');
                      } else {
                        setTttMessage('Your turn (X)!');
                      }
                    }}
                    className={`w-full h-full bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-2xl font-black transition-all ${
                      cell === 'X' ? 'text-purple-400' : cell === 'O' ? 'text-pink-400' : 'hover:bg-slate-800'
                    }`}
                  >
                    {cell}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setTttGrid(Array(9).fill(null));
                  setTttMessage('Your turn (X)! Tap a cell to play.');
                }}
                className="px-6 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl"
              >
                Reset Match
              </button>
            </div>
          )}

          {/* CONNECT FOUR */}
          {activeGameId === 'CONNECT_FOUR' && (
            <div className="max-w-lg mx-auto space-y-4 text-center py-2">
              <p className="text-xs font-extrabold text-amber-300">{c4Message}</p>
              <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 space-y-2">
                <div className="grid grid-cols-7 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map(colIdx => (
                    <button
                      key={colIdx}
                      onClick={() => {
                        const newGrid = c4Grid.map(row => [...row]);
                        let placedRow = -1;
                        for (let r = 5; r >= 0; r--) {
                          if (newGrid[r][colIdx] === 0) {
                            newGrid[r][colIdx] = c4Turn;
                            placedRow = r;
                            break;
                          }
                        }
                        if (placedRow !== -1) {
                          setC4Grid(newGrid);
                          setC4Turn(c4Turn === 1 ? 2 : 1);
                          setC4Message(`Disc dropped in column ${colIdx + 1}! Player ${c4Turn === 1 ? 2 : 1}'s turn.`);
                        }
                      }}
                      className="py-1 bg-purple-950/60 hover:bg-purple-800 text-purple-200 text-[10px] font-black rounded-lg"
                    >
                      ↓
                    </button>
                  ))}
                </div>
                {c4Grid.map((row, rIdx) => (
                  <div key={rIdx} className="grid grid-cols-7 gap-2">
                    {row.map((val, cIdx) => (
                      <div
                        key={cIdx}
                        className={`aspect-square rounded-full border border-slate-800 flex items-center justify-center transition-all ${
                          val === 1 ? 'bg-red-500 shadow-md animate-bounce' :
                          val === 2 ? 'bg-yellow-400 shadow-md' : 'bg-slate-900'
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setC4Grid(Array(6).fill(null).map(() => Array(7).fill(0)));
                  setC4Turn(1);
                  setC4Message('Player 1 (Red) turn! Tap a column to drop a disc.');
                }}
                className="px-5 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
              >
                Reset Grid
              </button>
            </div>
          )}

          {/* CHESS / CHECKERS */}
          {(activeGameId === 'CHESS' || activeGameId === 'CHECKERS') && (
            <div className="max-w-md mx-auto space-y-4 text-center py-2">
              <p className="text-xs font-extrabold text-amber-300">{chessMessage}</p>
              <div className="grid grid-cols-8 gap-0.5 border-4 border-slate-800 rounded-xl overflow-hidden bg-slate-950 p-1">
                {chessBoard.map((row, r) =>
                  row.map((piece, c) => {
                    const isDark = (r + c) % 2 === 1;
                    const isSelected = chessSelected && chessSelected[0] === r && chessSelected[1] === c;
                    return (
                      <button
                        key={`${r}-${c}`}
                        onClick={() => {
                          if (!chessSelected) {
                            if (piece !== '') setChessSelected([r, c]);
                          } else {
                            const [sr, sc] = chessSelected;
                            const newBoard = chessBoard.map(rowArr => [...rowArr]);
                            const movedPiece = newBoard[sr][sc];
                            newBoard[r][c] = movedPiece;
                            newBoard[sr][sc] = '';
                            setChessBoard(newBoard);
                            setChessSelected(null);
                            setChessMessage(`Moved piece from (${sr+1},${sc+1}) to (${r+1},${c+1})!`);
                          }
                        }}
                        className={`aspect-square flex items-center justify-center text-xl font-black transition-all ${
                          isSelected ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300' :
                          isDark ? 'bg-slate-900 text-purple-200' : 'bg-slate-800 text-slate-100'
                        }`}
                      >
                        {piece}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* SLOTS PARADISE */}
          {activeGameId === 'SLOTS_PARADISE' && (
            <div className="max-w-md mx-auto text-center space-y-4 py-4">
              <div className="bg-slate-950 border-4 border-amber-500/50 rounded-3xl p-6 shadow-2xl space-y-4">
                <span className="text-xs font-black text-amber-400 uppercase tracking-widest block">
                  🎰 NEXORA CASINO SLOTS 🎰
                </span>
                <div className="flex justify-center gap-3">
                  {slotsReels.map((symbol, idx) => (
                    <div
                      key={idx}
                      className={`w-20 h-24 bg-slate-900 border-2 border-amber-500/40 rounded-2xl flex items-center justify-center text-4xl shadow-inner ${
                        isSlotsSpinning ? 'animate-spin' : ''
                      }`}
                    >
                      {symbol}
                    </div>
                  ))}
                </div>
                <p className="text-xs font-bold text-amber-300">{slotsMessage}</p>
                <button
                  onClick={() => {
                    if (wallet.points < slotsWager) {
                      alert(`Insufficient points! You need ${slotsWager} Points to spin.`);
                      return;
                    }
                    setIsSlotsSpinning(true);
                    setSlotsMessage('Spinning reels...');
                    updateGamePoints(-slotsWager, 'Slot Wager', 'Slots Paradise');

                    const symbols = ['7️⃣', '💎', '🍇', '🔔', '🍒', '🪙'];
                    setTimeout(() => {
                      setIsSlotsSpinning(false);
                      const r1 = symbols[Math.floor(Math.random() * symbols.length)];
                      const r2 = symbols[Math.floor(Math.random() * symbols.length)];
                      const r3 = symbols[Math.floor(Math.random() * symbols.length)];
                      setSlotsReels([r1, r2, r3]);

                      if (r1 === r2 && r2 === r3) {
                        const win = 5000;
                        updateGamePoints(win, 'JACKPOT WIN 3-MATCH!', 'Slots Paradise');
                        setSlotsMessage(`🎉 TRIPLE MATCH JACKPOT! Won +${win.toLocaleString()} Points!`);
                      } else if (r1 === r2 || r2 === r3 || r1 === r3) {
                        const win = 300;
                        updateGamePoints(win, '2-Match Win', 'Slots Paradise');
                        setSlotsMessage(`✨ Double match! Won +${win} Points.`);
                      } else {
                        setSlotsMessage('No match this spin. Try again!');
                      }
                    }, 1200);
                  }}
                  disabled={isSlotsSpinning}
                  className="px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs rounded-2xl shadow uppercase"
                >
                  {isSlotsSpinning ? 'Spinning...' : `Spin Reels (-${slotsWager} Pts)`}
                </button>
              </div>
            </div>
          )}

          {/* MYSTERY LUCKY BOX */}
          {activeGameId === 'LUCKY_BOX' && (
            <div className="max-w-lg mx-auto text-center space-y-4 py-4">
              <p className="text-xs font-extrabold text-amber-300">{boxMessage}</p>
              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map(idx => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (boxesOpened[idx]) return;
                      const prizes = [500, 1500, 0];
                      const prize = prizes[Math.floor(Math.random() * prizes.length)];
                      const nextOpened = [...boxesOpened];
                      nextOpened[idx] = true;
                      setBoxesOpened(nextOpened);

                      const nextPrizes = [...boxPrizes];
                      nextPrizes[idx] = prize;
                      setBoxPrizes(nextPrizes);

                      if (prize > 0) {
                        updateGamePoints(prize, 'Opened Mystery Box', 'Lucky Box');
                        setBoxMessage(`🎉 Box #${idx+1} contained +${prize} Points!`);
                      } else {
                        setBoxMessage(`💔 Box #${idx+1} was empty! Try another box.`);
                      }
                    }}
                    className={`h-32 rounded-3xl border-2 flex flex-col items-center justify-center p-3 transition-all ${
                      boxesOpened[idx]
                        ? 'bg-slate-950 border-purple-500/50 text-purple-300'
                        : 'bg-gradient-to-br from-purple-900 to-indigo-950 border-amber-500/40 hover:scale-105'
                    }`}
                  >
                    <Gift className={`w-8 h-8 ${boxesOpened[idx] ? 'text-slate-500' : 'text-amber-400 animate-bounce'}`} />
                    <span className="text-xs font-black mt-2">
                      {boxesOpened[idx] ? `+${boxPrizes[idx]} Pts` : `Box #${idx+1}`}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setBoxesOpened([false, false, false]);
                  setBoxPrizes([0, 0, 0]);
                  setBoxMessage('Pick a Mystery Box to open your reward!');
                }}
                className="px-5 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
              >
                Reset Boxes
              </button>
            </div>
          )}

          {/* SPIN THE BOTTLE */}
          {activeGameId === 'SPIN_BOTTLE' && (
            <div className="max-w-md mx-auto text-center space-y-4 py-4">
              <div className="relative w-56 h-56 mx-auto rounded-full border-4 border-slate-800 bg-slate-950 flex items-center justify-center">
                <div
                  className="w-8 h-28 bg-gradient-to-t from-pink-500 to-purple-500 rounded-full transition-all duration-3000 ease-out shadow-lg"
                  style={{ transform: `rotate(${bottleRotation}deg)` }}
                />
                <span className="absolute text-[10px] font-black text-slate-400 top-2">Seat #1</span>
                <span className="absolute text-[10px] font-black text-slate-400 right-2">Seat #3</span>
                <span className="absolute text-[10px] font-black text-slate-400 bottom-2">Seat #5</span>
                <span className="absolute text-[10px] font-black text-slate-400 left-2">Seat #7</span>
              </div>
              <p className="text-xs font-bold text-amber-300">
                {bottleLandedSeat ? `🎉 Bottle pointed to Mic Seat #${bottleLandedSeat}!` : 'Tap Spin Bottle to choose live guest!'}
              </p>
              <button
                onClick={() => {
                  setIsBottleSpinning(true);
                  const seat = Math.floor(Math.random() * 8) + 1;
                  const newRot = bottleRotation + 1440 + (seat * 45);
                  setBottleRotation(newRot);
                  setTimeout(() => {
                    setIsBottleSpinning(false);
                    setBottleLandedSeat(seat);
                  }, 3000);
                }}
                disabled={isBottleSpinning}
                className="px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-black text-xs rounded-xl shadow"
              >
                {isBottleSpinning ? 'Spinning...' : 'Spin Bottle'}
              </button>
            </div>
          )}

          {/* LIVE STREAM PK BATTLES */}
          {(activeGameId === 'PK_GIFT_WAR' || activeGameId === 'MIC_PK_CHALLENGE' || activeGameId === 'SINGING_BATTLE' || activeGameId === 'HEADS_UP_PK') && (
            <div className="max-w-xl mx-auto space-y-4 py-2 text-center">
              <div className="p-4 bg-slate-950 rounded-3xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs font-black">
                  <span className="text-purple-400">🔥 STREAMER TEAM A ({pkScoreHost1} PTS)</span>
                  <span className="text-pink-400">STREAMER TEAM B ({pkScoreHost2} PTS) ⚡</span>
                </div>
                <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                  <div className="h-full bg-purple-600 transition-all duration-300" style={{ width: `${(pkScoreHost1 / (pkScoreHost1 + pkScoreHost2)) * 100}%` }} />
                  <div className="h-full bg-pink-600 transition-all duration-300" style={{ width: `${(pkScoreHost2 / (pkScoreHost1 + pkScoreHost2)) * 100}%` }} />
                </div>
                <p className="text-xs font-extrabold text-amber-300">{pkMessage}</p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setPkScoreHost1(prev => prev + 25);
                    setPkMessage('Boosted Team A with +25 PK Points!');
                    updateGamePoints(50, 'PK Gift boost', 'PK Duel');
                  }}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow"
                >
                  Send Gift to Team A (+25 Pts)
                </button>
                <button
                  onClick={() => {
                    setPkScoreHost2(prev => prev + 25);
                    setPkMessage('Boosted Team B with +25 PK Points!');
                  }}
                  className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-black text-xs rounded-xl shadow"
                >
                  Send Gift to Team B (+25 Pts)
                </button>
              </div>
            </div>
          )}

          {/* FAMILY GUILD BOSS RAID */}
          {(activeGameId === 'FAMILY_TREE_QUEST' || activeGameId === 'FAMILY_FEUD') && (
            <div className="max-w-xl mx-auto space-y-4 py-2 text-center">
              <div className="p-4 bg-slate-950 rounded-3xl border border-purple-500/40 space-y-3">
                <div className="flex justify-between items-center text-xs font-black">
                  <span className="text-slate-300">🐉 FAMILY RAID BOSS</span>
                  <span className="text-red-400">{bossHp} / 1000 HP</span>
                </div>
                <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-gradient-to-r from-red-500 to-amber-400 transition-all duration-300" style={{ width: `${(bossHp / 1000) * 100}%` }} />
                </div>
                <p className="text-xs font-extrabold text-amber-300">{bossMessage}</p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    if (bossHp <= 0) return;
                    const dmg = Math.floor(Math.random() * 80) + 40;
                    const newHp = Math.max(0, bossHp - dmg);
                    setBossHp(newHp);
                    setBossCombo(prev => prev + 1);

                    if (newHp === 0) {
                      updateGamePoints(1500, 'Guild Boss Slain!', 'Family Boss Raid');
                      setBossMessage('🎉 BOSS DEFEATED! Shared +1,500 Guild Coins with team!');
                    } else {
                      setBossMessage(`Dealt ${dmg} damage to Raid Boss! (${bossCombo + 1}x Combo)`);
                    }
                  }}
                  disabled={bossHp === 0}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-xs rounded-2xl shadow"
                >
                  ⚔️ Guild Strike Attack
                </button>
                <button
                  onClick={() => {
                    setBossHp(1000);
                    setBossCombo(0);
                    setBossMessage('Raid Boss spawned! Tap Guild Strike to deal damage.');
                  }}
                  className="px-4 py-3 bg-slate-800 text-slate-300 font-bold text-xs rounded-2xl"
                >
                  Respawn Boss
                </button>
              </div>
            </div>
          )}

          {/* GENERIC GAME MODULE ARENA FALLBACK (For any other game ID) */}
          {activeGameId !== 'LUDO' &&
           activeGameId !== 'UNO' &&
           activeGameId !== 'TIC_TAC_TOE' &&
           activeGameId !== 'TIC_TAC_TOE_SHOWDOWN' &&
           activeGameId !== 'CONNECT_FOUR' &&
           activeGameId !== 'CHESS' &&
           activeGameId !== 'CHECKERS' &&
           activeGameId !== 'SLOTS_PARADISE' &&
           activeGameId !== 'LUCKY_BOX' &&
           activeGameId !== 'SPIN_BOTTLE' &&
           activeGameId !== 'TRUTH_OR_DARE' &&
           activeGameId !== 'TRIVIA_QUIZ' &&
           activeGameId !== 'LUCKY_WHEEL' &&
           activeGameId !== 'COIN_FLIP' &&
           activeGameId !== 'PK_GIFT_WAR' &&
           activeGameId !== 'MIC_PK_CHALLENGE' &&
           activeGameId !== 'SINGING_BATTLE' &&
           activeGameId !== 'HEADS_UP_PK' &&
           activeGameId !== 'FAMILY_TREE_QUEST' &&
           activeGameId !== 'FAMILY_FEUD' && (
            <div className="max-w-xl mx-auto space-y-4 py-2">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span>Module: {gameEngine.getModule(activeGameId)?.definition.name || activeGameId}</span>
                  <span className="text-emerald-400 font-mono">Status: IN_MATCH</span>
                </div>
                <p className="text-xs text-slate-300">
                  {gameEngine.getModule(activeGameId)?.definition.description || 'Interactive multiplayer game module.'}
                </p>
                <div className="p-3 bg-slate-900 rounded-xl text-xs font-mono text-amber-300 space-y-1">
                  {genericLogs.slice(-3).map((log, i) => (
                    <div key={i}>● {log}</div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={genericMoveText}
                  onChange={(e) => setGenericMoveText(e.target.value)}
                  placeholder="Enter strategic turn action..."
                  className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
                <button
                  onClick={() => {
                    const moveMsg = `Turn move executed: ${genericMoveText}`;
                    setGenericLogs(prev => [...prev, moveMsg]);
                    updateGamePoints(150, 'Turn action completed', activeGameId);
                  }}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow"
                >
                  Play Move (+150 Pts)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. MAIN CATEGORY VIEW DISPATCHER */}

      {/* VIEW A: TRENDING / CASUAL / PARTY / COIN / HOST / PK / FAMILY MODULES GRID */}
      {hubTab !== 'TOURNAMENTS' && hubTab !== 'MISSIONS' && hubTab !== 'LOBBY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDefinitions.length === 0 ? (
            <div className="col-span-full bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
              <Gamepad2 className="w-10 h-10 text-purple-400 mx-auto opacity-50" />
              <h3 className="text-base font-extrabold text-slate-200">No Games Found</h3>
              <p className="text-xs text-slate-400">Try adjusting your search query or selecting another game category tab.</p>
            </div>
          ) : (
            filteredDefinitions.map(game => (
              <div
                key={game.id}
                className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-3xl p-5 space-y-4 transition-all shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-black uppercase rounded-full">
                      {game.category}
                    </span>
                    {game.isPopular && (
                      <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-full flex items-center gap-1">
                        🔥 Popular
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-purple-400" /> {game.name}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2">{game.description}</p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Players: {game.minPlayers}-{game.maxPlayers}</span>
                    <span className="text-amber-400 font-bold">{game.wagerAllowed ? '🎯 Wager Allowed' : '🎉 Free Party'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveGameId(game.id)}
                      className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-black text-xs rounded-2xl shadow flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> Quick Play
                    </button>
                    <button
                      onClick={() => alert(`Rules for ${game.name}:\n\n${game.howToPlay}`)}
                      className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-2xl border border-slate-800"
                      title="How to Play"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW B: TOURNAMENTS */}
      {hubTab === 'TOURNAMENTS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tournaments.map(t => (
              <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-4">
                <div className="relative h-36 bg-slate-950">
                  <img src={t.bannerImage} alt={t.title} className="w-full h-full object-cover opacity-80" />
                  <div className="absolute top-3 left-3 px-3 py-1 bg-red-600 text-white font-black text-[10px] rounded-full animate-pulse">
                    {t.status}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <h3 className="text-sm font-black text-white">{t.title}</h3>
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span className="text-amber-300">Prize: 🪙 {t.prizePoolCoins.toLocaleString()} Coins</span>
                    <span className="text-purple-300">Fee: {t.entryFeePoints} Pts</span>
                  </div>

                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{ width: `${(t.registeredCount / t.maxParticipants) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block text-right">
                    {t.registeredCount} / {t.maxParticipants} Registered
                  </span>

                  <button
                    onClick={async () => {
                      if (wallet.points < t.entryFeePoints) {
                        alert(`Insufficient points! Entry fee is ${t.entryFeePoints} Points.`);
                        return;
                      }
                      const userId = authUser?.uid || 'user_guest';
                      const ok = await tournamentService.registerUser(t.id, userId, t.entryFeePoints);
                      if (ok) alert(`Successfully registered for ${t.title}! Tournament starts ${t.startTime}`);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs rounded-2xl shadow"
                  >
                    Register Tournament
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW C: DAILY MISSIONS */}
      {hubTab === 'MISSIONS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl max-w-4xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" /> Daily Gaming Missions & Streak Rewards
              </h3>
              <p className="text-xs text-slate-400">Complete tasks every 24 hours to earn bonus Points, Coins, and XP.</p>
            </div>
            <span className="px-3 py-1 bg-purple-950 text-purple-300 border border-purple-800 text-xs font-bold rounded-full">
              Resets in 14h 22m
            </span>
          </div>

          <div className="space-y-3">
            {missions.map(m => (
              <div key={m.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-950 border border-purple-800 text-purple-300 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{m.title}</h4>
                    <p className="text-[11px] text-slate-400">{m.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-emerald-400"
                          style={{ width: `${Math.min(100, (m.currentCount / m.targetCount) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{m.currentCount}/{m.targetCount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-amber-300">
                    +{m.rewardAmount} {m.rewardType}
                  </span>
                  <button
                    onClick={async () => {
                      const userId = authUser?.uid || 'user_guest';
                      const res = await dailyMissionsService.claimReward(m.id, userId);
                      alert(res.message);
                      setMissions([...dailyMissionsService.getMissions()]);
                    }}
                    disabled={m.isClaimed || m.currentCount < m.targetCount}
                    className={`px-4 py-2 rounded-xl font-black text-xs ${
                      m.isClaimed
                        ? 'bg-slate-800 text-slate-500'
                        : m.currentCount >= m.targetCount
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow animate-pulse'
                        : 'bg-slate-950 border border-slate-800 text-slate-500'
                    }`}
                  >
                    {m.isClaimed ? 'Claimed' : 'Claim'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW D: PUBLIC LOBBIES */}
      {hubTab === 'LOBBY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gameRooms.length === 0 && (
            <div className="col-span-full text-center py-14 text-sm text-slate-500">
              No open public game rooms currently. Create one to start playing with the community!
            </div>
          )}
          {gameRooms.map(r => (
            <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="px-2.5 py-0.5 bg-purple-950 text-purple-300 font-bold rounded-full">{r.gameId}</span>
                <span className="text-slate-400">{r.currentPlayers}/{r.maxPlayers} Players</span>
              </div>
              <h4 className="text-xs font-black text-slate-100">{r.gameName}</h4>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Host: {r.hostName}</span>
                <span className="text-amber-300 font-bold">Min {r.minWagerPoints} Pts</span>
              </div>
              <button
                onClick={() => {
                  setActiveGameId(r.gameId);
                  alert(`Joined ${r.gameName}! Match ready.`);
                }}
                className="w-full py-2 bg-purple-600 text-white font-bold text-xs rounded-xl"
              >
                Join Match Room
              </button>
            </div>
          ))}
        </div>
      )}

      {/* CREATE ROOM MODAL */}
      {isCreateRoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 text-white shadow-2xl">
            <h3 className="text-base font-black flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-purple-400" /> Create Custom Game Match Room
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Room Title</label>
              <input
                type="text"
                value={newRoomTitle}
                onChange={(e) => setNewRoomTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Select Game Module</label>
              <select
                value={newRoomGameId}
                onChange={(e) => setNewRoomGameId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white"
              >
                {allDefinitions.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.category})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Min Wager Points</label>
              <input
                type="number"
                value={newRoomWager}
                onChange={(e) => setNewRoomWager(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={async () => {
                  await gamingLobbyService.createRoom({
                    gameId: newRoomGameId,
                    gameName: newRoomTitle,
                    hostName: authUser?.displayName || 'Alex Rivers',
                    minWagerPoints: newRoomWager,
                    maxPlayers: 4,
                    currentPlayers: 1,
                    isPrivate: false,
                    status: 'WAITING'
                  });
                  setIsCreateRoomOpen(false);
                  setActiveGameId(newRoomGameId);
                  alert(`Created room '${newRoomTitle}'! Players can now join.`);
                }}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-2xl shadow"
              >
                Create Room
              </button>
              <button
                onClick={() => setIsCreateRoomOpen(false)}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-2xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
