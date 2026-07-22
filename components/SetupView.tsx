import React, { useState, useEffect, useRef } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Plus, Trash2, Wand2, GripVertical, Play, Clock, FileText, ClipboardPaste, Upload, FileUp, ChevronDown, ChevronUp, X, Briefcase, ScanSearch, Loader2, Bug, Terminal, HelpCircle, Sparkles, MessageSquare, Settings, ToggleLeft, ToggleRight, KeyRound, Download, Printer } from 'lucide-react';
import { InterviewSection, InterviewProfile } from '../types';
import { Button } from './Button';
import { exportAsText, exportAsPdf } from '../utils/exportUtils';
import { 
  generateInterviewPlan, 
  parseInterviewNotes, 
  extractJobDetails, 
  regenerateSectionNotes,
  hasApiKey,
  setApiKey,
  AVAILABLE_MODELS,
  getSelectedModel,
  setSelectedModel,
  getStoredPrompts
} from '../services/geminiService';
import { ApiKeyModal } from './ApiKeyModal';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

interface SetupViewProps {
  sections: InterviewSection[];
  setSections: React.Dispatch<React.SetStateAction<InterviewSection[]>>;
  careerHistory: string;
  setCareerHistory: React.Dispatch<React.SetStateAction<string>>;
  onStart: () => void;
  onShowAbout: () => void;
  onShowPrompts: () => void;
}

const CIVIL_SERVICE_GRADES = [
  "Administrative Assistant (AA)",
  "Administrative Officer (AO)",
  "Executive Officer (EO)",
  "Higher Executive Officer (HEO)",
  "Senior Executive Officer (SEO)",
  "Grade 7",
  "Grade 6",
  "Senior Civil Service (SCS)",
  "Fast Stream"
];

const CIVIL_SERVICE_BEHAVIOURS = [
  "Seeing the Big Picture",
  "Changing and Improving",
  "Making Effective Decisions",
  "Leadership",
  "Communicating and Influencing",
  "Working Together",
  "Developing Self and Others",
  "Managing a Quality Service",
  "Delivering at Pace"
];

type LogEntry = {
  time: string;
  message: string;
  type: 'info' | 'error' | 'success';
};

type PromptType = 'PLAN' | 'REGEN' | 'INTRO' | 'EXTRACT' | 'FOLLOWUP';

export const SetupView: React.FC<SetupViewProps> = ({ 
  sections, 
  setSections, 
  careerHistory,
  setCareerHistory,
  onStart,
  onShowAbout,
  onShowPrompts
}) => {

  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExtractingJob, setIsExtractingJob] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [importText, setImportText] = useState('');
  const [jobAdvertText, setJobAdvertText] = useState('');
  const [isBehavioursOpen, setIsBehavioursOpen] = useState(false);
  const [isKnownQuestionsOpen, setIsKnownQuestionsOpen] = useState(false);
  const [isCustomGrade, setIsCustomGrade] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Regeneration State
  const [regeneratingSectionId, setRegeneratingSectionId] = useState<string | null>(null);
  const [regenerationFeedback, setRegenerationFeedback] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Debug State
  const [debugMode, setDebugMode] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Resizable Debug Panel
  const [debugHeight, setDebugHeight] = useState(320);
  const isResizing = useRef(false);

  const [profile, setProfile] = useState<InterviewProfile>({
    role: '',
    grade: '',
    department: '',
    interviewLength: '45 minutes',
    team: '',
    behaviours: [],
    techCompetencies: '',
    knownQuestions: ''
  });

  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requireApiKey = (action: () => void) => {
    if (hasApiKey()) {
      action();
    } else {
      setPendingAction(() => action);
      setShowApiKeyModal(true);
    }
  };

  const handleApiKeySave = (key: string) => {
    setApiKey(key || null);
    setShowApiKeyModal(false);
    if (pendingAction && key) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, message, type }]);
    if (type === 'error') console.error(message);
    else console.log(`[${type.toUpperCase()}] ${message}`);
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);
  
  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      // Calculate height from bottom (fixed bottom-24 is roughly 96px from bottom)
      const bottomOffset = 96; 
      const newHeight = window.innerHeight - e.clientY - bottomOffset;
      
      // Constraints
      if (newHeight > 150 && newHeight < window.innerHeight - 50) {
        setDebugHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = 'default';
    };

    if (debugMode) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [debugMode]);

  // Use jsdelivr for consistency with the main library import in index.html
  const WORKER_SRC = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

  useEffect(() => {
    try {
      const lib = pdfjsLib as any;
      const GlobalWorkerOptions = lib.GlobalWorkerOptions || lib.default?.GlobalWorkerOptions;
      if (GlobalWorkerOptions) {
        GlobalWorkerOptions.workerSrc = WORKER_SRC;
        addLog("Initial worker configuration successful", 'success');
      }
    } catch (e: any) {
      addLog(`Failed to init PDF worker: ${e.message}`, 'error');
    }
  }, []);

  const handleGenerate = () => {
    requireApiKey(async () => {
      if (!profile.role || !profile.grade) return;
      setIsGenerating(true);
      try {
        const fullProfile = { 
          ...profile, 
          careerHistory,
          jobAdvertContext: jobAdvertText
        };
        const newSections = await generateInterviewPlan(fullProfile, getStoredPrompts().PLAN);
        setSections(newSections);
      } catch (error) {
      console.error("Generate Plan Error:", error);
      alert("Failed to generate plan. Please check your API key or console for details.");
    } finally {
        setIsGenerating(false);
      }
    });
  };

  const handleImport = () => {
    requireApiKey(async () => {
      if (!importText.trim()) return;
      setIsImporting(true);
      try {
        const newSections = await parseInterviewNotes(importText);
        setSections(newSections);
        setImportText('');
      } catch (error) {
        alert("Failed to parse text. Please try again.");
      } finally {
        setIsImporting(false);
      }
    });
  };

  const handleRegenerateSection = (section: InterviewSection) => {
    requireApiKey(async () => {
      setIsRegenerating(true);
      try {
        const fullProfile = {
          ...profile,
          careerHistory,
          jobAdvertContext: jobAdvertText
        };
        
        // Check if this is the first section to apply the Intro prompt logic
        const index = sections.findIndex(s => s.id === section.id);
        const isFirstSection = index === 0;
        const storedPrompts = getStoredPrompts();
        const selectedTemplate = isFirstSection ? storedPrompts.INTRO : storedPrompts.REGEN;

        const newNotes = await regenerateSectionNotes(section, fullProfile, regenerationFeedback, selectedTemplate);
        updateSection(section.id, { notes: newNotes });
        setRegeneratingSectionId(null);
        setRegenerationFeedback('');
      } catch (error) {
        alert("Failed to regenerate notes. Please try again.");
      } finally {
        setIsRegenerating(false);
      }
    });
  };

  const handleJobAdvertExtract = () => {
    requireApiKey(async () => {
      if (!jobAdvertText.trim()) return;
      setIsExtractingJob(true);
      try {
        const storedPrompts = getStoredPrompts();
        const details = await extractJobDetails(jobAdvertText, storedPrompts.EXTRACT);
        
        setProfile(prev => {
          const existingBehaviours = new Set(prev.behaviours || []);
          if (details.behaviours) {
             details.behaviours.forEach(b => {
               const match = CIVIL_SERVICE_BEHAVIOURS.find(csb => csb.toLowerCase() === b.toLowerCase());
               existingBehaviours.add(match || b);
             });
          }
          
          return {
            ...prev,
            role: details.role || prev.role,
            grade: details.grade || prev.grade,
            department: details.department || prev.department,
            team: details.team || prev.team,
            techCompetencies: details.techCompetencies || prev.techCompetencies,
            behaviours: Array.from(existingBehaviours)
          };
        });

        if (details.behaviours && details.behaviours.length > 0) {
          setIsBehavioursOpen(true);
        }
        
        if (details.grade && !CIVIL_SERVICE_GRADES.includes(details.grade)) {
          setIsCustomGrade(true);
        }

      } catch (error) {
        alert("Failed to extract details from job advert.");
      } finally {
        setIsExtractingJob(false);
      }
    });
  };

  const readPdf = async (file: File): Promise<string> => {
    addLog(`Starting PDF Read: ${file.name}`, 'info');
    
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        addLog("PDF Operation Timed Out (15s)", 'error');
        reject(new Error("PDF processing timed out."));
      }, 15000);

      try {
        const arrayBuffer = await file.arrayBuffer();
        addLog(`ArrayBuffer loaded (${arrayBuffer.byteLength} bytes)`, 'success');
        
        const lib = pdfjsLib as any;
        const getDocument = lib.getDocument || lib.default?.getDocument;
        const GlobalWorkerOptions = lib.GlobalWorkerOptions || lib.default?.GlobalWorkerOptions;
        
        if (!getDocument) {
          throw new Error("PDF Engine (getDocument) not found.");
        }

        // Force worker source before loading
        if (GlobalWorkerOptions) {
           GlobalWorkerOptions.workerSrc = WORKER_SRC;
           addLog(`Worker URL forced to: ${WORKER_SRC}`, 'info');
        }

        const loadingTask = getDocument({
          data: arrayBuffer,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        addLog(`PDF Loaded. Pages: ${pdf.numPages}`, 'success');

        let fullText = '';
        let emptyPages = 0;
        
        for (let i = 1; i <= pdf.numPages; i++) {
          addLog(`Parsing Page ${i}...`, 'info');
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          addLog(`Page ${i} Items found: ${textContent.items.length}`, 'info');

          if (textContent.items.length === 0) {
            emptyPages++;
          }

          const pageText = textContent.items
            .map((item: any) => ('str' in item ? item.str : ''))
            .join(' ');
            
          fullText += pageText + '\n\n';
        }
        
        addLog(`Total raw text length: ${fullText.length}`, 'info');
        if (emptyPages === pdf.numPages && pdf.numPages > 0) {
           addLog("WARNING: All pages returned 0 text items. Likely scanned image.", 'error');
        }
        
        loadingTask.destroy();
        clearTimeout(timeoutId);
        resolve(fullText);

      } catch (e: any) {
        clearTimeout(timeoutId);
        addLog(`PDF ERROR: ${e.message}`, 'error');
        reject(new Error(e.message || "Failed to parse PDF"));
      }
    });
  };

  const handleFileRead = async (file: File, callback: (text: string) => void) => {
    setIsProcessingFile(true);
    addLog(`File selected: ${file.name} (${file.type})`, 'info');
    
    const fileName = file.name.toLowerCase();
    
    try {
      let text = '';
      if (fileName.endsWith('.docx')) {
        addLog("Processing as DOCX", 'info');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
        addLog("DOCX extraction successful", 'success');
      } else if (fileName.endsWith('.pdf')) {
        addLog("Processing as PDF", 'info');
        text = await readPdf(file);
      } else {
        addLog("Processing as Plain Text", 'info');
        text = await file.text();
        addLog("Text read successful", 'success');
      }

      const trimmed = text.trim();
      if (!trimmed) {
        addLog("Resulting text is empty", 'error');
        if (fileName.endsWith('.pdf')) {
           alert("The PDF content appears empty. If this is a scanned document (images only), text extraction will not work. Please try a native PDF or text file.");
        } else {
           alert("The document content appears to be empty.");
        }
      } else {
        callback(text);
        addLog(`Content successfully updated. (${trimmed.length} chars)`, 'success');
      }

    } catch (err: any) {
      addLog(`Main Error Handler: ${err.message}`, 'error');
      alert(`Error reading file: ${err.message}`);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const toggleBehaviour = (behaviour: string) => {
    setProfile(prev => {
      const current = prev.behaviours || [];
      if (current.includes(behaviour)) {
        return { ...prev, behaviours: current.filter(b => b !== behaviour) };
      } else {
        return { ...prev, behaviours: [...current, behaviour] };
      }
    });
  };

  const addSection = () => {
    setSections([
      ...sections,
      {
        id: crypto.randomUUID(),
        title: 'New Section',
        questionText: '',
        notes: '- Key point 1\n- Key point 2',
        durationMinutes: 5
      }
    ]);
  };

  const updateSection = (id: string, updates: Partial<InterviewSection>) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;
    
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index + (direction === 'up' ? -1 : 1)];
    newSections[index + (direction === 'up' ? -1 : 1)] = temp;
    setSections(newSections);
  };
  
  // Theme styling helpers
  const cardClass = "govuk-!-padding-6 govuk-!-margin-bottom-4" + " border-2 border-[#b1b4b6] space-y-4 bg-white";
  
  const inputClass = "govuk-input";
    
  const textAreaClass = "govuk-textarea";

  return (
    <div className="govuk-width-container govuk-!-margin-top-6 govuk-!-margin-bottom-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 govuk-!-margin-bottom-6">
        <div className="space-y-2">
          <h1 className="govuk-heading-xl govuk-!-margin-bottom-2">Interview Planner</h1>
          <p className="govuk-body-l text-[#505a5f]">Setup your mock interview structure manually, import existing notes, or let Gemini AI build a plan for you.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button 
            onClick={() => setShowApiKeyModal(true)}
            className="govuk-button govuk-button--secondary govuk-!-margin-bottom-0 flex items-center gap-2"
          >
            <KeyRound className="w-5 h-5" />
            API Key
          </button>
          <button 
            onClick={onShowPrompts}
            className="govuk-button govuk-button--secondary govuk-!-margin-bottom-0 flex items-center gap-2"
          >
            <Settings className="w-5 h-5" />
            Prompt Settings
          </button>
          <button 
            onClick={onShowAbout}
            className="govuk-button govuk-button--secondary govuk-!-margin-bottom-0 flex items-center gap-2"
          >
            <HelpCircle className="w-5 h-5" />
            About / Help
          </button>
        </div>
      </header>

      {/* Context Grid */}
      <div className="govuk-grid-row">
        
        {/* Job Advert Context */}
        <div className="govuk-grid-column-one-half">
         <div className={cardClass + " flex flex-col h-full min-h-[300px]"}>
           <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-2">
               <Briefcase className="w-5 h-5" />
               <h2 className="govuk-heading-m govuk-!-margin-bottom-0">Job Advert Context</h2>
             </div>
             {isProcessingFile && <div className="flex items-center gap-2 text-xs text-[#505a5f]"><Loader2 className="w-3 h-3 animate-spin"/> Processing...</div>}
           </div>
           
           <p className="govuk-body govuk-!-font-size-16">Paste job description (PDF/Text) to auto-fill details.</p>
           <div className="flex-1 flex gap-4 items-start relative govuk-!-margin-bottom-2">
             <div className="govuk-form-group flex-1 h-full mb-0">
               <textarea 
                 className={textAreaClass + " h-full"}
                 placeholder="Paste job advert text here..."
                 value={jobAdvertText}
                 onChange={e => setJobAdvertText(e.target.value)}
                 disabled={isProcessingFile}
                 rows={5}
               />
             </div>
             <div className="shrink-0 flex flex-col gap-2">
               <label className={`flex flex-col items-center justify-center w-12 h-12 border-2 transition-colors bg-white border-[#0b0c0c] ${isProcessingFile ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#f3f2f1]'}`} title="Upload File">
                 {isProcessingFile ? <Loader2 className="w-5 h-5 animate-spin text-[#505a5f]" /> : <Upload className="w-5 h-5 text-[#0b0c0c]" />}
                 <input 
                   type="file" 
                   className="hidden" 
                   accept=".txt,.md,.json,.docx,.pdf" 
                   disabled={isProcessingFile}
                   onChange={(e) => {
                     if(e.target.files?.[0]) handleFileRead(e.target.files[0], setJobAdvertText);
                     e.target.value = '';
                   }} 
                 />
               </label>
             </div>
           </div>
           <button 
             className="govuk-button govuk-button--secondary govuk-!-margin-bottom-0 w-full flex justify-center items-center gap-2"
             onClick={handleJobAdvertExtract} 
             disabled={!jobAdvertText.trim() || isProcessingFile} 
           >
             {isExtractingJob ? <Loader2 className="w-4 h-4 animate-spin"/> : <ScanSearch className="w-4 h-4"/>}
             Auto-fill from Advert
           </button>
         </div>
        </div>

        {/* Career History Context */}
        <div className="govuk-grid-column-one-half">
         <div className={cardClass + " flex flex-col h-full min-h-[300px]"}>
           <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-2">
               <FileUp className="w-5 h-5" />
               <h2 className="govuk-heading-m govuk-!-margin-bottom-0">Career Context</h2>
             </div>
             {isProcessingFile && <div className="flex items-center gap-2 text-xs text-[#505a5f]"><Loader2 className="w-3 h-3 animate-spin"/> Processing...</div>}
           </div>

           <p className="govuk-body govuk-!-font-size-16">Upload CV/History to generate specific STAR examples.</p>
           <div className="flex-1 flex gap-4 items-start relative govuk-!-margin-bottom-2">
             <div className="govuk-form-group flex-1 h-full mb-0">
               <textarea 
                 className={textAreaClass + " h-full"}
                 placeholder="Paste career history here..."
                 value={careerHistory}
                 onChange={e => setCareerHistory(e.target.value)}
                 disabled={isProcessingFile}
                 rows={5}
               />
             </div>
             <div className="shrink-0">
               <label className={`flex flex-col items-center justify-center w-12 h-12 border-2 transition-colors bg-white border-[#0b0c0c] ${isProcessingFile ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#f3f2f1]'}`} title="Upload File">
                 {isProcessingFile ? <Loader2 className="w-5 h-5 animate-spin text-[#505a5f]" /> : <Upload className="w-5 h-5 text-[#0b0c0c]" />}
                 <input 
                   type="file" 
                   className="hidden" 
                   accept=".txt,.md,.json,.docx,.pdf" 
                   disabled={isProcessingFile}
                   onChange={(e) => {
                     if(e.target.files?.[0]) handleFileRead(e.target.files[0], setCareerHistory);
                     e.target.value = '';
                   }} 
                 />
               </label>
             </div>
           </div>
         </div>
        </div>
      </div>

      <div className="govuk-grid-row">
        {/* AI Generator Panel */}
        <div className="govuk-grid-column-one-half">
         <div className={cardClass + " h-full"}>
          <div className="flex items-center gap-2 mb-2">
            <Wand2 className="w-5 h-5" />
            <h2 className="govuk-heading-m govuk-!-margin-bottom-0">AI Plan Generator</h2>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Role (e.g., Policy Advisor)"
              className={inputClass}
              value={profile.role}
              onChange={e => setProfile({...profile, role: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                {isCustomGrade ? (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Specify Grade"
                      className={inputClass}
                      value={profile.grade}
                      onChange={e => setProfile({...profile, grade: e.target.value})}
                      autoFocus
                    />
                    <button
                        onClick={() => {
                          setIsCustomGrade(false);
                          setProfile({...profile, grade: ''});
                        }}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                        title="Cancel custom grade"
                    >
                      <X className="w-5 h-5"/>
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      className={`${inputClass} appearance-none cursor-pointer`}
                      value={profile.grade}
                      onChange={(e) => {
                        if (e.target.value === 'OTHER_CUSTOM') {
                          setIsCustomGrade(true);
                          setProfile({...profile, grade: ''});
                        } else {
                          setProfile({...profile, grade: e.target.value});
                        }
                      }}
                    >
                      <option value="" disabled>Select Grade</option>
                      {CIVIL_SERVICE_GRADES.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                      <option value="OTHER_CUSTOM">Other (Specify...)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                )}
              </div>

              <input
                type="text"
                placeholder="Dept (Optional)"
                className={inputClass}
                value={profile.department}
                onChange={e => setProfile({...profile, department: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Length (e.g. 45 mins)"
                className={inputClass}
                value={profile.interviewLength}
                onChange={e => setProfile({...profile, interviewLength: e.target.value})}
              />
              <input
                type="text"
                placeholder="Team/Div (Optional)"
                className={inputClass}
                value={profile.team}
                onChange={e => setProfile({...profile, team: e.target.value})}
              />
            </div>

            {/* Known Questions Foldout */}
            <div className="govuk-details" data-module="govuk-details">
               <summary className="govuk-details__summary" onClick={() => setIsKnownQuestionsOpen(!isKnownQuestionsOpen)}>
                 <span className="govuk-details__summary-text">
                   Known Questions (Optional)
                 </span>
               </summary>
               
               {isKnownQuestionsOpen && (
                 <div className="govuk-details__text bg-white">
                   <p className="govuk-body govuk-!-font-size-14 govuk-!-margin-bottom-2 text-[#505a5f]">Paste any pre-seen questions here. The generator will prioritise these over generic behavioural questions.</p>
                   <div className="govuk-form-group mb-0">
                     <textarea
                        className={textAreaClass}
                        style={{height: '6rem'}}
                        placeholder="1. Tell us about a time you..."
                        value={profile.knownQuestions}
                        onChange={e => setProfile({...profile, knownQuestions: e.target.value})}
                     />
                   </div>
                 </div>
               )}
            </div>

            {/* Advanced Options Foldout */}
            <div className="govuk-details" data-module="govuk-details">
               <summary className="govuk-details__summary" onClick={() => setIsBehavioursOpen(!isBehavioursOpen)}>
                 <span className="govuk-details__summary-text">
                   Behaviours & Competencies
                 </span>
               </summary>
               
               {isBehavioursOpen && (
                 <div className="govuk-details__text bg-white space-y-4">
                   <div className="govuk-form-group mb-0">
                     <label className="govuk-label govuk-!-font-weight-bold">Technical Competencies</label>
                     <textarea
                        className={textAreaClass}
                        style={{height: '5rem'}}
                        placeholder="E.g., Financial Analysis, Python, Policy drafting..."
                        value={profile.techCompetencies}
                        onChange={e => setProfile({...profile, techCompetencies: e.target.value})}
                     />
                   </div>

                   <div className="govuk-form-group mb-0">
                     <label className="govuk-label govuk-!-font-weight-bold">Behaviours (Select 3-4)</label>
                     <div className="govuk-checkboxes govuk-checkboxes--small max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                       {CIVIL_SERVICE_BEHAVIOURS.map(behaviour => (
                         <div key={behaviour} className="govuk-checkboxes__item">
                           <input 
                             type="checkbox"
                             checked={profile.behaviours?.includes(behaviour)}
                             onChange={() => toggleBehaviour(behaviour)}
                             className="govuk-checkboxes__input"
                             id={`behaviour-${behaviour}`}
                           />
                           <label className="govuk-label govuk-checkboxes__label" htmlFor={`behaviour-${behaviour}`}>
                             {behaviour}
                           </label>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               )}
            </div>

            <button 
              onClick={handleGenerate} 
              disabled={!profile.role || !profile.grade}
              className="govuk-button w-full"
            >
              Generate Interview Plan
            </button>
          </div>
         </div>
        </div>

        {/* Import Panel */}
        <div className="govuk-grid-column-one-half">
         <div className={cardClass + " h-full"}>
          <div className="flex items-center gap-2 mb-2">
            <ClipboardPaste className="w-5 h-5" />
            <h2 className="govuk-heading-m govuk-!-margin-bottom-0">Import from Text</h2>
          </div>
          <div className="space-y-3 flex flex-col h-[calc(100%-2rem)]">
            <textarea 
              className={`${textAreaClass} flex-1 min-h-[150px]`}
              placeholder={`Paste your entire plan here...\ne.g.\nIntro (2 mins): Hi I'm...\n\nBehaviour 1 (5 mins): Situation...`}
              value={importText}
              onChange={e => setImportText(e.target.value)}
            />
            <Button 
              onClick={handleImport} 
              disabled={!importText.trim()}
              isLoading={isImporting}
              className="govuk-button govuk-button--secondary w-full"
            >
              Parse & Import Text
            </Button>
          </div>
         </div>
        </div>
      </div>

      {/* Section List */}
      <div className="govuk-!-margin-top-8 space-y-4">
        <div className="flex justify-between items-center govuk-!-margin-bottom-4">
          <h2 className="govuk-heading-l govuk-!-margin-bottom-0">Interview Sections</h2>
          <div className="flex items-center gap-2 relative">
            {sections.length > 0 && (
              <div className="relative">
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)} 
                  className="govuk-button govuk-button--secondary govuk-!-margin-bottom-0 flex items-center gap-1"
                >
                  <Download className="w-4 h-4"/>
                  Export Notes
                  <ChevronDown className="w-3 h-3 ml-1" />
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border-2 border-[#0b0c0c] z-30 p-2 space-y-1 shadow-xl">
                    <button
                      onClick={() => {
                        exportAsPdf(sections, profile);
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors text-left hover:bg-[#f3f2f1] text-[#0b0c0c]"
                    >
                      <Printer className="w-4 h-4 text-[#1d70b8]" />
                      <span>Export as PDF / Printable</span>
                    </button>

                    <button
                      onClick={() => {
                        exportAsText(sections, profile);
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors text-left hover:bg-[#f3f2f1] text-[#0b0c0c]"
                    >
                      <FileText className="w-4 h-4 text-[#00703c]" />
                      <span>Export as Text File (.txt)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <button onClick={addSection} className="govuk-button govuk-button--secondary govuk-!-margin-bottom-0 flex items-center gap-1">
              <Plus className="w-4 h-4"/>
              Add Section
            </button>
          </div>
        </div>

        {sections.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-[#b1b4b6] text-[#505a5f]">
            <p>No sections added yet. Generate a plan, import text, or add manually.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sections.map((section, index) => (
              <div key={section.id} className="bg-white p-4 border-l-4 border-[#1d70b8] border-y border-r border-y-[#b1b4b6] border-r-[#b1b4b6] group">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col gap-1 pt-2 text-[#505a5f]">
                    <button onClick={() => moveSection(index, 'up')} className="hover:text-[#1d70b8] disabled:opacity-30" disabled={index===0}>▲</button>
                    <GripVertical className="w-5 h-5 cursor-grab active:cursor-grabbing" />
                    <button onClick={() => moveSection(index, 'down')} className="hover:text-[#1d70b8] disabled:opacity-30" disabled={index===sections.length-1}>▼</button>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1 govuk-form-group mb-0">
                        <label className="govuk-label govuk-!-font-weight-bold">Section Title</label>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => updateSection(section.id, { title: e.target.value })}
                          className="govuk-input"
                          placeholder="e.g., Leadership Behaviour"
                        />
                      </div>
                      <div className="w-32 govuk-form-group mb-0">
                        <label className="govuk-label govuk-!-font-weight-bold flex items-center gap-1">
                          <Clock className="w-4 h-4"/> Mins
                        </label>
                        <input
                          type="number"
                          value={section.durationMinutes}
                          onChange={(e) => updateSection(section.id, { durationMinutes: Number(e.target.value) })}
                          className="govuk-input"
                          min="1"
                        />
                      </div>
                    </div>
                    
                    <div className="govuk-form-group mb-0">
                        <label className="govuk-label govuk-!-font-weight-bold flex items-center gap-1">
                          <HelpCircle className="w-4 h-4"/> Question Text (Optional)
                        </label>
                        <input
                          type="text"
                          value={section.questionText || ''}
                          onChange={(e) => updateSection(section.id, { questionText: e.target.value })}
                          className="govuk-input"
                          placeholder="e.g. 'Tell me about a time you had to deliver a difficult message...'"
                        />
                    </div>

                    <div className="govuk-form-group mb-0">
                      <div className="flex justify-between items-end mb-2">
                        <label className="govuk-label govuk-!-font-weight-bold govuk-!-margin-bottom-0 flex items-center gap-1">
                          <FileText className="w-4 h-4"/> Notes / Script
                        </label>
                        
                        <button
                          className="govuk-button govuk-button--secondary govuk-!-margin-bottom-0 govuk-!-font-size-14 govuk-!-padding-1 flex items-center gap-1"
                          onClick={() => {
                             if (regeneratingSectionId === section.id) {
                               setRegeneratingSectionId(null);
                             } else {
                               setRegeneratingSectionId(section.id);
                               setRegenerationFeedback('');
                             }
                          }}
                          disabled={isRegenerating}
                        >
                          <Sparkles className="w-4 h-4"/> AI Regenerate
                        </button>
                      </div>
                      
                      {regeneratingSectionId === section.id && (
                        <div className="mb-4 p-4 bg-[#f3f2f1] border-l-4 border-[#1d70b8]">
                           <div className="flex flex-col gap-2">
                             <label className="govuk-label govuk-!-font-size-16">Instructions for AI (e.g. "Focus more on the result", "Use a different example"):</label>
                             <textarea 
                               className="govuk-textarea"
                               rows={2}
                               placeholder="Make it punchier..."
                               value={regenerationFeedback}
                               onChange={e => setRegenerationFeedback(e.target.value)}
                             />
                             <div className="flex gap-2">
                               <button 
                                 className="govuk-button govuk-button--secondary govuk-!-margin-bottom-0"
                                 onClick={() => setRegeneratingSectionId(null)}
                               >
                                 Cancel
                               </button>
                               <button 
                                 className="govuk-button govuk-!-margin-bottom-0"
                                 onClick={() => handleRegenerateSection(section)}
                                 disabled={isRegenerating}
                               >
                                 Generate New Notes
                               </button>
                             </div>
                           </div>
                        </div>
                      )}

                      <div data-color-mode="light" className="govuk-!-margin-bottom-2">
                        <MDEditor
                          value={section.notes}
                          onChange={(val) => updateSection(section.id, { notes: val || '' })}
                          preview="edit"
                          hideToolbar={false}
                          height={250}
                          className="border border-[#b1b4b6]"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => removeSection(section.id)}
                    className="p-2 text-[#d4351c] hover:bg-[#f3f2f1] transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#f3f2f1] border-t-2 border-[#b1b4b6] flex flex-col gap-2 items-center justify-center z-50">
        <button 
          onClick={onStart} 
          disabled={sections.length === 0}
          className="govuk-button govuk-!-margin-bottom-0 w-full max-w-md text-lg py-3 flex justify-center items-center gap-2"
        >
          <Play className="w-6 h-6 fill-current" />
          Start Mock Interview
        </button>
        <div className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer hover:text-slate-800 select-none" onClick={() => setDebugMode(!debugMode)}>
           <div className={`w-3 h-3 rounded-full border ${debugMode ? 'bg-green-500 border-green-600' : 'bg-transparent border-slate-400'}`}></div>
           Debug & Settings
        </div>
      </div>

      {/* Debug Console & Prompt Editor */}
      {debugMode && (
        <div 
          className="fixed bottom-24 left-4 right-4 bg-slate-900 rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col border border-slate-700"
          style={{ height: `${debugHeight}px` }}
        >
           {/* Resize Handle */}
           <div 
             className="h-3 bg-slate-800 cursor-ns-resize flex items-center justify-center hover:bg-slate-700 transition-colors border-b border-slate-700"
             onMouseDown={(e) => {
               isResizing.current = true;
               document.body.style.cursor = 'ns-resize';
               e.preventDefault(); 
             }}
           >
             <div className="w-12 h-1 bg-slate-600 rounded-full"></div>
           </div>

           <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 text-slate-300 text-xs font-mono">
                 <Terminal className="w-4 h-4"/>
                 Debug Console
               </div>
               <div className="h-4 w-px bg-slate-600"></div>
               <button 
                 onClick={onShowPrompts}
                 className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1"
               >
                 <Settings className="w-3 h-3" /> Open Prompt Editor Page
               </button>
               <div className="h-4 w-px bg-slate-600"></div>
               <div className="flex items-center gap-1.5 text-xs text-slate-300">
                 <span>Model:</span>
                 <select
                   value={getSelectedModel()}
                   onChange={(e) => {
                     setSelectedModel(e.target.value);
                     setLogs(prev => [...prev, `[SYSTEM] Model set to ${e.target.value}`]);
                   }}
                   className="bg-slate-700 text-slate-100 text-xs rounded px-2 py-0.5 border border-slate-600 outline-none focus:ring-1 focus:ring-blue-400"
                 >
                   {AVAILABLE_MODELS.map(m => (
                     <option key={m.id} value={m.id}>{m.id}</option>
                   ))}
                 </select>
               </div>
             </div>
             <div className="flex gap-2">
                <button onClick={() => setLogs([])} className="text-xs text-slate-400 hover:text-white">Clear Logs</button>
                <button onClick={() => setDebugMode(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4"/></button>
             </div>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-xs">
             {logs.length === 0 && <span className="text-slate-600 italic">No logs yet. Try uploading a file.</span>}
             {logs.map((log, i) => (
               <div key={i} className={`flex gap-3 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-slate-300'}`}>
                 <span className="text-slate-600 shrink-0">[{log.time}]</span>
                 <span>{log.message}</span>
               </div>
             ))}
             <div ref={logsEndRef} />
           </div>
        </div>
      )}
      {showApiKeyModal && (
        <ApiKeyModal 
          onClose={() => {
            setShowApiKeyModal(false);
            setPendingAction(null);
          }}
          onSave={handleApiKeySave}
        />
      )}
    </div>
  );
};