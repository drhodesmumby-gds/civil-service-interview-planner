import React, { useState } from 'react';
import { ShieldAlert, Check } from 'lucide-react';
import { Button } from './Button';
import { Theme } from '../types';

interface DisclaimerModalProps {
  onAccept: () => void;
  theme?: Theme;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onAccept, theme = 'DEFAULT' }) => {
  const [isAccepted, setIsAccepted] = useState(false);
  const isGds = theme === 'GDS';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 font-sans">
      <div className={`w-full max-w-2xl overflow-hidden shadow-2xl ${
        isGds 
          ? 'bg-white border-2 border-[#0b0c0c] rounded-none' 
          : 'bg-white rounded-xl border border-slate-200'
      }`}>
        {/* Header */}
        <div className={
          isGds 
            ? 'bg-[#0b0c0c] text-white p-6 border-b-4 border-[#d4351c] flex items-start justify-between' 
            : 'bg-amber-50 border-b border-amber-100 p-6 flex items-start gap-4'
        }>
          <div className="flex items-start gap-4">
            <ShieldAlert className={`w-8 h-8 shrink-0 ${isGds ? 'text-[#ffdd00]' : 'text-amber-600'}`} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-xl font-bold ${isGds ? 'text-white' : 'text-slate-900'}`}>
                  Important Usage Notice
                </h2>
                {isGds && (
                  <span className="bg-[#ffdd00] text-[#0b0c0c] text-xs font-bold px-2 py-0.5">
                    NOTICE
                  </span>
                )}
              </div>
              <p className={`text-sm mt-1 ${isGds ? 'text-slate-300' : 'text-amber-800'}`}>
                Please read carefully before proceeding.
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-4 text-slate-700 leading-relaxed">
            <div className={
              isGds 
                ? 'bg-[#f3f2f1] p-4 border-l-4 border-[#1d70b8] text-[#0b0c0c]' 
                : 'bg-slate-50 p-4 rounded-lg border border-slate-200'
            }>
               <p className={`font-semibold mb-1 ${isGds ? 'text-[#0b0c0c] font-bold' : 'text-slate-900'}`}>
                 Unofficial Preparation Tool
               </p>
               <p className="text-sm">
                 This is an unofficial preparation tool. It is not endorsed by the UK Civil Service.
               </p>
            </div>

            <div className={isGds ? 'p-3 border-l-4 border-[#0b0c0c] bg-white' : ''}>
              <strong className={`block mb-1 ${isGds ? 'text-[#0b0c0c] font-bold' : 'text-slate-900'}`}>
                FOR PREPARATION ONLY:
              </strong>
              <p className={`text-sm ${isGds ? 'text-[#0b0c0c]' : 'text-slate-700'}`}>
                Do not use the timing guide function during a live interview. Doing so may violate Civil Service integrity rules and lead to disqualification.
              </p>
            </div>

            <div className={isGds ? 'p-3 border-l-4 border-[#d4351c] bg-[#fff]' : ''}>
              <strong className={`block mb-1 ${isGds ? 'text-[#d4351c] font-bold' : 'text-slate-900'}`}>
                DATA SAFETY:
              </strong>
              <p className={`text-sm ${isGds ? 'text-[#0b0c0c]' : 'text-slate-700'}`}>
                This tool processes text using AI. <span className={`font-bold ${isGds ? 'text-[#d4351c]' : 'text-red-600'}`}>Do not</span> upload classified, sensitive, or personal identifying information (e.g., real names, NI numbers).
              </p>
            </div>
          </div>

          <div className={`pt-4 ${isGds ? 'border-t-2 border-[#b1b4b6]' : 'border-t border-slate-100'}`}>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center mt-0.5">
                <input 
                  type="checkbox" 
                  className={
                    isGds 
                      ? 'peer h-6 w-6 cursor-pointer appearance-none border-2 border-[#0b0c0c] bg-white checked:bg-[#00703c] focus:outline-none focus:ring-4 focus:ring-[#ffdd00]' 
                      : 'peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-blue-600 checked:bg-blue-600 focus:ring-2 focus:ring-blue-200'
                  }
                  checked={isAccepted}
                  onChange={(e) => setIsAccepted(e.target.checked)}
                />
                <Check className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${isGds ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-white opacity-0 peer-checked:opacity-100`} />
              </div>
              <span className={`text-sm select-none ${isGds ? 'text-[#0b0c0c] font-medium' : 'text-slate-600 group-hover:text-slate-900'}`}>
                I understand that this tool is for practice only and I will not input sensitive government data.
              </span>
            </label>
          </div>

          <Button 
            onClick={onAccept} 
            disabled={!isAccepted}
            theme={theme}
            variant="primary"
            className="w-full py-3 text-base"
          >
            Enter Application
          </Button>
        </div>
      </div>
    </div>
  );
};