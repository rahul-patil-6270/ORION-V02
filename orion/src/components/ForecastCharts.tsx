/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { SolarWindData, ElectronFluxData } from '../types';
import { AlertTriangle, ShieldCheck, TrendingUp } from 'lucide-react';

interface ForecastChartsProps {
  solarWindHistory: SolarWindData[];
  electronFluxHistory: ElectronFluxData[];
  predictedFluxes: {
    times: string[];
    predictions: number[];
  };
  warningTime: number; // 30, 45, 360 (6h), 720 (12h)
}

export default function ForecastCharts({
  solarWindHistory,
  electronFluxHistory,
  predictedFluxes,
  warningTime,
}: ForecastChartsProps) {
  const [activeTab, setActiveTab] = useState<'flux' | 'solar_wind'>('flux');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const fluxLimit = 100000; // 1e5 threshold for spacecraft charging anomalies

  const historicalCount = electronFluxHistory.length;
  const predictionCount = predictedFluxes.predictions.length;
  
  // Normalized drawing dimensions
  const padding = { top: 24, right: 130, bottom: 36, left: 60 };
  const graphWidth = 520;
  const graphHeight = 180;
  const viewBoxWidth = graphWidth + padding.left + padding.right;
  const viewBoxHeight = graphHeight + padding.top + padding.bottom;

  // Max values for scale
  const maxFluxHistoricalGoes = Math.max(...electronFluxHistory.map(d => d.fluxGoes), 10);
  const maxFluxHistoricalGrasp = Math.max(...electronFluxHistory.map(d => d.fluxGrasp), 10);
  const maxFluxPredicted = Math.max(...predictedFluxes.predictions, 10);
  const maxFluxVal = Math.max(maxFluxHistoricalGoes, maxFluxHistoricalGrasp, maxFluxPredicted, fluxLimit * 1.5);

  const maxVsw = Math.max(...solarWindHistory.map(d => d.Vsw), 400);
  const minBz = Math.min(...solarWindHistory.map(d => d.Bz), -5);
  const maxBz = Math.max(...solarWindHistory.map(d => d.Bz), 5);
  const absMaxBz = Math.max(Math.abs(minBz), Math.abs(maxBz));

  // 1. ELECTRON FLUX CHART RENDERING HELPERS
  const getFluxX = (index: number, total: number) => {
    return padding.left + (index / (Math.max(1, total - 1))) * graphWidth;
  };

  const getFluxY = (fluxVal: number) => {
    const minLog = 1;
    const maxLog = Math.log10(maxFluxVal);
    const currLog = Math.log10(Math.max(10, fluxVal));
    const scale = (currLog - minLog) / (maxLog - minLog || 1);
    return padding.top + (1 - scale) * graphHeight;
  };

  const goesPoints = electronFluxHistory.map((d, idx) => ({
    x: getFluxX(idx, historicalCount + predictionCount),
    y: getFluxY(d.fluxGoes),
  }));

  const graspPoints = electronFluxHistory.map((d, idx) => ({
    x: getFluxX(idx, historicalCount + predictionCount),
    y: getFluxY(d.fluxGrasp),
  }));

  const predictedPoints = predictedFluxes.predictions.map((val, idx) => ({
    x: getFluxX(historicalCount + idx, historicalCount + predictionCount),
    y: getFluxY(val),
  }));

  const createSvgPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
  };

  // 2. SOLAR WIND CHART RENDERING HELPERS
  const getSwX = (index: number, total: number) => {
    return padding.left + (index / (Math.max(1, total - 1))) * graphWidth;
  };

  const getSwY = (val: number, maxVal: number, minVal = 0) => {
    const scale = (val - minVal) / (maxVal - minVal || 1);
    return padding.top + (1 - scale) * graphHeight;
  };

  const vswPoints = solarWindHistory.map((d, idx) => ({
    x: getSwX(idx, solarWindHistory.length),
    y: getSwY(d.Vsw, maxVsw, 300),
  }));

  const bzPoints = solarWindHistory.map((d, idx) => ({
    x: getSwX(idx, solarWindHistory.length),
    y: getSwY(d.Bz, absMaxBz, -absMaxBz),
  }));

  const thresholdY = getFluxY(fluxLimit);
  const latestForecastFlux = predictedFluxes.predictions[predictedFluxes.predictions.length - 1] || 100;
  const isAnomalous = latestForecastFlux > fluxLimit;

  return (
    <div className="flex flex-col gap-3 h-full select-none text-[#252923] dark:text-[#E5E9E4] font-sans">
      {/* Charts Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 p-1 bg-[#F6F5F0] dark:bg-[#232A26] border border-[#E5E5DD] dark:border-[#2B332E] rounded-lg">
          <button
            onClick={() => setActiveTab('flux')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeTab === 'flux' 
                ? 'bg-white dark:bg-[#1C211E] text-[#252923] dark:text-white shadow-sm' 
                : 'text-[#777B70] dark:text-[#8F998E] hover:text-[#252923]'
            }`}
          >
            Electron Flux (GOES & GSAT)
          </button>
          <button
            onClick={() => setActiveTab('solar_wind')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeTab === 'solar_wind' 
                ? 'bg-white dark:bg-[#1C211E] text-[#252923] dark:text-white shadow-sm' 
                : 'text-[#777B70] dark:text-[#8F998E] hover:text-[#252923]'
            }`}
          >
            Solar Wind Multi-Drivers
          </button>
        </div>

        {/* Dynamic Status Indicator */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-xs ${
          isAnomalous 
            ? 'bg-[#B94A48]/10 text-[#B94A48] border-[#B94A48]/30' 
            : 'bg-[#437A5B]/10 text-[#437A5B] border-[#437A5B]/30'
        }`}>
          {isAnomalous ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="font-medium">Charging Hazard Threshold Exceeded (&gt;10⁵)</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="font-medium">Flux Trajectory Nominal</span>
            </>
          )}
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="relative rounded-xl border border-[#E5E5DD] dark:border-[#2B332E] bg-white dark:bg-[#1C211E] p-4 shadow-sm overflow-hidden select-none">
        {activeTab === 'flux' ? (
          <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className="w-full h-auto block select-none">
            {/* Grid Lines */}
            <line x1={padding.left} y1={padding.top} x2={padding.left + graphWidth} y2={padding.top} stroke="#E5E5DD" strokeWidth="1" strokeDasharray="3 3" />
            <line x1={padding.left} y1={padding.top + graphHeight / 2} x2={padding.left + graphWidth} y2={padding.top + graphHeight / 2} stroke="#E5E5DD" strokeWidth="1" strokeDasharray="3 3" />
            <line x1={padding.left} y1={padding.top + graphHeight} x2={padding.left + graphWidth} y2={padding.top + graphHeight} stroke="#D3D3C9" strokeWidth="1" />
            
            {/* Anomaly Limit Shaded Zone */}
            <rect 
              x={padding.left} 
              y={padding.top} 
              width={graphWidth} 
              height={Math.max(0, thresholdY - padding.top)} 
              fill="rgba(185, 74, 72, 0.05)" 
            />
            {/* Anomaly Threshold Line */}
            <line 
              x1={padding.left} 
              y1={thresholdY} 
              x2={padding.left + graphWidth} 
              y2={thresholdY} 
              stroke="#B94A48" 
              strokeWidth="1.2" 
              strokeDasharray="4 3" 
            />
            <text 
              x={padding.left + graphWidth - 8} 
              y={thresholdY - 5} 
              fill="#B94A48" 
              fontSize="9" 
              textAnchor="end" 
              fontFamily="monospace"
              fontWeight="600"
            >
              CHARGING RISK THRESHOLD (10⁵ p/cm²·s·sr)
            </text>

            {/* Split historical & forecast line */}
            <line 
              x1={getFluxX(historicalCount, historicalCount + predictionCount)} 
              y1={padding.top} 
              x2={getFluxX(historicalCount, historicalCount + predictionCount)} 
              y2={padding.top + graphHeight} 
              stroke="#A88B62" 
              strokeWidth="1" 
              strokeDasharray="3 3" 
            />
            <text 
              x={getFluxX(historicalCount, historicalCount + predictionCount) - 6} 
              y={padding.top + 14} 
              fill="#777B70" 
              fontSize="9" 
              textAnchor="end" 
              fontFamily="monospace"
            >
              PAST TELEMETRY
            </text>
            <text 
              x={getFluxX(historicalCount, historicalCount + predictionCount) + 6} 
              y={padding.top + 14} 
              fill="#A88B62" 
              fontSize="9" 
              textAnchor="start" 
              fontFamily="monospace"
              fontWeight="600"
            >
              +{warningTime}M TRAJECTORY
            </text>

            {/* Curves */}
            {/* 1. GOES Historical */}
            <path d={createSvgPath(goesPoints)} fill="none" stroke="#A88B62" strokeWidth="2" strokeLinecap="round" />
            
            {/* 2. ISRO GRASP Payload */}
            <path d={createSvgPath(graspPoints)} fill="none" stroke="#35473C" strokeWidth="2" strokeLinecap="round" />
            
            {/* 3. AI Predictive Forecast Tracker */}
            <path d={createSvgPath(predictedPoints)} fill="none" stroke="#C97D2C" strokeWidth="2" strokeDasharray="4 2" strokeLinecap="round" />

            {/* Axis labels */}
            <text x={padding.left - 8} y={getFluxY(10)} fill="#777B70" fontSize="8" textAnchor="end" fontFamily="monospace">10¹</text>
            <text x={padding.left - 8} y={getFluxY(1000)} fill="#777B70" fontSize="8" textAnchor="end" fontFamily="monospace">10³</text>
            <text x={padding.left - 8} y={getFluxY(100000)} fill="#B94A48" fontSize="8" textAnchor="end" fontFamily="monospace">10⁵</text>
            <text x={padding.left - 8} y={getFluxY(maxFluxVal)} fill="#B94A48" fontSize="8" textAnchor="end" fontFamily="monospace" fontWeight="bold">10⁶</text>

            {/* Legend */}
            <g transform={`translate(${padding.left + graphWidth + 12}, ${padding.top + 20})`}>
              <line x1="0" y1="5" x2="16" y2="5" stroke="#A88B62" strokeWidth="2" />
              <text x="22" y="8" fill="#252923" fontSize="10" fontFamily="sans-serif">GOES-16 (&gt;2 MeV)</text>

              <line x1="0" y1="22" x2="16" y2="22" stroke="#35473C" strokeWidth="2" />
              <text x="22" y="25" fill="#252923" fontSize="10" fontFamily="sans-serif">GSAT-31 (GRASP)</text>

              <line x1="0" y1="39" x2="16" y2="39" stroke="#C97D2C" strokeWidth="2" strokeDasharray="4 2" />
              <text x="22" y="42" fill="#C97D2C" fontSize="10" fontFamily="sans-serif" fontWeight="600">ORION AI Forecast</text>
            </g>

            {/* Hover tooltip */}
            {hoverIndex !== null && hoverIndex < historicalCount + predictionCount && (
              <>
                <line 
                  x1={getFluxX(hoverIndex, historicalCount + predictionCount)} 
                  y1={padding.top} 
                  x2={getFluxX(hoverIndex, historicalCount + predictionCount)} 
                  y2={padding.top + graphHeight} 
                  stroke="#252923" 
                  strokeWidth="1" 
                  strokeDasharray="2 2"
                />
                
                <foreignObject 
                  x={getFluxX(hoverIndex, historicalCount + predictionCount) > graphWidth / 2 ? padding.left + 20 : padding.left + graphWidth - 170}
                  y={padding.top + 45}
                  width="155"
                  height="75"
                >
                  <div className="bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] rounded-lg p-2 font-mono text-[9px] text-[#252923] dark:text-[#E5E9E4] shadow-md">
                    <div className="text-[#777B70] mb-1">Horizon: {hoverIndex - historicalCount >= 0 ? `+${(hoverIndex - historicalCount)*10}m` : `${(historicalCount - hoverIndex)*10}m past`}</div>
                    <div className="flex justify-between">
                      <span>GOES-16:</span>
                      <strong className="text-[#A88B62]">
                        {hoverIndex < historicalCount 
                          ? electronFluxHistory[hoverIndex]?.fluxGoes.toExponential(2) 
                          : predictedFluxes.predictions[hoverIndex - historicalCount]?.toExponential(2)
                        }
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>GSAT GRASP:</span>
                      <strong className="text-[#35473C] dark:text-[#A8B3A0]">
                        {hoverIndex < historicalCount 
                          ? electronFluxHistory[hoverIndex]?.fluxGrasp.toExponential(2)
                          : 'Projected'
                        }
                      </strong>
                    </div>
                  </div>
                </foreignObject>
              </>
            )}

            {/* Pointer tracker */}
            <rect
              x={padding.left}
              y={padding.top}
              width={graphWidth}
              height={graphHeight}
              fill="transparent"
              className="cursor-crosshair"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const index = Math.round((mouseX / rect.width) * (historicalCount + predictionCount - 1));
                setHoverIndex(index);
              }}
              onMouseLeave={() => setHoverIndex(null)}
            />
          </svg>
        ) : (
          <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className="w-full h-auto block select-none">
            {/* Equilibrium Bz line */}
            <line 
              x1={padding.left} 
              y1={getSwY(0, absMaxBz, -absMaxBz)} 
              x2={padding.left + graphWidth} 
              y2={getSwY(0, absMaxBz, -absMaxBz)} 
              stroke="#E5E5DD" 
              strokeWidth="1" 
            />

            {/* Curves */}
            <path d={createSvgPath(vswPoints)} fill="none" stroke="#A88B62" strokeWidth="2" />
            <path d={createSvgPath(bzPoints)} fill="none" stroke="#35473C" strokeWidth="2" />

            {/* Labels */}
            <text x={padding.left - 8} y={getSwY(maxVsw, maxVsw, 300)} fill="#A88B62" fontSize="9" textAnchor="end" fontFamily="monospace">{maxVsw.toFixed(0)} km/s</text>
            <text x={padding.left - 8} y={getSwY(300, maxVsw, 300)} fill="#777B70" fontSize="9" textAnchor="end" fontFamily="monospace">300 km/s</text>
            
            {/* Axis titles */}
            <g transform={`translate(${padding.left + graphWidth + 12}, ${padding.top + 24})`}>
              <line x1="0" y1="5" x2="16" y2="5" stroke="#A88B62" strokeWidth="2" />
              <text x="22" y="8" fill="#252923" fontSize="10">Vsw (Solar Wind Speed)</text>

              <line x1="0" y1="24" x2="16" y2="24" stroke="#35473C" strokeWidth="2" />
              <text x="22" y="27" fill="#252923" fontSize="10">IMF Bz (Polarity nT)</text>
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}
