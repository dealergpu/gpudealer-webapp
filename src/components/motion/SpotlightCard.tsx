'use client';

import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

// A surface with a soft radial highlight that follows the cursor.
export function SpotlightCard({
  children,
  className,
  color = 'hsl(var(--accent) / 0.16)',
}: {
  children: ReactNode;
  className?: string;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  };

  return (
    <div ref={ref} onPointerMove={onMove} className={cn('group/spot relative overflow-hidden', className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{ background: `radial-gradient(420px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${color}, transparent 65%)` }}
      />
      {children}
    </div>
  );
}
