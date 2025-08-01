export interface Variable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'color' | 'boolean' | 'list';
  description?: string;
  defaultValue?: any;
  required?: boolean;
}

export interface VariableResult {
  variableId: string;
  variableName: string;
  value: any;
  confidence?: number;
  source: 'ai' | 'ocr' | 'user';
  improved?: boolean;
}

export interface ImageAnalysis {
  id: string;
  imageUrl: string;
  imageName: string;
  uploadedAt: Date;
  variables: Variable[];
  results: VariableResult[];
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  variables: Variable[];
  createdAt: Date;
  updatedAt: Date;
}

export interface APISettings {
  geminiApiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface AppState {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  currentImage: ImageAnalysis | null;
  apiSettings: APISettings | null;
  isProcessing: boolean;
}

export interface ColorInfo {
  hex: string;
  rgb: { r: number; g: number; b: number };
  name?: string;
  dominance?: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}
