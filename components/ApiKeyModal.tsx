import React, { useState } from 'react';
import { KeyRound, X, Cpu } from 'lucide-react';
import { Button } from './Button';
import { Theme } from '../types';
import { AVAILABLE_MODELS, getSelectedModel, setSelectedModel, getApiKey } from '../services/geminiService';

interface ApiKeyModalProps {
  onClose: () => void;
  onSave: (key: string) => void;
  theme: Theme;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose, onSave, theme }) => {
  const [apiKey, setApiKey] = useState(() => getApiKey() || '');
  const [model, setModel] = useState<string>(() => getSelectedModel());
  const isGds = theme === 'GDS';

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

  const handleClearKey = () => {
    setApiKey('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-md shadow-2xl p-6 ${isGds ? 'bg-white border-2 border-[#0b0c0c] rounded-none border-t-8 border-t-[#1d70b8]' : 'bg-white rounded-xl'}`}>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${isGds ? 'bg-[#0b0c0c] text-white' : 'bg-blue-100 text-blue-600 rounded-lg'}`}>
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isGds ? 'text-[#0b0c0c]' : 'text-slate-900'}`}>API Key & Model Settings</h2>
              <p className={`text-sm ${isGds ? 'text-[#505a5f]' : 'text-slate-500'}`}>Configure Gemini AI parameters</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-1 text-slate-400 hover:text-slate-600 ${isGds ? 'hover:bg-[#f3f2f1]' : 'rounded-lg hover:bg-slate-100'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Model Selection */}
          <div className="space-y-2">
            <label className={`block text-sm font-semibold flex items-center gap-2 ${isGds ? 'text-[#0b0c0c] font-bold' : 'text-slate-700'}`}>
              <Cpu className={`w-4 h-4 ${isGds ? 'text-[#1d70b8]' : 'text-blue-500'}`} /> Select Gemini Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className={`w-full px-4 py-3 text-sm transition-all outline-none font-medium ${
                isGds 
                  ? 'border-2 border-[#0b0c0c] focus:border-[#0b0c0c] focus:ring-4 focus:ring-[#ffdd00] bg-white text-[#0b0c0c] rounded-none font-bold' 
                  : 'border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg'
              }`}
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <p className={`text-xs ${isGds ? 'text-[#505a5f]' : 'text-slate-500'}`}>
              Choose <strong>gemini-3.6-flash</strong> for fast response times or <strong>gemini-3.1-pro-preview</strong> for more complex reasoning.
            </p>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <label className={`block text-sm font-semibold ${isGds ? 'text-[#0b0c0c] font-bold' : 'text-slate-700'}`}>
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className={`w-full px-4 py-3 text-sm transition-all outline-none ${
                isGds 
                  ? 'border-2 border-[#0b0c0c] focus:border-[#0b0c0c] focus:ring-4 focus:ring-[#ffdd00] bg-white text-[#0b0c0c] rounded-none' 
                  : 'border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg'
              }`}
            />
            <p className={`text-xs ${isGds ? 'text-[#505a5f]' : 'text-slate-500'}`}>
              Held in application memory while open (reset when tab reloads or closes) and sent directly to Google Gemini API endpoints. Obtain a key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className={isGds ? 'text-[#1d70b8] underline font-bold hover:text-[#003078]' : 'text-blue-500 hover:underline'}>Google AI Studio</a>.
            </p>
          </div>

          <div className={`flex justify-end gap-3 pt-4 ${isGds ? 'border-t-2 border-[#b1b4b6]' : 'border-t border-slate-100'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                isGds ? 'text-[#1d70b8] underline font-bold hover:text-[#003078]' : 'text-slate-600 hover:bg-slate-100 rounded-lg'
              }`}
            >
              Cancel
            </button>
            <Button
              type="submit"
              variant="primary"
              theme={theme}
            >
              Save Settings
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
