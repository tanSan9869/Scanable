import React from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * Animated number counter that rolls up from 0 to the target value.
 * Falls back to static rendering for prefers-reduced-motion.
 */
export default function AnimatedCounter({ value, duration = 1.5, className = '' }) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : 0;

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDisplayValue(numericValue);
      return;
    }

    const motionValue = useMotionValue(0);
    const controls = animate(motionValue, numericValue, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplayValue(Math.round(v)),
    });

    return () => controls.stop();
  }, [numericValue, duration]);

  return (
    <span className={className} aria-label={`${numericValue}`}>
      {typeof value === 'number' ? displayValue.toString().padStart(2, '0') : value}
    </span>
  );
}
