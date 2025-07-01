import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, MicOff, VolumeX, Loader, AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { openAIService } from '@/services/openai';
import type { ChatMessage } from '@/services/openai';
import { loggingService } from '@/services/logger';
import { LoggingSettings } from './LoggingSettings';
import { knowledgeBaseService } from '@/services/knowledgeBase';

interface ConversationalAIProps {
  onApiKeySet?: (apiKey: string) => void;
}

export const ConversationalAI: React.FC<ConversationalAIProps> = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState('');
  const [showLoggingSettings, setShowLoggingSettings] = useState(false);
  const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: 'You are a helpful voice assistant for Crystal Group. Keep ALL responses to maximum 1-2 sentences. For Crystal Group questions, provide specific company information. For other topics, give brief helpful answers. Always respond as if speaking directly to the user.',
      timestamp: new Date()
    }
  ]);

  const visualizerRef = useRef<HTMLDivElement>(null);

  const {
    transcript,
    isListening,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: speechSupported
  } = useSpeechRecognition({
    continuous: false,
    interimResults: true
  });

  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isSupported: ttsSupported
  } = useTextToSpeech({
    rate: 0.9,
    pitch: 1,
    volume: 0.8
  });

  // Create ripple effect
  const createRipple = useCallback((event: React.MouseEvent) => {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;
    
    const rippleContainer = button.querySelector('.ripple-container');
    if (rippleContainer) {
      rippleContainer.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }
  }, []);

  const handleVoiceCommand = useCallback(async () => {
    if (!transcript.trim() || isProcessing) return;

    if (!openAIService.isConfigured()) {
      const errorResponse = 'OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.';
      setLastResponse(errorResponse);
      if (ttsSupported) {
        speak(errorResponse);
      }
      return;
    }

    setIsProcessing(true);
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: transcript.trim(),
      timestamp: new Date()
    };
    
    const newHistory = [...conversationHistory, userMessage];
    setConversationHistory(newHistory);
    resetTranscript();

    try {
      const startTime = Date.now();
      
      // Check knowledge base first for Crystal Group related queries
      const knowledgeResponse = knowledgeBaseService.searchKnowledge(transcript.trim());
      let response: string;
      
      if (knowledgeResponse) {
        // Use knowledge base response for Crystal Group queries
        response = knowledgeResponse;
      } else {
        // Use OpenAI for other queries with enhanced context
        const enhancedHistory = [...newHistory];
        if (knowledgeBaseService.isCrystalGroupQuery(transcript.trim())) {
          enhancedHistory.push({
            role: 'system',
            content: 'Context: Crystal Group is a diversified Indian business established in 1962, specializing in cold chain logistics with facilities in Kolkata and Bhubaneswar, plus real estate development in Gujarat. Keep response to 1-2 sentences maximum.',
            timestamp: new Date()
          });
        }
        
        response = await openAIService.sendMessage(enhancedHistory, {
          maxTokens: 100, // Reduced for shorter responses
          temperature: 0.7
        });
      }
      
      const processingTime = Date.now() - startTime;

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setConversationHistory(prev => [...prev, assistantMessage]);
      setLastResponse(response);

      // Log the conversation
      await loggingService.logConversation(
        transcript.trim(),
        response,
        {
          processingTime,
          model: 'gpt-3.5-turbo',
          tokensUsed: Math.ceil(response.length / 4) // Rough estimate
        }
      );

      // Always speak the response
      if (ttsSupported) {
        speak(response);
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      const errorResponse = 'Sorry, I encountered an error. Please check your API key and try again.';
      setLastResponse(errorResponse);
      if (ttsSupported) {
        speak(errorResponse);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [transcript, isProcessing, conversationHistory, resetTranscript, speak, ttsSupported]);

  // Auto-process when speech recognition completes
  useEffect(() => {
    if (!isListening && transcript.trim() && !isProcessing) {
      handleVoiceCommand();
    }
  }, [isListening, transcript, isProcessing, handleVoiceCommand]);

  // Initialize logging configuration
  useEffect(() => {
    const savedConfig = localStorage.getItem('loggingConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        loggingService.updateConfig(config);
      } catch (error) {
        console.error('Error loading logging config:', error);
      }
    }
  }, []);

  // Play welcome message when TTS becomes available
  useEffect(() => {
    if (ttsSupported && !hasPlayedWelcome && !isListening && !isProcessing) {
      const welcomeMessage = "Hello! I'm your Crystal Group voice assistant. How can I help you today?";
      
      // Small delay to ensure everything is loaded
      const timer = setTimeout(() => {
        setLastResponse(welcomeMessage);
        speak(welcomeMessage);
        setHasPlayedWelcome(true);
        
        // Log the welcome message
        loggingService.logConversation(
          '[System Welcome]',
          welcomeMessage,
          {
            processingTime: 0,
            model: 'welcome-message',
            tokensUsed: 0
          }
        );
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [ttsSupported, hasPlayedWelcome, isListening, isProcessing, speak]);

  const toggleListening = useCallback((event: React.MouseEvent) => {
    createRipple(event);
    
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setLastResponse('');
      startListening();
    }
  }, [isListening, startListening, stopListening, resetTranscript, createRipple]);

  const toggleSpeaking = useCallback(() => {
    if (isSpeaking) {
      stopSpeaking();
    }
  }, [isSpeaking, stopSpeaking]);

  const handleExampleClick = useCallback((example: string) => {
    const cleanExample = example.replace(/"/g, '');
    if (speechSupported && !isProcessing) {
      setLastResponse('');
      // Simulate transcript for the example
      const syntheticEvent = { currentTarget: visualizerRef.current } as any;
      if (syntheticEvent.currentTarget) {
        createRipple(syntheticEvent);
      }
      
      // Set transcript and trigger voice command
      setTimeout(async () => {
        const userMessage: ChatMessage = {
          role: 'user',
          content: cleanExample,
          timestamp: new Date()
        };
        
        const newHistory = [...conversationHistory, userMessage];
        setConversationHistory(newHistory);
        
        setIsProcessing(true);
        const startTime = Date.now();
        
        // Check knowledge base first for Crystal Group related queries
        const knowledgeResponse = knowledgeBaseService.searchKnowledge(cleanExample);
        
        if (knowledgeResponse) {
          // Use knowledge base response
          const processingTime = Date.now() - startTime;
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: knowledgeResponse,
            timestamp: new Date()
          };
          
          setConversationHistory(prev => [...prev, assistantMessage]);
          setLastResponse(knowledgeResponse);

          // Log the conversation
          await loggingService.logConversation(
            cleanExample,
            knowledgeResponse,
            {
              processingTime,
              model: 'knowledge-base',
              tokensUsed: 0
            }
          );

          if (ttsSupported) {
            speak(knowledgeResponse);
          }
          setIsProcessing(false);
        } else {
          // Use OpenAI for other queries
          const enhancedHistory = [...newHistory];
          if (knowledgeBaseService.isCrystalGroupQuery(cleanExample)) {
            enhancedHistory.push({
              role: 'system',
              content: 'Context: Crystal Group is a diversified Indian business established in 1962, specializing in cold chain logistics with facilities in Kolkata and Bhubaneswar, plus real estate development in Gujarat. Keep response to 1-2 sentences maximum.',
              timestamp: new Date()
            });
          }
          
          openAIService.sendMessage(enhancedHistory, {
            maxTokens: 100,
            temperature: 0.7
          }).then(async response => {
            const processingTime = Date.now() - startTime;
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: response,
            timestamp: new Date()
          };
          
          setConversationHistory(prev => [...prev, assistantMessage]);
          setLastResponse(response);

          // Log the conversation
          await loggingService.logConversation(
            cleanExample,
            response,
            {
              processingTime,
              model: 'gpt-3.5-turbo',
              tokensUsed: Math.ceil(response.length / 4)
            }
          );

          if (ttsSupported) {
            speak(response);
          }
        }).catch(error => {
          console.error('Error processing example:', error);
          const errorResponse = 'Sorry, I encountered an error. Please try again.';
          setLastResponse(errorResponse);
          if (ttsSupported) {
            speak(errorResponse);
          }
        }).finally(() => {
          setIsProcessing(false);
        });
        }
      }, 100);
    }
  }, [conversationHistory, speechSupported, isProcessing, ttsSupported, speak, createRipple]);

  // Show API key setup message if not configured
  if (!openAIService.isConfigured()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-slideUp">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              API Key Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                To use the voice assistant, you need to add your OpenAI API key to the environment file:
              </p>
              <div className="bg-muted p-3 rounded-md text-xs font-mono">
                <p className="mb-2">1. Create/edit <code>.env</code> file in your project root:</p>
                <p className="text-primary">VITE_OPENAI_API_KEY=sk-your-api-key-here</p>
                <p className="mt-2">2. Restart the development server</p>
              </div>
            </div>
            <Button onClick={() => window.location.reload()} className="w-full">
              Refresh Page
            </Button>
            <p className="text-xs text-muted-foreground">
              Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">OpenAI Platform</a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Voice Interface */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Voice Visualizer */}
        <div className="relative mb-8 animate-slideUp">
          {isListening && (
            <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping"></div>
          )}
          {isProcessing && (
            <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-spin"></div>
          )}
          <div 
            ref={visualizerRef}
            className={`voice-visualizer ${
              isListening 
                ? 'listening' 
                : isProcessing
                ? 'processing'
                : ''
            }`}
            onClick={speechSupported ? toggleListening : undefined}
          >
            <div className="ripple-container"></div>
            {isProcessing ? (
              <Loader className="h-16 w-16 animate-spin text-white" />
            ) : isListening ? (
              <Mic className="h-16 w-16 text-white" />
            ) : (
              <MicOff className="h-16 w-16 text-white" />
            )}
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center mb-6 max-w-2xl animate-fadeIn">
          {isListening ? (
            <div className="animate-slideUp">
              <p className="text-lg font-medium text-primary mb-2">Listening...</p>
              {transcript && (
                <p className="text-muted-foreground italic animate-fadeIn">"{transcript}"</p>
              )}
            </div>
          ) : isProcessing ? (
            <div className="animate-slideUp">
              <p className="text-lg font-medium text-green-400 mb-2">Processing your request...</p>
              <div className="flex justify-center">
                <div className="animate-bounce">🤖</div>
              </div>
            </div>
          ) : lastResponse ? (
            <div className="response-container animate-slideUp">
              <p className="text-lg font-medium mb-2 text-primary">Response:</p>
              <p className="text-muted-foreground">{lastResponse}</p>
            </div>
          ) : (
            <div className="animate-slideUp">
              <p className="text-lg font-medium mb-2">Hello! I'm your Crystal Group voice assistant</p>
              <p className="text-muted-foreground">
                {speechSupported ? 'How can I help you today? Tap the microphone to start speaking' : 'Microphone not available'}
              </p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {speechError && (
          <div className="text-center mb-6 animate-slideUp">
            <p className="text-sm text-destructive">
              Speech Error: {speechError}
            </p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-4 animate-slideUp">
          {speechSupported && (
            <Button
              variant={isListening ? "default" : "outline"}
              size="lg"
              onClick={toggleListening}
              disabled={isProcessing}
              className="px-6"
            >
              {isListening ? (
                <>
                  <MicOff className="h-5 w-5 mr-2" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5 mr-2" />
                  Start Listening
                </>
              )}
            </Button>
          )}

          {ttsSupported && isSpeaking && (
            <Button
              variant="outline"
              size="lg"
              onClick={toggleSpeaking}
              className="px-6"
            >
              <VolumeX className="h-5 w-5 mr-2" />
              Stop Speaking
            </Button>
          )}

          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowLoggingSettings(true)}
            className="px-6"
          >
            <Settings className="h-5 w-5 mr-2" />
            Logging
          </Button>
        </div>

        {/* Quick Instructions */}
        {!lastResponse && !isListening && !isProcessing && (
          <div className="mt-8 text-center animate-slideUp">
            <p className="text-sm text-muted-foreground mb-2">Try saying:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                '"What is Crystal Group?"',
                '"Tell me about cold chain logistics"',
                '"Where are Crystal Group offices?"',
                '"What services does Crystal Group offer?"'
              ].map((example) => (
                <span
                  key={example}
                  className="example-chip"
                  onClick={() => handleExampleClick(example)}
                >
                  {example}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center p-4 border-t animate-fadeIn">
        <p className="text-xs text-muted-foreground">
          Crystal Group Voice Assistant • Powered by AI • Ask about our services and company
        </p>
      </div>

      {/* Logging Settings Modal */}
      <LoggingSettings 
        isOpen={showLoggingSettings}
        onClose={() => setShowLoggingSettings(false)}
      />
    </div>
  );
};
