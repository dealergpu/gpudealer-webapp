'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion, animate } from 'framer-motion';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

// Fades + lifts its children into place the first time they scroll into view.
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// Staggers each direct child in as the group enters the viewport.
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduced ? false : 'hidden'}
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      variants={{ show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 28 },
        show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}

// Headline reveal: each word slides up from behind a clipping mask.
export function SplitWords({
  text,
  className,
  wordClassName,
  delay = 0,
}: {
  text: string;
  className?: string;
  wordClassName?: (word: string, index: number) => string | undefined;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const words = text.split(' ');

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {words.map((word, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
          <motion.span
            className={cn('inline-block', wordClassName?.(word, i))}
            initial={reduced ? false : { y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 1.1, delay: delay + i * 0.09, ease: EASE }}
          >
            {word}
            {i < words.length - 1 ? '\u00a0' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

// Counts from zero up to `value` once visible.
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: EASE,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduced, value]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {(reduced ? value : display).toLocaleString('en-US')}
    </span>
  );
}
