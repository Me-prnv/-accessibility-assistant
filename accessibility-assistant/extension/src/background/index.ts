// Background Script for Accessibility Assistant Extension
// This script runs in the background and manages communication between
// the web app, content scripts, and browser API

// Constants
const API_BASE_URL = 'http://localhost:3001/api'; // Base URL for web app backend

// State Management
let activeTabId: number | null = null;
let currentMode: string = 'default'; // default, visual, motor, hearing, cognitive, speech, temporary
let isVoiceControlActive: boolean = false;
let userSettings: UserSettings = {
  activeDisabilityModes: [],
  voiceCommandPreferences: {},
  visualPreferences: {},
  speechPreferences: {}
};

// Types
interface UserSettings {
  activeDisabilityModes: string[];
  voiceCommandPreferences: Record<string, any>;
  visualPreferences: Record<string, any>;
  speechPreferences: Record<string, any>;
}

interface Message {
  type: string;
  payload?: any;
}

// Initialize Extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Accessibility Assistant Extension installed');
  
  // Initialize context menus
  setupContextMenus();
  
  // Load user settings
  loadUserSettings();
});

// Set up context menus for accessibility options
function setupContextMenus() {
  chrome.contextMenus.create({
    id: 'accessibility-assistant',
    title: 'Accessibility Assistant',
    contexts: ['all']
  });
  
  chrome.contextMenus.create({
    id: 'read-aloud',
    parentId: 'accessibility-assistant',
    title: 'Read Selection Aloud',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'summarize-page',
    parentId: 'accessibility-assistant',
    title: 'Summarize This Page',
    contexts: ['page']
  });
  
  chrome.contextMenus.create({
    id: 'high-contrast',
    parentId: 'accessibility-assistant',
    title: 'Toggle High Contrast',
    contexts: ['page']
  });
  
  chrome.contextMenus.create({
    id: 'voice-control',
    parentId: 'accessibility-assistant',
    title: 'Toggle Voice Control',
    contexts: ['all']
  });
}

// Load user settings from storage
function loadUserSettings() {
  chrome.storage.sync.get('userSettings', (data) => {
    if (data.userSettings) {
      userSettings = data.userSettings;
      currentMode = userSettings.activeDisabilityModes[0] || 'default';
      console.log('User settings loaded:', userSettings);
    }
  });
}

// Save user settings to storage
function saveUserSettings() {
  chrome.storage.sync.set({ userSettings }, () => {
    console.log('User settings saved:', userSettings);
  });
}

// Process incoming messages from content scripts and popup
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  console.log('Message received:', message);
  
  switch (message.type) {
    case 'SET_ACTIVE_MODE':
      setActiveMode(message.payload);
      sendResponse({ success: true });
      break;
      
    case 'TOGGLE_VOICE_CONTROL':
      toggleVoiceControl();
      sendResponse({ success: true, isActive: isVoiceControlActive });
      break;
      
    case 'UPDATE_SETTINGS':
      updateSettings(message.payload);
      sendResponse({ success: true });
      break;
      
    case 'EXECUTE_COMMAND':
      executeCommand(message.payload);
      sendResponse({ success: true });
      break;
      
    case 'GET_CURRENT_STATE':
      sendResponse({
        currentMode,
        isVoiceControlActive,
        userSettings
      });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
  
  return true; // Keep the message channel open for async responses
});

// Track the active tab
chrome.tabs.onActivated.addListener((activeInfo) => {
  activeTabId = activeInfo.tabId;
  
  // Apply current settings to the newly active tab
  applySettingsToTab(activeTabId);
});

// Apply settings when a tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tabId === activeTabId) {
    applySettingsToTab(tabId);
  }
});

// Set the active accessibility mode
function setActiveMode(mode: string) {
  currentMode = mode;
  
  if (!userSettings.activeDisabilityModes.includes(mode)) {
    userSettings.activeDisabilityModes.unshift(mode);
    // Keep only the 3 most recent modes
    userSettings.activeDisabilityModes = userSettings.activeDisabilityModes.slice(0, 3);
  }
  
  saveUserSettings();
  
  // Apply settings to active tab
  if (activeTabId) {
    applySettingsToTab(activeTabId);
  }
}

// Toggle voice control on/off
function toggleVoiceControl() {
  isVoiceControlActive = !isVoiceControlActive;
  
  if (activeTabId) {
    chrome.tabs.sendMessage(activeTabId, {
      type: 'TOGGLE_VOICE_CONTROL',
      payload: { isActive: isVoiceControlActive }
    });
  }
}

// Update user settings
function updateSettings(newSettings: Partial<UserSettings>) {
  userSettings = { ...userSettings, ...newSettings };
  saveUserSettings();
  
  // Apply updated settings to active tab
  if (activeTabId) {
    applySettingsToTab(activeTabId);
  }
}

// Execute a voice or accessibility command
function executeCommand(command: { name: string, params: any }) {
  if (activeTabId) {
    chrome.tabs.sendMessage(activeTabId, {
      type: 'EXECUTE_COMMAND',
      payload: command
    });
  }
}

// Apply current settings to a specific tab
function applySettingsToTab(tabId: number) {
  chrome.tabs.sendMessage(tabId, {
    type: 'APPLY_SETTINGS',
    payload: {
      currentMode,
      userSettings
    }
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  
  switch (info.menuItemId) {
    case 'read-aloud':
      if (info.selectionText) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'READ_TEXT',
          payload: { text: info.selectionText }
        });
      }
      break;
      
    case 'summarize-page':
      chrome.tabs.sendMessage(tab.id, {
        type: 'SUMMARIZE_PAGE'
      });
      break;
      
    case 'high-contrast':
      chrome.tabs.sendMessage(tab.id, {
        type: 'TOGGLE_HIGH_CONTRAST'
      });
      break;
      
    case 'voice-control':
      toggleVoiceControl();
      break;
  }
});

// Connect to web app when available
function connectToWebApp() {
  // Check if web app is available by making a ping request
  fetch(`${API_BASE_URL}/ping`)
    .then(response => {
      if (response.ok) {
        console.log('Connected to web app');
        syncSettingsWithWebApp();
      }
    })
    .catch(error => {
      console.log('Web app not available:', error);
      // Retry connection after delay
      setTimeout(connectToWebApp, 60000); // Retry after 1 minute
    });
}

// Sync settings with web app
function syncSettingsWithWebApp() {
  fetch(`${API_BASE_URL}/settings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => response.json())
    .then(data => {
      if (data.settings) {
        // Merge web app settings with local settings
        updateSettings(data.settings);
      }
    })
    .catch(error => {
      console.error('Error syncing settings with web app:', error);
    });
}

// Initial connection attempt
connectToWebApp();

// Listen for commands from keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle_voice_control') {
    toggleVoiceControl();
  }
});

// Export for testing
export {
  setActiveMode,
  toggleVoiceControl,
  updateSettings,
  executeCommand
}; 