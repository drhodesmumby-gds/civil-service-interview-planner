import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from './Button';

interface DisclaimerModalProps {
  onAccept: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onAccept }) => {
  const [isAccepted, setIsAccepted] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="moj-modal-dialogue w-full max-w-2xl bg-white p-6 border-4 border-[#0b0c0c]">
        {/* Header */}
        <div className="bg-[#0b0c0c] text-white p-4 border-b-4 border-[#d4351c] flex items-center gap-3 mb-6">
          <ShieldAlert className="w-8 h-8 text-[#ffdd00] shrink-0" />
          <div>
            <h2 className="govuk-heading-m mb-0 flex items-center gap-2" style={{ color: 'white' }}>
              Important Usage Notice
              <span className="bg-[#ffdd00] text-[#0b0c0c] text-xs font-bold px-2 py-0.5">
                NOTICE
              </span>
            </h2>
            <p className="govuk-body-s mb-0" style={{ color: '#cbd5e1' }}>
              Please read carefully before proceeding.
            </p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="govuk-inset-text border-l-4 border-[#1d70b8] my-0 bg-[#f3f2f1] p-4">
            <h3 className="govuk-heading-s mb-1 text-[#0b0c0c]">Unofficial Preparation Tool</h3>
            <p className="govuk-body-s mb-0">
              This is an unofficial preparation tool. It is not endorsed by the UK Civil Service.
            </p>
          </div>

          <div className="govuk-warning-text my-0">
            <span className="govuk-warning-text__icon" aria-hidden="true">!</span>
            <strong className="govuk-warning-text__text">
              <span className="govuk-visually-hidden">Warning</span>
              FOR PREPARATION ONLY: Do not use the timing guide function during a live interview. Doing so may violate Civil Service integrity rules and lead to disqualification.
            </strong>
          </div>

          <div className="govuk-inset-text border-l-4 border-[#d4351c] my-0 bg-[#fff] p-4">
            <h3 className="govuk-heading-s mb-1 text-[#d4351c]">DATA SAFETY</h3>
            <p className="govuk-body-s mb-0">
              This tool processes text using AI. <strong>Do not</strong> upload classified, sensitive, or personal identifying information (e.g., real names, NI numbers).
            </p>
          </div>

          <div className="govuk-form-group mb-0 pt-4 border-t-2 border-[#b1b4b6]">
            <div className="govuk-checkboxes govuk-checkboxes--small">
              <div className="govuk-checkboxes__item flex items-center">
                <input 
                  id="disclaimer-checkbox"
                  type="checkbox" 
                  className="govuk-checkboxes__input"
                  checked={isAccepted}
                  onChange={(e) => setIsAccepted(e.target.checked)}
                />
                <label className="govuk-label govuk-checkboxes__label font-bold text-sm" htmlFor="disclaimer-checkbox">
                  I understand that this tool is for practice only and I will not input sensitive government data.
                </label>
              </div>
            </div>
          </div>

          <Button 
            onClick={onAccept} 
            disabled={!isAccepted}
            variant="primary"
            className="w-full justify-center"
          >
            Enter Application
          </Button>
        </div>
      </div>
    </div>
  );
};