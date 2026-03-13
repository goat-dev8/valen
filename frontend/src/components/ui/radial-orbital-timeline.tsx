'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Link2, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ModuleTimelineItem } from '@/lib/module-timeline-data';
import { cn } from '@/lib/utils';

interface RadialOrbitalTimelineProps {
  timelineData: ModuleTimelineItem[];
  className?: string;
}

export function RadialOrbitalTimeline({ timelineData, className }: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [rotationAngle, setRotationAngle] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [centerOffset] = useState({ x: 0, y: 0 });
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const centerViewOnNode = (nodeId: number) => {
    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;
    setRotationAngle(270 - targetAngle);
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key, 10) !== id) {
          newState[parseInt(key, 10)] = false;
        }
      });

      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);

        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);
        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  useEffect(() => {
    if (!autoRotate) return;

    const rotationTimer = setInterval(() => {
      setRotationAngle((prev) => Number(((prev + 0.28) % 360).toFixed(3)));
    }, 50);

    return () => clearInterval(rotationTimer);
  }, [autoRotate]);

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 168;
    const radian = (angle * Math.PI) / 180;

    const x = radius * Math.cos(radian) + centerOffset.x;
    const y = radius * Math.sin(radian) + centerOffset.y;
    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(0.45, Math.min(1, 0.45 + 0.55 * ((1 + Math.sin(radian)) / 2)));

    return { x, y, zIndex, opacity };
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    return getRelatedItems(activeNodeId).includes(itemId);
  };

  const statusLabel = (status: ModuleTimelineItem['status']) => {
    if (status === 'completed') return 'ACTIVE';
    if (status === 'in-progress') return 'GATE';
    return 'PLANNED';
  };

  const statusBadgeClass = (status: ModuleTimelineItem['status']) => {
    if (status === 'completed') return 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]';
    if (status === 'in-progress') return 'bg-[#EFF6FF] text-[#0066FF] border-[#BFDBFE]';
    return 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]';
  };

  return (
    <div
      className={cn('modules-orbit', className)}
      ref={containerRef}
      onClick={handleContainerClick}
      role="presentation"
    >
      <div className="modules-orbit__stage">
        <div
          className="modules-orbit__ring-wrap"
          ref={orbitRef}
          style={{
            transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
          }}
        >
          <div className="modules-orbit__hub" aria-hidden="true">
            <div className="modules-orbit__hub-ping" />
            <div className="modules-orbit__hub-core" />
          </div>

          <div className="modules-orbit__ring" aria-hidden="true" />

          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                ref={(el) => {
                  nodeRefs.current[item.id] = el;
                }}
                className="modules-orbit__node"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px)`,
                  zIndex: isExpanded ? 200 : position.zIndex,
                  opacity: isExpanded ? 1 : position.opacity,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleItem(item.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-label={item.title}
              >
                <div
                  className={cn('modules-orbit__pulse', isPulsing && 'modules-orbit__pulse--active')}
                  style={{
                    width: `${item.energy * 0.42 + 36}px`,
                    height: `${item.energy * 0.42 + 36}px`,
                    ['--orbit-accent' as string]: item.accent,
                  }}
                />

                <div
                  className={cn(
                    'modules-orbit__dot',
                    isExpanded && 'modules-orbit__dot--expanded',
                    isRelated && 'modules-orbit__dot--related',
                  )}
                  style={{ ['--orbit-accent' as string]: item.accent }}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </div>

                <div className={cn('modules-orbit__label', isExpanded && 'modules-orbit__label--expanded')}>
                  {item.title}
                </div>

                {isExpanded && (
                  <Card className="modules-orbit__card">
                    <div className="modules-orbit__card-connector" aria-hidden="true" />
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge className={cn('px-2 text-[10px] uppercase tracking-wide', statusBadgeClass(item.status))}>
                          {statusLabel(item.status)}
                        </Badge>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#8B98A5]">
                          {item.date}
                        </span>
                      </div>
                      <CardTitle className="mt-2">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs leading-relaxed text-[#5E6C7B]">
                      <p>{item.content}</p>

                      <div className="mt-3 border-t border-[#EEF0F3] pt-3">
                        <div className="mb-1 flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1 text-[#64748B]">
                            <Zap className="h-3 w-3" aria-hidden />
                            Pipeline weight
                          </span>
                          <span className="font-mono font-semibold text-[#012b54]">{item.energy}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#EEF2F7]">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${item.energy}%`,
                              background: `linear-gradient(90deg, ${item.accent}, #0066FF)`,
                            }}
                          />
                        </div>
                      </div>

                      {item.relatedIds.length > 0 && (
                        <div className="mt-3 border-t border-[#EEF0F3] pt-3">
                          <div className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#8B98A5]">
                            <Link2 className="h-3 w-3" aria-hidden />
                            Connected modules
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.relatedIds.map((relatedId) => {
                              const relatedItem = timelineData.find((i) => i.id === relatedId);
                              if (!relatedItem) return null;
                              return (
                                <Button
                                  key={relatedId}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 rounded-full px-2.5 text-[11px]"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItem(relatedId);
                                  }}
                                >
                                  {relatedItem.title}
                                  <ArrowRight className="ml-1 h-3 w-3 opacity-60" aria-hidden />
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <Link
                        href={item.route}
                        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0066FF] hover:text-[#0052cc]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Explore module
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="modules-orbit__hint">Click a module to pause rotation and explore connections</p>
    </div>
  );
}
