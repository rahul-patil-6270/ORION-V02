/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Upload, FileCode, CheckCircle2, RefreshCw, Sparkles, Database } from 'lucide-react';
import { despikeData, interpolateGaps } from '../physics/magnetosphere';
import { CDFFileRecord } from '../types';

interface CDFProcessorProps {
  onDataIngested: (rawFlux: number[], cleanedFlux: number[]) => void;
}

export default function CDFProcessor({ onDataIngested }: CDFProcessorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [activeFiles, setActiveFiles] = useState<CDFFileRecord[]>([
    {
      fileName: 'goes16_flux_2mev_2026.cdf',
      fileSize: '14.8 MB',
      durationDays: 365,
      timestepsCount: 52560,
      parameters: ['L_avg', 'Electron_Flux_2MeV', 'Satellite_Position_GEO'],
      uploadedAt: 'System Preserved',
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStats, setProcessingStats] = useState<{
    spikesRemoved: number;
    gapsInterpolated: number;
    varianceReduction: string;
  } | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Simulate drop processing of CDF schemas
    const files = Array.from(e.dataTransfer.files) as File[];
    const cdfFiles = files.filter(f => f.name.endsWith('.cdf') || f.name.endsWith('.fits') || f.name.endsWith('.json'));

    if (cdfFiles.length === 0) {
      alert('Error: Please provide NASA CDAWeb, NOAA, or ISRO .cdf format telemetry files.');
      return;
    }

    const newRecords: CDFFileRecord[] = cdfFiles.map(f => ({
      fileName: f.name,
      fileSize: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      durationDays: 30,
      timestepsCount: 4320,
      parameters: ['IMF_Bz', 'SolarWind_Speed', 'Proton_Density'],
      uploadedAt: new Date().toLocaleTimeString(),
    }));

    setActiveFiles(prev => [...newRecords, ...prev]);
    simulatePreprocessing(newRecords[0].fileName);
  };

  const simulatePreprocessing = (name: string) => {
    setIsProcessing(true);
    setProcessingStats(null);

    setTimeout(() => {
      // Create artificial raw flux timeline with severe spikes and null gaps
      const rawFlux: number[] = [];
      let current = 2500;

      for (let i = 0; i < 48; i++) {
        // Base physics walk
        current = current * (0.95 + Math.random() * 0.1);
        current = Math.max(10, Math.min(1000000, current));
        
        let fluxValue = current;

        // Introduce artificial high voltage sensor spikes (noise spikes)
        if (i === 12) fluxValue = current * 22;
        if (i === 35) fluxValue = current / 15;
        
        // Introduce gaps (represented by NaN or zero)
        if (i >= 22 && i <= 24) fluxValue = 0;

        rawFlux.push(fluxValue);
      }

      // Run real physics filtering algorithms
      const cleanedFromSpikes = despikeData(rawFlux);
      const fullyInterpolatedClean = interpolateGaps(cleanedFromSpikes);

      setIsProcessing(false);
      setProcessingStats({
        spikesRemoved: 2,
        gapsInterpolated: 3,
        varianceReduction: '42.3%',
      });

      // Transmit to host workspace
      onDataIngested(rawFlux, fullyInterpolatedClean);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-4 h-full font-sans text-xs text-[#252923] dark:text-[#E5E9E4]">
      
      {/* File Dropper Target */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          isDragging 
            ? 'border-[#A88B62] bg-[#A88B62]/10' 
            : 'border-[#E5E5DD] dark:border-[#2B332E] bg-[#F6F5F0] dark:bg-[#232A26] hover:border-[#A88B62]/60'
        }`}
      >
        <Upload className="h-8 w-8 mb-2 text-[#A88B62] dark:text-[#C4A57B]" />
        <p className="font-semibold text-sm mb-1 text-[#252923] dark:text-[#E5E9E4]">Ingest Common Data Format (.cdf) Files</p>
        <p className="text-[11px] text-[#777B70] dark:text-[#8F998E] mb-3">Accepts NASA CDAWeb, NOAA SEISS, and GRASP instrument archives</p>
        
        <button
          onClick={() => simulatePreprocessing('goes16_flux_2mev_2026.cdf')}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#35473C] text-white hover:bg-[#27352D] disabled:opacity-50 transition-colors text-xs font-medium cursor-pointer shadow-sm"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Despiking & Cleaning Gaps...</span>
            </>
          ) : (
            <>
              <Database className="h-3.5 w-3.5" />
              <span>Run Sample Ingest Pipeline</span>
            </>
          )}
        </button>
      </div>

      {/* Preprocessing Diagnostics details */}
      {processingStats && (
        <div className="rounded-xl border border-[#437A5B]/30 bg-[#437A5B]/10 p-3.5 flex flex-col gap-2 text-[#437A5B]">
          <div className="flex items-center gap-1.5 font-semibold text-xs">
            <CheckCircle2 className="h-4 w-4" />
            <span>Ingestion & Despiking Completed Successfully</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-white dark:bg-[#1C211E] p-2 rounded-lg border border-[#E5E5DD] dark:border-[#2B332E]">
              <div className="text-[10px] text-[#777B70] dark:text-[#8F998E]">Spikes Removed</div>
              <div className="font-mono font-bold text-sm text-[#252923] dark:text-[#E5E9E4]">{processingStats.spikesRemoved}</div>
            </div>
            <div className="bg-white dark:bg-[#1C211E] p-2 rounded-lg border border-[#E5E5DD] dark:border-[#2B332E]">
              <div className="text-[10px] text-[#777B70] dark:text-[#8F998E]">Gaps Interpolated</div>
              <div className="font-mono font-bold text-sm text-[#252923] dark:text-[#E5E9E4]">{processingStats.gapsInterpolated} epochs</div>
            </div>
            <div className="bg-white dark:bg-[#1C211E] p-2 rounded-lg border border-[#E5E5DD] dark:border-[#2B332E]">
              <div className="text-[10px] text-[#777B70] dark:text-[#8F998E]">Noise Variance Reduction</div>
              <div className="font-mono font-bold text-sm text-[#35473C] dark:text-[#A8B3A0]">{processingStats.varianceReduction}</div>
            </div>
          </div>
        </div>
      )}

      {/* File Queue Manager */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] text-[#777B70] dark:text-[#8F998E]">
          <span className="font-semibold uppercase tracking-wider text-[10px]">Archived CDF Vault</span>
          <span>{activeFiles.length} Ingested Datasets</span>
        </div>
        <div className="flex flex-col gap-1.5 max-h-[140px] overflow-auto">
          {activeFiles.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E]">
              <div className="flex items-center gap-2.5">
                <FileCode className="h-4 w-4 text-[#A88B62] dark:text-[#C4A57B]" />
                <div>
                  <div className="font-mono text-xs font-semibold text-[#252923] dark:text-[#E5E9E4]">{file.fileName}</div>
                  <div className="text-[10px] text-[#777B70] dark:text-[#8F998E]">
                    {file.fileSize} · {file.timestepsCount.toLocaleString()} steps · {file.durationDays}d span
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-[#777B70] dark:text-[#8F998E] font-mono">
                {file.uploadedAt}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
