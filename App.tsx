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
              Civil Service Interview Practice
            </span>
          </span>
        </a>
      </div>
    </div>
  </header>
);

const ServiceNavigation: React.FC<{
  currentView: AppState;
  onNavigate: (view: AppState) => void;
  onStart: () => void;
  canStart: boolean;
}> = ({ currentView, onNavigate, onStart, canStart }) => (
  <div className="govuk-service-navigation" data-module="govuk-service-navigation">
    <div className="govuk-width-container flex justify-between items-center w-full">
      <div className="govuk-service-navigation__container">
        <nav aria-label="Menu" className="govuk-service-navigation__wrapper">
          <ul className="govuk-service-navigation__list">
            <li className="govuk-service-navigation__item">
              <a 
                href="#" 
                className={`govuk-service-navigation__link ${currentView === AppState.SETUP ? 'govuk-service-navigation__link--active' : ''}`}
                onClick={(e) => { e.preventDefault(); onNavigate(AppState.SETUP); }}
                aria-current={currentView === AppState.SETUP ? 'page' : undefined}
              >
                Planner Setup
              </a>
            </li>
            <li className="govuk-service-navigation__item">
              <a 
                href="#" 
                className={`govuk-service-navigation__link ${currentView === AppState.PROMPTS ? 'govuk-service-navigation__link--active' : ''}`}
                onClick={(e) => { e.preventDefault(); onNavigate(AppState.PROMPTS); }}
                aria-current={currentView === AppState.PROMPTS ? 'page' : undefined}
              >
                Prompt Editor
              </a>
            </li>
            <li className="govuk-service-navigation__item">
              <a 
                href="#" 
                className={`govuk-service-navigation__link ${currentView === AppState.ABOUT ? 'govuk-service-navigation__link--active' : ''}`}
                onClick={(e) => { e.preventDefault(); onNavigate(AppState.ABOUT); }}
                aria-current={currentView === AppState.ABOUT ? 'page' : undefined}
              >
                About Tool
              </a>
            </li>
          </ul>
        </nav>
      </div>
      
      {currentView === AppState.SETUP && (
        <button 
          onClick={onStart}
          disabled={!canStart}
          className="govuk-button govuk-button--start govuk-!-margin-bottom-0 govuk-!-margin-top-0 scale-90 origin-right transition-all"
        >
          Start Mock Interview
          <svg className="govuk-button__start-icon" xmlns="http://www.w3.org/2000/svg" width="17.5" height="19" viewBox="0 0 33 40" aria-hidden="true" focusable="false" style={{ marginLeft: '10px' }}>
            <path fill="currentColor" d="M0 0h13l20 20-20 20H0l20-20z" />
          </svg>
        </button>
      )}
    </div>
  </div>
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
      
      <div className={appState === AppState.RUNNING ? "app-container live-view-dashboard" : "app-container"}>
        <Header />
        
        {appState !== AppState.RUNNING && (
          <ServiceNavigation 
            currentView={appState} 
            onNavigate={setAppState} 
            onStart={() => setAppState(AppState.RUNNING)}
            canStart={sections.length > 0}
          />
        )}
        
        <div className="govuk-width-container">
          {appState !== AppState.RUNNING && (
            <div className="govuk-phase-banner">
              <p className="govuk-phase-banner__content">
                <strong className="govuk-tag govuk-phase-banner__content__tag">
                  EXPERIMENTAL
                </strong>
                <span className="govuk-phase-banner__text">
                  This is an unofficial experimental tool and is not affiliated with the UK Government.
                </span>
              </p>
            </div>
          )}

          {appState === AppState.SETUP && (
            <main className="govuk-main-wrapper pb-24" id="main-content" role="main">
              <SetupView 
                sections={sections} 
                setSections={setSections} 
                careerHistory={careerHistory}
                setCareerHistory={setCareerHistory}
                onStart={() => setAppState(AppState.RUNNING)}
              />
            </main>
          )}
          
          {appState === AppState.ABOUT && (
            <main className="govuk-main-wrapper" id="main-content" role="main">
              <AboutView />
            </main>
          )}

          {appState === AppState.PROMPTS && (
            <main className="govuk-main-wrapper" id="main-content" role="main">
              <PromptEditorView />
            </main>
          )}
          
          {appState === AppState.RUNNING && (
            <main className="govuk-main-wrapper" id="main-content" role="main">
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