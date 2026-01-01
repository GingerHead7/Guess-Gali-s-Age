import React from 'react';
import { DieFace } from '../types';
import { Dices } from 'lucide-react';

interface DieProps {
  rolling: boolean;
  face: DieFace | null;
  onClick: () => void;
  disabled?: boolean;
}

export const Die: React.FC<DieProps> = ({ rolling, face, onClick, disabled }) => {
  const getFaceContent = (f: DieFace) => {
    switch (f) {
      case DieFace.Strawberry: return '🍓';
      case DieFace.Sea: return '🌊';
      case DieFace.Paintbrush: return '🎨';
      case DieFace.Cat: return '🐱';
      case DieFace.Combo: return '🌟';
      case DieFace.Goat: return '🐐';
      default: return '?';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || rolling}
      className={`w-20 h-20 md:w-24 md:h-24 bg-white rounded-2xl shadow-[0_10px_0_rgb(0,0,0,0.2)] active:shadow-none active:translate-y-[10px] transition-all flex items-center justify-center border-4 border-slate-300 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}
    >
      {rolling ? (
        <Dices className="w-10 h-10 md:w-12 md:h-12 text-slate-400 animate-spin" />
      ) : (
        <span className="text-4xl md:text-5xl">{face ? getFaceContent(face) : '🎲'}</span>
      )}
    </button>
  );
};
