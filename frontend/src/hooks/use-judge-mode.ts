'use client';

import { useSyncExternalStore } from 'react';
import { isJudgeModeEnabled, judgeModeServerSnapshot, subscribeJudgeMode } from '@/lib/judge-mode';

export function useJudgeMode(): boolean {
  return useSyncExternalStore(subscribeJudgeMode, isJudgeModeEnabled, judgeModeServerSnapshot);
}
