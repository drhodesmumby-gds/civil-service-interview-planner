import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from './Button';

interface DisclaimerModalProps {
  onAccept: (analyticsConsent: boolean) => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onAccept }) => {
  const [isAccepted, setIsAccepted] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(true); // Default to true but they can uncheck

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="moj-modal-dialogue w-full max-w-2xl bg-white border-4 border-[#0b0c0c] flex flex-col">
        {/* Fixed Header */}
        <div className="bg-[#0b0c0c] text-white p-4 border-b-4 border-[#d4351c] flex items-center gap-3 shrink-0">
          <ShieldAlert className="w-8 h-8 text-[#ffdd00] shrink-0" />
          <div>
            <h2 className="govuk-heading-m mb-0" style={{ color: 'white' }}>
              Important Usage Notice
              <strong className="govuk-tag govuk-tag--yellow govuk-!-margin-left-2 align-middle" style={{ marginTop: '-4px' }}>
                NOTICE
              </strong>
            </h2>
            <p className="govuk-body-s mb-0" style={{ color: '#cbd5e1' }}>
              Please read carefully before proceeding.
            </p>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="govuk-inset-text border-l-4 border-[#1d70b8] !my-0 bg-[#f3f2f1] p-4">
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
            <h3 className="govuk-heading-s mb-1 text-[#d4351c]">Data Safety and Privacy</h3>
            <p className="govuk-body-s mb-0">
              This tool has features which process text using AI if you so choose. These are entirely optional, but if you use them you should be conscious the features you use will process data via Google. <strong>Do not</strong> upload classified, sensitive, or personal identifying information (e.g., real names).
            </p>
            <p className="govuk-body-s mb-0">
              Only if you consent below, this site uses <a href="https://umami.is" target="_blank" rel="noopener noreferrer" className="govuk-link">Umami</a>, a privacy-first, cookie-free analytics tool. It only tracks generic usage statistics to help me understand if / how people are using the application and potentially improve it as a result. <strong>No personal data or text inputs are ever collected or tracked by the analytics tool or myself.</strong>
            </p>
          </div>

          <div className="govuk-form-group mb-0 pt-4 border-t-2 border-[#b1b4b6]">
            <div className="govuk-checkboxes govuk-checkboxes--small">
              <div className="govuk-checkboxes__item">
                <input 
                  id="disclaimer-checkbox"
                  type="checkbox" 
                  className="govuk-checkboxes__input"
                  checked={isAccepted}
                  onChange={(e) => setIsAccepted(e.target.checked)}
                />
                <label className="govuk-label govuk-checkboxes__label govuk-!-font-weight-bold" htmlFor="disclaimer-checkbox">
                  I understand that this tool is for practice only and I will not input sensitive personal or government data.
                </label>
              </div>
              <div className="govuk-checkboxes__item">
                <input 
                  id="analytics-checkbox"
                  type="checkbox" 
                  className="govuk-checkboxes__input"
                  checked={analyticsConsent}
                  onChange={(e) => setAnalyticsConsent(e.target.checked)}
                />
                <label className="govuk-label govuk-checkboxes__label" htmlFor="analytics-checkbox">
                  I consent to the collection of anonymous, generic usage statistics to help improve the tool.
                </label>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => onAccept(analyticsConsent)} 
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