import React from 'react';
import { X, Briefcase, FileUp, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface JobAdvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobAdvertText: string;
  setJobAdvertText: (text: string) => void;
  isProcessingFile: boolean;
  handleFileRead: (file: File, setter: (text: string) => void) => void;
  handleJobAdvertExtract: () => void;
  isExtractingJob: boolean;
}

export const JobAdvertModal: React.FC<JobAdvertModalProps> = ({
  isOpen,
  onClose,
  jobAdvertText,
  setJobAdvertText,
  isProcessingFile,
  handleFileRead,
  handleJobAdvertExtract,
  isExtractingJob
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="moj-modal-dialogue w-full max-w-2xl bg-white border-4 border-[#0b0c0c] flex flex-col max-h-[90vh]">
        {/* Fixed Header */}
        <div className="flex justify-between items-start p-6 pb-3 border-b-2 border-[#b1b4b6] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0b0c0c] text-white">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h2 className="govuk-heading-m mb-0 text-[#0b0c0c]">Auto-fill from Advert</h2>
              <p className="govuk-hint mb-0">Paste a job advert to automatically extract the role, grade, and required behaviours.</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close modal" className="p-1 text-[#0b0c0c] hover:bg-[#f3f2f1]">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="govuk-form-group govuk-!-margin-bottom-0">
            <label className="govuk-label govuk-!-font-weight-bold" htmlFor="job-advert-text">
              Paste job advert text
            </label>
            <textarea 
              id="job-advert-text"
              className="govuk-textarea focus:ring-4 focus:ring-[#ffdd00] focus:border-[#0b0c0c] focus:outline-none w-full border-2 border-[#0b0c0c] p-2"
              placeholder="Paste job advert text here..."
              value={jobAdvertText}
              onChange={e => setJobAdvertText(e.target.value)}
              disabled={isProcessingFile}
              rows={8}
            />
          </div>
          
          <div className="govuk-form-group govuk-!-margin-bottom-4">
            <label className="govuk-label govuk-!-font-weight-bold" htmlFor="job-file-upload">
              Or upload a file
            </label>
            <div className="flex items-center gap-4">
              <input 
                className="govuk-file-upload" 
                id="job-file-upload" 
                type="file" 
                accept=".txt,.md,.json,.docx,.pdf"
                disabled={isProcessingFile}
                onChange={(e) => {
                  if(e.target.files?.[0]) handleFileRead(e.target.files[0], setJobAdvertText);
                  e.target.value = '';
                }}
              />
              {isProcessingFile && (
                <span className="flex items-center gap-2 text-sm text-[#505a5f]">
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </span>
              )}
            </div>
          </div>

          <div className="pt-4 border-t-2 border-[#b1b4b6] flex justify-end gap-3">
            <Button 
              onClick={onClose} 
              variant="secondary"
              disabled={isExtractingJob || isProcessingFile}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleJobAdvertExtract} 
              variant="primary"
              disabled={!jobAdvertText.trim() || isProcessingFile || isExtractingJob}
            >
              {isExtractingJob ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Extracting...
                </span>
              ) : 'Extract Details'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
