import React from 'react';
import { ArrowLeft, ShieldAlert, BookOpen, Clock, Users, PlayCircle, Settings } from 'lucide-react';
import { Theme } from '../types';
import { Button } from './Button';

interface AboutViewProps {
  onBack: () => void;
  theme: Theme;
}

export const AboutView: React.FC<AboutViewProps> = ({ onBack, theme }) => {
  const isGds = theme === 'GDS';
  
  return (
    <div className={`h-full flex flex-col overflow-y-auto ${isGds ? 'bg-[#f3f2f1]' : 'bg-slate-50'}`}>
      <div className={`px-6 py-4 flex items-center shadow-sm z-10 shrink-0 sticky top-0 ${isGds ? 'bg-white border-b-2 border-[#1d70b8]' : 'bg-white border-b border-slate-200'}`}>
        <button 
          onClick={onBack} 
          className={`flex items-center gap-2 text-sm font-medium ${isGds ? 'text-[#1d70b8] underline hover:text-[#003078]' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Planner
        </button>
      </div>

      <div className="flex-1 max-w-4xl mx-auto p-8 lg:p-12 space-y-12">
        
        {/* Header Section */}
        <section className="space-y-4">
          <h1 className={`text-4xl font-bold tracking-tight ${isGds ? 'text-[#0b0c0c]' : 'text-slate-900'}`}>
            About This Tool
          </h1>
          <p className={`text-xl ${isGds ? 'text-[#505a5f]' : 'text-slate-600'} leading-relaxed`}>
            The Civil Service Interview Companion is a structured practice and preparation tool designed to help you prepare your timing, notes, and answers before a Civil Service interview.
          </p>
        </section>

        {/* Warning Section */}
        <section className={`p-6 rounded-xl border-l-4 ${isGds ? 'bg-white border-[#d4351c] shadow-sm' : 'bg-amber-50 border-amber-500'}`}>
          <div className="flex items-start gap-4">
            <ShieldAlert className={`w-8 h-8 shrink-0 ${isGds ? 'text-[#d4351c]' : 'text-amber-600'}`} />
            <div className="space-y-2">
              <h2 className={`text-lg font-bold ${isGds ? 'text-[#0b0c0c]' : 'text-amber-900'}`}>Not for use during live interviews</h2>
              <p className={isGds ? 'text-[#0b0c0c]' : 'text-amber-800'}>
                This tool is strictly for <strong>mock interviews and preparation only</strong>. Using timing guides or automated prompters during a live Civil Service interview could violate integrity rules and lead to disqualification.
              </p>
              <p className={isGds ? 'text-[#0b0c0c]' : 'text-amber-800'}>
                Additionally, please <strong>do not upload</strong> sensitive, classified, or personally identifiable government data into this tool, as it utilizes AI APIs to process text.
              </p>
            </div>
          </div>
        </section>

        {/* How to Use Section */}
        <section className="space-y-6">
          <h2 className={`text-2xl font-bold ${isGds ? 'text-[#0b0c0c]' : 'text-slate-900'}`}>How to Prepare</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-xl ${isGds ? 'bg-white border-2 border-[#b1b4b6]' : 'bg-white border border-slate-200 shadow-sm'}`}>
              <BookOpen className={`w-6 h-6 mb-4 ${isGds ? 'text-[#1d70b8]' : 'text-blue-500'}`} />
              <h3 className={`text-lg font-bold mb-2 ${isGds ? 'text-[#0b0c0c]' : 'text-slate-800'}`}>1. Context is Key</h3>
              <p className={`text-sm leading-relaxed ${isGds ? 'text-[#0b0c0c]' : 'text-slate-600'}`}>
                Paste the job description and your career history in the Setup view. This allows the AI to tailor the suggested behaviours and competencies specifically for the role you are applying to.
              </p>
            </div>

            <div className={`p-6 rounded-xl ${isGds ? 'bg-white border-2 border-[#b1b4b6]' : 'bg-white border border-slate-200 shadow-sm'}`}>
              <Settings className={`w-6 h-6 mb-4 ${isGds ? 'text-[#1d70b8]' : 'text-blue-500'}`} />
              <h3 className={`text-lg font-bold mb-2 ${isGds ? 'text-[#0b0c0c]' : 'text-slate-800'}`}>2. Generate & Refine</h3>
              <p className={`text-sm leading-relaxed ${isGds ? 'text-[#0b0c0c]' : 'text-slate-600'}`}>
                Select the Civil Service Grade and the required Behaviours to generate an interview plan. You can edit the generated STARR notes to make them punchier or ask the AI to regenerate specific sections.
              </p>
            </div>

            <div className={`p-6 rounded-xl ${isGds ? 'bg-white border-2 border-[#b1b4b6]' : 'bg-white border border-slate-200 shadow-sm'}`}>
              <PlayCircle className={`w-6 h-6 mb-4 ${isGds ? 'text-[#1d70b8]' : 'text-blue-500'}`} />
              <h3 className={`text-lg font-bold mb-2 ${isGds ? 'text-[#0b0c0c]' : 'text-slate-800'}`}>3. Mock Interview Mode</h3>
              <p className={`text-sm leading-relaxed ${isGds ? 'text-[#0b0c0c]' : 'text-slate-600'}`}>
                Start the Mock Interview. The timing guide will smoothly scroll your notes, keeping you on pace. Use this feature to practice speaking clearly without rushing.
              </p>
            </div>

            <div className={`p-6 rounded-xl ${isGds ? 'bg-white border-2 border-[#b1b4b6]' : 'bg-white border border-slate-200 shadow-sm'}`}>
              <Users className={`w-6 h-6 mb-4 ${isGds ? 'text-[#1d70b8]' : 'text-blue-500'}`} />
              <h3 className={`text-lg font-bold mb-2 ${isGds ? 'text-[#0b0c0c]' : 'text-slate-800'}`}>4. Anticipate Follow-ups</h3>
              <p className={`text-sm leading-relaxed ${isGds ? 'text-[#0b0c0c]' : 'text-slate-600'}`}>
                At the end of a block, generate potential follow-up questions that an interview panel might ask, based on the notes you just delivered. Practice answering them on the spot.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
