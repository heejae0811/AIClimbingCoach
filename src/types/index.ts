export type Tab = "home" | "analyze" | "history" | "profile";

export type Message = {
  id: string;
  role: "user" | "ai";
  text: string;
};

export type LimeFactor = {
  feature_condition: string;
  importance: number;
};

export type AnalysisRecord = {
  id: string;
  date: string;
  level: string;
  prediction: number;
  confidence: number;
  lime: LimeFactor[];
  feedback: string;
  videoUri?: string;
};

export type UserProfile = {
  height: string;
  weight: string;
  age: string;
  experience: string;
  sessions: string;
  currentGrade: string;
  goalGrade: string;
};
