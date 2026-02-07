import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Timer, Play, TimerOff, Sparkles, Shield, Settings } from 'lucide-react';
import { SettingsModal, PlayerColors } from './SettingsModal';

interface SetupScreenProps {
  onStart: (life: number, timerMinutes: number | null, skillsMode: boolean, playerColors: PlayerColors) => void;
}

const lifeOptions = [
  { value: 20, label: '20', description: 'Partida Rápida' },
  { value: 40, label: '40', description: 'Partida Épica' },
];

const timerOptions = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
];

export const SetupScreen = ({ onStart }: SetupScreenProps) => {
  const [selectedLife, setSelectedLife] = useState<number>(20);
  const [useTimer, setUseTimer] = useState<boolean>(false);
  const [selectedTimer, setSelectedTimer] = useState<number>(30);
  const [skillsMode, setSkillsMode] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playerColors, setPlayerColors] = useState<PlayerColors>({ player1: 'gold', player2: 'blue' });

  const handleStart = () => {
    onStart(selectedLife, useTimer ? selectedTimer : null, skillsMode, playerColors);
  };

  return (
    <motion.div 
      className="min-h-screen bg-background flex flex-col items-center justify-center p-6 safe-area-inset relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Settings Button */}
      <motion.button
        className="absolute top-4 right-4 p-3 rounded-full bg-card border-2 border-border hover:border-primary transition-colors"
        onClick={() => setShowSettings(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Settings className="w-5 h-5 text-muted-foreground" />
      </motion.button>

      {/* Logo/Title */}
      <motion.div 
        className="flex flex-col items-center mb-12"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Swords className="w-16 h-16 text-primary mb-4" />
        <h1 className="text-4xl md:text-5xl font-display font-black text-primary text-glow-player1">
          LARIEN
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">Contador de Partida</p>
      </motion.div>

      {/* Life Selection */}
      <motion.div 
        className="w-full max-w-md mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block text-sm font-medium text-muted-foreground mb-3 text-center uppercase tracking-wider">
          Vida Inicial
        </label>
        <div className="grid grid-cols-2 gap-4">
          {lifeOptions.map((option) => (
            <motion.button
              key={option.value}
              className={`relative p-6 rounded-xl border-2 transition-all ${
                selectedLife === option.value
                  ? 'border-primary bg-primary/10 shadow-lg'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
              onClick={() => setSelectedLife(option.value)}
              whileTap={{ scale: 0.98 }}
            >
              <span className="block text-4xl font-display font-black text-foreground mb-1">
                {option.label}
              </span>
              <span className="block text-xs text-muted-foreground">
                {option.description}
              </span>
              {selectedLife === option.value && (
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-primary"
                  layoutId="life-selection"
                  transition={{ type: "spring", damping: 20 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Game Mode Toggle */}
      <motion.div 
        className="w-full max-w-md mb-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <label className="block text-sm font-medium text-muted-foreground mb-3 text-center uppercase tracking-wider">
          Modo de Juego
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSkillsMode(false)}
            className={`py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all border-2 ${
              !skillsMode 
                ? 'border-primary bg-primary/10 text-foreground' 
                : 'border-border bg-card text-muted-foreground hover:border-primary/50'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Normal</span>
          </button>
          <button
            onClick={() => setSkillsMode(true)}
            className={`py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all border-2 ${
              skillsMode 
                ? 'border-primary bg-primary/10 text-foreground' 
                : 'border-border bg-card text-muted-foreground hover:border-primary/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Con Skills</span>
          </button>
        </div>
      </motion.div>

      {/* Timer Toggle */}
      <motion.div 
        className="w-full max-w-md mb-3"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={() => setUseTimer(!useTimer)}
          className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all border-2 ${
            useTimer 
              ? 'border-primary bg-primary/10 text-foreground' 
              : 'border-border bg-card text-muted-foreground hover:border-primary/50'
          }`}
        >
          {useTimer ? (
            <Timer className="w-4 h-4" />
          ) : (
            <TimerOff className="w-4 h-4" />
          )}
          <span className="text-sm font-medium uppercase tracking-wider">
            {useTimer ? 'Usar Temporizador' : 'Sin Temporizador'}
          </span>
        </button>
      </motion.div>

      {/* Timer Selection */}
      <AnimatePresence>
        {useTimer && (
          <motion.div 
            className="w-full max-w-md mb-3"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="grid grid-cols-4 gap-2">
              {timerOptions.map((option) => (
                <motion.button
                  key={option.value}
                  className={`py-3 px-2 rounded-lg text-sm font-medium transition-all ${
                    selectedTimer === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  onClick={() => setSelectedTimer(option.value)}
                  whileTap={{ scale: 0.95 }}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start Button */}
      <motion.button
        className="flex items-center gap-3 px-8 py-4 mt-6 bg-primary text-primary-foreground rounded-full font-display font-bold text-lg uppercase tracking-wider shadow-lg hover:shadow-xl transition-shadow"
        onClick={handleStart}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Play className="w-5 h-5" />
        Comenzar Partida
      </motion.button>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        playerColors={playerColors}
        onColorsChange={setPlayerColors}
      />
    </motion.div>
  );
};