import React, { useState, useEffect, useRef } from 'react';
import { Card, CardPowerType, DieFace, GamePhase, GameState, Player, Suit } from './types';
import { generateDeck, shuffle, MAX_BANK_SIZE, SOUNDS, BG_MUSIC } from './constants';
import { getAIAction } from './services/geminiService';
import { Card as CardComponent } from './components/Card';
import { Die } from './components/Die';
import { User, Bot, PiggyBank, Trophy, Activity, SkipForward, Volume2, VolumeX, ShieldAlert, Shield, ArrowRightLeft, Trash2, Crosshair, Sparkles, HeartHandshake, Sun, Trees as Tree, Utensils, X, Play, Landmark, Zap, Swords, Ghost, Coins, Gem, Skull, Bird, Anchor, Hammer, Pickaxe, Car, Diamond, Image as ImageIcon } from 'lucide-react';

// Enum to manage which selection modal/mode is active
enum InteractionMode {
  NONE = 'NONE',
  // Legacy Cats
  CAT1_VALUE = 'CAT1_VALUE',
  CAT2_BANK_TARGET = 'CAT2_BANK_TARGET',
  CAT3_DECK = 'CAT3_DECK',
  CAT4_TARGET = 'CAT4_TARGET',
  CAT5_SWAP = 'CAT5_SWAP',
  CAT7_TARGET = 'CAT7_TARGET',
  CAT8_TARGET = 'CAT8_TARGET',
  // Roll
  ROLL_COMBO = 'ROLL_COMBO',
  // Strawberry Modes
  STRAWBERRY_BABYG_OWN_BANK = 'STRAWBERRY_BABYG_OWN_BANK', 
  STRAWBERRY_BABYG_OPP_PLAYER = 'STRAWBERRY_BABYG_OPP_PLAYER',
  STRAWBERRY_BABYG_OPP_BANK = 'STRAWBERRY_BABYG_OPP_BANK',
  STRAWBERRY_GOAT_TARGET = 'STRAWBERRY_GOAT_TARGET',
  STRAWBERRY_TEA_TARGET = 'STRAWBERRY_TEA_TARGET',
  STRAWBERRY_FOREST_PICK = 'STRAWBERRY_FOREST_PICK',
  STRAWBERRY_FRIENDS_TARGET = 'STRAWBERRY_FRIENDS_TARGET',
  STRAWBERRY_FRIENDS_OWN_PICK = 'STRAWBERRY_FRIENDS_OWN_PICK',
  STRAWBERRY_FRIENDS_OPP_PICK = 'STRAWBERRY_FRIENDS_OPP_PICK',
  STRAWBERRY_FRIDAY_PICK = 'STRAWBERRY_FRIDAY_PICK',
  // Sea Modes
  SEA_MINE_GAME = 'SEA_MINE_GAME',
  SEA_PIRATE_GAME = 'SEA_PIRATE_GAME',
  SEA_MINE_DECK = 'SEA_MINE_DECK',
  SEA_PIRATE_STEAL_TARGET = 'SEA_PIRATE_STEAL_TARGET',
  SEA_ISAAC_GAME = 'SEA_ISAAC_GAME',
  SEA_MARIO_GAME = 'SEA_MARIO_GAME',
  SEA_PIRATE_TARGET = 'SEA_PIRATE_TARGET',
  SEA_SIMS_DECK_1 = 'SEA_SIMS_DECK_1',
  SEA_SIMS_DECK_2 = 'SEA_SIMS_DECK_2',
  SEA_EREN_OWN_BANK = 'SEA_EREN_OWN_BANK',
  SEA_EREN_TARGET = 'SEA_EREN_TARGET',
  SEA_MARCUS_TARGET = 'SEA_MARCUS_TARGET',
  // Paintbrush Modes
  PAINTBRUSH_RAIN_DECK = 'PAINTBRUSH_RAIN_DECK',
  PAINTBRUSH_VIDEO_TARGET = 'PAINTBRUSH_VIDEO_TARGET',
  PAINTBRUSH_MAKEUP_TARGET = 'PAINTBRUSH_MAKEUP_TARGET',
  PAINTBRUSH_STYLE_HAND_PICK = 'PAINTBRUSH_STYLE_HAND_PICK',
  PAINTBRUSH_STYLE_TARGET = 'PAINTBRUSH_STYLE_TARGET',
  PAINTBRUSH_ACTING_TARGET = 'PAINTBRUSH_ACTING_TARGET',
  PAINTBRUSH_RIDE_DECK_1 = 'PAINTBRUSH_RIDE_DECK_1',
  PAINTBRUSH_RIDE_DECK_2 = 'PAINTBRUSH_RIDE_DECK_2',
  PAINTBRUSH_READING_TARGET = 'PAINTBRUSH_READING_TARGET',
  PAINTBRUSH_READING_BANK_PICK = 'PAINTBRUSH_READING_BANK_PICK',
  // Defensive
  RYAN_DEFENSE_PROMPT = 'RYAN_DEFENSE_PROMPT' 
}

const TURN_DURATION = 30;

const SPECIAL_CAT_IDS = [
  'cat1', 'cat2', 'cat3', 'cat4', 'cat5', 'cat6', 'cat7', 'cat8',
  'Pyracard', 'Rupaulcard', 'Singerscard', 'Minecard', 'Piratecard', 
  'Isaaccard', 'simscard', 'Mariocard', 'Papacard', 'Erencard',
  'Marcuscard', 'Huntercard', 'Kapitcard', 'OTGWcard',
  'Videocard', 'Stylecard', 'singcard', 'Scentcard', 'Ridecard', 'Readingcard',
  'Actingcard', 'Cookcard', 'Makeupcard', 'Musiccard', 'Naturecard',
  'Paintcard', 'Raincard', 'Tenbiscard', 'Coffeecard',
  'Teacard', 'Forestcard', 'Epecard', 'Friendscard', 'Familycard', 'Ryancard',
  'Fridaycard', 'BabyGcard', 'Galiandtamercard', 'Miguelcard', 'Tamercard',
  'Galicard', 'Goatcard', 'Parentscard', 'Hagefencard'
];

const MINI_GAME_MODES = [
  InteractionMode.SEA_MARIO_GAME,
  InteractionMode.SEA_PIRATE_GAME,
  InteractionMode.SEA_MINE_GAME,
  InteractionMode.SEA_ISAAC_GAME,
  InteractionMode.SEA_PIRATE_STEAL_TARGET
];

const App = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    galiAge: 25,
    phase: 'SETUP',
    turnStep: 'ROLL',
    actionsLeft: 0,
    decks: {
      [Suit.Strawberry]: [],
      [Suit.Sea]: [],
      [Suit.Paintbrush]: [],
      [Suit.Cat]: []
    },
    winnerId: null,
    lastDieRoll: null,
    logs: [],
    leaderId: null,
    roundsLeftInLastChance: -1
  });

  const [isRolling, setIsRolling] = useState(false);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>(InteractionMode.NONE);
  const [setupData, setSetupData] = useState({ playerCount: 2, galiAge: 25, playerName: 'You' });
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(TURN_DURATION);
  const [isHourglassFlipped, setIsHourglassFlipped] = useState(false);

  const [pendingSelectionCards, setPendingSelectionCards] = useState<Card[]>([]);
  const [cat5HandSelection, setCat5HandSelection] = useState<string | null>(null);
  
  const [erenSelectedBankCardId, setErenSelectedBankCardId] = useState<string | null>(null);
  const [styleSelectedHandCardId, setStyleSelectedHandCardId] = useState<string | null>(null);
  const [readingTargetId, setReadingTargetId] = useState<string | null>(null);

  const [previewCard, setPreviewCard] = useState<Card | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  const log = (msg: string) => {
    setGameLog(prev => [...prev.slice(-4), msg]); 
  };

  const playSound = (url: string) => {
      try {
          if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current = null;
          }
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.volume = 0.5;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
              playPromise.catch(() => {});
          }
      } catch (e) {}
  };

  useEffect(() => {
    if (!musicRef.current) {
        musicRef.current = new Audio(BG_MUSIC);
        musicRef.current.loop = true;
        musicRef.current.volume = 0.3;
    }
    if (isMusicMuted) {
        musicRef.current.pause();
    } else if (gameState.phase !== 'SETUP' && gameState.phase !== 'GAME_OVER') {
        musicRef.current.play().catch(() => {});
    }
  }, [isMusicMuted, gameState.phase]);

  useEffect(() => {
    if (gameState.phase === 'GAME_OVER') {
        if (musicRef.current) musicRef.current.pause();
        playSound(SOUNDS.VICTORY);
    }
  }, [gameState.phase]);

  useEffect(() => {
      setTimeLeft(TURN_DURATION);
      setIsHourglassFlipped(prev => !prev);
  }, [gameState.currentPlayerIndex]);

  useEffect(() => {
      if (gameState.phase !== 'PLAYING' && gameState.phase !== 'LAST_CHANCE') return;
      if (gameState.phase === 'GAME_OVER') return;
      // Freeze timer if a mini-game is active
      if (MINI_GAME_MODES.includes(interactionMode)) return;

      const timerId = setInterval(() => {
          setTimeLeft(prev => {
              if (prev <= 0) return 0;
              return prev - 1;
          });
      }, 1000);
      return () => clearInterval(timerId);
  }, [gameState.phase, gameState.currentPlayerIndex, interactionMode]);

  useEffect(() => {
      if (timeLeft === 0 && (gameState.phase === 'PLAYING' || gameState.phase === 'LAST_CHANCE')) {
          const currentPlayer = getCurrentPlayer();
          if (currentPlayer) {
            log(`${currentPlayer.name} ran out of time!`);
            playSound(SOUNDS.ERROR);
            nextTurn();
          }
      }
  }, [timeLeft]);

  const toggleMusic = () => setIsMusicMuted(!isMusicMuted);
  const getCurrentPlayer = (): Player | undefined => gameState.players[gameState.currentPlayerIndex];
  const getHandLimit = () => {
    const ageStr = gameState.galiAge.toString();
    return ageStr.split('').reduce((sum, digit) => sum + parseInt(digit), 0);
  };
  useEffect(() => { Object.values(SOUNDS).forEach(url => { const a = new Audio(url); a.preload = 'auto'; }); }, []);

  const initGame = (starterIndex?: number) => {
    const decks = {
      [Suit.Strawberry]: shuffle(generateDeck(Suit.Strawberry)),
      [Suit.Sea]: shuffle(generateDeck(Suit.Sea)),
      [Suit.Paintbrush]: shuffle(generateDeck(Suit.Paintbrush)),
      [Suit.Cat]: shuffle(generateDeck(Suit.Cat)),
    };

    const players: Player[] = Array.from({ length: setupData.playerCount }).map((_, i) => ({
      id: i === 0 ? 'player-human' : `player-ai-${i}`,
      name: i === 0 ? setupData.playerName : `Bot ${i}`,
      isAI: i !== 0,
      hand: [],
      ageBank: [],
      activeDefenseCard: null,
      activePermanentCards: [],
      isEliminated: false,
      skipTurn: false,
      extraTurns: 0
    }));

    const starter = typeof starterIndex === 'number' ? starterIndex : Math.floor(Math.random() * players.length);

    setGameState({
      ...gameState,
      phase: 'PLAYING',
      turnStep: 'ROLL',
      actionsLeft: 0,
      players,
      decks,
      currentPlayerIndex: starter,
      galiAge: setupData.galiAge,
      logs: ['Game Started!'],
      winnerId: null,
      roundsLeftInLastChance: -1
    });
    log(`Game started! ${players[starter].name} goes first.`);
  };

  const nextTurn = () => {
    // Immediate cleanup of UI interaction states to prevent race conditions
    setInteractionMode(InteractionMode.NONE);
    setPendingSelectionCards([]);
    setCat5HandSelection(null);
    setErenSelectedBankCardId(null);
    setStyleSelectedHandCardId(null);
    setReadingTargetId(null);
    setPreviewCard(null);

    setGameState(prev => {
      let currentIndex = prev.currentPlayerIndex;
      let currentPlayer = prev.players[currentIndex];
      let nextIndex = (currentIndex + 1) % prev.players.length;
      let phase = prev.phase;
      let roundsLeft = prev.roundsLeftInLastChance;

      if (currentPlayer.extraTurns > 0) {
          log(`${currentPlayer.name} plays another turn!`);
          return {
              ...prev,
              players: prev.players.map((p, i) => i === currentIndex ? { ...p, extraTurns: p.extraTurns - 1 } : p),
              turnStep: 'ROLL',
              actionsLeft: 0,
          };
      }

      const sums = prev.players.map(p => p.ageBank.reduce((a, c) => a + c.value, 0));
      const currentSum = sums[currentIndex];

      if (phase === 'PLAYING' && currentSum === prev.galiAge) {
          log(`${currentPlayer.name} reached ${prev.galiAge}! Last chance begins.`);
          phase = 'LAST_CHANCE';
          roundsLeft = prev.players.length - 1; 
      }

      if (phase === 'LAST_CHANCE') {
          roundsLeft--;
          if (roundsLeft < 0) {
              // CRITICAL: Strictly check who currently matches the age.
              const winners = prev.players.filter(p => p.ageBank.reduce((a, c) => a + c.value, 0) === prev.galiAge);
              
              if (winners.length > 0) {
                  return { ...prev, phase: 'GAME_OVER', winnerId: winners[0].id };
              }
              
              // If no one matches the age exactly, the win condition was lost. Game continues.
              log("Target age lost! Game continues!");
              phase = 'PLAYING';
              roundsLeft = -1;
          }
      }

      return {
        ...prev,
        currentPlayerIndex: nextIndex,
        phase,
        turnStep: 'ROLL',
        actionsLeft: 0,
        roundsLeftInLastChance: roundsLeft
      };
    });
  };
  
  useEffect(() => {
    if (gameState.phase === 'SETUP' || gameState.phase === 'GAME_OVER') return;
    const player = getCurrentPlayer();
    if (!player) return;
    if (player.skipTurn) {
        log(`${player.name} skips their turn!`);
        setTimeout(() => {
            setGameState(prev => ({
                ...prev,
                players: prev.players.map(p => p.id === player.id ? { ...p, skipTurn: false } : p)
            }));
            nextTurn();
        }, 1000);
    }
  }, [gameState.currentPlayerIndex, gameState.phase]);

  useEffect(() => {
    if (gameState.phase !== 'PLAYING' && gameState.phase !== 'LAST_CHANCE') return;
    if (gameState.turnStep !== 'ACTION') return;
    const player = getCurrentPlayer();
    if (!player) return;
    if (interactionMode !== InteractionMode.NONE) return; 

    if (player.hand.length === 0 && gameState.actionsLeft > 0) {
        log(`${player.name} has no cards left! Turn ends.`);
        const timer = setTimeout(nextTurn, 1000);
        return () => clearTimeout(timer);
    }
  }, [gameState.players, gameState.turnStep, gameState.actionsLeft, gameState.phase, interactionMode]);

  // AI Loop
  useEffect(() => {
    if (gameState.phase !== 'PLAYING' && gameState.phase !== 'LAST_CHANCE') return;
    // Don't act if a mini game is blocking
    if (MINI_GAME_MODES.includes(interactionMode)) return;

    const player = getCurrentPlayer();
    if (!player || !player.isAI || player.skipTurn) return;

    let isEffectMounted = true;
    
    const runAITurn = async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (!isEffectMounted || gameState.phase === 'GAME_OVER') return;
        
        const currentCheck = getCurrentPlayer();
        if (currentCheck?.id !== player.id) return;

        if (gameState.turnStep === 'GOAT_CHALLENGE') { 
            handleGoatDefense(true); 
            return; 
        }

        const move = await getAIAction(gameState, player);
        if (!isEffectMounted || getCurrentPlayer()?.id !== player.id) return;

        if (move.action === 'ROLL') { 
            handleRoll(move.comboChoice); 
        } else if (move.action === 'BANK_CARD' && move.cardId) {
            const card = player.hand.find(c => c.id === move.cardId);
            if (card) handleBankCard(card);
        } else if (move.action === 'PLAY_CARD' && move.cardId) {
            const card = player.hand.find(c => c.id === move.cardId);
            if (card) { handlePlayCard(card, move.cat1Choice, move.targetPlayerId, move.cat3SuitChoice); }
        } else if (move.action === 'END_TURN') { 
            nextTurn(); 
        }
    };

    runAITurn();
    return () => { isEffectMounted = false; };
  }, [gameState.currentPlayerIndex, gameState.phase, gameState.turnStep, gameState.actionsLeft, interactionMode]);

  const drawCard = (suit: Suit, playerIndex: number, specificCount: number = 1): Card[] => {
    const drawnCards: Card[] = [];
    setGameState(prev => {
        const handLimit = getHandLimit();
        const deck = prev.decks[suit];
        let currentDeck = [...deck];
        let currentHand = [...prev.players[playerIndex].hand];
        let updatedDecks = { ...prev.decks };
        for (let k = 0; k < specificCount; k++) {
             if (currentHand.length >= handLimit || currentDeck.length === 0) break;
             const [card, ...rest] = currentDeck;
             currentDeck = rest;
             if (suit === Suit.Cat) {
                 const oldIdx = currentHand.findIndex(c => c.suit === Suit.Cat);
                 if (oldIdx > -1) { updatedDecks[Suit.Cat].push(currentHand[oldIdx]); currentHand.splice(oldIdx, 1); }
             }
             currentHand.push(card);
             drawnCards.push(card);
        }
        updatedDecks[suit] = currentDeck;
        let finalHand = currentHand;
        let finalActive = prev.players[playerIndex].activePermanentCards;
        const hasTamer = finalActive.some(c => c.powerType === CardPowerType.STRAWBERRY_TAMER);
        const galiIdx = finalHand.findIndex(c => c.powerType === CardPowerType.STRAWBERRY_GALI);
        if (hasTamer && galiIdx !== -1) {
             const tamerCard = finalActive.find(c => c.powerType === CardPowerType.STRAWBERRY_TAMER)!;
             const galiCard = finalHand[galiIdx];
             playSound(SOUNDS.MERGE);
             log("TAMER & GALI MERGE!");
             finalActive = finalActive.filter(c => c.id !== tamerCard.id);
             finalHand = finalHand.filter(c => c.id !== galiCard.id);
             updatedDecks[Suit.Strawberry].push(tamerCard, galiCard);
             finalHand.push({
                id: Math.random().toString(36), suit: Suit.Strawberry, value: gameState.galiAge,
                powerType: CardPowerType.GALI_AND_TAMER_BANK, description: "LEGENDARY!", imageUrl: galiCard.imageUrl,
                isDefense: false, name: "Galiandtamercard"
            });
        }
        return {
            ...prev, decks: updatedDecks,
            players: prev.players.map((p, i) => i === playerIndex ? { ...p, hand: finalHand, activePermanentCards: finalActive } : p)
        };
    });
    return drawnCards;
  };

  const handleRoll = (comboChoice?: Suit) => {
    if (isRolling || gameState.turnStep !== 'ROLL') return;
    setIsRolling(true);
    playSound(SOUNDS.ROLL);
    setTimeout(() => {
        if (gameState.phase === 'GAME_OVER') { setIsRolling(false); return; }
        const roll = Math.random();
        let face = DieFace.Strawberry;
        if (roll < 0.16) face = DieFace.Strawberry; else if (roll < 0.32) face = DieFace.Sea;
        else if (roll < 0.48) face = DieFace.Paintbrush; else if (roll < 0.64) face = DieFace.Cat;
        else if (roll < 0.8) face = DieFace.Combo; else face = DieFace.Goat;
        
        setGameState(prev => ({ ...prev, lastDieRoll: face }));
        setIsRolling(false);
        processRollResult(face, comboChoice);
    }, 1000);
  };

  const processRollResult = (face: DieFace, comboChoice?: Suit) => {
      const player = getCurrentPlayer();
      if (!player) return;
      if (face === DieFace.Goat) {
          log("GOAT! Baaah!"); playSound(SOUNDS.GOAT);
          if (player.activePermanentCards.some(c => c.powerType === CardPowerType.STRAWBERRY_RYAN)) {
             if (!player.isAI) { setGameState(prev => ({ ...prev, turnStep: 'GOAT_CHALLENGE' })); } 
             else { useRyanDefense(); }
          } else if (player.activeDefenseCard) { setGameState(prev => ({ ...prev, turnStep: 'GOAT_CHALLENGE' })); } 
          else { log("Turn lost!"); setTimeout(nextTurn, 1000); }
          return;
      }
      let suitToDraw: Suit | null = null;
      if (face === DieFace.Strawberry) suitToDraw = Suit.Strawberry;
      if (face === DieFace.Sea) suitToDraw = Suit.Sea;
      if (face === DieFace.Paintbrush) suitToDraw = Suit.Paintbrush;
      if (face === DieFace.Cat) suitToDraw = Suit.Cat;
      if (face === DieFace.Combo) {
          if (player.isAI) suitToDraw = comboChoice || Suit.Strawberry;
          else { setInteractionMode(InteractionMode.ROLL_COMBO); return; }
      }
      if (suitToDraw) drawCard(suitToDraw, gameState.currentPlayerIndex);
      setGameState(prev => ({ ...prev, turnStep: 'ACTION', actionsLeft: 2 }));
  };

  const useRyanDefense = () => {
      setGameState(prev => {
          const p = prev.players[prev.currentPlayerIndex];
          const ryanCard = p.activePermanentCards.find(c => c.powerType === CardPowerType.STRAWBERRY_RYAN);
          if (!ryanCard) return prev;
          const newActive = p.activePermanentCards.filter(c => c.id !== ryanCard.id);
          const newDecks = { ...prev.decks, [Suit.Strawberry]: [...prev.decks[Suit.Strawberry], ryanCard] };
          return {
              ...prev, turnStep: 'ROLL', actionsLeft: 0, decks: newDecks,
              players: prev.players.map((pl, i) => i === prev.currentPlayerIndex ? { ...pl, activePermanentCards: newActive } : pl),
          };
      });
      log("Ryan saved the day!");
  };

  const handleGoatDefense = (useDefense: boolean) => {
      const player = getCurrentPlayer();
      if (!player) return;
      if (useDefense && player.activeDefenseCard) {
          setGameState(prev => ({
              ...prev, turnStep: 'ROLL', actionsLeft: 0,
              players: prev.players.map((p, i) => i === prev.currentPlayerIndex ? { ...p, activeDefenseCard: null } : p),
              decks: { ...prev.decks, [Suit.Sea]: [...prev.decks[Suit.Sea], player.activeDefenseCard] }
          }));
          log("Blocked by Sea Shield!");
      } else {
          log("Turn lost."); nextTurn();
      }
  };

  const consumeAction = () => {
      setInteractionMode(InteractionMode.NONE);
      setCat5HandSelection(null);
      setErenSelectedBankCardId(null);
      setStyleSelectedHandCardId(null);
      setReadingTargetId(null);
      setPreviewCard(null);
      setGameState(prev => {
          const newActions = prev.actionsLeft - 1;
          if (newActions <= 0) setTimeout(nextTurn, 1000); 
          return { ...prev, actionsLeft: newActions };
      });
  };

  const recycleCard = (card: Card) => {
     setGameState(prev => ({ ...prev, decks: { ...prev.decks, [card.suit]: [...prev.decks[card.suit], card] } }));
  };

  const handleBankCard = (card: Card) => {
      if (gameState.actionsLeft <= 0) return;
      const currentP = getCurrentPlayer();
      if (!currentP || (currentP.id !== 'player-human' && !currentP.isAI)) return;

      setGameState(prev => {
          const p = prev.players[prev.currentPlayerIndex];
          let newBank = [...p.ageBank];
          let newDecks = { ...prev.decks };

          // Rule: Whenever there are two cat cards in an age bank, the newer one stays, the older is discarded
          if (card.suit === Suit.Cat && !card.isPermanentModifier) {
              const oldCatIdx = newBank.findIndex(c => c.suit === Suit.Cat && !c.isPermanentModifier);
              if (oldCatIdx > -1) {
                  const discardedCat = newBank[oldCatIdx];
                  newDecks[Suit.Cat].push(discardedCat);
                  newBank.splice(oldCatIdx, 1);
                  log(`Older cat card replaced!`);
              }
          }

          if (card.powerType === CardPowerType.GALI_AND_TAMER_BANK) {
              p.ageBank.forEach(c => newDecks[c.suit].push(c));
              newBank = [card]; 
              log("LEGENDARY BANK!");
          } else {
              if (newBank.length >= MAX_BANK_SIZE) newBank.shift();
              newBank.push(card);
          }
          const newHand = p.hand.filter(c => c.id !== card.id);
          return { 
              ...prev, decks: newDecks,
              players: prev.players.map((pl, i) => i === prev.currentPlayerIndex ? { ...pl, hand: newHand, ageBank: newBank } : pl),
          };
      });
      consumeAction();
  };

  const handlePirateStealAll = (targetPlayerId: string) => {
      setGameState(prev => {
          const target = prev.players.find(p => p.id === targetPlayerId);
          if (!target || target.ageBank.length === 0) return prev;
          const me = prev.players[prev.currentPlayerIndex];
          const cardsToSteal = [...target.ageBank];
          let newMyBank = [...me.ageBank, ...cardsToSteal];
          if (newMyBank.length > MAX_BANK_SIZE) newMyBank = newMyBank.slice(-MAX_BANK_SIZE);
          return {
            ...prev,
            players: prev.players.map(p => {
              if (p.id === target.id) return { ...p, ageBank: [] };
              if (p.id === me.id) return { ...p, ageBank: newMyBank };
              return p;
            })
          };
      });
      log(`Stealthy pirate stole everything!`);
      consumeAction();
  };

  const handleMakeupTarget = (targetPlayerId: string) => {
      setGameState(prev => ({ ...prev, players: prev.players.map(p => p.id === targetPlayerId ? { ...p, extraTurns: p.extraTurns + 1 } : p) }));
      log("Extra turns assigned!"); consumeAction();
  };

  // --- Start of newly added interaction handlers ---

  /**
   * Steals a random card from an opponent's age bank and adds it to the current player's bank.
   */
  const handlePirateSteal = (targetId: string) => {
    setGameState(prev => {
        const target = prev.players.find(p => p.id === targetId);
        if (!target || target.ageBank.length === 0) return prev;
        const randomIdx = Math.floor(Math.random() * target.ageBank.length);
        const card = target.ageBank[randomIdx];
        const me = prev.players[prev.currentPlayerIndex];
        return {
            ...prev,
            players: prev.players.map(p => {
                if (p.id === targetId) return { ...p, ageBank: p.ageBank.filter(c => c.id !== card.id) };
                if (p.id === me.id) return { ...p, ageBank: [...p.ageBank, card].slice(-MAX_BANK_SIZE) };
                return p;
            })
        };
    });
    log("Stole a random card from bank!");
    consumeAction();
  };

  /**
   * Steals a random card from an opponent's hand and adds it to the current player's hand.
   */
  const handleActingSteal = (targetId: string) => {
    setGameState(prev => {
        const target = prev.players.find(p => p.id === targetId);
        if (!target || target.hand.length === 0) return prev;
        const randomIdx = Math.floor(Math.random() * target.hand.length);
        const card = target.hand[randomIdx];
        const me = prev.players[prev.currentPlayerIndex];
        const handLimit = getHandLimit();
        return {
            ...prev,
            players: prev.players.map(p => {
                if (p.id === targetId) return { ...p, hand: p.hand.filter(c => c.id !== card.id) };
                if (p.id === me.id) {
                    if (p.hand.length < handLimit) return { ...p, hand: [...p.hand, card] };
                    else return p;
                }
                return p;
            })
        };
    });
    log("Stole a random card from hand!");
    consumeAction();
  };

  /**
   * Forces a chosen player to skip their next turn.
   */
  const handleGoatCard = (targetId: string) => {
    setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => p.id === targetId ? { ...p, skipTurn: true } : p)
    }));
    log("Gave a Goat card effect!");
    consumeAction();
  };

  /**
   * Adds a permanent +1 modifier card to an opponent's age bank.
   */
  const handleTeaCard = (targetId: string) => {
    setGameState(prev => {
        const token: Card = { id: Math.random().toString(), suit: Suit.Strawberry, value: 1, powerType: CardPowerType.NONE, description: 'Tea Token', imageUrl: '', isDefense: false, isPermanentModifier: true, name: 'TeaToken' };
        return {
            ...prev,
            players: prev.players.map(p => p.id === targetId ? { ...p, ageBank: [...p.ageBank, token].slice(-MAX_BANK_SIZE) } : p)
        };
    });
    log("Gave a permanent +1 token!");
    consumeAction();
  };

  /**
   * Initiates a trade by selecting an opponent to trade with.
   */
  const handleFriendsTargetSelected = (targetId: string) => {
    setReadingTargetId(targetId);
    setInteractionMode(InteractionMode.STRAWBERRY_FRIENDS_OWN_PICK);
  };

  /**
   * Completes a trade by swapping a chosen hand card with a random card from the target's hand.
   */
  const handleFriendsOwnPickExecute = (cardId: string) => {
      const targetId = readingTargetId;
      if (!targetId) return;
      setGameState(prev => {
          const me = prev.players[prev.currentPlayerIndex];
          const target = prev.players.find(p => p.id === targetId);
          if (!target || target.hand.length === 0) return prev;
          const myCard = me.hand.find(c => c.id === cardId);
          if (!myCard) return prev;
          const randomIdx = Math.floor(Math.random() * target.hand.length);
          const theirCard = target.hand[randomIdx];
          return {
              ...prev,
              players: prev.players.map(p => {
                  if (p.id === me.id) return { ...p, hand: [...p.hand.filter(c => c.id !== cardId), theirCard] };
                  if (p.id === targetId) return { ...p, hand: [...p.hand.filter(c => c.id !== theirCard.id), myCard] };
                  return p;
              })
          };
      });
      log("Traded cards with a friend!");
      consumeAction();
  };

  /**
   * Phase 2 of Baby G power: select which opponent to steal from.
   */
  const handleBabyGStep2 = (targetId: string) => {
    setGameState(prev => ({ ...prev, leaderId: targetId }));
    setInteractionMode(InteractionMode.STRAWBERRY_BABYG_OPP_BANK);
  };

  /**
   * Phase 3 of Baby G power: steal a specific card from the opponent's bank.
   */
  const handleBabyGStep3 = (cardId: string) => {
    setGameState(prev => {
        const target = prev.players.find(p => p.id === prev.leaderId);
        if (!target) return prev;
        const card = target.ageBank.find(c => c.id === cardId);
        if (!card) return prev;
        return {
            ...prev,
            players: prev.players.map(p => {
                if (p.id === prev.leaderId) return { ...p, ageBank: p.ageBank.filter(c => c.id !== cardId) };
                if (p.id === prev.players[prev.currentPlayerIndex].id) return { ...p, ageBank: [...p.ageBank, card].slice(-MAX_BANK_SIZE) };
                return p;
            })
        };
    });
    log("Stole card from bank!");
    consumeAction();
  };

  /**
   * Phase 1 of Eren power: select a card from your own bank to give away.
   */
  const handleErenStep1 = (cardId: string) => {
    setErenSelectedBankCardId(cardId);
    setInteractionMode(InteractionMode.SEA_EREN_TARGET);
  };

  /**
   * Phase 2 of Eren power: select which opponent receives the card from your bank.
   */
  const handleErenStep2 = (targetId: string) => {
    if (!erenSelectedBankCardId) return;
    setGameState(prev => {
        const me = prev.players[prev.currentPlayerIndex];
        const card = me.ageBank.find(c => c.id === erenSelectedBankCardId);
        if (!card) return prev;
        return {
            ...prev,
            players: prev.players.map(p => {
                if (p.id === me.id) return { ...p, ageBank: p.ageBank.filter(c => c.id !== erenSelectedBankCardId) };
                if (p.id === targetId) return { ...p, ageBank: [...p.ageBank, card].slice(-MAX_BANK_SIZE) };
                return p;
            })
        };
    });
    log("Gave card from bank!");
    consumeAction();
  };

  /**
   * Phase 1 of Style power: select a card from your hand to give away.
   */
  const handleStyleStep1 = (cardId: string) => {
    setStyleSelectedHandCardId(cardId);
    setInteractionMode(InteractionMode.PAINTBRUSH_STYLE_TARGET);
  };

  /**
   * Phase 2 of Style power: select which opponent receives the card from your hand.
   */
  const handleStyleStep2 = (targetId: string) => {
    if (!styleSelectedHandCardId) return;
    setGameState(prev => {
        const me = prev.players[prev.currentPlayerIndex];
        const card = me.hand.find(c => c.id === styleSelectedHandCardId);
        if (!card) return prev;
        return {
            ...prev,
            players: prev.players.map(p => {
                if (p.id === me.id) return { ...p, hand: p.hand.filter(c => c.id !== styleSelectedHandCardId) };
                if (p.id === targetId) return { ...p, hand: [...p.hand, card] };
                return p;
            })
        };
    });
    log("Gave card from hand!");
    consumeAction();
  };

  /**
   * Phase 1 of Reading power: select which opponent's bank to remove a card from.
   */
  const handleReadingStep1 = (targetId: string) => {
    setReadingTargetId(targetId);
    setInteractionMode(InteractionMode.PAINTBRUSH_READING_BANK_PICK);
  };

  /**
   * Phase 2 of Reading power: select a specific card from the opponent's bank to discard.
   */
  const handleReadingStep2 = (cardId: string) => {
    setGameState(prev => {
        const target = prev.players.find(p => p.id === readingTargetId);
        if (!target) return prev;
        const card = target.ageBank.find(c => c.id === cardId);
        if (!card) return prev;
        return {
            ...prev,
            decks: { ...prev.decks, [card.suit]: [...prev.decks[card.suit], card] },
            players: prev.players.map(p => p.id === readingTargetId ? { ...p, ageBank: p.ageBank.filter(c => c.id !== cardId) } : p)
        };
    });
    log("Removed card from bank!");
    consumeAction();
  };

  /**
   * Handles drawing from specific decks during multi-step card powers or choice rolls.
   */
  const handleDeckSelect = (suit: Suit) => {
    const playerIdx = gameState.currentPlayerIndex;
    if (interactionMode === InteractionMode.CAT3_DECK) {
        drawCard(suit, playerIdx, 2);
    } else if (interactionMode === InteractionMode.SEA_MINE_DECK || interactionMode === InteractionMode.PAINTBRUSH_RAIN_DECK) {
        if (suit === Suit.Cat) {
             // Shake visual effect or user feedback could go here, but prompt says "not be able to choose".
             // We'll just return and not consume action.
             log("Cannot choose Cat deck!");
             return;
        }
        drawCard(suit, playerIdx, 1);
        consumeAction();
        return;
    } else if (interactionMode === InteractionMode.SEA_SIMS_DECK_1 || interactionMode === InteractionMode.PAINTBRUSH_RIDE_DECK_1) {
        drawCard(suit, playerIdx, 1);
        setInteractionMode(interactionMode === InteractionMode.SEA_SIMS_DECK_1 ? InteractionMode.SEA_SIMS_DECK_2 : InteractionMode.PAINTBRUSH_RIDE_DECK_2);
        return; // Wait for second deck choice
    } else if (interactionMode === InteractionMode.SEA_SIMS_DECK_2 || interactionMode === InteractionMode.PAINTBRUSH_RIDE_DECK_2) {
        drawCard(suit, playerIdx, 1);
    } else {
        return;
    }
    consumeAction();
  };

  /**
   * Finalizes the choice between multiple cards (e.g., from Forestcard or Fridaycard).
   */
  const handleForestFridayPick = (cardId: string) => {
    const pickedCard = pendingSelectionCards.find(c => c.id === cardId);
    if (!pickedCard) return;
    const otherCard = pendingSelectionCards.find(c => c.id !== cardId);
    setGameState(prev => {
        const playerIdx = prev.currentPlayerIndex;
        let newHand = [...prev.players[playerIdx].hand, pickedCard];
        let newDecks = { ...prev.decks };
        if (otherCard) newDecks[otherCard.suit].push(otherCard);
        return {
            ...prev,
            decks: newDecks,
            players: prev.players.map((p, i) => i === playerIdx ? { ...p, hand: newHand } : p)
        };
    });
    log("Selected card.");
    consumeAction();
  };

  // --- End of newly added interaction handlers ---

  const handlePlayCard = (card: Card, aiCat1Val?: number, aiTargetId?: string, aiCat3Suit?: Suit) => {
      const currentPlayer = getCurrentPlayer();
      if (!currentPlayer || gameState.actionsLeft <= 0) return;
      if (gameState.players[gameState.currentPlayerIndex].id !== userPlayer.id && !currentPlayer.isAI) return;

      log(`${currentPlayer.name} played ${card.name || card.suit}!`);
      if (card.suit === Suit.Cat) playSound(SOUNDS.CAT);
      if (card.suit === Suit.Strawberry) playSound(SOUNDS.YUMMY);
      
      setGameState(prev => ({ ...prev, players: prev.players.map((p, i) => i === prev.currentPlayerIndex ? { ...p, hand: p.hand.filter(c => c.id !== card.id) } : p) }));
      const isPersistent = [CardPowerType.STRAWBERRY_RYAN, CardPowerType.STRAWBERRY_TAMER, CardPowerType.DEFENSE, CardPowerType.CAT_6_DEFENSE].includes(card.powerType);
      const isSeaDefense = (card.suit === Suit.Sea && card.powerType === CardPowerType.NONE);
      if (!isPersistent && !isSeaDefense && card.powerType !== CardPowerType.CAT_4_GIVE_MINUS_5) recycleCard(card);

      if (card.powerType === CardPowerType.EXTRA_TURN || card.powerType === CardPowerType.STRAWBERRY_EPE || card.powerType === CardPowerType.SEA_RUPAUL || card.powerType === CardPowerType.PAINTBRUSH_PAINT || card.powerType === CardPowerType.STRAWBERRY_PARENTS) {
          setGameState(prev => ({ ...prev, turnStep: 'ROLL', actionsLeft: 0 })); return;
      }
      if (card.powerType === CardPowerType.DEFENSE || card.powerType === CardPowerType.CAT_6_DEFENSE || isSeaDefense) {
          setGameState(prev => ({ ...prev, players: prev.players.map((p, i) => i === prev.currentPlayerIndex ? { ...p, activeDefenseCard: card } : p) }));
          consumeAction(); return;
      }

      switch (card.powerType) {
          case CardPowerType.SEA_SINGERS: case CardPowerType.PAINTBRUSH_MUSIC:
              drawCard(Suit.Strawberry, gameState.currentPlayerIndex); drawCard(Suit.Sea, gameState.currentPlayerIndex); drawCard(Suit.Paintbrush, gameState.currentPlayerIndex); consumeAction(); return;
          case CardPowerType.SEA_MINE: setInteractionMode(InteractionMode.SEA_MINE_GAME); return;
          case CardPowerType.SEA_PIRATE: setInteractionMode(InteractionMode.SEA_PIRATE_GAME); return;
          case CardPowerType.SEA_ISAAC: setInteractionMode(InteractionMode.SEA_ISAAC_GAME); return;
          case CardPowerType.SEA_MARIO: setInteractionMode(InteractionMode.SEA_MARIO_GAME); return;
          case CardPowerType.PAINTBRUSH_SCENT: drawCard(Suit.Sea, gameState.currentPlayerIndex); consumeAction(); return;
          case CardPowerType.PAINTBRUSH_VIDEO:
              if (currentPlayer.isAI) {
                  const target = gameState.players.find(p => p.id !== currentPlayer.id && p.ageBank.length > 0);
                  if (target) handlePirateSteal(target.id); else consumeAction();
              } else setInteractionMode(InteractionMode.PAINTBRUSH_VIDEO_TARGET);
              return;
          case CardPowerType.SEA_SIMS: case CardPowerType.PAINTBRUSH_RIDE:
              if (currentPlayer.isAI) { drawCard(Suit.Strawberry, gameState.currentPlayerIndex); drawCard(Suit.Paintbrush, gameState.currentPlayerIndex); consumeAction(); } 
              else { setInteractionMode(card.powerType === CardPowerType.SEA_SIMS ? InteractionMode.SEA_SIMS_DECK_1 : InteractionMode.PAINTBRUSH_RIDE_DECK_1); } return;
          case CardPowerType.PAINTBRUSH_NATURE: case CardPowerType.SEA_KAPIT:
              setGameState(prev => {
                  const token: Card = { id: Math.random().toString(), suit: card.suit, value: 1, powerType: CardPowerType.NONE, description: 'Power Token', imageUrl: '', isDefense: false, isPermanentModifier: true, name: 'Token' };
                  return { ...prev, players: prev.players.map((p, i) => i === prev.currentPlayerIndex ? { ...p, ageBank: [...p.ageBank, token] } : p) };
              }); consumeAction(); return;
          case CardPowerType.SEA_PAPA: case CardPowerType.PAINTBRUSH_SING:
              drawCard(Suit.Paintbrush, gameState.currentPlayerIndex); consumeAction(); return;
          case CardPowerType.PAINTBRUSH_COOK:
              drawCard(Suit.Strawberry, gameState.currentPlayerIndex); consumeAction(); return;
          case CardPowerType.PAINTBRUSH_RAIN:
              if (currentPlayer.isAI) {
                  const availableSuits = [Suit.Strawberry, Suit.Sea, Suit.Paintbrush]; // AI picks from valid suits
                  const randomSuit = availableSuits[Math.floor(Math.random() * availableSuits.length)];
                  drawCard(randomSuit, gameState.currentPlayerIndex);
                  consumeAction();
              } else {
                  setInteractionMode(InteractionMode.PAINTBRUSH_RAIN_DECK);
              }
              return;
          case CardPowerType.SEA_EREN:
              if (currentPlayer.isAI) { if (currentPlayer.ageBank.length > 0) { const target = gameState.players.find(p => p.id !== currentPlayer.id); if (target) { const cardToGive = currentPlayer.ageBank[0]; setGameState(prev => ({ ...prev, players: prev.players.map(p => p.id === currentPlayer.id ? { ...p, ageBank: p.ageBank.filter(c => c.id !== cardToGive.id) } : (p.id === target.id ? { ...p, ageBank: [...p.ageBank, cardToGive].slice(-MAX_BANK_SIZE) } : p)) })); } } consumeAction(); } 
              else { setInteractionMode(InteractionMode.SEA_EREN_OWN_BANK); } return;
          case CardPowerType.SEA_PYRA: drawCard(Suit.Sea, gameState.currentPlayerIndex); consumeAction(); return;
          case CardPowerType.PAINTBRUSH_MAKEUP:
              if (currentPlayer.isAI) { const t = gameState.players.find(p => p.id !== currentPlayer.id); if (t) handleMakeupTarget(t.id); else consumeAction(); } else setInteractionMode(InteractionMode.PAINTBRUSH_MAKEUP_TARGET); return;
          case CardPowerType.PAINTBRUSH_STYLE:
              if (currentPlayer.isAI) { if (currentPlayer.hand.length > 0) { const t = gameState.players.find(p => p.id !== currentPlayer.id); if (t) { const c = currentPlayer.hand[0]; setGameState(prev => ({ ...prev, players: prev.players.map(p => p.id === currentPlayer.id ? { ...p, hand: p.hand.slice(1) } : (p.id === t.id ? { ...p, hand: [...p.hand, c] } : p)) })); } } consumeAction(); } 
              else setInteractionMode(InteractionMode.PAINTBRUSH_STYLE_HAND_PICK); return;
          case CardPowerType.PAINTBRUSH_ACTING:
              if (currentPlayer.isAI) { const t = gameState.players.find(p => p.id !== currentPlayer.id && p.hand.length > 0); if (t) handleActingSteal(t.id); else consumeAction(); } else setInteractionMode(InteractionMode.PAINTBRUSH_ACTING_TARGET); return;
          case CardPowerType.PAINTBRUSH_READING:
              if (currentPlayer.isAI) { 
                const t = gameState.players.find(p => p.id !== currentPlayer.id && p.ageBank.length > 0); 
                if (t) { 
                    const c = t.ageBank[0]; 
                    setGameState(prev => ({ 
                        ...prev, 
                        decks: { ...prev.decks, [c.suit]: [...prev.decks[c.suit], c] }, 
                        players: prev.players.map(p => p.id === t.id ? { ...p, ageBank: p.ageBank.filter(card => card.id !== c.id) } : p) 
                    })); 
                } 
                consumeAction(); 
              } 
              else setInteractionMode(InteractionMode.PAINTBRUSH_READING_TARGET); return;
          case CardPowerType.STRAWBERRY_BABYG:
              if (currentPlayer.isAI) { const valid = gameState.players.filter(p => p.id !== currentPlayer.id && p.ageBank.length > 0); if (valid.length > 0) { const t = valid[0]; const stolen = t.ageBank[0]; setGameState(prev => ({ ...prev, players: prev.players.map(p => p.id === t.id ? { ...p, ageBank: p.ageBank.slice(1) } : (p.id === currentPlayer.id ? { ...p, ageBank: [...p.ageBank, stolen].slice(-MAX_BANK_SIZE) } : p)) })); } consumeAction(); } 
              else setInteractionMode(InteractionMode.STRAWBERRY_BABYG_OPP_PLAYER); return;
          case CardPowerType.STRAWBERRY_MIGUEL: drawCard(Suit.Strawberry, gameState.currentPlayerIndex); consumeAction(); return;
          case CardPowerType.STRAWBERRY_GOAT: if (currentPlayer.isAI) { const t = gameState.players.find(p => p.id !== currentPlayer.id && !p.skipTurn); if (t) handleGoatCard(t.id); else consumeAction(); } else setInteractionMode(InteractionMode.STRAWBERRY_GOAT_TARGET); return;
          case CardPowerType.STRAWBERRY_TEA: if (currentPlayer.isAI) { const t = gameState.players.find(p => p.id !== currentPlayer.id); if (t) handleTeaCard(t.id); else consumeAction(); } else setInteractionMode(InteractionMode.STRAWBERRY_TEA_TARGET); return;
          case CardPowerType.STRAWBERRY_FOREST: 
              if (currentPlayer.isAI) { 
                  const pb = gameState.decks[Suit.Paintbrush]; 
                  if (pb.length >= 1) drawCard(Suit.Paintbrush, gameState.currentPlayerIndex); 
                  consumeAction(); 
              } else { 
                  const pb = gameState.decks[Suit.Paintbrush]; 
                  if (pb.length >= 2) { 
                      setPendingSelectionCards(pb.slice(0, 2)); 
                      setGameState(prev => ({...prev, decks: {...prev.decks, [Suit.Paintbrush]: pb.slice(2)}})); 
                      setInteractionMode(InteractionMode.STRAWBERRY_FOREST_PICK); 
                  } else if (pb.length === 1) {
                      drawCard(Suit.Paintbrush, gameState.currentPlayerIndex);
                      consumeAction();
                  } else consumeAction(); 
              } 
              return;
          case CardPowerType.STRAWBERRY_FRIENDS: if (currentPlayer.isAI) consumeAction(); else setInteractionMode(InteractionMode.STRAWBERRY_FRIENDS_TARGET); return;
          case CardPowerType.STRAWBERRY_FAMILY: drawCard(Suit.Paintbrush, gameState.currentPlayerIndex); drawCard(Suit.Sea, gameState.currentPlayerIndex); consumeAction(); return;
          case CardPowerType.STRAWBERRY_RYAN: setGameState(prev => ({ ...prev, players: prev.players.map((p, i) => i === prev.currentPlayerIndex ? { ...p, activePermanentCards: [...p.activePermanentCards, card] } : p) })); consumeAction(); return;
          case CardPowerType.STRAWBERRY_FRIDAY: if (currentPlayer.isAI) consumeAction(); else { if (gameState.decks[Suit.Strawberry].length > 0 && gameState.decks[Suit.Paintbrush].length > 0) { setPendingSelectionCards([gameState.decks[Suit.Strawberry][0], gameState.decks[Suit.Paintbrush][0]]); setGameState(prev => ({...prev, decks: {...prev.decks, [Suit.Strawberry]: prev.decks[Suit.Strawberry].slice(1), [Suit.Paintbrush]: prev.decks[Suit.Paintbrush].slice(1)}})); setInteractionMode(InteractionMode.STRAWBERRY_FRIDAY_PICK); } else consumeAction(); } return;
          case CardPowerType.STRAWBERRY_GALI: drawCard(Suit.Cat, gameState.currentPlayerIndex); setGameState(prev => ({ ...prev, turnStep: 'ROLL', actionsLeft: 0 })); return;
          case CardPowerType.STRAWBERRY_TAMER: setGameState(prev => ({ ...prev, players: prev.players.map((p, i) => i === prev.currentPlayerIndex ? { ...p, activePermanentCards: [...p.activePermanentCards, card] } : p) })); consumeAction(); return;
          case CardPowerType.CAT_1_MINUS_AGE: if (currentPlayer.isAI) { const needed = gameState.galiAge - (currentPlayer.ageBank.reduce((a,c)=>a+c.value,0)); const val = Math.max(-10, Math.min(-1, needed)); handleCat1Submit(val); } else setInteractionMode(InteractionMode.CAT1_VALUE); break;
          case CardPowerType.CAT_2_REMOVE_BANK: if (currentPlayer.isAI) { if (currentPlayer.ageBank.length > 0) handleCat2Submit(currentPlayer.ageBank[0].id); else consumeAction(); } else setInteractionMode(InteractionMode.CAT2_BANK_TARGET); break;
          case CardPowerType.CAT_3_DRAW_TWO_SELECT: if (currentPlayer.isAI) { drawCard(Suit.Strawberry, gameState.currentPlayerIndex, 2); consumeAction(); } else setInteractionMode(InteractionMode.CAT3_DECK); break;
          case CardPowerType.CAT_4_GIVE_MINUS_5: if (currentPlayer.isAI) { const t = gameState.players.find(p => p.id !== currentPlayer.id); if (t) handleCat4Submit(t.id, ''); else consumeAction(); } else setInteractionMode(InteractionMode.CAT4_TARGET); break;
          case CardPowerType.CAT_5_SWAP_HAND_BANK: setInteractionMode(InteractionMode.CAT5_SWAP); break;
          case CardPowerType.CAT_7_STEAL_PERMANENT: if (currentPlayer.isAI) consumeAction(); else setInteractionMode(InteractionMode.CAT7_TARGET); break;
          case CardPowerType.CAT_8_DISCARD_OPP_HAND: if (currentPlayer.isAI) { const t = gameState.players.find(p => p.id !== currentPlayer.id && p.hand.length > 0); if (t) handleCat8Submit(t.id); else consumeAction(); } else setInteractionMode(InteractionMode.CAT8_TARGET); break;
          case CardPowerType.SEA_MARCUS: if (currentPlayer.isAI) { const t = gameState.players.find(p => p.id !== currentPlayer.id && !p.skipTurn); if (t) handleGoatCard(t.id); else consumeAction(); } else setInteractionMode(InteractionMode.SEA_MARCUS_TARGET); return;
          case CardPowerType.SEA_HUNTER: 
          case CardPowerType.SEA_OTGW:
              drawCard(Suit.Cat, gameState.currentPlayerIndex); consumeAction(); return;
          case CardPowerType.STRAWBERRY_HAGEFEN: drawCard(Suit.Strawberry, gameState.currentPlayerIndex); drawCard(Suit.Sea, gameState.currentPlayerIndex); drawCard(Suit.Paintbrush, gameState.currentPlayerIndex); drawCard(Suit.Cat, gameState.currentPlayerIndex); consumeAction(); return;
          case CardPowerType.PAINTBRUSH_TENBIS: drawCard(Suit.Strawberry, gameState.currentPlayerIndex, 2); consumeAction(); return;
          case CardPowerType.PAINTBRUSH_COFFEE: drawCard(Suit.Cat, gameState.currentPlayerIndex); consumeAction(); return;
          default: consumeAction();
      }
  };

  const handleCat1Submit = (val: number) => {
      setGameState(prev => { 
          const tokenCard: Card = { id: Math.random().toString(36), suit: Suit.Cat, value: val, powerType: CardPowerType.NONE, description: '', imageUrl: '', isDefense: false, isPermanentModifier: true, name: 'cat1-effect' }; 
          return { ...prev, players: prev.players.map((pl, i) => i === prev.currentPlayerIndex ? { ...pl, ageBank: [...pl.ageBank, tokenCard].slice(-MAX_BANK_SIZE) } : pl) }; 
      }); consumeAction();
  };
  const handleCat2Submit = (bankCardId: string) => {
      setGameState(prev => { const p = prev.players[prev.currentPlayerIndex]; const card = p.ageBank.find(c => c.id === bankCardId); if (!card || card.isPermanentModifier) return prev; return { ...prev, decks: { ...prev.decks, [card.suit]: [...prev.decks[card.suit], card] }, players: prev.players.map((pl, i) => i === prev.currentPlayerIndex ? { ...pl, ageBank: pl.ageBank.filter(c => c.id !== bankCardId) } : pl) }; }); consumeAction();
  };
  const handleCat4Submit = (targetId: string, _: string) => {
      const card: Card = { id: Math.random().toString(36), suit: Suit.Cat, value: -5, powerType: CardPowerType.NONE, description: '', imageUrl: '', isDefense: false, name: 'cat4' };
      setGameState(prev => ({ ...prev, players: prev.players.map(p => p.id === targetId ? { ...p, ageBank: [...p.ageBank, card].slice(-MAX_BANK_SIZE) } : p) })); consumeAction();
  };
  const handleCat5Submit = (bankCardId: string) => {
     if (!cat5HandSelection) return;
     setGameState(prev => { const p = prev.players[prev.currentPlayerIndex]; const handC = p.hand.find(c => c.id === cat5HandSelection); const bankC = p.ageBank.find(c => c.id === bankCardId); if (!handC || !bankC) return prev; return { ...prev, players: prev.players.map((pl, i) => i === prev.currentPlayerIndex ? { ...pl, hand: [...pl.hand.filter(c => c.id !== cat5HandSelection), bankC], ageBank: [...pl.ageBank.filter(c => c.id !== bankCardId), handC] } : pl) }; }); consumeAction();
  };
  const handleCat7Submit = (targetId: string) => {
      setGameState(prev => { const t = prev.players.find(p => p.id === targetId); if (!t) return prev; const idx = t.ageBank.findIndex(c => c.isPermanentModifier); if (idx === -1) return prev; const card = t.ageBank[idx]; return { ...prev, players: prev.players.map(p => p.id === targetId ? { ...p, ageBank: p.ageBank.filter((_,i)=>i!==idx) } : (p.id === prev.players[prev.currentPlayerIndex].id ? { ...p, ageBank: [...p.ageBank, card].slice(-MAX_BANK_SIZE) } : p)) }; }); consumeAction();
  };
  const handleCat8Submit = (targetId: string) => {
      setGameState(prev => { const t = prev.players.find(p => p.id === targetId); if (!t) return prev; const newDecks = { ...prev.decks }; t.hand.forEach(c => newDecks[c.suit].push(c)); return { ...prev, decks: newDecks, players: prev.players.map(p => p.id === targetId ? { ...p, hand: [] } : p) }; }); consumeAction();
  };

  const handleTargetClick = (p: Player) => {
      if (interactionMode === InteractionMode.CAT4_TARGET) handleCat4Submit(p.id, '');
      else if (interactionMode === InteractionMode.CAT8_TARGET) handleCat8Submit(p.id);
      else if (interactionMode === InteractionMode.CAT7_TARGET) handleCat7Submit(p.id);
      else if (interactionMode === InteractionMode.STRAWBERRY_GOAT_TARGET) handleGoatCard(p.id);
      else if (interactionMode === InteractionMode.STRAWBERRY_TEA_TARGET) handleTeaCard(p.id);
      else if (interactionMode === InteractionMode.STRAWBERRY_FRIENDS_TARGET) handleFriendsTargetSelected(p.id);
      else if (interactionMode === InteractionMode.STRAWBERRY_BABYG_OPP_PLAYER && p.ageBank.length > 0) handleBabyGStep2(p.id);
      else if (interactionMode === InteractionMode.SEA_PIRATE_TARGET || interactionMode === InteractionMode.PAINTBRUSH_VIDEO_TARGET) handlePirateSteal(p.id);
      else if (interactionMode === InteractionMode.SEA_EREN_TARGET) handleErenStep2(p.id);
      else if (interactionMode === InteractionMode.PAINTBRUSH_MAKEUP_TARGET) handleMakeupTarget(p.id);
      else if (interactionMode === InteractionMode.PAINTBRUSH_STYLE_TARGET) handleStyleStep2(p.id);
      else if (interactionMode === InteractionMode.PAINTBRUSH_ACTING_TARGET) handleActingSteal(p.id);
      else if (interactionMode === InteractionMode.PAINTBRUSH_READING_TARGET) handleReadingStep1(p.id);
      else if (interactionMode === InteractionMode.SEA_PIRATE_STEAL_TARGET) handlePirateStealAll(p.id);
      else if (interactionMode === InteractionMode.SEA_MARCUS_TARGET) handleGoatCard(p.id);
  };

  const isTargetMode = [
      InteractionMode.CAT4_TARGET, InteractionMode.CAT8_TARGET, InteractionMode.CAT7_TARGET, InteractionMode.STRAWBERRY_GOAT_TARGET, 
      InteractionMode.STRAWBERRY_TEA_TARGET, InteractionMode.STRAWBERRY_FRIENDS_TARGET, InteractionMode.STRAWBERRY_BABYG_OPP_PLAYER, 
      InteractionMode.SEA_PIRATE_TARGET, InteractionMode.SEA_EREN_TARGET, InteractionMode.PAINTBRUSH_VIDEO_TARGET, 
      InteractionMode.PAINTBRUSH_MAKEUP_TARGET, InteractionMode.PAINTBRUSH_STYLE_TARGET, InteractionMode.PAINTBRUSH_ACTING_TARGET, InteractionMode.PAINTBRUSH_READING_TARGET,
      InteractionMode.SEA_PIRATE_STEAL_TARGET, InteractionMode.SEA_MARCUS_TARGET
  ].includes(interactionMode);

  const isDeckSelectMode = [
      InteractionMode.CAT3_DECK, InteractionMode.SEA_MINE_DECK, InteractionMode.SEA_SIMS_DECK_1, InteractionMode.SEA_SIMS_DECK_2,
      InteractionMode.PAINTBRUSH_RAIN_DECK, InteractionMode.PAINTBRUSH_RIDE_DECK_1, InteractionMode.PAINTBRUSH_RIDE_DECK_2
  ].includes(interactionMode);

  const isCardPickMode = [
      InteractionMode.STRAWBERRY_FOREST_PICK,
      InteractionMode.STRAWBERRY_FRIDAY_PICK
  ].includes(interactionMode);

  const isCardPowerUsable = (card: Card): boolean => {
      if (!isMyTurn || gameState.turnStep !== 'ACTION' || gameState.actionsLeft <= 0) return false;
      if (card.powerType === CardPowerType.GALI_AND_TAMER_BANK) return false;
      const opponentsWithBankCards = gameState.players.filter(p => p.id !== userPlayer.id && p.ageBank.length > 0);
      const opponentsWithHandCards = gameState.players.filter(p => p.id !== userPlayer.id && p.hand.length > 0);
      const activeOpponents = gameState.players.filter(p => p.id !== userPlayer.id && !p.skipTurn);

      switch (card.powerType) {
          case CardPowerType.STRAWBERRY_BABYG:
          case CardPowerType.SEA_PIRATE:
          case CardPowerType.PAINTBRUSH_VIDEO:
          case CardPowerType.PAINTBRUSH_READING:
              return opponentsWithBankCards.length > 0;
          case CardPowerType.CAT_8_DISCARD_OPP_HAND:
          case CardPowerType.PAINTBRUSH_ACTING:
              return opponentsWithHandCards.length > 0;
          case CardPowerType.CAT_2_REMOVE_BANK:
              return userPlayer.ageBank.some(c => !c.isPermanentModifier);
          case CardPowerType.CAT_5_SWAP_HAND_BANK:
              return userPlayer.ageBank.length > 0 && userPlayer.hand.length > 0;
          case CardPowerType.SEA_EREN:
              return userPlayer.ageBank.length > 0;
          case CardPowerType.CAT_7_STEAL_PERMANENT:
              return gameState.players.some(p => p.id !== userPlayer.id && p.ageBank.some(c => c.isPermanentModifier));
          case CardPowerType.PAINTBRUSH_COFFEE:
          case CardPowerType.SEA_OTGW:
              return gameState.decks[Suit.Cat].length > 0;
          case CardPowerType.SEA_MARCUS:
          case CardPowerType.STRAWBERRY_GOAT:
              return activeOpponents.length > 0;
          default:
              return true;
      }
  };

  const YellingBubble = ({ text }: { text: string | number }) => (
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-[55] animate-bounce">
      <div className="relative bg-white border-2 border-red-500 rounded-2xl px-4 py-1 shadow-lg">
        <span className="text-red-600 font-black text-xl italic whitespace-nowrap">{text}!</span>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white"></div>
        <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-red-500 -z-10"></div>
      </div>
    </div>
  );

  // --- Revised Mini Game Components ---

  const ClickerRaceGame = ({ title, icon, onWin, buttonLabel, bgClass, secondaryIcon }: { title: string, icon: React.ReactNode, onWin: (winnerIdx: number) => void, buttonLabel: string, bgClass: string, secondaryIcon?: React.ReactNode }) => {
    const [clicks, setClicks] = useState<number[]>(gameState.players.map(() => 0));
    const [winnerIdx, setWinnerIdx] = useState<number | null>(null);

    // Bots clicking logic
    useEffect(() => {
        if (winnerIdx !== null) return;
        const botTimer = setInterval(() => {
            setClicks(prev => {
                const next = [...prev];
                gameState.players.forEach((p, i) => {
                    if (p.isAI && Math.random() > 0.7) {
                        next[i] = Math.min(20, next[i] + 1);
                    }
                });
                const win = next.findIndex(c => c >= 20);
                if (win > -1) {
                    setWinnerIdx(win);
                    clearInterval(botTimer);
                    setTimeout(() => onWin(win), 2000);
                }
                return next;
            });
        }, 300);
        return () => clearInterval(botTimer);
    }, [winnerIdx]);

    const handleHumanClick = () => {
        if (winnerIdx !== null) return;
        setClicks(prev => {
            const next = [...prev];
            next[gameState.currentPlayerIndex] = Math.min(20, next[gameState.currentPlayerIndex] + 1);
            if (next[gameState.currentPlayerIndex] >= 20) {
                setWinnerIdx(gameState.currentPlayerIndex);
                setTimeout(() => onWin(gameState.currentPlayerIndex), 2000);
            }
            return next;
        });
    };

    return (
      <div className={`${bgClass} p-8 rounded-[3rem] shadow-2xl border-8 w-[95%] md:w-full max-w-lg text-white overflow-hidden relative scale-90 md:scale-100`}>
        {secondaryIcon && (
            <div className="absolute inset-0 opacity-10 flex flex-wrap gap-12 p-4 pointer-events-none">
                {Array.from({length: 20}).map((_, i) => <div key={i}>{secondaryIcon}</div>)}
            </div>
        )}
        <h2 className="text-3xl font-black text-center mb-8 uppercase italic tracking-tighter">{title}</h2>
        <div className="space-y-6 mb-8">
          {gameState.players.map((p, i) => (
            <div key={p.id} className="relative h-12 bg-black/40 rounded-full overflow-hidden border-2 border-white/20">
              <div className="absolute left-0 top-0 h-full bg-yellow-400 transition-all duration-100" style={{ width: `${(clicks[i] / 20) * 100}%` }}></div>
              <div className="absolute inset-0 flex items-center justify-between px-4 font-black uppercase text-xs">
                <span>{p.name} {icon}</span>
                <span>{clicks[i]}/20</span>
              </div>
            </div>
          ))}
        </div>
        {winnerIdx === null ? (
          <button 
            onClick={handleHumanClick} 
            className="w-full bg-white text-black p-6 rounded-3xl font-black text-2xl shadow-xl active:scale-95 transition-transform"
          >
            {buttonLabel}!
          </button>
        ) : (
          <div className="text-center animate-bounce text-2xl font-black text-yellow-400">
            {gameState.players[winnerIdx].name} Wins!
          </div>
        )}
      </div>
    );
  };

  const SurvivalGame = ({ type, onWin, onLose }: { type: 'ISAAC' | 'MINE', onWin: () => void, onLose: () => void }) => {
    // Enemy: id, angle (deg), distance (0-100)
    const [enemies, setEnemies] = useState<{id: string, angle: number, distance: number}[]>([]);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const KILLS_NEEDED = 15;
    const SPAWN_RATE = 800;
    const MOVE_SPEED = 5; // Increased speed for challenge

    // Spawner
    useEffect(() => {
        if (gameOver) return;
        const interval = setInterval(() => {
            const angle = Math.floor(Math.random() * 360);
            setEnemies(prev => [...prev, { id: Math.random().toString(), angle, distance: 100 }]);
        }, SPAWN_RATE);
        return () => clearInterval(interval);
    }, [gameOver]);

    // Mover
    useEffect(() => {
        if (gameOver) return;
        const interval = setInterval(() => {
            setEnemies(prev => {
                const next = prev.map(e => ({ ...e, distance: e.distance - MOVE_SPEED }));
                // Check collision
                if (next.some(e => e.distance <= 5)) {
                    setGameOver(true);
                    onLose();
                }
                return next;
            });
        }, 100);
        return () => clearInterval(interval);
    }, [gameOver, onLose]);

    const handleAction = () => {
        if (gameOver) return;
        // Find closest enemy
        setEnemies(prev => {
            if (prev.length === 0) return prev;
            // Sort by distance ascending
            const sorted = [...prev].sort((a, b) => a.distance - b.distance);
            const remaining = sorted.slice(1); // Remove closest
            
            const newScore = score + 1;
            setScore(newScore);
            if (newScore >= KILLS_NEEDED) {
                setGameOver(true);
                onWin();
            }
            return remaining;
        });
    };

    const isIsaac = type === 'ISAAC';
    
    return (
        <div className={`p-8 rounded-[3rem] shadow-2xl border-8 w-[95%] md:w-full max-w-lg text-white relative overflow-hidden h-[400px] md:h-[500px] flex flex-col scale-90 md:scale-100 ${isIsaac ? 'bg-red-950 border-red-900' : 'bg-green-900 border-green-700'}`}>
             {/* Background Pattern for Mine */}
             {!isIsaac && (
                 <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(cyan 3px, transparent 3px)', backgroundSize: '24px 24px' }}></div>
             )}

             <h2 className={`text-3xl font-black text-center mb-4 uppercase italic tracking-tighter z-10 ${isIsaac ? 'text-red-500' : 'text-green-400'}`}>
                 {isIsaac ? "Isaac's Challenge" : "Mine Combat"}
             </h2>
             
             {/* Game Area */}
             <div className="flex-1 relative border-4 border-white/10 rounded-3xl bg-black/20 overflow-hidden mb-4">
                 {/* Player Center */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                     {isIsaac ? (
                         <div className="w-12 h-12 bg-pink-300 rounded-full border-4 border-pink-400 relative shadow-[0_0_15px_rgba(249,168,212,0.6)]">
                             <div className="absolute top-3 left-2 w-2 h-2 bg-blue-400 rounded-full animate-blink" />
                             <div className="absolute top-3 right-2 w-2 h-2 bg-blue-400 rounded-full animate-blink" />
                         </div>
                     ) : (
                         <div className="w-12 h-12 bg-blue-500 border-4 border-blue-300 relative shadow-[0_0_15px_rgba(59,130,246,0.6)]">
                              <div className="absolute top-2 left-2 w-2 h-2 bg-white" />
                              <div className="absolute top-2 right-2 w-2 h-2 bg-white" />
                         </div>
                     )}
                 </div>

                 {/* Enemies */}
                 {enemies.map(e => {
                     // Convert Polar to Cartesian relative to center (50%, 50%)
                     // x = 50 + cos(angle) * (distance/2)% 
                     // distance is 0-100. 100 means edge of container (roughly).
                     const rad = e.angle * (Math.PI / 180);
                     const x = 50 + Math.cos(rad) * (e.distance / 2.2); 
                     const y = 50 + Math.sin(rad) * (e.distance / 2.2);
                     
                     return (
                         <div 
                            key={e.id}
                            className="absolute w-8 h-8 flex items-center justify-center transition-all duration-100 ease-linear"
                            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                         >
                             {isIsaac ? <Ghost className="text-red-400 w-8 h-8 animate-pulse" /> : <div className="w-6 h-6 bg-green-600 rotate-45 border-2 border-green-400 shadow-md"></div>}
                         </div>
                     );
                 })}
             </div>

             {/* HUD */}
             <div className="flex justify-between items-center mb-4 px-2 font-black z-10">
                 <span className="text-yellow-400">Score: {score}/{KILLS_NEEDED}</span>
                 {gameOver && <span className="text-white bg-black/50 px-3 py-1 rounded-full">GAME OVER</span>}
             </div>

             {/* Button */}
             <button 
                 onClick={handleAction}
                 disabled={gameOver}
                 className={`w-full p-4 rounded-3xl font-black text-2xl shadow-xl active:scale-95 transition-transform z-10 ${isIsaac ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}
             >
                 {isIsaac ? "CRY!" : "MINE!"}
             </button>
        </div>
    );
  };

  const PirateDiceGameRevised = ({ currentPlayer }: { currentPlayer: Player }) => {
    const faces = [
      { name: 'monkey', icon: '🐒' },
      { name: 'diamond', icon: <Gem className="w-8 h-8 text-blue-400" /> },
      { name: 'sword', icon: <Swords className="w-8 h-8 text-slate-400" /> },
      { name: 'coin', icon: <Coins className="w-8 h-8 text-yellow-400" /> },
      { name: 'skull', icon: <Skull className="w-8 h-8 text-slate-800" /> },
      { name: 'parrot', icon: <Bird className="w-8 h-8 text-green-500" /> }
    ];
    const [dice, setDice] = useState<number[]>(Array(8).fill(0));
    const [rolling, setRolling] = useState(false);
    const [hasRolled, setHasRolled] = useState(false);
    const [result, setResult] = useState<'WIN' | 'LOSE' | null>(null);

    useEffect(() => {
        if (currentPlayer.isAI && !hasRolled && !rolling) {
            const t = setTimeout(roll, 1500);
            return () => clearTimeout(t);
        }
    }, [currentPlayer, hasRolled, rolling]);

    const roll = () => {
      if (hasRolled) return;
      setRolling(true);
      playSound(SOUNDS.ROLL);
      setTimeout(() => {
        const newDice = Array.from({ length: 8 }, () => Math.floor(Math.random() * 6));
        setDice(newDice);
        setRolling(false);
        setHasRolled(true);
        
        const counts: Record<number, number> = {};
        newDice.forEach(d => counts[d] = (counts[d] || 0) + 1);
        const maxMatch = Math.max(...Object.values(counts));
        
        if (maxMatch >= 4) {
          setResult('WIN');
          setTimeout(() => { setInteractionMode(InteractionMode.SEA_PIRATE_STEAL_TARGET); }, 2000);
        } else {
          setResult('LOSE');
          setTimeout(() => {
            setGameState(gs => ({
              ...gs,
              players: gs.players.map((pl, i) => i === gs.currentPlayerIndex ? { ...pl, ageBank: [] } : pl)
            }));
            consumeAction();
          }, 2000);
        }
      }, 1000);
    };

    return (
      <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl border-8 border-amber-600 w-[95%] md:w-full max-w-lg text-white scale-90 md:scale-100">
        <h2 className="text-3xl font-black text-center mb-8 uppercase italic tracking-tighter text-amber-500">אוצרות או צרות</h2>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {dice.map((d, i) => (
            <div key={i} className="w-10 h-10 md:w-16 md:h-16 bg-slate-800 rounded-2xl flex items-center justify-center border-2 border-slate-700 shadow-inner text-xl md:text-3xl">
              {rolling ? <Activity className="animate-spin text-amber-500" /> : faces[d].icon}
            </div>
          ))}
        </div>
        {!hasRolled && (
          <button 
            disabled={rolling || currentPlayer.isAI}
            onClick={roll} 
            className={`w-full p-4 rounded-2xl font-black text-xl shadow-lg transition-transform hover:scale-105 active:scale-95 ${currentPlayer.isAI ? 'bg-slate-600 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700'}`}
          >
            {currentPlayer.isAI ? "AI Rolling..." : "ROLL!"}
          </button>
        )}
        {result === 'WIN' && <p className="text-4xl font-black text-green-400 text-center animate-bounce mt-4 italic">!אוצרות</p>}
        {result === 'LOSE' && <p className="text-4xl font-black text-red-500 text-center animate-shake mt-4 italic">!צרות</p>}
      </div>
    );
  };

  if (gameState.phase === 'SETUP') {
      return (
      <div className="min-h-screen flex items-center justify-center p-4 font-['Fredoka'] bg-[#86efac]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-30"></div>
        <div className="relative bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl max-md w-full border-4 border-red-200">
          <div className="flex justify-center mb-6"><Sun className="text-yellow-400 w-16 h-16 animate-pulse" /></div>
          <h1 className="text-4xl font-black text-center mb-8 text-red-600 tracking-tight">Guess Gali's Age</h1>
          <div className="space-y-5">
             <div className="space-y-1">
                 <label className="text-xs font-bold text-red-400 uppercase tracking-widest px-1">Host Name</label>
                 <input type="text" placeholder="Your Name" value={setupData.playerName} onChange={e => setSetupData({...setupData, playerName: e.target.value})} className="w-full bg-red-50 border-2 border-red-100 rounded-2xl p-3 text-red-800 outline-none focus:border-red-300 transition-colors"/>
             </div>
             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                     <label className="text-xs font-bold text-red-400 uppercase tracking-widest px-1">Gali's Age</label>
                     <input type="number" value={setupData.galiAge} onChange={e => setSetupData({...setupData, galiAge: parseInt(e.target.value)})} className="w-full bg-red-50 border-2 border-red-100 rounded-2xl p-3 text-red-800 outline-none focus:border-red-300"/>
                 </div>
                 <div className="space-y-1">
                     <label className="text-xs font-bold text-red-400 uppercase tracking-widest px-1">Players</label>
                     <select value={setupData.playerCount} onChange={e => setSetupData({...setupData, playerCount: parseInt(e.target.value)})} className="w-full bg-red-50 border-2 border-red-100 rounded-2xl p-3 text-red-800 outline-none focus:border-red-300">
                         <option value={2}>2 Players</option><option value={3}>3 Players</option><option value={4}>4 Players</option>
                     </select>
                 </div>
             </div>
             <div className="flex gap-4 mt-6">
                <button onClick={() => initGame()} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-black text-xl transition-all hover:scale-105 active:scale-95 shadow-lg happy-shadow uppercase">Start Game!</button>
                <button onClick={() => setShowGallery(true)} className="bg-yellow-400 hover:bg-yellow-500 text-white px-6 rounded-2xl font-black shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center">
                    <ImageIcon size={28} />
                </button>
             </div>
          </div>
        </div>

        {/* Gallery Modal */}
        {showGallery && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4">
                <div className="bg-white rounded-[3rem] w-full max-w-6xl h-full max-h-[90vh] overflow-y-auto p-4 md:p-8 relative border-8 border-yellow-400 shadow-2xl animate-fade-in-up">
                    <button onClick={() => setShowGallery(false)} className="absolute top-4 right-4 md:top-6 md:right-6 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors z-50">
                        <X size={32} className="text-slate-600" />
                    </button>
                    <h2 className="text-4xl font-black text-center mb-8 text-slate-800 uppercase tracking-tighter sticky top-0 bg-white/90 backdrop-blur-md py-4 z-40">Card Gallery</h2>
                    <div className="space-y-12 pb-8">
                        {[Suit.Strawberry, Suit.Sea, Suit.Paintbrush, Suit.Cat].map(suit => (
                            <div key={suit} className="relative">
                                <div className="sticky top-20 z-30 bg-white/90 backdrop-blur-sm py-2 mb-4 border-b-4 border-slate-100">
                                    <h3 className={`text-2xl font-black px-6 py-2 rounded-full inline-block shadow-md ${
                                        suit === Suit.Strawberry ? 'bg-red-100 text-red-600' :
                                        suit === Suit.Sea ? 'bg-blue-100 text-blue-600' :
                                        suit === Suit.Paintbrush ? 'bg-amber-100 text-amber-600' :
                                        'bg-purple-100 text-purple-600'
                                    }`}>
                                        {suit} Deck
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-6 justify-center">
                                    {generateDeck(suit).map((card, idx) => (
                                        <div key={idx} className="group relative">
                                            <CardComponent 
                                                card={card} 
                                                noHover={false} 
                                                disabled={true} 
                                                className="scale-95 group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  if (gameState.phase === 'GAME_OVER') {
      const winner = gameState.players.find(p => p.id === gameState.winnerId);
      return (
         <div className="min-h-screen flex items-center justify-center p-4 font-['Fredoka'] bg-[#86efac]">
             <div className="relative bg-white/90 backdrop-blur-md p-10 rounded-[3rem] shadow-2xl max-lg w-full border-8 border-yellow-400 text-center animate-fade-in-up">
                 <div className="mb-6 relative">
                    <Trophy className="w-32 h-32 text-yellow-400 mx-auto animate-bounce" />
                    <Sparkles className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full text-yellow-200 animate-pulse pointer-events-none" />
                 </div>
                 <h1 className="text-4xl font-black mb-4 text-red-600 drop-shadow-sm">Congratulations {winner?.name}!</h1>
                 <p className="text-2xl mb-8 font-bold text-slate-700">You have guessed Gali's age!</p>
                 <div className="border-t-4 border-dashed border-slate-200 pt-8 space-y-4">
                     <button onClick={() => initGame(gameState.players.findIndex(p => p.id === gameState.winnerId))} className="w-full bg-green-500 hover:bg-green-600 text-white py-5 rounded-3xl font-black text-xl transition-all hover:scale-110 active:scale-90 flex items-center justify-center gap-2 shadow-xl">
                        <Activity size={24} /> PLAY AGAIN!
                     </button>
                     <button onClick={() => setGameState(prev => ({...prev, phase: 'SETUP'}))} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-3xl font-bold transition-all hover:scale-105 shadow-md">Main Menu</button>
                 </div>
                 <p className="mt-6 text-sm font-bold text-green-600 uppercase tracking-widest">The winner plays the first turn!</p>
             </div>
         </div>
      );
  }

  const currentPlayer = getCurrentPlayer();
  if (!currentPlayer) return <div>Loading...</div>;
  const isMyTurn = !currentPlayer.isAI;
  const userPlayer = gameState.players[0];

  return (
    <div className="min-h-screen bg-[#bbf7d0] font-['Fredoka'] flex flex-col relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20 pointer-events-none"></div>
      
      {/* Decorative Picnic Elements */}
      <Sun className="absolute top-8 right-8 w-24 h-24 text-yellow-400 animate-spin-slow opacity-60 pointer-events-none" />
      <Tree className="absolute bottom-4 right-12 w-32 h-32 text-green-700 opacity-20 pointer-events-none" />
      <Tree className="absolute bottom-16 left-8 w-24 h-24 text-green-800 opacity-20 pointer-events-none" />

      {/* Header */}
      <header className="relative h-auto py-2 md:py-0 md:h-20 bg-white/60 flex flex-col md:flex-row items-center justify-between px-2 md:px-8 z-20 backdrop-blur-md border-b-4 border-green-200 gap-2">
        <div className="flex w-full md:w-auto justify-between md:justify-start items-center gap-6">
             <div className={`relative w-10 h-14 transition-transform duration-700 ${isHourglassFlipped ? 'rotate-180' : ''}`}>
                 <div className="absolute top-0 left-0 w-full h-1/2 bg-slate-100 rounded-t-full border-2 border-red-400 overflow-hidden">
                     <div className="absolute bottom-0 w-full bg-red-400 transition-all duration-1000 ease-linear" style={{ height: `${(timeLeft / TURN_DURATION) * 100}%` }}></div>
                 </div>
                 <div className="absolute bottom-0 left-0 w-full h-1/2 bg-slate-100 rounded-b-full border-2 border-red-400 overflow-hidden">
                      <div className="absolute bottom-0 w-full bg-red-400 transition-all duration-1000 ease-linear" style={{ height: `${(1 - timeLeft / TURN_DURATION) * 100}%` }}></div>
                 </div>
             </div>
             <span className={`text-2xl font-black w-14 ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>{timeLeft}s</span>
             <div className="border-l-4 border-green-200 pl-6 flex flex-col">
                 <span className="text-green-600 text-xs font-black uppercase tracking-widest">Gali's age</span>
                 <span className="text-3xl font-black text-red-500 leading-none">{gameState.galiAge}</span>
             </div>
        </div>
        <div className="flex w-full md:w-auto flex-col md:flex-row gap-2 md:gap-6 items-center">
             <button onClick={toggleMusic} className="text-slate-400 hover:text-red-500 transition-colors hidden md:block">{isMusicMuted ? <VolumeX size={28} /> : <Volume2 size={28} />}</button>
             <div className="flex gap-2 flex-wrap justify-center">
                {gameState.players.map((p, i) => (
                    <div key={p.id} className={`relative flex items-center gap-2 px-3 py-1 md:px-4 md:py-2 rounded-2xl transition-all shadow-md text-xs md:text-base ${gameState.currentPlayerIndex === i ? 'bg-red-500 text-white scale-105 md:scale-110 happy-shadow font-black' : 'bg-white text-slate-500 opacity-60 font-bold'}`}>
                        {p.ageBank.reduce((a,c)=>a+c.value,0) === gameState.galiAge && <YellingBubble text={gameState.galiAge} />}
                        {p.isAI ? <Bot size={14} className="md:w-[18px]" /> : <User size={14} className="md:w-[18px]" />} {p.name} {!p.isAI && `(${p.ageBank.reduce((a,c)=>a+c.value,0)})`}
                    </div>
                ))}
             </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 relative flex flex-col items-center justify-start md:justify-center p-2 md:p-4 z-10 overflow-hidden">
          {/* Opponents */}
          <div className="relative md:absolute md:top-8 flex space-x-4 md:space-x-12 z-30 scale-90 md:scale-100 mt-2 md:mt-0">
              {gameState.players.filter(p => p.id !== 'player-human').map(p => (
                  <div key={p.id} className="flex flex-col items-center group relative">
                       {/* Speech bubble for yelling the age when bank sum matches target */}
                       {p.ageBank.reduce((a,c)=>a+c.value,0) === gameState.galiAge && (
                           <YellingBubble text={gameState.galiAge} />
                       )}

                       {isTargetMode && (
                           <button onClick={() => handleTargetClick(p)} className="absolute inset-0 z-50 rounded-full flex items-center justify-center font-black text-white bg-red-500/60 animate-pulse text-xs tracking-tighter">SELECT</button>
                       )}
                       <div className={`w-14 h-14 md:w-20 md:h-20 rounded-full border-4 flex items-center justify-center bg-white transition-all shadow-xl ${gameState.players[gameState.currentPlayerIndex].id === p.id ? 'border-red-500 scale-110' : 'border-slate-200'}`}>
                          <Bot className="text-slate-400 w-8 h-8 md:w-8 md:h-8" />
                       </div>
                       <div className={`mt-2 md:mt-3 bg-white/80 p-2 md:p-3 rounded-2xl flex -space-x-4 shadow-md border-2 ${p.ageBank.length === 0 ? 'border-red-500' : 'border-white'}`}>
                           <div className="absolute -top-3 -right-3 bg-blue-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white">{p.hand.length}</div>
                           <div className="absolute -top-3 -left-3 bg-green-600 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white">{p.ageBank.length}</div>
                           {p.ageBank.map((c, i) => (
                               <div 
                                    key={i} 
                                    onClick={() => {
                                        if (interactionMode === InteractionMode.STRAWBERRY_BABYG_OPP_BANK && p.id === gameState.leaderId) handleBabyGStep3(c.id);
                                        if (interactionMode === InteractionMode.PAINTBRUSH_READING_BANK_PICK && p.id === readingTargetId) handleReadingStep2(c.id);
                                    }}
                                    className={`w-6 h-8 md:w-7 md:h-10 rounded border-2 transition-all hover:z-50 ${c.isPermanentModifier ? 'bg-blue-400 border-blue-200' : 'bg-slate-100 border-slate-200'} ${(interactionMode === InteractionMode.STRAWBERRY_BABYG_OPP_BANK || interactionMode === InteractionMode.PAINTBRUSH_READING_BANK_PICK) ? 'cursor-pointer animate-pulse border-green-400 ring-2 ring-green-300' : ''}`} 
                                    style={{zIndex:i}}>
                               </div>
                           ))}
                       </div>
                  </div>
              ))}
          </div>

          {/* Table */}
          <div className="relative w-full max-w-4xl h-auto md:h-[450px] flex flex-col md:flex-row items-center justify-center mt-4 md:mt-0 scale-90 md:scale-100">
              <div className="grid grid-cols-2 gap-4 md:gap-10 mr-0 md:mr-20 mb-6 md:mb-0">
                  {[Suit.Strawberry, Suit.Sea, Suit.Paintbrush, Suit.Cat].map(suit => (
                      <div key={suit} 
                           className={`relative group rounded-xl transition-all ${isDeckSelectMode ? 'animate-flash-green' : ''} ${gameState.decks[suit].length === 0 ? 'ring-4 ring-red-500' : ''}`} 
                           onClick={() => isDeckSelectMode && handleDeckSelect(suit)}>
                          <CardComponent card={{...gameState.decks[suit][0], suit} as any} isFaceUp={false} disabled={gameState.decks[suit].length === 0} className="shadow-2xl border-4 border-white/50" />
                          {isDeckSelectMode && <div className="absolute inset-0 bg-green-500/10 cursor-pointer flex items-center justify-center text-white font-black text-xl animate-pulse rounded-xl shadow-inner">CHOOSE</div>}
                          {gameState.decks[suit].length === 0 && <div className="absolute -top-4 -right-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-black animate-bounce shadow-lg">EMPTY</div>}
                      </div>
                  ))}
              </div>

              <div className="flex flex-col items-center gap-4 md:gap-8">
                  <Die rolling={isRolling} face={gameState.lastDieRoll} onClick={() => isMyTurn && gameState.turnStep === 'ROLL' && interactionMode === InteractionMode.NONE && handleRoll()} disabled={!isMyTurn || gameState.turnStep !== 'ROLL' || interactionMode !== InteractionMode.NONE} />
                  
                  {interactionMode === InteractionMode.ROLL_COMBO && (
                      <div className="absolute bg-white/90 p-6 rounded-[2rem] z-50 flex flex-col gap-3 border-4 border-yellow-300 shadow-2xl backdrop-blur-md">
                          <button onClick={() => { processRollResult(DieFace.Strawberry); setInteractionMode(InteractionMode.NONE); }} className="bg-red-500 text-white font-black p-4 rounded-2xl hover:scale-105 transition-transform">STRAWBERRY</button>
                          <button onClick={() => { processRollResult(DieFace.Sea); setInteractionMode(InteractionMode.NONE); }} className="bg-blue-500 text-white font-black p-4 rounded-2xl hover:scale-105 transition-transform">SEA</button>
                          <button onClick={() => { processRollResult(DieFace.Paintbrush); setInteractionMode(InteractionMode.NONE); }} className="bg-amber-500 text-white font-black p-4 rounded-2xl hover:scale-105 transition-transform">PAINTBRUSH</button>
                      </div>
                  )}

                  {interactionMode === InteractionMode.CAT1_VALUE && (
                       <div className="absolute -top-16 -right-48 w-72 bg-white/95 z-50 p-6 rounded-[2.5rem] border-4 border-purple-400 grid grid-cols-5 gap-3 shadow-2xl">
                           <h3 className="col-span-5 text-center text-purple-600 font-black text-lg mb-2 uppercase italic">Choose Negative</h3>
                           {Array.from({length: 10}, (_, i) => -1 - i).map(val => <button key={val} onClick={() => handleCat1Submit(val)} className="bg-purple-500 text-white font-black p-3 rounded-2xl transition-all hover:scale-110 active:bg-purple-700">{val}</button>)}
                       </div>
                  )}

                  <div className="text-center bg-white/80 backdrop-blur-sm p-4 md:p-6 rounded-[2.5rem] shadow-xl border-4 border-green-100 min-w-[160px] md:min-w-[200px]">
                      <p className="font-black text-xl md:text-2xl text-red-600 tracking-tight">{currentPlayer.name}</p>
                      {gameState.turnStep === 'ACTION' && <p className="text-green-600 font-black uppercase text-xs tracking-widest mt-1">Actions: {gameState.actionsLeft}</p>}
                      {isMyTurn && gameState.turnStep === 'ACTION' && <button onClick={nextTurn} className="bg-red-500 text-white px-6 md:px-8 py-2 md:py-3 rounded-2xl text-sm font-black mt-2 md:mt-4 shadow-lg transition-all hover:scale-110 happy-shadow">END TURN</button>}
                  </div>
              </div>
          </div>

          {/* Mini Game Overlays */}
          {interactionMode === InteractionMode.SEA_MARIO_GAME && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center animate-fade-in p-4">
              <ClickerRaceGame 
                title="Mario Race!" 
                icon={<Car className="w-4 h-4" />} 
                buttonLabel="DRIVE"
                bgClass="bg-blue-600 border-yellow-400"
                onWin={(win) => {
                    setGameState(gs => ({
                        ...gs,
                        players: gs.players.map((pl, i) => i === win ? { ...pl, extraTurns: pl.extraTurns + 1 } : pl)
                    }));
                    consumeAction();
                }}
              />
            </div>
          )}
          {interactionMode === InteractionMode.SEA_PIRATE_GAME && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center animate-fade-in p-4">
              <PirateDiceGameRevised currentPlayer={currentPlayer} />
            </div>
          )}
          {interactionMode === InteractionMode.SEA_MINE_GAME && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center animate-fade-in p-4">
              <SurvivalGame 
                type="MINE"
                onWin={() => {
                    setGameState(gs => ({
                        ...gs,
                        players: gs.players.map((pl, i) => i === gs.currentPlayerIndex ? { ...pl, extraTurns: pl.extraTurns + 1 } : pl)
                    }));
                    consumeAction();
                }}
                onLose={() => {
                     setGameState(gs => ({
                        ...gs,
                        players: gs.players.map((pl, i) => i === gs.currentPlayerIndex ? { ...pl, ageBank: [] } : pl)
                    }));
                    consumeAction();
                }}
              />
            </div>
          )}
          {interactionMode === InteractionMode.SEA_ISAAC_GAME && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center animate-fade-in p-4">
               <SurvivalGame 
                type="ISAAC"
                onWin={() => {
                    const randomSuit = [Suit.Strawberry, Suit.Sea, Suit.Paintbrush, Suit.Cat][Math.floor(Math.random() * 4)];
                    drawCard(randomSuit, gameState.currentPlayerIndex);
                    consumeAction();
                }}
                onLose={() => {
                     setGameState(gs => ({
                        ...gs,
                        players: gs.players.map((pl, i) => i === gs.currentPlayerIndex ? { ...pl, ageBank: [] } : pl)
                    }));
                    consumeAction();
                }}
              />
            </div>
          )}

          {/* Age Bank - Bottom Left */}
          <div className="absolute bottom-36 left-2 md:bottom-8 md:left-8 z-30 transition-all scale-[0.6] md:scale-100 origin-bottom-left">
               <div className={`relative bg-white/90 picnic-pattern border-4 ${userPlayer.ageBank.length === 0 ? 'border-red-500' : 'border-red-200'} p-6 rounded-[3rem] shadow-2xl flex flex-col items-center gap-3 min-w-[240px]`}>
                   {userPlayer.ageBank.reduce((a,c)=>a+c.value,0) === gameState.galiAge && (
                       <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                           <YellingBubble text={gameState.galiAge} />
                       </div>
                   )}
                   <div className="flex items-center gap-2 text-red-600 border-b-2 border-red-100 pb-2 w-full justify-center mb-1">
                       <PiggyBank size={24} />
                       <span className="font-black uppercase tracking-widest text-sm">Age Bank</span>
                   </div>
                   <span className="text-slate-800 font-black text-6xl drop-shadow-sm tracking-tighter">{userPlayer.ageBank.reduce((a,c)=>a+c.value,0)}</span>
                   <div className="flex -space-x-8 hover:space-x-2 transition-all overflow-visible py-4 px-2">
                       {userPlayer.ageBank.map((card, i) => {
                           const shouldFlashBank = (interactionMode === InteractionMode.CAT2_BANK_TARGET) || 
                                                 (interactionMode === InteractionMode.CAT5_SWAP && cat5HandSelection) || 
                                                 (interactionMode === InteractionMode.SEA_EREN_OWN_BANK);
                           return (
                               <div key={card.id} 
                                    className={`${shouldFlashBank ? 'animate-flash-green' : ''} rounded-lg`}
                                    onClick={() => {
                                        if (interactionMode === InteractionMode.CAT2_BANK_TARGET) handleCat2Submit(card.id);
                                        if (interactionMode === InteractionMode.CAT5_SWAP && cat5HandSelection) handleCat5Submit(card.id);
                                        if (interactionMode === InteractionMode.SEA_EREN_OWN_BANK) handleErenStep1(card.id);
                                    }}>
                                   <CardComponent card={card} className={`w-18 h-24 text-[8px] shadow-xl border-2 ${(interactionMode === InteractionMode.CAT2_BANK_TARGET || interactionMode === InteractionMode.SEA_EREN_OWN_BANK) ? 'cursor-pointer' : ''}`} showPower={false} disabled={false} />
                               </div>
                           );
                       })}
                   </div>
              </div>
          </div>

          {/* Active Screen - Bottom Right */}
          <div className="absolute bottom-36 right-2 md:bottom-8 md:right-8 z-30 transition-all scale-[0.6] md:scale-100 origin-bottom-right">
               <div className="bg-white/90 picnic-pattern border-4 border-blue-200 p-6 rounded-[3rem] shadow-2xl flex flex-col items-center gap-3 min-w-[240px]">
                   <div className="flex items-center gap-2 text-blue-600 border-b-2 border-blue-100 pb-2 w-full justify-center mb-1">
                       <Zap size={24} />
                       <span className="font-black uppercase tracking-widest text-sm">Active</span>
                   </div>
                   <div className="flex -space-x-8 hover:space-x-2 transition-all overflow-visible py-4 px-2 min-h-[100px] items-center">
                       {userPlayer.activeDefenseCard && (
                           <CardComponent card={userPlayer.activeDefenseCard} className="w-18 h-24 text-[8px] shadow-xl border-2" showPower={false} disabled={false} />
                       )}
                       {userPlayer.activePermanentCards.map((card) => (
                           <CardComponent key={card.id} card={card} className="w-18 h-24 text-[8px] shadow-xl border-2" showPower={false} disabled={false} />
                       ))}
                       {(!userPlayer.activeDefenseCard && userPlayer.activePermanentCards.length === 0) && (
                           <span className="text-slate-300 font-black uppercase text-xs tracking-widest opacity-40 px-10">Empty</span>
                       )}
                   </div>
              </div>
          </div>

          {/* Card Preview Sidebar */}
          {previewCard && (
            <div 
              className={`absolute right-8 top-1/2 -translate-y-1/2 z-[60] bg-white/95 border-4 border-red-200 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-8 flex flex-col items-center gap-4 animate-fade-in-left backdrop-blur-sm overflow-hidden transition-all duration-500 scale-90 md:scale-100 ${SPECIAL_CAT_IDS.includes(previewCard.name || '') ? 'max-w-[36rem] w-[34rem] min-h-[500px]' : 'max-w-sm min-h-[400px]'}`}
              style={{
                  backgroundImage: previewCard?.suit === Suit.Cat 
                    ? `linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)), url("https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1000&q=80")`
                    : previewCard?.suit === Suit.Sea
                    ? `linear-gradient(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.7)), url("https://people.com/thmb/HZuCme1UDpzJNjLyD6QXo_ycm-A=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(999x0:1001x2):format(webp)/rupaul-drag-race-all-stars-10-042325-tout-91ef0f1b7a9a4554b7ec9afcc2c7c6d0.jpg")`
                    : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
              }}
            >
                {/* Large Card Frame Container */}
                <div className="relative flex items-center justify-center w-full min-h-[300px]">
                    <CardComponent 
                      card={previewCard} 
                      noHover={true}
                      className={`${SPECIAL_CAT_IDS.includes(previewCard.name || '') ? 'scale-[2.8]' : 'scale-[1.8]'} transform origin-center transition-transform duration-500`} 
                    />
                </div>

                <div className="w-full flex flex-col gap-3 mt-4 z-10">
                    {!SPECIAL_CAT_IDS.includes(previewCard.name || '') && (
                        <div className="bg-slate-50/80 p-4 rounded-2xl border-2 border-slate-100 text-center backdrop-blur-sm">
                            <h4 className="font-black text-red-600 uppercase tracking-tighter text-xl">{previewCard.name || previewCard.suit}</h4>
                            <p className="text-slate-600 font-medium text-sm mt-1">{previewCard.description}</p>
                            <div className="mt-2 flex items-center justify-center gap-2">
                                <span className="bg-red-100 text-red-600 font-black px-3 py-1 rounded-full text-xs">Value: {previewCard.value > 0 ? `+${previewCard.value}` : previewCard.value}</span>
                                <span className="bg-blue-100 text-blue-600 font-black px-3 py-1 rounded-full text-xs">{previewCard.suit}</span>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                        <button 
                            onClick={() => setPreviewCard(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-black py-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-md"
                        >
                            <X size={20} />
                            <span className="text-[10px] uppercase">Hide</span>
                        </button>
                        <button 
                            onClick={() => { 
                                if (isCardPowerUsable(previewCard)) {
                                    handlePlayCard(previewCard);
                                    setPreviewCard(null);
                                }
                            }}
                            disabled={!isCardPowerUsable(previewCard)}
                            className="bg-red-400 hover:bg-red-600 text-white font-black py-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-md disabled:opacity-50 happy-shadow"
                        >
                            <Play size={20} />
                            <span className="text-[10px] uppercase">Use</span>
                        </button>
                        <button 
                            onClick={() => { 
                                if (isMyTurn && gameState.turnStep === 'ACTION' && gameState.actionsLeft > 0) {
                                    handleBankCard(previewCard);
                                    setPreviewCard(null);
                                }
                            }}
                            disabled={!isMyTurn || gameState.turnStep !== 'ACTION' || gameState.actionsLeft <= 0}
                            className="bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-md disabled:opacity-50 happy-shadow"
                        >
                            <Landmark size={20} />
                            <span className="text-[10px] uppercase">Bank</span>
                        </button>
                    </div>
                </div>
            </div>
          )}

          {/* Card Pick Overlay (Forestcard / Fridaycard) */}
          {isCardPickMode && pendingSelectionCards.length > 0 && (
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center animate-fade-in">
                 <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-yellow-400 flex flex-col items-center gap-8">
                     <h2 className="text-3xl font-black text-red-600 uppercase tracking-tight italic">Pick 1 Card to Keep</h2>
                     <p className="text-slate-500 font-bold -mt-4">The other will return to its deck.</p>
                     <div className="flex gap-10">
                         {pendingSelectionCards.map(c => (
                             <div key={c.id} onClick={() => handleForestFridayPick(c.id)} className="cursor-pointer transform hover:scale-110 transition-transform hover:z-10 group relative">
                                 <CardComponent card={c} className="shadow-2xl ring-offset-4 group-hover:ring-8 ring-green-400 rounded-2xl" />
                                 <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-green-500 text-white font-black px-4 py-1 rounded-full text-xs transition-opacity shadow-lg">SELECT</div>
                             </div>
                         ))}
                     </div>
                 </div>
             </div>
          )}

          {/* Player Hand */}
          <div className="absolute bottom-0 md:bottom-6 w-full flex justify-center items-end z-20 pointer-events-none">
               <div className="pointer-events-auto flex justify-center items-end space-x-4 bg-white/40 p-2 md:p-8 rounded-t-3xl md:rounded-full backdrop-blur-sm border-4 border-white/50 shadow-2xl scale-[0.7] md:scale-100 origin-bottom mb-2 md:mb-0 overflow-x-auto max-w-full">
                   {userPlayer.hand.map((card) => {
                       const isSelectedForPreview = previewCard?.id === card.id;
                       const shouldFlashHand = (interactionMode === InteractionMode.CAT5_SWAP && !cat5HandSelection) || 
                                               (interactionMode === InteractionMode.STRAWBERRY_FRIENDS_OWN_PICK) || 
                                               (interactionMode === InteractionMode.PAINTBRUSH_STYLE_HAND_PICK);
                       return (
                           <div key={card.id} className="relative group shrink-0">
                               <CardComponent 
                                   card={card} 
                                   onClick={() => {
                                       if (interactionMode === InteractionMode.CAT5_SWAP && !cat5HandSelection) { setCat5HandSelection(card.id); return; }
                                       if (interactionMode === InteractionMode.STRAWBERRY_FRIENDS_OWN_PICK) { handleFriendsOwnPickExecute(card.id); return; }
                                       if (interactionMode === InteractionMode.PAINTBRUSH_STYLE_HAND_PICK) { handleStyleStep1(card.id); return; }
                                       
                                       if (isSelectedForPreview) setPreviewCard(null);
                                       else setPreviewCard(card);
                                   }} 
                                   className={`hover:-translate-y-16 transition-all duration-500 border-4 border-white shadow-xl ${interactionMode !== InteractionMode.NONE ? 'grayscale-0' : ''} ${shouldFlashHand ? 'animate-flash-green' : ''} ${isSelectedForPreview ? 'ring-8 ring-yellow-400 -translate-y-12' : ''}`} 
                               />
                           </div>
                       );
                   })}
               </div>
          </div>
      </main>
      
      <div className="hidden md:flex flex-col-reverse absolute top-24 left-8 w-80 pointer-events-none z-40">
          {gameLog.map((l, i) => <div key={i} className="bg-white/90 border-l-8 border-red-500 text-slate-700 font-bold text-sm p-4 mb-2 shadow-xl rounded-r-2xl animate-fade-in-right">{l}</div>)}
      </div>
    </div>
  );
};

export default App;