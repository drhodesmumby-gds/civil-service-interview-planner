import React, { useState } from 'react';

type SectionId = 'overview' | 'personal-note' | 'api-key-models' | 'how-to-prepare' | 'disclaimer';

interface NavItem {
  id: SectionId;
  label: string;
}

export const AboutView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'personal-note', label: 'Personal Note' },
    { id: 'api-key-models', label: 'API Key & AI Models' },
    { id: 'how-to-prepare', label: 'How to Prepare' },
    { id: 'disclaimer', label: 'Disclaimer & Privacy' },
  ];

  const scrollToSection = (id: SectionId) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="govuk-!-margin-top-6 govuk-!-margin-bottom-8">
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-full">
          <h1 className="govuk-heading-xl govuk-!-margin-bottom-6">About This Tool</h1>
        </div>
      </div>

      <div className="govuk-grid-row">
        
        {/* Left Sidebar - MOJ Navigation */}
        <div className="govuk-grid-column-one-quarter">
          <nav className="moj-side-navigation" aria-label="Side navigation">
            <h4 className="moj-side-navigation__title">In-Page Navigation</h4>
            <ul className="moj-side-navigation__list">
              {navItems.map((item) => (
                <li 
                  key={item.id} 
                  className={`moj-side-navigation__item ${activeSection === item.id ? 'moj-side-navigation__item--active' : ''}`}
                >
                  <a 
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(item.id);
                    }}
                    aria-current={activeSection === item.id ? 'location' : undefined}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Scrollable Content Pane */}
        <div className="govuk-grid-column-three-quarters">
          
          <section id="overview" className="govuk-!-margin-bottom-8">
            <h2 className="govuk-heading-l">Overview</h2>
            <p className="govuk-body-l">
              The Civil Service Interview Companion is a structured practice and preparation tool designed to help candidates plan, time, and deliver answers for Civil Service interviews structured around Success Profiles.
            </p>
          </section>

          <section id="personal-note" className="govuk-!-margin-bottom-8">
            <h2 className="govuk-heading-l">Personal Note</h2>
            <div className="govuk-inset-text">
              <p className="govuk-body">
                I built this tool to assist in preparing for a lengthy round of interviews, in which I always struggled on timing my questions in particular. I always meant to make it public but never quite got round to it, and now feel slightly guilted into it by the recent announcement that <a href="https://www.civilserviceworld.com/professions/article/civil-service-success-profiles-to-be-scrapped" target="_blank" rel="noreferrer" className="govuk-link">Success Profiles are being scrapped</a>. I say guilted - there is a genuine feeling there, as I did genuinely actually find the tool very useful for my prep as a neurodiverse candidate, and I do wonder if it could have been more helpful for others using Success Profiles.
              </p>
              <p className="govuk-body">
                With that said, the generative AI functionality (the bit most pertinent to Success Profiles) I think is mostly not all that interesting or hugely effective. The prompts are not amazingly well-defined, particularly missing the actual Behaviours criteria (easily added with some effort, but I was never as interested in that aspect with this tool) and, at least when I was last doing this, even Gemini 3 Pro - then cutting edge - struggled with developing truly good material even with the context of my full career history. There are far better tools and prompts out there to support the actual drafting of your preparation material.
              </p>
              <p className="govuk-body">
                Some of the feature ideas did inform a much more interesting AI tutoring project I undertook a little later however, which I intend to make public soon.
              </p>
            </div>
          </section>

          <section id="api-key-models" className="govuk-!-margin-bottom-8">
            <h2 className="govuk-heading-l">API Key & AI Models</h2>
            <p className="govuk-body">
              Generative AI capabilities (plan generation, job detail extraction, note regeneration, and follow-up prediction) run directly on Google Gemini models.
            </p>
            
            <dl className="govuk-summary-list">
              <div className="govuk-summary-list__row">
                <dt className="govuk-summary-list__key">Model Options</dt>
                <dd className="govuk-summary-list__value">Choose between <strong>gemini-3.6-flash</strong> (fast generation) and <strong>gemini-3.1-pro-preview</strong> (for complex reasoning). Switch models anytime in Settings or Debug Console.</dd>
              </div>
              <div className="govuk-summary-list__row">
                <dt className="govuk-summary-list__key">In-Memory Key Handling</dt>
                <dd className="govuk-summary-list__value">Your API key is held in component memory while the application is open. It is reset when the page reloads or the tab is closed, and is not saved to localStorage or sessionStorage.</dd>
              </div>
              <div className="govuk-summary-list__row">
                <dt className="govuk-summary-list__key">Content Security Policy (CSP)</dt>
                <dd className="govuk-summary-list__value">Defined via an HTML <code>&lt;meta&gt;</code> tag. Specifies allowed connect endpoints (<code>connect-src</code>) and image sources (<code>img-src</code>).</dd>
              </div>
            </dl>

            <div className="govuk-notification-banner" role="region" aria-labelledby="govuk-notification-banner-title" data-module="govuk-notification-banner">
              <div className="govuk-notification-banner__header">
                <h2 className="govuk-notification-banner__title" id="govuk-notification-banner-title">
                  Important Information
                </h2>
              </div>
              <div className="govuk-notification-banner__content">
                <h3 className="govuk-notification-banner__heading">Error Handling & Privacy</h3>
                <p className="govuk-body">
                  If an API key is missing or invalid when you trigger an AI feature, the application will display a clear prompt asking you to enter your key. Manual notes, custom timings, and imported files remain fully functional regardless of API key availability.
                </p>
              </div>
            </div>
          </section>

          <section id="how-to-prepare" className="govuk-!-margin-bottom-8">
            <h2 className="govuk-heading-l">How to Prepare</h2>
            
            <ol className="govuk-list govuk-list--number">
              <li>
                <strong>Context & Career History:</strong> Paste the job advert and your past career experience or CV into the Setup view. This helps the AI align competencies with your actual background.
              </li>
              <li>
                <strong>Plan & Structure:</strong> Select your target Civil Service Grade and required Behaviours. Generate a plan or manually create STARR notes for each section with targeted durations.
              </li>
              <li>
                <strong>Mock Practice & Auto-scroll:</strong> Launch Mock Interview mode. The interactive guide auto-scrolls your notes according to your section duration, helping you master answer pacing.
              </li>
              <li>
                <strong>Follow-up Predictor:</strong> Use the panel predictor after delivering an answer to generate realistic follow-up questions and test your depth of evidence on the spot.
              </li>
            </ol>
          </section>

          <section id="disclaimer">
            <div className="govuk-warning-text">
              <span className="govuk-warning-text__icon" aria-hidden="true">!</span>
              <strong className="govuk-warning-text__text">
                <span className="govuk-warning-text__assistive">Warning</span>
                <p className="govuk-!-margin-bottom-2">This application is strictly intended for <strong>interview preparation and practice prior to an interview</strong>. Using live prompters or automated timing tools during an actual Civil Service interview may breach assessment rules.</p>
                <p className="govuk-!-margin-bottom-0">Please <strong>do not upload or paste classified, sensitive, or personal government data</strong> into this application.</p>
              </strong>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
