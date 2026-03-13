const STORAGE_KEY = 'valen:judge-mode';

/** Judge mode hides Advanced nav and operator-heavy surfaces by default. */
export function isJudgeModeEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === null) return true;
  return stored === 'true';
}

export function setJudgeModeEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('valen:judge-mode-changed', { detail: { enabled } }));
}

export function subscribeJudgeMode(callback: (enabled: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<{ enabled: boolean }>).detail;
    callback(detail?.enabled ?? isJudgeModeEnabled());
  };
  window.addEventListener('valen:judge-mode-changed', handler);
  return () => window.removeEventListener('valen:judge-mode-changed', handler);
}
