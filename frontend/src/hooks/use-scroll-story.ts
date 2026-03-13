'use client';

import { useEffect, useRef, useState } from 'react';

export function useScrollStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) {
        setProgress(1);
        return;
      }

      const scrolled = Math.max(0, -rect.top);
      setProgress(Math.min(1, scrolled / scrollable));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const wordOpacity = (index: number, total: number, inactive = 0.2) => {
    const start = index / total;
    const end = (index + 1) / total;
    if (progress <= start) return inactive;
    if (progress >= end) return 1;
    const local = (progress - start) / (end - start);
    return inactive + local * (1 - inactive);
  };

  return { containerRef, progress, wordOpacity };
}
