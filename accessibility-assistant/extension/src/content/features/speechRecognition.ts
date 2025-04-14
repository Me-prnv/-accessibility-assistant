// Speech Recognition Module for Accessibility Assistant
// Handles voice input and command recognition

import { executeCommand } from '../commandProcessor';

// Types
interface SpeechRecognitionSettings {
  language: string;
  continuousListening: boolean;
  commandPrefix: string;
  sensitivity: number;
}

// Default settings
const defaultSettings: SpeechRecognitionSettings = {
  language: 'en-US',
  continuousListening: true,
  commandPrefix: 'assistant',
  sensitivity: 0.7
};

// Command patterns for natural language processing
interface CommandPattern {
  pattern: RegExp;
  command: string;
  extractParams: (matches: RegExpMatchArray) => any;
}

// Initialize speech recognition
export function createSpeechRecognition(options: Partial<SpeechRecognitionSettings> = {}) {
  // Merge default settings with provided options
  const settings: SpeechRecognitionSettings = {
    ...defaultSettings,
    ...options
  };
  
  // Check if Speech Recognition API is available
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.error('Speech Recognition API is not supported in this browser');
    return {
      start: () => console.error('Speech Recognition not available'),
      stop: () => {},
      cleanup: () => {},
      isListening: false
    };
  }
  
  // Create Speech Recognition instance
  const recognition = new SpeechRecognition();
  recognition.continuous = settings.continuousListening;
  recognition.interimResults = false;
  recognition.lang = settings.language;
  
  let isListening = false;
  let commandPatterns: CommandPattern[] = [];
  
  // Set up command patterns
  initializeCommandPatterns();
  
  // Create UI for feedback
  const feedbackElement = createFeedbackUI();
  
  // Set up event handlers
  recognition.onstart = () => {
    console.log('Speech recognition started');
    isListening = true;
    updateFeedbackUI('Listening...');
    
    // Notify the background script
    chrome.runtime.sendMessage({
      type: 'SPEECH_RECOGNITION_STATUS',
      payload: { isActive: true }
    });
  };
  
  recognition.onend = () => {
    console.log('Speech recognition ended');
    isListening = false;
    updateFeedbackUI('Voice control paused');
    
    // If continuous listening is enabled, restart recognition
    if (settings.continuousListening) {
      setTimeout(() => {
        if (settings.continuousListening && !isListening) {
          try {
            recognition.start();
          } catch (e) {
            console.error('Error restarting speech recognition:', e);
          }
        }
      }, 500);
    }
    
    // Notify the background script
    chrome.runtime.sendMessage({
      type: 'SPEECH_RECOGNITION_STATUS',
      payload: { isActive: false }
    });
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    updateFeedbackUI(`Error: ${event.error}`);
    
    // Handle specific errors
    if (event.error === 'not-allowed') {
      settings.continuousListening = false;
      updateFeedbackUI('Microphone access denied');
    }
  };
  
  recognition.onresult = (event) => {
    const last = event.results.length - 1;
    const transcript = event.results[last][0].transcript.trim();
    const confidence = event.results[last][0].confidence;
    
    console.log(`Recognized: "${transcript}" (${confidence})`);
    
    // Only process if confidence is above threshold
    if (confidence >= settings.sensitivity) {
      processVoiceCommand(transcript);
    } else {
      updateFeedbackUI(`Low confidence: "${transcript}"`);
    }
  };
  
  // Process voice command
  function processVoiceCommand(transcript: string) {
    // Normalize transcript
    const normalizedTranscript = transcript.toLowerCase();
    
    // Show the recognized text
    updateFeedbackUI(`Recognized: "${transcript}"`);
    
    // Check if command starts with prefix (if required)
    if (settings.commandPrefix && !normalizedTranscript.startsWith(settings.commandPrefix.toLowerCase())) {
      // Not a command, ignore
      return;
    }
    
    // Remove prefix from command if present
    const commandText = settings.commandPrefix
      ? normalizedTranscript.substring(settings.commandPrefix.length).trim()
      : normalizedTranscript;
    
    // Match against command patterns
    for (const { pattern, command, extractParams } of commandPatterns) {
      const matches = commandText.match(pattern);
      if (matches) {
        const params = extractParams(matches);
        updateFeedbackUI(`Executing: ${command}`);
        
        // Execute the command
        executeCommand(command, params);
        return;
      }
    }
    
    // If no pattern matched, try to interpret as a custom command
    interpretCustomCommand(commandText);
  }
  
  // Interpret commands that don't match predefined patterns
  function interpretCustomCommand(commandText: string) {
    // Send to background script for more advanced processing
    chrome.runtime.sendMessage({
      type: 'INTERPRET_VOICE_COMMAND',
      payload: { text: commandText }
    }, (response) => {
      if (response && response.command) {
        updateFeedbackUI(`Executing: ${response.command}`);
        executeCommand(response.command, response.params);
      } else {
        updateFeedbackUI(`Command not recognized: "${commandText}"`);
      }
    });
  }
  
  // Initialize command patterns for natural language processing
  function initializeCommandPatterns() {
    commandPatterns = [
      // Navigation patterns
      {
        pattern: /^(?:scroll|go) down(?: (\d+))?/i,
        command: 'scroll_down',
        extractParams: (matches) => ({ amount: matches[1] ? parseInt(matches[1]) : 300 })
      },
      {
        pattern: /^(?:scroll|go) up(?: (\d+))?/i,
        command: 'scroll_up',
        extractParams: (matches) => ({ amount: matches[1] ? parseInt(matches[1]) : 300 })
      },
      {
        pattern: /^(?:scroll|go) (?:to )?(?:the )?(?:bottom|end)/i,
        command: 'scroll_bottom',
        extractParams: () => ({})
      },
      {
        pattern: /^(?:scroll|go) (?:to )?(?:the )?(?:top|start)/i,
        command: 'scroll_top',
        extractParams: () => ({})
      },
      {
        pattern: /^(?:go )?back/i,
        command: 'go_back',
        extractParams: () => ({})
      },
      {
        pattern: /^(?:go )?forward/i,
        command: 'go_forward',
        extractParams: () => ({})
      },
      {
        pattern: /^(?:refresh|reload)/i,
        command: 'refresh_page',
        extractParams: () => ({})
      },
      
      // Click patterns
      {
        pattern: /^click(?: on| the)? (.+)/i,
        command: 'click',
        extractParams: (matches) => ({ text: matches[1] })
      },
      {
        pattern: /^(?:click |press |push )?(?:the )?button (.+)/i,
        command: 'click_button',
        extractParams: (matches) => ({ text: matches[1] })
      },
      {
        pattern: /^(?:click |follow |open )?(?:the )?link (.+)/i,
        command: 'click_link',
        extractParams: (matches) => ({ text: matches[1] })
      },
      
      // Form patterns
      {
        pattern: /^(?:type|enter|input|fill) (?:in )?(?:the )?(?:field |input |form )?(?:(?:called|labeled|named) )?(.+?) (?:with |as )(.+)/i,
        command: 'fill_input',
        extractParams: (matches) => ({ field: matches[1], value: matches[2] })
      },
      {
        pattern: /^(?:submit|send)(?:form|)/i,
        command: 'submit_form',
        extractParams: () => ({})
      },
      
      // Accessibility patterns
      {
        pattern: /^read(?: this| the| aloud)? (.+)/i,
        command: 'read_aloud',
        extractParams: (matches) => ({ text: matches[1] })
      },
      {
        pattern: /^read(?: this| the)? (?:page|content|article)/i,
        command: 'read_aloud',
        extractParams: () => ({})
      },
      {
        pattern: /^(?:toggle |switch |change )?(?:to )?(?:high )?contrast/i,
        command: 'toggle_high_contrast',
        extractParams: () => ({})
      },
      {
        pattern: /^(?:increase|bigger|larger) (?:font|text|size)/i,
        command: 'increase_font_size',
        extractParams: () => ({})
      },
      {
        pattern: /^(?:decrease|smaller|reduce) (?:font|text|size)/i,
        command: 'decrease_font_size',
        extractParams: () => ({})
      },
      {
        pattern: /^(?:summarize|summary of)(?: the| this)? page/i,
        command: 'summarize_page',
        extractParams: () => ({})
      },
      {
        pattern: /^(?:simplify|reader mode|reading mode)(?: the| this)? page/i,
        command: 'simplify_page',
        extractParams: () => ({})
      },
      
      // Tab management patterns
      {
        pattern: /^(?:open|create|new) tab/i,
        command: 'new_tab',
        extractParams: () => ({})
      },
      {
        pattern: /^(?:close|exit) (?:this )?tab/i,
        command: 'close_tab',
        extractParams: () => ({})
      },
      {
        pattern: /^(?:switch|go) (?:to )?tab (\d+)/i,
        command: 'switch_tab',
        extractParams: (matches) => ({ index: parseInt(matches[1]) - 1 })
      },
      
      // Assistant control patterns
      {
        pattern: /^(?:open|show) (?:the )?assistant/i,
        command: 'open_assistant',
        extractParams: () => ({})
      },
      {
        pattern: /^(?:close|hide) (?:the )?assistant/i,
        command: 'close_assistant',
        extractParams: () => ({})
      }
    ];
  }
  
  // Create UI element for feedback
  function createFeedbackUI() {
    const feedbackElement = document.createElement('div');
    feedbackElement.id = 'accessibility-assistant-voice-feedback';
    feedbackElement.style.position = 'fixed';
    feedbackElement.style.bottom = '80px';
    feedbackElement.style.right = '20px';
    feedbackElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    feedbackElement.style.color = 'white';
    feedbackElement.style.padding = '10px 15px';
    feedbackElement.style.borderRadius = '5px';
    feedbackElement.style.fontSize = '14px';
    feedbackElement.style.zIndex = '10001';
    feedbackElement.style.maxWidth = '300px';
    feedbackElement.style.display = 'none';
    document.body.appendChild(feedbackElement);
    
    return feedbackElement;
  }
  
  // Update the feedback UI with current status
  function updateFeedbackUI(message: string) {
    if (feedbackElement) {
      feedbackElement.textContent = message;
      feedbackElement.style.display = 'block';
      
      // Hide after 3 seconds
      setTimeout(() => {
        if (feedbackElement && feedbackElement.textContent === message) {
          feedbackElement.style.display = 'none';
        }
      }, 3000);
    }
  }
  
  // Customize command patterns (e.g., from user settings)
  function customizeCommandPatterns(customPatterns: CommandPattern[]) {
    commandPatterns = [...commandPatterns, ...customPatterns];
  }
  
  // Start speech recognition
  function start() {
    if (!isListening) {
      try {
        recognition.start();
      } catch (e) {
        console.error('Error starting speech recognition:', e);
      }
    }
  }
  
  // Stop speech recognition
  function stop() {
    if (isListening) {
      try {
        recognition.stop();
      } catch (e) {
        console.error('Error stopping speech recognition:', e);
      }
    }
  }
  
  // Clean up resources
  function cleanup() {
    stop();
    
    // Remove feedback UI
    if (feedbackElement && feedbackElement.parentNode) {
      feedbackElement.parentNode.removeChild(feedbackElement);
    }
  }
  
  // Add custom command patterns from settings
  if (options.customPatterns) {
    customizeCommandPatterns(options.customPatterns);
  }
  
  // Start speech recognition by default
  start();
  
  // Return control functions
  return {
    start,
    stop,
    cleanup,
    isListening: () => isListening,
    customizeCommandPatterns
  };
}

// Ensure SpeechRecognition exists in the TypeScript Window interface
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

class SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  
  start(): void;
  stop(): void;
  abort(): void;
  
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: any) => any) | null;
  onresult: ((this: SpeechRecognition, ev: any) => any) | null;
}

export default createSpeechRecognition; 