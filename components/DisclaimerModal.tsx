import React, { useState } from 'react';
import { ShieldAlert, Check } from 'lucide-react';
import { Button } from './Button';

interface DisclaimerModalProps {
  onAccept: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onAccept }) => {
  const [isAccepted, setIsAccepted] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        <div className="bg-amber-50 border-b border-amber-100 p-6 flex items-start gap-4">
          <ShieldAlert className="w-8 h-8 text-amber-600 shrink-0" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Important Usage Notice</h2>
            <p className="text-amber-800 text-sm mt-1">Please read carefully before proceeding.</p>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-4 text-slate-700 leading-relaxed">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
               <p className="font-semibold text-slate-900 mb-1">Unofficial Tool</p>
               <p className="text-sm">This is an unofficial preparation tool. It is not endorsed by the UK Civil Service.</p>
            </div>

            <div>
              <strong className="block text-slate-900 mb-1">FOR PREPARATION ONLY:</strong>
              <p className="text-sm">Do not use the timing guide function during a live interview. Doing so may violate Civil Service integrity rules and lead to disqualification.</p>
            </div>

            <div>
              <strong className="block text-slate-900 mb-1">DATA SAFETY:</strong>
              <p className="text-sm">This tool processes text using AI. <span className="font-bold text-red-600">Do not</span> upload classified, sensitive, or personal identifying information (e.g., real names, NI numbers).</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center mt-0.5">
                <input 
                  type="checkbox" 
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-blue-600 checked:bg-blue-600 focus:ring-2 focus:ring-blue-200"
                  checked={isAccepted}
                  onChange={(e) => setIsAccepted(e.target.checked)}
                />
                <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" />
              </div>
              <span className="text-sm text-slate-600 group-hover:text-slate-900 select-none">
                I understand that this tool is for practice only and I will not input sensitive government data.
              </span>
            </label>
          </div>

          <Button 
            onClick={onAccept} 
            disabled={!isAccepted}
            className="w-full py-3"
          >
            Enter Application
          </Button>
        </div>
      </div>
    </div>
  );
};