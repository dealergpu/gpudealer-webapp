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

    // Radix dialogs, sheets and menus lock page scroll by marking <body>;
    // Lenis drives the scroll itself, so it has to pause too or the page
    // keeps moving behind an open modal. Modal content opts back in to
    // native scrolling with `data-lenis-prevent`.
    const syncWithScrollLock = () => {
      if (document.body.hasAttribute('data-scroll-locked')) lenis.stop();
      else lenis.start();
    };
    const observer = new MutationObserver(syncWithScrollLock);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-scroll-locked'] });

    return () => {
      observer.disconnect();
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
