export interface ActionItem {
  task: string;
  due_date: string | null;
}

export interface SalesAnalysis {
  is_sales_call: boolean;
  customer_name: string | null;
  summary: string;
  topics_discussed: string[];
  customer_sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Hostile';
  objections_raised: string[];
  action_items: ActionItem[];
}

export interface AnalysisResult {
  transcription: string;
  analysis: SalesAnalysis;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}