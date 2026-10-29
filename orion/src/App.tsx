/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Activity, 
  UploadCloud, 
  SlidersHorizontal, 
  Download, 
  RefreshCw, 
  Layers, 
  AlertOctagon,
  Compass,
  Radio,
  Sparkles,
  LayoutDashboard,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Zap,
  ShieldCheck,
  ShieldAlert,
  BrainCircuit,
  TrendingUp,
  Cpu,
  RotateCcw,
  Menu,
  X
} from 'lucide-react';

import DesktopWindow from './components/DesktopWindow';
import MagnetosphereView from './components/MagnetosphereView';
import ForecastCharts from './components/ForecastCharts';
import AnomalyMonitor from './components/AnomalyMonitor';
import CDFProcessor from './components/CDFProcessor';
import ModelDeveloperPanel from './components/ModelDeveloperPanel';
import AlertMonitorDashboard from './components/AlertMonitorDashboard';
import MultivariateRiskRadar from './components/MultivariateRiskRadar';
import { WindowWorkspace } from './components/WindowWorkspace';
import { CelestialBackground } from './components/CelestialBackground';
import { OrionBrandMark } from './components/OrionBrandMark';
import { ScrambledTitle } from './components/ScrambledTitle';

import { SolarWindData, ElectronFluxData } from './types';
import { 
  estimateKpIndex, 
  calculateDynamicPressure, 
  simulateElectronFluxResponse, 
  generateCMEStormTimeline, 
  calculateMagnetopauseRe 
} from './physics/magnetosphere';
import { modelRegistry } from './services/modelRegistry';

type NavModule = 
  | 'overview'
  | 'simControl'
  | 'magnetosphere'
  | 'forecast'
  | 'instruments'
  | 'alertsDashboard'
  | 'riskRadar'
  | 'cdfIngest'
  | 'modelRegistry'
  | 'aiAnalyst'
  | 'systemLogs';

export default function App() {
  // 1. Core State Drivers
  const [Vsw, setVsw] = useState(420);    // Solar wind speed, km/s
  const [Bz, setBz] = useState(1.5);      // IMF Bz component, nT
  const [Nsw, setNsw] = useState(5.2);    // Solar density, cm^-3
  const [selectedSatelliteId, setSelectedSatelliteId] = useState('gsat-31');

  // Space weather datasets timelines
  const [solarWindHistory, setSolarWindHistory] = useState<SolarWindData[]>([]);
  const [electronFluxHistory, setElectronFluxHistory] = useState<ElectronFluxData[]>([]);
  const [predictedFluxes, setPredictedFluxes] = useState<{ times: string[]; predictions: number[] }>({ times: [], predictions: [] });

  // 2. Active Model Status
  const [activeModelId, setActiveModelId] = useState(modelRegistry.getActiveModel().id);

  // 3. UI Presentation State
  const [activeModule, setActiveModule] = useState<NavModule>('overview');
  const [viewMode, setViewMode] = useState<'dashboard' | 'windowWorkspace'>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Floating Window Management (for Window Deck View)
  const [openWindows, setOpenWindows] = useState({
    simControl: true,
    magnetosphere: true,
    forecast: true,
    instruments: true,
    alertsDashboard: true,
    riskRadar: true,
    cdfIngest: false,
    modelRegistry: false,
    systemLogs: true,
    aiAnalyst: true,
  });

  const [activeWindow, setActiveWindow] = useState('forecast');
  const [windowOrder, setWindowOrder] = useState<string[]>([
    'simControl', 
    'alertsDashboard', 
    'forecast', 
    'aiAnalyst', 
    'riskRadar'
  ]);

  // 4. Gemini AI Space Weather Report State
  const [aiReport, setAiReport] = useState<{
    standoffAnalysis?: string;
    beltElectrodynamics?: string;
    anomalyAssessment?: string;
    mitigationRecommendation?: string;
  } | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // 5. System console diagnostics logs
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '[ORION-INIT] Geostationary Space Weather Observatory v3.0 Online.',
    '[TELEMETRY] Orbital Longitude mapped: 83.0° East (GSAT-31 Primary).',
    '[WIND-STREAM] Solar Wind Telemetry feed connected: OK.',
    '[NOAA-SEISS] Relativistic Electron Flux (>2 MeV) synchronized: OK.'
  ]);

  const addLog = (msg: string) => {
    setConsoleLogs(prev => [...prev.slice(-30), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // 6. Initialize history datasets
  useEffect(() => {
    const swData = generateCMEStormTimeline(12);
    setSolarWindHistory(swData);

    const fluxData: ElectronFluxData[] = [];
    let currentGoes = 1200;
    let currentGrasp = 850;

    swData.forEach((d) => {
      currentGoes = simulateElectronFluxResponse(currentGoes, d.Vsw, d.Bz, d.Nsw, 10);
      const indianOffsetVsw = d.Vsw * (1 + 0.05 * Math.sin(83 * Math.PI / 180));
      currentGrasp = simulateElectronFluxResponse(currentGrasp, indianOffsetVsw, d.Bz, d.Nsw, 10);

      fluxData.push({
        time: d.time,
        fluxGoes: currentGoes,
        fluxGrasp: currentGrasp
      });
    });

    setElectronFluxHistory(fluxData);
    addLog('Loaded past 12-hour space weather telemetry archive.');
  }, []);

  // 6.5 Real-time Telemetry Data Feed Simulation (3-second cadence)
  useEffect(() => {
    const timer = setInterval(() => {
      setVsw(prev => Math.max(250, Math.min(prev + (Math.random() - 0.5) * 15, 1200)));
      setNsw(prev => Math.max(1, Math.min(prev + (Math.random() - 0.5) * 1.5, 50)));
      setBz(prev => Math.max(-30, Math.min(prev + (Math.random() - 0.5) * 2, 20)));
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  // 6.6 Auto-append telemetry stream to history buffers
  useEffect(() => {
    if (solarWindHistory.length === 0) return;

    const time = new Date().toISOString();
    const P_dyn = calculateDynamicPressure(Nsw, Vsw);
    const Kp = estimateKpIndex(Vsw, Bz);
    const newDataPoint: SolarWindData = { time, Vsw, Bz, Nsw, P_dyn, Kp };

    setSolarWindHistory(prev => [...prev.slice(1), newDataPoint]);

    setElectronFluxHistory(prev => {
      const lastGoes = prev[prev.length - 1]?.fluxGoes || 1200;
      const lastGrasp = prev[prev.length - 1]?.fluxGrasp || 850;

      const nextGoes = simulateElectronFluxResponse(lastGoes, Vsw, Bz, Nsw, 10);
      const indianOffsetVsw = Vsw * (1 + 0.05 * Math.sin(83 * Math.PI / 180));
      const nextGrasp = simulateElectronFluxResponse(lastGrasp, indianOffsetVsw, Bz, Nsw, 10);

      return [
        ...prev.slice(1),
        { time, fluxGoes: nextGoes, fluxGrasp: nextGrasp }
      ];
    });
  }, [Vsw, Bz, Nsw]);

  // Update dynamic predictive trajectories
  useEffect(() => {
    if (electronFluxHistory.length === 0) return;
    
    const latestFlux = electronFluxHistory[electronFluxHistory.length - 1]?.fluxGoes || 1200;
    const forecast = modelRegistry.generateForecast(activeModelId, latestFlux, solarWindHistory, 12);
    setPredictedFluxes({
      times: forecast.times,
      predictions: forecast.predictions,
    });
  }, [electronFluxHistory, activeModelId, solarWindHistory, Vsw, Bz, Nsw]);

  // Toggle dark/light theme class on root element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Adjust parameters manually via sliders
  const handleSliderChange = (type: 'Vsw' | 'Bz' | 'Nsw', val: number) => {
    if (type === 'Vsw') {
      setVsw(val);
      addLog(`Solar wind velocity shifted manually to ${val.toFixed(0)} km/s`);
    } else if (type === 'Bz') {
      setBz(val);
      addLog(`IMF Bz adjusted to ${val.toFixed(1)} nT (North/South axis)`);
    } else if (type === 'Nsw') {
      setNsw(val);
      addLog(`Proton density adjusted to ${val.toFixed(1)} cm⁻³`);
    }
  };

  // Pre-configured solar storm scenarios
  const loadScenario = (type: 'calm' | 'cme_shock' | 'halloween') => {
    addLog(`Loading planetary event profile: ${type.toUpperCase()}`);
    if (type === 'calm') {
      setVsw(340);
      setBz(2.8);
      setNsw(3.5);
      addLog('Calm baseline: magnetopause standoff at 10.5 Earth Radii (Nominal).');
    } else if (type === 'cme_shock') {
      setVsw(780);
      setBz(-12.5);
      setNsw(32);
      addLog('Severe CME Shock: southward IMF Bz triggering magnetopause compression.');
    } else if (type === 'halloween') {
      setVsw(990);
      setBz(-22.0);
      setNsw(48);
      addLog('Historic Extreme Flare: severe compression past 6.6 Re geostationary orbit!');
    }
  };

  // Gemini AI space weather report trigger
  const generateSpaceWeatherPhysicsReport = async () => {
    setIsGeneratingReport(true);
    setAiReport(null);
    addLog('Querying ORION server-side Gemini physics analyst...');
    
    try {
      const activeSatelliteName = selectedSatelliteId === 'gsat-31' 
        ? 'GSAT-31 (Indian long: 83°E)' 
        : selectedSatelliteId === 'gsat-30'
        ? 'GSAT-30 (Indian long: 55°E)'
        : 'GOES-16 (NOAA primary)';

      const response = await fetch('/api/forecast/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Vsw,
          Bz,
          Nsw,
          P_dyn: calculateDynamicPressure(Nsw, Vsw),
          Kp: estimateKpIndex(Vsw, Bz),
          currentFlux: electronFluxHistory[electronFluxHistory.length - 1]?.fluxGoes || 1200,
          satelliteName: activeSatelliteName,
          warningTime: '30-45 minutes ahead warning threshold'
        }),
      });

      const data = await response.json();
      setAiReport(data);
      addLog('Physics-informed space weather summary synthesized successfully.');
    } catch (err) {
      console.error(err);
      addLog('Notice: Gemini engine unavailable. Displaying analytical fallback calculations.');
      setAiReport({
        standoffAnalysis: 'Magnetopause standoff compressed past subsolar equilibrium threshold.',
        beltElectrodynamics: 'Chorus wave growth accelerates outer zone relativistic electrons.',
        anomalyAssessment: 'Elevated electrostatic risk detected on spacecraft dielectric interfaces.',
        mitigationRecommendation: 'Initiate telemetry payload standby and charge dissipation circuits.'
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleWindowFocus = (name: string) => {
    setActiveWindow(name);
    setWindowOrder(prev => {
      const remaining = prev.filter(w => w !== name);
      return [...remaining, name];
    });
  };

  const toggleWindow = (name: keyof typeof openWindows) => {
    setOpenWindows(prev => {
      const isOpening = !prev[name];
      if (isOpening) {
        setWindowOrder(order => {
          const remaining = order.filter(w => w !== name);
          return [...remaining, name];
        });
        setActiveWindow(name);
      }
      return { ...prev, [name]: isOpening };
    });
  };

  // Calculated physical parameters
  const currentP_dyn = calculateDynamicPressure(Nsw, Vsw);
  const currentKp = estimateKpIndex(Vsw, Bz);
  const currentRe0 = calculateMagnetopauseRe(Bz, currentP_dyn);
  const isMagnetopauseCompressed = currentRe0 < 6.6;

  const latestFluxVal = electronFluxHistory[electronFluxHistory.length - 1]?.fluxGoes || 1200;
  const getFluxRisk = (fluxVal: number) => {
    if (fluxVal > 100000) return 'CRITICAL';
    if (fluxVal > 52000) return 'HIGH';
    if (fluxVal > 10000) return 'MODERATE';
    return 'LOW';
  };

  const p30m = predictedFluxes.predictions[2] || (latestFluxVal * 1.05);
  const p6h = predictedFluxes.predictions[35] || (latestFluxVal * 1.35);
  const p12h = predictedFluxes.predictions[71] || (latestFluxVal * 1.85);

  const predicted30m = { flux: p30m, risk: getFluxRisk(p30m) };
  const predicted6h = { flux: p6h, risk: getFluxRisk(p6h) };
  const predicted12h = { flux: p12h, risk: getFluxRisk(p12h) };

  const activeSatName = selectedSatelliteId === 'gsat-31' 
    ? 'GSAT-31 (Indian long: 83°E)' 
    : selectedSatelliteId === 'gsat-30'
    ? 'GSAT-30 (Indian long: 55°E)'
    : 'GOES-16 (NOAA Primary)';

  // Telemetry Sliders Component
  const TelemetryFeedContent = () => (
    <div className="flex flex-col gap-4 font-sans text-xs">
      <div className="flex flex-col gap-1.5 bg-[#F6F5F0] dark:bg-[#232A26] border border-[#E5E5DD] dark:border-[#2B332E] p-3 rounded-lg">
        <div className="flex justify-between items-center text-[#252923] dark:text-[#E5E9E4]">
          <span className="font-semibold">Solar Wind Velocity (Vsw)</span>
          <span className="font-mono font-bold text-sm text-[#A88B62] dark:text-[#C4A57B]">
            {Vsw.toFixed(0)} km/s
          </span>
        </div>
        <input
          type="range"
          min="300"
          max="1200"
          value={Vsw}
          onChange={(e) => handleSliderChange('Vsw', parseInt(e.target.value))}
          className="w-full accent-[#A88B62] bg-[#E5E5DD] dark:bg-[#141715] rounded h-2 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-[#777B70] dark:text-[#8F998E]">
          <span>Calm: ~350 km/s</span>
          <span>Fast streams: ~600 km/s</span>
          <span>CME Shock: &gt;800 km/s</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 bg-[#F6F5F0] dark:bg-[#232A26] border border-[#E5E5DD] dark:border-[#2B332E] p-3 rounded-lg">
        <div className="flex justify-between items-center text-[#252923] dark:text-[#E5E9E4]">
          <span className="font-semibold">Interplanetary Magnetic Field (IMF Bz)</span>
          <span className={`font-mono font-bold text-sm ${Bz < 0 ? 'text-[#B94A48]' : 'text-[#437A5B]'}`}>
            {Bz > 0 ? '+' : ''}{Bz.toFixed(1)} nT
          </span>
        </div>
        <input
          type="range"
          min="-25"
          max="15"
          step="0.5"
          value={Bz}
          onChange={(e) => handleSliderChange('Bz', parseFloat(e.target.value))}
          className="w-full accent-[#35473C] bg-[#E5E5DD] dark:bg-[#141715] rounded h-2 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-[#777B70] dark:text-[#8F998E]">
          <span>Southward (Storm trigger): &lt; 0 nT</span>
          <span>Northward (Closed): &gt; 0 nT</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 bg-[#F6F5F0] dark:bg-[#232A26] border border-[#E5E5DD] dark:border-[#2B332E] p-3 rounded-lg">
        <div className="flex justify-between items-center text-[#252923] dark:text-[#E5E9E4]">
          <span className="font-semibold">Proton Number Density (Nsw)</span>
          <span className="font-mono font-bold text-sm text-[#35473C] dark:text-[#A8B3A0]">
            {Nsw.toFixed(1)} cm⁻³
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="60"
          step="0.1"
          value={Nsw}
          onChange={(e) => handleSliderChange('Nsw', parseFloat(e.target.value))}
          className="w-full accent-[#35473C] bg-[#E5E5DD] dark:bg-[#141715] rounded h-2 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-[#777B70] dark:text-[#8F998E]">
          <span>Background: 3-5 cm⁻³</span>
          <span>CME Shock Sheet: &gt;25 cm⁻³</span>
        </div>
      </div>

      {/* Computed Derived Metrics */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-lg border border-[#E5E5DD] dark:border-[#2B332E] bg-white dark:bg-[#1C211E]">
          <div className="text-[10px] text-[#777B70] dark:text-[#8F998E]">Dynamic Pressure (P_dyn)</div>
          <div className="font-mono font-bold text-base text-[#252923] dark:text-[#E5E9E4] mt-0.5">
            {currentP_dyn.toFixed(2)} <span className="text-xs font-normal text-[#777B70]">nPa</span>
          </div>
        </div>
        <div className="p-2.5 rounded-lg border border-[#E5E5DD] dark:border-[#2B332E] bg-white dark:bg-[#1C211E]">
          <div className="text-[10px] text-[#777B70] dark:text-[#8F998E]">Estimated Kp Index</div>
          <div className="font-mono font-bold text-base text-[#252923] dark:text-[#E5E9E4] mt-0.5">
            Kp {currentKp} <span className="text-xs font-normal text-[#777B70]">(0-9 Scale)</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Gemini AI Analyst Content
  const AIAnalystContent = () => (
    <div className="flex flex-col gap-3 h-full font-sans text-xs">
      <div className="flex items-center justify-between border-b border-[#E5E5DD] dark:border-[#2B332E] pb-2.5">
        <div>
          <span className="font-semibold text-xs text-[#252923] dark:text-[#E5E9E4]">
            Physics-Informed Space Weather Intelligence
          </span>
          <p className="text-[10px] text-[#777B70] dark:text-[#8F998E]">
            Model: Gemini 3.8 Flash · Space Physics Laboratory Expert Analyst
          </p>
        </div>
        <button
          onClick={generateSpaceWeatherPhysicsReport}
          disabled={isGeneratingReport}
          className="px-3 py-1.5 rounded-lg bg-[#35473C] text-white hover:bg-[#27352D] disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-medium shadow-sm"
        >
          {isGeneratingReport ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Synthesizing...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generate Physics Advisory</span>
            </>
          )}
        </button>
      </div>

      {aiReport ? (
        <div className="flex flex-col gap-3 text-xs leading-relaxed overflow-auto pr-1">
          <div className="p-3 rounded-lg border border-[#A88B62]/30 bg-[#A88B62]/5">
            <span className="font-semibold text-[11px] text-[#A88B62] uppercase tracking-wider block mb-1">
              Standoff Core Analysis
            </span>
            <p className="text-[#252923] dark:text-[#E5E9E4]">{aiReport.standoffAnalysis}</p>
          </div>
          <div className="p-3 rounded-lg border border-[#35473C]/30 bg-[#35473C]/5 dark:border-[#A8B3A0]/30 dark:bg-[#A8B3A0]/5">
            <span className="font-semibold text-[11px] text-[#35473C] dark:text-[#A8B3A0] uppercase tracking-wider block mb-1">
              Radiation Belt Electrodynamics
            </span>
            <p className="text-[#252923] dark:text-[#E5E9E4]">{aiReport.beltElectrodynamics}</p>
          </div>
          <div className="p-3 rounded-lg border border-[#B94A48]/30 bg-[#B94A48]/5">
            <span className="font-semibold text-[11px] text-[#B94A48] uppercase tracking-wider block mb-1">
              Spacecraft Charging Risk Assessment
            </span>
            <p className="text-[#252923] dark:text-[#E5E9E4]">{aiReport.anomalyAssessment}</p>
          </div>
          <div className="p-3 rounded-lg border border-[#437A5B]/30 bg-[#437A5B]/5">
            <span className="font-semibold text-[11px] text-[#437A5B] uppercase tracking-wider block mb-1">
              Engineering Mitigation Protocol
            </span>
            <p className="text-[#252923] dark:text-[#E5E9E4] whitespace-pre-line">{aiReport.mitigationRecommendation}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 py-8 text-center text-[#777B70] dark:text-[#8F998E]">
          <BrainCircuit className="h-8 w-8 mb-2 text-[#A88B62] opacity-60" />
          <p className="text-xs font-medium">No active advisory synthesized</p>
          <p className="text-[10px] mt-0.5">Click &ldquo;Generate Physics Advisory&rdquo; to analyze current solar wind telemetry</p>
        </div>
      )}
    </div>
  );

  // Terminal Console Content
  const TerminalConsoleContent = () => (
    <div className="flex flex-col gap-1 font-mono text-[10px] h-full overflow-y-auto max-h-[180px] p-2 bg-[#F6F5F0] dark:bg-[#141715] border border-[#E5E5DD] dark:border-[#2B332E] rounded-lg">
      {consoleLogs.map((log, idx) => (
        <div 
          key={idx} 
          className={
            log.includes('CRITICAL') || log.includes('COLLAPSE')
              ? 'text-[#B94A48] font-bold'
              : log.includes('ORION') || log.includes('INIT')
              ? 'text-[#35473C] dark:text-[#A8B3A0] font-semibold'
              : log.includes('TELEMETRY')
              ? 'text-[#A88B62]'
              : 'text-[#777B70] dark:text-[#8F998E]'
          }
        >
          {log}
        </div>
      ))}
    </div>
  );

  // Window renderer for 3D Window Deck view
  const renderWindowContent = (id: string, motionStyle: any) => {
    switch(id) {
      case 'simControl':
        return (
          <DesktopWindow
            id="simControl"
            title="Solar Wind Telemetry Feed"
            onClose={() => toggleWindow('simControl')}
            isActive={activeWindow === 'simControl'}
            onFocus={() => handleWindowFocus('simControl')}
            defaultPosition={{ x: 0, y: 0 }}
            defaultSize={{ width: 620, height: 440 }}
            motionStyle={motionStyle}
          >
            <TelemetryFeedContent />
          </DesktopWindow>
        );
      case 'magnetosphere':
        return (
          <DesktopWindow
            id="magnetosphere"
            title="Bow Shock & Radiation Belts"
            onClose={() => toggleWindow('magnetosphere')}
            isActive={activeWindow === 'magnetosphere'}
            onFocus={() => handleWindowFocus('magnetosphere')}
            defaultPosition={{ x: 0, y: 0 }}
            defaultSize={{ width: 640, height: 460 }}
            motionStyle={motionStyle}
          >
            <MagnetosphereView 
              Bz={Bz} 
              Nsw={Nsw} 
              Vsw={Vsw} 
              selectedSatelliteLong={selectedSatelliteId === 'gsat-31' ? 83.0 : (selectedSatelliteId === 'gsat-30' ? 55.0 : 285.0)} 
            />
          </DesktopWindow>
        );
      case 'forecast':
        return (
          <DesktopWindow
            id="forecast"
            title="Predictive Trajectories"
            onClose={() => toggleWindow('forecast')}
            isActive={activeWindow === 'forecast'}
            onFocus={() => handleWindowFocus('forecast')}
            defaultPosition={{ x: 0, y: 0 }}
            defaultSize={{ width: 660, height: 450 }}
            motionStyle={motionStyle}
          >
            <ForecastCharts 
              solarWindHistory={solarWindHistory} 
              electronFluxHistory={electronFluxHistory} 
              predictedFluxes={predictedFluxes} 
              warningTime={45} 
            />
          </DesktopWindow>
        );
      case 'instruments':
        return (
          <DesktopWindow
            id="instruments"
            title="Satellite Charging Diagnostics"
            onClose={() => toggleWindow('instruments')}
            isActive={activeWindow === 'instruments'}
            onFocus={() => handleWindowFocus('instruments')}
            defaultPosition={{ x: 0, y: 0 }}
            defaultSize={{ width: 620, height: 440 }}
            motionStyle={motionStyle}
          >
            <AnomalyMonitor 
              currentFlux={electronFluxHistory[electronFluxHistory.length - 1]?.fluxGoes || 1200} 
              r0={currentRe0} 
              selectedSatelliteId={selectedSatelliteId} 
              onSatelliteChanged={(id) => { 
                setSelectedSatelliteId(id); 
                addLog(`Spacecraft tracking context switched to ${id.toUpperCase()}`); 
              }} 
            />
          </DesktopWindow>
        );
      case 'cdfIngest':
        return (
          <DesktopWindow
            id="cdfIngest"
            title="CDF Telemetry Pipeline"
            onClose={() => toggleWindow('cdfIngest')}
            isActive={activeWindow === 'cdfIngest'}
            onFocus={() => handleWindowFocus('cdfIngest')}
            defaultPosition={{ x: 0, y: 0 }}
            defaultSize={{ width: 620, height: 440 }}
            motionStyle={motionStyle}
          >
            <CDFProcessor 
              onDataIngested={(raw, cleaned) => { 
                addLog('CDF payload ingested. Calibrating historical timelines...'); 
                const incomingSWHistory = generateCMEStormTimeline(12); 
                setSolarWindHistory(incomingSWHistory); 
                const newFluxHistory = incomingSWHistory.map((d, index) => { 
                  const cleanedVal = cleaned[index % cleaned.length] || 1500; 
                  return { time: d.time, fluxGoes: cleanedVal, fluxGrasp: cleanedVal * 0.8 }; 
                }); 
                setElectronFluxHistory(newFluxHistory); 
                addLog('Despiking and gap interpolation loaded successfully.'); 
              }} 
            />
          </DesktopWindow>
        );
      case 'modelRegistry':
        return (
          <DesktopWindow
            id="modelRegistry"
            title="Model Architecture Registry"
            onClose={() => toggleWindow('modelRegistry')}
            isActive={activeWindow === 'modelRegistry'}
            onFocus={() => handleWindowFocus('modelRegistry')}
            defaultPosition={{ x: 0, y: 0 }}
            defaultSize={{ width: 620, height: 440 }}
            motionStyle={motionStyle}
          >
            <ModelDeveloperPanel 
              activeModelId={activeModelId} 
              onModelsChanged={() => { 
                const active = modelRegistry.getActiveModel(); 
                setActiveModelId(active.id); 
                addLog(`Active ML architecture updated to: ${active.name}`); 
              }} 
            />
          </DesktopWindow>
        );
      case 'alertsDashboard':
        return (
          <DesktopWindow
            id="alertsDashboard"
            title="Alert & Dispatch Center"
            onClose={() => toggleWindow('alertsDashboard')}
            isActive={activeWindow === 'alertsDashboard'}
            onFocus={() => handleWindowFocus('alertsDashboard')}
            defaultPosition={{ x: 0, y: 0 }}
            defaultSize={{ width: 660, height: 470 }}
            motionStyle={motionStyle}
          >
            <AlertMonitorDashboard 
              Vsw={Vsw} 
              Bz={Bz} 
              Nsw={Nsw} 
              P_dyn={currentP_dyn} 
              Kp={currentKp} 
              r0={currentRe0} 
              predicted30m={predicted30m} 
              predicted6h={predicted6h} 
              predicted12h={predicted12h} 
              addLog={addLog} 
              activeSatelliteName={activeSatName} 
            />
          </DesktopWindow>
        );
      case 'systemLogs':
        return (
          <DesktopWindow
            id="systemLogs"
            title="Telemetry Console Stream"
            onClose={() => toggleWindow('systemLogs')}
            isActive={activeWindow === 'systemLogs'}
            onFocus={() => handleWindowFocus('systemLogs')}
            defaultPosition={{ x: 0, y: 0 }}
            defaultSize={{ width: 600, height: 350 }}
            motionStyle={motionStyle}
          >
            <TerminalConsoleContent />
          </DesktopWindow>
        );
      case 'aiAnalyst':
        return (
          <DesktopWindow
            id="aiAnalyst"
            title="Physics Analyst (Gemini)"
            onClose={() => toggleWindow('aiAnalyst')}
            isActive={activeWindow === 'aiAnalyst'}
            onFocus={() => handleWindowFocus('aiAnalyst')}
            defaultPosition={{ x: 0, y: 0 }}
            defaultSize={{ width: 640, height: 460 }}
            motionStyle={motionStyle}
          >
            <AIAnalystContent />
          </DesktopWindow>
        );
      case 'riskRadar':
        return (
          <DesktopWindow
            id="riskRadar"
            title="Multivariate Risk Radar"
            onClose={() => toggleWindow('riskRadar')}
            isActive={activeWindow === 'riskRadar'}
            onFocus={() => handleWindowFocus('riskRadar')}
            defaultPosition={{ x: 0, y: 0 }}
            defaultSize={{ width: 600, height: 440 }}
            motionStyle={motionStyle}
          >
            <MultivariateRiskRadar 
              currentSolarWind={solarWindHistory[solarWindHistory.length - 1] || null} 
              currentElectronFlux={electronFluxHistory[electronFluxHistory.length - 1] || null}
            />
          </DesktopWindow>
        );
      default: return null;
    }
  };

  const navItems: Array<{ id: NavModule; label: string; icon: React.ReactNode; group: string }> = [
    { id: 'overview', label: 'Observatory Command', icon: <LayoutDashboard className="h-4 w-4" />, group: 'OBSERVATORY' },
    { id: 'simControl', label: 'Solar Wind Feed', icon: <SlidersHorizontal className="h-4 w-4" />, group: 'OBSERVATORY' },
    { id: 'magnetosphere', label: 'Bow Shock & Orbits', icon: <Compass className="h-4 w-4" />, group: 'OBSERVATORY' },
    { id: 'forecast', label: 'Predictive Trajectories', icon: <TrendingUp className="h-4 w-4" />, group: 'OBSERVATORY' },
    { id: 'instruments', label: 'Spacecraft Charging', icon: <ShieldAlert className="h-4 w-4" />, group: 'OBSERVATORY' },
    
    { id: 'alertsDashboard', label: 'Alert Dispatch Center', icon: <AlertOctagon className="h-4 w-4" />, group: 'INTELLIGENCE & ALERTS' },
    { id: 'riskRadar', label: 'Multivariate Risk Radar', icon: <Activity className="h-4 w-4" />, group: 'INTELLIGENCE & ALERTS' },
    { id: 'aiAnalyst', label: 'Physics Analyst (AI)', icon: <Sparkles className="h-4 w-4" />, group: 'INTELLIGENCE & ALERTS' },
    { id: 'cdfIngest', label: 'CDF Data Pipeline', icon: <UploadCloud className="h-4 w-4" />, group: 'DATA & MODELS' },
    { id: 'modelRegistry', label: 'AI Model Registry', icon: <Layers className="h-4 w-4" />, group: 'DATA & MODELS' },
    { id: 'systemLogs', label: 'Terminal Diagnostics', icon: <Terminal className="h-4 w-4" />, group: 'DATA & MODELS' },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F6F5F0] dark:bg-[#141715] text-[#252923] dark:text-[#E5E9E4] font-sans relative select-none">
      <CelestialBackground />

      {/* Portal container for maximized windows */}
      <div id="maximized-window-portal" className="absolute left-0 top-[60px] right-0 bottom-[36px] z-[9999] pointer-events-none" />

      {/* ─── SIDEBAR NAVIGATION ─── */}
      <aside 
        className={`relative z-30 flex flex-col border-r border-[#E5E5DD] dark:border-[#2B332E] bg-white/95 dark:bg-[#1C211E]/95 backdrop-blur-md transition-all duration-300 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        } ${isMobileMenuOpen ? 'fixed inset-y-0 left-0 z-50 w-72' : 'hidden md:flex'}`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-[#E5E5DD] dark:border-[#2B332E] px-4 flex items-center justify-between shrink-0">
          {!isSidebarCollapsed ? (
            <OrionBrandMark size="md" />
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 rounded-lg bg-[#35473C] flex items-center justify-center text-[#F6F5F0] font-bold text-xs">
                O
              </div>
            </div>
          )}

          {isMobileMenuOpen && (
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 text-[#777B70] hover:text-[#252923] md:hidden cursor-pointer"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Modules list */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-5 custom-scrollbar">
          {['OBSERVATORY', 'INTELLIGENCE & ALERTS', 'DATA & MODELS'].map(groupName => {
            const groupItems = navItems.filter(item => item.group === groupName);
            return (
              <div key={groupName} className="flex flex-col gap-1">
                {!isSidebarCollapsed && (
                  <span className="text-[10px] font-semibold text-[#777B70] dark:text-[#8F998E] uppercase tracking-wider px-2 mb-1">
                    {groupName}
                  </span>
                )}
                {groupItems.map(item => {
                  const isActive = activeModule === item.id;
                  const isCriticalAlert = item.id === 'alertsDashboard' && isMagnetopauseCompressed;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveModule(item.id);
                        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                      }}
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-[#35473C] text-white shadow-sm'
                          : 'text-[#252923] dark:text-[#E5E9E4] hover:bg-[#F6F5F0] dark:hover:bg-[#232A26]'
                      } ${isCriticalAlert ? 'ring-1 ring-[#B94A48] animate-pulse' : ''}`}
                    >
                      <span className={`${isActive ? 'text-[#A8B3A0]' : 'text-[#777B70] dark:text-[#8F998E]'}`}>
                        {item.icon}
                      </span>
                      {!isSidebarCollapsed && (
                        <span className="truncate flex-1">{item.label}</span>
                      )}
                      {isCriticalAlert && !isSidebarCollapsed && (
                        <span className="w-2 h-2 rounded-full bg-[#B94A48] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer info */}
        <div className="border-t border-[#E5E5DD] dark:border-[#2B332E] p-3 flex items-center justify-between text-xs text-[#777B70] dark:text-[#8F998E] shrink-0">
          {!isSidebarCollapsed && (
            <div className="flex flex-col text-[11px] min-w-0">
              <span className="font-semibold text-[#252923] dark:text-[#E5E9E4] truncate">
                {modelRegistry.getActiveModel().name}
              </span>
              <span className="text-[10px] text-[#A88B62]">Active Forecasting Engine</span>
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-md hover:bg-[#F6F5F0] dark:hover:bg-[#232A26] text-[#777B70] hover:text-[#252923] dark:hover:text-white transition-colors cursor-pointer shrink-0 ml-auto"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* ─── MAIN WORKSPACE COLUMN ─── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        
        {/* Top Header & Utilities Bar */}
        <header className="h-16 border-b border-[#E5E5DD] dark:border-[#2B332E] bg-white/95 dark:bg-[#1C211E]/95 backdrop-blur-md px-4 md:px-6 flex items-center justify-between gap-3 shrink-0">
          
          {/* Left: Mobile trigger & Scrambled Branding Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 rounded-lg border border-[#E5E5DD] dark:border-[#2B332E] md:hidden cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="flex flex-col min-w-0">
              <ScrambledTitle className="font-display font-bold text-sm tracking-wider uppercase text-[#252923] dark:text-[#E5E9E4] truncate" />
              <span className="text-[10px] text-[#777B70] dark:text-[#8F998E] font-mono truncate">
                L1 Standoff &middot; Geostationary Orbit 6.6 Re Boundary
              </span>
            </div>
          </div>

          {/* Center: Planetary Storm Presets */}
          <div className="hidden lg:flex items-center gap-1.5 p-1 bg-[#F6F5F0] dark:bg-[#232A26] border border-[#E5E5DD] dark:border-[#2B332E] rounded-lg">
            <span className="text-[10px] font-semibold text-[#777B70] dark:text-[#8F998E] uppercase tracking-wider px-2">
              Storm Profiles:
            </span>
            <button 
              onClick={() => loadScenario('calm')}
              className="px-2.5 py-1 rounded text-xs font-medium text-[#252923] dark:text-[#E5E9E4] hover:bg-white dark:hover:bg-[#1C211E] transition-colors cursor-pointer"
            >
              Calm Baseline
            </button>
            <button 
              onClick={() => loadScenario('cme_shock')}
              className="px-2.5 py-1 rounded text-xs font-medium text-[#A88B62] dark:text-[#C4A57B] hover:bg-white dark:hover:bg-[#1C211E] transition-colors cursor-pointer"
            >
              CME Shock
            </button>
            <button 
              onClick={() => loadScenario('halloween')}
              className="px-2.5 py-1 rounded text-xs font-medium text-[#B94A48] hover:bg-white dark:hover:bg-[#1C211E] transition-colors cursor-pointer"
            >
              Historic Flare
            </button>
          </div>

          {/* Right Utilities: Spacecraft Selector, View Switcher, Theme Toggle */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Spacecraft Selector */}
            <div className="hidden sm:flex items-center gap-1.5 bg-[#F6F5F0] dark:bg-[#232A26] border border-[#E5E5DD] dark:border-[#2B332E] px-2.5 py-1 rounded-lg text-xs">
              <Radio className="h-3.5 w-3.5 text-[#A88B62]" />
              <select
                value={selectedSatelliteId}
                onChange={(e) => {
                  setSelectedSatelliteId(e.target.value);
                  addLog(`Selected spacecraft node changed to ${e.target.value.toUpperCase()}`);
                }}
                className="bg-transparent text-xs font-semibold text-[#252923] dark:text-[#E5E9E4] outline-none cursor-pointer"
              >
                <option value="gsat-31">GSAT-31 (83.0°E)</option>
                <option value="gsat-30">GSAT-30 (55.0°E)</option>
                <option value="goes-16">GOES-16 (285°W)</option>
              </select>
            </div>

            {/* Boundary Standoff Badge */}
            <div className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono ${
              isMagnetopauseCompressed 
                ? 'bg-[#B94A48]/10 text-[#B94A48] border-[#B94A48]/30 font-semibold' 
                : 'bg-[#437A5B]/10 text-[#437A5B] border-[#437A5B]/30'
            }`}>
              <span>r₀: {currentRe0.toFixed(2)} Re</span>
              <span>·</span>
              <span>{isMagnetopauseCompressed ? 'EXCURSION' : 'SECURE'}</span>
            </div>

            {/* View Mode Toggle: Dashboard vs 3D Window Deck */}
            <div className="flex items-center p-1 bg-[#F6F5F0] dark:bg-[#232A26] border border-[#E5E5DD] dark:border-[#2B332E] rounded-lg">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'dashboard' 
                    ? 'bg-white dark:bg-[#1C211E] text-[#252923] dark:text-white shadow-sm' 
                    : 'text-[#777B70] dark:text-[#8F998E]'
                }`}
                title="Structured Dashboard Grid"
              >
                Dashboard
              </button>
              <button
                onClick={() => setViewMode('windowWorkspace')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'windowWorkspace' 
                    ? 'bg-white dark:bg-[#1C211E] text-[#252923] dark:text-white shadow-sm' 
                    : 'text-[#777B70] dark:text-[#8F998E]'
                }`}
                title="Interactive Window Deck"
              >
                Window Deck
              </button>
            </div>

            {/* Theme Switcher */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg border border-[#E5E5DD] dark:border-[#2B332E] bg-white dark:bg-[#1C211E] text-[#777B70] dark:text-[#8F998E] hover:text-[#252923] dark:hover:text-white transition-colors cursor-pointer"
              title={isDarkMode ? "Switch to Observatory Light theme" : "Switch to Deep Space Night theme"}
              aria-label="Toggle color theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* ─── WORKSPACE CONTENT AREA ─── */}
        <main className="flex-1 overflow-y-auto relative p-4 md:p-6 custom-scrollbar">
          
          {viewMode === 'windowWorkspace' ? (
            /* 3D WINDOW DECK VIEW */
            <div className="h-full relative overflow-hidden flex items-center justify-center">
              <WindowWorkspace
                windowOrder={windowOrder.filter(id => openWindows[id as keyof typeof openWindows])}
                activeWindow={activeWindow}
                renderWindow={renderWindowContent}
              />
            </div>
          ) : (
            /* STRUCTURED OBSERVATORY DASHBOARD VIEW */
            <div className="max-w-7xl mx-auto flex flex-col gap-6">

              {activeModule === 'overview' && (
                <>
                  {/* Top Critical Status Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3 rounded-xl border border-[#E5E5DD] dark:border-[#2B332E] bg-white dark:bg-[#1C211E] shadow-sm">
                      <div className="text-[10px] text-[#777B70] dark:text-[#8F998E] font-medium">Solar Wind Vsw</div>
                      <div className="text-lg font-mono font-bold text-[#A88B62] dark:text-[#C4A57B] mt-0.5">
                        {Vsw.toFixed(0)} <span className="text-xs font-normal text-[#777B70]">km/s</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-[#E5E5DD] dark:border-[#2B332E] bg-white dark:bg-[#1C211E] shadow-sm">
                      <div className="text-[10px] text-[#777B70] dark:text-[#8F998E] font-medium">IMF Polarity Bz</div>
                      <div className={`text-lg font-mono font-bold mt-0.5 ${Bz < 0 ? 'text-[#B94A48]' : 'text-[#437A5B]'}`}>
                        {Bz > 0 ? '+' : ''}{Bz.toFixed(1)} <span className="text-xs font-normal text-[#777B70]">nT</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-[#E5E5DD] dark:border-[#2B332E] bg-white dark:bg-[#1C211E] shadow-sm">
                      <div className="text-[10px] text-[#777B70] dark:text-[#8F998E] font-medium">Plasma Density Nsw</div>
                      <div className="text-lg font-mono font-bold text-[#35473C] dark:text-[#A8B3A0] mt-0.5">
                        {Nsw.toFixed(1)} <span className="text-xs font-normal text-[#777B70]">cm⁻³</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-[#E5E5DD] dark:border-[#2B332E] bg-white dark:bg-[#1C211E] shadow-sm">
                      <div className="text-[10px] text-[#777B70] dark:text-[#8F998E] font-medium">Dynamic Pressure</div>
                      <div className="text-lg font-mono font-bold text-[#252923] dark:text-[#E5E9E4] mt-0.5">
                        {currentP_dyn.toFixed(2)} <span className="text-xs font-normal text-[#777B70]">nPa</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-[#E5E5DD] dark:border-[#2B332E] bg-white dark:bg-[#1C211E] shadow-sm">
                      <div className="text-[10px] text-[#777B70] dark:text-[#8F998E] font-medium">Kp Disturbance</div>
                      <div className="text-lg font-mono font-bold text-[#252923] dark:text-[#E5E9E4] mt-0.5">
                        Kp {currentKp} <span className="text-xs font-normal text-[#777B70]">/ 9</span>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border shadow-sm ${
                      isMagnetopauseCompressed 
                        ? 'border-[#B94A48]/30 bg-[#B94A48]/10' 
                        : 'border-[#437A5B]/30 bg-[#437A5B]/10'
                    }`}>
                      <div className="text-[10px] opacity-80 font-medium">Standoff r₀ (GEO: 6.6)</div>
                      <div className={`text-lg font-mono font-bold mt-0.5 ${
                        isMagnetopauseCompressed ? 'text-[#B94A48]' : 'text-[#437A5B]'
                      }`}>
                        {currentRe0.toFixed(2)} <span className="text-xs font-normal">Re</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 1: Solar Wind Feed Controls & Bow Shock Visualizer */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-5 rounded-2xl shadow-sm flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-[#E5E5DD] dark:border-[#2B332E] pb-3">
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal className="h-4 w-4 text-[#A88B62]" />
                          <h2 className="font-semibold text-sm">Solar Wind Stream Drivers</h2>
                        </div>
                        <span className="text-[10px] text-[#777B70] dark:text-[#8F998E]">L1 Lagrangian Point</span>
                      </div>
                      <TelemetryFeedContent />
                    </div>

                    <div className="lg:col-span-7 bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-5 rounded-2xl shadow-sm flex flex-col gap-3 min-h-[420px]">
                      <div className="flex items-center justify-between border-b border-[#E5E5DD] dark:border-[#2B332E] pb-3">
                        <div className="flex items-center gap-2">
                          <Compass className="h-4 w-4 text-[#35473C] dark:text-[#A8B3A0]" />
                          <h2 className="font-semibold text-sm">Magnetosphere Bow Shock & Satellites</h2>
                        </div>
                        <span className="text-[10px] text-[#777B70] dark:text-[#8F998E]">2D MHD + 3D Earth Orbit</span>
                      </div>
                      <div className="flex-1 min-h-[350px]">
                        <MagnetosphereView 
                          Bz={Bz} 
                          Nsw={Nsw} 
                          Vsw={Vsw} 
                          selectedSatelliteLong={selectedSatelliteId === 'gsat-31' ? 83.0 : (selectedSatelliteId === 'gsat-30' ? 55.0 : 285.0)} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Predictive Trajectories & Spacecraft Charging Anomaly Monitor */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7 bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-5 rounded-2xl shadow-sm flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-[#E5E5DD] dark:border-[#2B332E] pb-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-[#A88B62]" />
                          <h2 className="font-semibold text-sm">Relativistic Electron Flux Forecasts</h2>
                        </div>
                        <span className="text-[10px] text-[#777B70] dark:text-[#8F998E] font-mono">Horizon: +45m</span>
                      </div>
                      <ForecastCharts 
                        solarWindHistory={solarWindHistory} 
                        electronFluxHistory={electronFluxHistory} 
                        predictedFluxes={predictedFluxes} 
                        warningTime={45} 
                      />
                    </div>

                    <div className="lg:col-span-5 bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-5 rounded-2xl shadow-sm flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-[#E5E5DD] dark:border-[#2B332E] pb-3">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 text-[#35473C] dark:text-[#A8B3A0]" />
                          <h2 className="font-semibold text-sm">Spacecraft Charging Hazards</h2>
                        </div>
                        <span className="text-[10px] text-[#777B70] dark:text-[#8F998E]">Surface & Deep Dielectric</span>
                      </div>
                      <AnomalyMonitor 
                        currentFlux={electronFluxHistory[electronFluxHistory.length - 1]?.fluxGoes || 1200} 
                        r0={currentRe0} 
                        selectedSatelliteId={selectedSatelliteId} 
                        onSatelliteChanged={(id) => { 
                          setSelectedSatelliteId(id); 
                          addLog(`Context node switched to ${id.toUpperCase()}`); 
                        }} 
                      />
                    </div>
                  </div>

                  {/* Row 3: Alert Dispatch & Multivariate Risk Radar */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7 bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-5 rounded-2xl shadow-sm flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-[#E5E5DD] dark:border-[#2B332E] pb-3">
                        <div className="flex items-center gap-2">
                          <AlertOctagon className="h-4 w-4 text-[#B94A48]" />
                          <h2 className="font-semibold text-sm">Space Weather Alert & Dispatch Center</h2>
                        </div>
                        <span className="text-[10px] text-[#777B70] dark:text-[#8F998E]">Multi-Channel Network</span>
                      </div>
                      <AlertMonitorDashboard 
                        Vsw={Vsw} 
                        Bz={Bz} 
                        Nsw={Nsw} 
                        P_dyn={currentP_dyn} 
                        Kp={currentKp} 
                        r0={currentRe0} 
                        predicted30m={predicted30m} 
                        predicted6h={predicted6h} 
                        predicted12h={predicted12h} 
                        addLog={addLog} 
                        activeSatelliteName={activeSatName} 
                      />
                    </div>

                    <div className="lg:col-span-5 bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-5 rounded-2xl shadow-sm flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-[#E5E5DD] dark:border-[#2B332E] pb-3">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-[#A88B62]" />
                          <h2 className="font-semibold text-sm">Multivariate Risk Radar</h2>
                        </div>
                        <span className="text-[10px] text-[#777B70] dark:text-[#8F998E]">7-Axis Risk Profile</span>
                      </div>
                      <div className="min-h-[360px] flex-1">
                        <MultivariateRiskRadar 
                          currentSolarWind={solarWindHistory[solarWindHistory.length - 1] || null} 
                          currentElectronFlux={electronFluxHistory[electronFluxHistory.length - 1] || null}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 4: AI Space Weather Analyst & Console Logs */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7 bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-5 rounded-2xl shadow-sm flex flex-col gap-3">
                      <AIAnalystContent />
                    </div>

                    <div className="lg:col-span-5 bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-5 rounded-2xl shadow-sm flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-[#E5E5DD] dark:border-[#2B332E] pb-3">
                        <div className="flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-[#777B70]" />
                          <h2 className="font-semibold text-sm">Telemetry Console Diagnostics</h2>
                        </div>
                        <span className="text-[10px] text-[#777B70] font-mono">Stream: Live</span>
                      </div>
                      <TerminalConsoleContent />
                    </div>
                  </div>
                </>
              )}

              {/* Individual Dedicated Module Views */}
              {activeModule === 'simControl' && (
                <div className="bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-6 rounded-2xl shadow-sm flex flex-col gap-4">
                  <div className="border-b border-[#E5E5DD] dark:border-[#2B332E] pb-3">
                    <h2 className="font-semibold text-base">Solar Wind Telemetry Overrides & Inputs</h2>
                    <p className="text-xs text-[#777B70] dark:text-[#8F998E]">
                      Adjust interplanetary solar wind velocity, IMF polarity, and plasma concentration parameters.
                    </p>
                  </div>
                  <TelemetryFeedContent />
                </div>
              )}

              {activeModule === 'magnetosphere' && (
                <div className="bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-6 rounded-2xl shadow-sm flex flex-col gap-4 min-h-[580px]">
                  <div className="border-b border-[#E5E5DD] dark:border-[#2B332E] pb-3">
                    <h2 className="font-semibold text-base">Magnetosphere Bow Shock & Satellites</h2>
                    <p className="text-xs text-[#777B70] dark:text-[#8F998E]">
                      2D magnetopause bow shock deflection modeling paired with 3D Earth geostationary orbit tracking.
                    </p>
                  </div>
                  <div className="flex-1 min-h-[480px]">
                    <MagnetosphereView 
                      Bz={Bz} 
                      Nsw={Nsw} 
                      Vsw={Vsw} 
                      selectedSatelliteLong={selectedSatelliteId === 'gsat-31' ? 83.0 : (selectedSatelliteId === 'gsat-30' ? 55.0 : 285.0)} 
                    />
                  </div>
                </div>
              )}

              {activeModule === 'forecast' && (
                <div className="bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-6 rounded-2xl shadow-sm flex flex-col gap-4">
                  <div className="border-b border-[#E5E5DD] dark:border-[#2B332E] pb-3">
                    <h2 className="font-semibold text-base">Predictive Trajectories & Cross-Longitudinal Flux</h2>
                    <p className="text-xs text-[#777B70] dark:text-[#8F998E]">
                      Time-series forecasting comparing NOAA GOES-16 and ISRO GSAT GRASP with forward trajectory predictions.
                    </p>
                  </div>
                  <ForecastCharts 
                    solarWindHistory={solarWindHistory} 
                    electronFluxHistory={electronFluxHistory} 
                    predictedFluxes={predictedFluxes} 
                    warningTime={45} 
                  />
                </div>
              )}

              {activeModule === 'instruments' && (
                <div className="bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-6 rounded-2xl shadow-sm flex flex-col gap-4">
                  <div className="border-b border-[#E5E5DD] dark:border-[#2B332E] pb-3">
                    <h2 className="font-semibold text-base">Spacecraft Charging & Anomaly Diagnostics</h2>
                    <p className="text-xs text-[#777B70] dark:text-[#8F998E]">
                      Real-time calculations of surface electrostatic voltage (-V) and deep-dielectric current ingress (pA/cm²).
                    </p>
                  </div>
                  <AnomalyMonitor 
                    currentFlux={electronFluxHistory[electronFluxHistory.length - 1]?.fluxGoes || 1200} 
                    r0={currentRe0} 
                    selectedSatelliteId={selectedSatelliteId} 
                    onSatelliteChanged={(id) => { 
                      setSelectedSatelliteId(id); 
                      addLog(`Context node switched to ${id.toUpperCase()}`); 
                    }} 
                  />
                </div>
              )}

              {activeModule === 'alertsDashboard' && (
                <div className="bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-6 rounded-2xl shadow-sm flex flex-col gap-4">
                  <div className="border-b border-[#E5E5DD] dark:border-[#2B332E] pb-3">
                    <h2 className="font-semibold text-base">Astromagnetic Alert & Dispatch Center</h2>
                    <p className="text-xs text-[#777B70] dark:text-[#8F998E]">
                      Automated multi-channel notifications (SMS, Email, Webhook) triggered upon magnetopause compression.
                    </p>
                  </div>
                  <AlertMonitorDashboard 
                    Vsw={Vsw} 
                    Bz={Bz} 
                    Nsw={Nsw} 
                    P_dyn={currentP_dyn} 
                    Kp={currentKp} 
                    r0={currentRe0} 
                    predicted30m={predicted30m} 
                    predicted6h={predicted6h} 
                    predicted12h={predicted12h} 
                    addLog={addLog} 
                    activeSatelliteName={activeSatName} 
                  />
                </div>
              )}

              {activeModule === 'riskRadar' && (
                <div className="bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-6 rounded-2xl shadow-sm flex flex-col gap-4 min-h-[500px]">
                  <div className="border-b border-[#E5E5DD] dark:border-[#2B332E] pb-3">
                    <h2 className="font-semibold text-base">Multivariate Risk Radar</h2>
                    <p className="text-xs text-[#777B70] dark:text-[#8F998E]">
                      Integrated assessment evaluating solar wind velocity, polarity, density, pressure, and particle flux.
                    </p>
                  </div>
                  <div className="flex-1 min-h-[420px]">
                    <MultivariateRiskRadar 
                      currentSolarWind={solarWindHistory[solarWindHistory.length - 1] || null} 
                      currentElectronFlux={electronFluxHistory[electronFluxHistory.length - 1] || null}
                    />
                  </div>
                </div>
              )}

              {activeModule === 'cdfIngest' && (
                <div className="bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-6 rounded-2xl shadow-sm flex flex-col gap-4">
                  <div className="border-b border-[#E5E5DD] dark:border-[#2B332E] pb-3">
                    <h2 className="font-semibold text-base">Common Data Format (.cdf) Ingestion Pipeline</h2>
                    <p className="text-xs text-[#777B70] dark:text-[#8F998E]">
                      Upload, inspect, despike, and interpolate gaps in NASA CDAWeb and NOAA scientific telemetry files.
                    </p>
                  </div>
                  <CDFProcessor 
                    onDataIngested={(raw, cleaned) => { 
                      addLog('CDF payload ingested. Calibrating historical timelines...'); 
                      const incomingSWHistory = generateCMEStormTimeline(12); 
                      setSolarWindHistory(incomingSWHistory); 
                      const newFluxHistory = incomingSWHistory.map((d, index) => { 
                        const cleanedVal = cleaned[index % cleaned.length] || 1500; 
                        return { time: d.time, fluxGoes: cleanedVal, fluxGrasp: cleanedVal * 0.8 }; 
                      }); 
                      setElectronFluxHistory(newFluxHistory); 
                      addLog('Despiking and gap interpolation loaded successfully.'); 
                    }} 
                  />
                </div>
              )}

              {activeModule === 'modelRegistry' && (
                <div className="bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-6 rounded-2xl shadow-sm flex flex-col gap-4">
                  <div className="border-b border-[#E5E5DD] dark:border-[#2B332E] pb-3">
                    <h2 className="font-semibold text-base">AI/ML Model Topology Registry</h2>
                    <p className="text-xs text-[#777B70] dark:text-[#8F998E]">
                      Select, tune, and test deep recurrent networks, PINNs, and empirical Fokker-Planck algorithms.
                    </p>
                  </div>
                  <ModelDeveloperPanel 
                    activeModelId={activeModelId} 
                    onModelsChanged={() => { 
                      const active = modelRegistry.getActiveModel(); 
                      setActiveModelId(active.id); 
                      addLog(`Model architecture changed to: ${active.name}`); 
                    }} 
                  />
                </div>
              )}

              {activeModule === 'aiAnalyst' && (
                <div className="bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-6 rounded-2xl shadow-sm flex flex-col gap-4">
                  <div className="border-b border-[#E5E5DD] dark:border-[#2B332E] pb-3">
                    <h2 className="font-semibold text-base">Physics Analyst Intelligence (Gemini)</h2>
                    <p className="text-xs text-[#777B70] dark:text-[#8F998E]">
                      Real-time generative physics synthesis explaining magnetopause compression, chorus wave growth, and mitigation.
                    </p>
                  </div>
                  <AIAnalystContent />
                </div>
              )}

              {activeModule === 'systemLogs' && (
                <div className="bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] p-6 rounded-2xl shadow-sm flex flex-col gap-4">
                  <div className="border-b border-[#E5E5DD] dark:border-[#2B332E] pb-3">
                    <h2 className="font-semibold text-base">Telemetry Console & System Diagnostics</h2>
                    <p className="text-xs text-[#777B70] dark:text-[#8F998E]">
                      Continuous diagnostic event stream recording telemetry synchronization, parameter shifts, and alerts.
                    </p>
                  </div>
                  <TerminalConsoleContent />
                </div>
              )}

            </div>
          )}
        </main>

        {/* ─── WORKSPACE STATUS FOOTER ─── */}
        <footer className="h-9 border-t border-[#E5E5DD] dark:border-[#2B332E] bg-white/95 dark:bg-[#1C211E]/95 backdrop-blur-md px-4 flex items-center justify-between text-[11px] text-[#777B70] dark:text-[#8F998E] shrink-0 font-mono">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-[#252923] dark:text-[#E5E9E4]">ORION OBSERVATORY</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">Active Slot: <strong className="text-[#A88B62]">83.0° E GEO</strong></span>
            <span className="hidden sm:inline">·</span>
            <span>Model: <strong className="text-[#35473C] dark:text-[#A8B3A0]">{modelRegistry.getActiveModel().name}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#437A5B] animate-pulse" />
              <span>Telemetry: Live</span>
            </span>
            <span>·</span>
            <span className="text-[10px] uppercase">UTC Synced</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
