import React, { useState } from 'react';
import { SetupView } from './components/SetupView';
import { LiveView } from './components/LiveView';
import { DisclaimerModal } from './components/DisclaimerModal';
import { AboutView } from './components/AboutView';
import { PromptEditorView } from './components/PromptEditorView';
import { AppState, InterviewSection } from './types';

const Header: React.FC = () => (
  <header className="govuk-header" role="banner" data-module="govuk-header">
    <div className="govuk-header__container govuk-width-container">
      <div className="govuk-header__logo">
        <a href="#" className="govuk-header__link govuk-header__link--homepage">
          <span className="govuk-header__logotype">
            <span className="govuk-header__logotype-text">
              Civil Service Interview Companion
            </span>
          </span>
        </a>
      </div>
    </div>
  </header>
);

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [careerHistory, setCareerHistory] = useState<string>('');
  const [showDisclaimer, setShowDisclaimer] = useState(true);

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

  return (
    <>
      {showDisclaimer && <DisclaimerModal onAccept={() => setShowDisclaimer(false)} />}
      
      <div className="flex-container">
        <Header />
        
        <div className="govuk-width-container flex-grow flex-container">
          {appState === AppState.SETUP && (
            <main className="govuk-main-wrapper flex-grow overflow-y-auto" id="main-content" role="main">
              <SetupView 
                sections={sections} 
                setSections={setSections} 
                careerHistory={careerHistory}
                setCareerHistory={setCareerHistory}
                onStart={() => setAppState(AppState.RUNNING)}
                onShowAbout={() => setAppState(AppState.ABOUT)}
                onShowPrompts={() => setAppState(AppState.PROMPTS)}
              />
            </main>
          )}
          
          {appState === AppState.ABOUT && (
            <main className="govuk-main-wrapper flex-grow overflow-y-auto" id="main-content" role="main">
              <AboutView 
                onBack={() => setAppState(AppState.SETUP)}
              />
            </main>
          )}

          {appState === AppState.PROMPTS && (
            <main className="govuk-main-wrapper flex-grow overflow-y-auto" id="main-content" role="main">
              <PromptEditorView 
                onBack={() => setAppState(AppState.SETUP)}
              />
            </main>
          )}
          
          {appState === AppState.RUNNING && (
            <main className="govuk-main-wrapper flex-grow overflow-y-auto" id="main-content" role="main">
              <LiveView 
                sections={sections} 
                careerHistory={careerHistory}
                onExit={() => setAppState(AppState.SETUP)}
              />
            </main>
          )}
        </div>
      </div>
    </>
  );
};

export default App;