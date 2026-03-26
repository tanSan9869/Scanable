import React from 'react';
import { motion } from 'framer-motion';

export default function ScoreRing({ score = 0, size = 200, strokeWidth = 10, className = '' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100) / 100;
  const offset = circumference * (1 - progress);

  const getColor = (s) => {
    if (s >= 80) return ['#00c2ff', '#00f5d4'];
    if (s >= 50) return ['#ffb347', '#ffd166'];
    return ['#ff5a8a', '#ff7aa2'];
  };

  const [color1, color2] = getColor(score);
  const gradientId = `score-gradient-${score}`;

  // Tick marks for premium feel
  const tickCount = 60;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const angle = (i / tickCount) * 360;
    const isMajor = i % 5 === 0;
    return { angle, isMajor };
  });

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} role="img" aria-label={`Accessibility score: ${score} out of 100`}>
      {/* Outer glow halo */}
      <div
        className="absolute rounded-full"
        style={{
          width: size + 40,
          height: size + 40,
          background: `radial-gradient(circle, ${color1}08 0%, transparent 70%)`,
          animation: 'glow-pulse 3s ease-in-out infinite',
        }}
        aria-hidden="true"
      />

      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color1} />
            <stop offset="100%" stopColor={color2} />
          </linearGradient>
        </defs>

        {/* Tick marks */}
        {ticks.map((tick, idx) => (
          <line
            key={idx}
            x1={size / 2}
            y1={strokeWidth / 2 - 2}
            x2={size / 2}
            y2={strokeWidth / 2 + (tick.isMajor ? 4 : 2)}
            stroke="rgba(15,23,42,0.16)"
            strokeWidth={tick.isMajor ? 1 : 0.5}
            transform={`rotate(${tick.angle} ${size / 2} ${size / 2})`}
          />
        ))}

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(15,23,42,0.12)"
          strokeWidth={strokeWidth}
        />

        {/* Progress arc with gradient */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 16px ${color1}40)` }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-display leading-none"
          style={{ fontSize: size * 0.32, color: color1 }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          {score}
        </motion.span>
        <span className="text-text-subtle font-mono text-xs mt-1 tracking-wider">/100</span>
      </div>
    </div>
  );
}
