import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HandData } from '../types/hand';
import { Scarecrow } from './Scarecrow';

interface Spell {
  id: string;
  name: string;
  element: 'fire' | 'water' | 'wind' | 'lightning';
  damage: number;
  manaCost: number;
  color: string;
  particleColor: string;
  gesture: string;
  chargeTime: number;
  icon: string;
}

interface Target {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
}

interface SpellProjectile {
  id: number;
  spell: Spell;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  particles: Particle[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface Props {
  handData: HandData | null;
  onManaChange: (mana: number) => void;
  onExperienceGain: (exp: number) => void;
  mana: number;
}

const SPELLS: Spell[] = [
  {
    id: 'fireball',
    name: '파이어볼',
    element: 'fire',
    damage: 30,
    manaCost: 15,
    color: '#ff6b35',
    particleColor: '#ffa500',
    gesture: 'point',
    chargeTime: 1000,
    icon: '🔥'
  },
  {
    id: 'waterwave',
    name: '워터 웨이브',
    element: 'water',
    damage: 20,
    manaCost: 10,
    color: '#4fc3f7',
    particleColor: '#29b6f6',
    gesture: 'peace',
    chargeTime: 800,
    icon: '💧'
  },
  {
    id: 'lightning',
    name: '라이트닝',
    element: 'lightning',
    damage: 40,
    manaCost: 20,
    color: '#ffd54f',
    particleColor: '#ffeb3b',
    gesture: 'rock',
    chargeTime: 1500,
    icon: '⚡'
  }
];

export const MagicSpellSystem: React.FC<Props> = ({ 
  handData, 
  onManaChange, 
  onExperienceGain,
  mana 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scarecrow, setScarecrow] = useState<Target>({
    x: window.innerWidth * 0.75,
    y: window.innerHeight / 2,
    health: 500,
    maxHealth: 500
  });
  const [projectiles, setProjectiles] = useState<SpellProjectile[]>([]);
  const [currentSpell, setCurrentSpell] = useState<Spell | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [chargeProgress, setChargeProgress] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [hitCount, setHitCount] = useState(0);
  const chargeStartTime = useRef<number>(0);
  const lastGestureRef = useRef<string>('none');
  const comboCountRef = useRef<number>(0);

  // Cast spell function - defined early to be available in useEffects
  const castSpell = useCallback((spell: Spell) => {
    if (!handData || mana < spell.manaCost) return;

    // Deduct mana
    onManaChange(mana - spell.manaCost);

    // Play spell sound effect
    const soundMap: { [key: string]: string } = {
      'fireball': '/fire.mp3',
      'waterwave': '/water.mp3',
      'lightning': '/elec.mp3'
    };
    
    const soundFile = soundMap[spell.id];
    if (soundFile) {
      const audio = new Audio(soundFile);
      audio.volume = 0.7;
      audio.play().catch(err => console.log('Failed to play sound:', err));
    }

    // Create projectile targeting scarecrow
    const projectile: SpellProjectile = {
      id: Date.now(),
      spell,
      x: handData.keypoints[8].x, // Index finger tip
      y: handData.keypoints[8].y,
      targetX: scarecrow.x,
      targetY: scarecrow.y,
      speed: 15,
      particles: []
    };

    setProjectiles(prev => [...prev, projectile]);
    
    // Increase combo
    comboCountRef.current += 1;
    setComboCount(comboCountRef.current);
    setTimeout(() => {
      comboCountRef.current = Math.max(0, comboCountRef.current - 1);
      setComboCount(comboCountRef.current);
    }, 5000);

    setCurrentSpell(null);
  }, [handData, scarecrow, mana, onManaChange]);

  // Reset scarecrow health when it dies
  useEffect(() => {
    if (scarecrow.health <= 0) {
      setTimeout(() => {
        setScarecrow({
          x: window.innerWidth * 0.75,
          y: window.innerHeight / 2,
          health: 500,
          maxHealth: 500
        });
        onExperienceGain(50); // Reward for defeating scarecrow
      }, 1500);
    }
  }, [scarecrow.health, onExperienceGain]);

  // Detect spell gesture and charge
  useEffect(() => {
    if (!handData) {
      setIsCharging(false);
      setChargeProgress(0);
      return;
    }

    const { gesture } = handData;
    const lastGesture = lastGestureRef.current;

    // Check if gesture changed from fist to spell gesture (charging → casting)
    if (lastGesture === 'fist' && gesture !== 'fist' && gesture !== 'none') {
      // Find matching spell
      const spell = SPELLS.find(s => s.gesture === gesture);
      if (spell && mana >= spell.manaCost) {
        setCurrentSpell(spell);
        setIsCharging(true);
        chargeStartTime.current = Date.now();
      }
    }
    
    // Release spell when palm is shown after charging
    if (isCharging && gesture === 'palm' && currentSpell) {
      castSpell(currentSpell);
      setIsCharging(false);
      setChargeProgress(0);
    }

    lastGestureRef.current = gesture;
  }, [handData, isCharging, currentSpell, mana, castSpell]);

  // Update charge progress
  useEffect(() => {
    if (isCharging && currentSpell) {
      const updateCharge = () => {
        const elapsed = Date.now() - chargeStartTime.current;
        const progress = Math.min(elapsed / currentSpell.chargeTime, 1);
        setChargeProgress(progress);
        
        if (progress < 1) {
          requestAnimationFrame(updateCharge);
        }
      };
      updateCharge();
    }
  }, [isCharging, currentSpell]);

  // Update projectiles and check collisions
  useEffect(() => {
    let animationId: number;
    let isRunning = true;
    
    const updateProjectiles = () => {
      if (!isRunning) return;
      
      setProjectiles(prev => {
        if (prev.length === 0) return prev;
        
        const updated = prev.map(projectile => {
          // Move towards target
          const dx = projectile.targetX - projectile.x;
          const dy = projectile.targetY - projectile.y;
          const dist = Math.hypot(dx, dy);
          
          if (dist < 30) {
            // Hit scarecrow
            const damage = projectile.spell.damage * (1 + comboCountRef.current * 0.1);
            setScarecrow(prev => ({
              ...prev,
              health: Math.max(0, prev.health - damage)
            }));
            
            setHitCount(prev => prev + 1);
            onExperienceGain(5); // Small XP for each hit
            
            return null; // Remove projectile
          }

          // Add particles
          const newParticles: Particle[] = [];
          for (let i = 0; i < 3; i++) {
            newParticles.push({
              x: projectile.x,
              y: projectile.y,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              life: 1,
              color: projectile.spell.particleColor,
              size: Math.random() * 4 + 2
            });
          }

          return {
            ...projectile,
            x: projectile.x + (dx / dist) * projectile.speed,
            y: projectile.y + (dy / dist) * projectile.speed,
            particles: [...projectile.particles, ...newParticles]
              .map(p => ({
                ...p,
                x: p.x + p.vx,
                y: p.y + p.vy,
                life: p.life - 0.02
              }))
              .filter(p => p.life > 0)
          };
        }).filter(Boolean) as SpellProjectile[];
        
        return updated;
      });
      
      animationId = requestAnimationFrame(updateProjectiles);
    };

    updateProjectiles();

    return () => {
      isRunning = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [onExperienceGain]); // Only depend on stable callback


  // Render canvas effects
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render projectiles and particles
      projectiles.forEach(projectile => {
        // Draw projectile
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = projectile.spell.color;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect
        const gradient = ctx.createRadialGradient(
          projectile.x, projectile.y, 0,
          projectile.x, projectile.y, 30
        );
        gradient.addColorStop(0, projectile.spell.color + 'ff');
        gradient.addColorStop(1, projectile.spell.color + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw particles
        projectile.particles.forEach(particle => {
          ctx.save();
          ctx.globalAlpha = particle.life;
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      });

      requestAnimationFrame(render);
    };

    render();
  }, [projectiles]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-30"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Scarecrow Target */}
      <div className="fixed inset-0 pointer-events-none z-25">
        <Scarecrow
          x={scarecrow.x}
          y={scarecrow.y}
          health={scarecrow.health}
          maxHealth={scarecrow.maxHealth}
        />
        
        {/* Hit Counter */}
        {hitCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="fixed top-20 right-20 text-center"
          >
            <div className="text-white text-lg mb-2">Hits</div>
            <div className="text-4xl font-bold text-yellow-400">{hitCount}</div>
          </motion.div>
        )}
      </div>

      {/* Spell Charging UI */}
      <AnimatePresence>
        {isCharging && currentSpell && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40"
          >
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke={currentSpell.color}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${chargeProgress * 553} 553`}
                  className="transition-all duration-100"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl">{currentSpell.icon}</div>
                  <div className="text-white font-bold mt-2">{currentSpell.name}</div>
                  <div className="text-white/60 text-sm">Charging: {Math.round(chargeProgress * 100)}%</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Combo Counter */}
      {comboCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed top-32 right-8 text-6xl font-bold text-orange-400 z-40"
        >
          x{comboCount}
        </motion.div>
      )}
    </>
  );
};