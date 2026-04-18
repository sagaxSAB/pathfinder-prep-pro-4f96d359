export type CareerProfile = {
  title: string;
  summary: string;
  salary: { entry: string; mid: string; senior: string; currency_note: string };
  technical_skills: string[];
  soft_skills: string[];
  ai_impact: { score: number; explanation: string };
  future_outlook: string;
  roadmap: { step: string; detail: string; duration: string }[];
  related_careers: string[];
  immediate_action: string;
};

export type CareerRecommendation = {
  title: string;
  match: number;
  why: string;
  tags: string[];
};

export type ResumeFeedback = {
  overall_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  clarity_issues: string[];
  ats_keywords: { present: string[]; missing: string[] };
  skill_gaps: string[];
  improved_bullets: { before: string; after: string }[];
  rewritten_summary: string;
  missing_sections: string[];
};

export type InterviewQuestion = {
  question: string;
  type: "behavioral" | "technical" | "situational";
  tip: string;
};

export type AnswerFeedback = {
  clarity: number;
  confidence: number;
  relevance: number;
  structure: number;
  filler_words: string[];
  quick_summary: string;
  improvements: string[];
  better_answer: string;
};

export type InterviewSummary = {
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  improvement_plan: string[];
};
