import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, Plus, Minus, X, Sparkles, Skull, 
  CheckCircle, AlertTriangle, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface WitchCovenState {
  isActive: boolean;
  activatedTurn: number;
  witchCount: {
    field: number;
    hand: number;
    graveyard: number; // descarte
    averno: number;
  };
  treasureLimit: number; // límite actual de tesoros (base 7, puede aumentar)
  motherWitchCooldown: number; // turnos restantes para usar Conjuro de la Bruja Madre
  lastMotherWitchTurn: number; // último turno donde se usó
}

interface WitchCovenModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: 'player1' | 'player2';
  playerTurnCount: number;
  covenState: WitchCovenState;
  onUpdateCovenState: (state: WitchCovenState) => void;
  onActivateCoven: () => void;
  onUseCalderon: (totalDamage: number) => void;
  onUseMotherWitchSpell: () => void;
  currentLife: number;
  customColor?: string;
}

const COVEN_REQUIRED_TURN = 5;
const CALDERON_COST = 7; // 7 Tesoros
const CALDERON_DAMAGE_PER_WITCH = 3;
const MOTHER_WITCH_COOLDOWN = 3;

export const WitchCovenModal = ({
  isOpen,
  onClose,
  player,
  playerTurnCount,
  covenState,
  onUpdateCovenState,
  onActivateCoven,
  onUseCalderon,
  onUseMotherWitchSpell,
  currentLife,
  customColor,
}: WitchCovenModalProps) => {
  const playerLabel = player === 'player1' ? 'Jugador 1' : 'Jugador 2';
  const canActivate = playerTurnCount >= COVEN_REQUIRED_TURN && !covenState.isActive;
  const turnsUntilActivation = COVEN_REQUIRED_TURN - playerTurnCount;
  
  // Calculate total witches (all zones count when coven is active)
  const totalWitches = covenState.isActive 
    ? covenState.witchCount.field + covenState.witchCount.hand + 
      covenState.witchCount.graveyard + covenState.witchCount.averno
    : covenState.witchCount.graveyard; // Only graveyard when inactive
  
  const calderonDamage = totalWitches * CALDERON_DAMAGE_PER_WITCH;
  
  // Check if Mother Witch spell is available
  const canUseMotherWitch = covenState.isActive && covenState.motherWitchCooldown <= 0;

  const updateWitchCount = (zone: keyof WitchCovenState['witchCount'], delta: number) => {
    const newCount = Math.max(0, covenState.witchCount[zone] + delta);
    onUpdateCovenState({
      ...covenState,
      witchCount: {
        ...covenState.witchCount,
        [zone]: newCount,
      },
    });
  };

  const handleActivate = () => {
    onActivateCoven();
    onUpdateCovenState({
      ...covenState,
      isActive: true,
      activatedTurn: playerTurnCount,
    });
  };

  const handleUseCalderon = () => {
    if (totalWitches > 0) {
      onUseCalderon(calderonDamage);
    }
  };

  const handleUseMotherWitch = () => {
    if (canUseMotherWitch) {
      onUseMotherWitchSpell();
      // Cooldown se aplica en Index.tsx basado en si fue éxito o fallo
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-card border-2 border-purple-500/60 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          style={{ boxShadow: '0 0 50px rgba(168, 85, 247, 0.3)' }}
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 p-4 rounded-t-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
            
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-3 rounded-xl bg-white/20 backdrop-blur-sm"
              >
                <Flame className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h2 className="text-xl font-black text-white drop-shadow-lg">
                  Cacería del Aquelarre Absoluto
                </h2>
                <p className="text-purple-200 text-sm">{playerLabel}</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Activation Status */}
            {!covenState.isActive ? (
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/40">
                {canActivate ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="font-bold text-emerald-400">¡Disponible para activar!</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      El Aquelarre puede activarse. Una vez activo, es <strong className="text-purple-400">permanente</strong> durante el resto de la partida.
                    </p>
                    <Button
                      onClick={handleActivate}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-bold"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Activar Aquelarre Absoluto
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      <span className="font-bold text-amber-400">Aún no disponible</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Disponible a partir del <strong>turno 5</strong>. 
                      <span className="text-amber-400 font-bold ml-1">
                        Faltan {turnsUntilActivation} turno{turnsUntilActivation > 1 ? 's' : ''}.
                      </span>
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/40 flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="p-2 rounded-full bg-emerald-500/30"
                >
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </motion.div>
                <div>
                  <span className="font-black text-emerald-400 text-sm uppercase tracking-wider">Aquelarre Activo</span>
                  <p className="text-xs text-emerald-300/70">Permanente · Todas las brujas cuentan</p>
                </div>
              </div>
            )}

            {/* Witch Counter Section */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4" />
                Contador de Brujas
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                {/* Campo */}
                <div className={`p-3 rounded-xl border ${covenState.isActive ? 'border-purple-500/50 bg-purple-500/10' : 'border-muted bg-muted/20 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Campo</span>
                    {covenState.isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300">Cuenta</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => updateWitchCount('field', -1)}
                      className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                      disabled={covenState.witchCount.field <= 0}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xl font-black text-purple-400 w-8 text-center">
                      {covenState.witchCount.field}
                    </span>
                    <button
                      onClick={() => updateWitchCount('field', 1)}
                      className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Mano */}
                <div className={`p-3 rounded-xl border ${covenState.isActive ? 'border-purple-500/50 bg-purple-500/10' : 'border-muted bg-muted/20 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Mano</span>
                    {covenState.isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300">Cuenta</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => updateWitchCount('hand', -1)}
                      className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                      disabled={covenState.witchCount.hand <= 0}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xl font-black text-purple-400 w-8 text-center">
                      {covenState.witchCount.hand}
                    </span>
                    <button
                      onClick={() => updateWitchCount('hand', 1)}
                      className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Descarte/Graveyard */}
                <div className="p-3 rounded-xl border border-amber-500/50 bg-amber-500/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Descarte</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-300">Siempre cuenta</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => updateWitchCount('graveyard', -1)}
                      className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                      disabled={covenState.witchCount.graveyard <= 0}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xl font-black text-amber-400 w-8 text-center">
                      {covenState.witchCount.graveyard}
                    </span>
                    <button
                      onClick={() => updateWitchCount('graveyard', 1)}
                      className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Averno */}
                <div className={`p-3 rounded-xl border ${covenState.isActive ? 'border-red-500/50 bg-red-500/10' : 'border-muted bg-muted/20 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Averno</span>
                    {covenState.isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/30 text-red-300">Cuenta</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => updateWitchCount('averno', -1)}
                      className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                      disabled={covenState.witchCount.averno <= 0}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xl font-black text-red-400 w-8 text-center">
                      {covenState.witchCount.averno}
                    </span>
                    <button
                      onClick={() => updateWitchCount('averno', 1)}
                      className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Total Counter */}
              <motion.div
                className="p-4 rounded-xl bg-gradient-to-br from-purple-600/30 to-purple-800/20 border-2 border-purple-500/60"
                animate={{ 
                  boxShadow: [
                    '0 0 0 0 rgba(168, 85, 247, 0)',
                    '0 0 20px 5px rgba(168, 85, 247, 0.3)',
                    '0 0 0 0 rgba(168, 85, 247, 0)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-6 h-6 text-purple-400" />
                    <span className="font-bold text-purple-300">Total Brujas</span>
                  </div>
                  <span className="text-3xl font-black text-purple-400">{totalWitches}</span>
                </div>
              </motion.div>
            </div>

            {/* Caldero Negro Section */}
            {covenState.isActive && (
              <div className="space-y-3 pt-2 border-t border-border/50">
                <h3 className="font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  🔥 Caldero Negro
                </h3>
                
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-600/20 to-orange-700/10 border border-amber-500/40">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <span className="text-xs text-muted-foreground block mb-1">Costo</span>
                      <span className="text-xl font-black text-amber-400">{CALDERON_COST} 💎</span>
                    </div>
                    <div className="text-center">
                      <span className="text-xs text-muted-foreground block mb-1">Daño Total</span>
                      <motion.span 
                        className="text-xl font-black text-red-400"
                        animate={{ scale: calderonDamage > 0 ? [1, 1.1, 1] : 1 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        {calderonDamage} ❤️‍🔥
                      </motion.span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-amber-300/80 mb-3 p-2 rounded-lg bg-black/20">
                    <strong>{CALDERON_DAMAGE_PER_WITCH} daño directo × {totalWitches} brujas = {calderonDamage} daño</strong>
                    <br />
                    <span className="text-amber-400/70">⚠️ Innegable (excepto Anulación de Jackpot)</span>
                  </div>

                  <Button
                    onClick={handleUseCalderon}
                    disabled={totalWitches === 0}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white font-bold disabled:opacity-40"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Activar Caldero Negro ({calderonDamage} daño)
                  </Button>
                </div>
              </div>
            )}

            {/* Mother Witch Spell Section */}
            {covenState.isActive && (
              <div className="space-y-3 pt-2 border-t border-border/50">
                <h3 className="font-bold text-sm text-violet-400 uppercase tracking-wider flex items-center gap-2">
                  🧙‍♀️ Conjuro de la Bruja Madre
                </h3>
                
                <div className="p-4 rounded-xl bg-gradient-to-br from-violet-600/20 to-violet-800/10 border border-violet-500/40">
                  <div className="text-xs text-violet-300/80 mb-3 space-y-2">
                    <p><strong>Si NO tienes el Caldero Negro en mano:</strong> Roba 3 cartas.</p>
                    <p className="pl-3">• <span className="text-red-400">No aparece:</span> Pierdes 3 vida, descarta 1 tesoro.</p>
                    <p className="pl-3">• <span className="text-emerald-400">Aparece:</span> Descarta las otras 2 cartas. <strong>+2 límite de tesoros permanente</strong>.</p>
                    <p className="text-violet-400/70">Cooldown: {MOTHER_WITCH_COOLDOWN} turnos</p>
                  </div>
                  
                  {covenState.motherWitchCooldown > 0 ? (
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <span className="text-sm text-muted-foreground">
                        Disponible en <strong className="text-violet-400">{covenState.motherWitchCooldown} turno{covenState.motherWitchCooldown > 1 ? 's' : ''}</strong>
                      </span>
                    </div>
                  ) : (
                    <Button
                      onClick={handleUseMotherWitch}
                      className="w-full bg-gradient-to-r from-violet-600 to-violet-800 hover:from-violet-500 hover:to-violet-700 text-white font-bold"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Usar Conjuro
                    </Button>
                  )}
                </div>

                {/* Treasure Limit Display */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-muted">
                  <span className="text-sm text-muted-foreground">Límite de Tesoros Actual:</span>
                  <span className="text-lg font-black text-amber-400">{covenState.treasureLimit} 💎</span>
                </div>
              </div>
            )}

            {/* Rules Reference */}
            <div className="pt-2 border-t border-border/50">
              <details className="group">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                  <span className="text-muted-foreground group-open:rotate-90 transition-transform">▶</span>
                  Ver reglas completas
                </summary>
                <div className="mt-2 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground space-y-2">
                  <p><strong>Activación:</strong> Manual, solo desde turno 5 del portador.</p>
                  <p><strong>Duración:</strong> Permanente hasta fin de partida.</p>
                  <p><strong>Caldero Negro:</strong> 7 tesoros, 3 daño × bruja, innegable (excepto Anulación Jackpot).</p>
                  <p><strong>Brujas cuentan:</strong> Todas las zonas cuando está activo (campo, mano, descarte, averno).</p>
                  <p><strong>⚠️ Contraataque Desesperado:</strong> Si el daño del Caldero Negro es letal, se activa si el rival la posee.</p>
                </div>
              </details>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WitchCovenModal;
