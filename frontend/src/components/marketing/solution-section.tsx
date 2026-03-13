'use client';

import { useScrollStory } from '@/hooks/use-scroll-story';

const STORY = [
  'VALEN',
  'shows',
  'which',
  'agent',
  'intents',
  'pass',
  'compliance',
  'with',
  'real-time',
  'insight',
  'across',
  'all',
  'chains',
  'helping',
  'you',
  'cut',
  'risk,',
  'boost',
  'settlement',
  'speed,',
  'and',
  'scale',
  'what',
  'works',
];

export function SolutionSection() {
  const { containerRef, wordOpacity } = useScrollStory();

  return (
    <section id="about" ref={containerRef} className="solution-scroll-section">
      <div className="solution-sticky">
        <div className="solution-inner">
          <div className="solution-content">
            <div className="solution-text-block">
              {STORY.map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  className="solution-word"
                  style={{ opacity: wordOpacity(i, STORY.length) }}
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
