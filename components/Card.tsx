import React, { useState } from 'react';
import { Card as CardType, Suit } from '../types';
import { Shield } from 'lucide-react';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  isFaceUp?: boolean;
  showPower?: boolean;
  noHover?: boolean;
  className?: string;
}

const SuitColors: Record<Suit, string> = {
  [Suit.Strawberry]: 'bg-red-100 border-red-400 text-red-800',
  [Suit.Sea]: 'bg-blue-100 border-blue-400 text-blue-800',
  [Suit.Paintbrush]: 'bg-amber-100 border-amber-400 text-amber-800',
  [Suit.Cat]: 'bg-purple-100 border-purple-400 text-purple-800',
};

const SuitIcons: Record<Suit, string> = {
    [Suit.Strawberry]: '🍓',
    [Suit.Sea]: '🌊',
    [Suit.Paintbrush]: '🎨',
    [Suit.Cat]: '🐱',
};

interface SpecialCatData {
  image: string;
  label: string;
  showAge?: boolean;
}

const SPECIAL_CATS: Record<string, SpecialCatData> = {
  // Cat Suit
  'cat1': { image: 'https://i.im.ge/2025/12/27/Bt82QW.1.md.png', label: "צ'ארלי", showAge: true },
  'cat2': { image: 'https://i.im.ge/2025/12/27/BtWHPL.cat2.md.png', label: "גרייס", showAge: true },
  'cat3': { image: 'https://i.im.ge/2025/12/28/BCZ3JS.cat3.md.png', label: "קוסקוס", showAge: true },
  'cat4': { image: 'https://i.im.ge/2025/12/27/Bt8F9m.2.md.png', label: "לילה", showAge: true },
  'cat5': { image: 'https://i.im.ge/2025/12/27/Bt8d3T.cat5.md.png', label: "מושית", showAge: true },
  'cat6': { image: 'https://i.im.ge/2025/12/27/BtcWAp.cat6.png', label: "טיגי", showAge: true },
  'cat7': { image: 'https://i.im.ge/2025/12/27/BtWJux.cat7.md.png', label: "יהודית", showAge: true },
  'cat8': { image: 'https://i.im.ge/2025/12/28/BCZbSz.cat8.md.png', label: "זלדה", showAge: true },
  
  // Sea Suit
  'Pyracard': { image: 'https://i.im.ge/2025/12/28/BCnAOh.Pyracard.md.png', label: "פירה ומיתרה", showAge: true },
  'Rupaulcard': { image: 'https://i.im.ge/2025/12/28/BCnPyX.Rupalcard.md.png', label: "רופול", showAge: true },
  'Singerscard': { image: 'https://i.im.ge/2025/12/28/BCnNs9.Singerscard.md.png', label: "יוני בלוך", showAge: true },
  'Minecard': { image: 'https://i.im.ge/2025/12/28/BCn9Tz.Minecard.md.png', label: "מיינקראפט", showAge: true },
  'Piratecard': { image: 'https://i.im.ge/2025/12/28/BCnjU6.Piratecard.md.png', label: "אוצרות או צרות", showAge: true },
  'Isaaccard': { image: 'https://i.im.ge/2025/12/28/BCnijy.Isaaccard.md.png', label: "יצחק", showAge: true },
  'simscard': { image: 'https://i.im.ge/2025/12/28/BCnmYF.simscard.md.png', label: "סימס", showAge: true },
  'Mariocard': { image: 'https://i.im.ge/2025/12/28/BCnbYC.Mariocard.md.png', label: "מריו קארט", showAge: true },
  'Papacard': { image: 'https://i.im.ge/2025/12/28/BCn3oD.Papacard.md.png', label: "פהפה לואי", showAge: true },
  'Erencard': { image: 'https://i.im.ge/2025/12/28/BCnEWY.Erencard.md.png', label: "ארן יגל", showAge: true },
  'Marcuscard': { image: 'https://i.im.ge/2025/12/31/BZPzGa.Marcuscard.md.png', label: "מרקוס", showAge: true },
  'Huntercard': { image: 'https://i.im.ge/2025/12/31/BZP41z.Huntercard.md.png', label: "האנטר", showAge: true },
  'Kapitcard': { image: 'https://i.im.ge/2025/12/31/BZPvAy.Kapitcard.md.png', label: "קפיט", showAge: true },
  'OTGWcard': { image: 'https://i.im.ge/2026/01/01/BfFQ10.OTGWcard.md.png', label: "OTGW", showAge: true },

  // Paintbrush Suit
  'Videocard': { image: 'https://i.im.ge/2025/12/28/BE2d6Y.Videocard.md.png', label: "סרטונים", showAge: true },
  'Stylecard': { image: 'https://i.im.ge/2025/12/28/BE2SSM.Stylecard.md.png', label: "סטייל", showAge: true },
  'singcard': { image: 'https://i.im.ge/2025/12/28/BE21vh.singcard.md.png', label: "לשיר", showAge: true },
  'Scentcard': { image: 'https://i.im.ge/2025/12/28/BE2OC8.Scentcard.md.png', label: "ריחות", showAge: true },
  'Ridecard': { image: 'https://i.im.ge/2025/12/28/BE2FDX.Ridecard.md.png', label: "רכיבה", showAge: true },
  'Readingcard': { image: 'https://i.im.ge/2025/12/28/BE2re9.Readingcard.md.png', label: "לקרוא", showAge: true },
  'Actingcard': { image: 'https://i.im.ge/2025/12/28/BE2QKz.Actingcard.md.png', label: "משחק", showAge: true },
  'Cookcard': { image: 'https://i.im.ge/2025/12/28/BE1BpJ.Cookcard.md.png', label: "בישול", showAge: true },
  'Makeupcard': { image: 'https://i.im.ge/2025/12/28/BE1e2y.Makeupcard.md.png', label: "איפור", showAge: true },
  'Musiccard': { image: 'https://i.im.ge/2025/12/28/BE2X0F.Musiccard.md.png', label: "מוזיקה", showAge: true },
  'Naturecard': { image: 'https://i.im.ge/2025/12/28/BE2M6S.Naturecard.md.png', label: "טבע", showAge: true },
  'Paintcard': { image: 'https://i.im.ge/2025/12/28/BE2ol6.Paintcard.md.png', label: "ציור", showAge: true },
  'Raincard': { image: 'https://i.im.ge/2025/12/28/BE2lcK.Raincard.md.png', label: "גשם", showAge: true },
  'Tenbiscard': { image: 'https://i.im.ge/2025/12/31/BZCDDX.Tenbiscard.md.png', label: "תן ביס", showAge: true },
  'Coffeecard': { image: 'https://i.im.ge/2025/12/31/BZYks9.Coffeecard.md.png', label: "קפה", showAge: true },

  // Strawberry Suit
  'Teacard': { image: 'https://i.im.ge/2025/12/28/BEhLpC.7.md.png', label: "ליפטון", showAge: true },
  'Forestcard': { image: 'https://i.im.ge/2025/12/28/BEhIA4.6.md.png', label: "האילנות", showAge: true },
  'Epecard': { image: 'https://i.im.ge/2025/12/28/BEhD7D.5.md.png', label: "אפה", showAge: true },
  'Friendscard': { image: 'https://i.im.ge/2025/12/31/BZNyLa.Friendscard.md.png', label: "חברים", showAge: true },
  'Familycard': { image: 'https://i.im.ge/2025/12/28/BEhqih.3.md.png', label: "משפחה", showAge: true },
  'Ryancard': { image: 'https://i.im.ge/2025/12/28/BEhaGY.2.md.png', label: "ריאן", showAge: true },
  'Fridaycard': { image: 'https://i.im.ge/2025/12/28/BEhscM.1.md.png', label: "ארוחת שישי", showAge: true },
  'BabyGcard': { image: 'https://i.im.ge/2025/12/28/BEhmcm..md.png', label: "בייבי גלי", showAge: true },
  'Galiandtamercard': { image: 'https://i.im.ge/2025/12/28/BEhjif.12.md.png', label: "גלי ותאמר", showAge: true },
  'Miguelcard': { image: 'https://i.im.ge/2025/12/28/BEh9l1.11.md.png', label: "סרבנטס", showAge: true },
  'Tamercard': { image: 'https://i.im.ge/2025/12/28/BEh0KP.10.md.png', label: "תאמר", showAge: true },
  'Galicard': { image: 'https://i.im.ge/2025/12/28/BEhiwp.9.md.png', label: "גלי", showAge: true },
  'Goatcard': { image: 'https://i.im.ge/2025/12/28/BEhh2q.8.md.png', label: "העז", showAge: true },
  'Parentscard': { image: 'https://i.im.ge/2025/12/31/BZKVPC.Parentscard.md.png', label: "הורים", showAge: true },
  'Hagefencard': { image: 'https://i.im.ge/2025/12/31/BZKzup.Hagefencard.md.png', label: "הגפן", showAge: true }
};

export const Card: React.FC<CardProps> = ({ card, onClick, disabled, isFaceUp = true, noHover = false, className = '' }) => {
  const [isFlipped, setIsFlipped] = useState(!isFaceUp);
  const specialData = card.name ? SPECIAL_CATS[card.name] : null;

  // Sync internal flip state with prop if needed
  React.useEffect(() => {
    setIsFlipped(!isFaceUp);
  }, [isFaceUp]);

  // Special Visual for Permanent Bank Modifiers (Blue Number)
  if (card.isPermanentModifier) {
      return (
        <div className={`w-16 h-20 rounded-lg shadow-sm border-2 border-blue-400 bg-blue-50 flex items-center justify-center ${className}`}>
            <span className="text-2xl font-bold text-blue-600">{card.value}</span>
        </div>
      );
  }

  if (!isFaceUp) {
      return (
        <div 
            onClick={disabled ? undefined : onClick}
            className={`w-28 h-40 rounded-xl shadow-md border-2 border-white/20 cursor-pointer transition-transform hover:-translate-y-2 bg-slate-700 flex items-center justify-center ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <span className="text-4xl select-none opacity-50">{SuitIcons[card.suit]}</span>
        </div>
      )
  }

  return (
    <div className={`flex flex-col items-center ${noHover ? 'pointer-events-none' : ''}`}>
      <div 
        onClick={disabled ? undefined : onClick}
        className={`relative w-28 h-40 rounded-xl shadow-lg border-2 flex flex-col items-center justify-between p-2 select-none transition-all ${specialData ? 'bg-white border-purple-300 overflow-hidden' : SuitColors[card.suit]} ${className} ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''} ${!disabled && !noHover ? 'cursor-pointer hover:scale-105 hover:z-10' : ''}`}
      >
        {specialData ? (
          <>
            <img src={specialData.image} alt={card.name} className="absolute inset-0 w-full h-full object-contain" />
            {specialData.showAge && (
              <div className="absolute top-2 left-2 bg-white/90 rounded-lg px-2 py-0.5 shadow-md border border-purple-200 z-10 animate-fade-in">
                <span className="font-black text-sm text-purple-700">{card.value > 0 ? `+${card.value}` : card.value}</span>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Top Value */}
            <div className="w-full flex justify-between items-start">
              <span className="font-bold text-lg">{card.value > 0 ? `+${card.value}` : card.value}</span>
              {card.isDefense && <Shield className="w-4 h-4 text-slate-600" />}
            </div>

            {/* Image / Icon */}
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <span className="text-3xl mb-1">{SuitIcons[card.suit]}</span>
              {card.name && <span className="text-[10px] font-bold uppercase text-black/50 mb-1">{card.name}</span>}
              <p className="text-[10px] leading-tight font-medium overflow-hidden h-10 px-1">
                  {card.description}
              </p>
            </div>

            {/* Bottom Power Indicator */}
            <div className="w-full flex justify-center pt-1 border-t border-black/10">
               <span className="text-[9px] font-bold uppercase tracking-tighter opacity-70">
                  {card.powerType.replace('_', ' ')}
               </span>
            </div>
          </>
        )}
      </div>
      {specialData && <span className="mt-1 font-black text-purple-700 text-sm tracking-tight">{specialData.label}</span>}
    </div>
  );
};