import React, { useEffect } from 'react';
import { Upload, ImageIcon, Loader, Settings } from 'lucide-react';
import { Workflow, APISettings, ImageAnalysis, Variable, VariableResult } from '../../types';

interface ImageUploadProps {
  workflow: Workflow;
  apiSettings: APISettings | null;
  onImageAnalyzed: (analysis: ImageAnalysis) => void;
  isProcessing: boolean;
  onProcessingChange: (isProcessing: boolean) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  workflow, 
  apiSettings, 
  onImageAnalyzed, 
  isProcessing, 
  onProcessingChange 
}) => {

  // Handle clipboard paste
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            await handleImageUpload(file);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [workflow, apiSettings, isProcessing]); // Dependencies for handleImageUpload

  const handleImageUpload = async (file: File) => {
    if (!apiSettings?.geminiApiKey) {
      alert('Please configure your Gemini API key first.');
      return;
    }

    onProcessingChange(true);
    
    try {
      // Compress and convert file to base64
      const compressedBase64 = await compressAndConvertToBase64(file);
      
      // Create image analysis object
      const imageAnalysis: ImageAnalysis = {
        id: Date.now().toString(),
        imageUrl: URL.createObjectURL(file),
        imageName: file.name,
        uploadedAt: new Date(),
        variables: workflow.variables,
        results: [],
        status: 'processing'
      };
      
      // Call Gemini API for analysis
      const results = await analyzeImageWithGemini(compressedBase64, workflow.variables, apiSettings);
      
      console.log('Analysis results:', results); // Debug log
      
      // Update image analysis with results
      imageAnalysis.results = results;
      imageAnalysis.status = 'completed';
      
      console.log('About to call onImageAnalyzed with:', imageAnalysis);
      console.log('Results being passed:', results);
      
      // Force a small delay to ensure state is properly set
      setTimeout(() => {
        onImageAnalyzed(imageAnalysis);
      }, 100);
      
    } catch (error) {
      console.error('Error processing image:', error);
      
      // Create error analysis object
      const errorAnalysis: ImageAnalysis = {
        id: Date.now().toString(),
        imageUrl: URL.createObjectURL(file),
        imageName: file.name,
        uploadedAt: new Date(),
        variables: workflow.variables,
        results: [],
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      
      onImageAnalyzed(errorAnalysis);
      alert(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      onProcessingChange(false);
    }
  };

  const compressAndConvertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 1024px on longest side)
        const maxSize = 1024;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with compression (0.8 quality)
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            // Remove data URL prefix
            resolve(base64.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.8);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const analyzeImageWithGemini = async (
    base64Image: string, 
    variables: Variable[], 
    apiSettings: APISettings
  ): Promise<VariableResult[]> => {
    console.log('Starting Gemini analysis with variables:', variables);
    
    if (variables.length === 0) {
      console.log('No variables defined, returning empty results');
      return [];
    }
    
    // Build prompt based on workflow variables
    const variablePrompts = variables.map(variable => 
      `- ${variable.name} (${variable.type}): ${variable.description || 'Extract this information'}`
    ).join('\n');
    
    const prompt = `Please analyze this image and extract the following information. Return your response as a valid JSON object only, with no additional text or markdown formatting.

Extract these variables:
${variablePrompts}

For each variable, provide the extracted value and a confidence score between 0 and 1. If a value cannot be determined, use null for the value.

Response format (JSON only):
{
  "${variables[0]?.name || 'variable_name'}": {
    "value": "extracted_value_or_null",
    "confidence": 0.95
  }
}`;

    console.log('Sending prompt to Gemini:', prompt);
    console.log('Using model:', apiSettings.model);
    
    const requestBody = {
      contents: [{
        parts: [
          {
            text: prompt
          },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64Image
            }
          }
        ]
      }],
      generationConfig: {
        temperature: apiSettings.temperature,
        maxOutputTokens: apiSettings.maxTokens,
      }
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${apiSettings.model}:generateContent?key=${apiSettings.geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      
      // Handle specific quota errors
      if (response.status === 429 || errorText.includes('quota') || errorText.includes('QUOTA_EXCEEDED')) {
        throw new Error('🚫 Google API quota exceeded! Please try again later or check your billing settings.');
      }
      
      if (response.status === 403) {
        throw new Error('🔑 API access denied. Please check your API key permissions.');
      }
      
      if (response.status === 400) {
        throw new Error('📷 Invalid image format or request. Please try a different image.');
      }
      
      throw new Error(`🔥 API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', data);
    
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      console.error('No text in Gemini response');
      throw new Error('No response from Gemini API');
    }
    
    console.log('Generated text from Gemini:', generatedText);

    try {
      // Try to extract JSON from response
      let jsonStr = generatedText.trim();
      
      // Remove markdown code blocks if present
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      
      // Find JSON object
      const jsonObjectMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        jsonStr = jsonObjectMatch[0];
      }
      
      console.log('Attempting to parse JSON:', jsonStr);
      const analysisResults = JSON.parse(jsonStr);
      console.log('Parsed analysis results:', analysisResults);
      
      // Convert to VariableResult format
      const results: VariableResult[] = variables.map(variable => {
        const result = analysisResults[variable.name];
        console.log(`Processing variable '${variable.name}':`, result);
        
        return {
          variableId: variable.id,
          variableName: variable.name,
          value: result?.value !== undefined ? result.value : null,
          confidence: typeof result?.confidence === 'number' ? result.confidence : 0,
          source: 'ai' as const
        };
      });
      
      console.log('Final processed results:', results);
      return results;
      
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.log('Raw response that failed to parse:', generatedText);
      
      // Fallback: create results with error info
      const fallbackResults: VariableResult[] = variables.map(variable => ({
        variableId: variable.id,
        variableName: variable.name,
        value: `Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        confidence: 0,
        source: 'ai' as const
      }));
      
      return fallbackResults;
    }
  };

  if (!apiSettings?.geminiApiKey) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <div className="relative mb-8">
              <ImageIcon className="h-20 w-20 text-purple-300 mx-auto animate-pulse" />
              <div className="absolute inset-0 h-20 w-20 mx-auto bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <h3 className="text-2xl font-bold gradient-text mb-4">
              🔑 API Key Required
            </h3>
            <p className="text-purple-600/70 text-lg leading-relaxed max-w-md mx-auto">
              ✨ Please configure your Google Gemini API key in the settings to unlock the magic of AI-powered image analysis!
            </p>
            <div className="mt-8">
              <button 
                onClick={() => {/* This should open settings */}}
                className="btn btn-primary btn-lg group"
              >
                <Settings className="h-5 w-5 mr-2 group-hover:animate-spin" />
                🚀 Open Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Upload Image for Analysis</h2>
          <p className="card-description">
            Upload or paste an image to analyze with your "{workflow.name}" workflow
          </p>
        </div>
        <div className="card-content">
          <div 
            className="upload-zone"
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('drag-over');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('drag-over');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('drag-over');
              const file = e.dataTransfer.files[0];
              if (file && file.type.startsWith('image/')) {
                handleImageUpload(file);
              }
            }}
          >
            <div className="text-center">
              {isProcessing ? (
                <div className="relative">
                  <Loader className="h-16 w-16 text-purple-500 mx-auto mb-6 animate-spin" />
                  <div className="absolute inset-0 h-16 w-16 mx-auto mb-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-lg opacity-30 animate-pulse"></div>
                </div>
              ) : (
                <div className="relative group">
                  <Upload className="h-16 w-16 text-purple-400 mx-auto mb-6 group-hover:animate-bounce transition-all" />
                  <div className="absolute inset-0 h-16 w-16 mx-auto mb-6 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                </div>
              )}
              <h3 className="text-2xl font-bold gradient-text mb-3">
                {isProcessing ? '🚀 Processing image...' : '📸 Upload your image'}
              </h3>
              <p className="text-purple-600/70 mb-8 text-lg">
                {isProcessing 
                  ? '🤖 Our AI is analyzing your image, please wait...' 
                  : '✨ Drag and drop an image here, click to select, or press Ctrl+V to paste from clipboard'
                }
              </p>
              <button 
                className="btn btn-primary btn-lg group"
                disabled={isProcessing}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleImageUpload(file);
                  };
                  input.click();
                }}
              >
                <Upload className="h-5 w-5 mr-2 group-hover:animate-bounce" />
                {isProcessing ? '🔄 Processing...' : '🎯 Choose File'}
              </button>
            </div>
          </div>
          
          {workflow.variables.length === 0 && (
            <div className="mt-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">⚠️</div>
                <div>
                  <p className="text-sm font-semibold text-yellow-800 mb-1">
                    No variables defined!
                  </p>
                  <p className="text-sm text-yellow-700">
                    🎯 Add variables to your workflow to extract specific information from images.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
