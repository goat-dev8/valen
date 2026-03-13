'use client';

import {
  ShieldCheck,
  BarChart3,
  Camera,
  Megaphone,
  TrendingUp,
  Smile,
  type LucideIcon,
} from 'lucide-react';
import { SectionBadge } from '@/components/marketing/section-badge';
import { useScrollStory } from '@/hooks/use-scroll-story';

type StoryItem =
  | { type: 'word'; text: string }
  | { type: 'icon'; Icon: LucideIcon };

const STORY: StoryItem[] = [
  { type: 'icon', Icon: ShieldCheck },
  { type: 'word', text: 'VALEN' },
  { type: 'word', text: 'shows' },
  { type: 'word', text: 'which' },
  { type: 'word', text: 'agent' },
  { type: 'word', text: 'intents' },
  { type: 'word', text: 'pass' },
  { type: 'word', text: 'compliance' },
  { type: 'word', text: 'with' },
  { type: 'word', text: 'real-time' },
  { type: 'word', text: 'insight' },
  { type: 'icon', Icon: BarChart3 },
  { type: 'word', text: 'across' },
  { type: 'word', text: 'all' },
  { type: 'word', text: 'chains' },
  { type: 'icon', Icon: Camera },
  { type: 'icon', Icon: Megaphone },
  { type: 'icon', Icon: TrendingUp },
  { type: 'word', text: 'helping' },
  { type: 'word', text: 'you' },
  { type: 'word', text: 'cut' },
  { type: 'word', text: 'risk,' },
  { type: 'word', text: 'boost' },
  { type: 'word', text: 'settlement' },
  { type: 'word', text: 'speed,' },
  { type: 'icon', Icon: TrendingUp },
  { type: 'word', text: 'and' },
  { type: 'word', text: 'scale' },
  { type: 'word', text: 'what' },
  { type: 'word', text: 'works' },
  { type: 'icon', Icon: Smile },
];

const WORD_COUNT = STORY.filter((i) => i.type === 'word').length;

export function SolutionSection() {
  const { containerRef, wordOpacity } = useScrollStory();
  let wordIndex = 0;

  return (
    <section id="about" ref={containerRef} className="solution-scroll-section">
      <div className="solution-sticky">
        <div className="solution-inner">
          <div className="solution-content">
            <SectionBadge suffix="Solution" label="VALEN your compliance companion" dark />
            <div className="solution-text-block">
              {STORY.map((item, i) => {
                if (item.type === 'icon') {
                  const idx = Math.max(0, wordIndex - 1);
                  const opacity = wordOpacity(idx, WORD_COUNT);
                  return (
                    <span
                      key={i}
                      className="solution-icon"
                      style={{ opacity, backgroundColor: opacity > 0.5 ? '#007dfc' : 'rgba(255,255,255,0.12)' }}
                    >
                      <item.Icon className="h-[18px] w-[18px] text-white" strokeWidth={2} />
                    </span>
                  );
                }

                const current = wordIndex;
                wordIndex += 1;
                const opacity = wordOpacity(current, WORD_COUNT);

                return (
                  <span key={i} className="solution-word" style={{ opacity }}>
                    {item.text}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
