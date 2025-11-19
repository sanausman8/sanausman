export interface ProcessedImage {
  id: string;
  file: File;
  previewUrl: string;
  aiDescription?: string;
  isAnalyzing: boolean;
}

export interface PDFGenerationOptions {
  includeAiCaptions: boolean;
  quality: number;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}
