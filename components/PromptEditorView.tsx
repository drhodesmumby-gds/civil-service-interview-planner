import React, { useState, useRef } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { 
  PromptType, 
  PromptTemplates, 
  getStoredPrompts, 
  setStoredPrompts, 
  resetStoredPrompt, 
  resetStoredPrompts, 
  exportPromptsToJson, 
  importPromptsFromJson,
  DEFAULT_PROMPTS 
} from '../services/geminiService';

interface PromptEditorViewProps {
  onBack: () => void;
}

interface PromptTabInfo {
  type: PromptType;
  label: string;
  shortDescription: string;
  placeholders: { tag: string; description: string }[];
}

const PROMPT_TABS: PromptTabInfo[] = [
  {
    type: 'PLAN',
    label: 'Plan Generator',
    shortDescription: 'Generates the initial structured interview plan based on grade, behaviours, and career context.',
    placeholders: [
      { tag: '{{ROLE}}', description: 'Target job title / role' },
      { tag: '{{GRADE}}', description: 'Civil Service grade (e.g. HEO, SEO, Grade 7)' },
      { tag: '{{DEPARTMENT}}', description: 'Department name' },
      { tag: '{{TEAM}}', description: 'Specific team or division' },
      { tag: '{{LENGTH}}', description: 'Total interview length in minutes' },
      { tag: '{{CAREER_HISTORY}}', description: 'Candidate career history and notes' },
      { tag: '{{JOB_CONTEXT}}', description: 'Parsed job advert text context' },
      { tag: '{{KNOWN_QUESTIONS_CONTEXT}}', description: 'Pre-seen interview questions' },
      { tag: '{{SELECTED_BEHAVIOURS}}', description: 'Selected Success Profile Behaviours (List)' },
      { tag: '{{SELECTED_BEHAVIOURS_DETAIL}}', description: 'Verbatim Official Behaviour Criteria for the selected grade' },
      { tag: '{{TECH_COMPETENCIES}}', description: 'Selected Technical Competencies' }
    ]
  },
  {
    type: 'REGEN',
    label: 'Section Rewrite',
    shortDescription: 'Used when regenerating or refining STARR notes for a specific interview section.',
    placeholders: [
      { tag: '{{TITLE}}', description: 'Section title (e.g. Behaviour: Leadership)' },
      { tag: '{{QUESTION_TEXT}}', description: 'Likely interview question text' },
      { tag: '{{ROLE}}', description: 'Target job title' },
      { tag: '{{GRADE}}', description: 'Civil Service grade' },
      { tag: '{{DURATION}}', description: 'Allocated duration in minutes' },
      { tag: '{{CAREER_HISTORY}}', description: 'Candidate career history' },
      { tag: '{{CURRENT_NOTES}}', description: 'Existing STARR notes being edited' },
      { tag: '{{FEEDBACK}}', description: 'User regeneration instructions / feedback' }
    ]
  },
  {
    type: 'INTRO',
    label: 'Opening / Intro Rewrite',
    shortDescription: 'Used specifically when refining the opening / introduction section notes.',
    placeholders: [
      { tag: '{{TITLE}}', description: 'Section title' },
      { tag: '{{QUESTION_TEXT}}', description: 'Icebreaker question' },
      { tag: '{{ROLE}}', description: 'Target role' },
      { tag: '{{GRADE}}', description: 'Civil Service grade' },
      { tag: '{{DURATION}}', description: 'Allocated duration in minutes' },
      { tag: '{{CAREER_HISTORY}}', description: 'Candidate career history' },
      { tag: '{{CURRENT_NOTES}}', description: 'Existing intro notes' },
      { tag: '{{FEEDBACK}}', description: 'User feedback instructions' }
    ]
  },
  {
    type: 'EXTRACT',
    label: 'Job Extract',
    shortDescription: 'Analyzes raw job advert text to automatically populate role, grade, and required behaviours.',
    placeholders: [
      { tag: '{{JOB_ADVERT_TEXT}}', description: 'Raw job description pasted by user' }
    ]
  },
  {
    type: 'FOLLOWUP',
    label: 'Follow-Up Questions',
    shortDescription: 'Predicts probing panel questions and answer strategies for each section.',
    placeholders: [
      { tag: '{{SECTION_TITLE}}', description: 'Title of the section' },
      { tag: '{{SECTION_QUESTION}}', description: 'Section question text' },
      { tag: '{{PLANNED_ANSWER}}', description: 'Candidate planned STARR notes' },
      { tag: '{{CAREER_HISTORY}}', description: 'Candidate career history' }
    ]
  }
];

export const PromptEditorView: React.FC<PromptEditorViewProps> = ({ onBack }) => {
  const [prompts, setPrompts] = useState<PromptTemplates>(getStoredPrompts());
  const [activeTab, setActiveTab] = useState<PromptType>('PLAN');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentTabInfo = PROMPT_TABS.find(tab => tab.type === activeTab) || PROMPT_TABS[0];

  const showNotificationMsg = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePromptChange = (newText: string) => {
    setSaveStatus('saving');
    const updated = {
      ...prompts,
      [activeTab]: newText
    };
    setPrompts(updated);
    setStoredPrompts(updated);
    setTimeout(() => setSaveStatus('saved'), 300);
  };

  const handleResetCurrent = () => {
    if (confirm(`Reset the ${currentTabInfo.label} prompt to its original default template?`)) {
      const updated = resetStoredPrompt(activeTab);
      setPrompts(updated);
      showNotificationMsg(`${currentTabInfo.label} prompt reset to default.`);
    }
  };

  const handleResetAll = () => {
    if (confirm('Are you sure you want to reset ALL prompt templates to their original defaults? This will erase custom prompt edits.')) {
      const updated = resetStoredPrompts();
      setPrompts(updated);
      showNotificationMsg('All prompt templates have been reset to defaults.');
    }
  };

  const handleExport = () => {
    exportPromptsToJson();
    showNotificationMsg('Prompts exported to civil-service-prompts.json');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const updated = importPromptsFromJson(text);
        setPrompts(updated);
        showNotificationMsg('Prompts imported successfully from file!');
      } catch (err: any) {
        showNotificationMsg(`Failed to import prompts: ${err.message || 'Invalid format'}`, 'error');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const insertPlaceholder = (tag: string) => {
    // Find the textarea inside MDEditor
    const textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement | null;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = prompts[activeTab];
      const newText = text.substring(0, start) + tag + text.substring(end);
      
      handlePromptChange(newText);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    } else {
      // Fallback: append to end
      handlePromptChange(prompts[activeTab] + ' ' + tag);
    }

    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 1500);
  };

  const isDefaultPrompt = prompts[activeTab] === DEFAULT_PROMPTS[activeTab];

  return (
    <div>
      <a href="#" className="govuk-back-link" onClick={(e) => { e.preventDefault(); onBack(); }}>Back to Planner</a>
      
      <div className="govuk-grid-row govuk-!-margin-top-4">
        <div className="govuk-grid-column-full">
          <h1 className="govuk-heading-xl govuk-!-margin-bottom-6">Prompt Editor</h1>
        </div>
      </div>

      <div className="govuk-grid-row">
        {/* Left Sidebar - MOJ Navigation */}
        <div className="govuk-grid-column-one-third">
          <nav className="moj-side-navigation" aria-label="Side navigation">
            <h4 className="moj-side-navigation__title">Prompt Templates</h4>
            <ul className="moj-side-navigation__list">
              {PROMPT_TABS.map(tab => {
                const isActive = activeTab === tab.type;
                const isCustomized = prompts[tab.type] !== DEFAULT_PROMPTS[tab.type];
                return (
                  <li key={tab.type} className={`moj-side-navigation__item ${isActive ? 'moj-side-navigation__item--active' : ''}`}>
                    <a href={`#${tab.type}`} aria-current={isActive ? 'location' : undefined} onClick={(e) => { e.preventDefault(); setActiveTab(tab.type); }}>
                      {tab.label}
                      {isCustomized && <strong className="govuk-tag govuk-tag--yellow govuk-!-margin-left-2">Edited</strong>}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="govuk-!-margin-top-8">
            <h3 className="govuk-heading-s">Global Actions</h3>
            <div className="govuk-button-group govuk-!-margin-bottom-2">
               <button onClick={handleExport} className="govuk-button govuk-button--secondary">Export</button>
               <input
                 type="file"
                 ref={fileInputRef}
                 onChange={handleImportFile}
                 accept=".json"
                 className="hidden"
                 style={{ display: 'none' }}
               />
               <button onClick={() => fileInputRef.current?.click()} className="govuk-button govuk-button--secondary">Import</button>
            </div>
            <button onClick={handleResetAll} className="govuk-button govuk-button--warning">Reset All to Defaults</button>
            
            <div className="govuk-!-margin-top-4" aria-live="polite">
              {saveStatus === 'saving' ? (
                <p className="govuk-body-s govuk-!-font-weight-bold" style={{ color: '#f47738' }}>Saving...</p>
              ) : (
                <p className="govuk-body-s govuk-!-font-weight-bold" style={{ color: '#00703c' }}>✔ Saved to LocalStorage</p>
              )}
              {notification && (
                <p className={`govuk-body-s govuk-!-margin-top-2 ${notification.type === 'error' ? 'govuk-error-message' : 'govuk-!-font-weight-bold'}`}>
                  {notification.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="govuk-grid-column-two-thirds">
          <div className="govuk-!-margin-bottom-6">
            <h2 className="govuk-heading-l govuk-!-margin-bottom-2">
              {currentTabInfo.label}
              {!isDefaultPrompt && <strong className="govuk-tag govuk-tag--yellow govuk-!-margin-left-2 align-middle">Customized</strong>}
            </h2>
            <p className="govuk-body">{currentTabInfo.shortDescription}</p>
            
            <button
              onClick={handleResetCurrent}
              disabled={isDefaultPrompt}
              className="govuk-button govuk-button--secondary"
            >
              Reset Prompt to Default
            </button>
          </div>

          <details className="govuk-details" data-module="govuk-details">
            <summary className="govuk-details__summary">
              <span className="govuk-details__summary-text">
                Supported Placeholders (Click a tag to insert)
              </span>
            </summary>
            <div className="govuk-details__text">
              <div className="govuk-button-group">
                {currentTabInfo.placeholders.map(p => (
                  <button
                    key={p.tag}
                    onClick={() => insertPlaceholder(p.tag)}
                    className="govuk-button govuk-button--secondary govuk-!-margin-bottom-2 govuk-!-margin-right-2"
                    title={p.description}
                  >
                    {p.tag}
                  </button>
                ))}
              </div>
            </div>
          </details>

          <div className="govuk-form-group">
            <label className="govuk-label govuk-!-font-weight-bold">
              Template Content (Markdown Editor)
            </label>
            <div className="govuk-hint">
              {prompts[activeTab].length} characters | {prompts[activeTab].split('\n').length} lines
            </div>
            
            <div className="border-4 border-[#0b0c0c] bg-white" data-color-mode="light">
              <MDEditor
                value={prompts[activeTab]}
                onChange={(val) => handlePromptChange(val || '')}
                height={500}
                preview="live"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
