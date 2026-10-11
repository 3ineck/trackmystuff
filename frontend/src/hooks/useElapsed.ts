import { useEffect, useState } from "react";

export function useElapsed(
  startedAt: string | null,
  pausedAt: string | null,
  pausedSec: number,
  frozenAt: string | null,
): number {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!startedAt || frozenAt || pausedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [startedAt, frozenAt, pausedAt]);

  if (!startedAt) return 0;
  const start = new Date(startedAt).getTime();
  let end: number;
  if (frozenAt) end = new Date(frozenAt).getTime();
  else if (pausedAt) end = new Date(pausedAt).getTime();
  else end = now;
  return Math.max(0, Math.floor((end - start) / 1000) - pausedSec);
}

export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
