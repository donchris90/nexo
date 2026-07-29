import { IGameModule, getNextPlayerId } from './GameEngine';

/**
 * Returns all built-in Nexora game modules
 */
export function getBuiltInGameModules(): IGameModule[] {
  // 1. CASUAL GAMES
  const casualGames: IGameModule[] = [
    {
      id: 'LUDO',
      definition: {
        id: 'LUDO',
        name: 'Ludo Master Arena',
        category: 'CASUAL',
        description: 'Classic 4-player token racing board game with dice rolls and wagers.',
        iconName: 'Dices',
        minPlayers: 2,
        maxPlayers: 4,
        wagerAllowed: true,
        isPopular: true,
        supportedModes: ['SOLO', 'MULTIPLAYER', 'LIVE_ROOM', 'PARTY_ROOM'],
        howToPlay: 'Roll a 6 to release your token. Race around the track to reach Home before opponents.'
      },
      initSessionState: (players) => {
        const colors = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
        const tokens: Record<string, number[]> = {};
        players.forEach((p, idx) => {
          tokens[p.userId] = [-1, -1, -1, -1];
        });
        return {
          playerColors: players.reduce((acc, p, idx) => ({ ...acc, [p.userId]: colors[idx % 4] }), {}),
          tokens, // userId -> [token0, token1, token2, token3]
          lastRoll: null,
          hasRolled: false,
          consecutiveSixes: 0
        };
      },
      onTurnMove: (state, userId, move, players) => {
        const userTokens = state.tokens?.[userId] || [-1, -1, -1, -1];
        const safeCells = [0, 8, 13, 21, 26, 34, 39, 47];

        if (move.action === 'ROLL_DICE') {
          const dice = Math.floor(Math.random() * 6) + 1;
          const canMoveAny = userTokens.some((t: number) => (t === -1 && dice === 6) || (t >= 0 && t + dice <= 106));

          // Three consecutive 6s forfeits the turn (official rule) — also guards
          // against a player rolling 6 forever and never actually playing.
          const consecutiveSixes = dice === 6 ? (state.consecutiveSixes || 0) + 1 : 0;
          const forfeitTurn = consecutiveSixes >= 3;

          if (!canMoveAny || forfeitTurn) {
            // No legal move (or forfeited): turn passes immediately instead of
            // stranding the game waiting for a MOVE_TOKEN that can never come.
            return {
              nextState: { ...state, lastRoll: null, hasRolled: false, consecutiveSixes: 0 },
              nextTurnUserId: getNextPlayerId(players, userId),
              logMessage: forfeitTurn ? `Rolled three 6s in a row — turn forfeited!` : `Rolled a ${dice}. No legal moves available — turn passes.`
            };
          }

          return {
            nextState: { ...state, lastRoll: dice, hasRolled: true, consecutiveSixes },
            nextTurnUserId: userId,
            logMessage: `Rolled a ${dice}! Select a token to move.`
          };
        }

        if (move.action === 'MOVE_TOKEN') {
          if (!state.hasRolled) {
            return { nextState: state, nextTurnUserId: userId, logMessage: 'Roll the dice first.' };
          }

          const tokenIdx = move.tokenIndex ?? 0;
          const dice = state.lastRoll || 1;
          const currentPos = userTokens[tokenIdx] ?? -1;

          let newPos = currentPos;
          if (currentPos === -1 && dice === 6) {
            newPos = 0; // Released to start square
          } else if (currentPos >= 0 && currentPos + dice <= 106) {
            newPos = currentPos + dice;
          } else {
            return { nextState: state, nextTurnUserId: userId, logMessage: 'That token cannot make this move.' };
          }

          const updatedUserTokens = [...userTokens];
          updatedUserTokens[tokenIdx] = newPos;

          // Capture check on non-safe main track
          let captureOccurred = false;
          const nextTokensState = { ...state.tokens, [userId]: updatedUserTokens };

          if (newPos >= 0 && newPos <= 51 && !safeCells.includes(newPos)) {
            Object.keys(nextTokensState).forEach(otherId => {
              if (otherId !== userId) {
                const otherTokens = nextTokensState[otherId] || [];
                const updatedOther = otherTokens.map((pos: number) => {
                  if (pos === newPos) {
                    captureOccurred = true;
                    return -1; // Sent back home!
                  }
                  return pos;
                });
                nextTokensState[otherId] = updatedOther;
              }
            });
          }

          // Victory check (all 4 tokens at 106)
          const isWinner = updatedUserTokens.every(pos => pos === 106);
          const extraTurn = (dice === 6 || captureOccurred) && (state.consecutiveSixes || 0) < 3;

          return {
            nextState: {
              ...state,
              tokens: nextTokensState,
              lastRoll: null,
              hasRolled: false,
              consecutiveSixes: dice === 6 ? state.consecutiveSixes : 0
            },
            nextTurnUserId: isWinner ? userId : (extraTurn ? userId : getNextPlayerId(players, userId)),
            winnerUserId: isWinner ? userId : undefined,
            logMessage: isWinner
              ? `🎉 Ludo Champion! All tokens reached Home!`
              : captureOccurred
                ? `Captured opponent token! Bonus turn granted!`
                : `Moved token to position ${newPos}.`
          };
        }

        return { nextState: state, nextTurnUserId: userId, logMessage: 'Turn action executed' };
      }
    },
    {
      id: 'UNO',
      definition: {
        id: 'UNO',
        name: 'Uno Color Blitz',
        category: 'CASUAL',
        description: 'Match color, numbers, and play Wild cards to clear your hand first.',
        iconName: 'Play',
        minPlayers: 2,
        maxPlayers: 4,
        wagerAllowed: true,
        isPopular: true,
        supportedModes: ['SOLO', 'MULTIPLAYER', 'LIVE_ROOM'],
        howToPlay: 'Play cards matching top card color/number or special Action cards like +2 and Wild.'
      },
      initSessionState: (players) => {
        const colors = ['red', 'blue', 'green', 'yellow'];
        const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Skip', 'Reverse', '+2'];
        const deck: Array<{ color: string; val: string }> = [];

        colors.forEach(c => {
          values.forEach(v => {
            deck.push({ color: c, val: v });
            if (v !== '0') deck.push({ color: c, val: v });
          });
          deck.push({ color: 'wild', val: 'Wild' });
          deck.push({ color: 'wild', val: '+4' });
        });

        // Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        const hands: Record<string, Array<{ color: string; val: string }>> = {};
        players.forEach(p => {
          hands[p.userId] = deck.splice(0, 7);
        });

        // The starting card must be a plain colored card — an opening Wild would
        // leave the required color ambiguous with nobody having chosen one.
        let topCard = deck.pop() || { color: 'red', val: '7' };
        const reshuffled: Array<{ color: string; val: string }> = [];
        while (topCard.color === 'wild' && deck.length > 0) {
          reshuffled.push(topCard);
          topCard = deck.pop()!;
        }
        deck.push(...reshuffled);

        return {
          topCard,
          activeColor: topCard.color,
          deck,
          hands,
          turnDirection: 1, // 1 for clockwise, -1 for counter-clockwise
          unoCalled: {} // userId -> boolean
        };
      },
      onTurnMove: (state, userId, move, players) => {
        const userHand: Array<{ color: string; val: string }> = state.hands?.[userId] || [];
        const direction: 1 | -1 = state.turnDirection === -1 ? -1 : 1;

        const drawCards = (deck: Array<{ color: string; val: string }>, count: number) => {
          const drawn = deck.splice(Math.max(0, deck.length - count), count);
          return drawn;
        };

        if (move.action === 'DRAW_CARD') {
          const currentDeck = [...(state.deck || [])];
          if (currentDeck.length === 0) {
            return { nextState: state, nextTurnUserId: getNextPlayerId(players, userId, direction), logMessage: 'Deck is empty — turn passes.' };
          }
          const [drawnCard] = drawCards(currentDeck, 1);
          const updatedHand = [...userHand, drawnCard];

          return {
            nextState: { ...state, deck: currentDeck, hands: { ...state.hands, [userId]: updatedHand } },
            nextTurnUserId: getNextPlayerId(players, userId, direction),
            logMessage: `Drew a card and passed the turn.`
          };
        }

        if (move.action === 'PLAY_CARD') {
          const playedCard = userHand[move.cardIndex];
          if (!playedCard) {
            return { nextState: state, nextTurnUserId: userId, logMessage: 'No such card in hand.' };
          }

          const requiredColor = state.topCard?.color === 'wild' ? state.activeColor : state.topCard?.color;
          const isValid =
            playedCard.color === 'wild' ||
            playedCard.color === requiredColor ||
            playedCard.val === state.topCard?.val;

          if (!isValid) {
            return { nextState: state, nextTurnUserId: userId, logMessage: 'Invalid card play!' };
          }

          if (playedCard.color === 'wild' && !move.chosenColor) {
            return { nextState: state, nextTurnUserId: userId, logMessage: 'Choose a color to play a Wild card.' };
          }

          const updatedHand = userHand.filter((_c, idx) => idx !== move.cardIndex);
          const isWinner = updatedHand.length === 0;
          const currentDeck = [...(state.deck || [])];
          const nextHands = { ...state.hands, [userId]: updatedHand };
          const activeColor = playedCard.color === 'wild' ? move.chosenColor : playedCard.color;

          let nextDirection = direction;
          let skipToNext = false;
          let forcedDrawCount = 0;

          if (playedCard.val === 'Reverse') {
            nextDirection = direction * -1;
            if (players.length === 2) skipToNext = true; // Reverse acts as Skip 1v1
          } else if (playedCard.val === 'Skip') {
            skipToNext = true;
          } else if (playedCard.val === '+2') {
            forcedDrawCount = 2;
            skipToNext = true;
          } else if (playedCard.val === '+4') {
            forcedDrawCount = 4;
            skipToNext = true;
          }

          const immediateNext = getNextPlayerId(players, userId, nextDirection);
          let finalNextTurnUserId = immediateNext;

          if (forcedDrawCount > 0) {
            const forcedCards = drawCards(currentDeck, forcedDrawCount);
            nextHands[immediateNext] = [...(nextHands[immediateNext] || []), ...forcedCards];
          }
          if (skipToNext) {
            finalNextTurnUserId = getNextPlayerId(players, immediateNext, nextDirection);
          }

          return {
            nextState: {
              ...state,
              topCard: playedCard,
              activeColor,
              deck: currentDeck,
              hands: nextHands,
              turnDirection: nextDirection
            },
            nextTurnUserId: isWinner ? userId : finalNextTurnUserId,
            winnerUserId: isWinner ? userId : undefined,
            logMessage: isWinner
              ? `🎉 UNO VICTORY!`
              : `Played ${playedCard.color === 'wild' ? activeColor.toUpperCase() + ' (Wild)' : playedCard.color.toUpperCase()} ${playedCard.val}${forcedDrawCount ? ` — next player draws ${forcedDrawCount}!` : ''}`
          };
        }

        return { nextState: state, nextTurnUserId: userId, logMessage: 'Turn played' };
      }
    },
    {
      id: 'TIC_TAC_TOE',
      definition: {
        id: 'TIC_TAC_TOE',
        name: 'Tic-Tac-Toe Showdown',
        category: 'CASUAL',
        description: 'Fast 3x3 grid battle for quick 30-second match wagers.',
        iconName: 'Grid',
        minPlayers: 2,
        maxPlayers: 2,
        wagerAllowed: true,
        supportedModes: ['SOLO', 'MULTIPLAYER', 'PK_MATCH'],
        howToPlay: 'Align 3 Xs or Os horizontally, vertically, or diagonally to win.'
      },
      initSessionState: (players) => ({
        grid: Array(9).fill(null),
        turnSymbol: 'X',
        // First player in the session is always X, matching whoever currentTurnUserId
        // starts as, so turnSymbol and the acting player never drift apart.
        symbolByUser: players.reduce((acc, p, idx) => ({ ...acc, [p.userId]: idx === 0 ? 'X' : 'O' }), {})
      }),
      onTurnMove: (state, userId, move, players) => {
        const grid = [...(state.grid || Array(9).fill(null))];
        const cellIdx = move.index;
        if (cellIdx < 0 || cellIdx > 8 || grid[cellIdx] !== null) {
          return { nextState: state, nextTurnUserId: userId, logMessage: 'Cell already occupied!' };
        }

        const symbol = state.symbolByUser?.[userId] || state.turnSymbol || 'X';
        if (symbol !== state.turnSymbol) {
          return { nextState: state, nextTurnUserId: userId, logMessage: "It is not this player's symbol's turn." };
        }
        grid[cellIdx] = symbol;

        // Check Win combinations
        const winCombos = [
          [0, 1, 2], [3, 4, 5], [6, 7, 8],
          [0, 3, 6], [1, 4, 7], [2, 5, 8],
          [0, 4, 8], [2, 4, 6]
        ];

        const isWin = winCombos.some(combo => combo.every(i => grid[i] === symbol));
        const isDraw = !isWin && grid.every(cell => cell !== null);

        return {
          nextState: {
            ...state,
            grid,
            turnSymbol: symbol === 'X' ? 'O' : 'X',
            isDraw
          },
          nextTurnUserId: isWin || isDraw ? userId : getNextPlayerId(players, userId),
          winnerUserId: isWin ? userId : undefined,
          matchEnded: isDraw,
          logMessage: isWin ? `🎉 Placed ${symbol} and WON the match!` : isDraw ? `Match ended in a DRAW!` : `Placed ${symbol} at position ${cellIdx + 1}`
        };
      }
    },
    {
      id: 'CONNECT_FOUR',
      definition: {
        id: 'CONNECT_FOUR',
        name: 'Connect Four Clash',
        category: 'CASUAL',
        description: 'Drop discs in vertical columns to form a line of 4 consecutive colors.',
        iconName: 'Layers',
        minPlayers: 2,
        maxPlayers: 2,
        wagerAllowed: true,
        supportedModes: ['MULTIPLAYER', 'PARTY_ROOM'],
        howToPlay: 'Drop tokens into columns and connect 4 in a row before your rival.'
      },
      initSessionState: () => ({ grid: [] }),
      onTurnMove: (state, userId, move) => ({
        nextState: { lastColumn: move.col },
        nextTurnUserId: userId,
        logMessage: `Dropped disc in column ${move.col}`
      })
    },
    {
      id: 'CHESS',
      definition: {
        id: 'CHESS',
        name: 'Grandmaster Chess Dual',
        category: 'CASUAL',
        description: 'Strategic board game with timed moves and competitive rating leaderboards.',
        iconName: 'Crown',
        minPlayers: 2,
        maxPlayers: 2,
        wagerAllowed: true,
        supportedModes: ['SOLO', 'MULTIPLAYER'],
        howToPlay: 'Checkmate your opponent king through calculated opening strategies.'
      },
      initSessionState: () => ({ fen: 'start' }),
      onTurnMove: (state, userId, move) => ({
        nextState: { lastMove: move.fromTo },
        nextTurnUserId: userId,
        logMessage: `Executed move ${move.fromTo}`
      })
    },
    {
      id: 'CHECKERS',
      definition: {
        id: 'CHECKERS',
        name: 'Checkers Blitz',
        category: 'CASUAL',
        description: 'Jump enemy pieces and crown your kings in quick tactical rounds.',
        iconName: 'Circle',
        minPlayers: 2,
        maxPlayers: 2,
        wagerAllowed: true,
        supportedModes: ['MULTIPLAYER'],
        howToPlay: 'Move diagonally across the board and capture all opponent pieces.'
      },
      initSessionState: () => ({ captured: 0 }),
      onTurnMove: (state, userId, move) => ({
        nextState: { captured: move.count },
        nextTurnUserId: userId,
        logMessage: `Jumped piece!`
      })
    },
    {
      id: 'DOMINOES',
      definition: {
        id: 'DOMINOES',
        name: 'Dominoes Club',
        category: 'CASUAL',
        description: 'Popular tiles matching game played across rooms and leagues.',
        iconName: 'Square',
        minPlayers: 2,
        maxPlayers: 4,
        wagerAllowed: true,
        supportedModes: ['MULTIPLAYER', 'PARTY_ROOM'],
        howToPlay: 'Match the PIP numbers on domino ends to empty your hand first.'
      },
      initSessionState: () => ({ tilesLeft: 14 }),
      onTurnMove: (state, userId, move) => ({
        nextState: { lastTile: move.tile },
        nextTurnUserId: userId,
        logMessage: `Played tile ${move.tile}`
      })
    },
    {
      id: 'BINGO',
      definition: {
        id: 'BINGO',
        name: 'Live Party Bingo',
        category: 'CASUAL',
        description: 'Real-time room bingo caller where viewers mark numbers to win jackpot coins.',
        iconName: 'Sparkles',
        minPlayers: 2,
        maxPlayers: 50,
        wagerAllowed: true,
        supportedModes: ['LIVE_ROOM', 'PARTY_ROOM'],
        howToPlay: 'Mark numbers as the host calls them. Complete 5 in a row to shout BINGO!'
      },
      initSessionState: () => ({ currentNumber: 42 }),
      onTurnMove: (state, userId, move) => ({
        nextState: { currentNumber: move.num },
        nextTurnUserId: userId,
        logMessage: `Called Bingo Number ${move.num}`
      })
    }
  ];

  // 2. PARTY GAMES
  const partyGames: IGameModule[] = [
    {
      id: 'TRUTH_OR_DARE',
      definition: {
        id: 'TRUTH_OR_DARE',
        name: 'Truth or Dare Wheel',
        category: 'PARTY',
        description: 'Interactive party room spinner assigning dares and spicy questions to guest mics.',
        iconName: 'HelpCircle',
        minPlayers: 2,
        maxPlayers: 9,
        wagerAllowed: false,
        isPopular: true,
        supportedModes: ['LIVE_ROOM', 'PARTY_ROOM'],
        howToPlay: 'Spin the bottle or wheel. Selected guest chooses Truth or Dare and answers live!'
      },
      initSessionState: () => ({ selectedChoice: 'TRUTH' }),
      onTurnMove: (state, userId, move) => ({
        nextState: { prompt: move.prompt },
        nextTurnUserId: userId,
        logMessage: `Selected ${move.choice}: ${move.prompt}`
      })
    },
    {
      id: 'SPIN_BOTTLE',
      definition: {
        id: 'SPIN_BOTTLE',
        name: 'Spin The Bottle',
        category: 'PARTY',
        description: 'Classic mic seat pairing wheel for live voice party rooms.',
        iconName: 'RotateCw',
        minPlayers: 3,
        maxPlayers: 9,
        wagerAllowed: false,
        supportedModes: ['PARTY_ROOM'],
        howToPlay: 'Tap Spin! The bottle points to a mic seat for a 1-on-1 song, joke, or gift.'
      },
      initSessionState: () => ({ landedSeat: 1 }),
      onTurnMove: (state, userId, move) => ({
        nextState: { landedSeat: move.seat },
        nextTurnUserId: userId,
        logMessage: `Landed on Seat #${move.seat}!`
      })
    },
    {
      id: 'TRIVIA_QUIZ',
      definition: {
        id: 'TRIVIA_QUIZ',
        name: 'AI Speed Trivia Showdown',
        category: 'PARTY',
        description: 'Gemini AI generated quiz questions on Pop Culture, Music, Gaming & Sports.',
        iconName: 'Brain',
        minPlayers: 1,
        maxPlayers: 100,
        wagerAllowed: true,
        isPopular: true,
        supportedModes: ['SOLO', 'LIVE_ROOM', 'PARTY_ROOM'],
        howToPlay: 'Answer within 10 seconds. Fast correct answers award higher points!'
      },
      initSessionState: () => ({ score: 0 }),
      onTurnMove: (state, userId, move) => ({
        nextState: { score: (state.score || 0) + (move.correct ? 250 : 0) },
        nextTurnUserId: userId,
        logMessage: move.correct ? 'Correct answer! +250 Pts' : 'Incorrect answer.'
      })
    },
    {
      id: 'WOULD_YOU_RATHER',
      definition: {
        id: 'WOULD_YOU_RATHER',
        name: 'Would You Rather Live',
        category: 'PARTY',
        description: 'Choose between 2 hilarious choices and see real-time room percentage votes.',
        iconName: 'Split',
        minPlayers: 2,
        maxPlayers: 50,
        wagerAllowed: false,
        supportedModes: ['LIVE_ROOM', 'PARTY_ROOM'],
        howToPlay: 'Vote for Option A or B. Compete with room audience consensus!'
      },
      initSessionState: () => ({ votesA: 50, votesB: 50 }),
      onTurnMove: (state, userId, move) => ({
        nextState: { optionChosen: move.choice },
        nextTurnUserId: userId,
        logMessage: `Voted for ${move.choice}`
      })
    },
    {
      id: 'GUESS_EMOJI',
      definition: {
        id: 'GUESS_EMOJI',
        name: 'Guess The Emoji Movie',
        category: 'PARTY',
        description: 'Decode emoji clues in chat to win quick coin rewards.',
        iconName: 'Smile',
        minPlayers: 1,
        maxPlayers: 100,
        wagerAllowed: false,
        supportedModes: ['LIVE_ROOM', 'PARTY_ROOM'],
        howToPlay: 'Type your guess in chat when emoji clues pop up on screen.'
      },
      initSessionState: () => ({ currentClue: '🍿🎥 🚢 🧊 💔' }),
      onTurnMove: (state, userId, move) => ({
        nextState: { solved: move.isCorrect },
        nextTurnUserId: userId,
        winnerUserId: move.isCorrect ? userId : undefined,
        logMessage: move.isCorrect ? `Guessed correctly: Titanic!` : `Wrong guess.`
      })
    }
  ];

  // 3. COIN GAMES
  const coinGames: IGameModule[] = [
    {
      id: 'LUCKY_WHEEL',
      definition: {
        id: 'LUCKY_WHEEL',
        name: 'Lucky Spin Wheel Jackpot',
        category: 'COIN',
        description: 'Spin the virtual points wheel to win up to 50x multiplier prizes.',
        iconName: 'Sparkles',
        minPlayers: 1,
        maxPlayers: 1,
        wagerAllowed: true,
        isPopular: true,
        supportedModes: ['SOLO', 'LIVE_ROOM'],
        howToPlay: 'Select your wager points and tap Spin to hit multiplier slots.'
      },
      initSessionState: () => ({ multiplier: 1 }),
      onTurnMove: (state, userId, move) => ({
        nextState: { multiplier: move.multiplier },
        nextTurnUserId: userId,
        logMessage: `Landed on ${move.multiplier}x Multiplier!`
      })
    },
    {
      id: 'COIN_FLIP',
      definition: {
        id: 'COIN_FLIP',
        name: 'Heads or Tails Coin Flip',
        category: 'COIN',
        description: 'Double or nothing coin toss with 50/50 odds.',
        iconName: 'Coins',
        minPlayers: 1,
        maxPlayers: 2,
        wagerAllowed: true,
        isPopular: true,
        supportedModes: ['SOLO', 'PK_MATCH'],
        howToPlay: 'Pick Heads or Tails. A 3D animated coin flips to double your wager!'
      },
      initSessionState: () => ({ outcome: 'HEADS' }),
      onTurnMove: (state, userId, move) => {
        const isHeads = Math.random() > 0.5;
        const result = isHeads ? 'HEADS' : 'TAILS';
        const won = result === move.pick;
        return {
          nextState: { result },
          nextTurnUserId: userId,
          winnerUserId: won ? userId : undefined,
          logMessage: `Coin landed on ${result}. ${won ? 'You Double Up!' : 'Better luck next flip!'}`
        };
      }
    },
    {
      id: 'DICE_BATTLE',
      definition: {
        id: 'DICE_BATTLE',
        name: 'Dice Roll Battle',
        category: 'COIN',
        description: 'Roll 3 dice against your rival or host to score highest total.',
        iconName: 'Dices',
        minPlayers: 2,
        maxPlayers: 2,
        wagerAllowed: true,
        supportedModes: ['SOLO', 'MULTIPLAYER', 'PK_MATCH'],
        howToPlay: 'Higher total 3-dice sum wins the wager pool.'
      },
      initSessionState: () => ({ scores: {} }),
      onTurnMove: (state, userId, move) => ({
        nextState: { lastSum: move.sum },
        nextTurnUserId: userId,
        logMessage: `Rolled dice total: ${move.sum}`
      })
    },
    {
      id: 'TREASURE_BOX',
      definition: {
        id: 'TREASURE_BOX',
        name: 'Treasure Box Vault',
        category: 'COIN',
        description: 'Pick 1 of 3 mysterious treasure chests to reveal jackpot bonus coins.',
        iconName: 'Box',
        minPlayers: 1,
        maxPlayers: 1,
        wagerAllowed: true,
        supportedModes: ['SOLO', 'LIVE_ROOM'],
        howToPlay: 'Choose Golden Chest 1, 2, or 3 to unlock rare rewards.'
      },
      initSessionState: () => ({ chestOpened: null }),
      onTurnMove: (state, userId, move) => ({
        nextState: { chest: move.chestId },
        nextTurnUserId: userId,
        logMessage: `Unlocked Chest #${move.chestId} for ${move.reward} Coins!`
      })
    }
  ];

  // 4. HOST & LIVE ROOM GAMES
  const hostGames: IGameModule[] = [
    {
      id: 'COIN_RAIN',
      definition: {
        id: 'COIN_RAIN',
        name: 'Coin Rain Shower',
        category: 'HOST',
        description: 'Host triggers a 30-second falling coin catching frenzy in the live room.',
        iconName: 'CloudRain',
        minPlayers: 1,
        maxPlayers: 500,
        wagerAllowed: false,
        isPopular: true,
        supportedModes: ['LIVE_ROOM'],
        howToPlay: 'Tap falling coins on your screen before time runs out to claim free points.'
      },
      initSessionState: () => ({ active: true, totalDropped: 1000 }),
      onTurnMove: (state, userId, move) => ({
        nextState: { collected: move.count },
        nextTurnUserId: userId,
        logMessage: `Caught ${move.count} falling coins!`
      })
    },
    {
      id: 'POLL_BATTLE',
      definition: {
        id: 'POLL_BATTLE',
        name: 'Live Audience Voting Battle',
        category: 'HOST',
        description: 'Create instant 2-choice voting battles with live animated percentage bars.',
        iconName: 'BarChart2',
        minPlayers: 1,
        maxPlayers: 500,
        wagerAllowed: false,
        supportedModes: ['LIVE_ROOM', 'PARTY_ROOM'],
        howToPlay: 'Host submits question. Audience taps Option A or B to steer the stream.'
      },
      initSessionState: () => ({ optionA: 0, optionB: 0 }),
      onTurnMove: (state, userId, move) => ({
        nextState: { optionA: move.optionA, optionB: move.optionB },
        nextTurnUserId: userId,
        logMessage: `Vote recorded for Option ${move.vote}`
      })
    }
  ];

  // 5. PK GAMES
  const pkGames: IGameModule[] = [
    {
      id: 'PK_GIFT_WAR',
      definition: {
        id: 'PK_GIFT_WAR',
        name: 'Live Stream PK Gift War',
        category: 'PK',
        description: '3-minute live streamer duel where gift points drive the PK tug-of-war meter.',
        iconName: 'Swords',
        minPlayers: 2,
        maxPlayers: 2,
        wagerAllowed: true,
        isPopular: true,
        supportedModes: ['PK_MATCH', 'LIVE_ROOM'],
        howToPlay: 'Send gifts during the live PK timer to push the score bar toward victory!'
      },
      initSessionState: () => ({ host1Score: 0, host2Score: 0 }),
      onTurnMove: (state, userId, move) => ({
        nextState: { host1Score: (state.host1Score || 0) + (move.giftValue || 100) },
        nextTurnUserId: userId,
        logMessage: `Sent PK Gift worth ${move.giftValue || 100} Points!`
      })
    },
    {
      id: 'HEADS_UP_PK',
      definition: {
        id: 'HEADS_UP_PK',
        name: '1v1 Speed Quiz Duel',
        category: 'PK',
        description: 'Rapid-fire trivia battle where correct answers drain your rival HP bar.',
        iconName: 'Zap',
        minPlayers: 2,
        maxPlayers: 2,
        wagerAllowed: true,
        supportedModes: ['PK_MATCH'],
        howToPlay: 'Tap the correct answer first to attack your opponent in real-time.'
      },
      initSessionState: () => ({ player1Hp: 100, player2Hp: 100 }),
      onTurnMove: (state, userId, move) => ({
        nextState: { player2Hp: Math.max(0, (state.player2Hp || 100) - 25) },
        nextTurnUserId: userId,
        winnerUserId: (state.player2Hp || 100) - 25 <= 0 ? userId : undefined,
        logMessage: `Direct hit! Dealt 25 Damage in PK duel!`
      })
    }
  ];

  // 6. FAMILY & AGENCY GAMES
  const familyGames: IGameModule[] = [
    {
      id: 'FAMILY_TREE_QUEST',
      definition: {
        id: 'FAMILY_TREE_QUEST',
        name: 'Family Guild Boss Raid',
        category: 'FAMILY',
        description: 'Cooperative family stream mission to defeat boss monsters for shared coin rewards.',
        iconName: 'Users2',
        minPlayers: 2,
        maxPlayers: 50,
        wagerAllowed: false,
        isPopular: true,
        supportedModes: ['PARTY_ROOM', 'LIVE_ROOM'],
        howToPlay: 'Tap to join family members in attacking the daily raid boss before time runs out.'
      },
      initSessionState: () => ({ bossHp: 1000 }),
      onTurnMove: (state, userId, move) => ({
        nextState: { bossHp: Math.max(0, (state.bossHp || 1000) - (move.damage || 50)) },
        nextTurnUserId: userId,
        logMessage: `Family attack dealt ${move.damage || 50} damage to Raid Boss!`
      })
    },
    {
      id: 'FAMILY_FEUD',
      definition: {
        id: 'FAMILY_FEUD',
        name: 'Family Agency Feud',
        category: 'FAMILY',
        description: 'Team vs Team trivia battle to climb the agency weekly leaderboard.',
        iconName: 'Crown',
        minPlayers: 4,
        maxPlayers: 10,
        wagerAllowed: true,
        supportedModes: ['PARTY_ROOM'],
        howToPlay: 'Work with your family squad to guess top survey responses.'
      },
      initSessionState: () => ({ teamAScore: 0, teamBScore: 0 }),
      onTurnMove: (state, userId, move) => ({
        nextState: { teamAScore: (state.teamAScore || 0) + 100 },
        nextTurnUserId: userId,
        logMessage: `Guessed top survey answer! +100 Family EXP`
      })
    }
  ];

  return [...casualGames, ...partyGames, ...coinGames, ...hostGames, ...pkGames, ...familyGames];
}

import { gameEngine } from './GameEngine';

export function initializeGameRegistry() {
  getBuiltInGameModules().forEach(module => {
    gameEngine.registerModule(module);
  });
}
