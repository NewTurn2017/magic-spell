import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
}

export const Scarecrow: React.FC<Props> = ({ x, y, health, maxHealth }) => {
  const [isHit, setIsHit] = useState(false);
  const [lastDamage, setLastDamage] = useState(0);
  const healthPercentage = (health / maxHealth) * 100;
  const prevHealthRef = useRef(health);

  useEffect(() => {
    if (health < prevHealthRef.current) {
      const damage = prevHealthRef.current - health;
      setLastDamage(damage);
      setIsHit(true);
      
      const timer = setTimeout(() => setIsHit(false), 500);
      prevHealthRef.current = health;
      
      return () => clearTimeout(timer);
    }
    prevHealthRef.current = health;
  }, [health]);

  return (
    <div 
      className="absolute"
      style={{
        left: x - 60,
        top: y - 100,
        width: 120,
        height: 200
      }}
    >
      {/* Health Bar */}
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-24 h-2 bg-black/50 rounded-full">
        <div 
          className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-300"
          style={{ width: `${healthPercentage}%` }}
        />
      </div>

      {/* Scarecrow SVG */}
      <motion.svg
        width="120"
        height="200"
        viewBox="0 0 120 200"
        animate={isHit ? { scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] } : {}}
        transition={{ duration: 0.3 }}
      >
        {/* Post */}
        <rect x="55" y="80" width="10" height="120" fill="#8B4513" />
        <rect x="30" y="100" width="60" height="8" fill="#654321" />
        
        {/* Body */}
        <ellipse cx="60" cy="100" rx="30" ry="40" fill="#D2691E" stroke="#8B4513" strokeWidth="2" />
        
        {/* Patches */}
        <rect x="45" y="90" width="12" height="12" fill="#A0522D" transform="rotate(15 51 96)" />
        <rect x="65" y="110" width="10" height="10" fill="#8B4513" transform="rotate(-20 70 115)" />
        
        {/* Head */}
        <circle cx="60" cy="50" r="25" fill="#F4A460" stroke="#8B4513" strokeWidth="2" />
        
        {/* Hat */}
        <ellipse cx="60" cy="35" rx="35" ry="5" fill="#2F4F4F" />
        <rect x="45" y="15" width="30" height="20" fill="#2F4F4F" />
        <rect x="50" y="10" width="20" height="5" fill="#2F4F4F" />
        
        {/* Face */}
        <circle cx="50" cy="45" r="3" fill="#000" />
        <circle cx="70" cy="45" r="3" fill="#000" />
        
        {/* Stitched mouth */}
        <path d="M 50 55 L 70 55" stroke="#000" strokeWidth="2" fill="none" />
        <path d="M 52 52 L 52 58" stroke="#000" strokeWidth="1" />
        <path d="M 58 52 L 58 58" stroke="#000" strokeWidth="1" />
        <path d="M 64 52 L 64 58" stroke="#000" strokeWidth="1" />
        <path d="M 68 52 L 68 58" stroke="#000" strokeWidth="1" />
        
        {/* Arms (straw) */}
        <g transform="rotate(-30 30 100)">
          <rect x="25" y="95" width="40" height="6" fill="#F4A460" />
          <rect x="20" y="94" width="10" height="8" fill="#FFD700" />
        </g>
        <g transform="rotate(30 90 100)">
          <rect x="55" y="95" width="40" height="6" fill="#F4A460" />
          <rect x="90" y="94" width="10" height="8" fill="#FFD700" />
        </g>
      </motion.svg>

      {/* Hit Effect */}
      <AnimatePresence>
        {isHit && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-full h-full rounded-full bg-gradient-radial from-yellow-400 via-orange-400 to-transparent opacity-60" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Damage Number */}
      <AnimatePresence>
        {isHit && lastDamage > 0 && (
          <motion.div
            className="absolute top-0 left-1/2 transform -translate-x-1/2 text-3xl font-bold text-red-500"
            initial={{ y: 0, opacity: 1, scale: 0.5 }}
            animate={{ y: -50, opacity: 0, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            -{Math.round(lastDamage)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};