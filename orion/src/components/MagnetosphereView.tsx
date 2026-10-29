/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { calculateMagnetopauseRe, calculateDynamicPressure } from '../physics/magnetosphere';
import { Play, Pause, Zap, RotateCcw } from 'lucide-react';
import { GlobeSatellites } from './GlobeSatellites';

interface MagnetosphereViewProps {
  Bz: number;
  Nsw: number;
  Vsw: number;
  selectedSatelliteLong: number;
}

export default function MagnetosphereView({
  Bz,
  Nsw,
  Vsw,
  selectedSatelliteLong,
}: MagnetosphereViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 580, height: 320 });
  const [isPlaying, setIsPlaying] = useState(true);
  const satelliteAngleRef = useRef(0);

  // Compute physical state parameters
  const P_dyn = calculateDynamicPressure(Nsw, Vsw);
  const r0 = calculateMagnetopauseRe(Bz, P_dyn);
  const boundaryCompressedPastGEO = r0 < 6.6;

  useEffect(() => {
    let animationId: number;
    let particleOffset = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      const currentRePx = Math.max(12, height / 25);
      const cx = width / 2 + 50;
      const cy = height / 2;
      
      ctx.clearRect(0, 0, width, height);

      // Radar rings & polar coordinate grid
      ctx.strokeStyle = 'rgba(210, 210, 198, 0.12)';
      ctx.lineWidth = 1;
      const center = { x: cx, y: cy }; 
      
      for (let r = Math.floor(currentRePx * 2); r < Math.max(width, height); r += Math.floor(currentRePx * 2)) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Axis lines
      ctx.beginPath();
      ctx.moveTo(0, center.y);
      ctx.lineTo(width, center.y);
      ctx.moveTo(center.x, 0);
      ctx.lineTo(center.x, height);
      ctx.strokeStyle = 'rgba(168, 139, 98, 0.15)';
      ctx.stroke();

      const rePx = currentRePx;

      // Inner Van Allen Belt (1.2 - 2.8 Re)
      const innerBeltGrad = ctx.createRadialGradient(
        center.x, center.y, 1.2 * rePx,
        center.x, center.y, 2.8 * rePx
      );
      innerBeltGrad.addColorStop(0, 'rgba(168, 179, 160, 0.05)');
      innerBeltGrad.addColorStop(0.5, 'rgba(168, 179, 160, 0.22)');
      innerBeltGrad.addColorStop(1, 'rgba(168, 179, 160, 0.05)');
      ctx.fillStyle = innerBeltGrad;
      ctx.beginPath();
      ctx.arc(center.x, center.y, 2.8 * rePx, 0, Math.PI * 2);
      ctx.arc(center.x, center.y, 1.2 * rePx, 0, Math.PI * 2, true);
      ctx.fill();

      // Outer Belt (3.5 - 7.5 Re)
      const outerBeltGrad = ctx.createRadialGradient(
        center.x, center.y, 3.5 * rePx,
        center.x, center.y, 7.5 * rePx
      );
      const beltHue = activeBeltColor(Vsw, Bz);
      outerBeltGrad.addColorStop(0, `rgba(${beltHue}, 0.02)`);
      outerBeltGrad.addColorStop(0.5, `rgba(${beltHue}, ${0.12 + Math.abs(Bz)*0.01 + Vsw*0.00015})`);
      outerBeltGrad.addColorStop(1, `rgba(${beltHue}, 0.02)`);
      ctx.fillStyle = outerBeltGrad;
      ctx.beginPath();
      ctx.arc(center.x, center.y, 7.5 * rePx, 0, Math.PI * 2);
      ctx.arc(center.x, center.y, 3.5 * rePx, 0, Math.PI * 2, true);
      ctx.fill();

      // Draw Solar Wind stream particles
      if (isPlaying) {
        particleOffset = (particleOffset + Vsw / 100) % 150;
      }
      ctx.fillStyle = 'rgba(168, 139, 98, 0.35)';
      for (let py = 10; py < height; py += 28) {
        for (let px = particleOffset - 150; px < width; px += 150) {
          const dx = px - center.x;
          const dy = py - center.y;
          const dist = Math.sqrt(dx * dx + dy * dy) / rePx;
          
          let drawX = px;
          let drawY = py;

          if (dx < 0 && dist < r0 + 1) {
            const angle = Math.atan2(dy, dx);
            const rDeflection = (r0 + 1.5) * rePx;
            drawX = center.x + Math.cos(angle) * rDeflection;
            drawY = center.y + Math.sin(angle) * rDeflection;
          }
          
          ctx.beginPath();
          ctx.arc(drawX, drawY, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Magnetopause Standoff Boundary r0
      ctx.beginPath();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = boundaryCompressedPastGEO 
        ? 'rgba(185, 74, 72, 0.9)' // Alert Red
        : 'rgba(168, 139, 98, 0.85)'; // Warm Bronze

      const steps = 180;
      for (let i = -steps / 2; i <= steps / 2; i++) {
        const theta = (i * Math.PI) / steps;
        const alpha = 0.5 + 0.05 * Bz;
        const r_curve = r0 * Math.pow(2 / (1 + Math.cos(theta)), alpha);
        
        const canvasRadius = Math.min(60, r_curve) * rePx;
        const x_curve = center.x - canvasRadius * Math.cos(theta);
        const y_curve = center.y + canvasRadius * Math.sin(theta);

        if (i === -steps / 2) {
          ctx.moveTo(x_curve, y_curve);
        } else {
          ctx.lineTo(x_curve, y_curve);
        }
      }
      ctx.stroke();

      // Draw Geostationary Orbit Track (GEO = 6.6 Re)
      ctx.strokeStyle = 'rgba(210, 210, 198, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(center.x, center.y, 6.6 * rePx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Satellite Positions Animation
      if (isPlaying) {
        satelliteAngleRef.current = (satelliteAngleRef.current + 0.015) % (Math.PI * 2);
      }

      // 1. ISRO GSAT Spacecraft
      const graspRadOffset = (selectedSatelliteLong * Math.PI) / 180;
      const graspAngle = graspRadOffset + satelliteAngleRef.current;
      const graspX = center.x + 6.6 * rePx * Math.cos(graspAngle);
      const graspY = center.y + 6.6 * rePx * Math.sin(graspAngle);

      // 2. NOAA GOES Spacecraft
      const goesAngle = (285 * Math.PI) / 180 + satelliteAngleRef.current;
      const goesX = center.x + 6.6 * rePx * Math.cos(goesAngle);
      const goesY = center.y + 6.6 * rePx * Math.sin(goesAngle);

      // Draw GSAT Satellite Icon
      ctx.fillStyle = '#A88B62'; // Warm bronze
      ctx.beginPath();
      ctx.arc(graspX, graspY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#A88B62';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(graspX - 8, graspY);
      ctx.lineTo(graspX + 8, graspY);
      ctx.stroke();
      
      ctx.fillStyle = '#E5E9E4';
      ctx.font = '600 9px monospace';
      ctx.fillText(`GSAT-31 (~${selectedSatelliteLong}°E)`, graspX + 10, graspY + 3);

      // Draw GOES Satellite Icon
      ctx.fillStyle = '#A8B3A0'; // Sage
      ctx.beginPath();
      ctx.arc(goesX, goesY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#A8B3A0';
      ctx.beginPath();
      ctx.moveTo(goesX - 8, goesY);
      ctx.lineTo(goesX + 8, goesY);
      ctx.stroke();

      ctx.fillStyle = '#8F998E';
      ctx.font = '9px monospace';
      ctx.fillText('GOES-16 (285°W)', goesX + 10, goesY + 3);

      // Physics Telemetry Legend in top-left
      ctx.fillStyle = '#E5E9E4';
      ctx.font = '600 11px monospace';
      ctx.fillText(`MAGNETOSPHERE DYNAMICS`, 16, 26);
      
      ctx.fillStyle = '#8F998E';
      ctx.font = '10px monospace';
      ctx.fillText(`Standoff Boundary (r0): ${r0.toFixed(2)} Re`, 16, 44);
      ctx.fillText(`Geostationary Limit  : 6.60 Re`, 16, 58);
      ctx.fillText(`Solar Dynamic P_dyn  : ${P_dyn.toFixed(2)} nPa`, 16, 72);
      ctx.fillText(`Solar Wind Vsw       : ${Math.abs(Vsw)} km/s`, 16, 86);
      ctx.fillText(`Plasma Density Nsw   : ${Nsw.toFixed(1)} cm⁻³`, 16, 100);
      ctx.fillText(`IMF Polarity Bz      : ${Bz > 0 ? '+' : ''}${Bz.toFixed(1)} nT`, 16, 114);
      
      if (boundaryCompressedPastGEO) {
        ctx.fillStyle = '#B94A48';
        ctx.font = '600 10px monospace';
        ctx.fillText('CRITICAL: BOUNDARY COMPRESSED PAST GEO', 16, 134);
        ctx.fillStyle = '#D97775';
        ctx.font = '10px monospace';
        ctx.fillText('Geostationary satellites exposed to solar wind', 16, 148);
      } else {
        ctx.fillStyle = '#437A5B';
        ctx.font = '600 10px monospace';
        ctx.fillText('STANDOFF SECURE: SHIELD INTACT', 16, 134);
      }

      // Compass Rose
      ctx.strokeStyle = 'rgba(168, 139, 98, 0.3)';
      ctx.beginPath();
      ctx.arc(width - 48, height - 48, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#8F998E';
      ctx.font = '9px monospace';
      ctx.fillText('Bz', width - 54, height - 72);
      ctx.fillText('S', width - 51, height - 20);
      
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = Bz < 0 ? '#B94A48' : '#437A5B';
      ctx.beginPath();
      ctx.moveTo(width - 48, height - 48);
      ctx.lineTo(width - 48, height - 48 + (Bz > 0 ? -14 : (Bz < 0 ? 14 : 0)));
      ctx.stroke();

      if (isPlaying) {
        animationId = requestAnimationFrame(render);
      }
    };

    const handleResize = () => {
      if (containerRef.current && canvas) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
          canvas.width = clientWidth;
          canvas.height = clientHeight;
          setDimensions({ width: clientWidth, height: clientHeight });
          if (!isPlaying) {
            requestAnimationFrame(render);
          }
        }
      }
    };
    
    handleResize();
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);

    render();

    return () => {
      ro.disconnect();
      cancelAnimationFrame(animationId);
    };
  }, [Bz, Nsw, Vsw, isPlaying, selectedSatelliteLong, boundaryCompressedPastGEO, r0]);

  const activeBeltColor = (Vsw: number, Bz: number): string => {
    if (Vsw > 650 || Bz < -8) {
      return '185, 74, 72'; // Alert Red
    }
    if (Vsw > 480 || Bz < -2) {
      return '201, 125, 44'; // Amber
    }
    return '168, 139, 98'; // Bronze
  };

  const currentRePx = Math.max(24, dimensions.height / 12);
  const globeSize = currentRePx * 3.5;
  const globeLeft = dimensions.width / 2 + 50;
  
  const markers = useMemo(() => [
    { id: "sat-1", location: [10, selectedSatelliteLong] as [number, number] },
    { id: "sat-2", location: [0, 285] as [number, number] }
  ], [selectedSatelliteLong]);

  return (
    <div className="flex flex-col gap-2 h-full font-sans">
      <div ref={containerRef} className="relative flex-1 rounded-xl border border-[#E5E5DD] dark:border-[#2B332E] bg-[#141715] overflow-hidden shadow-sm">
        
        {/* The interactive 3D Globe at the center */}
        <div 
          className="absolute z-10 pointer-events-auto transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${globeLeft}px`,
            top: '50%',
            width: `${globeSize}px`,
            height: `${globeSize}px`
          }}
        >
          <GlobeSatellites 
            speed={isPlaying ? 0.005 : 0} 
            className="w-full h-full"
            markers={markers}
          />
        </div>

        <canvas
          ref={canvasRef}
          className="w-full h-full block absolute inset-0 z-20 pointer-events-none"
        />
        
        {/* Playback Controls */}
        <div className="absolute bottom-3 left-3 flex gap-1 bg-[#1C211E]/90 p-1.5 rounded-lg border border-[#2B332E] backdrop-blur-md z-30">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-md hover:bg-white/10 text-[#E5E9E4] transition-colors cursor-pointer"
            title={isPlaying ? "Pause Simulation" : "Run Simulation"}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            onClick={() => { satelliteAngleRef.current = 0; }}
            className="p-1.5 rounded-md hover:bg-white/10 text-[#E5E9E4] transition-colors cursor-pointer"
            title="Reset Coordinates"
            aria-label="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        <div className="absolute top-3 right-3 flex flex-col gap-1 text-right text-[10px] font-mono text-[#8F998E] z-30">
          <div>P_dyn: {P_dyn.toFixed(3)} nPa</div>
          <div>Solar Vector: Sunward (Left → Right)</div>
          <div className="flex items-center justify-end gap-1 text-[#C4A57B]">
            <Zap className="h-3 w-3" />
            <span>MHD Rate: {(Vsw/50).toFixed(1)} km/s_eff</span>
          </div>
        </div>
      </div>
    </div>
  );
}
