import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw, CheckCircle2, AlertCircle, Clock, MessageSquarePlus, Sparkles, AlignLeft, List, ChevronDown, HelpCircle, SkipForward, ArrowDownCircle, Lightbulb } from 'lucide-react';
import { InterviewSection } from '../types';
import { Button } from './Button';
import { generateFollowUpQuestions, FollowUpItem, formatGeminiError } from '../services/geminiService';

interface LiveViewProps {
  sections: InterviewSection[];
  careerHistory?: string;
  onExit: () => void;
}

type PrompterMode = 'WORD' | 'BLOCK';

export const LiveView: React.FC<LiveViewProps> = ({ sections, careerHistory, onExit }) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(sections[0].durationMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [isOvertime, setIsOvertime] = useState(false);
  const [elapsedTotal, setElapsedTotal] = useState(0);
  const [prompterMode, setPrompterMode] = useState<PrompterMode>('BLOCK');
  
  // Follow up state
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [isGeneratingFollowUps, setIsGeneratingFollowUps] = useState(false);
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [insight, setInsight] = useState<string>('');
  const [hasGeneratedFollowUpsForSection, setHasGeneratedFollowUpsForSection] = useState(false);

  const currentSection = sections[currentSectionIndex];
  const nextSection = sections[currentSectionIndex + 1];
  
  // Timing Guide Logic
  const contentUnits = useMemo(() => {
    if (prompterMode === 'WORD') {
      // Split by whitespace but keep delimiters
      return currentSection.notes.split(/(\s+)/);
    } else {
      // Split by lines for block mode, filtering empty lines to ensure meaningful blocks
      return currentSection.notes.split('\n').filter(line => line.trim().length > 0);
    }
  }, [currentSection.notes, prompterMode]);

  const sectionDurationSeconds = currentSection.durationMinutes * 60;

  // Calculate weighted timings based on character length
  // Longer blocks/words get more time allocated
  const unitTimings = useMemo(() => {
    const totalChars = contentUnits.reduce((sum, unit) => sum + unit.length, 0);
    let accumulatedTime = 0;
    
    return contentUnits.map(unit => {
      // Avoid division by zero; fallback to even distribution if totalChars is 0 (unlikely)
      const weight = totalChars > 0 ? unit.length / totalChars : 1 / contentUnits.length;
      const duration = weight * sectionDurationSeconds;
      const startTime = accumulatedTime;
      accumulatedTime += duration;
      
      return {
        startTime,
        endTime: accumulatedTime
      };
    });
  }, [contentUnits, sectionDurationSeconds]);

  // Calculate current index based on time elapsed in THIS section
  const sectionElapsed = sectionDurationSeconds - timeLeft;
  
  // Find which unit corresponds to the current elapsed time
  // We look for the first unit where the calculated endTime is greater than the current elapsed time
  let targetIndex = unitTimings.findIndex(t => t.endTime > sectionElapsed);
  
  // Handle edge cases
  if (targetIndex === -1) {
     // If elapsed time > total calculated time (e.g. overtime or floating point drift), highlight the last unit
     targetIndex = contentUnits.length - 1;
  }
  // Ensure we don't return -1 for empty content
  targetIndex = Math.max(0, targetIndex);

  const activeElementRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active element
  useEffect(() => {
    if (isActive && activeElementRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = activeElementRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      
      // Check if element is out of the middle area of the view
      const relativeTop = elementRect.top - containerRect.top;
      const targetTop = containerRect.height / 3; 

      container.scrollTo({
        top: container.scrollTop + (relativeTop - targetTop),
        behavior: 'smooth'
      });
    }
  }, [targetIndex, isActive, prompterMode]);


  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive) {
      interval = setInterval(() => {
        setElapsedTotal(e => e + 1);
        setTimeLeft((prev) => {
          if (prev <= 0) {
            setIsOvertime(true);
            return prev - 1; 
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  // Reset timer (for specific section) and followups when changing sections
  useEffect(() => {
    setTimeLeft(currentSection.durationMinutes * 60);
    // Note: We do NOT reset elapsedTotal here, as requested it persists for the session
    setIsOvertime(false);
    setIsActive(true); 
    
    // Reset follow up state
    setShowFollowUps(false);
    setFollowUps([]);
    setInsight('');
    setHasGeneratedFollowUpsForSection(false);
  }, [currentSection, currentSection.durationMinutes]);

  const handleNext = () => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
    } else {
      onExit(); 
    }
  };

  const handlePrev = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
    }
  };
  
  const handleSkipBlock = () => {
    if (targetIndex < unitTimings.length - 1) {
      // Jump to the start of the next block (end of current block)
      // Adding a small buffer to ensure we land in the next block index
      const nextStartTime = unitTimings[targetIndex].endTime + 0.1;
      setTimeLeft(sectionDurationSeconds - nextStartTime);
    }
  };

  const handleGenerateFollowUps = async () => {
    setIsGeneratingFollowUps(true);
    setShowFollowUps(true);
    setIsActive(false); 
    
    try {
      const result = await generateFollowUpQuestions(currentSection, careerHistory);
      setFollowUps(result.questions);
      setInsight(result.insights);
      setHasGeneratedFollowUpsForSection(true);
    } catch (e: any) {
      console.error(e);
      alert(formatGeminiError(e));
      setShowFollowUps(false);
    } finally {
      setIsGeneratingFollowUps(false);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const formatTime = (seconds: number) => {
    const absSeconds = Math.floor(Math.abs(seconds));
    const m = Math.floor(absSeconds / 60);
    const s = absSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (isOvertime) return 'text-white bg-[#d4351c] border-[#d4351c]';
    if (timeLeft < 60) return 'text-white bg-[#f47738] border-[#f47738]';
    return 'text-white bg-[#1d70b8] border-[#1d70b8]';
  };

  const progressPercentage = ((currentSectionIndex) / sections.length) * 100;
  
  // Dynamic layout calculation for the side panel
  const sidePanelWidthClass = showFollowUps ? 'w-[30rem] xl:w-[35rem]' : 'w-96';

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#f3f2f1] font-sans text-[#0b0c0c]">
      {/* App Control Bar */}
      <div className="px-6 py-4 flex items-center justify-between z-10 shrink-0 bg-white border-b border-[#b1b4b6]">
        <div className="flex items-center gap-6">
           <button onClick={onExit} className="govuk-back-link govuk-!-margin-top-0 govuk-!-margin-bottom-0 border-0 bg-transparent cursor-pointer">
             Back to Setup
           </button>
           <div className="h-6 w-px bg-[#b1b4b6]"></div>
           <div className="flex items-center gap-2">
             <span className="text-sm font-bold text-[#505a5f]">Total Time:</span>
             <span className="font-mono text-lg text-[#0b0c0c] font-bold">{formatTime(elapsedTotal)}</span>
           </div>
        </div>
        <div className="flex items-center">
           <div className="govuk-body govuk-!-margin-bottom-0 govuk-!-font-weight-bold">
             Question {currentSectionIndex + 1} of {sections.length}
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Timing Guide Panel */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth scrollbar-hide"
        >
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="relative group">
                  <select
                    value={currentSectionIndex}
                    onChange={(e) => setCurrentSectionIndex(Number(e.target.value))}
                    className="appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-bold uppercase tracking-wide cursor-pointer transition-colors max-w-[200px] truncate bg-[#f3f2f1] text-[#0b0c0c] border border-[#b1b4b6]"
                    aria-label="Jump to section"
                  >
                    {sections.map((section, idx) => (
                      <option key={section.id} value={idx}>
                        {idx + 1}. {section.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  of {sections.length}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2 text-[#0b0c0c]">
                {currentSection.title}
              </h1>
              <div className="text-slate-500 font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" /> Allocated: {currentSection.durationMinutes} mins
              </div>
            </div>

            {/* Specific Question Display */}
            {currentSection.questionText && (
               <div className="bg-white border-l-8 border-[#1d70b8] p-6 shadow-sm">
                 <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1 text-[#1d70b8]">
                    <HelpCircle className="w-4 h-4"/> Question
                 </h3>
                 <p className="text-xl md:text-2xl leading-relaxed text-[#0b0c0c] font-bold">
                   "{currentSection.questionText}"
                 </p>
               </div>
            )}

            <div className="bg-white p-8 border border-[#b1b4b6] min-h-[50vh]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  Timing Guide
                  <span className={`transition-opacity duration-300 ${isActive ? 'opacity-100 text-green-600' : 'opacity-0'}`}>• Active</span>
                </h3>
                
                {/* View Mode Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setPrompterMode('BLOCK')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${prompterMode === 'BLOCK' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <List className="w-3 h-3" /> Block
                  </button>
                  <button 
                    onClick={() => setPrompterMode('WORD')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${prompterMode === 'WORD' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <AlignLeft className="w-3 h-3" /> Word
                  </button>
                </div>
              </div>
              
              <div className={`${prompterMode === 'WORD' ? 'text-2xl leading-relaxed font-medium whitespace-pre-wrap' : 'space-y-6'}`}>
                {contentUnits.map((unit, index) => {
                  const isPassed = index < targetIndex;
                  const isCurrent = index === targetIndex || (prompterMode === 'WORD' && index === targetIndex + 1 && unit.trim() === '');
                  
                  // Attach ref to the current element
                  const refProps = isCurrent ? { ref: activeElementRef } : {};

                  if (prompterMode === 'WORD') {
                    let styleClass = "text-[#0b0c0c] transition-colors duration-300"; 
                    if (isPassed) {
                      styleClass = "text-[#505a5f] transition-colors duration-500";
                    } else if (isCurrent) {
                      styleClass = "text-[#0b0c0c] bg-[#ffdd00] py-1 px-1 rounded transition-all duration-200";
                    }
                    return (
                      <span key={index} {...refProps} className={styleClass}>
                        {unit}
                      </span>
                    );
                  } else {
                    // BLOCK MODE RENDERING
                    let styleClass = "govuk-!-padding-4 transition-all duration-500 border-l-4 ";
                    
                    if (isPassed) {
                      styleClass += "border-transparent text-[#505a5f] opacity-60 scale-95 origin-left";
                    } else if (isCurrent) {
                      styleClass += "bg-white border-[#1d70b8] text-[#0b0c0c] scale-100 ring-4 ring-[#ffdd00]";
                    } else {
                      styleClass += "border-transparent text-[#505a5f] scale-95 origin-left opacity-60"; // Future items dimmed slightly to focus attention
                    }
                    
                    // Retrieve weighted start time for this block
                    const blockTime = Math.floor(unitTimings[index]?.startTime || 0);

                    return (
                      <div key={index} {...refProps} className="flex gap-4 group">
                        <div className="w-12 pt-5 text-right shrink-0 select-none">
                           <span className={`text-xs font-mono font-medium transition-colors duration-300 ${isCurrent ? 'text-[#1d70b8]' : 'text-slate-300 group-hover:text-slate-400'}`}>
                             {formatTime(blockTime)}
                           </span>
                        </div>
                        <div className={`flex-1 ${styleClass}`}>
                          <p className="text-xl md:text-2xl font-medium leading-relaxed">{unit}</p>
                          
                          {/* SKIP BUTTON */}
                          {isCurrent && index < contentUnits.length - 1 && (
                            <div className="mt-4 flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                               <Button
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleSkipBlock();
                                 }}
                                 variant="secondary"
                                
                                 className="text-xs h-8"
                                 icon={<SkipForward className="w-3 h-3"/>}
                                 title="Jump to start of next block and update timer"
                               >
                                 Skip (+Time)
                               </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
            
            {/* Spacing for bottom scrolling */}
            <div className="h-32"></div>
          </div>
        </div>

        {/* Right: Timer & Next Steps */}
        <div className={`${sidePanelWidthClass} h-full overflow-hidden transition-all duration-500 border-l flex flex-col shadow-xl z-20 shrink-0 relative bg-white border-[#b1b4b6]`}>
          
          {/* Responsive Timer Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b shadow-sm transition-colors duration-500 shrink-0 ${getTimerColor()}`}>
             <div className="flex items-center gap-2">
               <Clock className="w-5 h-5" />
               <span className="text-sm font-bold uppercase tracking-wider opacity-90">
                 {isOvertime ? 'Overtime' : 'Remaining'}
               </span>
             </div>
             <div className="text-4xl font-mono font-bold tracking-tight tabular-nums">
               {isOvertime ? '+' : ''}{formatTime(timeLeft)}
             </div>
             <div className="flex gap-2">
                <button onClick={toggleTimer} className="p-2.5 rounded hover:bg-black/20 transition-colors" title={isActive ? "Pause" : "Start"}>
                  {isActive ? <Pause className="w-6 h-6 fill-current"/> : <Play className="w-6 h-6 fill-current"/>}
                </button>
                <button 
                  onClick={() => {
                    setTimeLeft(currentSection.durationMinutes * 60);
                    setIsOvertime(false);
                    setIsActive(false);
                  }}
                  className="p-2.5 rounded hover:bg-black/20 transition-colors"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-6 h-6" />
                </button>
             </div>
          </div>

          {/* Context / Follow-up Panel */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative bg-[#f3f2f1]">
             
             {/* Mode Toggle Tabs */}
             <div className="flex border-b border-slate-200 bg-white">
               <button 
                 onClick={() => setShowFollowUps(false)}
                 className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${!showFollowUps ? 'text-[#1d70b8] border-b-2 border-[#1d70b8]' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Queue
               </button>
               <button 
                 onClick={() => {
                   if (!hasGeneratedFollowUpsForSection) handleGenerateFollowUps();
                   else setShowFollowUps(true);
                 }}
                 className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 ${showFollowUps ? 'text-[#1d70b8] border-b-2 border-[#1d70b8]' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 <Sparkles className="w-3 h-3" /> Follow-ups
               </button>
             </div>

             {/* Tab Content */}
             <div className="flex-1 h-full overflow-y-auto p-6 scroll-smooth min-h-0">
               {showFollowUps ? (
                 <div className="space-y-6">
                    {isGeneratingFollowUps ? (
                      <div className="text-center py-10 text-slate-400 animate-pulse">
                        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                        <p>Analyzing answer & history...</p>
                      </div>
                    ) : (
                      <>
                        <div className="govuk-inset-text">
                          <h4 className="govuk-heading-s govuk-!-margin-bottom-1">
                             Panel Insight
                          </h4>
                          <p className="govuk-body">{insight}</p>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="govuk-heading-s text-[#505a5f] uppercase tracking-wider">Potential Questions</h4>
                          {followUps.map((item, i) => (
                             <div key={i} className="govuk-!-padding-4 bg-white border-l-4 border-[#1d70b8] govuk-!-margin-bottom-4">
                               <div className="govuk-body govuk-!-font-weight-bold">
                                 "{item.question}"
                               </div>
                               
                               <div className="govuk-inset-text govuk-!-margin-top-2 govuk-!-padding-top-2 govuk-!-padding-bottom-2">
                                  <div className="govuk-body-s govuk-!-font-weight-bold uppercase opacity-60 govuk-!-margin-bottom-1">
                                     Answer Strategy
                                  </div>
                                  <div className="govuk-body-s whitespace-pre-wrap">{item.answerContext}</div>
                               </div>
                             </div>
                          ))}
                        </div>
                        
                        <div className="pt-4 pb-8">
                          <Button onClick={handleGenerateFollowUps} variant="secondary" className="w-full text-xs" icon={<RotateCcw className="w-3 h-3"/>}>
                            Regenerate with different angle
                          </Button>
                        </div>
                      </>
                    )}
                 </div>
               ) : (
                 <>
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Up Next</h4>
                   {nextSection ? (
                     <div className="p-4 opacity-70 bg-white border border-[#b1b4b6]">
                       <h3 className="font-semibold text-slate-800 mb-1 line-clamp-2">{nextSection.title}</h3>
                       <p className="text-sm text-slate-500">{nextSection.durationMinutes} mins</p>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center justify-center h-32 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                       <CheckCircle2 className="w-8 h-8 mb-2" />
                       <p>Mock Interview Complete</p>
                     </div>
                   )}
                   
                   {!hasGeneratedFollowUpsForSection && (
                     <div className="govuk-!-margin-top-6">
                        <div className="govuk-notification-banner" role="region" aria-labelledby="govuk-notification-banner-title" data-module="govuk-notification-banner">
                          <div className="govuk-notification-banner__header">
                            <h2 className="govuk-notification-banner__title" id="govuk-notification-banner-title">
                              Suggest Follow-ups
                            </h2>
                          </div>
                          <div className="govuk-notification-banner__content">
                            <p className="govuk-notification-banner__heading">
                              Finished this answer?
                            </p>
                            <p className="govuk-body">Get instant follow-up questions tailored to your experience.</p>
                            <button 
                              onClick={handleGenerateFollowUps} 
                              className="govuk-button govuk-!-margin-bottom-0"
                            >
                              Suggest Follow-up Questions
                            </button>
                          </div>
                        </div>
                     </div>
                   )}
                 </>
               )}
             </div>
          </div>

          {/* Navigation Controls */}
          <div className="p-6 border-t flex flex-row gap-4 items-center shrink-0 relative z-20 bg-[#f3f2f1] border-[#b1b4b6]">
             <button 
               onClick={handleNext} 
               className="govuk-button w-full justify-center govuk-!-margin-bottom-0"
             >
               {currentSectionIndex < sections.length - 1 ? 'Next Section' : 'Finish Mock Interview'}
             </button>

             <button 
               onClick={handlePrev} 
               className="govuk-button govuk-button--secondary w-full justify-center govuk-!-margin-bottom-0"
               disabled={currentSectionIndex === 0}
             >
               Previous
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};