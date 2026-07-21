import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw, CheckCircle2, AlertCircle, Clock, MessageSquarePlus, Sparkles, AlignLeft, List, ChevronDown, HelpCircle, SkipForward, ArrowDownCircle, Lightbulb } from 'lucide-react';
import { InterviewSection, Theme } from '../types';
import { Button } from './Button';
import { generateFollowUpQuestions, FollowUpItem } from '../services/geminiService';

interface LiveViewProps {
  sections: InterviewSection[];
  careerHistory?: string;
  onExit: () => void;
  theme: Theme;
}

type PrompterMode = 'WORD' | 'BLOCK';

export const LiveView: React.FC<LiveViewProps> = ({ sections, careerHistory, onExit, theme }) => {
  const isGds = theme === 'GDS';
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
    } catch (e) {
      console.error(e);
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
    if (isOvertime) return 'text-[#d4351c] bg-[#f3f2f1] border-[#d4351c]';
    if (timeLeft < 60) return 'text-[#b78c00] bg-[#fff8e1] border-[#b78c00]';
    if (isGds) return 'text-[#0b0c0c] bg-white border-[#b1b4b6]';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const progressPercentage = ((currentSectionIndex) / sections.length) * 100;
  
  // Dynamic layout calculation for the side panel
  const sidePanelWidthClass = showFollowUps ? 'w-[30rem] xl:w-[35rem]' : 'w-96';

  return (
    <div className={`h-full flex flex-col overflow-hidden ${isGds ? 'bg-[#f3f2f1]' : 'bg-slate-50'}`}>
      {/* Top Bar */}
      <div className={`px-6 py-4 flex items-center justify-between shadow-sm z-10 shrink-0 ${isGds ? 'bg-white border-b-2 border-[#1d70b8]' : 'bg-white border-b border-slate-200'}`}>
        <div className="flex items-center gap-4">
           <button onClick={onExit} className={`text-sm font-medium ${isGds ? 'text-[#1d70b8] underline hover:text-[#003078]' : 'text-slate-500 hover:text-slate-800'}`}>
             Exit
           </button>
           <div className="h-6 w-px bg-slate-200"></div>
           <div>
             <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Time</h2>
             <span className={`font-mono text-lg ${isGds ? 'text-[#0b0c0c] font-bold' : 'text-slate-800'}`}>{formatTime(elapsedTotal)}</span>
           </div>
        </div>
        <div className="flex flex-col items-end w-1/3">
           <div className="flex justify-between w-full text-xs font-medium text-slate-500 mb-1">
             <span>Progress</span>
             <span>{Math.round(progressPercentage)}%</span>
           </div>
           <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
             <div 
                className={`h-full transition-all duration-500 ease-out ${isGds ? 'bg-[#1d70b8]' : 'bg-blue-600'}`}
                style={{ width: `${progressPercentage}%` }}
             ></div>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Timing Guide Panel */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth"
        >
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="relative group">
                  <select
                    value={currentSectionIndex}
                    onChange={(e) => setCurrentSectionIndex(Number(e.target.value))}
                    className={`appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-bold uppercase tracking-wide cursor-pointer transition-colors max-w-[200px] truncate ${isGds ? 'bg-[#f3f2f1] text-[#0b0c0c] border border-[#b1b4b6]' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
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
              <h1 className={`text-3xl md:text-4xl font-bold leading-tight mb-2 ${isGds ? 'text-[#0b0c0c]' : 'text-slate-900'}`}>
                {currentSection.title}
              </h1>
              <div className="text-slate-500 font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" /> Allocated: {currentSection.durationMinutes} mins
              </div>
            </div>

            {/* Specific Question Display */}
            {currentSection.questionText && (
               <div className={`${isGds ? 'bg-white border-l-8 border-[#1d70b8] p-6 shadow-sm' : 'bg-indigo-50 border-l-4 border-indigo-500 p-6 rounded-r-xl shadow-sm'}`}>
                 <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1 ${isGds ? 'text-[#1d70b8]' : 'text-indigo-400'}`}>
                    <HelpCircle className="w-4 h-4"/> Question
                 </h3>
                 <p className={`text-xl md:text-2xl leading-relaxed ${isGds ? 'text-[#0b0c0c] font-bold' : 'font-serif text-indigo-900'}`}>
                   "{currentSection.questionText}"
                 </p>
               </div>
            )}

            <div className={`${isGds ? 'bg-white p-8 border border-[#b1b4b6]' : 'bg-white p-8 rounded-2xl shadow-sm border border-slate-200'} min-h-[50vh]`}>
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
                    let styleClass = isGds ? "text-[#0b0c0c] transition-colors duration-300" : "text-slate-900 transition-colors duration-300"; 
                    if (isPassed) {
                      styleClass = "text-slate-300 transition-colors duration-500";
                    } else if (isCurrent) {
                      styleClass = isGds 
                        ? "text-[#0b0c0c] bg-[#ffdd00] py-1 px-1 rounded decoration-clone transition-all duration-200" 
                        : "text-blue-600 bg-blue-50 py-1 rounded decoration-clone transition-all duration-200"; 
                    }
                    return (
                      <span key={index} {...refProps} className={styleClass}>
                        {unit}
                      </span>
                    );
                  } else {
                    // BLOCK MODE RENDERING
                    let styleClass = "p-4 rounded-xl transition-all duration-500 border-l-4 ";
                    
                    if (isPassed) {
                      styleClass += "border-transparent text-slate-300 opacity-60 scale-95 origin-left";
                    } else if (isCurrent) {
                      if (isGds) {
                        styleClass += "bg-white border-[#1d70b8] text-[#0b0c0c] shadow-md scale-100 ring-4 ring-[#ffdd00]/30";
                      } else {
                        styleClass += "bg-blue-50 border-blue-500 text-slate-900 shadow-sm scale-100";
                      }
                    } else {
                      styleClass += "border-transparent text-slate-500 scale-95 origin-left opacity-60"; // Future items dimmed slightly to focus attention
                    }
                    
                    // Retrieve weighted start time for this block
                    const blockTime = Math.floor(unitTimings[index]?.startTime || 0);

                    return (
                      <div key={index} {...refProps} className="flex gap-4 group">
                        <div className="w-12 pt-5 text-right shrink-0 select-none">
                           <span className={`text-xs font-mono font-medium transition-colors duration-300 ${isCurrent ? (isGds ? 'text-[#1d70b8]' : 'text-blue-600') : 'text-slate-300 group-hover:text-slate-400'}`}>
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
                                 theme={theme}
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
        <div className={`${sidePanelWidthClass} transition-all duration-500 border-l flex flex-col shadow-xl z-20 shrink-0 relative ${isGds ? 'bg-white border-[#b1b4b6]' : 'bg-white border-slate-200'}`}>
          
          {/* Responsive Timer Header */}
          {showFollowUps ? (
            <div className={`flex items-center justify-between px-6 py-3 border-b shadow-sm ${getTimerColor()}`}>
               <div className="flex items-center gap-2">
                 <Clock className="w-4 h-4" />
                 <span className="text-sm font-bold uppercase opacity-80">Remaining</span>
               </div>
               <div className="text-xl font-mono font-bold tracking-tight">
                 {isOvertime ? '+' : ''}{formatTime(timeLeft)}
               </div>
               <div className="flex gap-2">
                  <button onClick={toggleTimer} className="p-1.5 rounded-full hover:bg-black/10 transition-colors">
                    {isActive ? <Pause className="w-4 h-4 fill-current"/> : <Play className="w-4 h-4 fill-current"/>}
                  </button>
               </div>
            </div>
          ) : (
            <div className={`flex flex-col items-center justify-center p-8 border-b transition-colors duration-500 ${getTimerColor()}`}>
              <span className="text-sm font-bold uppercase opacity-70 mb-2">
                {isOvertime ? 'Overtime' : 'Time Remaining'}
              </span>
              <div className="text-7xl font-mono font-bold tracking-tighter tabular-nums">
                {isOvertime ? '+' : ''}{formatTime(timeLeft)}
              </div>
              
              <div className="flex gap-4 mt-6">
                <button 
                  onClick={toggleTimer}
                  className="p-3 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
                >
                  {isActive ? <Pause className="w-6 h-6 fill-current"/> : <Play className="w-6 h-6 fill-current"/>}
                </button>
                <button 
                  onClick={() => {
                    setTimeLeft(currentSection.durationMinutes * 60);
                    // Do not reset elapsedTotal here
                    setIsOvertime(false);
                    setIsActive(false);
                  }}
                  className="p-3 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
                >
                  <RotateCcw className="w-6 h-6"/>
                </button>
              </div>
            </div>
          )}

          {/* Context / Follow-up Panel */}
          <div className={`flex-1 flex flex-col overflow-hidden relative ${isGds ? 'bg-[#f3f2f1]' : 'bg-slate-50'}`}>
             
             {/* Mode Toggle Tabs */}
             <div className="flex border-b border-slate-200 bg-white">
               <button 
                 onClick={() => setShowFollowUps(false)}
                 className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${!showFollowUps ? (isGds ? 'text-[#1d70b8] border-b-2 border-[#1d70b8]' : 'text-blue-600 border-b-2 border-blue-600') : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Queue
               </button>
               <button 
                 onClick={() => {
                   if (!hasGeneratedFollowUpsForSection) handleGenerateFollowUps();
                   else setShowFollowUps(true);
                 }}
                 className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 ${showFollowUps ? (isGds ? 'text-[#1d70b8] border-b-2 border-[#1d70b8]' : 'text-blue-600 border-b-2 border-blue-600') : 'text-slate-400 hover:text-slate-600'}`}
               >
                 <Sparkles className="w-3 h-3" /> Follow-ups
               </button>
             </div>

             {/* Tab Content */}
             <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
               {showFollowUps ? (
                 <div className="space-y-6">
                    {isGeneratingFollowUps ? (
                      <div className="text-center py-10 text-slate-400 animate-pulse">
                        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                        <p>Analyzing answer & history...</p>
                      </div>
                    ) : (
                      <>
                        <div className={`${isGds ? 'bg-white border-[#00703c] border-l-4 p-5 shadow-sm' : 'bg-indigo-50 p-5 rounded-lg border border-indigo-100 text-indigo-800'}`}>
                          <h4 className="font-bold flex items-center gap-2 mb-2 text-sm">
                             <Sparkles className="w-4 h-4"/> Panel Insight
                          </h4>
                          <p className="text-sm leading-relaxed">{insight}</p>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Potential Questions</h4>
                          {followUps.map((item, i) => (
                             <div key={i} className={`flex flex-col gap-3 p-5 ${isGds ? 'bg-white border-l-4 border-[#b1b4b6] shadow-sm' : 'bg-white rounded-xl border border-slate-200 shadow-sm'}`}>
                               <div className={`text-base font-bold ${isGds ? 'text-[#0b0c0c]' : 'text-slate-800'}`}>
                                 "{item.question}"
                               </div>
                               
                               <div className={`mt-2 p-3 text-sm leading-relaxed rounded-lg ${isGds ? 'bg-[#f3f2f1] text-[#0b0c0c] border border-[#b1b4b6]' : 'bg-slate-50 text-slate-700'}`}>
                                  <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider opacity-60">
                                     <Lightbulb className="w-3 h-3" /> Answer Strategy
                                  </div>
                                  <div className="whitespace-pre-wrap">{item.answerContext}</div>
                               </div>
                             </div>
                          ))}
                        </div>
                        
                        <div className="pt-4 pb-8">
                          <Button onClick={handleGenerateFollowUps} variant="secondary" className="w-full text-xs" icon={<RotateCcw className="w-3 h-3"/>} theme={theme}>
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
                     <div className={`p-4 opacity-70 ${isGds ? 'bg-white border border-[#b1b4b6]' : 'bg-white rounded-xl border border-slate-200 shadow-sm'}`}>
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
                     <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className={`${isGds ? 'bg-white border border-[#1d70b8] p-6 text-center' : 'bg-blue-50 p-6 rounded-xl border border-blue-100 text-center'}`}>
                          <p className={`text-sm mb-4 font-medium ${isGds ? 'text-[#0b0c0c]' : 'text-blue-800'}`}>
                            Finished this answer? 
                            <span className="block text-xs font-normal opacity-70 mt-1">Get instant follow-up questions tailored to your experience.</span>
                          </p>
                          <Button 
                            onClick={handleGenerateFollowUps} 
                            className="w-full text-sm py-3"
                            icon={<MessageSquarePlus className="w-4 h-4"/>}
                            theme={theme}
                          >
                            Predict Follow-up Questions
                          </Button>
                        </div>
                     </div>
                   )}
                 </>
               )}
             </div>
          </div>

          {/* Navigation Controls */}
          <div className={`p-6 border-t space-y-3 shrink-0 relative z-20 ${isGds ? 'bg-[#f3f2f1] border-[#b1b4b6]' : 'bg-white border-slate-200'}`}>
             <Button 
               onClick={handleNext} 
               className="w-full py-4 text-lg justify-between group"
               variant="primary"
               theme={theme}
             >
               {currentSectionIndex < sections.length - 1 ? 'Next Section' : 'Finish Mock Interview'}
               <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
             </Button>

             <Button 
               onClick={handlePrev} 
               className="w-full"
               variant="ghost"
               disabled={currentSectionIndex === 0}
               theme={theme}
             >
               <ArrowLeft className="w-4 h-4 mr-2" /> Previous
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
};