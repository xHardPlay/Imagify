import React, { useEffect } from 'react';
import { Upload, ImageIcon, Loader, Settings } from 'lucide-react';
import { Workflow, APISettings, ImageAnalysis, Variable, VariableResult } from '../../types';
import { api } from '../../services/api';

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
  }, [workflow, apiSettings, isProcessing]);

  const handleImageUpload = async (file: File) => {
    // Check if user has configured API key
    if (!apiSettings?.hasApiKey) {
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

      // Call API proxy for analysis
      const results = await analyzeImageWithProxy(compressedBase64, workflow.variables, apiSettings);

      // Update image analysis with results
      imageAnalysis.results = results;
      imageAnalysis.status = 'completed';

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

  const analyzeImageWithProxy = async (
    base64Image: string,
    variables: Variable[],
    settings: APISettings
  ): Promise<VariableResult[]> => {
    if (variables.length === 0) {
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

    const contents = [{
      parts: [
        { text: prompt },
        {
          inline_data: {
            mime_type: 'image/jpeg',
            data: base64Image
          }
        }
      ]
    }];

    const generationConfig = {
      temperature: settings.temperature,
      maxOutputTokens: settings.maxTokens,
    };

    try {
      const response = await api.analyzeImage(contents, generationConfig);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to analyze image');
      }

      const data = response.data;
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error('No response from Gemini API');
      }

      // Parse the response
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

      const analysisResults = JSON.parse(jsonStr);

      // Convert to VariableResult format
      const results: VariableResult[] = variables.map(variable => {
        const result = analysisResults[variable.name];

        return {
          variableId: variable.id,
          variableName: variable.name,
          value: result?.value !== undefined ? result.value : null,
          confidence: typeof result?.confidence === 'number' ? result.confidence : 0,
          source: 'ai' as const
        };
      });

      return results;

    } catch (error) {
      console.error('Error in analyzeImageWithProxy:', error);

      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED')) {
          throw new Error('API quota exceeded! Please try again later or check your billing settings.');
        }
        if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('API access denied. Please check your API key.');
        }
      }

      throw error;
    }
  };

  if (!apiSettings?.hasApiKey) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <div className="relative mb-8">
              <ImageIcon className="h-20 w-20 text-purple-300 mx-auto animate-pulse" />
              <div className="absolute inset-0 h-20 w-20 mx-auto bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <h3 className="text-2xl font-bold gradient-text mb-4">
              API Key Required
            </h3>
            <p className="text-purple-600/70 text-lg leading-relaxed max-w-md mx-auto">
              Please configure your Google Gemini API key in the settings to unlock AI-powered image analysis!
            </p>
            <div className="mt-8">
              <button
                onClick={() => {/* This should open settings */}}
                className="btn btn-primary btn-lg group"
              >
                <Settings className="h-5 w-5 mr-2 group-hover:animate-spin" />
                Open Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title text-xl sm:text-2xl lg:text-3xl">Upload Image for Analysis</h2>
          <p className="card-description text-sm sm:text-base">
            Upload or paste an image to analyze with your "{workflow.name}" workflow
          </p>
        </div>
        <div className="card-content">
          <div
            className="upload-zone p-6 sm:p-8 lg:p-12"
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
                  <Loader className="h-12 w-12 sm:h-16 sm:w-16 text-purple-500 mx-auto mb-4 sm:mb-6 animate-spin" />
                  <div className="absolute inset-0 h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-lg opacity-30 animate-pulse"></div>
                </div>
              ) : (
                <div className="relative group">
                  <Upload className="h-12 w-12 sm:h-16 sm:w-16 text-purple-400 mx-auto mb-4 sm:mb-6 group-hover:animate-bounce transition-all" />
                  <div className="absolute inset-0 h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                </div>
              )}
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold gradient-text mb-2 sm:mb-3">
                {isProcessing ? 'Processing image...' : 'Upload your image'}
              </h3>
              <p className="text-purple-600/70 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg">
                {isProcessing
                  ? 'Our AI is analyzing your image, please wait...'
                  : 'Drag and drop an image here, click to select, or press Ctrl+V to paste from clipboard'
                }
              </p>
              <button
                className="btn btn-primary btn-md sm:btn-lg group w-full sm:w-auto"
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
                <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-2 group-hover:animate-bounce" />
                {isProcessing ? 'Processing...' : 'Choose File'}
              </button>
            </div>
          </div>

          {workflow.variables.length === 0 && (
            <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl shadow-lg">
              <div className="flex items-start sm:items-center space-x-3">
                <div className="text-xl sm:text-2xl flex-shrink-0">Warning</div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-yellow-800 mb-1">
                    No variables defined!
                  </p>
                  <p className="text-xs sm:text-sm text-yellow-700">
                    Add variables to your workflow to extract specific information from images.
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
