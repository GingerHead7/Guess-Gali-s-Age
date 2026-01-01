

export enum Suit {
  Strawberry = 'Strawberry',
  Sea = 'Sea',
  Paintbrush = 'Paintbrush',
  Cat = 'Cat'
}

export enum DieFace {
  Strawberry = 'Strawberry',
  Sea = 'Sea',
  Paintbrush = 'Paintbrush',
  Cat = 'Cat',
  Combo = 'Combo', // Strawberry, Sea, Paintbrush choice
  Goat = 'Goat'
}

export enum CardPowerType {
  NONE = 'NONE',
  DEFENSE = 'DEFENSE',
  STEAL_CARD = 'STEAL_CARD', // Steal from hand
  EXTRA_TURN = 'EXTRA_TURN', // Strawberry power (Legacy/Epe)
  DRAW_TWO = 'DRAW_TWO', // Generic/Default
  
  // Specific Cat Powers
  CAT_1_MINUS_AGE = 'CAT_1_MINUS_AGE',
  CAT_2_REMOVE_BANK = 'CAT_2_REMOVE_BANK',
  CAT_3_DRAW_TWO_SELECT = 'CAT_3_DRAW_TWO_SELECT',
  CAT_4_GIVE_MINUS_5 = 'CAT_4_GIVE_MINUS_5',
  CAT_5_SWAP_HAND_BANK = 'CAT_5_SWAP_HAND_BANK',
  CAT_6_DEFENSE = 'CAT_6_DEFENSE',
  CAT_7_STEAL_PERMANENT = 'CAT_7_STEAL_PERMANENT',
  CAT_8_DISCARD_OPP_HAND = 'CAT_8_DISCARD_OPP_HAND',

  // New Unique Strawberry Powers
  STRAWBERRY_BABYG = 'STRAWBERRY_BABYG',
  STRAWBERRY_MIGUEL = 'STRAWBERRY_MIGUEL',
  STRAWBERRY_GOAT = 'STRAWBERRY_GOAT',
  STRAWBERRY_TEA = 'STRAWBERRY_TEA',
  STRAWBERRY_FOREST = 'STRAWBERRY_FOREST',
  STRAWBERRY_EPE = 'STRAWBERRY_EPE',
  STRAWBERRY_FRIENDS = 'STRAWBERRY_FRIENDS',
  STRAWBERRY_FAMILY = 'STRAWBERRY_FAMILY',
  STRAWBERRY_RYAN = 'STRAWBERRY_RYAN',
  STRAWBERRY_FRIDAY = 'STRAWBERRY_FRIDAY',
  STRAWBERRY_GALI = 'STRAWBERRY_GALI',
  STRAWBERRY_TAMER = 'STRAWBERRY_TAMER',
  STRAWBERRY_PARENTS = 'STRAWBERRY_PARENTS',
  STRAWBERRY_HAGEFEN = 'STRAWBERRY_HAGEFEN',

  // New Unique Sea Powers
  SEA_SINGERS = 'SEA_SINGERS',
  SEA_MINE = 'SEA_MINE',
  SEA_PIRATE = 'SEA_PIRATE',
  SEA_ISAAC = 'SEA_ISAAC',
  SEA_SIMS = 'SEA_SIMS',
  SEA_MARIO = 'SEA_MARIO',
  SEA_PAPA = 'SEA_PAPA',
  SEA_EREN = 'SEA_EREN',
  SEA_PYRA = 'SEA_PYRA',
  SEA_RUPAUL = 'SEA_RUPAUL',
  SEA_MARCUS = 'SEA_MARCUS',
  SEA_HUNTER = 'SEA_HUNTER',
  SEA_KAPIT = 'SEA_KAPIT',
  SEA_OTGW = 'SEA_OTGW',

  // New Unique Paintbrush Powers
  PAINTBRUSH_PAINT = 'PAINTBRUSH_PAINT',
  PAINTBRUSH_MUSIC = 'PAINTBRUSH_MUSIC',
  PAINTBRUSH_RAIN = 'PAINTBRUSH_RAIN',
  PAINTBRUSH_VIDEO = 'PAINTBRUSH_VIDEO',
  PAINTBRUSH_MAKEUP = 'PAINTBRUSH_MAKEUP',
  PAINTBRUSH_STYLE = 'PAINTBRUSH_STYLE',
  PAINTBRUSH_NATURE = 'PAINTBRUSH_NATURE',
  PAINTBRUSH_ACTING = 'PAINTBRUSH_ACTING',
  PAINTBRUSH_SCENT = 'PAINTBRUSH_SCENT',
  PAINTBRUSH_RIDE = 'PAINTBRUSH_RIDE',
  PAINTBRUSH_SING = 'PAINTBRUSH_SING',
  PAINTBRUSH_COOK = 'PAINTBRUSH_COOK',
  PAINTBRUSH_READING = 'PAINTBRUSH_READING',
  PAINTBRUSH_TENBIS = 'PAINTBRUSH_TENBIS',
  PAINTBRUSH_COFFEE = 'PAINTBRUSH_COFFEE',
  
  // Special Merged Card
  GALI_AND_TAMER_BANK = 'GALI_AND_TAMER_BANK'
}

export interface Card {
  id: string;
  suit: Suit;
  value: number; // -10 to 10, not 0
  powerType: CardPowerType;
  description: string;
  imageUrl: string;
  isDefense: boolean;
  specificCatImage?: string; // Specific cat photo for Cat cards
  name?: string; // e.g. "cat1", "cat2", "BabyGcard"
  isPermanentModifier?: boolean; // If true, this is a token in the bank (Blue number)
}

export interface Player {
  id: string;
  name: string;
  isAI: boolean;
  hand: Card[];
  ageBank: Card[];
  activeDefenseCard: Card | null; // Card played on table for defense (Sea)
  activePermanentCards: Card[]; // Cards like Tamer or Ryan that sit on the right
  isEliminated: boolean;
  skipTurn: boolean;
  extraTurns: number; // For Makeupcard logic
}

export type GamePhase = 'SETUP' | 'RPS' | 'PLAYING' | 'LAST_CHANCE' | 'GAME_OVER';

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  galiAge: number;
  phase: GamePhase;
  turnStep: 'ROLL' | 'ACTION' | 'GOAT_CHALLENGE'; 
  actionsLeft: number;
  decks: Record<Suit, Card[]>;
  winnerId: string | null;
  lastDieRoll: DieFace | null;
  logs: string[];
  leaderId: string | null;
  roundsLeftInLastChance: number;
}