import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shuffle, HandMetal, Bug, Pickaxe, Check, Info, Lamp,
  Skull, Sword, Flame, Mountain, Scale, Car, Heart,
  DoorOpen, Coins, Target, Dices,
  ChevronDown, ChevronUp, Lightbulb
} from 'lucide-react';
import { DeckRecommendation } from './DeckRecommendation';

export interface SkillOption {
  id: string;
  name: string;
  description: string;
  used?: boolean;
}

export interface PunishmentDetail {
  title: string;
  condition: string;
  effects: string[];
}

export interface Skill {
  id: string;
  name: string;
  // NOTE: 'clown', 'shadow', and 'greek' icons removed - corresponding skills are disabled
  icon: 'dwarf' | 'insect' | 'lamp' | 'lastbreath' | 'hero' | 'witch' | 'giant' | 'treasure' | 'delorian' | 'dragon' | 'hellgate' | 'dollars' | 'destiny' | 'jackpot';
  description: string;
  usageType: 'conditional' | 'once' | 'limited' | 'cooldown';
  maxUses?: number;
  cooldown?: number;
  used?: boolean;
  usesRemaining?: number;
  cooldownRemaining?: number;
  options?: SkillOption[];
  requiresInput?: 'lethalDamage' | 'poisonedCount' | 'domainDice' | 'greekDice';
  ownerTurnOnly?: boolean;
  ownerTurnOnlyOptions?: string[];
  isDomainSkill?: boolean; // Habilidades que usan azar automático
  activationCondition?: 'none' | 'life50' | 'life40' | 'life25'; // Condición de vida para activar
  isDisabled?: boolean; // Habilidad deshabilitada temporalmente
  isSummonSkill?: boolean; // Skills de invocación (bloqueadas primeros 3 turnos del jugador)
  detailedRules?: {
    punishmentComplete?: PunishmentDetail;
    punishmentReduced?: PunishmentDetail;
  };
}

// Helper function to get skill icon
const getSkillIcon = (iconType: Skill['icon']) => {
  switch (iconType) {
    case 'dwarf': return Pickaxe;
    case 'insect': return Bug;
    case 'lamp': return Lamp;
    case 'lastbreath': return Skull;
    case 'hero': return Sword;
    case 'witch': return Flame;
    case 'giant': return Mountain;
    case 'treasure': return Scale;
    case 'delorian': return Car;
    case 'dragon': return Heart;
    case 'hellgate': return DoorOpen;
    case 'dollars': return Coins;
    case 'destiny': return Target;
    case 'jackpot': return Dices;
    default: return Info;
  }
};

export const AVAILABLE_SKILLS: Skill[] = [
  {
    id: 'dwarf-hunt',
    name: 'Caza de los 7 Enanos',
    icon: 'dwarf',
    description: 'Cuando controlas 7 enanos y tu vida es ≤50%, puedes buscar en tu mazo un monumento a elección. Si es jugado ese mismo turno, todas las unidades ganan Guardia hasta el final del turno.',
    usageType: 'cooldown',
    cooldown: 3,
    activationCondition: 'life50',
    ownerTurnOnly: true,
  },
  {
    id: 'insect-queen',
    name: 'Reina Insecto',
    icon: 'insect',
    description: 'Por cada unidad envenenada del rival, puedes invocar fichas insecto con Agrupar. Estas entran con +X de ataque, siendo X la cantidad de unidades rivales envenenadas.\n\nRECORDATORIO: Los insectos mueren al final del turno.',
    usageType: 'once',
    ownerTurnOnly: true,
    requiresInput: 'poisonedCount',
    isSummonSkill: true,
  },
  {
    id: 'genie-lamp',
    name: 'Lámpara del Genio',
    icon: 'lamp',
    description: '3 deseos disponibles. Cada deseo solo puede elegirse una vez:',
    usageType: 'limited',
    maxUses: 3,
    ownerTurnOnlyOptions: ['wish-1', 'wish-2'],
    options: [
      { id: 'wish-1', name: 'Robo Sorpresivo', description: 'Roba 3 cartas. Ganas 1 vida por cada unidad robada, pierdes 1 vida por cada carta no-unidad.', used: false },
      { id: 'wish-2', name: 'Daño Único', description: 'Si controlas más de una unidad, destruye todas excepto una. Esa unidad gana el daño total de las destruidas y obtiene Arrollar hasta el final del turno.', used: false },
      { id: 'wish-3', name: 'Inmortalidad', description: 'Ante daño letal o cualquier daño, descarta todos tus tesoros (mínimo 5) para anularlo.', used: false },
    ],
  },
  {
    id: 'last-breath',
    name: 'Contrataque Desesperado',
    icon: 'lastbreath',
    description: 'Cuando recibas daño, tú y tu rival tiran los dados. El perdedor recibe daño aumentado:\n\n• Daño NO letal: Se multiplica por x1.5\n• Daño LETAL (te mataría): Se multiplica por x3',
    usageType: 'cooldown',
    cooldown: 5,
    requiresInput: 'lethalDamage',
    ownerTurnOnly: false,
  },
  {
    id: 'hero-strike',
    name: 'Golpe del Héroe',
    icon: 'hero',
    description: 'Sacrifica TODOS tus tesoros para invocar (sin importar su coste) una unidad tipo Soldado con "Héroe" en su nombre desde fuera de tu mazo. Esta unidad gana Mimético, Frenesí, Agrupar y Arrollar hasta el final del turno.\n\nRECORDATORIO: El Héroe se destruye al final del turno.',
    usageType: 'once',
    ownerTurnOnly: true,
    isSummonSkill: true,
  },
  {
    id: 'witch-coven',
    name: 'Cacería del Aquelarre Absoluto',
    icon: 'witch',
    description: `DOMINIO PERMANENTE
ACTIVACIÓN: Manual, solo desde turno 5 del portador.
DURACIÓN: Permanente durante el resto de la partida.

Mientras esté activo:
• Todas las Brujas del portador (campo, mano, descarte, averno) cuentan para el Caldero Negro.
• El Caldero Negro es INNEGABLE (excepto Anulación de Jackpot).
• Daño del Caldero Negro: 3 puntos por Bruja.
• Costo del Caldero Negro: 7 Tesoros.

🧙‍♀️ CONJURO DE LA BRUJA MADRE (cada 3 turnos):
Si no tienes Caldero Negro en mano, roba 3 cartas:
• No aparece: -3 vida, -1 tesoro.
• Aparece: Descarta las otras 2, +2 límite de tesoros (permanente).`,
    usageType: 'once',
    ownerTurnOnly: true,
    isDomainSkill: true,
    requiresInput: 'witchCoven' as any,
    detailedRules: {
      punishmentComplete: {
        title: 'CALDERO NEGRO',
        condition: '(Activo con Aquelarre)',
        effects: [
          '3 daño directo por cada Bruja contabilizada',
          'Costo: 7 Tesoros',
          'Innegable (excepto Anulación de Jackpot)',
          '⚠️ Si el daño es letal, Contraataque Desesperado se activa primero'
        ]
      },
      punishmentReduced: {
        title: 'CONJURO DE LA BRUJA MADRE',
        condition: '(Cada 3 turnos)',
        effects: [
          'Si no tienes Caldero Negro en mano: Roba 3 cartas',
          '❌ No aparece: -3 vida, -1 tesoro',
          '✅ Aparece: Descarta las otras 2, +2 límite de tesoros permanente'
        ]
      }
    },
  },
  {
    id: 'jotunheimr-gate',
    name: 'Puerta a Jötunheimr',
    icon: 'giant',
    description: 'Puedes invocar un Gigante desde fuera del reino. Este gana algún subtipo del reino actual y entra con Frenesí y Agrupar.\n\nRECORDATORIO: El Gigante es permanente mientras no sea destruido.',
    usageType: 'once',
    ownerTurnOnly: true,
    isSummonSkill: true,
  },
  {
    id: 'treasure-scale',
    name: 'Escala de Tesoros',
    icon: 'treasure',
    description: 'Usa todos tus tesoros para invocar unidades de tu mano con coste igual o menor a la cantidad de tesoros (máximo 7). Sin límite de unidades si cumplen el rango de coste.',
    usageType: 'cooldown',
    cooldown: 2,
    ownerTurnOnly: true,
    options: [
      { id: 'treasure-1', name: '1 Tesoro', description: 'Invoca unidades de coste 1.', used: false },
      { id: 'treasure-2', name: '2 Tesoros', description: 'Invoca unidades de coste 1-2.', used: false },
      { id: 'treasure-3', name: '3 Tesoros', description: 'Invoca unidades de coste 1-3.', used: false },
      { id: 'treasure-4', name: '4 Tesoros', description: 'Invoca unidades de coste 1-4.', used: false },
      { id: 'treasure-5', name: '5 Tesoros', description: 'Invoca unidades de coste 1-5.', used: false },
      { id: 'treasure-6', name: '6 Tesoros', description: 'Invoca unidades de coste 1-6.', used: false },
      { id: 'treasure-7', name: '7 Tesoros (Máx)', description: 'Invoca unidades de coste 1-7.', used: false },
    ],
  },
  {
    id: 'delorian',
    name: 'Delorian',
    icon: 'delorian',
    description: 'Puedes revivir una unidad que haya sido desterrada o destruida. Sin embargo, todas las unidades invocadas DESPUÉS de ella también se destruyen.',
    usageType: 'once',
    ownerTurnOnly: false,
  },
  {
    id: 'dragon-tamer',
    name: 'Domador de Dragones',
    icon: 'dragon',
    description: 'Invoca una unidad Dragón desde fuera de tu reino. El dragón entra con TODOS estos efectos:\n\n• Frenesí: El dragón tiene Frenesí permanente.\n• Aumento de Potencia: Cada turno su ataque aumenta en +2.\n\nRECORDATORIO - Contador de Muerte:\nTurno 1: Contador en 3\nTurno 2: Contador en 2\nTurno 3: Contador en 1\nTurno 4: El dragón MUERE',
    usageType: 'once',
    ownerTurnOnly: true,
    isSummonSkill: true,
  },
  // ===== HABILIDADES ADICIONALES =====
  {
    id: 'hell-gates',
    name: 'Puertas del Infierno',
    icon: 'hellgate',
    description: `REQUISITO: Vida ≤50%

Invoca desde tu averno o descarte 1 Unidad Demonio sin pagar su coste.
• Esa unidad gana +1 Ataque por cada carta en el descarte del oponente.
• Si tienes al menos 2 demonios en tu averno, gana además Frenesí y Arrollar hasta el final del turno.`,
    usageType: 'once',
    ownerTurnOnly: true,
    activationCondition: 'life50', // Requiere ≤50% vida
    isSummonSkill: true,
  },
  {
    id: 'my-dollars',
    name: 'Mis Dólares',
    icon: 'dollars',
    description: `Cuando tengas menos Tesoros que tu oponente:
• Gana 4 Tesoros (puedes superar el límite de 7).
• Durante este turno, los Tesoros que gastes cuentan el doble.`,
    usageType: 'cooldown',
    cooldown: 3,
    ownerTurnOnly: true,
  },
  {
    id: 'destiny-theft',
    name: 'Robo del Destino',
    icon: 'destiny',
    description: `Al inicio de tu turno, antes de robar, si tu Vida es inferior al 25% y tienes 3 cartas o menos en tu mano:
• En lugar de robar, busca 1 carta en tu mazo y agrégala a tu mano.
• Los Tesoros usados para jugar esa carta no se agotan.
• No puedes perder la partida hasta el inicio de tu próximo turno.`,
    usageType: 'once',
    ownerTurnOnly: true,
  },
  // ===== HABILIDADES DE DOMINIO (AZAR AUTOMÁTICO) =====
  {
    id: 'jackpot',
    name: 'Jackpot – Dominio del Azar Absoluto',
    icon: 'jackpot',
    description: `REQUISITO: Vida ≤50%

ACTIVACIÓN:
Entras en "Dominio Jackpot". Se seleccionan 3 habilidades al azar (1-9).
• No puedes elegir, repetir, cambiar ni previsualizar los resultados
• Cada habilidad solo puede salir 1 vez por Dominio

DURACIÓN: 1-4 turnos (al azar)

PASIVA DE SUERTE (25%):
• En TU turno: Si el Dominio finaliza, 25% de anular Castigo Completo y reactivar Jackpot manualmente
• En turno RIVAL: 25% de anular el castigo y reactivar Jackpot. Si falla, se aplica Castigo Reducido`,
    usageType: 'once',
    ownerTurnOnly: true,
    requiresInput: 'domainDice',
    isDomainSkill: true,
    activationCondition: 'life50',
    detailedRules: {
      punishmentComplete: {
        title: 'CASTIGO COMPLETO',
        condition: '(Finaliza en TU turno sin anularse)',
        effects: [
          '💀 DERROTA AUTOMÁTICA',
          'Descarta tu mano, tu mazo y tu descarte',
          'No puedes activar habilidades ni efectos'
        ]
      },
      punishmentReduced: {
        title: 'CASTIGO REDUCIDO',
        condition: '(Finaliza en turno RIVAL sin anularse)',
        effects: [
          'Tu Vida se reduce a 5',
          'Descarta solo tu mano',
          '⚠️ ÚLTIMA OPORTUNIDAD: Puedes activar Jackpot una vez más',
          '❌ Efectos 8 y 9 NO disponibles en segunda oportunidad',
          '💀 Si al finalizar no ganas, pierdes automáticamente'
        ]
      }
    },
    options: [
      { id: 'jackpot-1', name: '1. Tesoros Infinitos', description: 'Los Tesoros no se agotan al usarlos.', used: false },
      { id: 'jackpot-2', name: '2. Costo Cero', description: 'Todas las cartas que juegues cuestan 0 Tesoros.', used: false },
      { id: 'jackpot-3', name: '3. Acción', description: 'Cada vez que juegues una Acción, roba 1 carta.', used: false },
      { id: 'jackpot-4', name: '4. Anulación Automática', description: 'La primera carta o efecto del oponente que intente resolverse cada turno se anula automáticamente.', used: false },
      { id: 'jackpot-5', name: '5. Resurrección Masiva', description: 'Invoca todos los Monstruos de tu descarte hasta el final del turno. Entran con 1 de Ataque, Frenesí y Agrupar. Recordatorio: Mueren al final del turno.', used: false },
      { id: 'jackpot-6', name: '6. Asalto Total', description: 'Todos tus Monstruos pueden atacar el turno en que son invocados, atacan una vez adicional y ganan Arrollar.', used: false },
      { id: 'jackpot-7', name: '7. Daño Descontrolado', description: 'El daño de combate que inflijas se duplica y tiene Arrollar.', used: false },
      { id: 'jackpot-8', name: '8. Reescritura del Azar', description: '+1 habilidad adicional al azar (no puede ser "100% de Chances"). Si un castigo va a aplicarse, su severidad se reduce: Completo→Reducido, Reducido→Anulado. La habilidad NO se reactiva.', used: false },
      { id: 'jackpot-9', name: '9. 100% de Chances', description: '+1 habilidad adicional al azar. 100% de probabilidad de anular castigo y reactivar Jackpot. Si sacas el 8 también: SUERTE DESBORDADA (100% para tu próximo castigo).', used: false },
    ],
  },
];

// Skill categories for organization (only active skills)
export const SKILL_CATEGORIES = [
  { id: 'summon', name: '🐉 Invocación', skills: ['dragon-tamer', 'hero-strike', 'jotunheimr-gate', 'insect-queen', 'hell-gates'] },
  { id: 'resource', name: '💎 Recursos', skills: ['dwarf-hunt', 'my-dollars', 'treasure-scale'] },
  { id: 'utility', name: '⚡ Utilidad', skills: ['genie-lamp', 'delorian', 'destiny-theft'] },
  { id: 'reactive', name: '🛡️ Reactiva', skills: ['last-breath'] },
  { id: 'domain', name: '🎰 Dominio (Azar)', skills: ['jackpot', 'witch-coven'] },
];

// Collapsible section for domain skills
const CollapsibleSection = ({ 
  title, 
  icon, 
  children, 
  defaultOpen = false,
  colorClass = 'purple'
}: { 
  title: string; 
  icon: string;
  children: React.ReactNode; 
  defaultOpen?: boolean;
  colorClass?: 'purple' | 'red' | 'amber';
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const colors = {
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  };
  const c = colors[colorClass];
  
  return (
    <div className={`mt-2 rounded-lg ${c.bg} border ${c.border} overflow-hidden`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className={`w-full flex items-center justify-between p-2 ${c.text} hover:bg-white/5 transition-colors`}
      >
        <span className="text-xs font-medium flex items-center gap-1.5">
          <span>{icon}</span>
          {title}
        </span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-2 pt-0 space-y-1.5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Component to render skill card with options
const SkillCard = ({ 
  skill, 
  isSelected, 
  onClick, 
  playerColor 
}: { 
  skill: Skill; 
  isSelected?: boolean; 
  onClick?: () => void;
  playerColor?: 'player1' | 'player2' | 'primary';
}) => {
  const SkillIcon = getSkillIcon(skill.icon);
  const color = playerColor || 'primary';
  const colorClasses = {
    player1: {
      border: 'border-player1',
      bg: 'bg-player1/10',
      iconBg: 'bg-player1/20',
      iconText: 'text-player1',
      optionBg: 'bg-player1',
    },
    player2: {
      border: 'border-player2',
      bg: 'bg-player2/10',
      iconBg: 'bg-player2/20',
      iconText: 'text-player2',
      optionBg: 'bg-player2',
    },
    primary: {
      border: 'border-primary',
      bg: 'bg-primary/10',
      iconBg: 'bg-primary/20',
      iconText: 'text-primary',
      optionBg: 'bg-primary',
    },
  };
  const colors = colorClasses[color];

  // Para habilidades de dominio, no mostrar opciones (son automáticas)
  const showOptions = skill.options && !skill.isDomainSkill;

  return (
    <motion.div
      className={`w-full p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
        isSelected
          ? `${colors.border} ${colors.bg}`
          : `border-border bg-card hover:${colors.border}/50`
      }`}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg flex-shrink-0 ${isSelected ? colors.iconBg : 'bg-muted'}`}>
          <SkillIcon className={`w-5 h-5 ${isSelected ? colors.iconText : 'text-foreground'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-display font-bold">{skill.name}</h4>
            {isSelected && (
              <div className={`p-1 rounded-full flex-shrink-0 ${colors.optionBg}`}>
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          
          {/* Main description - formatted */}
          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line leading-relaxed">
            {skill.description}
          </p>

          {/* Options list - only for non-domain skills */}
          {showOptions && skill.options && (
            <div className="mt-3 space-y-2">
              {skill.options.map((option, index) => (
                <div
                  key={option.id}
                  className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 border border-border/50"
                >
                  <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${colors.optionBg} text-white`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-display font-bold text-xs">{option.name}</h5>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Domain skill - Always show collapsible effects and punishments (unified view) */}
          {skill.isDomainSkill && skill.options && (
            <CollapsibleSection 
              title={`${skill.options.length} Efectos Posibles`} 
              icon="🎲"
              colorClass="purple"
            >
              {skill.options.map((option, index) => (
                <div
                  key={option.id}
                  className="flex items-start gap-2 p-1.5 rounded-lg bg-purple-500/5 border border-purple-500/20"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-purple-500/30 text-purple-300">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs text-purple-300">{option.name}</h5>
                    <p className="text-xs text-purple-400/70 mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </CollapsibleSection>
          )}

          {/* Domain skill - Collapsible punishments */}
          {skill.isDomainSkill && skill.detailedRules && (
            <CollapsibleSection 
              title="Castigos del Dominio" 
              icon="⚠️"
              colorClass="red"
            >
              {skill.detailedRules.punishmentComplete && (
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-xs font-bold text-red-400">{skill.detailedRules.punishmentComplete.title}</p>
                  <p className="text-xs text-red-400/70 mt-0.5">{skill.detailedRules.punishmentComplete.condition}</p>
                  <ul className="mt-1.5 space-y-0.5">
                    {skill.detailedRules.punishmentComplete.effects.map((effect, i) => (
                      <li key={i} className="text-xs text-red-300/80 flex items-start gap-1">
                        <span className="text-red-400">•</span>
                        {effect}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {skill.detailedRules.punishmentReduced && (
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-xs font-bold text-amber-400">{skill.detailedRules.punishmentReduced.title}</p>
                  <p className="text-xs text-amber-400/70 mt-0.5">{skill.detailedRules.punishmentReduced.condition}</p>
                  <ul className="mt-1.5 space-y-0.5">
                    {skill.detailedRules.punishmentReduced.effects.map((effect, i) => (
                      <li key={i} className="text-xs text-amber-300/80 flex items-start gap-1">
                        <span className="text-amber-400">•</span>
                        {effect}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* Usage type badges - Always show for all skills including domain */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {/* Domain badge */}
            {skill.isDomainSkill && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                Dominio
              </span>
            )}
            {/* Usage type badge */}
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              skill.isDomainSkill
                ? 'bg-amber-500/20 text-amber-400'
                : skill.usageType === 'once' 
                ? 'bg-amber-500/20 text-amber-500' 
                : skill.usageType === 'limited'
                ? 'bg-purple-500/20 text-purple-500'
                : skill.usageType === 'cooldown'
                ? 'bg-cyan-500/20 text-cyan-500'
                : 'bg-primary/20 text-primary'
            }`}>
              {skill.isDomainSkill 
                ? '1 Vez' 
                : skill.usageType === 'once' 
                ? '1 Vez' 
                : skill.usageType === 'limited' 
                ? `${skill.maxUses} Usos` 
                : skill.usageType === 'cooldown'
                ? `${skill.cooldown}T CD`
                : 'Condicional'}
            </span>
            {/* Manual activation badge for domain skills */}
            {skill.isDomainSkill && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                Manual
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Collapsible Category Component
const CollapsibleCategory = ({ 
  category, 
  skills, 
  playerColor,
  selectedSkill,
  onSelectSkill
}: { 
  category: typeof SKILL_CATEGORIES[0]; 
  skills: Skill[];
  playerColor?: 'player1' | 'player2' | 'primary';
  selectedSkill?: string | null;
  onSelectSkill?: (skill: Skill) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const color = playerColor || 'primary';
  const colorClasses = {
    player1: 'text-player1 border-player1',
    player2: 'text-player2 border-player2',
    primary: 'text-primary border-primary',
  };

  return (
    <div className="w-full mb-3">
      <motion.button
        className={`w-full flex items-center justify-between p-2.5 rounded-lg border ${colorClasses[color]}/30 bg-card hover:bg-muted/50 transition-colors`}
        onClick={() => setIsExpanded(!isExpanded)}
        whileTap={{ scale: 0.99 }}
      >
        <span className={`text-sm font-bold ${colorClasses[color].split(' ')[0]}`}>
          {category.name} ({skills.length})
        </span>
        {isExpanded ? (
          <ChevronUp className={`w-4 h-4 ${colorClasses[color].split(' ')[0]}`} />
        ) : (
          <ChevronDown className={`w-4 h-4 ${colorClasses[color].split(' ')[0]}`} />
        )}
      </motion.button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-2">
              {skills.map((skill) => (
                onSelectSkill ? (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    isSelected={selectedSkill === skill.id}
                    onClick={() => onSelectSkill(skill)}
                    playerColor={playerColor}
                  />
                ) : (
                  <SkillPreviewCard key={skill.id} skill={skill} />
                )
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Collapsible Categories Container for preview
const CollapsibleCategories = ({ skills }: { skills: Skill[] }) => {
  // Filter out disabled skills for the preview
  const enabledSkills = skills.filter(s => !s.isDisabled);
  
  return (
    <div className="w-full mt-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider text-center">
        Habilidades Disponibles
      </h3>
      {SKILL_CATEGORIES.map((category) => {
        const categorySkills = enabledSkills.filter(s => category.skills.includes(s.id));
        if (categorySkills.length === 0) return null;
        return (
          <CollapsibleCategory
            key={category.id}
            category={category}
            skills={categorySkills}
          />
        );
      })}
    </div>
  );
};

// Preview card (non-interactive, for mode selection) with expandable domain effects
const SkillPreviewCard = ({ skill }: { skill: Skill }) => {
  const SkillIcon = getSkillIcon(skill.icon);
  const [showDomainEffects, setShowDomainEffects] = useState(false);
  const showOptions = skill.options && !skill.isDomainSkill;

  return (
    <div className="p-3 rounded-lg border border-border bg-card/50">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-muted flex-shrink-0">
          <SkillIcon className="w-5 h-5 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-bold text-sm">{skill.name}</h4>
          
          {/* Main description */}
          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line leading-relaxed">
            {skill.description}
          </p>

          {/* Options list - only for non-domain skills */}
          {showOptions && skill.options && (
            <div className="mt-2 space-y-1.5">
              {skill.options.map((option, index) => (
                <div
                  key={option.id}
                  className="flex items-start gap-2 p-1.5 rounded-md bg-muted/30 border border-border/30"
                >
                  <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-primary text-white">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-display font-bold text-[10px]">{option.name}</h5>
                    <p className="text-[10px] text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Domain skill indicator with expandable effects */}
          {skill.isDomainSkill && (
            <div className="mt-2">
              <motion.button
                className="w-full p-1.5 rounded-md bg-purple-500/10 border border-purple-500/30 flex items-center justify-between"
                onClick={() => setShowDomainEffects(!showDomainEffects)}
                whileTap={{ scale: 0.99 }}
              >
                <p className="text-[10px] text-purple-400 font-medium">
                  ⚠️ Efectos automáticos al azar ({skill.options?.length || 0} posibles)
                </p>
                <motion.div
                  animate={{ rotate: showDomainEffects ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3 h-3 text-purple-400" />
                </motion.div>
              </motion.button>
              
              <AnimatePresence>
                {showDomainEffects && skill.options && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 space-y-1.5 max-h-[200px] overflow-y-auto">
                      {skill.options.map((option, index) => (
                        <div
                          key={option.id}
                          className="flex items-start gap-2 p-1.5 rounded-md bg-purple-500/5 border border-purple-500/20"
                        >
                          <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-purple-500/20 text-purple-400">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-display font-bold text-[10px] text-purple-300">{option.name}</h5>
                            <p className="text-[10px] text-muted-foreground">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
            skill.isDomainSkill
              ? 'bg-purple-500/20 text-purple-400'
              : skill.usageType === 'once' 
              ? 'bg-amber-500/20 text-amber-500' 
              : skill.usageType === 'limited'
              ? 'bg-purple-500/20 text-purple-500'
              : skill.usageType === 'cooldown'
              ? 'bg-cyan-500/20 text-cyan-500'
              : 'bg-primary/20 text-primary'
          }`}>
            {skill.isDomainSkill 
              ? 'Dominio' 
              : skill.usageType === 'once' 
              ? 'Uso Único' 
              : skill.usageType === 'limited' 
              ? `${skill.maxUses} Usos` 
              : skill.usageType === 'cooldown'
              ? `Cada ${skill.cooldown} turnos`
              : 'Condicional'}
          </span>
        </div>
      </div>
    </div>
  );
};

interface SkillSelectionProps {
  onComplete: (player1Skills: Skill[], player2Skills: Skill[]) => void;
  diceWinner?: 'player1' | 'player2'; // The player who won the dice roll
}

type SelectionMode = 'choosing' | 'random' | 'manual';
type SelectionPhase = 'mode' | 'first' | 'second' | 'complete';

export const SkillSelection = ({ onComplete, diceWinner = 'player1' }: SkillSelectionProps) => {
  const [mode, setMode] = useState<SelectionMode>('choosing');
  const [phase, setPhase] = useState<SelectionPhase>('mode');
  const [firstPlayerSkills, setFirstPlayerSkills] = useState<Skill[]>([]);
  const [secondPlayerSkills, setSecondPlayerSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [showRecommendation, setShowRecommendation] = useState(false);

  // The winner selects first
  const firstPlayer = diceWinner;
  const secondPlayer = diceWinner === 'player1' ? 'player2' : 'player1';

  // Handle random assignment
  useEffect(() => {
    if (mode === 'random' && phase === 'first') {
      // Filter out disabled skills before random assignment
      const enabledSkills = AVAILABLE_SKILLS.filter(s => !s.isDisabled);
      const shuffled = [...enabledSkills].sort(() => Math.random() - 0.5);
      
      setTimeout(() => {
        setFirstPlayerSkills([shuffled[0]]);
        setSecondPlayerSkills([shuffled[1]]);
        setPhase('complete');
      }, 1500);
    }
  }, [mode, phase]);

  // Complete the selection - map skills back to player1/player2
  useEffect(() => {
    if (phase === 'complete') {
      setTimeout(() => {
        if (firstPlayer === 'player1') {
          onComplete(firstPlayerSkills, secondPlayerSkills);
        } else {
          onComplete(secondPlayerSkills, firstPlayerSkills);
        }
      }, 1000);
    }
  }, [phase, firstPlayerSkills, secondPlayerSkills, onComplete, firstPlayer]);

  const handleModeSelect = (selectedMode: 'random' | 'manual') => {
    setMode(selectedMode);
    setPhase('first'); // Winner selects first
  };

  const handleSkillSelect = (skill: Skill) => {
    if (phase === 'first') {
      setFirstPlayerSkills([skill]);
      setSelectedSkill(null);
      setPhase('second');
    } else if (phase === 'second') {
      setSecondPlayerSkills([skill]);
      setSelectedSkill(null);
      setPhase('complete');
    }
  };

  const handleRecommendationSelect = (skill: Skill) => {
    setSelectedSkill(skill.id);
    setShowRecommendation(false);
  };

  const getAvailableSkills = () => {
    // Filter out disabled skills first
    const enabledSkills = AVAILABLE_SKILLS.filter(s => !s.isDisabled);
    
    if (phase === 'second') {
      return enabledSkills.filter(
        (skill) => !firstPlayerSkills.find((s) => s.id === skill.id)
      );
    }
    return enabledSkills;
  };

  const getExcludedSkillIds = () => {
    if (phase === 'second') {
      return firstPlayerSkills.map(s => s.id);
    }
    return [];
  };

  const getCurrentPlayer = () => {
    return phase === 'first' ? firstPlayer : secondPlayer;
  };

  const getCurrentPlayerLabel = () => {
    const player = getCurrentPlayer();
    return player === 'player1' ? 'Jugador 1' : 'Jugador 2';
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background flex flex-col items-center p-4 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.h1
        className="text-2xl md:text-3xl font-display font-black text-primary mb-4 text-center flex-shrink-0 pt-2"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        Selección de Habilidades
      </motion.h1>

      <AnimatePresence mode="wait">
        {/* Mode Selection - Simplified: only manual/random buttons */}
        {phase === 'mode' && (
          <motion.div
            key="mode"
            className="flex flex-col items-center gap-4 w-full max-w-sm"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
          >
            <p className="text-muted-foreground text-center mb-2 text-sm">
              ¿Cómo quieres asignar las habilidades?
            </p>
            
            <div className="grid grid-cols-1 gap-3 w-full">
              <motion.button
                className="flex items-center gap-3 p-3 rounded-xl border-2 border-border bg-card hover:border-primary transition-all"
                onClick={() => handleModeSelect('random')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shuffle className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-display font-bold text-sm">Aleatorio</h3>
                  <p className="text-xs text-muted-foreground">
                    Las habilidades se asignan al azar
                  </p>
                </div>
              </motion.button>

              <motion.button
                className="flex items-center gap-3 p-3 rounded-xl border-2 border-border bg-card hover:border-primary transition-all"
                onClick={() => handleModeSelect('manual')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <HandMetal className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-display font-bold text-sm">Selectivo</h3>
                  <p className="text-xs text-muted-foreground">
                    Cada jugador elige su habilidad
                  </p>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Random Assignment Animation */}
        {mode === 'random' && phase === 'first' && (
          <motion.div
            key="random"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Shuffle className="w-10 h-10 text-primary" />
            </motion.div>
            <p className="text-lg font-display font-bold text-muted-foreground">
              Asignando habilidades...
            </p>
          </motion.div>
        )}

        {/* Manual Selection - First Player (Winner) */}
        {mode === 'manual' && phase === 'first' && (
          <motion.div
            key="first"
            className="flex flex-col items-center gap-4 w-full max-w-md pb-8"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
          >
            <div className="flex items-center gap-2 mb-2 flex-shrink-0">
              <div className={`w-4 h-4 rounded-full ${firstPlayer === 'player1' ? 'bg-player1' : 'bg-player2'}`} />
              <span className="font-display font-bold text-lg">{getCurrentPlayerLabel()} elige</span>
              <span className="text-xs text-amber-500 bg-amber-500/20 px-2 py-0.5 rounded-full">Ganador</span>
            </div>
            
            {/* Recommendation Button */}
            <motion.button
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 transition-all"
              onClick={() => setShowRecommendation(true)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <span className="font-display font-bold text-amber-500">Recomendar por Mazo</span>
            </motion.button>
            
            {/* Skills grouped by category - Collapsible */}
            {SKILL_CATEGORIES.map((category) => {
              const categorySkills = getAvailableSkills().filter(s => category.skills.includes(s.id));
              if (categorySkills.length === 0) return null;
              return (
                <CollapsibleCategory
                  key={category.id}
                  category={category}
                  skills={categorySkills}
                  playerColor={firstPlayer}
                  selectedSkill={selectedSkill}
                  onSelectSkill={(skill) => setSelectedSkill(skill.id)}
                />
              );
            })}

            {selectedSkill && (
              <motion.button
                className={`mt-4 px-8 py-3 ${firstPlayer === 'player1' ? 'bg-player1' : 'bg-player2'} text-white rounded-full font-display font-bold uppercase tracking-wider`}
                onClick={() => handleSkillSelect(AVAILABLE_SKILLS.find(s => s.id === selectedSkill)!)}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Confirmar
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Manual Selection - Second Player */}
        {mode === 'manual' && phase === 'second' && (
          <motion.div
            key="second"
            className="flex flex-col items-center gap-4 w-full max-w-md pb-8"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
          >
            <div className="flex items-center gap-2 mb-2 flex-shrink-0">
              <div className={`w-4 h-4 rounded-full ${secondPlayer === 'player1' ? 'bg-player1' : 'bg-player2'}`} />
              <span className="font-display font-bold text-lg">{secondPlayer === 'player1' ? 'Jugador 1' : 'Jugador 2'} elige</span>
            </div>
            
            {/* Recommendation Button */}
            <motion.button
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 transition-all"
              onClick={() => setShowRecommendation(true)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <span className="font-display font-bold text-amber-500">Recomendar por Mazo</span>
            </motion.button>
            
            {/* Skills grouped by category - Collapsible */}
            {SKILL_CATEGORIES.map((category) => {
              const categorySkills = getAvailableSkills().filter(s => category.skills.includes(s.id));
              if (categorySkills.length === 0) return null;
              return (
                <CollapsibleCategory
                  key={category.id}
                  category={category}
                  skills={categorySkills}
                  playerColor={secondPlayer}
                  selectedSkill={selectedSkill}
                  onSelectSkill={(skill) => setSelectedSkill(skill.id)}
                />
              );
            })}

            {selectedSkill && (
              <motion.button
                className={`mt-4 px-8 py-3 ${secondPlayer === 'player1' ? 'bg-player1' : 'bg-player2'} text-white rounded-full font-display font-bold uppercase tracking-wider`}
                onClick={() => handleSkillSelect(AVAILABLE_SKILLS.find(s => s.id === selectedSkill)!)}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Confirmar
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Complete */}
        {phase === 'complete' && (
          <motion.div
            key="complete"
            className="flex flex-col items-center gap-6 w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-2xl font-display font-bold text-primary"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              ¡Habilidades Asignadas!
            </motion.div>
            
            <div className="grid grid-cols-2 gap-4 w-full">
              {/* First Player Skill (Winner) */}
              <div className={`p-4 rounded-xl border-2 ${firstPlayer === 'player1' ? 'border-player1 bg-player1/10' : 'border-player2 bg-player2/10'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${firstPlayer === 'player1' ? 'bg-player1' : 'bg-player2'}`} />
                  <span className="text-sm font-bold">{firstPlayer === 'player1' ? 'Jugador 1' : 'Jugador 2'}</span>
                </div>
                {firstPlayerSkills.map((skill) => {
                  const SkillIcon = getSkillIcon(skill.icon);
                  return (
                    <div key={skill.id} className="flex items-center gap-2">
                      <SkillIcon className={`w-4 h-4 ${firstPlayer === 'player1' ? 'text-player1' : 'text-player2'}`} />
                      <span className="text-sm font-medium truncate">{skill.name}</span>
                    </div>
                  );
                })}
              </div>
              
              {/* Second Player Skill */}
              <div className={`p-4 rounded-xl border-2 ${secondPlayer === 'player1' ? 'border-player1 bg-player1/10' : 'border-player2 bg-player2/10'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${secondPlayer === 'player1' ? 'bg-player1' : 'bg-player2'}`} />
                  <span className="text-sm font-bold">{secondPlayer === 'player1' ? 'Jugador 1' : 'Jugador 2'}</span>
                </div>
                {secondPlayerSkills.map((skill) => {
                  const SkillIcon = getSkillIcon(skill.icon);
                  return (
                    <div key={skill.id} className="flex items-center gap-2">
                      <SkillIcon className={`w-4 h-4 ${secondPlayer === 'player1' ? 'text-player1' : 'text-player2'}`} />
                      <span className="text-sm font-medium truncate">{skill.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deck Recommendation Modal */}
      <AnimatePresence>
        {showRecommendation && (
          <DeckRecommendation
            isOpen={showRecommendation}
            onClose={() => setShowRecommendation(false)}
            onSelectSkill={handleRecommendationSelect}
            excludeSkillIds={getExcludedSkillIds()}
            playerColor={getCurrentPlayer()}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
