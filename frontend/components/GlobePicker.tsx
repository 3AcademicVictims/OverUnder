"use client";

import { Component, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

// react-globe.gl touches `window`/WebGL on import, so it must never run during
// server rendering. We dynamic-import a forwardRef-free wrapper (GlobeView) with
// `ssr: false`: this opts the component out of SSR and lazy-loads the heavy
// three.js bundle so it never blocks first paint.
const Globe = dynamic(() => import("./GlobeView"), {
  ssr: false,
  loading: () => <GlobeStatus label="Spinning up the globe…" />,
});

interface EventChip {
  id: string;
  title: string;
  side: string;
}

interface Marker {
  id: string;
  side: string;
  title: string;
  lat: number;
  lng: number;
}

/** Capital-city coordinates for the three demo nations. */
const COORDS: Record<string, { lat: number; lng: number }> = {
  spain: { lat: 40.4168, lng: -3.7038 },
  france: { lat: 48.8566, lng: 2.3522 },
  england: { lat: 51.5074, lng: -0.1278 },
};

const BRAND = "#6d8bff";

function GlobeStatus({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="globe-pulse h-28 w-28 rounded-full border border-edge bg-[radial-gradient(circle_at_30%_30%,rgba(109,139,255,0.35),rgba(19,20,29,0.9))]" />
        <span className="text-xs text-white/55">{label}</span>
      </div>
    </div>
  );
}

/** Plain-DOM picker shown when WebGL is unavailable, so the demo always works. */
function FlatPicker({ markers, onPick }: { markers: Marker[]; onPick: (side: string) => void }) {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <h2 className="text-2xl font-semibold text-white">Pick a contender</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-white/70">
          Your browser can&apos;t render the 3D globe, so here are the World Cup markets directly.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {markers.map((m) => (
            <button
              key={m.id}
              onClick={() => onPick(m.side)}
              className="rounded-full border border-brand/50 bg-brand/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/25"
            >
              {m.side}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Catches the WebGL-context failure react-globe.gl throws on GPU-less machines. */
class WebGLBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function GlobePicker({
  events,
  onPick,
  autoRotate = true,
}: {
  events: EventChip[];
  onPick: (side: string) => void;
  autoRotate?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [reduceMotion, setReduceMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  // The WebGL-vs-flat decision is client-only; render a neutral placeholder for
  // the server pass and the first client render so hydration matches, then swap.
  useEffect(() => setMounted(true), []);

  // Probe WebGL support synchronously on the first client render (before the
  // globe ever mounts) so GPU-less machines get the flat picker, not a crash.
  // The error boundary below is a backstop for failures the probe misses.
  const [webglOk] = useState(() => {
    if (typeof document === "undefined") return true;
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
    } catch {
      return false;
    }
  });

  // Respect the user's reduced-motion preference: no auto-spin if they opted out.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const markers = useMemo<Marker[]>(
    () =>
      events
        .map((e) => {
          const c = COORDS[e.side.toLowerCase()];
          return c ? { id: e.id, side: e.side, title: e.title, ...c } : null;
        })
        .filter((m): m is Marker => m !== null),
    [events],
  );

  // Size the canvas to the full container, and re-measure on resize.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0 h-full w-full">
      {!mounted ? (
        <GlobeStatus label="Loading the pitch…" />
      ) : !webglOk ? (
        <FlatPicker markers={markers} onPick={onPick} />
      ) : (
      <WebGLBoundary fallback={<FlatPicker markers={markers} onPick={onPick} />}>
        {size.w > 0 && size.h > 0 ? (
          <Globe
            width={size.w}
            height={size.h}
            autoRotate={autoRotate && !reduceMotion}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
            atmosphereColor={BRAND}
            atmosphereAltitude={0.2}
            pointsData={markers}
            pointLat="lat"
            pointLng="lng"
            pointColor={() => BRAND}
            pointAltitude={0.01}
            pointRadius={0.5}
            ringsData={markers}
            ringLat="lat"
            ringLng="lng"
            ringColor={() => (t: number) => `rgba(109,139,255,${1 - t})`}
            ringMaxRadius={5}
            ringPropagationSpeed={2.4}
            ringRepeatPeriod={1300}
            htmlElementsData={markers}
            htmlLat="lat"
            htmlLng="lng"
            htmlElement={(d: object) => {
              const m = d as Marker;
              const el = document.createElement("button");
              el.type = "button";
              el.textContent = m.side;
              el.setAttribute("aria-label", `Scan ${m.title}`);
              el.className = "globe-pill";
              el.style.pointerEvents = "auto";
              el.addEventListener("click", (ev) => {
                ev.stopPropagation();
                onPick(m.side);
              });
              return el;
            }}
          />
        ) : (
          <GlobeStatus label="Loading the pitch…" />
        )}
      </WebGLBoundary>
      )}
    </div>
  );
}
