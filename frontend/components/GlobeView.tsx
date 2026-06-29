"use client";

import { useEffect, useRef } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";

// react-globe.gl exposes its imperative API (camera, controls) only through a
// ref, and next/dynamic does NOT forward refs across its boundary. So we keep
// the ref INTERNAL to this component (which GlobePicker dynamic-imports with
// ssr:false) and drive the camera here. Nothing imperative crosses the boundary.
type GlobeViewProps = React.ComponentProps<typeof Globe> & {
  /** Auto-rotate the globe (disabled for reduced-motion users). */
  autoRotate?: boolean;
};

export default function GlobeView({ autoRotate = true, ...props }: GlobeViewProps) {
  const ref = useRef<GlobeMethods | undefined>(undefined);

  function handleReady() {
    const g = ref.current;
    if (!g) return;
    g.pointOfView({ lat: 38, lng: 0, altitude: 2.2 }, 0);
    const controls = g.controls();
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.6;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = (3 * Math.PI) / 4;
  }

  // Keep auto-rotate in sync if the preference changes after mount.
  useEffect(() => {
    const g = ref.current;
    if (g) g.controls().autoRotate = autoRotate;
  }, [autoRotate]);

  return (
    <Globe
      ref={ref as React.MutableRefObject<GlobeMethods | undefined>}
      onGlobeReady={handleReady}
      {...props}
    />
  );
}
