import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Wand2, GripVertical, Play, Clock, FileText, ClipboardPaste, Upload, FileUp, ChevronDown, ChevronUp, X, Briefcase, ScanSearch, Loader2, Bug, Terminal, HelpCircle, Sparkles, MessageSquare, Settings, ToggleLeft, ToggleRight, KeyRound, Download, Printer } from 'lucide-react';
import { InterviewSection, InterviewProfile, Theme } from '../types';
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
  theme: Theme;
  toggleTheme: () => void;
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
  onShowPrompts,
  theme,
  toggleTheme
}) => {
  const isGds = theme === 'GDS';
  
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
        const selectedTemplate = isFirstSection ? prompts.INTRO : prompts.REGEN;

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
        const details = await extractJobDetails(jobAdvertText, prompts.EXTRACT);
        
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
  const cardClass = isGds 
    ? "bg-white p-6 border-2 border-[#b1b4b6] space-y-4 rounded-none" 
    : "bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4";
  
  const inputClass = isGds
    ? "w-full px-4 py-2 border-2 border-[#0b0c0c] focus:outline-none focus:ring-4 focus:ring-[#ffdd00] focus:ring-offset-2 bg-white text-[#0b0c0c] rounded-none font-sans"
    : "w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900";
    
  const textAreaClass = isGds
    ? "w-full px-4 py-2 border-2 border-[#0b0c0c] focus:outline-none focus:ring-4 focus:ring-[#ffdd00] focus:ring-offset-2 bg-white text-[#0b0c0c] rounded-none font-sans"
    : "w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none resize-none text-sm bg-white text-slate-900";

  return (
    <div className={`w-full max-w-7xl mx-auto p-6 space-y-8 pb-48 ${isGds ? 'font-sans text-[#0b0c0c]' : ''}`}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <h1 className={`text-3xl md:text-4xl font-bold tracking-tight ${isGds ? 'text-[#0b0c0c]' : 'text-slate-900'}`}>Interview Planner</h1>
          <p className={`${isGds ? 'text-[#505a5f] text-lg' : 'text-slate-500'}`}>Setup your mock interview structure manually, import existing notes, or let Gemini AI build a plan for you.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button 
            onClick={() => setShowApiKeyModal(true)}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium transition-colors ${
              isGds 
                ? 'bg-[#f3f2f1] text-[#0b0c0c] border-2 border-[#0b0c0c] font-bold hover:bg-[#e4e2e0] shadow-[0_2px_0_#0b0c0c] focus:ring-4 focus:ring-[#ffdd00]' 
                : 'bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50'
            }`}
          >
            <KeyRound className="w-5 h-5" />
            API Key
          </button>
          <button 
            onClick={onShowPrompts}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium transition-colors ${
              isGds 
                ? 'bg-[#f3f2f1] text-[#0b0c0c] border-2 border-[#0b0c0c] font-bold hover:bg-[#e4e2e0] shadow-[0_2px_0_#0b0c0c] focus:ring-4 focus:ring-[#ffdd00]' 
                : 'bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50'
            }`}
          >
            <Settings className="w-5 h-5 text-blue-500" />
            Prompt Settings
          </button>
          <button 
            onClick={onShowAbout}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium transition-colors ${
              isGds 
                ? 'bg-[#f3f2f1] text-[#0b0c0c] border-2 border-[#0b0c0c] font-bold hover:bg-[#e4e2e0] shadow-[0_2px_0_#0b0c0c] focus:ring-4 focus:ring-[#ffdd00]' 
                : 'bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50'
            }`}
          >
            <HelpCircle className="w-5 h-5" />
            About / Help
          </button>
          <button 
            onClick={toggleTheme}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium transition-colors ${
              isGds 
                ? 'bg-[#00703c] text-white font-bold hover:bg-[#005a30] shadow-[0_2px_0_#002d18] focus:ring-4 focus:ring-[#ffdd00]' 
                : 'bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50'
            }`}
          >
            {isGds ? <ToggleRight className="w-5 h-5 text-[#ffdd00]" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
            {isGds ? 'GOV.UK-ish Theme Active' : 'Switch to GOV.UK-ish Theme'}
          </button>
        </div>
      </header>

      {/* Context Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Job Advert Context */}
        <div className={`${cardClass} flex flex-col h-full min-h-[300px]`}>
           <div className="flex items-center justify-between mb-2">
             <div className={`flex items-center gap-2 font-semibold ${isGds ? 'text-[#0b0c0c] text-xl' : 'text-violet-600'}`}>
               <Briefcase className="w-5 h-5" />
               <h2>Job Advert Context</h2>
             </div>
             {isProcessingFile && <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="w-3 h-3 animate-spin"/> Processing...</div>}
           </div>
           
           <p className={`text-sm ${isGds ? 'text-[#0b0c0c]' : 'text-slate-500'}`}>Paste job description (PDF/Text) to auto-fill details.</p>
           <div className="flex-1 flex gap-4 items-start relative">
             <div className="flex-1 h-full">
               <textarea 
                 className={`${textAreaClass} h-full`}
                 placeholder="Paste job advert text here..."
                 value={jobAdvertText}
                 onChange={e => setJobAdvertText(e.target.value)}
                 disabled={isProcessingFile}
               />
             </div>
             <div className="shrink-0 flex flex-col gap-2">
               <label className={`flex flex-col items-center justify-center w-12 h-12 border transition-colors bg-white ${isGds ? 'border-[#0b0c0c]' : 'border-slate-200 rounded-lg'} ${isProcessingFile ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'}`} title="Upload File">
                 {isProcessingFile ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : <Upload className="w-5 h-5 text-slate-400" />}
                 <input 
                   type="file" 
                   className="hidden" 
                   accept=".txt,.md,.json,.docx,.pdf" 
                   disabled={isProcessingFile}
                   onChange={(e) => {
                     if(e.target.files?.[0]) handleFileRead(e.target.files[0], setJobAdvertText);
                     e.target.value = ''; // Reset to allow same file selection again
                   }} 
                 />
               </label>
             </div>
           </div>
           <Button 
             onClick={handleJobAdvertExtract} 
             disabled={!jobAdvertText.trim() || isProcessingFile} 
             isLoading={isExtractingJob}
             variant="secondary"
             className="w-full text-xs"
             icon={<ScanSearch className="w-4 h-4"/>}
             theme={theme}
           >
             Auto-fill from Advert
           </Button>
        </div>

        {/* Career History Context */}
        <div className={`${cardClass} flex flex-col h-full min-h-[300px]`}>
           <div className="flex items-center justify-between mb-2">
             <div className={`flex items-center gap-2 font-semibold ${isGds ? 'text-[#0b0c0c] text-xl' : 'text-emerald-600'}`}>
               <FileUp className="w-5 h-5" />
               <h2>Career Context</h2>
             </div>
             {isProcessingFile && <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="w-3 h-3 animate-spin"/> Processing...</div>}
           </div>

           <p className={`text-sm ${isGds ? 'text-[#0b0c0c]' : 'text-slate-500'}`}>Upload CV/History to generate specific STAR examples.</p>
           <div className="flex-1 flex gap-4 items-start relative">
             <div className="flex-1 h-full">
               <textarea 
                 className={`${textAreaClass} h-full`}
                 placeholder="Paste career history here..."
                 value={careerHistory}
                 onChange={e => setCareerHistory(e.target.value)}
                 disabled={isProcessingFile}
               />
             </div>
             <div className="shrink-0">
               <label className={`flex flex-col items-center justify-center w-12 h-12 border transition-colors bg-white ${isGds ? 'border-[#0b0c0c]' : 'border-slate-200 rounded-lg'} ${isProcessingFile ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'}`} title="Upload File">
                 {isProcessingFile ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : <Upload className="w-5 h-5 text-slate-400" />}
                 <input 
                   type="file" 
                   className="hidden" 
                   accept=".txt,.md,.json,.docx,.pdf" 
                   disabled={isProcessingFile}
                   onChange={(e) => {
                     if(e.target.files?.[0]) handleFileRead(e.target.files[0], setCareerHistory);
                     e.target.value = ''; // Reset
                   }} 
                 />
               </label>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Generator Panel */}
        <div className={`${cardClass} h-full`}>
          <div className={`flex items-center gap-2 font-semibold mb-2 ${isGds ? 'text-[#0b0c0c] text-xl' : 'text-blue-600'}`}>
            <Wand2 className="w-5 h-5" />
            <h2>AI Plan Generator</h2>
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
            <div className={`overflow-hidden ${isGds ? 'border-2 border-[#0b0c0c]' : 'border border-slate-200 rounded-lg'}`}>
               <button 
                 onClick={() => setIsKnownQuestionsOpen(!isKnownQuestionsOpen)}
                 className={`w-full px-4 py-2 flex justify-between items-center text-sm font-medium transition-colors ${isGds ? 'bg-[#f3f2f1] hover:bg-[#e4e2e0] text-[#0b0c0c]' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
               >
                 <span className="flex items-center gap-2"><HelpCircle className={`w-4 h-4 ${isGds ? 'text-[#0b0c0c]' : 'text-indigo-500'}`}/> Known Questions (Optional)</span>
                 {isKnownQuestionsOpen ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
               </button>
               
               {isKnownQuestionsOpen && (
                 <div className={`p-4 bg-white ${isGds ? 'border-t-2 border-[#0b0c0c]' : 'border-t border-slate-200'}`}>
                   <p className="text-xs text-slate-500 mb-2">Paste any pre-seen questions here. The generator will prioritise these over generic behavioural questions.</p>
                   <textarea
                      className={textAreaClass}
                      style={{height: '6rem'}}
                      placeholder="1. Tell us about a time you..."
                      value={profile.knownQuestions}
                      onChange={e => setProfile({...profile, knownQuestions: e.target.value})}
                   />
                 </div>
               )}
            </div>

            {/* Advanced Options Foldout */}
            <div className={`overflow-hidden ${isGds ? 'border-2 border-[#0b0c0c]' : 'border border-slate-200 rounded-lg'}`}>
               <button 
                 onClick={() => setIsBehavioursOpen(!isBehavioursOpen)}
                 className={`w-full px-4 py-2 flex justify-between items-center text-sm font-medium transition-colors ${isGds ? 'bg-[#f3f2f1] hover:bg-[#e4e2e0] text-[#0b0c0c]' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
               >
                 <span>Behaviours & Competencies</span>
                 {isBehavioursOpen ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
               </button>
               
               {isBehavioursOpen && (
                 <div className={`p-4 bg-white space-y-4 ${isGds ? 'border-t-2 border-[#0b0c0c]' : 'border-t border-slate-200'}`}>
                   <div>
                     <span className={`text-xs font-semibold uppercase block mb-2 ${isGds ? 'text-[#0b0c0c]' : 'text-slate-500'}`}>Technical Competencies</span>
                     <textarea
                        className={textAreaClass}
                        style={{height: '5rem'}}
                        placeholder="E.g., Financial Analysis, Python, Policy drafting..."
                        value={profile.techCompetencies}
                        onChange={e => setProfile({...profile, techCompetencies: e.target.value})}
                     />
                   </div>

                   <div>
                     <span className={`text-xs font-semibold uppercase block mb-2 ${isGds ? 'text-[#0b0c0c]' : 'text-slate-500'}`}>Behaviours (Select 3-4)</span>
                     <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                       {CIVIL_SERVICE_BEHAVIOURS.map(behaviour => (
                         <label key={behaviour} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:text-slate-900">
                           <input 
                             type="checkbox"
                             checked={profile.behaviours?.includes(behaviour)}
                             onChange={() => toggleBehaviour(behaviour)}
                             className={`rounded ${isGds ? 'border-2 border-[#0b0c0c] text-[#0b0c0c] focus:ring-[#ffdd00]' : 'border-slate-300 text-blue-600 focus:ring-blue-500'}`}
                           />
                           {behaviour}
                         </label>
                       ))}
                     </div>
                   </div>
                 </div>
               )}
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={!profile.role || !profile.grade}
              isLoading={isGenerating}
              className="w-full"
              theme={theme}
            >
              Generate Interview Plan
            </Button>
          </div>
        </div>

        {/* Import Panel */}
        <div className={`${cardClass} h-full`}>
          <div className={`flex items-center gap-2 font-semibold mb-2 ${isGds ? 'text-[#0b0c0c] text-xl' : 'text-indigo-600'}`}>
            <ClipboardPaste className="w-5 h-5" />
            <h2>Import from Text</h2>
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
              className={`w-full ${isGds ? '' : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'}`}
              theme={theme}
              variant={isGds ? 'primary' : 'primary'} // Override for non-GDS specific color logic inside Button component
            >
              Parse & Import Text
            </Button>
          </div>
        </div>
      </div>

      {/* Section List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className={`text-xl font-semibold ${isGds ? 'text-[#0b0c0c]' : 'text-slate-800'}`}>Interview Sections</h2>
          <div className="flex items-center gap-2 relative">
            {sections.length > 0 && (
              <div className="relative">
                <Button 
                  onClick={() => setShowExportMenu(!showExportMenu)} 
                  variant="outline" 
                  icon={<Download className="w-4 h-4"/>} 
                  theme={theme}
                  className="text-xs"
                >
                  Export Notes
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>

                {showExportMenu && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-lg shadow-xl z-30 p-2 space-y-1 ${
                    isGds ? 'bg-white border-2 border-[#0b0c0c]' : 'bg-white border border-slate-200'
                  }`}>
                    <button
                      onClick={() => {
                        exportAsPdf(sections, profile, theme);
                        setShowExportMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded transition-colors text-left ${
                        isGds ? 'hover:bg-[#f3f2f1] text-[#0b0c0c]' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Printer className="w-4 h-4 text-blue-600" />
                      <span>Export as PDF / Printable</span>
                    </button>

                    <button
                      onClick={() => {
                        exportAsText(sections, profile);
                        setShowExportMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded transition-colors text-left ${
                        isGds ? 'hover:bg-[#f3f2f1] text-[#0b0c0c]' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span>Export as Text File (.txt)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <Button onClick={addSection} variant="secondary" icon={<Plus className="w-4 h-4"/>} theme={theme}>
              Add Section
            </Button>
          </div>
        </div>

        {sections.length === 0 ? (
          <div className={`text-center py-12 border-2 border-dashed rounded-xl ${isGds ? 'border-[#b1b4b6] text-[#505a5f]' : 'border-slate-200 text-slate-400'}`}>
            <p>No sections added yet. Generate a plan, import text, or add manually.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((section, index) => (
              <div key={section.id} className={`${isGds ? 'bg-white p-4 border-l-4 border-[#1d70b8] border-y border-r border-y-[#b1b4b6] border-r-[#b1b4b6]' : 'bg-white rounded-xl shadow-sm border border-slate-200 p-4 transition-shadow hover:shadow-md'} group`}>
                <div className="flex items-start gap-4">
                  <div className="flex flex-col gap-1 pt-2 text-slate-300">
                    <button onClick={() => moveSection(index, 'up')} className="hover:text-blue-500 disabled:opacity-30" disabled={index===0}>▲</button>
                    <GripVertical className="w-5 h-5 cursor-grab active:cursor-grabbing" />
                    <button onClick={() => moveSection(index, 'down')} className="hover:text-blue-500 disabled:opacity-30" disabled={index===sections.length-1}>▼</button>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className={`block text-xs font-semibold uppercase mb-1 ${isGds ? 'text-[#0b0c0c]' : 'text-slate-500'}`}>Section Title</label>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => updateSection(section.id, { title: e.target.value })}
                          className={`w-full font-semibold text-lg border-b focus:outline-none pb-1 bg-transparent ${isGds ? 'border-[#0b0c0c] text-[#0b0c0c] focus:border-[#ffdd00] focus:border-b-4' : 'border-slate-200 focus:border-blue-500 text-slate-900'}`}
                          placeholder="e.g., Leadership Behaviour"
                        />
                      </div>
                      <div className="w-32">
                        <label className={`block text-xs font-semibold uppercase mb-1 flex items-center gap-1 ${isGds ? 'text-[#0b0c0c]' : 'text-slate-500'}`}>
                          <Clock className="w-3 h-3"/> Mins
                        </label>
                        <input
                          type="number"
                          value={section.durationMinutes}
                          onChange={(e) => updateSection(section.id, { durationMinutes: Number(e.target.value) })}
                          className={`w-full font-mono text-lg border-b focus:outline-none pb-1 bg-transparent ${isGds ? 'border-[#0b0c0c] text-[#0b0c0c] focus:border-[#ffdd00] focus:border-b-4' : 'border-slate-200 focus:border-blue-500 text-slate-900'}`}
                          min="1"
                        />
                      </div>
                    </div>
                    
                    <div>
                        <label className={`block text-xs font-semibold uppercase mb-1 flex items-center gap-1 ${isGds ? 'text-[#0b0c0c]' : 'text-slate-500'}`}>
                          <HelpCircle className="w-3 h-3"/> Question Text (Optional)
                        </label>
                        <input
                          type="text"
                          value={section.questionText || ''}
                          onChange={(e) => updateSection(section.id, { questionText: e.target.value })}
                          className={`w-full border-b focus:outline-none pb-2 text-sm ${isGds ? 'bg-[#f3f2f1] text-[#0b0c0c] border-[#b1b4b6] focus:border-[#ffdd00] focus:border-b-4 p-2' : 'text-slate-700 bg-slate-50 border-slate-200 focus:border-blue-500'}`}
                          placeholder="e.g. 'Tell me about a time you had to deliver a difficult message...'"
                        />
                    </div>

                    <div className="relative">
                      <div className="flex justify-between items-end mb-1">
                        <label className={`block text-xs font-semibold uppercase flex items-center gap-1 ${isGds ? 'text-[#0b0c0c]' : 'text-slate-500'}`}>
                          <FileText className="w-3 h-3"/> Notes / Script
                        </label>
                        
                        <Button
                          variant="ghost"
                          className="text-xs h-6 px-2"
                          icon={<Sparkles className="w-3 h-3"/>}
                          onClick={() => {
                             if (regeneratingSectionId === section.id) {
                               setRegeneratingSectionId(null);
                             } else {
                               setRegeneratingSectionId(section.id);
                               setRegenerationFeedback('');
                             }
                          }}
                          disabled={isRegenerating}
                          theme={theme}
                        >
                          AI Regenerate
                        </Button>
                      </div>
                      
                      {regeneratingSectionId === section.id && (
                        <div className={`mb-3 p-3 animate-in fade-in slide-in-from-top-1 ${isGds ? 'bg-[#f3f2f1] border-l-4 border-[#1d70b8]' : 'bg-indigo-50 border border-indigo-100 rounded-lg'}`}>
                           <div className="flex flex-col gap-2">
                             <label className={`text-xs font-medium ${isGds ? 'text-[#0b0c0c]' : 'text-indigo-800'}`}>Instructions for AI (e.g. "Focus more on the result", "Use a different example"):</label>
                             <textarea 
                               className={`${textAreaClass} text-sm`}
                               rows={2}
                               placeholder="Make it punchier..."
                               value={regenerationFeedback}
                               onChange={e => setRegenerationFeedback(e.target.value)}
                             />
                             <div className="flex justify-end gap-2">
                               <Button 
                                 variant="secondary" 
                                 className="text-xs h-8" 
                                 onClick={() => setRegeneratingSectionId(null)}
                                 theme={theme}
                               >
                                 Cancel
                               </Button>
                               <Button 
                                 variant="primary" 
                                 className={`text-xs h-8 ${isGds ? '' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                 onClick={() => handleRegenerateSection(section)}
                                 isLoading={isRegenerating}
                                 theme={theme}
                               >
                                 Generate New Notes
                               </Button>
                             </div>
                           </div>
                        </div>
                      )}

                      <textarea
                        value={section.notes}
                        onChange={(e) => updateSection(section.id, { notes: e.target.value })}
                        className={`w-full h-32 resize-y text-sm leading-relaxed ${isGds ? 'bg-white text-[#0b0c0c] border-2 border-[#b1b4b6] p-2 focus:outline-none focus:ring-4 focus:ring-[#ffdd00]' : 'text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-200 focus:ring-2 focus:ring-blue-100 outline-none'}`}
                        placeholder="STARR bullet points..."
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => removeSection(section.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
      <div className={`fixed bottom-0 left-0 right-0 p-4 backdrop-blur-md border-t flex flex-col gap-2 items-center justify-center z-50 ${isGds ? 'bg-[#f3f2f1]/90 border-[#b1b4b6]' : 'bg-white/80 border-slate-200'}`}>
        <Button 
          onClick={onStart} 
          disabled={sections.length === 0}
          className="w-full max-w-md shadow-xl text-lg py-3"
          icon={<Play className="w-5 h-5 fill-current" />}
          theme={theme}
        >
          Start Mock Interview
        </Button>
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
          theme={theme}
        />
      )}
    </div>
  );
};