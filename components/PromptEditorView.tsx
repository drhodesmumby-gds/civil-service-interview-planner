import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Wand2, 
  MessageSquare, 
  ScanSearch, 
  HelpCircle, 
  RotateCcw, 
  Download, 
  Upload, 
  Check, 
  AlertCircle, 
  Copy, 
  FileText,
  Info
} from 'lucide-react';
import { Theme } from '../types';
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
  theme: Theme;
}

interface PromptTabInfo {
  type: PromptType;
  label: string;
  shortDescription: string;
  icon: React.ReactNode;
  placeholders: { tag: string; description: string }[];
}

const PROMPT_TABS: PromptTabInfo[] = [
  {
    type: 'PLAN',
    label: 'Plan Generator',
    shortDescription: 'Generates the initial structured interview plan based on grade, behaviours, and career context.',
    icon: <Sparkles className="w-4 h-4" />,
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
    icon: <Wand2 className="w-4 h-4" />,
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
    icon: <MessageSquare className="w-4 h-4" />,
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
    icon: <ScanSearch className="w-4 h-4" />,
    placeholders: [
      { tag: '{{JOB_ADVERT_TEXT}}', description: 'Raw job description pasted by user' }
    ]
  },
  {
    type: 'FOLLOWUP',
    label: 'Follow-Up Questions',
    shortDescription: 'Predicts probing panel questions and answer strategies for each section.',
    icon: <HelpCircle className="w-4 h-4" />,
    placeholders: [
      { tag: '{{SECTION_TITLE}}', description: 'Title of the section' },
      { tag: '{{SECTION_QUESTION}}', description: 'Section question text' },
      { tag: '{{PLANNED_ANSWER}}', description: 'Candidate planned STARR notes' },
      { tag: '{{CAREER_HISTORY}}', description: 'Candidate career history' }
    ]
  }
];

export const PromptEditorView: React.FC<PromptEditorViewProps> = ({ onBack, theme }) => {
  const isGds = theme === 'GDS';
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
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = prompts[activeTab];
    const newText = text.substring(0, start) + tag + text.substring(end);
    
    handlePromptChange(newText);
    
    // Set cursor position after inserted tag
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);

    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 1500);
  };

  const isDefaultPrompt = prompts[activeTab] === DEFAULT_PROMPTS[activeTab];

  return (
    <div className={`h-full flex flex-col ${isGds ? 'bg-[#f3f2f1] font-sans text-[#0b0c0c]' : 'bg-slate-900 text-slate-100 font-sans'}`}>
      
      {/* Sticky Header */}
      <header className={`px-6 py-4 flex items-center justify-between shadow-md z-20 shrink-0 border-b ${
        isGds ? 'bg-white border-b-2 border-[#0b0c0c]' : 'bg-slate-800 border-slate-700'
      }`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              isGds 
                ? 'text-[#0b0c0c] hover:text-[#1d70b8] font-bold' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Planner
          </button>
          <div className="h-5 w-px bg-slate-600"></div>
          <div>
            <h1 className={`text-xl font-bold flex items-center gap-2 ${isGds ? 'text-[#0b0c0c]' : 'text-white'}`}>
              <FileText className="w-5 h-5 text-blue-400" />
              Prompt Editor
            </h1>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <div className="mr-2 flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            {saveStatus === 'saving' ? (
              <span className="text-amber-400 animate-pulse flex items-center gap-1">Saving...</span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved to LocalStorage
              </span>
            )}
          </div>

          <button
            onClick={handleExport}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              isGds
                ? 'bg-[#f3f2f1] text-[#0b0c0c] border-2 border-[#0b0c0c] hover:bg-[#e4e2e0]'
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600'
            }`}
            title="Export all prompts to a JSON file"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              isGds
                ? 'bg-[#f3f2f1] text-[#0b0c0c] border-2 border-[#0b0c0c] hover:bg-[#e4e2e0]'
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600'
            }`}
            title="Import prompts from a JSON backup file"
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>

          <button
            onClick={handleResetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800 rounded transition-colors"
            title="Reset all prompts to factory defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Navigation Sidebar / Tabs */}
        <div className={`w-72 border-r shrink-0 flex flex-col p-4 space-y-2 overflow-y-auto ${
          isGds ? 'bg-white border-[#b1b4b6]' : 'bg-slate-800/60 border-slate-700'
        }`}>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
            Prompt Templates
          </div>
          {PROMPT_TABS.map(tab => {
            const isActive = activeTab === tab.type;
            const isCustomized = prompts[tab.type] !== DEFAULT_PROMPTS[tab.type];
            return (
              <button
                key={tab.type}
                onClick={() => setActiveTab(tab.type)}
                className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-all ${
                  isActive
                    ? isGds 
                      ? 'bg-[#0b0c0c] text-white font-bold shadow-md'
                      : 'bg-blue-600 text-white font-semibold shadow-md'
                    : isGds
                      ? 'bg-[#f3f2f1] text-[#0b0c0c] hover:bg-[#e4e2e0] border border-[#b1b4b6]'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50'
                }`}
              >
                <div className={`mt-0.5 p-1.5 rounded ${isActive ? 'bg-white/20' : 'bg-slate-700/40'}`}>
                  {tab.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{tab.label}</span>
                    {isCustomized && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isActive ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        Edited
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-1 line-clamp-2 ${isActive ? 'text-slate-200' : 'text-slate-400'}`}>
                    {tab.shortDescription}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Editor Area */}
        <div className={`flex-1 flex flex-col p-6 overflow-y-auto space-y-4 ${
          isGds ? 'bg-[#f3f2f1]' : 'bg-slate-900'
        }`}>

          {/* Notification Toast */}
          {notification && (
            <div className={`p-3 rounded-lg flex items-center justify-between text-xs font-medium border ${
              notification.type === 'success' 
                ? 'bg-emerald-950/80 text-emerald-200 border-emerald-700' 
                : 'bg-rose-950/80 text-rose-200 border-rose-700'
            }`}>
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                <span>{notification.message}</span>
              </div>
            </div>
          )}

          {/* Prompt Header & Info */}
          <div className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
            isGds ? 'bg-white border-[#0b0c0c]' : 'bg-slate-800/80 border-slate-700'
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                  {currentTabInfo.icon}
                </span>
                <div>
                  <h2 className={`text-lg font-bold ${isGds ? 'text-[#0b0c0c]' : 'text-white'}`}>
                    {currentTabInfo.label}
                  </h2>
                  <p className={`text-xs ${isGds ? 'text-[#505a5f]' : 'text-slate-400'}`}>
                    {currentTabInfo.shortDescription}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isDefaultPrompt && (
                <span className="text-xs text-amber-400 font-mono bg-amber-950/40 border border-amber-800 px-2.5 py-1 rounded-md">
                  Customized
                </span>
              )}
              <button
                onClick={handleResetCurrent}
                disabled={isDefaultPrompt}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                  isDefaultPrompt 
                    ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500 border border-slate-700' 
                    : 'text-amber-300 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Prompt to Default
              </button>
            </div>
          </div>

          {/* Placeholders Card */}
          <div className={`p-4 rounded-xl border space-y-2 ${
            isGds ? 'bg-white border-[#b1b4b6]' : 'bg-slate-800/40 border-slate-700/60'
          }`}>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Info className="w-4 h-4 text-blue-400" />
              <span>Supported Placeholders (Click a tag to insert into template):</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {currentTabInfo.placeholders.map(p => (
                <button
                  key={p.tag}
                  onClick={() => insertPlaceholder(p.tag)}
                  className={`group relative text-xs font-mono px-2.5 py-1 rounded-md border transition-all flex items-center gap-1.5 ${
                    copiedTag === p.tag
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : isGds
                        ? 'bg-[#f3f2f1] text-[#0b0c0c] border-[#0b0c0c] hover:bg-[#ffdd00]'
                        : 'bg-slate-800 text-blue-300 border-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-500'
                  }`}
                  title={`Insert ${p.tag} - ${p.description}`}
                >
                  <span>{p.tag}</span>
                  {copiedTag === p.tag ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 opacity-40 group-hover:opacity-100" />}
                </button>
              ))}
            </div>
          </div>

          {/* Text Editor Container */}
          <div className="flex-1 flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center px-1 pb-2 text-xs font-mono text-slate-400">
              <span>Template Content</span>
              <span>{prompts[activeTab].length} characters | {prompts[activeTab].split('\n').length} lines</span>
            </div>
            <textarea
              ref={textareaRef}
              value={prompts[activeTab]}
              onChange={(e) => handlePromptChange(e.target.value)}
              spellCheck={false}
              className={`flex-1 w-full font-mono text-xs p-4 rounded-xl border outline-none resize-none leading-relaxed transition-all ${
                isGds
                  ? 'bg-white text-[#0b0c0c] border-2 border-[#0b0c0c] focus:ring-4 focus:ring-[#ffdd00]'
                  : 'bg-slate-950 text-slate-200 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              }`}
              placeholder="Enter custom prompt template here..."
            />
          </div>

        </div>

      </div>
    </div>
  );
};
