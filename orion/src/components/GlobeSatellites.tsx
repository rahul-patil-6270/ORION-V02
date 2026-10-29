/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useCallback } from "react";
import createGlobe from "cobe";

interface SatelliteMarker {
  id: string;
  location: [number, number];
}

interface GlobeSatellitesProps {
  markers?: SatelliteMarker[];
  className?: string;
  speed?: number;
}

const defaultMarkers: SatelliteMarker[] = [
  { id: "sat-1", location: [10.0, 83.0] },
  { id: "sat-2", location: [0.0, 55.0] },
  { id: "sat-3", location: [0.0, 285.0] },
];

export function GlobeSatellites({
  markers = defaultMarkers,
  className = "",
  speed = 0.003,
}: GlobeSatellitesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const phiOffsetRef = useRef(0);
  const thetaOffsetRef = useRef(0);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi;
      thetaOffsetRef.current += dragOffset.current.theta;
      dragOffset.current = { phi: 0, theta: 0 };
    }
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (pointerInteracting.current !== null) {
      const deltaX = e.clientX - pointerInteracting.current.x;
      const deltaY = e.clientY - pointerInteracting.current.y;
      dragOffset.current = {
        phi: deltaX / 100,
        theta: deltaY / 100,
      };
    }
  }, []);

  useEffect(() => {
    let phi = 0;
    let width = 0;
    let animationId: number;

    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth;
      }
    };
    window.addEventListener("resize", onResize);
    onResize();

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: (width * 2) || 600,
      height: (width * 2) || 600,
      phi: 0,
      theta: 0.25,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 5,
      baseColor: [0.08, 0.1, 0.09],
      markerColor: [0.66, 0.55, 0.38],
      glowColor: [0.21, 0.28, 0.24],
      markers: markers.map((m) => ({
        location: m.location,
        size: 0.06,
      })),
    });

    const animate = () => {
      if (!pointerInteracting.current) {
        phi += speed;
      }
      globe.update({
        phi: phi + phiOffsetRef.current + dragOffset.current.phi,
        theta: 0.25 + thetaOffsetRef.current + dragOffset.current.theta,
        width: (width * 2) || 600,
        height: (width * 2) || 600,
      });
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [markers, speed]);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center ${className}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      style={{ touchAction: "none" }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          maxWidth: "100%",
          aspectRatio: "1",
          cursor: "grab",
        }}
      />
    </div>
  );
}
