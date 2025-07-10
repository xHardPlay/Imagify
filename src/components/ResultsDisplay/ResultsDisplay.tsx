import React, { useState } from 'react';
import { Download, Copy, ImageIcon, MessageCircle, Send, X } from 'lucide-react';
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

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ imageAnalysis, onExport, apiSettings }) => {
  
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Debug logging
  console.log('ResultsDisplay received imageAnalysis:', imageAnalysis);
  console.log('Results array:', imageAnalysis.results);
  console.log('Results length:', imageAnalysis.results.length);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Add toast notification
  };

  const downloadImage = async (format: string) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.crossOrigin = 'anonymous';
      img.src = imageAnalysis.imageUrl;
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const quality = format === 'jpeg' ? 0.9 : undefined;
        const mimeType = `image/${format}`;
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${imageAnalysis.imageName.split('.')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }, mimeType, quality);
      };
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image');
    }
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

  const formatResultValue = (value: any) => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="card-title">Analysis Results</h2>
              <p className="card-description">
                Results for "{imageAnalysis.imageName}"
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative group">
                <button className="btn btn-outline btn-sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download Image
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="p-2">
                    <button onClick={() => downloadImage('jpeg')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded">JPEG (.jpg)</button>
                    <button onClick={() => downloadImage('png')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded">PNG (.png)</button>
                    <button onClick={() => downloadImage('webp')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded">WebP (.webp)</button>
                    <button onClick={() => downloadImage('avif')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded">AVIF (.avif)</button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onExport('json')}
                className="btn btn-outline btn-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </button>
              <button
                onClick={() => onExport('csv')}
                className="btn btn-outline btn-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
              <button
                onClick={() => setShowChat(true)}
                className="btn btn-primary btn-sm"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Ask AI
              </button>
            </div>
          </div>
        </div>
        <div className="card-content">
          {/* Nuevo contenedor flex para imagen y resultados */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Imagen a la izquierda */}
            <div className="mb-6 md:mb-0 md:w-1/2 max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Original Image</h3>
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
              <h3 className="text-lg font-medium text-gray-900 mb-3">Extracted Variables</h3>
              {imageAnalysis.results.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <ImageIcon className="h-8 w-8 mx-auto" />
                  </div>
                  <p className="text-gray-500">No results available</p>
                  <div className="mt-4 text-xs text-gray-400">
                    Debug: Results array length = {imageAnalysis.results.length}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {imageAnalysis.results.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h4 className="font-medium text-gray-900">{result.variableName}</h4>
                            <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                              {result.source}
                            </span>
                            {result.confidence && (
                              <span className="ml-1 text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                                {Math.round(result.confidence * 100)}% confidence
                              </span>
                            )}
                          </div>
                          <div className="bg-gray-50 rounded p-3">
                            <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                              {formatResultValue(result.value)}
                            </pre>
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(formatResultValue(result.value))}
                          className="ml-2 btn btn-ghost btn-sm"
                          title="Copy to clipboard"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Analysis Status */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Status: {imageAnalysis.status}</span>
              <span>Analyzed: {new Date(imageAnalysis.uploadedAt).toLocaleString()}</span>
            </div>
            {imageAnalysis.error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                Error: {imageAnalysis.error}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl h-[600px] flex flex-col shadow-2xl">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold gradient-text">🤖 Ask AI about this image</h3>
                <p className="text-sm text-gray-600">Get insights and ask questions about your image</p>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-16 w-16 text-purple-300 mx-auto mb-4" />
                  <p className="text-gray-500">Start a conversation about this image!</p>
                  <p className="text-sm text-gray-400 mt-2">Ask anything: "What colors do you see?", "Describe this image", "What's the mood?"</p>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl ${
                      message.type === 'user' 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm">{message.content}</p>
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
            <div className="p-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Ask something about this image..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isChatLoading}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!currentMessage.trim() || isChatLoading}
                  className="btn btn-primary btn-md"
                >
                  <Send className="h-5 w-5" />
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
