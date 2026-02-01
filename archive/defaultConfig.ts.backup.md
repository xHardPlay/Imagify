import { APISettings, Workflow } from '../types';

export interface DefaultConfig {
  apiSettings: APISettings;
  workflows: Workflow[];
}

// Configuración por defecto hardcodeada
const DEFAULT_CONFIG = {
  geminiApiKey: "AIzaSyDZQrfructfSRUKela-AIzaSyBu2TDO3xCKydlxemRfA8pPg9ZmY7sAxlI",
  model: "gemini-1.5-flash",
  maxTokens: 2000,
  temperature: 0.4
};

const DEFAULT_WORKFLOWS = [
  {
    id: "1753556749822",
    name: "Imange Reversion",
    description: "Ideal for ComfyUI",
    variables: [
      {
        name: "Image Tittle",
        type: "text",
        description: "a tittle for this image",
        defaultValue: "",
        required: true,
        id: "1753556781128"
      },
      {
        name: "Image Prompt",
        type: "text",
        description: "describe this image with tons of details as if you were a Reverse Prompt Engineer to be able to create the exact same image using the prompt.",
        defaultValue: "",
        required: true,
        id: "1753556810511"
      }
    ],
    createdAt: "2025-07-26T19:05:49.822Z",
    updatedAt: "2025-07-26T19:19:38.233Z"
  },
  {
    id: "1753557915232",
    name: "IMG2VID",
    description: "Image to Video",
    variables: [
      {
        name: "Video Tittle",
        type: "text",
        description: "a tittle for this image",
        defaultValue: "",
        required: true,
        id: "1753557942736"
      },
      {
        name: "Video Prompt",
        type: "text",
        description: "i want to create a stunning video from this image , provide a detailed prompt to generate a stunning video from this image. Include Camera movement, composition and every detail you can. Respond in prompt format",
        defaultValue: "",
        required: true,
        id: "1753558002521"
      }
    ],
    createdAt: "2025-07-26T19:25:15.232Z",
    updatedAt: "2025-07-26T19:26:42.521Z"
  },
  {
    id: "1753562960286",
    name: "Multi Video",
    description: "Create 5 sequences from the image to video",
    variables: [
      {
        name: "Sequences",
        type: "text",
        description: "i want to create 5 stunning videos from this image , provide a detailed prompt to generate each stunning video from this image. Include Camera movement, composition and every detail you can. Respond in prompt format. Make the videos correlative like part of the same scene.",
        defaultValue: "",
        required: true,
        id: "1753563054948"
      }
    ],
    createdAt: "2025-07-26T20:49:20.286Z",
    updatedAt: "2025-07-26T20:50:54.948Z"
  }
];

export const loadDefaultConfig = (): DefaultConfig => {
  try {
    // Cargar configuración de API
    const apiSettings: APISettings = {
      geminiApiKey: DEFAULT_CONFIG.geminiApiKey,
      model: DEFAULT_CONFIG.model,
      maxTokens: DEFAULT_CONFIG.maxTokens,
      temperature: DEFAULT_CONFIG.temperature
    };

    // Cargar workflows por defecto
    const workflows: Workflow[] = DEFAULT_WORKFLOWS.map((workflow: any) => ({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      variables: workflow.variables.map((variable: any) => ({
        id: variable.id,
        name: variable.name,
        type: variable.type,
        description: variable.description,
        defaultValue: variable.defaultValue,
        required: variable.required
      })),
      createdAt: new Date(workflow.createdAt),
      updatedAt: new Date(workflow.updatedAt)
    }));

    return {
      apiSettings,
      workflows
    };
  } catch (error) {
    console.error('Error loading default config:', error);
    
    // Configuración de fallback
    return {
      apiSettings: {
        geminiApiKey: '',
        model: 'gemini-1.5-flash',
        maxTokens: 2000,
        temperature: 0.4
      },
      workflows: []
    };
  }
};

export const shouldLoadDefaults = (): boolean => {
  const appState = localStorage.getItem('imagify-app-state');
  console.log('shouldLoadDefaults - appState from localStorage:', appState);
  
  if (!appState) {
    console.log('shouldLoadDefaults - no appState found, returning true');
    return true;
  }
  
  try {
    const parsedState = JSON.parse(appState);
    console.log('shouldLoadDefaults - parsed state:', parsedState);
    console.log('shouldLoadDefaults - workflows length:', parsedState.workflows?.length);
    
    // Si no hay workflows o hay 0 workflows, cargar por defecto
    const shouldLoad = !parsedState.workflows || parsedState.workflows.length === 0;
    console.log('shouldLoadDefaults - should load:', shouldLoad);
    return shouldLoad;
  } catch (error) {
    console.error('Error parsing app state:', error);
    return true;
  }
};

export const initializeAppWithDefaults = () => {
  if (shouldLoadDefaults()) {
    const defaultConfig = loadDefaultConfig();
    
    const initialAppState = {
      workflows: defaultConfig.workflows,
      currentWorkflow: defaultConfig.workflows.length > 0 ? defaultConfig.workflows[0] : null,
      currentImage: null,
      apiSettings: defaultConfig.apiSettings,
      isProcessing: false,
    };
    
    localStorage.setItem('imagify-app-state', JSON.stringify(initialAppState));
    
    console.log('App initialized with default configuration');
    console.log('Default workflows loaded:', defaultConfig.workflows.length);
    console.log('API settings configured');
    
    return true;
  }
  
  return false;
}; 