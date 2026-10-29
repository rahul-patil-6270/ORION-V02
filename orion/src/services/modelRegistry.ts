/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MLModel, SolarWindData } from '../types';

class ModelRegistry {
  private models: MLModel[] = [
    {
      id: 'pinn-fokker-planck',
      name: 'PINN Fokker-Planck Neural Operator',
      type: 'physics_informed_nn',
      developer: 'Space Physics Laboratory (SPL) Physics AI Group',
      version: '2.4.0',
      accuracyMetrics: {
        rmse: 0.082,
        correlation: 0.964,
        nse: 0.925,
      },
      hyperparameters: {
        epochs: 350,
        neurons: 128,
        lookbackSteps: 72,
        optimizer: 'AdamW',
        lossFunction: 'MSE + FokkerPlanckResidualLoss',
      },
      features: ['Vsw', 'Bz', 'Nsw', 'P_dyn', 'Kp', 'StandoffDistance_Re'],
    },
    {
      id: 'bilstm-attention',
      name: 'Bi-LSTM Temporal Attention Network',
      type: 'lstm_timeseries',
      developer: 'VSSC Satellite Systems Group',
      version: '1.8.2',
      accuracyMetrics: {
        rmse: 0.114,
        correlation: 0.938,
        nse: 0.881,
      },
      hyperparameters: {
        epochs: 200,
        neurons: 96,
        lookbackSteps: 48,
        optimizer: 'Adam',
        lossFunction: 'MSE',
      },
      features: ['Vsw', 'Bz', 'Nsw', 'Kp'],
    },
    {
      id: 'spatio-temporal-transformer',
      name: 'Spatio-Temporal GEO Transformer',
      type: 'transformer',
      developer: 'Applied Deep Learning Lab / ISRO',
      version: '1.2.0',
      accuracyMetrics: {
        rmse: 0.095,
        correlation: 0.952,
        nse: 0.908,
      },
      hyperparameters: {
        epochs: 280,
        neurons: 256,
        lookbackSteps: 96,
        optimizer: 'AdamW',
        lossFunction: 'SmoothL1Loss',
      },
      features: ['Vsw', 'Bz', 'Nsw', 'P_dyn', 'Kp'],
    },
  ];

  private activeModelId: string = 'pinn-fokker-planck';

  getModels(): MLModel[] {
    return [...this.models];
  }

  getActiveModel(): MLModel {
    return this.models.find((m) => m.id === this.activeModelId) || this.models[0];
  }

  setActiveModel(id: string): void {
    if (this.models.some((m) => m.id === id)) {
      this.activeModelId = id;
    }
  }

  registerModel(model: Omit<MLModel, 'id'>): void {
    const id = `custom-model-${Date.now()}`;
    this.models.push({
      ...model,
      id,
    });
    this.activeModelId = id;
  }

  generateForecast(
    modelId: string,
    latestFlux: number,
    solarWindHistory: SolarWindData[],
    hoursAhead = 12
  ): { times: string[]; predictions: number[] } {
    const model = this.models.find((m) => m.id === modelId) || this.getActiveModel();
    const latestSw = solarWindHistory[solarWindHistory.length - 1] || {
      Vsw: 420,
      Bz: 1.0,
      Nsw: 5.0,
      P_dyn: 1.5,
      Kp: 2,
    };

    const steps = 72; // grid over forecast horizon
    const stepMinutes = (hoursAhead * 60) / steps;
    const now = Date.now();

    const times: string[] = [];
    const predictions: number[] = [];

    let current = latestFlux;
    const modelWeight = model.type === 'physics_informed_nn' ? 1.05 : model.type === 'transformer' ? 1.03 : 1.0;

    for (let i = 1; i <= steps; i++) {
      const forecastTime = new Date(now + i * stepMinutes * 60 * 1000).toISOString();
      times.push(forecastTime);

      // Trajectory responds to ongoing solar wind state
      const drift = latestSw.Bz < 0 
        ? Math.exp(Math.min(1.5, (latestSw.Vsw / 600) * 0.15)) 
        : 0.99;
      
      const stepFactor = 1 + (drift - 1) * (i / steps) * modelWeight;
      const noise = (Math.sin(i / 4) * 0.05 + (Math.random() - 0.5) * 0.02);

      current = Math.max(50, current * (1 + (stepFactor - 1) * 0.08 + noise));
      predictions.push(Math.round(current));
    }

    return { times, predictions };
  }
}

export const modelRegistry = new ModelRegistry();
