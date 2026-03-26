import React, { useMemo } from 'react';

/**
 * Lightweight CSS-only particle field background.
 * Respects prefers-reduced-motion automatically via CSS.
 */
export default function ParticleField({ count = 30, className = '' }) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${60 + Math.random() * 40}%`,
      size: `${1 + Math.random() * 2}px`,
      duration: `${6 + Math.random() * 10}s`,
      delay: `${Math.random() * 8}s`,
      travel: `${100 + Math.random() * 300}px`,
      opacity: 0.2 + Math.random() * 0.4,
    }));
  }, [count]);

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            '--duration': p.duration,
            '--delay': p.delay,
            '--travel': p.travel,
          }}
        />
      ))}
    </div>
  );
}
