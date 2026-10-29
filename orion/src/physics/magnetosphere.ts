/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SolarWindData } from '../types';

/**
 * Calculates solar wind dynamic pressure in nanoPascals (nPa)
 * P_dyn = 1.6726e-6 * Nsw * Vsw^2
 */
export function calculateDynamicPressure(Nsw: number, Vsw: number): number {
  return 1.6726e-6 * Nsw * Math.pow(Vsw, 2);
}

/**
 * Calculates the subsolar magnetopause standoff distance (in Earth Radii, Re)
 * based on Shue et al. (1998) empirical bow shock / magnetopause modeling.
 * r0 = (10.22 + 1.29 * tanh(0.184 * (Bz + 8.14))) * (P_dyn)^(-1/6.6)
 */
export function calculateMagnetopauseRe(Bz: number, P_dyn: number): number {
  const safePdyn = Math.max(0.1, P_dyn);
  const r0 = (10.22 + 1.29 * Math.tanh(0.184 * (Bz + 8.14))) * Math.pow(safePdyn, -1 / 6.6);
  return Math.max(3.5, Math.min(18.0, r0));
}

/**
 * Estimates planetary Kp index (0 to 9) based on solar wind speed and southward IMF Bz.
 */
export function estimateKpIndex(Vsw: number, Bz: number): number {
  // Negative Bz drives magnetic reconnection
  const bzContribution = Math.max(0, -Bz) * 0.28;
  const vswContribution = Math.max(0, Vsw - 320) / 110;
  const rawKp = Math.round(bzContribution + vswContribution);
  return Math.max(0, Math.min(9, rawKp));
}

/**
 * Simulates dynamical physical relativistic electron flux response (>2 MeV)
 * conforming to solar wind energy transfer, chorus wave acceleration, and magnetopause shadowing losses.
 */
export function simulateElectronFluxResponse(
  currentFlux: number,
  Vsw: number,
  Bz: number,
  Nsw: number,
  _dt = 10
): number {
  const P_dyn = calculateDynamicPressure(Nsw, Vsw);
  const r0 = calculateMagnetopauseRe(Bz, P_dyn);

  let flux = currentFlux;

  // Magnetopause shadowing loss: if magnetosphere compresses past GEO (6.6 Re), particles escape
  if (r0 < 6.6) {
    const lossFactor = 0.88 - ((6.6 - r0) / 6.6) * 0.15;
    flux = flux * lossFactor;
  } else {
    // Chorus wave growth and electron acceleration driven by high solar wind velocity and southward Bz
    if (Vsw > 450 && Bz < 0) {
      const growthRate = 1.0 + (Vsw / 1000) * 0.08 + Math.abs(Bz) * 0.02;
      flux = flux * growthRate;
    } else if (Vsw < 400 && Bz > 0) {
      // Quiet decay towards background levels (~800 - 1500 p/cm^2-s-sr)
      flux = flux * 0.96 + 50;
    }
  }

  // Realistic bounds [10, 2,000,000]
  const jitter = (Math.random() - 0.5) * (flux * 0.03);
  return Math.max(10, Math.min(2500000, flux + jitter));
}

/**
 * Generates historical solar wind parameter timeline (Vsw, Bz, Nsw, P_dyn, Kp)
 */
export function generateCMEStormTimeline(hoursCount = 12): SolarWindData[] {
  const result: SolarWindData[] = [];
  const now = Date.now();
  const stepMs = (hoursCount * 3600 * 1000) / 72; // 72 data points over period

  let currentVsw = 390;
  let currentBz = 2.5;
  let currentNsw = 4.8;

  for (let i = 0; i < 72; i++) {
    const time = new Date(now - (72 - i) * stepMs).toISOString();

    // CME shock ramp up at step 40-55
    if (i >= 38 && i <= 52) {
      currentVsw = Math.min(850, currentVsw + 28);
      currentBz = Math.max(-14.5, currentBz - 1.2);
      currentNsw = Math.min(38, currentNsw + 2.1);
    } else if (i > 52) {
      // Gradual recovery
      currentVsw = Math.max(420, currentVsw - 12);
      currentBz = Math.min(1.5, currentBz + 0.6);
      currentNsw = Math.max(5.0, currentNsw - 1.4);
    } else {
      currentVsw += (Math.random() - 0.5) * 8;
      currentBz += (Math.random() - 0.5) * 0.8;
      currentNsw += (Math.random() - 0.5) * 0.4;
    }

    const P_dyn = calculateDynamicPressure(currentNsw, currentVsw);
    const Kp = estimateKpIndex(currentVsw, currentBz);

    result.push({
      time,
      Vsw: parseFloat(currentVsw.toFixed(1)),
      Bz: parseFloat(currentBz.toFixed(1)),
      Nsw: parseFloat(currentNsw.toFixed(1)),
      P_dyn: parseFloat(P_dyn.toFixed(2)),
      Kp,
    });
  }

  return result;
}

/**
 * Despiking filter for CDF satellite telemetry
 * Uses running median and variance window to identify and remove artificial instrument spikes.
 */
export function despikeData(rawFlux: number[]): number[] {
  const cleaned: number[] = [...rawFlux];
  for (let i = 1; i < cleaned.length - 1; i++) {
    const prev = cleaned[i - 1];
    const curr = cleaned[i];
    const next = cleaned[i + 1];

    if (prev > 0 && next > 0) {
      const avgNeighbors = (prev + next) / 2;
      // If current value is more than 5x or less than 0.15x of neighbor average, replace with average
      if (curr > avgNeighbors * 5 || curr < avgNeighbors * 0.15) {
        cleaned[i] = avgNeighbors;
      }
    }
  }
  return cleaned;
}

/**
 * Interpolates missing data gaps (zero, null, or NaN) using linear interpolation.
 */
export function interpolateGaps(cleanedFlux: number[]): number[] {
  const result = [...cleanedFlux];
  for (let i = 0; i < result.length; i++) {
    if (result[i] === 0 || isNaN(result[i]) || result[i] === null) {
      // Find previous valid
      let prevVal = 1000;
      for (let p = i - 1; p >= 0; p--) {
        if (result[p] > 0) {
          prevVal = result[p];
          break;
        }
      }
      // Find next valid
      let nextVal = prevVal;
      for (let n = i + 1; n < result.length; n++) {
        if (result[n] > 0) {
          nextVal = result[n];
          break;
        }
      }
      result[i] = (prevVal + nextVal) / 2;
    }
  }
  return result;
}
