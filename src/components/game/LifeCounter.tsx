import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';

interface LifeCounterProps {
  life: number;
  onLifeChange: (delta: number) => void;
  onLifeSet: (value: number) => void;
  player: 'player1' | 'player2';
  isDefeated: boolean;
  customColor?: string; // HSL value like "40 90% 50%"
}

export const LifeCounter = ({ 
  life, 
  onLifeChange, 
  onLifeSet,
  player, 
  isDefeated,
  customColor 
}: LifeCounterProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [lastChange, setLastChange] = useState<number | null>(null);

  // Use custom color if provided, otherwise fall back to CSS variables
  const colorStyle = customColor 
    ? { color: `hsl(${customColor})`, textShadow: `0 0 20px hsl(${customColor})` }
    : undefined;

  const glowStyle = customColor
    ? { textShadow: `0 0 20px hsl(${customColor}), 0 0 40px hsl(${customColor} / 0.5)` }
    : undefined;

  const buttonStyle = customColor
    ? { 
        backgroundColor: `hsl(${customColor} / 0.2)`,
        color: `hsl(${customColor})`,
        borderColor: `hsl(${customColor} / 0.3)`
      }
    : undefined;

  const colorClass = !customColor 
    ? (player === 'player1' 
        ? 'text-player1 text-glow-player1' 
        : 'text-player2 text-glow-player2')
    : '';

  const buttonClass = !customColor
    ? (player === 'player1'
        ? 'bg-player1/20 text-player1 hover:bg-player1/30 active:bg-player1/40 border border-player1/30'
        : 'bg-player2/20 text-player2 hover:bg-player2/30 active:bg-player2/40 border border-player2/30')
    : 'border';

  const handleChange = useCallback((delta: number) => {
    onLifeChange(delta);
    setLastChange(delta);
    setTimeout(() => setLastChange(null), 600);
  }, [onLifeChange]);

  const handleLifeClick = useCallback(() => {
    setInputValue(life.toString());
    setIsEditing(true);
  }, [life]);

  const handleInputSubmit = useCallback(() => {
    const value = parseInt(inputValue, 10);
    if (!isNaN(value) && value >= 0) {
      onLifeSet(value);
    }
    setIsEditing(false);
    setInputValue('');
  }, [inputValue, onLifeSet]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue('');
    }
  }, [handleInputSubmit]);

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4">
      <div className="flex items-center gap-3 sm:gap-5 md:gap-8">
        {/* Minus Button */}
        <motion.button
          className={`life-button w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 ${buttonClass}`}
          style={buttonStyle}
          onClick={() => handleChange(-1)}
          whileTap={{ scale: 0.9 }}
          disabled={life === 0}
        >
          <Minus className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
        </motion.button>

        {/* Life Display */}
        <div className="relative min-w-[120px] sm:min-w-[150px] md:min-w-[180px] flex justify-center">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.input
                key="input"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleInputSubmit}
                onKeyDown={handleInputKeyDown}
                autoFocus
                className={`life-counter text-6xl sm:text-7xl md:text-8xl w-28 sm:w-36 md:w-44 text-center bg-transparent border-b-2 outline-none ${colorClass}`}
                style={{ 
                  borderColor: customColor ? `hsl(${customColor})` : 'currentColor',
                  ...colorStyle,
                  ...glowStyle
                }}
                min={0}
              />
            ) : (
              <motion.div
                key="display"
                className={`life-counter text-6xl sm:text-7xl md:text-8xl cursor-pointer ${colorClass} ${isDefeated ? 'opacity-50' : ''}`}
                style={{ ...colorStyle, ...glowStyle }}
                onClick={handleLifeClick}
                animate={lastChange !== null ? {
                  scale: [1, 1.1, 1],
                } : {}}
                transition={{ duration: 0.3 }}
              >
                {life}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Change indicator */}
          <AnimatePresence>
            {lastChange !== null && (
              <motion.div
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: -20 }}
                exit={{ opacity: 0, y: -35 }}
                className={`absolute top-0 right-0 text-xl sm:text-2xl md:text-3xl font-bold ${
                  lastChange > 0 ? 'text-phase-juego' : 'text-destructive'
                }`}
              >
                {lastChange > 0 ? `+${lastChange}` : lastChange}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Plus Button */}
        <motion.button
          className={`life-button w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 ${buttonClass}`}
          style={buttonStyle}
          onClick={() => handleChange(1)}
          whileTap={{ scale: 0.9 }}
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
        </motion.button>
      </div>

      {/* Quick adjust buttons - More compact for mobile */}
      <div className="flex gap-1.5 sm:gap-2">
        {[-5, -1, 1, 5].map((delta) => (
          <motion.button
            key={delta}
            className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium ${buttonClass} opacity-70 hover:opacity-100`}
            style={buttonStyle}
            onClick={() => handleChange(delta)}
            whileTap={{ scale: 0.95 }}
            disabled={delta < 0 && life + delta < 0}
          >
            {delta > 0 ? `+${delta}` : delta}
          </motion.button>
        ))}
      </div>
    </div>
  );
};