import { useEffect, useRef } from 'react';

/**
 * Minimal requestAnimationFrame loop.
 * Calls `onFrame(deltaSeconds)` while `running` is true.
 */
export function useGameLoop(params: { running: boolean; onFrame: (dt: number) => void }) {
  const rafIdRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const onFrameRef = useRef(params.onFrame);

  useEffect(() => {
    onFrameRef.current = params.onFrame;
  }, [params.onFrame]);

  useEffect(() => {
    if (!params.running) {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      lastTsRef.current = null;
      return;
    }

    const tick = (ts: number) => {
      const last = lastTsRef.current;
      lastTsRef.current = ts;
      const dt = last == null ? 0 : Math.min(0.05, (ts - last) / 1000); // clamp
      onFrameRef.current(dt);
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      lastTsRef.current = null;
    };
  }, [params.running]);
}

