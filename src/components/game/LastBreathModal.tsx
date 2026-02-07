import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Dices, X, Zap, Target, AlertTriangle, Shield, Flame, ChevronDown } from 'lucide-react';
import { useGameSounds } from '@/hooks/useSound';

interface LastBreathModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: { winner: 'player1' | 'player2'; loser: 'player1' | 'player2'; damage: number }) => void;
  player: 'player1' | 'player2';
  currentLife: number;
  initialDamage?: number; // For passive triggers, auto-set the damage
}

type Phase = 'input' | 'rolling' | 'result';

export const LastBreathModal = ({
  isOpen,
  onClose,
  onComplete,
  player,
  currentLife,
  initialDamage,
}: LastBreathModalProps) => {
  const [phase, setPhase] = useState<Phase>(initialDamage ? 'rolling' : 'input');
  const [incomingDamage, setIncomingDamage] = useState<number>(initialDamage || 1);
  const [player1Roll, setPlayer1Roll] = useState<number>(0);
  const [player2Roll, setPlayer2Roll] = useState<number>(0);
  const [animatingDice, setAnimatingDice] = useState<number>(1);
  const [showInfo, setShowInfo] = useState(false);
  const { playSound } = useGameSounds();

  // If initialDamage changes (e.g., passive trigger), update and auto-start rolling
  useEffect(() => {
    if (initialDamage && initialDamage > 0) {
      setIncomingDamage(initialDamage);
      setPhase('rolling');
    }
  }, [initialDamage]);

  const opponent = player === 'player1' ? 'player2' : 'player1';
  const playerColorClass = player === 'player1' ? 'text-player1' : 'text-player2';
  const playerBgClass = player === 'player1' ? 'bg-player1' : 'bg-player2';
  const playerBorderClass = player === 'player1' ? 'border-player1' : 'border-player2';
  const playerBgLight = player === 'player1' ? 'bg-player1/20' : 'bg-player2/20';

  const isLethalDamage = incomingDamage >= currentLife;
  
  const calculateFinalDamage = () => {
    if (isLethalDamage) {
      return Math.ceil(incomingDamage * 3);
    }
    return Math.ceil(incomingDamage * 1.5);
  };

  const finalDamage = calculateFinalDamage();
  const damageMultiplier = isLethalDamage ? 'x3' : 'x1.5';

  useEffect(() => {
    if (phase === 'rolling') {
      const interval = setInterval(() => {
        setAnimatingDice(Math.floor(Math.random() * 6) + 1);
        playSound('diceRoll');
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        const roll1 = Math.floor(Math.random() * 6) + 1;
        const roll2 = Math.floor(Math.random() * 6) + 1;
        
        if (roll1 === roll2) {
          setPlayer1Roll(roll1);
          setPlayer2Roll(roll2);
          setTimeout(() => {
            setPhase('rolling');
          }, 1000);
        } else {
          setPlayer1Roll(roll1);
          setPlayer2Roll(roll2);
          setPhase('result');
          playSound('diceResult');
        }
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [phase, playSound]);

  const handleStartRoll = () => {
    if (incomingDamage < 1) return;
    setPhase('rolling');
  };

  const handleConfirmResult = () => {
    const winner = player1Roll > player2Roll ? 'player1' : 'player2';
    const loser = winner === 'player1' ? 'player2' : 'player1';
    onComplete({
      winner,
      loser,
      damage: finalDamage,
    });
    setPhase('input');
    setIncomingDamage(1);
    setPlayer1Roll(0);
    setPlayer2Roll(0);
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-lg p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={`relative w-full max-w-[700px] bg-card border-2 ${playerBorderClass} rounded-xl shadow-2xl overflow-hidden`}
          initial={{ scale: 0.9, opacity: 0, x: -20 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          exit={{ scale: 0.9, opacity: 0, x: -20 }}
        >
          {/* Horizontal Layout */}
          <div className="flex flex-col sm:flex-row">
            {/* Left Column - Header */}
            <div className={`${playerBgLight} p-4 sm:w-[180px] shrink-0`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg ${playerBgClass}`}>
                  <Skull className="w-5 h-5 text-white" />
                </div>
                {phase === 'input' && (
                  <button
                    onClick={onClose}
                    className="ml-auto p-1 rounded-full bg-muted/50 hover:bg-muted transition-colors sm:hidden"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <h3 className="font-display font-bold text-base mb-1">Contrataque Desesperado</h3>
              <p className="text-xs text-muted-foreground">¡Enfrentamiento de dados!</p>
              
              {/* Current Life */}
              <div className="mt-3 p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-1.5">
                  <Shield className={`w-4 h-4 ${playerColorClass}`} />
                  <span className="text-[10px] text-muted-foreground">Tu vida:</span>
                  <span className={`text-sm font-display font-black ${playerColorClass}`}>{currentLife}</span>
                </div>
              </div>
              
              {/* Collapsible info */}
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="mt-3 w-full flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs"
              >
                <span className="text-amber-400">Reglas</span>
                <motion.div animate={{ rotate: showInfo ? 180 : 0 }}>
                  <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {showInfo && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 text-[10px] text-muted-foreground space-y-1">
                      <p>• Daño letal (≥ vida): x3</p>
                      <p>• Daño no letal: x1.5</p>
                      <p>• El perdedor recibe el daño</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Right Column - Content */}
            <div className="flex-1 p-4">
              {/* Desktop close button */}
              {phase === 'input' && (
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 p-1 rounded-full bg-muted/50 hover:bg-muted transition-colors hidden sm:block"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <AnimatePresence mode="wait">
                {/* Input Phase */}
                {phase === 'input' && (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex items-center gap-2 mb-3 text-amber-500">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs font-medium">Ingresa el daño a recibir</span>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <button
                        className="w-10 h-10 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-xl font-bold transition-colors"
                        onClick={() => setIncomingDamage(Math.max(1, incomingDamage - 1))}
                      >
                        -
                      </button>
                      <div className="flex-1 text-center">
                        <input
                          type="number"
                          value={incomingDamage}
                          onChange={(e) => setIncomingDamage(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full text-center text-3xl font-display font-black bg-transparent border-none outline-none"
                          min="1"
                        />
                        <span className="text-[10px] text-muted-foreground">Daño Entrante</span>
                      </div>
                      <button
                        className="w-10 h-10 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-xl font-bold transition-colors"
                        onClick={() => setIncomingDamage(incomingDamage + 1)}
                      >
                        +
                      </button>
                    </div>

                    {/* Lethality + Final Damage in row */}
                    <div className="flex gap-2 mb-4">
                      <motion.div
                        className={`flex-1 p-2 rounded-lg border ${
                          isLethalDamage 
                            ? 'bg-destructive/20 border-destructive/50' 
                            : 'bg-amber-500/10 border-amber-500/30'
                        }`}
                        animate={{ scale: isLethalDamage ? [1, 1.02, 1] : 1 }}
                        transition={{ duration: 0.5, repeat: isLethalDamage ? Infinity : 0 }}
                      >
                        <div className="flex items-center gap-1.5">
                          {isLethalDamage ? (
                            <Flame className="w-4 h-4 text-destructive" />
                          ) : (
                            <Shield className="w-4 h-4 text-amber-500" />
                          )}
                          <span className={`text-xs font-bold ${isLethalDamage ? 'text-destructive' : 'text-amber-500'}`}>
                            {isLethalDamage ? 'LETAL' : 'No Letal'}
                          </span>
                          <span className={`text-[10px] ${isLethalDamage ? 'text-destructive/70' : 'text-amber-500/70'}`}>
                            ({damageMultiplier})
                          </span>
                        </div>
                      </motion.div>

                      <div className="flex-1 p-2 rounded-lg bg-destructive/10 border border-destructive/30">
                        <div className="flex items-center gap-1.5 text-destructive">
                          <Target className="w-4 h-4" />
                          <span className="text-xs font-bold">{finalDamage} daño</span>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      className={`w-full py-2.5 rounded-lg ${playerBgClass} text-white font-display font-bold uppercase text-sm tracking-wider flex items-center justify-center gap-2`}
                      onClick={handleStartRoll}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Dices className="w-4 h-4" />
                      ¡Tirar Dados!
                    </motion.button>
                  </motion.div>
                )}

                {/* Rolling Phase */}
                {phase === 'rolling' && (
                  <motion.div
                    key="rolling"
                    className="flex flex-col items-center py-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center mb-3"
                      animate={{ rotate: [0, 10, -10, 10, 0] }}
                      transition={{ repeat: Infinity, duration: 0.2 }}
                    >
                      <span className="text-4xl font-display font-black">{animatingDice}</span>
                    </motion.div>
                    <p className="text-sm font-display font-bold text-muted-foreground animate-pulse">
                      Tirando dados...
                    </p>
                  </motion.div>
                )}

                {/* Result Phase */}
                {phase === 'result' && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Dice Results - Compact */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className={`p-3 rounded-lg border-2 ${
                        player1Roll > player2Roll 
                          ? 'border-green-500 bg-green-500/10' 
                          : 'border-destructive bg-destructive/10'
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-player1" />
                          <span className="text-[10px] font-bold">J1</span>
                        </div>
                        <div className="text-3xl font-display font-black text-center">
                          {player1Roll}
                        </div>
                        <div className={`text-[10px] text-center font-bold ${
                          player1Roll > player2Roll ? 'text-green-500' : 'text-destructive'
                        }`}>
                          {player1Roll > player2Roll ? '¡GANA!' : 'PIERDE'}
                        </div>
                      </div>

                      <div className={`p-3 rounded-lg border-2 ${
                        player2Roll > player1Roll 
                          ? 'border-green-500 bg-green-500/10' 
                          : 'border-destructive bg-destructive/10'
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-player2" />
                          <span className="text-[10px] font-bold">J2</span>
                        </div>
                        <div className="text-3xl font-display font-black text-center">
                          {player2Roll}
                        </div>
                        <div className={`text-[10px] text-center font-bold ${
                          player2Roll > player1Roll ? 'text-green-500' : 'text-destructive'
                        }`}>
                          {player2Roll > player1Roll ? '¡GANA!' : 'PIERDE'}
                        </div>
                      </div>
                    </div>

                    {/* Damage announcement */}
                    <motion.div
                      className="p-3 rounded-lg bg-destructive/20 border border-destructive mb-3"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                    >
                      <div className="text-center">
                        <span className="text-xs text-destructive">
                          {player1Roll < player2Roll ? 'Jugador 1' : 'Jugador 2'} recibe
                        </span>
                        <div className="text-2xl font-display font-black text-destructive">
                          {finalDamage} DAÑO
                        </div>
                        <span className="text-[10px] text-destructive/60">
                          {isLethalDamage ? '🔥 Letal (x3)' : '🛡️ No Letal (x1.5)'}
                        </span>
                      </div>
                    </motion.div>

                    <motion.button
                      className={`w-full py-2.5 rounded-lg ${playerBgClass} text-white font-display font-bold uppercase text-sm tracking-wider flex items-center justify-center gap-2`}
                      onClick={handleConfirmResult}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Zap className="w-4 h-4" />
                      Aplicar Daño
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};