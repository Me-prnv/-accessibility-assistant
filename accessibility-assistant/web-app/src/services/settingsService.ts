import { AccessibilitySettings } from '../database/schema';
import { getCurrentUserId } from './userService';
import * as db from './databaseService';

/**
 * Get accessibility settings for a user
 * @param userId User ID to get settings for
 * @returns Promise resolving to the user's settings
 */
export const getAccessibilitySettings = async (userId: string): Promise<AccessibilitySettings> => {
  // Get settings from database
  const settings = await db.getSettings(userId);
  
  if (!settings) {
    // If no settings found, create default settings
    return createDefaultSettings(userId);
  }
  
  return settings;
};

/**
 * Get the current user's accessibility settings
 * @returns Promise resolving to the current user's settings
 */
export const getCurrentUserSettings = async (): Promise<AccessibilitySettings> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('No authenticated user');
  }
  
  return getAccessibilitySettings(userId);
};

/**
 * Update accessibility settings for a user
 * @param userId User ID to update settings for
 * @param settings Settings to update
 * @returns Promise resolving to the updated settings
 */
export const updateAccessibilitySettings = async (
  userId: string,
  settings: Partial<AccessibilitySettings>
): Promise<AccessibilitySettings> => {
  // Get current settings
  let currentSettings = await db.getSettings(userId);
  
  if (!currentSettings) {
    // Create default settings if none exist
    currentSettings = await createDefaultSettings(userId);
  }
  
  // Merge with new settings, ensuring userId remains the same
  const updatedSettings: AccessibilitySettings = {
    ...currentSettings,
    ...settings,
    userId,  // Ensure userId doesn't change
    updatedAt: new Date()
  };
  
  // Save to database
  return db.saveSettings(updatedSettings);
};

/**
 * Apply current accessibility settings to the UI
 * Used to update the web app UI based on user settings
 */
export const applyCurrentSettings = async (): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) return;
    
    const settings = await getAccessibilitySettings(userId);
    applyAccessibilitySettings(settings);
  } catch (error) {
    console.error('Failed to apply accessibility settings:', error);
  }
};

/**
 * Create default settings for a user
 * @param userId User ID to create settings for
 * @returns Promise resolving to the created default settings
 */
async function createDefaultSettings(userId: string): Promise<AccessibilitySettings> {
  const defaultSettings: AccessibilitySettings = {
    userId,
    updatedAt: new Date(),
    visual: {
      highContrast: false,
      colorBlindMode: 'none',
      fontFamily: 'Arial, sans-serif',
      fontSize: 16,
      lineSpacing: 1.2,
      characterSpacing: 0,
      zoomLevel: 1,
      imageDescriptions: true
    },
    hearing: {
      captionsEnabled: false,
      soundNotifications: true,
      signLanguageEnabled: false,
      captionsSize: 16,
      captionsPosition: 'bottom',
      captionsColor: '#ffffff',
      captionsBackgroundColor: '#000000'
    },
    motor: {
      dwellClickingEnabled: false,
      dwellTime: 1000,
      mouseTrackingEnabled: false,
      keyboardNavigationEnabled: true,
      showClickableElements: true,
      autoFillForms: false,
      gesturesEnabled: false,
      switchControlEnabled: false
    },
    cognitive: {
      focusModeEnabled: false,
      readingGuideEnabled: false,
      simplifiedPageEnabled: false,
      readingAidsEnabled: false,
      highlightLinksEnabled: true,
      textToSpeechEnabled: false,
      vocabularySimplificationEnabled: false,
      readingSpeed: 1
    },
    speech: {
      textToSpeechCommunicator: false,
      voiceInputAlternative: false,
      voiceAvatarEnabled: false,
      customVoiceEnabled: false
    },
    general: {
      extensionEnabled: true,
      notificationsEnabled: true,
      syncAcrossDevices: true,
      privacyMode: 'standard',
      theme: 'system',
      shortcutsEnabled: true
    }
  };
  
  // Save to database
  return db.saveSettings(defaultSettings);
}

/**
 * Apply accessibility settings to the UI
 * @param settings Settings to apply
 */
const applyAccessibilitySettings = (settings: AccessibilitySettings): void => {
  const root = document.documentElement;
  
  // Apply visual settings
  if (settings.visual) {
    // Font size
    root.style.setProperty('--base-font-size', `${settings.visual.fontSize}px`);
    
    // Font family
    if (settings.visual.fontFamily) {
      root.style.setProperty('--font-family', settings.visual.fontFamily);
    }
    
    // Line spacing
    if (settings.visual.lineSpacing) {
      root.style.setProperty('--line-spacing', `${settings.visual.lineSpacing}`);
    }
    
    // Character spacing
    if (settings.visual.characterSpacing) {
      root.style.setProperty('--character-spacing', `${settings.visual.characterSpacing}px`);
    }
    
    // High contrast mode
    if (settings.visual.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    
    // Color blind mode
    document.body.classList.remove('protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia');
    if (settings.visual.colorBlindMode && settings.visual.colorBlindMode !== 'none') {
      document.body.classList.add(settings.visual.colorBlindMode);
    }
  }
  
  // Apply general settings - theme
  if (settings.general && settings.general.theme) {
    document.body.classList.remove('theme-light', 'theme-dark');
    
    if (settings.general.theme === 'light') {
      document.body.classList.add('theme-light');
    } else if (settings.general.theme === 'dark') {
      document.body.classList.add('theme-dark');
    } else if (settings.general.theme === 'system') {
      // Use system preference for dark mode
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('theme-dark');
      } else {
        document.body.classList.add('theme-light');
      }
    }
  }
  
  // Motor settings
  if (settings.motor) {
    // Keyboard only mode
    if (settings.motor.keyboardNavigationEnabled) {
      document.body.classList.add('keyboard-navigation');
    } else {
      document.body.classList.remove('keyboard-navigation');
    }
    
    if (settings.motor.showClickableElements) {
      document.body.classList.add('show-clickable');
    } else {
      document.body.classList.remove('show-clickable');
    }
  }
  
  // Cognitive settings
  if (settings.cognitive) {
    // Focus mode
    if (settings.cognitive.focusModeEnabled) {
      document.body.classList.add('focus-mode');
    } else {
      document.body.classList.remove('focus-mode');
    }
    
    // Reading guide
    if (settings.cognitive.readingGuideEnabled) {
      document.body.classList.add('reading-guide');
    } else {
      document.body.classList.remove('reading-guide');
    }
    
    // Simplified page view
    if (settings.cognitive.simplifiedPageEnabled) {
      document.body.classList.add('simplified-page');
    } else {
      document.body.classList.remove('simplified-page');
    }
    
    // Highlight links
    if (settings.cognitive.highlightLinksEnabled) {
      document.body.classList.add('highlight-links');
    } else {
      document.body.classList.remove('highlight-links');
    }
  }
  
  console.log('Applied accessibility settings:', settings);
};

/**
 * Initialize accessibility settings for the current session
 */
export const initializeAccessibilitySettings = async (): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) return;
    
    const settings = await getAccessibilitySettings(userId);
    applyAccessibilitySettings(settings);
  } catch (error) {
    console.error('Failed to initialize accessibility settings:', error);
  }
};