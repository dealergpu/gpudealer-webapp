'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

// Inertial page scrolling. Skipped entirely for reduced-motion users and on
// touch devices, where native momentum scrolling already feels right.
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (reduced || coarse) return;

    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  // Client-side navigations should start at the top, not inherit the
  // previous page's inertial scroll position.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
