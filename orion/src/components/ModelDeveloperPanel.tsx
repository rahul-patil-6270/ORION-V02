/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MLModel, ModelType } from '../types';
import { modelRegistry } from '../services/modelRegistry';
import { Code2, GitMerge, Check, Sliders, Plus, BookOpen, Layers } from 'lucide-react';

interface ModelDeveloperPanelProps {
  onModelsChanged: () => void;
  activeModelId: string;
}

export default function ModelDeveloperPanel({
  onModelsChanged,
  activeModelId,
}: ModelDeveloperPanelProps) {
  const [models, setModels] = useState<MLModel[]>(modelRegistry.getModels());
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form fields for registering a new custom ML model
  const [newName, setNewName] = useState('GRU AutoEncoder FluxPredictor');
  const [newType, setNewType] = useState<ModelType>('lstm_timeseries');
  const [newDeveloper, setNewDeveloper] = useState('Space Physics Division');
  const [newVersion, setNewVersion] = useState('1.0.0-Release');
  const [newEpochs, setNewEpochs] = useState(100);
  const [newNeurons, setNewNeurons] = useState(64);
  const [newFeatures, setNewFeatures] = useState<string[]>(['Vsw', 'Bz', 'Nsw']);

  const handleSelectModel = (id: string) => {
    modelRegistry.setActiveModel(id);
    onModelsChanged();
  };

  const handleRegisterNewModel = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate highly realistic accuracy metrics based on simulated science variance
    const scaleFactor = newFeatures.length * (newNeurons / 128);
    const correlation = Math.min(0.99, 0.75 + scaleFactor * 0.15);
    const rmse = Math.max(0.04, 0.3 - scaleFactor * 0.12);
    const nse = Math.min(0.98, 0.5 + scaleFactor * 0.25);

    modelRegistry.registerModel({
      name: newName,
      type: newType,
      developer: newDeveloper,
      version: newVersion,
      accuracyMetrics: {
        rmse: parseFloat(rmse.toFixed(3)),
        correlation: parseFloat(correlation.toFixed(3)),
        nse: parseFloat(nse.toFixed(3)),
      },
      hyperparameters: {
        epochs: newEpochs,
        neurons: newNeurons,
        lookbackSteps: 72,
        optimizer: 'AdamW',
        lossFunction: newType === 'physics_informed_nn' ? 'MSE + PhysicsResidualLoss' : 'MSE',
      },
      features: newFeatures,
    });

    setModels([...modelRegistry.getModels()]);
    setIsRegistering(false);
    onModelsChanged();
  };

  const toggleFeature = (feat: string) => {
    setNewFeatures(prev => 
      prev.includes(feat) ? prev.filter(f => f !== feat) : [...prev, feat]
    );
  };

  return (
    <div className="flex flex-col gap-4 h-full font-sans text-xs text-[#252923] dark:text-[#E5E9E4]">
      
      {/* Model Sandbox Introduction */}
      <div className="p-3.5 bg-white dark:bg-[#1C211E] border border-[#E5E5DD] dark:border-[#2B332E] rounded-xl shadow-sm flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#252923] dark:text-[#E5E9E4]">
          <Layers className="h-4 w-4 text-[#A88B62] dark:text-[#C4A57B]" />
          <span>ORION Predictive Model Architecture Registry</span>
        </div>
        <p className="text-[11px] text-[#777B70] dark:text-[#8F998E] leading-relaxed">
          Select or deploy physics-informed neural networks (PINN), recurrent LSTM time-series, or Fokker-Planck empirical codes for relativistic electron flux forecasting.
        </p>
      </div>

      {/* Model Swapper */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-[#777B70] dark:text-[#8F998E] uppercase tracking-wider">
            Available Model Implementations
          </span>
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="flex items-center gap-1 text-[11px] text-[#35473C] dark:text-[#A8B3A0] font-medium hover:underline cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{isRegistering ? 'Cancel' : 'Tune Custom Topology'}</span>
          </button>
        </div>

        {isRegistering ? (
          <form onSubmit={handleRegisterNewModel} className="border border-[#E5E5DD] dark:border-[#2B332E] rounded-xl p-3.5 bg-white dark:bg-[#1C211E] shadow-sm flex flex-col gap-3">
            <div className="text-xs font-semibold text-[#A88B62] uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="h-4 w-4" />
              <span>Hyperparameter Configuration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-[#777B70] dark:text-[#8F998E]">Architecture Name:</span>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="bg-[#F6F5F0] dark:bg-[#232A26] border border-[#E5E5DD] dark:border-[#2B332E] rounded-lg p-1.5 px-2.5 text-xs text-[#252923] dark:text-[#E5E9E4] outline-none focus:border-[#A88B62]"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-[#777B70] dark:text-[#8F998E]">Model Paradigm:</span>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as ModelType)}
                  className="bg-[#F6F5F0] dark:bg-[#232A26] border border-[#E5E5DD] dark:border-[#2B332E] rounded-lg p-1.5 px-2.5 text-xs text-[#252923] dark:text-[#E5E9E4] outline-none focus:border-[#A88B62]"
                >
                  <option value="physics_informed_nn">Physics-Informed (PINN)</option>
                  <option value="lstm_timeseries">Recurrent LSTM</option>
                  <option value="transformer">Transformer Attention Block</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-[#777B70] dark:text-[#8F998E]">Epochs:</span>
                <input
                  type="number"
                  value={newEpochs}
                  onChange={e => setNewEpochs(parseInt(e.target.value))}
                  className="bg-[#F6F5F0] dark:bg-[#232A26] border border-[#E5E5DD] dark:border-[#2B332E] rounded-lg p-1.5 px-2.5 text-xs text-[#252923] dark:text-[#E5E9E4] outline-none"
                  min="10"
                  max="1000"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-[#777B70] dark:text-[#8F998E]">Hidden Latent Units:</span>
                <input
                  type="number"
                  value={newNeurons}
                  onChange={e => setNewNeurons(parseInt(e.target.value))}
                  className="bg-[#F6F5F0] dark:bg-[#232A26] border border-[#E5E5DD] dark:border-[#2B332E] rounded-lg p-1.5 px-2.5 text-xs text-[#252923] dark:text-[#E5E9E4] outline-none"
                  min="8"
                  max="512"
                />
              </div>
            </div>

            {/* Feature Selections list */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-[#777B70] dark:text-[#8F998E]">Input Vector Features (X_t):</span>
              <div className="flex flex-wrap gap-1.5">
                {['Vsw', 'Bz', 'Nsw', 'P_dyn', 'Kp', 'StandoffDistance_Re'].map((feat) => {
                  const selected = newFeatures.includes(feat);
                  return (
                    <button
                      key={feat}
                      type="button"
                      onClick={() => toggleFeature(feat)}
                      className={`px-2 py-1 rounded text-xs transition-colors border cursor-pointer ${
                        selected 
                          ? 'bg-[#35473C] text-white border-[#35473C]' 
                          : 'bg-[#F6F5F0] dark:bg-[#232A26] text-[#777B70] dark:text-[#8F998E] border-[#E5E5DD] dark:border-[#2B332E]'
                      }`}
                    >
                      {feat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1 justify-end">
              <button
                type="button"
                onClick={() => setIsRegistering(false)}
                className="px-3 py-1.5 rounded-lg border border-[#E5E5DD] dark:border-[#2B332E] text-xs text-[#777B70] hover:bg-[#F6F5F0] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-[#35473C] text-white hover:bg-[#27352D] text-xs font-medium transition-colors cursor-pointer"
              >
                Register & Activate
              </button>
            </div>
          </form>
        ) : (
          /* REGISTERED MODELS QUEUE LIST */
          <div className="flex flex-col gap-2 max-h-[190px] overflow-auto pr-1">
            {models.map((model) => {
              const isActive = model.id === activeModelId;
              return (
                <div
                  key={model.id}
                  onClick={() => handleSelectModel(model.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isActive 
                      ? 'bg-white dark:bg-[#1C211E] border-[#A88B62] shadow-[0_2px_8px_rgba(168,139,98,0.15)] ring-1 ring-[#A88B62]/40' 
                      : 'bg-white dark:bg-[#1C211E] border-[#E5E5DD] dark:border-[#2B332E] hover:border-[#D3D3C9]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 className={`h-4 w-4 ${isActive ? 'text-[#A88B62]' : 'text-[#777B70]'}`} />
                      <span className="font-semibold text-xs text-[#252923] dark:text-[#E5E9E4]">{model.name}</span>
                    </div>
                    {isActive ? (
                      <span className="flex items-center gap-1 text-[10px] text-[#437A5B] font-semibold uppercase tracking-wider">
                        <Check className="h-3.5 w-3.5" />
                        <span>Active Model</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#777B70] dark:text-[#8F998E]">Standby</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-[#777B70] dark:text-[#8F998E] font-mono border-t border-[#E5E5DD] dark:border-[#2B332E] pt-2">
                    <div>RMSE: <strong className="text-[#252923] dark:text-[#E5E9E4]">{model.accuracyMetrics.rmse}</strong></div>
                    <div>·</div>
                    <div>Corr (R): <strong className="text-[#252923] dark:text-[#E5E9E4]">{model.accuracyMetrics.correlation}</strong></div>
                    <div>·</div>
                    <div>NSE: <strong className="text-[#437A5B]">{model.accuracyMetrics.nse}</strong></div>
                  </div>
                  
                  <div className="text-[10px] text-[#777B70] dark:text-[#8F998E]">
                    v{model.version} · {model.developer}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Accuracy Evaluation Info */}
      <div className="rounded-xl border border-[#E5E5DD] dark:border-[#2B332E] bg-[#F6F5F0] dark:bg-[#232A26] p-3 text-xs text-[#777B70] dark:text-[#8F998E] flex flex-col gap-1">
        <span className="text-[#252923] dark:text-[#E5E9E4] font-semibold text-xs flex items-center gap-1.5">
          <GitMerge className="h-3.5 w-3.5 text-[#A88B62]" />
          <span>Cross-Longitudinal Parameterization</span>
        </span>
        <p className="leading-relaxed text-[11px]">
          ORION incorporates solar wind boundary dynamics at L1 and maps spatial phase lag for geostationary orbit satellites across 55°E, 83°E, and 285°W longitudes.
        </p>
      </div>

    </div>
  );
}
