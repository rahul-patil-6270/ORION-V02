/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { SatelliteState } from '../types';
import { ShieldCheck, ShieldAlert, Cpu, Radio, AlertTriangle } from 'lucide-react';

interface AnomalyMonitorProps {
  currentFlux: number;
  r0: number; // Magnetopause standoff
  selectedSatelliteId: string;
  onSatelliteChanged: (id: string) => void;
}

export default function AnomalyMonitor({
  currentFlux,
  r0,
  selectedSatelliteId,
  onSatelliteChanged,
}: AnomalyMonitorProps) {
  const [satellites, setSatellites] = useState<SatelliteState[]>([
    {
      id: 'gsat-31',
      name: 'GSAT-31 (Broadcast & Comm)',
      longitude: 83.0,
      role: 'ISRO_GSAT',
      surfaceChargingVolt: 0,
      deepDielectricCurrent: 0,
      status: 'SAFE',
      instrumentStatus: {
        payload: 'GRASP (Particle Spectrometer)',
        status: 'ONLINE',
      },
    },
    {
      id: 'gsat-30',
      name: 'GSAT-30 (Telecommunications)',
      longitude: 55.0,
      role: 'ISRO_GSAT',
      surfaceChargingVolt: 0,
      deepDielectricCurrent: 0,
      status: 'SAFE',
      instrumentStatus: {
        payload: 'EPM (Environmental Particle Monitor)',
        status: 'ONLINE',
      },
    },
    {
      id: 'goes-16',
      name: 'GOES-16 (NOAA Meteorological)',
      longitude: 285.0, // US West Longitude
      role: 'NOAA_GOES',
      surfaceChargingVolt: 0,
      deepDielectricCurrent: 0,
      status: 'SAFE',
      instrumentStatus: {
        payload: 'SEISS (Energetic Particle Sensor)',
        status: 'ONLINE',
      },
    },
  ]);

  // Compute dynamical engineering charging models depending on actual particle flux
  useEffect(() => {
    setSatellites((prevList) =>
      prevList.map((sat) => {
        // Core deep-flux calculations
        let deepCurrent = Math.max(0.1, (Math.log10(currentFlux) - 2.5) * 4.2);
        if (currentFlux < 300) deepCurrent = 0.05;

        // Surface charging voltage drops to high potential negative volts (-V) if magnetosphere boundary compresses below GEO (6.6 Re)
        let surfaceVolts = 0;
        if (r0 < 6.6) {
          const compressionRatio = (6.6 - r0) / 6.6;
          surfaceVolts = 250 + compressionRatio * 2150; // up to -2400V
        } else {
          // Ambient satellite charging from background flux
          surfaceVolts = Math.max(10, Math.log10(currentFlux) * 45);
        }

        // Apply high frequency noise
        deepCurrent += (Math.random() - 0.5) * 0.25;
        surfaceVolts += (Math.random() - 0.5) * 20;

        deepCurrent = Math.max(0.01, deepCurrent);
        surfaceVolts = Math.max(0, surfaceVolts);

        // Determine critical anomalies
        let status: 'SAFE' | 'WARNING' | 'ANOMALOUS' = 'SAFE';
        let payloadStatus: 'ONLINE' | 'DEGRADED' | 'STANDBY' = 'ONLINE';

        if (deepCurrent > 15 || surfaceVolts > 1500) {
          status = 'ANOMALOUS';
          payloadStatus = 'DEGRADED';
        } else if (deepCurrent > 8 || surfaceVolts > 500) {
          status = 'WARNING';
          payloadStatus = 'STANDBY';
        }

        return {
          ...sat,
          deepDielectricCurrent: parseFloat(deepCurrent.toFixed(2)),
          surfaceChargingVolt: parseFloat(surfaceVolts.toFixed(0)),
          status,
          instrumentStatus: {
            ...sat.instrumentStatus,
            status: payloadStatus,
          },
        };
      })
    );
  }, [currentFlux, r0]);

  const activeSatObj = satellites.find((s) => s.id === selectedSatelliteId) || satellites[0];

  return (
    <div className="flex flex-col gap-4 h-full font-sans text-xs">
      {/* Target Spacecraft selector */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] text-[#777B70] dark:text-[#8F998E]">
          <span className="font-semibold uppercase tracking-wider text-[10px]">Active Spacecraft Constellation Node</span>
          <span>{satellites.length} Satellites Tracked</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {satellites.map((s) => {
            const isSelected = s.id === selectedSatelliteId;
            return (
              <button
                key={s.id}
                onClick={() => onSatelliteChanged(s.id)}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#35473C] text-white border-[#35473C] shadow-sm'
                    : 'bg-[#F6F5F0] dark:bg-[#232A26] border-[#E5E5DD] dark:border-[#2B332E] hover:border-[#D3D3C9] dark:hover:border-[#3B463F] text-[#252923] dark:text-[#E5E9E4]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-semibold text-xs ${isSelected ? 'text-white' : 'text-[#252923] dark:text-[#E5E9E4]'}`}>
                    {s.name.split(' ')[0]}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    s.status === 'ANOMALOUS' 
                      ? 'bg-[#B94A48] animate-pulse' 
                      : s.status === 'WARNING' 
                      ? 'bg-[#C97D2C]' 
                      : 'bg-[#437A5B]'
                  }`} />
                </div>
                <div className={`text-[10px] ${isSelected ? 'text-[#A8B3A0]' : 'text-[#777B70] dark:text-[#8F998E]'}`}>
                  {s.longitude.toFixed(1)}° E · {s.status}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main satellite telemetries card */}
      <div className="border border-[#E5E5DD] dark:border-[#2B332E] rounded-xl p-4 bg-white dark:bg-[#1C211E] shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#E5E5DD] dark:border-[#2B332E] pb-3">
          <div className="flex items-center gap-2.5">
            <Radio className="h-4 w-4 text-[#A88B62] dark:text-[#C4A57B]" />
            <div>
              <div className="font-semibold text-sm text-[#252923] dark:text-[#E5E9E4]">{activeSatObj.name}</div>
              <div className="text-[10px] text-[#777B70] dark:text-[#8F998E]">Orbital Slot: {activeSatObj.longitude.toFixed(1)}° E Geostationary Equator</div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span className={`w-2 h-2 rounded-full ${
              activeSatObj.status === 'ANOMALOUS' 
                ? 'bg-[#B94A48] animate-pulse' 
                : activeSatObj.status === 'WARNING' 
                ? 'bg-[#C97D2C]' 
                : 'bg-[#437A5B]'
            }`} />
            <span className={`font-mono text-[11px] uppercase tracking-wider ${
              activeSatObj.status === 'ANOMALOUS' 
                ? 'text-[#B94A48] font-bold' 
                : activeSatObj.status === 'WARNING' 
                ? 'text-[#C97D2C] font-semibold' 
                : 'text-[#437A5B]'
            }`}>
              {activeSatObj.status}
            </span>
          </div>
        </div>

        {/* Dynamic Telemetry meters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Surface ESD build up potential meter */}
          <div className="flex flex-col gap-1.5 bg-[#F6F5F0] dark:bg-[#232A26] border border-[#E5E5DD] dark:border-[#2B332E] p-3 rounded-lg">
            <div className="flex items-center justify-between text-[11px] text-[#777B70] dark:text-[#8F998E]">
              <span className="font-medium">Surface Electrostatic Potential</span>
              <span className="font-mono text-[10px]">Limit: -1000V</span>
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-[#252923] dark:text-[#E5E9E4]">
              -{activeSatObj.surfaceChargingVolt} <span className="text-xs font-normal text-[#777B70] dark:text-[#8F998E]">Volts</span>
            </div>
            
            {/* Health Bar gauge */}
            <div className="h-2 w-full bg-[#E5E5DD] dark:bg-[#141715] rounded-full overflow-hidden mt-1">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                   activeSatObj.surfaceChargingVolt > 1000 
                     ? 'bg-[#B94A48]' 
                     : activeSatObj.surfaceChargingVolt > 500
                     ? 'bg-[#C97D2C]'
                     : 'bg-[#A88B62]'
                }`}
                style={{ width: `${Math.min(100, (activeSatObj.surfaceChargingVolt / 2400) * 100)}%` }}
              />
            </div>
          </div>

          {/* Deep Dielectric Accumulating Current */}
          <div className="flex flex-col gap-1.5 bg-[#F6F5F0] dark:bg-[#232A26] border border-[#E5E5DD] dark:border-[#2B332E] p-3 rounded-lg">
            <div className="flex items-center justify-between text-[11px] text-[#777B70] dark:text-[#8F998E]">
              <span className="font-medium">Deep-Dielectric Ingress</span>
              <span className="font-mono text-[10px]">Limit: 10 pA/cm²</span>
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-[#252923] dark:text-[#E5E9E4]">
              {activeSatObj.deepDielectricCurrent} <span className="text-xs font-normal text-[#777B70] dark:text-[#8F998E]">pA/cm²</span>
            </div>
            
            {/* Health Bar gauge */}
            <div className="h-2 w-full bg-[#E5E5DD] dark:bg-[#141715] rounded-full overflow-hidden mt-1">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  activeSatObj.deepDielectricCurrent > 12 
                    ? 'bg-[#B94A48]' 
                    : activeSatObj.deepDielectricCurrent > 8 
                    ? 'bg-[#C97D2C]' 
                    : 'bg-[#35473C] dark:bg-[#A8B3A0]'
                }`}
                style={{ width: `${Math.min(100, (activeSatObj.deepDielectricCurrent / 25) * 100)}%` }}
              />
            </div>
          </div>

        </div>

        {/* Instruments status block */}
        <div className="flex items-center justify-between text-xs text-[#252923] dark:text-[#E5E9E4] bg-[#F6F5F0] dark:bg-[#232A26] p-3 rounded-lg border border-[#E5E5DD] dark:border-[#2B332E]">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#777B70] dark:text-[#8F998E]" />
            <span>Particle Payload: <strong>{activeSatObj.instrumentStatus.payload}</strong></span>
          </div>
          <span className={`font-mono text-[11px] font-semibold uppercase ${
            activeSatObj.instrumentStatus.status === 'ONLINE' ? 'text-[#437A5B]' : 'text-[#C97D2C]'
          }`}>
            ● {activeSatObj.instrumentStatus.status}
          </span>
        </div>
      </div>

      {/* Emergency operating alert status */}
      {activeSatObj.status !== 'SAFE' && (
        <div className="p-3 rounded-lg border border-[#B94A48]/30 bg-[#B94A48]/10 text-[#B94A48] text-xs leading-relaxed flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[#B94A48]" />
          <div>
            <strong className="font-semibold">FIELD EXCURSION ALERT:</strong> Relativistic electron flux exceeds safety threshold. High dielectric charge accumulation detected on solar array junctions. Charge dissipation circuits recommended.
          </div>
        </div>
      )}
    </div>
  );
}
