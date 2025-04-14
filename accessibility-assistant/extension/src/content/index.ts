// Content Script for Accessibility Assistant
// This script is injected into every web page and provides accessibility features

// Import necessary libraries and types
import { createSpeechRecognition } from './features/speechRecognition';
import { createScreenReader } from './features/screenReader';
import { createVisualAssistant } from './features/visualAssistant';
import { createMotorAssistant } from './features/motorAssistant';
import { createCognitiveAssistant } from './features/cognitiveAssistant';
import { executeCommand } from './commandProcessor';

// Constants
const ASSISTANT_CLASS_PREFIX = 'accessibility-assistant-';

// Types
interface UserSettings {
  activeDisabilityModes: string[];
  voiceCommandPreferences: Record<string, any>;
  visualPreferences: Record<string, any>;
  speechPreferences: Record<string, any>;
}

interface AssistantState {
  currentMode: string;
  isVoiceControlActive: boolean;
  isHighContrastActive: boolean;
  zoomLevel: number;
  isSimplifiedModeActive: boolean;
  isReadingModeActive: boolean;
  userSettings: UserSettings;
}

// Current state of the assistant
const state: AssistantState = {
  currentMode: 'default',
  isVoiceControlActive: false,
  isHighContrastActive: false,
  zoomLevel: 1,
  isSimplifiedModeActive: false,
  isReadingModeActive: false,
  userSettings: {
    activeDisabilityModes: [],
    voiceCommandPreferences: {},
    visualPreferences: {},
    speechPreferences: {}
  }
};

// Feature modules
let speechRecognition: ReturnType<typeof createSpeechRecognition> | null = null;
let screenReader: ReturnType<typeof createScreenReader> | null = null;
let visualAssistant: ReturnType<typeof createVisualAssistant> | null = null;
let motorAssistant: ReturnType<typeof createMotorAssistant> | null = null;
let cognitiveAssistant: ReturnType<typeof createCognitiveAssistant> | null = null;

// UI Elements
let overlayContainer: HTMLDivElement | null = null;
let voiceIndicator: HTMLDivElement | null = null;
let accessibilityMenu: HTMLDivElement | null = null;

// Initialize the content script
function initialize() {
  console.log('Accessibility Assistant content script initialized');
  
  // Create UI elements
  createUIElements();
  
  // Request current state from background script
  chrome.runtime.sendMessage({ type: 'GET_CURRENT_STATE' }, (response) => {
    if (response) {
      updateState({
        currentMode: response.currentMode,
        isVoiceControlActive: response.isVoiceControlActive,
        userSettings: response.userSettings
      });
    }
  });
  
  // Listen for messages from the background script
  setupMessageListeners();
}

// Create UI elements for accessibility features
function createUIElements() {
  // Create container for our UI elements
  overlayContainer = document.createElement('div');
  overlayContainer.id = `${ASSISTANT_CLASS_PREFIX}overlay`;
  overlayContainer.style.position = 'fixed';
  overlayContainer.style.zIndex = '9999';
  overlayContainer.style.pointerEvents = 'none'; // Don't capture clicks by default
  document.body.appendChild(overlayContainer);
  
  // Create voice control indicator
  voiceIndicator = document.createElement('div');
  voiceIndicator.id = `${ASSISTANT_CLASS_PREFIX}voice-indicator`;
  voiceIndicator.classList.add(`${ASSISTANT_CLASS_PREFIX}ui-element`);
  voiceIndicator.style.position = 'fixed';
  voiceIndicator.style.bottom = '20px';
  voiceIndicator.style.right = '20px';
  voiceIndicator.style.width = '50px';
  voiceIndicator.style.height = '50px';
  voiceIndicator.style.borderRadius = '50%';
  voiceIndicator.style.backgroundColor = 'rgba(0, 120, 255, 0.7)';
  voiceIndicator.style.display = 'none'; // Hidden by default
  voiceIndicator.style.alignItems = 'center';
  voiceIndicator.style.justifyContent = 'center';
  voiceIndicator.style.pointerEvents = 'auto'; // Clickable
  voiceIndicator.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"></path></svg>';
  overlayContainer.appendChild(voiceIndicator);
  
  // Create accessibility menu (initially hidden)
  accessibilityMenu = document.createElement('div');
  accessibilityMenu.id = `${ASSISTANT_CLASS_PREFIX}menu`;
  accessibilityMenu.classList.add(`${ASSISTANT_CLASS_PREFIX}ui-element`);
  accessibilityMenu.style.position = 'fixed';
  accessibilityMenu.style.top = '70px';
  accessibilityMenu.style.right = '20px';
  accessibilityMenu.style.width = '300px';
  accessibilityMenu.style.backgroundColor = 'white';
  accessibilityMenu.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
  accessibilityMenu.style.borderRadius = '8px';
  accessibilityMenu.style.padding = '15px';
  accessibilityMenu.style.display = 'none'; // Hidden by default
  accessibilityMenu.style.pointerEvents = 'auto'; // Clickable
  accessibilityMenu.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
      <h2 style="margin: 0; font-size: 16px;">Accessibility Options</h2>
      <button id="${ASSISTANT_CLASS_PREFIX}close-menu" style="background: none; border: none; cursor: pointer;">×</button>
    </div>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <button id="${ASSISTANT_CLASS_PREFIX}toggle-high-contrast">Toggle High Contrast</button>
      <button id="${ASSISTANT_CLASS_PREFIX}toggle-voice-control">Toggle Voice Control</button>
      <button id="${ASSISTANT_CLASS_PREFIX}read-page">Read Page Aloud</button>
      <button id="${ASSISTANT_CLASS_PREFIX}summarize">Summarize Page</button>
      <button id="${ASSISTANT_CLASS_PREFIX}simplified-view">Simplified View</button>
    </div>
  `;
  overlayContainer.appendChild(accessibilityMenu);
  
  // Add event listeners to menu buttons
  document.getElementById(`${ASSISTANT_CLASS_PREFIX}close-menu`)?.addEventListener('click', () => {
    if (accessibilityMenu) accessibilityMenu.style.display = 'none';
  });
  
  document.getElementById(`${ASSISTANT_CLASS_PREFIX}toggle-high-contrast`)?.addEventListener('click', () => {
    toggleHighContrast();
  });
  
  document.getElementById(`${ASSISTANT_CLASS_PREFIX}toggle-voice-control`)?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'TOGGLE_VOICE_CONTROL' });
  });
  
  document.getElementById(`${ASSISTANT_CLASS_PREFIX}read-page`)?.addEventListener('click', () => {
    readPageAloud();
  });
  
  document.getElementById(`${ASSISTANT_CLASS_PREFIX}summarize`)?.addEventListener('click', () => {
    summarizePage();
  });
  
  document.getElementById(`${ASSISTANT_CLASS_PREFIX}simplified-view`)?.addEventListener('click', () => {
    toggleSimplifiedView();
  });
  
  // Add quick access button
  const quickAccessButton = document.createElement('button');
  quickAccessButton.id = `${ASSISTANT_CLASS_PREFIX}quick-access`;
  quickAccessButton.classList.add(`${ASSISTANT_CLASS_PREFIX}ui-element`);
  quickAccessButton.style.position = 'fixed';
  quickAccessButton.style.top = '20px';
  quickAccessButton.style.right = '20px';
  quickAccessButton.style.width = '40px';
  quickAccessButton.style.height = '40px';
  quickAccessButton.style.borderRadius = '50%';
  quickAccessButton.style.backgroundColor = '#0078FF';
  quickAccessButton.style.border = 'none';
  quickAccessButton.style.color = 'white';
  quickAccessButton.style.fontSize = '20px';
  quickAccessButton.style.cursor = 'pointer';
  quickAccessButton.style.zIndex = '10000';
  quickAccessButton.style.display = 'flex';
  quickAccessButton.style.alignItems = 'center';
  quickAccessButton.style.justifyContent = 'center';
  quickAccessButton.innerHTML = '<span aria-hidden="true">A</span>';
  quickAccessButton.setAttribute('aria-label', 'Open Accessibility Assistant');
  quickAccessButton.addEventListener('click', () => {
    if (accessibilityMenu) {
      accessibilityMenu.style.display = accessibilityMenu.style.display === 'none' ? 'block' : 'none';
    }
  });
  document.body.appendChild(quickAccessButton);
}

// Set up message listeners from background script
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message);
    
    switch (message.type) {
      case 'APPLY_SETTINGS':
        updateState({
          currentMode: message.payload.currentMode,
          userSettings: message.payload.userSettings
        });
        sendResponse({ success: true });
        break;
        
      case 'TOGGLE_VOICE_CONTROL':
        updateState({ isVoiceControlActive: message.payload.isActive });
        sendResponse({ success: true });
        break;
        
      case 'READ_TEXT':
        readTextAloud(message.payload.text);
        sendResponse({ success: true });
        break;
        
      case 'SUMMARIZE_PAGE':
        summarizePage();
        sendResponse({ success: true });
        break;
        
      case 'TOGGLE_HIGH_CONTRAST':
        toggleHighContrast();
        sendResponse({ success: true });
        break;
        
      case 'EXECUTE_COMMAND':
        executeCommand(message.payload.name, message.payload.params);
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
    
    return true; // Keep the message channel open for async responses
  });
}

// Update the assistant state and apply changes
function updateState(newState: Partial<AssistantState>) {
  // Update state
  Object.assign(state, newState);
  
  // Update UI based on new state
  updateUI();
  
  // Initialize or update feature modules based on current mode
  initializeFeatureModules();
}

// Update UI elements based on current state
function updateUI() {
  if (voiceIndicator) {
    voiceIndicator.style.display = state.isVoiceControlActive ? 'flex' : 'none';
  }
  
  // Apply high contrast if active
  if (state.isHighContrastActive) {
    document.documentElement.classList.add(`${ASSISTANT_CLASS_PREFIX}high-contrast`);
  } else {
    document.documentElement.classList.remove(`${ASSISTANT_CLASS_PREFIX}high-contrast`);
  }
  
  // Apply zoom level
  document.documentElement.style.zoom = state.zoomLevel.toString();
  
  // Apply simplified view if active
  if (state.isSimplifiedModeActive) {
    document.documentElement.classList.add(`${ASSISTANT_CLASS_PREFIX}simplified-mode`);
  } else {
    document.documentElement.classList.remove(`${ASSISTANT_CLASS_PREFIX}simplified-mode`);
  }
}

// Initialize feature modules based on current mode
function initializeFeatureModules() {
  // Clean up existing modules
  cleanupFeatureModules();
  
  // Initialize modules based on current mode
  if (state.currentMode === 'visual' || state.userSettings.activeDisabilityModes.includes('visual')) {
    screenReader = createScreenReader();
    visualAssistant = createVisualAssistant();
  }
  
  if (state.currentMode === 'motor' || state.userSettings.activeDisabilityModes.includes('motor')) {
    motorAssistant = createMotorAssistant();
  }
  
  if (state.currentMode === 'cognitive' || state.userSettings.activeDisabilityModes.includes('cognitive')) {
    cognitiveAssistant = createCognitiveAssistant();
  }
  
  // Speech recognition is initialized if voice control is active
  if (state.isVoiceControlActive) {
    speechRecognition = createSpeechRecognition();
  }
}

// Clean up feature modules
function cleanupFeatureModules() {
  if (speechRecognition) {
    speechRecognition.cleanup();
    speechRecognition = null;
  }
  
  if (screenReader) {
    screenReader.cleanup();
    screenReader = null;
  }
  
  if (visualAssistant) {
    visualAssistant.cleanup();
    visualAssistant = null;
  }
  
  if (motorAssistant) {
    motorAssistant.cleanup();
    motorAssistant = null;
  }
  
  if (cognitiveAssistant) {
    cognitiveAssistant.cleanup();
    cognitiveAssistant = null;
  }
}

// Toggle high contrast mode
function toggleHighContrast() {
  updateState({ isHighContrastActive: !state.isHighContrastActive });
  
  // Apply high contrast styles
  if (state.isHighContrastActive) {
    const style = document.createElement('style');
    style.id = `${ASSISTANT_CLASS_PREFIX}high-contrast-style`;
    style.textContent = `
      html.${ASSISTANT_CLASS_PREFIX}high-contrast {
        filter: invert(100%) hue-rotate(180deg) !important;
      }
      
      html.${ASSISTANT_CLASS_PREFIX}high-contrast img,
      html.${ASSISTANT_CLASS_PREFIX}high-contrast video {
        filter: invert(100%) hue-rotate(180deg) !important;
      }
      
      .${ASSISTANT_CLASS_PREFIX}ui-element {
        filter: invert(0%) hue-rotate(0deg) !important;
      }
    `;
    document.head.appendChild(style);
  } else {
    const style = document.getElementById(`${ASSISTANT_CLASS_PREFIX}high-contrast-style`);
    if (style) {
      style.remove();
    }
  }
}

// Read text aloud
function readTextAloud(text: string) {
  if (!text) return;
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = state.userSettings.speechPreferences.rate || 1;
  utterance.pitch = state.userSettings.speechPreferences.pitch || 1;
  utterance.volume = state.userSettings.speechPreferences.volume || 1;
  
  // Use preferred voice if specified
  if (state.userSettings.speechPreferences.voiceName) {
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => voice.name === state.userSettings.speechPreferences.voiceName);
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
  }
  
  window.speechSynthesis.speak(utterance);
}

// Read the entire page aloud
function readPageAloud() {
  const mainContent = findMainContent();
  if (mainContent) {
    readTextAloud(mainContent.textContent || '');
  }
}

// Find the main content of the page
function findMainContent(): Element | null {
  // Try to find main content by common selectors
  const selectors = [
    'main',
    'article',
    '[role="main"]',
    '#content',
    '.content',
    '#main',
    '.main'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent && element.textContent.trim().length > 100) {
      return element;
    }
  }
  
  // Fallback: find the element with the most text
  let maxTextLength = 0;
  let maxTextElement: Element | null = null;
  
  const contentElements = document.querySelectorAll('div, section, article');
  contentElements.forEach(element => {
    const textLength = element.textContent?.trim().length || 0;
    if (textLength > maxTextLength && textLength > 100) {
      maxTextLength = textLength;
      maxTextElement = element;
    }
  });
  
  return maxTextElement;
}

// Summarize the page content
function summarizePage() {
  const mainContent = findMainContent();
  if (!mainContent) return;
  
  // Create a loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.id = `${ASSISTANT_CLASS_PREFIX}loading`;
  loadingIndicator.textContent = 'Generating summary...';
  loadingIndicator.style.position = 'fixed';
  loadingIndicator.style.top = '50%';
  loadingIndicator.style.left = '50%';
  loadingIndicator.style.transform = 'translate(-50%, -50%)';
  loadingIndicator.style.backgroundColor = 'white';
  loadingIndicator.style.padding = '20px';
  loadingIndicator.style.borderRadius = '8px';
  loadingIndicator.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
  loadingIndicator.style.zIndex = '10001';
  document.body.appendChild(loadingIndicator);
  
  // Get the text content
  const content = mainContent.textContent || '';
  
  // Send content to background script for processing
  chrome.runtime.sendMessage({
    type: 'PROCESS_SUMMARY',
    payload: { content }
  }, (response) => {
    // Remove loading indicator
    loadingIndicator.remove();
    
    if (response && response.summary) {
      // Show summary
      showSummary(response.summary);
    } else {
      // Show error
      showSummary('Failed to generate summary. Try again later.');
    }
  });
}

// Show the page summary
function showSummary(summary: string) {
  // Create summary container
  const summaryContainer = document.createElement('div');
  summaryContainer.id = `${ASSISTANT_CLASS_PREFIX}summary`;
  summaryContainer.style.position = 'fixed';
  summaryContainer.style.top = '50%';
  summaryContainer.style.left = '50%';
  summaryContainer.style.transform = 'translate(-50%, -50%)';
  summaryContainer.style.backgroundColor = 'white';
  summaryContainer.style.padding = '20px';
  summaryContainer.style.borderRadius = '8px';
  summaryContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
  summaryContainer.style.zIndex = '10001';
  summaryContainer.style.maxWidth = '600px';
  summaryContainer.style.maxHeight = '80vh';
  summaryContainer.style.overflow = 'auto';
  
  // Add summary content
  summaryContainer.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
      <h2 style="margin: 0; font-size: 18px;">Page Summary</h2>
      <button id="${ASSISTANT_CLASS_PREFIX}close-summary" style="background: none; border: none; cursor: pointer; font-size: 20px;">×</button>
    </div>
    <div id="${ASSISTANT_CLASS_PREFIX}summary-content">
      ${summary}
    </div>
    <div style="margin-top: 15px; display: flex; justify-content: space-between;">
      <button id="${ASSISTANT_CLASS_PREFIX}read-summary">Read Aloud</button>
      <button id="${ASSISTANT_CLASS_PREFIX}copy-summary">Copy to Clipboard</button>
    </div>
  `;
  
  document.body.appendChild(summaryContainer);
  
  // Add event listeners
  document.getElementById(`${ASSISTANT_CLASS_PREFIX}close-summary`)?.addEventListener('click', () => {
    summaryContainer.remove();
  });
  
  document.getElementById(`${ASSISTANT_CLASS_PREFIX}read-summary`)?.addEventListener('click', () => {
    readTextAloud(summary);
  });
  
  document.getElementById(`${ASSISTANT_CLASS_PREFIX}copy-summary`)?.addEventListener('click', () => {
    navigator.clipboard.writeText(summary).then(() => {
      alert('Summary copied to clipboard!');
    });
  });
}

// Toggle simplified view mode
function toggleSimplifiedView() {
  updateState({ isSimplifiedModeActive: !state.isSimplifiedModeActive });
  
  // Apply simplified view styles
  if (state.isSimplifiedModeActive) {
    const style = document.createElement('style');
    style.id = `${ASSISTANT_CLASS_PREFIX}simplified-style`;
    style.textContent = `
      html.${ASSISTANT_CLASS_PREFIX}simplified-mode {
        font-size: 18px !important;
        line-height: 1.5 !important;
      }
      
      html.${ASSISTANT_CLASS_PREFIX}simplified-mode body {
        max-width: 800px !important;
        margin: 0 auto !important;
        padding: 20px !important;
      }
      
      html.${ASSISTANT_CLASS_PREFIX}simplified-mode aside,
      html.${ASSISTANT_CLASS_PREFIX}simplified-mode nav,
      html.${ASSISTANT_CLASS_PREFIX}simplified-mode footer,
      html.${ASSISTANT_CLASS_PREFIX}simplified-mode iframe,
      html.${ASSISTANT_CLASS_PREFIX}simplified-mode .ad,
      html.${ASSISTANT_CLASS_PREFIX}simplified-mode .ads,
      html.${ASSISTANT_CLASS_PREFIX}simplified-mode .advertisement,
      html.${ASSISTANT_CLASS_PREFIX}simplified-mode [class*="ad-"],
      html.${ASSISTANT_CLASS_PREFIX}simplified-mode [id*="ad-"],
      html.${ASSISTANT_CLASS_PREFIX}simplified-mode [class*="banner"],
      html.${ASSISTANT_CLASS_PREFIX}simplified-mode [id*="banner"] {
        display: none !important;
      }
      
      html.${ASSISTANT_CLASS_PREFIX}simplified-mode p,
      html.${ASSISTANT_CLASS_PREFIX}simplified-mode li,
      html.${ASSISTANT_CLASS_PREFIX}simplified-mode h1,
      html.${ASSISTANT_CLASS_PREFIX}simplified-mode h2,
      html.${ASSISTANT_CLASS_PREFIX}simplified-mode h3,
      html.${ASSISTANT_CLASS_PREFIX}simplified-mode h4,
      html.${ASSISTANT_CLASS_PREFIX}simplified-mode h5,
      html.${ASSISTANT_CLASS_PREFIX}simplified-mode h6 {
        color: #333 !important;
        font-family: Arial, sans-serif !important;
        margin-bottom: 1em !important;
      }
      
      html.${ASSISTANT_CLASS_PREFIX}simplified-mode a {
        color: #0066cc !important;
        text-decoration: underline !important;
      }
      
      .${ASSISTANT_CLASS_PREFIX}ui-element {
        display: block !important;
      }
    `;
    document.head.appendChild(style);
  } else {
    const style = document.getElementById(`${ASSISTANT_CLASS_PREFIX}simplified-style`);
    if (style) {
      style.remove();
    }
  }
}

// Clean up when the content script is unloaded
function cleanup() {
  // Clean up feature modules
  cleanupFeatureModules();
  
  // Remove UI elements
  if (overlayContainer) {
    document.body.removeChild(overlayContainer);
  }
  
  const quickAccessButton = document.getElementById(`${ASSISTANT_CLASS_PREFIX}quick-access`);
  if (quickAccessButton) {
    document.body.removeChild(quickAccessButton);
  }
  
  // Remove styles
  const styles = document.querySelectorAll(`style[id^="${ASSISTANT_CLASS_PREFIX}"]`);
  styles.forEach(style => style.remove());
  
  // Remove classes from document
  document.documentElement.classList.remove(
    `${ASSISTANT_CLASS_PREFIX}high-contrast`,
    `${ASSISTANT_CLASS_PREFIX}simplified-mode`
  );
  
  // Reset zoom
  document.documentElement.style.zoom = '1';
}

// Initialize the content script
initialize();

// Add event listener for unloading
window.addEventListener('unload', cleanup);

// Export functions for testing
export {
  readTextAloud,
  toggleHighContrast,
  summarizePage,
  toggleSimplifiedView
}; 