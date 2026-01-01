
import { GoogleGenAI, Type } from "@google/genai";
import { GameState, Player, Card, Suit, CardPowerType } from '../types';

interface AIMove {
  action: 'ROLL' | 'PLAY_CARD' | 'BANK_CARD' | 'END_TURN';
  cardId?: string; // For Play or Bank
  targetPlayerId?: string; // For Play powers
  comboChoice?: Suit; // If rolling combo
  cat1Choice?: number; // Logic for cat1
  cat3SuitChoice?: Suit; // Logic for cat3
  reasoning: string;
}

export const getAIAction = async (gameState: GameState, aiPlayer: Player): Promise<AIMove> => {
  if (gameState.turnStep === 'ROLL') {
     return { action: 'ROLL', reasoning: "I must roll the die to start my turn." };
  }

  // Ensure API key is present; instance will be created right before use
  if (!process.env.API_KEY) {
    return simpleAI(gameState, aiPlayer);
  }

  try {
    // Initializing Gemini client right before use
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const promptData = {
      galiAge: gameState.galiAge,
      actionsLeft: gameState.actionsLeft,
      myHand: aiPlayer.hand.map(c => ({ id: c.id, val: c.value, suit: c.suit, power: c.powerType, name: c.name })),
      myBankSum: aiPlayer.ageBank.reduce((acc, c) => acc + c.value, 0),
      hasActiveDefense: !!aiPlayer.activeDefenseCard,
      otherPlayers: gameState.players
        .filter(p => p.id !== aiPlayer.id)
        .map(p => ({
          id: p.id,
          bankSum: p.ageBank.reduce((acc, c) => acc + c.value, 0),
          handCount: p.hand.length,
          hasDefense: !!p.activeDefenseCard,
          hasPermanentModifier: p.ageBank.some(c => c.isPermanentModifier)
        })),
      handLimit: String(gameState.galiAge).split('').reduce((a, b) => a + parseInt(b), 0)
    };

    const prompt = `
      You are playing "Guess Gali's Age".
      Target Age: ${promptData.galiAge}.
      Your Current Bank Sum: ${promptData.myBankSum}.
      Actions Left this Turn: ${promptData.actionsLeft}.
      Your Hand: ${JSON.stringify(promptData.myHand)}.
      Has Active Defense: ${promptData.hasActiveDefense}.
      Opponents: ${JSON.stringify(promptData.otherPlayers)}.
      
      Rules:
      1. Turn sequence: Roll (Already done) -> Action 1 -> Action 2.
      2. Possible Actions: 
         - BANK_CARD: Move card from hand to bank (Costs 1 Action).
         - PLAY_CARD: Use card power (Costs 1 Action).
           * cat1: Create permanent negative number in bank. Choose a value between -1 and -10 to add to YOUR bank.
           * cat8: Discard chosen opponent's entire hand.
         - END_TURN: Stop taking actions.
      
      Return JSON.
    `;

    // Query GenAI with both the model name and prompt directly
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, enum: ['PLAY_CARD', 'BANK_CARD', 'END_TURN'] },
            cardId: { type: Type.STRING },
            targetPlayerId: { type: Type.STRING },
            cat1Choice: { type: Type.NUMBER },
            cat3SuitChoice: { type: Type.STRING, enum: ['Strawberry', 'Sea', 'Paintbrush', 'Cat'] },
            reasoning: { type: Type.STRING }
          }
        }
      }
    });

    // Access the text content directly via property access
    if (response.text) {
        return JSON.parse(response.text.trim()) as AIMove;
    }
    
    return simpleAI(gameState, aiPlayer);

  } catch (error: any) {
    console.error("Gemini decision error:", error);
    return simpleAI(gameState, aiPlayer);
  }
};

const simpleAI = (gameState: GameState, aiPlayer: Player): AIMove => {
  const currentSum = aiPlayer.ageBank.reduce((acc, c) => acc + c.value, 0);
  const gap = gameState.galiAge - currentSum;
  
  if (gameState.actionsLeft <= 0) return { action: 'END_TURN', reasoning: "No actions left." };
  if (aiPlayer.hand.length === 0) return { action: 'END_TURN', reasoning: "No cards." };

  const winCard = aiPlayer.hand.find(c => c.value === gap);
  if (winCard) return { action: 'BANK_CARD', cardId: winCard.id, reasoning: "Winning move!" };

  const cat1 = aiPlayer.hand.find(c => c.powerType === CardPowerType.CAT_1_MINUS_AGE);
  if (cat1 && currentSum > gameState.galiAge) {
      const neededNegative = gameState.galiAge - currentSum;
      const choice = neededNegative < -10 ? -10 : (neededNegative > -1 ? -1 : neededNegative);
      return { action: 'PLAY_CARD', cardId: cat1.id, cat1Choice: choice, reasoning: "Using cat1 to fix overshoot." };
  }

  const cat8 = aiPlayer.hand.find(c => c.powerType === CardPowerType.CAT_8_DISCARD_OPP_HAND);
  if (cat8) {
      const target = gameState.players.find(p => p.id !== aiPlayer.id && p.hand.length > 0);
      if (target) return { action: 'PLAY_CARD', cardId: cat8.id, targetPlayerId: target.id, reasoning: "Discarding opponent hand." };
  }

  const HelpfulCard = aiPlayer.hand.find(c => (gap > 0 && c.value > 0 && c.value <= gap) || (gap < 0 && c.value < 0));
  if (HelpfulCard) return { action: 'BANK_CARD', cardId: HelpfulCard.id, reasoning: "Banking helpful value." };

  return { action: 'BANK_CARD', cardId: aiPlayer.hand[0].id, reasoning: "Default bank action." };
};
