import React, { useState } from 'react';
import { SetupView } from './components/SetupView';
import { LiveView } from './components/LiveView';
import { DisclaimerModal } from './components/DisclaimerModal';
import { AboutView } from './components/AboutView';
import { AppState, InterviewSection, Theme } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [careerHistory, setCareerHistory] = useState<string>('');
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [theme, setTheme] = useState<Theme>('DEFAULT');

  const [sections, setSections] = useState<InterviewSection[]>([
    {
      id: '1',
      title: 'Introduction & Icebreaker',
      notes: 'Smile and thank the panel. Briefly mention my current role at Dept X and my passion for public service.',
      durationMinutes: 2
    },
    {
      id: '2',
      title: 'Behaviour: Delivering at Pace',
      notes: 'Situation: Project X deadline moved up by 2 weeks.\n\nTask: Deliver policy brief urgently.\n\nAction: Re-prioritised team workload, delegated data analysis.\n\nResult: Delivered on time, commended by Director.',
      durationMinutes: 5
    }
  ]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'DEFAULT' ? 'GDS' : 'DEFAULT');
  };

  const isGds = theme === 'GDS';

  return (
    <>
      {showDisclaimer && <DisclaimerModal onAccept={() => setShowDisclaimer(false)} />}
      
      <div className={`h-full ${isGds ? 'bg-[#f3f2f1] text-[#0b0c0c] font-sans' : 'bg-slate-50 text-slate-900 font-sans'} flex flex-col overflow-hidden transition-colors duration-300`}>
        {appState === AppState.SETUP && (
          <div className="flex-1 overflow-y-auto">
            <SetupView 
              sections={sections} 
              setSections={setSections} 
              careerHistory={careerHistory}
              setCareerHistory={setCareerHistory}
              onStart={() => setAppState(AppState.RUNNING)}
              onShowAbout={() => setAppState(AppState.ABOUT)}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          </div>
        )}
        
        {appState === AppState.ABOUT && (
          <div className="flex-1 overflow-hidden">
            <AboutView 
              onBack={() => setAppState(AppState.SETUP)}
              theme={theme}
            />
          </div>
        )}
        
        {appState === AppState.RUNNING && (
          <LiveView 
            sections={sections} 
            careerHistory={careerHistory}
            onExit={() => setAppState(AppState.SETUP)}
            theme={theme}
          />
        )}
      </div>
    </>
  );
};

export default App;