import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clover, Dices, Check, X, Sparkles, ChevronDown } from 'lucide-react';
import { useGameSounds } from '@/hooks/useSound';

interface LuckPassiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (success: boolean) => void;
  skillName: string;
  player: 'player1' | 'player2';
  isRotated?: boolean;
  luckPercentage?: number;
}

export const LuckPassiveModal = ({
  isOpen,
  onClose,
  onResult,
  skillName,
  player,
  isRotated = false,
  luckPercentage = 25,
}: LuckPassiveModalProps) => {
  const { playSound } = useGameSounds();
  const [phase, setPhase] = useState<'idle' | 'rolling' | 'result'>('idle');
  const [diceValue, setDiceValue] = useState(1);
  const [success, setSuccess] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const hasResultedRef = useRef(false);
  
  const playerBgClass = player === 'player1' ? 'bg-player1' : 'bg-player2';
  const playerBorderClass = player === 'player1' ? 'border-player1' : 'border-player2';
  const playerBgLight = player === 'player1' ? 'bg-player1/20' : 'bg-player2/20';

  const isAutoSuccess = luckPercentage === 100;

  useEffect(() => {
    if (!isOpen) {
      setPhase('idle');
      setSuccess(false);
      setDiceValue(1);
      hasResultedRef.current = false;
      setShowInfo(false);
    } else if (isAutoSuccess) {
      setPhase('result');
      setSuccess(true);
      setDiceValue(100);
      playSound('skillActivate');
    }
  }, [isOpen, isAutoSuccess, playSound]);

  const startRolling = () => {
    if (phase !== 'idle' || isAutoSuccess) return;
    
    setPhase('rolling');
    playSound('diceRoll');
    
    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 100) + 1);
    }, 50);

    setTimeout(() => {
      clearInterval(rollInterval);
      
      if (hasResultedRef.current) return;
      hasResultedRef.current = true;
      
      const finalValue = Math.floor(Math.random() * 100) + 1;
      const isSuccess = finalValue <= luckPercentage;
      
      setDiceValue(finalValue);
      setSuccess(isSuccess);
      
      if (isSuccess) {
        playSound('skillActivate');
      } else {
        playSound('defeat');
      }
      
      setPhase('result');
    }, 2000);
  };

  const handleConfirm = () => {
    onResult(success);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
        style={{ transform: isRotated ? 'rotate(180deg)' : 'none' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={`relative w-full max-w-[650px] bg-card ${playerBorderClass} border-2 rounded-xl shadow-2xl overflow-hidden`}
          initial={{ scale: 0.9, opacity: 0, x: -20 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          exit={{ scale: 0.9, opacity: 0, x: -20 }}
        >
          {/* Horizontal Layout */}
          <div className="flex flex-col sm:flex-row">
            {/* Left Column - Header */}
            <div className={`${playerBgLight} p-4 sm:w-[180px] shrink-0`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg ${phase === 'result' && success ? 'bg-green-500' : playerBgClass}`}>
                  <Clover className="w-5 h-5 text-white" />
                </div>
              </div>
              
              <h3 className="font-display font-bold text-base mb-1">🍀 Pasiva de Suerte</h3>
              <span className="text-xs text-muted-foreground">{skillName}</span>
              
              {/* Luck indicator */}
              <div className="mt-3 p-2 rounded-lg bg-muted/50 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Probabilidad</p>
                <p className={`text-xl font-display font-black ${luckPercentage === 100 ? 'text-green-400' : 'text-amber-400'}`}>
                  {luckPercentage}%
                </p>
                {luckPercentage === 100 && (
                  <p className="text-[10px] text-emerald-400">🍀 100% Chances</p>
                )}
              </div>
              
              {/* Collapsible info */}
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="mt-3 w-full flex items-center justify-between p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-xs"
              >
                <span className="text-purple-400">Info</span>
                <motion.div animate={{ rotate: showInfo ? 180 : 0 }}>
                  <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
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
                    <p className="pt-2 text-[10px] text-muted-foreground">
                      Tira el dado para intentar anular el castigo y reactivar la habilidad.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Right Column - Content */}
            <div className="flex-1 p-4 flex flex-col items-center justify-center min-h-[200px]">
              {/* Dice */}
              <div className="relative mb-4">
                <motion.div
                  className={`w-24 h-24 rounded-xl flex items-center justify-center text-3xl font-display font-black shadow-lg ${
                    phase === 'result' 
                      ? success 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                      : `${playerBgClass} text-white`
                  }`}
                  animate={phase === 'rolling' ? { 
                    rotateX: [0, 360],
                    rotateY: [0, 360],
                    scale: [1, 1.1, 1],
                  } : phase === 'result' ? {
                    scale: [1, 1.2, 1],
                  } : {}}
                  transition={{ 
                    duration: phase === 'rolling' ? 0.3 : 0.5, 
                    repeat: phase === 'rolling' ? Infinity : 0,
                    ease: "linear"
                  }}
                  style={{
                    boxShadow: phase === 'result' 
                      ? success 
                        ? '0 0 40px 10px rgba(34, 197, 94, 0.4)'
                        : '0 0 40px 10px rgba(239, 68, 68, 0.4)'
                      : '0 10px 30px rgba(0,0,0,0.3)',
                  }}
                >
                  {phase === 'idle' ? (
                    <Dices className="w-10 h-10" />
                  ) : phase === 'rolling' ? (
                    <Dices className="w-10 h-10" />
                  ) : (
                    diceValue
                  )}
                </motion.div>

                {/* Success/Fail particles */}
                {phase === 'result' && (
                  <>
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute"
                        initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                        animate={{ 
                          opacity: [0, 1, 0],
                          scale: [0, 1.5, 0],
                          x: Math.cos(i * 45 * Math.PI / 180) * 60,
                          y: Math.sin(i * 45 * Math.PI / 180) * 60,
                        }}
                        transition={{ duration: 1, delay: i * 0.05 }}
                        style={{ left: '50%', top: '50%' }}
                      >
                        {success ? (
                          <Sparkles className="w-4 h-4 text-green-400" />
                        ) : (
                          <X className="w-4 h-4 text-red-400" />
                        )}
                      </motion.div>
                    ))}
                  </>
                )}
              </div>

              {/* Result Text */}
              {phase === 'result' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-4"
                >
                  {isAutoSuccess ? (
                    <>
                      <p className="text-2xl font-display font-black text-emerald-400">
                        ✨ 100% DE CHANCES ✨
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ¡El castigo ha sido anulado!
                      </p>
                    </>
                  ) : (
                    <>
                      <p className={`text-2xl font-display font-black ${success ? 'text-green-400' : 'text-red-400'}`}>
                        {success ? '¡SUERTE!' : 'SIN SUERTE'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {success 
                          ? '¡Castigo anulado! Habilidad reactiva.'
                          : 'El castigo se aplica.'
                        }
                      </p>
                    </>
                  )}
                </motion.div>
              )}

              {/* Roll instruction */}
              {phase === 'idle' && (
                <motion.p
                  className="text-xs text-muted-foreground text-center mb-4"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Presiona el botón para tirar
                </motion.p>
              )}

              {/* Action */}
              <div className="w-full max-w-xs">
                {phase === 'idle' && (
                  <motion.button
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-display font-bold uppercase text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg"
                    onClick={startRolling}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Dices className="w-4 h-4" />
                    Tirar Dado
                  </motion.button>
                )}
                
                {phase === 'rolling' && (
                  <div className="w-full py-2.5 rounded-lg bg-muted/50 text-muted-foreground font-display font-bold uppercase text-sm tracking-wider flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Dices className="w-4 h-4" />
                    </motion.div>
                    Girando...
                  </div>
                )}
                
                {phase === 'result' && (
                  <motion.button
                    className={`w-full py-2.5 rounded-lg ${
                      success ? 'bg-green-500' : 'bg-red-500'
                    } text-white font-display font-bold uppercase text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg`}
                    onClick={handleConfirm}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Check className="w-4 h-4" />
                    Continuar
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};