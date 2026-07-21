import React, { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { Button } from './Button';
import { Theme } from '../types';

interface ApiKeyModalProps {
  onClose: () => void;
  onSave: (key: string) => void;
  theme: Theme;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose, onSave, theme }) => {
  const [apiKey, setApiKey] = useState('');
  const isGds = theme === 'GDS';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onSave(apiKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-xl shadow-2xl p-6 ${isGds ? 'bg-white border-4 border-[#1d70b8]' : 'bg-white'}`}>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isGds ? 'bg-[#1d70b8]/10 text-[#1d70b8]' : 'bg-blue-100 text-blue-600'}`}>
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isGds ? 'text-[#0b0c0c]' : 'text-slate-900'}`}>Gemini API Key</h2>
              <p className={`text-sm ${isGds ? 'text-[#505a5f]' : 'text-slate-500'}`}>Required for AI features</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className={`block text-sm font-semibold ${isGds ? 'text-[#0b0c0c]' : 'text-slate-700'}`}>
              Enter your Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className={`w-full px-4 py-3 rounded-lg text-sm transition-all outline-none ${
                isGds 
                  ? 'border-2 border-[#0b0c0c] focus:border-[#0b0c0c] focus:ring-4 focus:ring-[#fd0]' 
                  : 'border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              }`}
              autoFocus
            />
            <p className={`text-xs ${isGds ? 'text-[#505a5f]' : 'text-slate-500'}`}>
              Your key is stored locally in your browser and never sent anywhere else. You can get a free key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className={isGds ? 'text-[#1d70b8] underline hover:text-[#003078]' : 'text-blue-500 hover:underline'}>Google AI Studio</a>.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isGds ? 'text-[#1d70b8] underline hover:text-[#003078]' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <Button
              type="submit"
              variant="primary"
              disabled={!apiKey.trim()}
              theme={theme}
            >
              Save Key
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
