/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SolarWindData {
  time: string;
  Vsw: number;
  Bz: number;
  Nsw: number;
  P_dyn: number;
  Kp: number;
}

export interface ElectronFluxData {
  time: string;
  fluxGoes: number;
  fluxGrasp: number;
}

export interface SatelliteState {
  id: string;
  name: string;
  longitude: number;
  role: string;
  surfaceChargingVolt: number;
  deepDielectricCurrent: number;
  status: 'SAFE' | 'WARNING' | 'ANOMALOUS';
  instrumentStatus: {
    payload: string;
    status: 'ONLINE' | 'DEGRADED' | 'STANDBY';
  };
}

export interface CDFFileRecord {
  fileName: string;
  fileSize: string;
  durationDays: number;
  timestepsCount: number;
  parameters: string[];
  uploadedAt: string;
}

export type ModelType = 'lstm_timeseries' | 'transformer' | 'physics_informed_nn';

export interface MLModel {
  id: string;
  name: string;
  type: ModelType;
  developer: string;
  version: string;
  accuracyMetrics: {
    rmse: number;
    correlation: number;
    nse: number;
  };
  hyperparameters: {
    epochs: number;
    neurons: number;
    lookbackSteps: number;
    optimizer: string;
    lossFunction: string;
  };
  features: string[];
}
