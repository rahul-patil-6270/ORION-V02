/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useCallback } from "react";
import { motion, useSpring } from "motion/react";

const SCENE_SPRING = { stiffness: 90, damping: 25, mass: 0.8 };

interface WindowWorkspaceProps {
  windowOrder: string[];
  activeWindow: string;
  renderWindow: (id: string, motionStyle: any) => React.ReactNode;
}

export function WindowWorkspace({
  windowOrder,
  activeWindow,
  renderWindow,
}: WindowWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Very gentle perspective tracking on cursor
  const rotY = useSpring(0, SCENE_SPRING);
  const rotX = useSpring(0, SCENE_SPRING);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const cx = (e.clientX - rect.left) / rect.width;
      const cy = (e.clientY - rect.top) / rect.height;

      // Restrained, subtle perspective tilt (max +/- 4 degrees)
      rotY.set((cx - 0.5) * 6);
      rotX.set((cy - 0.5) * -4);
    },
    [rotY, rotX]
  );

  const handleMouseLeave = useCallback(() => {
    rotY.set(0);
    rotX.set(0);
  }, [rotY, rotX]);

  const total = windowOrder.length;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
      style={{ perspective: "1800px", zIndex: 10 }}
    >
      <motion.div
        style={{
          rotateY: rotY,
          rotateX: rotX,
          transformStyle: "preserve-3d",
          position: "relative",
          width: 0,
          height: 0,
        }}
        className="pointer-events-auto"
      >
        {windowOrder.map((id, index) => {
          const isFront = id === activeWindow;
          const zIndex = index;
          const depth = total - 1 - index;
          const baseZ = depth * -50;
          
          // Clean, gentle fanning for depth without unreadable extreme rotation
          const translateX = depth * -28;
          const translateY = depth * -16;
          const rotateY = depth * -6;

          const motionStyle = {
            transform: `translate3d(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px), ${baseZ}px) rotateY(${rotateY}deg)`,
            opacity: isFront ? 1 : Math.max(0.7, 1 - depth * 0.1),
            filter: "none", // No heavy blur to maintain 100% legibility
            transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            zIndex,
            position: "absolute" as const,
            top: 0,
            left: 0,
          };

          return (
            <div key={id} style={{ transformStyle: "preserve-3d" }}>
              {renderWindow(id, motionStyle)}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
