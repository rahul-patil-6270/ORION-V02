import React, { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { SolarWindData, ElectronFluxData } from '../types';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";
import { AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface MultivariateRiskRadarProps {
  currentSolarWind: SolarWindData | null;
  currentElectronFlux: ElectronFluxData | null;
}

export default function MultivariateRiskRadar({ currentSolarWind, currentElectronFlux }: MultivariateRiskRadarProps) {
  
  const chartData = useMemo(() => {
    if (!currentSolarWind || !currentElectronFlux) return [];

    // Normalize parameters to 0-100% scale for radar chart
    const vswNorm = Math.min(100, Math.max(0, (currentSolarWind.Vsw - 300) / 700 * 100));
    const bzNorm = Math.min(100, Math.max(0, (Math.max(0, -currentSolarWind.Bz)) / 20 * 100));
    const nswNorm = Math.min(100, Math.max(0, currentSolarWind.Nsw / 50 * 100));
    const pdynNorm = Math.min(100, Math.max(0, currentSolarWind.P_dyn / 20 * 100));
    const kpNorm = Math.min(100, Math.max(0, (currentSolarWind.Kp || 0) / 9 * 100));
    
    const goesLog = Math.max(1, Math.log10(currentElectronFlux.fluxGoes || 10));
    const goesNorm = Math.min(100, Math.max(0, (goesLog - 1) / 5 * 100));
    
    const graspLog = Math.max(1, Math.log10(currentElectronFlux.fluxGrasp || 10));
    const graspNorm = Math.min(100, Math.max(0, (graspLog - 1) / 5 * 100));

    return [
      { metric: "Vsw", riskScore: vswNorm, rawScore: Math.round(vswNorm) },
      { metric: "Bz (South)", riskScore: bzNorm, rawScore: Math.round(bzNorm) },
      { metric: "Density", riskScore: nswNorm, rawScore: Math.round(nswNorm) },
      { metric: "Pressure", riskScore: pdynNorm, rawScore: Math.round(pdynNorm) },
      { metric: "Kp Index", riskScore: kpNorm, rawScore: Math.round(kpNorm) },
      { metric: "GOES Flux", riskScore: goesNorm, rawScore: Math.round(goesNorm) },
      { metric: "GSAT Flux", riskScore: graspNorm, rawScore: Math.round(graspNorm) },
    ];
  }, [currentSolarWind, currentElectronFlux]);

  const maxRisk = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map(d => d.riskScore));
  }, [chartData]);

  const statusColor = maxRisk > 80 ? '#B94A48' : maxRisk > 50 ? '#C97D2C' : '#437A5B';
  const statusFill = maxRisk > 80 ? 'rgba(185, 74, 72, 0.35)' : maxRisk > 50 ? 'rgba(201, 125, 44, 0.35)' : 'rgba(67, 122, 91, 0.35)';
  const statusText = maxRisk > 80 ? 'CRITICAL RISK' : maxRisk > 50 ? 'ELEVATED' : 'NOMINAL';
  const StatusIcon = maxRisk > 80 ? AlertTriangle : maxRisk > 50 ? Zap : ShieldCheck;

  if (!chartData.length) {
    return (
      <div className="h-full flex items-center justify-center text-[#777B70] font-sans text-xs">
        Awaiting orbital telemetry stream...
      </div>
    );
  }

  const dynamicConfig = {
    riskScore: {
      label: "Risk Index",
      color: statusColor,
    }
  } satisfies ChartConfig;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-4 rounded-xl shadow-sm relative font-sans">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xs font-semibold text-[#252923] dark:text-[#E5E9E4] uppercase tracking-wider">
            Multivariate Space Weather Risk Radar
          </h3>
          <p className="text-[10px] text-[#777B70] dark:text-[#8F998E]">
            Normalized dynamic vector distribution across key physical drivers
          </p>
        </div>
        <div 
          className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border"
          style={{
            borderColor: `${statusColor}40`,
            backgroundColor: `${statusColor}12`,
            color: statusColor
          }}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          <span>{statusText}</span>
        </div>
      </div>
      
      <div className="flex-1 w-full h-full min-h-[220px]">
        <ChartContainer config={dynamicConfig} className="w-full h-full">
          <RadarChart data={chartData} margin={{ top: 15, right: 20, bottom: 15, left: 20 }}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarGrid stroke="#E5E5DD" gridType="polygon" />
            <PolarAngleAxis 
              dataKey="metric" 
              tick={{ fill: "#777B70", fontSize: 10, fontFamily: "sans-serif" }} 
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={{ fill: "#A8B3A0", fontSize: 8, fontFamily: "monospace" }}
              tickCount={5}
            />
            <Radar
              name="Risk Capacity"
              dataKey="riskScore"
              stroke={statusColor}
              fill={statusFill}
              fillOpacity={0.65}
              strokeWidth={2}
            />
          </RadarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
