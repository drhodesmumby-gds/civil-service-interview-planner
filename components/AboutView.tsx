import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ShieldAlert, 
  BookOpen, 
  Users, 
  PlayCircle, 
  Settings, 
  KeyRound, 
  Heart, 
  AlertTriangle,
  Info,
  Cpu,
  Compass,
  FileText
} from 'lucide-react';
import { Theme } from '../types';

interface AboutViewProps {
  onBack: () => void;
  theme: Theme;
}

type SectionId = 'overview' | 'personal-note' | 'api-key-models' | 'how-to-prepare' | 'disclaimer';

interface NavItem {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
}

export const AboutView: React.FC<AboutViewProps> = ({ onBack, theme }) => {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const isGds = theme === 'GDS';

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: <Info className="w-4 h-4" /> },
    { id: 'personal-note', label: 'Personal Note', icon: <Heart className="w-4 h-4" /> },
    { id: 'api-key-models', label: 'API Key & AI Models', icon: <Cpu className="w-4 h-4" /> },
    { id: 'how-to-prepare', label: 'How to Prepare', icon: <Compass className="w-4 h-4" /> },
    { id: 'disclaimer', label: 'Disclaimer & Privacy', icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  const scrollToSection = (id: SectionId) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={`h-full flex flex-col ${isGds ? 'bg-[#f3f2f1] font-sans text-[#0b0c0c]' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sticky Header */}
      <header className={`px-6 py-4 flex items-center justify-between shadow-sm z-20 shrink-0 sticky top-0 ${
        isGds ? 'bg-white border-b-2 border-[#0b0c0c]' : 'bg-white border-b border-slate-200'
      }`}>
        <button 
          onClick={onBack} 
          className={`flex items-center gap-2 text-sm transition-colors ${
            isGds 
              ? 'text-[#0b0c0c] font-normal underline decoration-[2px] underline-offset-4 hover:text-[#505a5f] hover:decoration-[#505a5f]' 
              : 'text-slate-600 font-medium hover:text-slate-900'
          }`}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Planner
        </button>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 font-bold ${
            isGds 
              ? 'bg-[#ffdd00] text-[#0b0c0c] border border-[#0b0c0c]' 
              : 'bg-blue-50 text-blue-700 border border-blue-100 rounded-full'
          }`}>
            Civil Service Companion
          </span>
        </div>
      </header>

      {/* Main Content Area with Navigation Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-7xl w-full mx-auto">
        
        {/* Sticky Desktop Sidebar / Mobile In-Page Nav Bar */}
        <nav className={`shrink-0 p-4 md:p-6 md:w-64 border-b md:border-b-0 md:border-r z-10 sticky top-0 md:top-auto overflow-x-auto md:overflow-y-auto flex md:flex-col gap-1.5 ${
          isGds ? 'bg-white border-[#b1b4b6]' : 'bg-white border-slate-200'
        }`}>
          <div className="hidden md:block mb-3 px-1">
            <h2 className={`text-xs font-bold uppercase tracking-wider ${isGds ? 'text-[#505a5f]' : 'text-slate-400'}`}>
              In-Page Navigation
            </h2>
          </div>
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 text-sm whitespace-nowrap transition-all text-left w-full ${
                  isActive
                    ? isGds
                      ? 'border-l-4 border-[#1d70b8] bg-[#f3f2f1] text-[#0b0c0c] font-bold pl-3'
                      : 'bg-blue-600 text-white font-medium shadow-sm rounded-lg'
                    : isGds
                      ? 'text-[#1d70b8] underline font-bold hover:text-[#003078] hover:bg-[#f3f2f1] pl-4'
                      : 'text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900 rounded-lg'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Scrollable Content Pane */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 scroll-smooth">
          
          {/* Section 1: Overview */}
          <section id="overview" className="scroll-mt-6 space-y-4">
            <div className={`flex items-center gap-3 ${isGds ? 'border-b-4 border-[#0b0c0c] pb-3' : ''}`}>
              <div className={`p-2 ${isGds ? 'bg-[#0b0c0c] text-white' : 'bg-blue-100 text-blue-600 rounded-lg'}`}>
                <FileText className="w-6 h-6" />
              </div>
              <h1 className={`text-3xl font-bold ${isGds ? 'text-[#0b0c0c] tracking-normal' : 'text-slate-900 tracking-tight'}`}>
                About This Tool
              </h1>
            </div>
            <p className={`text-lg leading-relaxed ${isGds ? 'text-[#0b0c0c]' : 'text-slate-600'}`}>
              The Civil Service Interview Companion is a structured practice and preparation tool designed to help candidates plan, time, and deliver answers for Civil Service interviews structured around Success Profiles.
            </p>
          </section>

          {/* Section 2: Personal Note */}
          <section 
            id="personal-note" 
            className={`scroll-mt-6 p-6 md:p-8 ${
              isGds 
                ? 'bg-white border-2 border-[#b1b4b6] border-t-4 border-t-[#1d70b8]' 
                : 'bg-blue-50/50 border border-blue-100 rounded-xl shadow-sm'
            }`}
          >
            <div className={`flex items-center gap-3 mb-4 ${isGds ? 'border-b-2 border-[#b1b4b6] pb-3' : ''}`}>
              <Heart className={`w-6 h-6 ${isGds ? 'text-[#1d70b8]' : 'text-blue-600'}`} />
              <h2 className={`text-2xl font-bold ${isGds ? 'text-[#0b0c0c]' : 'text-slate-900'}`}>
                Personal Note
              </h2>
            </div>
            <div className={`space-y-4 text-base leading-relaxed ${
              isGds ? 'text-[#0b0c0c] border-l-4 border-[#1d70b8] pl-5 py-1 bg-[#f3f2f1]' : 'text-slate-700'
            }`}>
              <p>
                I vibed this sometime in late 2025 to assist in preparing for a lengthy round of interviews, in which I always struggled on timing my questions in particular. I always meant to make it public but never quite got round to it, and now feel slightly guilted into it by the recent announcement that <a href="https://www.civilserviceworld.com/professions/article/civil-service-success-profiles-to-be-scrapped" target="_blank" rel="noreferrer" className={isGds ? 'text-[#1d70b8] underline font-bold hover:text-[#003078]' : 'text-blue-600 underline font-medium hover:text-blue-800'}>Success Profiles are being scrapped</a>. I say guilted - there is a genuine feeling there, as I did genuinely actually find the tool very useful for my prep as a neurodiverse candidate, and I do wonder if it could have been more helpful for others using Success Profiles.
              </p>
              <p>
                With that said, the generative AI functionality (the bit most pertinent to Success Profiles) I think is mostly not all that interesting or hugely effective. The prompts are not amazingly well-defined, particularly missing the actual Behaviours criteria (easily added with some effort, but I was never as interested in that aspect with this tool) and, at least when I was last doing this, even Gemini 3 Pro - then cutting edge - struggled with developing truly good material even with the context of my full career history. There are far better tools and prompts out there to support the actual drafting of your preparation material.
              </p>
              <p>
                Some of the feature ideas did inform a much more interesting AI tutoring project I undertook a little later however, which I intend to make public soon.
              </p>
            </div>
          </section>

          {/* Section 3: API Key & AI Models */}
          <section id="api-key-models" className={`scroll-mt-6 p-6 md:p-8 ${
            isGds ? 'bg-white border-2 border-[#b1b4b6]' : 'bg-white border border-slate-200 rounded-xl shadow-sm'
          } space-y-6`}>
            <div className={`flex items-center gap-3 ${isGds ? 'border-b-2 border-[#b1b4b6] pb-3' : ''}`}>
              <KeyRound className={`w-6 h-6 ${isGds ? 'text-[#1d70b8]' : 'text-blue-500'}`} />
              <h2 className={`text-2xl font-bold ${isGds ? 'text-[#0b0c0c]' : 'text-slate-900'}`}>
                API Key & AI Models
              </h2>
            </div>
            
            <div className={`space-y-4 text-sm leading-relaxed ${isGds ? 'text-[#0b0c0c]' : 'text-slate-600'}`}>
              <p className={isGds ? 'text-base' : ''}>
                Generative AI capabilities (plan generation, job detail extraction, note regeneration, and follow-up prediction) run directly on Google Gemini models.
              </p>

              <div className="grid md:grid-cols-3 gap-4 pt-2">
                <div className={`p-4 ${isGds ? 'bg-[#f3f2f1] border-2 border-[#b1b4b6]' : 'bg-slate-50 border border-slate-200 rounded-lg'}`}>
                  <h3 className={`font-bold mb-1 flex items-center gap-2 ${isGds ? 'text-[#0b0c0c] text-base' : 'text-slate-800 text-sm'}`}>
                    <Cpu className="w-4 h-4 text-[#1d70b8]" /> Model Options
                  </h3>
                  <p className="text-xs leading-relaxed">
                    Choose between <strong>gemini-3.6-flash</strong> (fast generation) and <strong>gemini-3.1-pro-preview</strong> (for complex reasoning). Switch models anytime in Settings or Debug Console.
                  </p>
                </div>

                <div className={`p-4 ${isGds ? 'bg-[#f3f2f1] border-2 border-[#b1b4b6]' : 'bg-slate-50 border border-slate-200 rounded-lg'}`}>
                  <h3 className={`font-bold mb-1 flex items-center gap-2 ${isGds ? 'text-[#0b0c0c] text-base' : 'text-slate-800 text-sm'}`}>
                    <KeyRound className="w-4 h-4 text-[#1d70b8]" /> In-Memory Key Handling
                  </h3>
                  <p className="text-xs leading-relaxed">
                    Your API key is held in component memory while the application is open. It is reset when the page reloads or the tab is closed, and is not saved to localStorage or sessionStorage.
                  </p>
                </div>

                <div className={`p-4 ${isGds ? 'bg-[#f3f2f1] border-2 border-[#b1b4b6]' : 'bg-slate-50 border border-slate-200 rounded-lg'}`}>
                  <h3 className={`font-bold mb-1 flex items-center gap-2 ${isGds ? 'text-[#0b0c0c] text-base' : 'text-slate-800 text-sm'}`}>
                    <ShieldAlert className="w-4 h-4 text-[#00703c]" /> Content Security Policy (CSP)
                  </h3>
                  <p className="text-xs leading-relaxed">
                    Defined via an HTML <code className="bg-white px-1 border border-[#b1b4b6]">&lt;meta&gt;</code> tag. Specifies allowed connect endpoints (<code className="bg-white px-1 border border-[#b1b4b6]">connect-src</code>) and image sources (<code className="bg-white px-1 border border-[#b1b4b6]">img-src</code>).
                  </p>
                </div>
              </div>

              {/* GOV.UK Notification Banner style when in GDS mode */}
              <div className={isGds ? "border-2 border-[#1d70b8] bg-white mt-4" : "bg-blue-50 border border-blue-200 rounded-lg p-4"}>
                {isGds && (
                  <div className="bg-[#1d70b8] text-white px-4 py-2 font-bold text-sm tracking-wide flex items-center gap-2">
                    <Info className="w-4 h-4" /> Important Information
                  </div>
                )}
                <div className={isGds ? "p-4 space-y-1 text-sm text-[#0b0c0c]" : "space-y-1 text-xs text-slate-700"}>
                  <p className="font-bold text-sm mb-1">Error Handling & Privacy</p>
                  <p>
                    If an API key is missing or invalid when you trigger an AI feature, the application will display a clear prompt asking you to enter your key. Manual notes, custom timings, and imported files remain fully functional regardless of API key availability.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: How to Prepare */}
          <section id="how-to-prepare" className="scroll-mt-6 space-y-6">
            <h2 className={`text-2xl font-bold ${isGds ? 'text-[#0b0c0c] border-b-2 border-[#b1b4b6] pb-3' : 'text-slate-900'}`}>
              How to Prepare
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className={`p-6 ${isGds ? 'bg-white border-2 border-[#b1b4b6]' : 'bg-white border border-slate-200 rounded-xl shadow-sm'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-7 h-7 font-bold flex items-center justify-center shrink-0 text-sm ${
                    isGds ? 'bg-[#0b0c0c] text-white' : 'bg-blue-100 text-blue-600 rounded-full'
                  }`}>1</span>
                  <h3 className={`text-lg font-bold ${isGds ? 'text-[#0b0c0c]' : 'text-slate-800'}`}>Context & Career History</h3>
                </div>
                <p className={`text-sm leading-relaxed ${isGds ? 'text-[#0b0c0c]' : 'text-slate-600'}`}>
                  Paste the job advert and your past career experience or CV into the Setup view. This helps the AI align competencies with your actual background.
                </p>
              </div>

              <div className={`p-6 ${isGds ? 'bg-white border-2 border-[#b1b4b6]' : 'bg-white border border-slate-200 rounded-xl shadow-sm'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-7 h-7 font-bold flex items-center justify-center shrink-0 text-sm ${
                    isGds ? 'bg-[#0b0c0c] text-white' : 'bg-blue-100 text-blue-600 rounded-full'
                  }`}>2</span>
                  <h3 className={`text-lg font-bold ${isGds ? 'text-[#0b0c0c]' : 'text-slate-800'}`}>Plan & Structure</h3>
                </div>
                <p className={`text-sm leading-relaxed ${isGds ? 'text-[#0b0c0c]' : 'text-slate-600'}`}>
                  Select your target Civil Service Grade and required Behaviours. Generate a plan or manually create STARR notes for each section with targeted durations.
                </p>
              </div>

              <div className={`p-6 ${isGds ? 'bg-white border-2 border-[#b1b4b6]' : 'bg-white border border-slate-200 rounded-xl shadow-sm'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-7 h-7 font-bold flex items-center justify-center shrink-0 text-sm ${
                    isGds ? 'bg-[#0b0c0c] text-white' : 'bg-blue-100 text-blue-600 rounded-full'
                  }`}>3</span>
                  <h3 className={`text-lg font-bold ${isGds ? 'text-[#0b0c0c]' : 'text-slate-800'}`}>Mock Practice & Auto-scroll</h3>
                </div>
                <p className={`text-sm leading-relaxed ${isGds ? 'text-[#0b0c0c]' : 'text-slate-600'}`}>
                  Launch Mock Interview mode. The interactive guide auto-scrolls your notes according to your section duration, helping you master answer pacing.
                </p>
              </div>

              <div className={`p-6 ${isGds ? 'bg-white border-2 border-[#b1b4b6]' : 'bg-white border border-slate-200 rounded-xl shadow-sm'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-7 h-7 font-bold flex items-center justify-center shrink-0 text-sm ${
                    isGds ? 'bg-[#0b0c0c] text-white' : 'bg-blue-100 text-blue-600 rounded-full'
                  }`}>4</span>
                  <h3 className={`text-lg font-bold ${isGds ? 'text-[#0b0c0c]' : 'text-slate-800'}`}>Follow-up Predictor</h3>
                </div>
                <p className={`text-sm leading-relaxed ${isGds ? 'text-[#0b0c0c]' : 'text-slate-600'}`}>
                  Use the panel predictor after delivering an answer to generate realistic follow-up questions and test your depth of evidence on the spot.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Disclaimer (GOV.UK Warning Text pattern) */}
          <section id="disclaimer" className={`scroll-mt-6 p-6 ${
            isGds 
              ? 'bg-white border-2 border-[#0b0c0c] border-l-[12px] border-l-[#d4351c]' 
              : 'bg-amber-50 border border-amber-200 rounded-xl border-l-4 border-l-amber-500'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`shrink-0 flex items-center justify-center font-bold ${
                isGds 
                  ? 'w-8 h-8 rounded-full bg-[#d4351c] text-white text-xl' 
                  : 'text-amber-600'
              }`}>
                {isGds ? '!' : <ShieldAlert className="w-8 h-8" />}
              </div>
              <div className="space-y-2">
                <h2 className={`text-xl font-bold ${isGds ? 'text-[#0b0c0c]' : 'text-amber-900'}`}>
                  Notice & Disclaimer
                </h2>
                <p className={`text-sm leading-relaxed ${isGds ? 'text-[#0b0c0c]' : 'text-amber-800'}`}>
                  This application is strictly intended for <strong>interview preparation and practice prior to an interview</strong>. Using live prompters or automated timing tools during an actual Civil Service interview may breach assessment rules.
                </p>
                <p className={`text-sm leading-relaxed ${isGds ? 'text-[#0b0c0c]' : 'text-amber-800'}`}>
                  Please <strong>do not upload or paste classified, sensitive, or personal government data</strong> into this application.
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
