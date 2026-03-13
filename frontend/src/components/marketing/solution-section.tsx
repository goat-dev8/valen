'use client';

import { useScrollStory } from '@/hooks/use-scroll-story';
import { SOLUTION_STORY } from '@/lib/landing-content';

export function SolutionSection() {
  const { containerRef, wordOpacity } = useScrollStory();

  return (
    <section id="about" ref={containerRef} className="solution-scroll-section">
      <div className="solution-sticky">
        <div className="solution-inner">
          <div className="solution-content">
            <p className="solution-kicker">Why VALEN exists</p>
            <div className="solution-text-block">
              {SOLUTION_STORY.map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  className="solution-word"
                  style={{ opacity: wordOpacity(i, SOLUTION_STORY.length) }}
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
