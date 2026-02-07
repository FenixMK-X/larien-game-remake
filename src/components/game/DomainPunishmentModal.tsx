import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, AlertTriangle, X, Flame, Droplet, Clover, Dices, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DomainPunishment {
  domainId: string;
  domainName: string;
  skillId: string;
  player: 'player1' | 'player2';
  endedOnOwnTurn: boolean;
  punishmentType: 'complete' | 'reduced' | 'canceled';
  hasEffect8?: boolean;
  hasEffect9?: boolean;
  luckPercentage?: number;
  isSecondChance?: boolean;
}

interface DomainPunishmentModalProps {
  isOpen: boolean;
  punishment: DomainPunishment | null;
  onClose: () => void;
  onTryLuck: (punishment: DomainPunishment) => void;
  onCanceled?: (punishment: DomainPunishment) => void;
  isRotated?: boolean;
}

const getPunishmentDetails = (skillId: string, type: 'complete' | 'reduced' | 'canceled', hasEffect8?: boolean) => {
  let effectiveType = type;
  if (hasEffect8 && type === 'complete') {
    effectiveType = 'reduced';
  } else if (hasEffect8 && type === 'reduced') {
    effectiveType = 'canceled';
  }

  if (effectiveType === 'canceled') {
    return {
      title: '✅ Castigo Anulado',
      color: 'text-green-500',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500',
      effects: ['El castigo ha sido anulado por Reescritura del Azar'],
      note: null,
      isCanceled: true,
    };
  }

  switch (skillId) {
    case 'jackpot':
      if (effectiveType === 'complete') {
        return {
          title: '☠️ Castigo Completo',
          color: 'text-red-500',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500',
          effects: [
            '💀 DERROTA AUTOMÁTICA',
            'Descarta tu mano, mazo y descarte',
            'No puedes activar habilidades ni efectos',
          ],
          note: null,
          isCanceled: false,
        };
      } else {
        return {
          title: '🟠 Castigo Reducido',
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/20',
          borderColor: 'border-orange-500',
          effects: [
            'Tu Vida se reduce a 5',
            'Descarta solo tu mano',
            '⚠️ ÚLTIMA OPORTUNIDAD: Puedes activar Jackpot una vez más',
            '❌ Efectos 8 y 9 NO disponibles en segunda oportunidad',
            '💀 Si al finalizar no ganas, pierdes automáticamente',
          ],
          note: null,
          isCanceled: false,
        };
      }
    default:
      return {
        title: effectiveType === 'complete' ? '☠️ Castigo Completo' : '🟠 Castigo Reducido',
        color: effectiveType === 'complete' ? 'text-red-500' : 'text-orange-500',
        bgColor: effectiveType === 'complete' ? 'bg-red-500/20' : 'bg-orange-500/20',
        borderColor: effectiveType === 'complete' ? 'border-red-500' : 'border-orange-500',
        effects: ['Aplicar castigo según las reglas del dominio'],
        note: null,
        isCanceled: false,
      };
  }
};

export const DomainPunishmentModal = ({
  isOpen,
  punishment,
  onClose,
  onTryLuck,
  onCanceled,
  isRotated = false,
}: DomainPunishmentModalProps) => {
  const [showEffects, setShowEffects] = useState(false);
  
  if (!isOpen || !punishment) return null;

  const details = getPunishmentDetails(punishment.skillId, punishment.punishmentType, punishment.hasEffect8);
  const playerLabel = punishment.player === 'player1' ? 'J1' : 'J2';
  const luckPercentage = punishment.luckPercentage ?? 25;

  const modalContent = (
    <motion.div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      style={{ transform: isRotated ? 'rotate(180deg)' : 'none' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={`relative w-full max-w-[700px] bg-card border-2 ${details.borderColor} rounded-xl shadow-2xl overflow-hidden`}
        initial={{ scale: 0.9, opacity: 0, x: -20 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        exit={{ scale: 0.9, opacity: 0, x: -20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Horizontal Layout Container */}
        <div className="flex flex-col sm:flex-row">
          {/* Left Column - Header & Info */}
          <div className={`${details.bgColor} p-4 sm:w-[200px] shrink-0`}>
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                className={`p-2 rounded-lg ${details.bgColor} border ${details.borderColor}`}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {details.isCanceled ? (
                  <Clover className={`w-5 h-5 ${details.color}`} />
                ) : punishment.punishmentType === 'complete' ? (
                  <Skull className={`w-5 h-5 ${details.color}`} />
                ) : (
                  <AlertTriangle className={`w-5 h-5 ${details.color}`} />
                )}
              </motion.div>
              <button
                onClick={onClose}
                className="ml-auto p-1 rounded-full bg-muted/50 hover:bg-muted transition-colors sm:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <h3 className={`font-display font-bold text-base ${details.color} mb-1`}>
              {details.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {punishment.domainName} • {playerLabel}
            </p>
            
            {/* Effect 8 indicator */}
            {punishment.hasEffect8 && (
              <div className="mt-3 p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                <p className="text-[10px] text-indigo-400 font-medium text-center">
                  🔄 Reescritura del Azar
                </p>
              </div>
            )}
            
            {/* Turn type indicator */}
            <div className={`mt-3 flex items-center gap-1.5 text-xs ${details.color}`}>
              {punishment.endedOnOwnTurn ? (
                <Flame className="w-3.5 h-3.5" />
              ) : (
                <Droplet className="w-3.5 h-3.5" />
              )}
              <span className="opacity-80">
                {punishment.endedOnOwnTurn ? 'Tu turno' : 'Turno rival'}
              </span>
            </div>
          </div>
          
          {/* Right Column - Content */}
          <div className="flex-1 p-4">
            {/* Desktop close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1 rounded-full bg-muted/50 hover:bg-muted transition-colors hidden sm:block"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Collapsible Effects Section */}
            <div className="mb-4">
              <button
                onClick={() => setShowEffects(!showEffects)}
                className={`w-full flex items-center justify-between p-2 rounded-lg ${details.bgColor} border ${details.borderColor} text-sm font-medium`}
              >
                <span className={details.color}>Efectos del Castigo ({details.effects.length})</span>
                <motion.div animate={{ rotate: showEffects ? 180 : 0 }}>
                  <ChevronDown className={`w-4 h-4 ${details.color}`} />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {showEffects && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <ul className="pt-2 space-y-1.5">
                      {details.effects.map((effect, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <span className={`font-bold ${details.color}`}>•</span>
                          <span>{effect}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Luck passive info or Second Chance warning */}
            {!details.isCanceled && !punishment.isSecondChance && (
              <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clover className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-purple-400">Pasiva de Suerte</span>
                </div>
                <p className="text-xs text-purple-300">
                  <span className="font-bold text-base">{luckPercentage}%</span> de anular castigo
                </p>
                {punishment.hasEffect9 && (
                  <p className="text-xs text-emerald-400 mt-1 font-medium">
                    🍀 100% de Chances activo
                  </p>
                )}
              </div>
            )}
            
            {!details.isCanceled && punishment.isSecondChance && (
              <div className="p-2.5 rounded-lg bg-red-500/20 border border-red-500 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Skull className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-bold text-red-400">Segunda Oportunidad Agotada</span>
                </div>
                <p className="text-xs text-red-300">
                  No hay Pasiva de Suerte disponible.
                </p>
                <p className="text-sm font-bold text-red-400 mt-1">
                  💀 DERROTA AUTOMÁTICA
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {details.isCanceled ? (
                <motion.button
                  className="flex-1 py-2.5 rounded-lg bg-green-500/20 text-green-400 font-display font-bold uppercase text-sm tracking-wider flex items-center justify-center gap-2 border border-green-500"
                  onClick={() => {
                    onCanceled?.(punishment);
                    onClose();
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Clover className="w-4 h-4" />
                  Continuar
                </motion.button>
              ) : punishment.isSecondChance ? (
                <motion.button
                  className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-display font-bold uppercase text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg"
                  onClick={() => onTryLuck(punishment)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Skull className="w-4 h-4" />
                  💀 Aceptar Derrota
                </motion.button>
              ) : (
                <motion.button
                  className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-display font-bold uppercase text-sm tracking-wider flex items-center justify-center gap-2 shadow-lg"
                  onClick={() => onTryLuck(punishment)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Dices className="w-4 h-4" />
                  🍀 Probar Suerte
                  <span className="text-xs opacity-80">({luckPercentage}%)</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && modalContent}
    </AnimatePresence>,
    document.body
  );
};

export type { DomainPunishment };