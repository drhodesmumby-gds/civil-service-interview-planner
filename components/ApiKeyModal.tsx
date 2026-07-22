import React, { useState } from 'react';
import { KeyRound, X, Cpu } from 'lucide-react';
import { Button } from './Button';
import { AVAILABLE_MODELS, getSelectedModel, setSelectedModel, getApiKey } from '../services/geminiService';

interface ApiKeyModalProps {
  onClose: () => void;
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose, onSave }) => {
  const [apiKey, setApiKey] = useState(() => getApiKey() || '');
  const [model, setModel] = useState<string>(() => getSelectedModel());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedModel(model);
    if (apiKey.trim()) {
      onSave(apiKey.trim());
    } else {
      onSave(''); // Let SetupView handle clearing
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="moj-modal-dialogue w-full max-w-lg bg-white p-6 border-4 border-[#0b0c0c]">
        <div className="flex justify-between items-start mb-6 pb-3 border-b-2 border-[#b1b4b6]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0b0c0c] text-white">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="govuk-heading-m mb-0 text-[#0b0c0c]">API Key & Model Settings</h2>
              <p className="govuk-hint mb-0">Configure Gemini AI parameters</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close modal" className="p-1 text-[#0b0c0c] hover:bg-[#f3f2f1]">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Model Selection */}
          <div className="govuk-form-group mb-4">
            <label className="govuk-label font-bold flex items-center gap-2" htmlFor="model-select">
              <Cpu className="w-4 h-4 text-[#1d70b8]" /> Select Gemini Model
            </label>
            <select
              id="model-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="govuk-select w-full"
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <div className="govuk-hint mt-1 text-xs">
              Choose <strong>gemini-3.6-flash</strong> for fast response times or <strong>gemini-3.1-pro-preview</strong> for more complex reasoning.
            </div>
          </div>

          {/* API Key Input */}
          <div className="govuk-form-group mb-4">
            <label className="govuk-label font-bold" htmlFor="api-key-input">
              Gemini API Key
            </label>
            <input
              id="api-key-input"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="govuk-input w-full"
            />
            <div className="govuk-hint mt-1 text-xs">
              Held in application memory while open (reset when tab reloads or closes) and sent directly to Google Gemini API endpoints. Obtain a key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="govuk-link">Google AI Studio</a>.
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t-2 border-[#b1b4b6]">
            <button
              type="button"
              onClick={onClose}
              className="govuk-button govuk-button--secondary mb-0"
            >
              Cancel
            </button>
            <Button
              type="submit"
              variant="primary"
            >
              Save Settings
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
