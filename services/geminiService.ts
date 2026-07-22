import { GoogleGenAI, Type } from "@google/genai";
import { InterviewSection, InterviewProfile } from '../types';
import { getCriteriaContext } from '../utils/criteriaUtils';

export const AVAILABLE_MODELS = [
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash (Fast & Responsive)' },
  { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro Preview (Advanced Reasoning)' }
] as const;

export const getSelectedModel = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('gemini_model');
    if (stored && (stored === 'gemini-3.6-flash' || stored === 'gemini-3.1-pro-preview')) {
      return stored;
    }
  }
  return 'gemini-3.6-flash';
};

export const setSelectedModel = (model: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gemini_model', model);
  }
};

let inMemoryApiKey: string | null = null;

export const setApiKey = (key: string | null) => {
  inMemoryApiKey = key;
};

export const getApiKey = () => {
  return inMemoryApiKey;
};

const getAiClient = () => {
  const envKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  const apiKey = inMemoryApiKey || envKey;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables or session memory");
  }
  return new GoogleGenAI({ apiKey });
};

export const hasApiKey = (): boolean => {
  const envKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  return !!(inMemoryApiKey || envKey);
};

// --- DEFAULT PROMPT TEMPLATES (British English) ---

export const DEFAULT_PLAN_PROMPT = `Act as an expert UK Civil Service interview coach. Generate a structured interview plan.

**Candidate Profile:**
- Role: {{ROLE}}
- Grade: {{GRADE}}
- Department: {{DEPARTMENT}} {{TEAM}}
- Total Interview Length: {{LENGTH}}

**Candidate Career History:**
{{CAREER_HISTORY}}
{{JOB_CONTEXT}}
{{KNOWN_QUESTIONS_CONTEXT}}

**Requirements:**
1. {{SELECTED_BEHAVIOURS}}
{{SELECTED_BEHAVIOURS_DETAIL}}
2. {{TECH_COMPETENCIES}}

**TIMING RULES (CRITICAL):**
1. **Intro & Closing:** Allocate a consistent short duration for Introduction (e.g., 2-3 mins) and Closing (e.g., 3-5 mins).
2. **Main Questions:** Calculate the remaining time. Generate 4-6 main questions (covering the Behaviours/Competencies/Known Questions).
3. **Consistency:** All MAIN Behavioural/Technical questions **MUST have the EXACT SAME duration** (e.g., if 30 mins remain for 6 questions, every question is exactly 5 minutes). Do not vary the time for main questions.
4. **Strength Questions:** If included, these should be short (e.g. 2 mins) and distinct from main questions.

**CONTENT RULES (CRITICAL):**
- **Perspective:** Write all notes in the **FIRST PERSON ("I")** as if the candidate is speaking.
- For each Main Question (Behavioural/Technical), select **ONE single, distinct example** from the Candidate Career History provided. 
- **Do not** provide generic advice or lists of multiple options.
- **Do not** mix examples within one answer.
- Structure the 'notes' strictly using the **STARR format** (Situation, Task, Action, Result, Reflection).
- **Reflection:** This is critical. Include a brief section on what was learned, what could be done differently.
- **Formatting:** Use double newlines (\n\n) between every section (S, T, A, R, R) so they appear as distinct paragraphs.
- Ensure the 'Action' section is the most detailed part of the notes.`;

export const DEFAULT_INTRO_PROMPT = `Act as an expert UK Civil Service Interview Coach.

**Task:** Rewrite the notes for the **Opening / First Section** of the interview.
**Section Title:** "{{TITLE}}"
**Question:** "{{QUESTION_TEXT}}"
**Target Duration:** {{DURATION}} minutes.

**Candidate Profile:** {{GRADE}} {{ROLE}}
**Candidate Career History:** 
{{CAREER_HISTORY}}

**Current Notes:**
{{CURRENT_NOTES}}

**USER FEEDBACK:**
{{FEEDBACK}}

**CRITICAL OUTPUT RULES:**
1. **Perspective:** Write strictly in the **FIRST PERSON ("I")**.
2. **Pure Script/Notes Only:** Return ONLY the text the candidate should say or read.
3. **NO Meta-Commentary:** Do NOT include labels like "Hook:", "Motivation:", "Timing:", "Section 1:", "Answer Strategy:" or "Approximate time".
4. **NO Markdown Headers:** Do NOT use # headers or bolding for structural labels. Use simple paragraph breaks or bullet points.
5. **Content Logic:**
   - If **Introduction** (e.g. "Intro", "Icebreaker"): Focus on specific motivation for *this* role and department, brief career summary, and key value proposition. Keep it natural and conversational.
   - If **Behavioural**: Use strictly STARR format.
6. **Length:** Content must fit {{DURATION}} minutes.`;

export const DEFAULT_REGEN_PROMPT = `Act as an expert UK Civil Service Interview Coach.

**Task:** Rewrite the notes/answer for the interview section titled "{{TITLE}}".
**Question:** "{{QUESTION_TEXT}}"
**Target Duration:** {{DURATION}} minutes.

**Candidate Profile:** {{GRADE}} {{ROLE}}
**Candidate Career History:** 
{{CAREER_HISTORY}}

**Current Notes:**
{{CURRENT_NOTES}}

**USER FEEDBACK / INSTRUCTIONS FOR REGENERATION:**
{{FEEDBACK}}

**CRITICAL CONTENT RULES (MUST FOLLOW):**
1. **Perspective:** Write strictly in the **FIRST PERSON ("I")**.
2. **STARR Format:** Structure the notes strictly using the **STARR format** (Situation, Task, Action, Result, Reflection).
3. **Timing:** The content MUST fit within the {{DURATION}} minute time limit when spoken at a moderate pace. Adjust detail level accordingly.
4. **Single Example:** Focus on **ONE single, distinct example**. Do not mix examples.
5. **Formatting:** Use double newlines (\n\n) between every section (S, T, A, R, R) so they appear as distinct paragraphs in the output.
6. **Action Focus:** Ensure the 'Action' section is the most detailed part.
7. **Reflection:** Include a brief section on what was learned.
8. **Tone:** Ensure the content is punchy, spoken-word friendly, and suitable for the grade.
9. **Constraint:** Return ONLY the new text for the notes. Do not include markdown headers for the section title, just the STARR content.`;

export const DEFAULT_JOB_EXTRACT_PROMPT = `Analyse the following Job Advert text and extract the key details for a Civil Service interview profile.

Job Advert Text:
{{JOB_ADVERT_TEXT}}`;

export const DEFAULT_FOLLOW_UP_PROMPT = `Based on the candidate's planned answer below and their career history, suggest 3 challenging follow-up questions a Civil Service panel might ask to probe deeper.

**CRITICAL INSTRUCTION:**
For EACH question, you must provide "Answer Notes". These should be brief, strategic bullet points advising the candidate on how to answer (e.g. "Cite the specific stakeholder data...", "Focus on the long-term impact..."). **Do NOT write these notes in the first person ("I"). Write them as coaching instructions.**

Also provide a brief "insight" on what the panel is likely looking for in this specific section.

SECTION TITLE: {{SECTION_TITLE}}
SECTION QUESTION: {{SECTION_QUESTION}}

CANDIDATE'S PLANNED ANSWER/NOTES:
{{PLANNED_ANSWER}}

CANDIDATE'S CAREER HISTORY:
{{CAREER_HISTORY}}`;

// Helper to replace placeholders
const fillTemplate = (template: string, replacements: Record<string, string>) => {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    // Only replace if value exists, else remove the placeholder to avoid leaving {{...}} behind
    result = result.split(`{{${key}}}`).join(value || '');
  }
  return result;
};

export type PromptType = 'PLAN' | 'REGEN' | 'INTRO' | 'EXTRACT' | 'FOLLOWUP';

export interface PromptTemplates {
  PLAN: string;
  REGEN: string;
  INTRO: string;
  EXTRACT: string;
  FOLLOWUP: string;
}

export const DEFAULT_PROMPTS: PromptTemplates = {
  PLAN: DEFAULT_PLAN_PROMPT,
  REGEN: DEFAULT_REGEN_PROMPT,
  INTRO: DEFAULT_INTRO_PROMPT,
  EXTRACT: DEFAULT_JOB_EXTRACT_PROMPT,
  FOLLOWUP: DEFAULT_FOLLOW_UP_PROMPT,
};

const LOCAL_STORAGE_PROMPTS_KEY = 'custom_prompts';

export const getStoredPrompts = (): PromptTemplates => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PROMPTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PROMPTS, ...parsed };
      }
    } catch (e) {
      console.error('Failed to parse stored prompts', e);
    }
  }
  return { ...DEFAULT_PROMPTS };
};

export const setStoredPrompts = (prompts: PromptTemplates): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_PROMPTS_KEY, JSON.stringify(prompts));
    } catch (e) {
      console.error('Failed to save prompts to localStorage', e);
    }
  }
};

export const resetStoredPrompt = (type: PromptType): PromptTemplates => {
  const current = getStoredPrompts();
  current[type] = DEFAULT_PROMPTS[type];
  setStoredPrompts(current);
  return current;
};

export const resetStoredPrompts = (): PromptTemplates => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_STORAGE_PROMPTS_KEY);
  }
  return { ...DEFAULT_PROMPTS };
};

export const exportPromptsToJson = (): void => {
  const prompts = getStoredPrompts();
  const blob = new Blob([JSON.stringify(prompts, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'civil-service-prompts.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importPromptsFromJson = (jsonText: string): PromptTemplates => {
  const parsed = JSON.parse(jsonText);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid JSON format');
  }
  const updated: PromptTemplates = {
    PLAN: typeof parsed.PLAN === 'string' ? parsed.PLAN : DEFAULT_PLAN_PROMPT,
    REGEN: typeof parsed.REGEN === 'string' ? parsed.REGEN : DEFAULT_REGEN_PROMPT,
    INTRO: typeof parsed.INTRO === 'string' ? parsed.INTRO : DEFAULT_INTRO_PROMPT,
    EXTRACT: typeof parsed.EXTRACT === 'string' ? parsed.EXTRACT : DEFAULT_JOB_EXTRACT_PROMPT,
    FOLLOWUP: typeof parsed.FOLLOWUP === 'string' ? parsed.FOLLOWUP : DEFAULT_FOLLOW_UP_PROMPT,
  };
  setStoredPrompts(updated);
  return updated;
};

export const generateInterviewPlan = async (profile: InterviewProfile, promptTemplate: string = getStoredPrompts().PLAN): Promise<InterviewSection[]> => {
  const ai = getAiClient();
  
  const selectedBehaviours = profile.behaviours && profile.behaviours.length > 0 
    ? `Focused Behaviours: ${profile.behaviours.join(', ')}` 
    : "Select 3-5 relevant Civil Service Behaviours based on the role and grade.";

  const selectedBehavioursDetail = profile.behaviours && profile.behaviours.length > 0
    ? getCriteriaContext('behaviours', profile.grade, profile.behaviours)
    : "";

  const techCompetencies = profile.techCompetencies 
    ? `Technical Competencies to cover: ${profile.techCompetencies}` 
    : "";

  const jobContext = profile.jobAdvertContext
    ? `\n**Job Advert Context (Use this to tailor questions and language):**\n${profile.jobAdvertContext}`
    : "";

  const knownQuestionsContext = profile.knownQuestions
    ? `\n**KNOWN PRE-SEEN QUESTIONS (CRITICAL):**\nThe candidate has been provided these specific questions in advance:\n${profile.knownQuestions}\n\n**INSTRUCTION:** You MUST create the interview plan based specifically on these questions. Do not generate random behavioural questions if they conflict with these. Map these questions to the most relevant Civil Service Behaviour for the Section Title.`
    : "";

  const prompt = fillTemplate(promptTemplate, {
    ROLE: profile.role,
    GRADE: profile.grade,
    DEPARTMENT: profile.department,
    TEAM: profile.team ? `(Team: ${profile.team})` : '',
    LENGTH: profile.interviewLength || "45 minutes",
    CAREER_HISTORY: profile.careerHistory || "No specific career history provided. Create realistic placeholders suitable for this grade.",
    JOB_CONTEXT: jobContext,
    KNOWN_QUESTIONS_CONTEXT: knownQuestionsContext,
    SELECTED_BEHAVIOURS: selectedBehaviours,
    SELECTED_BEHAVIOURS_DETAIL: selectedBehavioursDetail,
    TECH_COMPETENCIES: techCompetencies
  });

  try {
    const response = await ai.models.generateContent({
      model: getSelectedModel(),
      contents: prompt,
      config: {
        systemInstruction: "You are an expert UK Civil Service interview coach. You provide structured, timed interview plans based on Success Profiles. You prioritise deep, single-example answers over generic breadth.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Title of the section, e.g. 'Behaviour: Leadership'" },
              questionText: { type: Type.STRING, description: "The specific likely question wording, e.g., 'Tell us about a time you had to lead a difficult team.'" },
              notes: { type: Type.STRING, description: "STARR formatted notes with double line breaks between sections." },
              durationMinutes: { type: Type.NUMBER, description: "Duration in minutes (must be consistent for main questions)" }
            },
            required: ["title", "notes", "durationMinutes"]
          }
        }
      }
    });

    const rawData = response.text;
    if (!rawData) return [];
    
    const parsedData = JSON.parse(rawData);
    
    return parsedData.map((item: any) => ({
      id: crypto.randomUUID(),
      title: item.title,
      questionText: item.questionText,
      notes: item.notes,
      durationMinutes: item.durationMinutes
    }));

  } catch (error) {
    console.error("Failed to generate interview plan:", error);
    throw error;
  }
};

export const extractJobDetails = async (jobAdvertText: string, promptTemplate: string = getStoredPrompts().EXTRACT): Promise<Partial<InterviewProfile>> => {
  const ai = getAiClient();
  const prompt = fillTemplate(promptTemplate, {
    JOB_ADVERT_TEXT: jobAdvertText
  });

  try {
    const response = await ai.models.generateContent({
      model: getSelectedModel(),
      contents: prompt,
      config: {
        systemInstruction: "You are a recruitment assistant. Extract the Role, Grade, Department, Team, and required Behaviours/Competencies from the text. If a field is not found, leave it empty.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            role: { type: Type.STRING },
            grade: { type: Type.STRING },
            department: { type: Type.STRING },
            team: { type: Type.STRING },
            behaviours: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of Civil Service Behaviours mentioned (e.g. 'Seeing the Big Picture')" 
            },
            techCompetencies: { type: Type.STRING, description: "Summary of technical skills required" }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return {};
    return JSON.parse(text);

  } catch (error) {
    console.error("Failed to extract job details", error);
    return {};
  }
};

export interface FollowUpItem {
  question: string;
  answerContext: string;
}

export const generateFollowUpQuestions = async (section: InterviewSection, careerHistory: string = '', promptTemplate: string = getStoredPrompts().FOLLOWUP): Promise<{questions: FollowUpItem[], insights: string}> => {
  const ai = getAiClient();
  const prompt = fillTemplate(promptTemplate, {
    SECTION_TITLE: section.title,
    SECTION_QUESTION: section.questionText || "N/A",
    PLANNED_ANSWER: section.notes,
    CAREER_HISTORY: careerHistory
  });

  try {
     const response = await ai.models.generateContent({
      model: getSelectedModel(),
      contents: prompt,
      config: {
        systemInstruction: "You are a tough Civil Service interview panelist. You ask probing follow-up questions to test depth, evidence, and authenticity. You also provide strategic advice on how to answer them based on the candidate's history.",
        responseMimeType: "application/json",
        responseSchema: {
           type: Type.OBJECT,
           properties: {
             questions: {
               type: Type.ARRAY,
               items: { 
                 type: Type.OBJECT,
                 properties: {
                   question: { type: Type.STRING },
                   answerContext: { type: Type.STRING, description: "Bullet points on how to answer based on career history" }
                 },
                 required: ["question", "answerContext"]
               },
               description: "3 probing follow-up questions with answer strategies"
             },
             insights: {
               type: Type.STRING,
               description: "Brief analysis of what the panel is looking for"
             }
           },
           required: ["questions", "insights"]
        }
      }
    });

    const text = response.text;
    if (!text) return { questions: [], insights: '' };
    return JSON.parse(text);

  } catch (error) {
    console.error("Failed to generate follow-ups", error);
    return { questions: [], insights: "Failed to generate insights." };
  }
};

export const regenerateSectionNotes = async (section: InterviewSection, profile: InterviewProfile, feedback: string, promptTemplate: string = getStoredPrompts().REGEN): Promise<string> => {
   const ai = getAiClient();
   
   const prompt = fillTemplate(promptTemplate, {
     TITLE: section.title,
     QUESTION_TEXT: section.questionText || "",
     ROLE: profile.role,
     GRADE: profile.grade,
     DURATION: section.durationMinutes.toString(),
     CAREER_HISTORY: profile.careerHistory || "Not provided.",
     CURRENT_NOTES: section.notes,
     FEEDBACK: feedback
   });

   try {
     const response = await ai.models.generateContent({
        model: getSelectedModel(),
        contents: prompt,
     });
     return response.text || section.notes;
   } catch (error) {
     console.error("Failed to regenerate notes", error);
     throw error;
   }
};

export const parseInterviewNotes = async (text: string): Promise<InterviewSection[]> => {
  const ai = getAiClient();
  const prompt = `Analyse the following raw text which represents a user's interview notes. 
  Extract distinct interview sections.
  
  For each section, separate the content into:
  1. **Title**: The section name (e.g. "Leadership Behaviour").
  2. **Question Text**: The specific question being asked, if available (e.g. "Tell me about a time you led a team.").
  3. **Duration**: The total allocated time in minutes.
  4. **Notes**: The actual answer script or content (verbatim).

  CRITICAL RULES FOR "NOTES" FIELD:
  - **REMOVE** the text that was used for the Title or Duration.
  - **KEEP** the rest of the answer text **VERBATIM**. 
  - Do NOT summarize. Do NOT rewrite. Do NOT change first-person ("I") to third-person.
  
  Input Text:
  ${text}`;

  try {
     const response = await ai.models.generateContent({
      model: getSelectedModel(),
      contents: prompt,
      config: {
        systemInstruction: "You are an assistant that structures raw interview notes. You must intelligently separate metadata (Title, Question, Duration) from the content (Notes), while keeping the content absolutely verbatim.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Section title" },
              questionText: { type: Type.STRING, description: "Specific question wording if present" },
              notes: { type: Type.STRING, description: "The answer content, verbatim." },
              durationMinutes: { type: Type.NUMBER, description: "Duration in minutes" }
            },
            required: ["title", "notes", "durationMinutes"]
          }
        }
      }
    });
    
    const rawData = response.text;
    if (!rawData) return [];
    
    const parsedData = JSON.parse(rawData);
    return parsedData.map((item: any) => ({
      id: crypto.randomUUID(),
      title: item.title,
      questionText: item.questionText,
      notes: item.notes,
      durationMinutes: item.durationMinutes
    }));

  } catch (error) {
    console.error("Failed to parse notes:", error);
    throw error;
  }
};