import React, { useState } from 'react';
import { Copy, ImageIcon, MessageCircle, Send, X, Star, Sparkles } from 'lucide-react';
import { ImageAnalysis, APISettings } from '../../types';

interface ResultsDisplayProps {
  imageAnalysis: ImageAnalysis;
  onExport: (format: 'json' | 'csv' | 'txt') => void;
  apiSettings: APISettings | null;
  // Eliminar onRetry
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ imageAnalysis, apiSettings }) => {
  
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Improve results state
  const [showImproveModal, setShowImproveModal] = useState(false);
  const [improveRequest, setImproveRequest] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  
  // Debug logging
  console.log('ResultsDisplay received imageAnalysis:', imageAnalysis);
  console.log('Results array:', imageAnalysis.results);
  console.log('Results length:', imageAnalysis.results.length);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Add toast notification
  };



  const sendChatMessage = async () => {
    if (!currentMessage.trim() || !apiSettings?.geminiApiKey || isChatLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsChatLoading(true);

    try {
      // Convert image to base64 for API
      const response = await fetch(imageAnalysis.imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        const prompt = `You are analyzing this image. The user is asking: "${currentMessage}". Please provide a helpful and detailed response about the image.`;
        
        try {
          const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${apiSettings.model}:generateContent?key=${apiSettings.geminiApiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: base64
                    }
                  }
                ]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
              }
            })
          });

          if (!apiResponse.ok) {
            throw new Error('API request failed');
          }

          const data = await apiResponse.json();
          const aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not analyze the image.';
          
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: aiResponseText,
            timestamp: new Date()
          };

          setChatMessages(prev => [...prev, aiMessage]);
        } catch (error) {
          console.error('Chat API error:', error);
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: 'Sorry, I encountered an error while analyzing the image. Please try again.',
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, errorMessage]);
        }
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error processing image for chat:', error);
    } finally {
      setIsChatLoading(false);
    }
  };

  const improveResult = async () => {
    if (!improveRequest.trim() || !apiSettings?.geminiApiKey || isImproving || !selectedResult) return;

    setIsImproving(true);

    try {
      // Convert image to base64 for API
      const response = await fetch(imageAnalysis.imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        const prompt = `You are analyzing this image. The current result for "${selectedResult.variableName}" is: "${formatResultValue(selectedResult.value)}". 
        
        The user wants to modify this result with the following request: "${improveRequest}".
        
        Please provide an improved/modified version of this result based on the user's request. Return only the improved result, nothing else.`;
        
        try {
          const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${apiSettings.model}:generateContent?key=${apiSettings.geminiApiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: base64
                    }
                  }
                ]
              }],
              generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 500,
              }
            })
          });

          if (!apiResponse.ok) {
            throw new Error('API request failed');
          }

          const data = await apiResponse.json();
          const improvedResult = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not improve this result.';
          
          // Update the result in the imageAnalysis
          const updatedResults = imageAnalysis.results.map(result => 
            result === selectedResult 
              ? { ...result, value: improvedResult, improved: true }
              : result
          );
          
          // Update the imageAnalysis object
          Object.assign(imageAnalysis, { results: updatedResults });
          
          // Close modal and reset
          setShowImproveModal(false);
          setImproveRequest('');
          setSelectedResult(null);
          
          // Show success message
          alert('Result improved successfully!');
          
        } catch (error) {
          console.error('Improve API error:', error);
          alert('Sorry, I encountered an error while improving the result. Please try again.');
        }
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error processing image for improvement:', error);
    } finally {
      setIsImproving(false);
    }
  };

  const formatResultValue = (value: any) => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="card">
        <div className="card-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <h2 className="card-title text-xl sm:text-2xl lg:text-3xl">✨ Analysis Results</h2>
              <p className="card-description text-sm sm:text-base">
                🎯 View and interact with your image analysis results
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={() => setShowChat(true)}
                className="btn btn-secondary btn-sm group w-full sm:w-auto"
              >
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Ask AI
              </button>
            </div>
          </div>
        </div>
        <div className="card-content">
          {/* Nuevo contenedor flex para imagen y resultados */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Imagen a la izquierda */}
            <div className="mb-6 lg:mb-0 lg:w-1/2 max-w-md">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3">Original Image</h3>
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={imageAnalysis.imageUrl}
                  alt={imageAnalysis.imageName}
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Resultados a la derecha */}
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3">Extracted Variables</h3>
              {imageAnalysis.results.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <ImageIcon className="h-8 w-8 mx-auto" />
                  </div>
                  <p className="text-gray-500 text-sm sm:text-base">No results available</p>
                  <div className="mt-4 text-xs text-gray-400">
                    Debug: Results array length = {imageAnalysis.results.length}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {imageAnalysis.results.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center mb-2 space-y-1 sm:space-y-0">
                            <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{result.variableName}</h4>
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                {result.source}
                              </span>
                              {result.confidence && (
                                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                                  {Math.round(result.confidence * 100)}% confidence
                                </span>
                              )}
                              {result.improved && (
                                <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded flex items-center">
                                  <Star className="h-3 w-3 mr-1" />
                                  Improved
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded p-2 sm:p-3">
                            <pre className="text-xs sm:text-sm text-gray-800 whitespace-pre-wrap break-words">
                              {formatResultValue(result.value)}
                            </pre>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 self-end sm:self-auto">
                          <button
                            onClick={() => copyToClipboard(formatResultValue(result.value))}
                            className="btn btn-ghost btn-sm"
                            title="Copy to clipboard"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedResult(result);
                              setShowImproveModal(true);
                            }}
                            className="btn btn-ghost btn-sm text-yellow-500 hover:text-yellow-600"
                            title="Improve with AI"
                          >
                            <Star className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Analysis Status */}
          <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0">
              <span>Status: {imageAnalysis.status}</span>
              <span>Analyzed: {new Date(imageAnalysis.uploadedAt).toLocaleString()}</span>
            </div>
            {imageAnalysis.error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-xs sm:text-sm text-red-700">
                Error: {imageAnalysis.error}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] sm:h-[600px] flex flex-col shadow-2xl">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg sm:text-xl font-bold gradient-text">🤖 Ask AI about this image</h3>
                <p className="text-xs sm:text-sm text-gray-600">Get insights and ask questions about your image</p>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <MessageCircle className="h-12 w-12 sm:h-16 sm:w-16 text-purple-300 mx-auto mb-3 sm:mb-4" />
                  <p className="text-gray-500 text-sm sm:text-base">Start a conversation about this image!</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-2">Ask anything: "What colors do you see?", "Describe this image", "What's the mood?"</p>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] sm:max-w-[80%] p-3 rounded-2xl ${
                      message.type === 'user' 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-xs sm:text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-purple-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Chat Input */}
            <div className="p-4 sm:p-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Ask something about this image..."
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  disabled={isChatLoading}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!currentMessage.trim() || isChatLoading}
                  className="btn btn-primary btn-md"
                >
                  <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Improve Results Modal */}
      {showImproveModal && selectedResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg sm:text-xl font-bold gradient-text">✨ Improve Result with AI</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Modify: <span className="font-medium">{selectedResult.variableName}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowImproveModal(false);
                  setImproveRequest('');
                  setSelectedResult(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-4 sm:p-6">
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Current Result:
                </label>
                <div className="bg-gray-50 rounded-lg p-3 border">
                  <p className="text-xs sm:text-sm text-gray-800">
                    {formatResultValue(selectedResult.value)}
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Your Improvement Request:
                </label>
                <textarea
                  value={improveRequest}
                  onChange={(e) => setImproveRequest(e.target.value)}
                  placeholder="Example: 'Change the people to animals', 'Make it more dramatic', 'Add more details about the environment'"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                  rows={4}
                  disabled={isImproving}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => {
                    setShowImproveModal(false);
                    setImproveRequest('');
                    setSelectedResult(null);
                  }}
                  className="btn btn-outline w-full sm:w-auto"
                  disabled={isImproving}
                >
                  Cancel
                </button>
                <button
                  onClick={improveResult}
                  disabled={!improveRequest.trim() || isImproving}
                  className="btn btn-primary w-full sm:w-auto"
                >
                  {isImproving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Improving...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Improve Result
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
