import { Card, CardPowerType, Suit } from './types';

export const MAX_BANK_SIZE = 10;
export const DECK_SIZE = 20;

// Helper to generate a random ID
const uuid = () => Math.random().toString(36).substring(2, 15);

const POWERS_BY_SUIT: Record<Suit, CardPowerType[]> = {
  [Suit.Strawberry]: [CardPowerType.EXTRA_TURN],
  [Suit.Sea]: [CardPowerType.NONE], 
  [Suit.Paintbrush]: [CardPowerType.STEAL_CARD],
  [Suit.Cat]: [CardPowerType.DRAW_TWO], // Default, overridden by specific cats
};

const DESCRIPTIONS: Record<Suit, string[]> = {
  [Suit.Strawberry]: ["Delicious power!"],
  [Suit.Sea]: ["Deep sea mysteries."],
  [Suit.Paintbrush]: ["Artistic flare!"],
  [Suit.Cat]: ["Meow!"]
};

// Using reliable CDN links for sounds to avoid "source not found" errors
export const SOUNDS = {
  ROLL: 'https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3', // Dice roll
  GOAT: '/Goat.mp3',  // Goat bleat - Absolute path to ensure local file loading
  CAT: 'https://assets.mixkit.co/active_storage/sfx/111/111-preview.mp3',   // Cat meow
  SEA: 'https://assets.mixkit.co/active_storage/sfx/1158/1158-preview.mp3',  // Water splash
  PAINTING: 'https://assets.mixkit.co/active_storage/sfx/2388/2388-preview.mp3', // Brush stroke
  YUMMY: 'https://assets.mixkit.co/active_storage/sfx/154/154-preview.mp3', // Eating/Crunch
  VICTORY: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Victory Fanfare
  MERGE: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3', // Magical chime
  ERROR: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3' // Error/Button fail
};

export const BG_MUSIC = 'https://assets.mixkit.co/music/preview/mixkit-happy-days-143.mp3'; // Cheerful pop

export const CAT_IMAGES = [
  'charlie.jpg',
  'Grace.jpg',
  'kuskus.jpg',
  'laila.jpeg',
  'mushit.jpeg',
  'tigi.jpg',
  'Yehudit.jpg',
  'tigi.jpg' // Using tigi again for 8th or loop
];

// Helper function to shuffle an array
export const shuffle = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const generateDeck = (suit: Suit): Card[] => {
  const cards: Card[] = [];
  
  if (suit === Suit.Strawberry) {
      // UNIQUE STRAWBERRY CARDS
      const strawberryConfig = [
          { name: 'BabyGcard', power: CardPowerType.STRAWBERRY_BABYG, desc: 'Steal a card from an opponent\'s Age Bank.' },
          { name: 'Miguelcard', power: CardPowerType.STRAWBERRY_MIGUEL, desc: 'Draw another Strawberry card.' },
          { name: 'Goatcard', power: CardPowerType.STRAWBERRY_GOAT, desc: 'Skip an opponent\'s turn.' },
          { name: 'Teacard', power: CardPowerType.STRAWBERRY_TEA, desc: 'Give opponent a permanent +1 (Blue).' },
          { name: 'Forestcard', power: CardPowerType.STRAWBERRY_FOREST, desc: 'Pick 1 of 2 Paintbrush cards.' },
          { name: 'Epecard', power: CardPowerType.STRAWBERRY_EPE, desc: 'Play an extra turn.' },
          { name: 'Friendscard', power: CardPowerType.STRAWBERRY_FRIENDS, desc: 'Trade a chosen card with a friend.' },
          { name: 'Familycard', power: CardPowerType.STRAWBERRY_FAMILY, desc: 'Draw 1 Paintbrush and 1 Sea card.' },
          { name: 'Ryancard', power: CardPowerType.STRAWBERRY_RYAN, desc: 'Protects you from Goats or Attacks.' },
          { name: 'Fridaycard', power: CardPowerType.STRAWBERRY_FRIDAY, desc: 'Pick 1 of Strawberry/Paintbrush.' },
          { name: 'Galicard', power: CardPowerType.STRAWBERRY_GALI, desc: 'Draw Cat + Extra Turn. Merges with Tamer!' },
          { name: 'Tamercard', power: CardPowerType.STRAWBERRY_TAMER, desc: 'Waits for Gali to merge.' },
          { name: 'Parentscard', power: CardPowerType.STRAWBERRY_PARENTS, desc: 'Play a second turn this round.' },
          { name: 'Hagefencard', power: CardPowerType.STRAWBERRY_HAGEFEN, desc: 'Draw one card from each card bank.' }
      ];

      strawberryConfig.forEach(config => {
          let val = Math.floor(Math.random() * 10) + 1; 
          if (Math.random() > 0.8) val *= -1;

          cards.push({
              id: uuid(),
              suit: Suit.Strawberry,
              value: val,
              powerType: config.power,
              description: config.desc,
              imageUrl: `https://picsum.photos/seed/${config.name}/200/300`,
              isDefense: false,
              name: config.name
          });
      });
      return cards;
  }

  if (suit === Suit.Sea) {
    // UNIQUE SEA CARDS - NOW SINGLETONS (No duplication)
    const seaConfig = [
        { name: 'Singerscard', power: CardPowerType.SEA_SINGERS, desc: 'Draw 1 Strawberry, 1 Sea, 1 Paintbrush.' },
        { name: 'Minecard', power: CardPowerType.SEA_MINE, desc: 'Choose a deck (except Cat) and draw 1 card.' },
        { name: 'Piratecard', power: CardPowerType.SEA_PIRATE, desc: 'Steal random card from an opponent\'s Bank.' },
        { name: 'Isaaccard', power: CardPowerType.SEA_ISAAC, desc: 'Draw a Strawberry card.' },
        { name: 'simscard', power: CardPowerType.SEA_SIMS, desc: 'Draw from one deck, then draw from another.' },
        { name: 'Mariocard', power: CardPowerType.SEA_MARIO, desc: 'Gain a permanent +1 Blue age number.' },
        { name: 'Papacard', power: CardPowerType.SEA_PAPA, desc: 'Draw a Paintbrush card.' },
        { name: 'Erencard', power: CardPowerType.SEA_EREN, desc: 'Give a card from your Bank to an opponent.' },
        { name: 'Pyracard', power: CardPowerType.SEA_PYRA, desc: 'Draw a Sea card.' },
        { name: 'Rupaulcard', power: CardPowerType.SEA_RUPAUL, desc: 'Play another turn!' },
        { name: 'Marcuscard', power: CardPowerType.SEA_MARCUS, desc: 'Choose a player to skip their turn.' },
        { name: 'Huntercard', power: CardPowerType.SEA_HUNTER, desc: 'Draw a Cat card.' },
        { name: 'Kapitcard', power: CardPowerType.SEA_KAPIT, desc: 'Gain a permanent +1 Blue age point.' },
        { name: 'OTGWcard', power: CardPowerType.SEA_OTGW, desc: 'Draw a Cat card.' }
    ];

    seaConfig.forEach(config => {
        let val = Math.floor(Math.random() * 10) + 1; 
        if (Math.random() > 0.8) val *= -1;

        cards.push({
            id: uuid(),
            suit: Suit.Sea,
            value: val,
            powerType: config.power,
            description: config.desc,
            imageUrl: `https://picsum.photos/seed/${config.name}/200/300`,
            isDefense: false, 
            name: config.name
        });
    });
    return cards;
  }

  if (suit === Suit.Paintbrush) {
      // UNIQUE PAINTBRUSH CARDS - NOW SINGLETONS (No duplication)
      const paintbrushConfig = [
          { name: 'Paintcard', power: CardPowerType.PAINTBRUSH_PAINT, desc: 'Play another turn.' },
          { name: 'Musiccard', power: CardPowerType.PAINTBRUSH_MUSIC, desc: 'Draw 1 Strawberry, 1 Sea, 1 Paintbrush.' },
          { name: 'Raincard', power: CardPowerType.PAINTBRUSH_RAIN, desc: 'Choose a deck (except Cat) to draw 1 card.' },
          { name: 'Videocard', power: CardPowerType.PAINTBRUSH_VIDEO, desc: 'Steal a random card from an opponent\'s Bank.' },
          { name: 'Makeupcard', power: CardPowerType.PAINTBRUSH_MAKEUP, desc: 'Choose a player to play 2 turns in a row.' },
          { name: 'Stylecard', power: CardPowerType.PAINTBRUSH_STYLE, desc: 'Give a card from your hand to another player.' },
          { name: 'Naturecard', power: CardPowerType.PAINTBRUSH_NATURE, desc: 'Gain a permanent +1 Blue age number.' },
          { name: 'Actingcard', power: CardPowerType.PAINTBRUSH_ACTING, desc: 'Steal a card from an opponent\'s Hand.' },
          { name: 'Scentcard', power: CardPowerType.PAINTBRUSH_SCENT, desc: 'Draw a Sea card.' },
          { name: 'Ridecard', power: CardPowerType.PAINTBRUSH_RIDE, desc: 'Draw 1 card from two different decks.' },
          { name: 'singcard', power: CardPowerType.PAINTBRUSH_SING, desc: 'Draw a Paintbrush card.' },
          { name: 'Cookcard', power: CardPowerType.PAINTBRUSH_COOK, desc: 'Draw a Strawberry card.' },
          { name: 'Readingcard', power: CardPowerType.PAINTBRUSH_READING, desc: 'Remove a card from opponent\'s Bank to Deck.' },
          { name: 'Tenbiscard', power: CardPowerType.PAINTBRUSH_TENBIS, desc: 'Draw two Strawberry cards.' },
          { name: 'Coffeecard', power: CardPowerType.PAINTBRUSH_COFFEE, desc: 'Draw a Cat card.' }
      ];

      paintbrushConfig.forEach(config => {
          let val = Math.floor(Math.random() * 10) + 1; 
          if (Math.random() > 0.8) val *= -1;

          cards.push({
              id: uuid(),
              suit: Suit.Paintbrush,
              value: val,
              powerType: config.power,
              description: config.desc,
              imageUrl: `https://picsum.photos/seed/${config.name}/200/300`,
              isDefense: false,
              name: config.name
          });
      });
      return cards;
  }

  if (suit === Suit.Cat) {
    const catCount = 8;
    for (let i = 1; i <= catCount; i++) {
        const name = `cat${i}`;
        let powerType = CardPowerType.NONE;
        let description = "";
        let val: number | undefined;
        let isDefense = false;

        switch (i) {
            case 1: powerType = CardPowerType.CAT_1_MINUS_AGE; description = "Choose a negative number (-1 to -10) to add permanently to the bank!"; break;
            case 2: powerType = CardPowerType.CAT_2_REMOVE_BANK; description = "Remove a card from your own Age Bank to hand."; break;
            case 3: powerType = CardPowerType.CAT_3_DRAW_TWO_SELECT; description = "Draw 2 cards from a chosen deck."; break;
            case 4: powerType = CardPowerType.CAT_4_GIVE_MINUS_5; description = "Give a -5 card to an opponent."; break;
            case 5: powerType = CardPowerType.CAT_5_SWAP_HAND_BANK; description = "Swap a card from hand with one from your bank."; break;
            case 6: powerType = CardPowerType.CAT_6_DEFENSE; description = "Defend against attacks."; isDefense = true; break;
            case 7: powerType = CardPowerType.CAT_7_STEAL_PERMANENT; description = "Steal a permanent modifier from an opponent."; break;
            case 8: powerType = CardPowerType.CAT_8_DISCARD_OPP_HAND; description = "Discard an opponent's entire hand."; break;
        }

        cards.push({
            id: uuid(),
            suit: Suit.Cat,
            value: val !== undefined ? val : (Math.floor(Math.random() * 10) + 1) * (Math.random() > 0.5 ? 1 : -1),
            powerType: powerType,
            description: description,
            imageUrl: `https://picsum.photos/seed/${name}/200/300`,
            isDefense: isDefense,
            name: name
        });
    }
    return cards;
  }

  return cards;
};