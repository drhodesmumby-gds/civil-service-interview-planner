export interface InterviewSection {
  id: string;
  title: string;
  questionText?: string;
  notes: string;
  durationMinutes: number;
}

export interface InterviewProfile {
  role: string;
  grade: string;
  department: string;
  interviewLength?: string;
  team?: string;
  behaviours?: string[];
  techCompetencies?: string;
  careerHistory?: string;
  jobAdvertContext?: string;
  knownQuestions?: string;
}

export enum AppState {
  SETUP = 'SETUP',
  RUNNING = 'RUNNING',
  SUMMARY = 'SUMMARY',
  ABOUT = 'ABOUT'
}

export type Theme = 'DEFAULT' | 'GDS';