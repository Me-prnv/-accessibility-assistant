import { AccessibilitySettings } from '../database/schema';

// Mock data for development/testing
const mockSettings: Record<string, AccessibilitySettings> = {
  'user-1': {
    userId: 'user-1',
    visual: {
      highContrast: false,
      fontSize: 16,
      colorTheme: 'system',
      reducedMotion: false,
      screenReaderOptimized: false,
      zoomLevel: 1
    },
    hearing: {
      captionsEnabled: true,
      captionSize: 'medium',
      volume: 75,
      soundEffectsVolume: 50
    },
    motor: {
      keyboardOnly: false,
      autoClickEnabled: false,
      autoClickDelay: 2000,
      pointerSize: 'medium',
      cursorSpeed: 'medium'
    },
    cognitive: {
      simplifiedMode: false,
      extraTimeForActions: false,
      textComplexity: 'standard',
      focusMode: false
    },
    speech: {
      voiceRecognitionEnabled: true,
      voiceSpeed: 'medium',
      voiceType: 'default'
    },
    general: {
      notificationStyle: 'visual',
      errorDisplayDuration: 5000,
      autoSaveEnabled: true
    },
    lastUpdated: new Date().toISOString()
  },
  'user-2': {
    userId: 'user-2',
    visual: {
      highContrast: true,
      fontSize: 20,
      colorTheme: 'highContrastDark',
      reducedMotion: true,
      screenReaderOptimized: true,
      zoomLevel: 1.25
    },
    hearing: {
      captionsEnabled: true,
      captionSize: 'large',
      volume: 100,
      soundEffectsVolume: 25
    },
    motor: {
      keyboardOnly: true,
      autoClickEnabled: true,
      autoClickDelay: 3000,
      pointerSize: 'large',
      cursorSpeed: 'slow'
    },
    cognitive: {
      simplifiedMode: true,
      extraTimeForActions: true,
      textComplexity: 'simple',
      focusMode: true
    },
    speech: {
      voiceRecognitionEnabled: true,
      voiceSpeed: 'slow',
      voiceType: 'clear'
    },
    general: {
      notificationStyle: 'both',
      errorDisplayDuration: 8000,
      autoSaveEnabled: true
    },
    lastUpdated: new Date().toISOString()
  }
};

/**
 * Get accessibility settings for a user
 * @param userId User ID to fetch settings for
 * @returns Promise resolving to the user's accessibility settings
 */
export const getAccessibilitySettings = async (userId: string): Promise<AccessibilitySettings> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const settings = mockSettings[userId];
  if (!settings) {
    // If no settings exist for this user, create default settings
    const defaultSettings: AccessibilitySettings = {
      userId,
      visual: {
        highContrast: false,
        fontSize: 16,
        colorTheme: 'system',
        reducedMotion: false,
        screenReaderOptimized: false,
        zoomLevel: 1
      },
      hearing: {
        captionsEnabled: false,
        captionSize: 'medium',
        volume: 80,
        soundEffectsVolume: 50
      },
      motor: {
        keyboardOnly: false,
        autoClickEnabled: false,
        autoClickDelay: 2000,
        pointerSize: 'medium',
        cursorSpeed: 'medium'
      },
      cognitive: {
        simplifiedMode: false,
        extraTimeForActions: false,
        textComplexity: 'standard',
        focusMode: false
      },
      speech: {
        voiceRecognitionEnabled: false,
        voiceSpeed: 'medium',
        voiceType: 'default'
      },
      general: {
        notificationStyle: 'visual',
        errorDisplayDuration: 5000,
        autoSaveEnabled: true
      },
      lastUpdated: new Date().toISOString()
    };
    
    // Save the default settings
    mockSettings[userId] = defaultSettings;
    return { ...defaultSettings };
  }
  
  return { ...settings };
};

/**
 * Update accessibility settings for a user
 * @param userId User ID to update settings for
 * @param settings New settings to apply
 * @returns Promise resolving to the updated settings
 */
export const updateAccessibilitySettings = async (
  userId: string,
  settings: Partial<AccessibilitySettings>
): Promise<AccessibilitySettings> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Get existing settings or default
  const existingSettings = mockSettings[userId] || await getAccessibilitySettings(userId);
  
  // Update the settings
  const updatedSettings: AccessibilitySettings = {
    ...existingSettings,
    ...settings,
    userId, // Ensure userId remains correct
    lastUpdated: new Date().toISOString() // Update the lastUpdated timestamp
  };
  
  // Save to mock database
  mockSettings[userId] = updatedSettings;
  
  // Apply settings to the application
  applyAccessibilitySettings(updatedSettings);
  
  return { ...updatedSettings };
};

/**
 * Apply accessibility settings to the application
 * This would normally update CSS variables, add/remove classes, etc.
 * @param settings Settings to apply
 */
const applyAccessibilitySettings = (settings: AccessibilitySettings): void => {
  const root = document.documentElement;
  
  // Apply visual settings
  if (settings.visual) {
    // Font size
    root.style.setProperty('--base-font-size', `${settings.visual.fontSize}px`);
    
    // High contrast mode
    if (settings.visual.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    
    // Reduced motion
    if (settings.visual.reducedMotion) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }
    
    // Color theme would typically be handled by a theme provider
  }
  
  // Motor settings
  if (settings.motor) {
    // Keyboard only mode
    if (settings.motor.keyboardOnly) {
      document.body.classList.add('keyboard-only');
    } else {
      document.body.classList.remove('keyboard-only');
    }
    
    // Auto-click would be handled by event listeners elsewhere
  }
  
  // Cognitive settings
  if (settings.cognitive) {
    // Simplified mode
    if (settings.cognitive.simplifiedMode) {
      document.body.classList.add('simplified-mode');
    } else {
      document.body.classList.remove('simplified-mode');
    }
  }
  
  // In a real app, many more settings would be applied here
  console.log('Applied accessibility settings:', settings);
};

/**
 * Initialize accessibility settings for the current session
 * @param userId User ID to initialize settings for
 */
export const initializeAccessibilitySettings = async (userId: string): Promise<void> => {
  try {
    const settings = await getAccessibilitySettings(userId);
    applyAccessibilitySettings(settings);
  } catch (error) {
    console.error('Failed to initialize accessibility settings:', error);
    // Apply default settings as fallback
    const defaultSettings = await getAccessibilitySettings('default');
    applyAccessibilitySettings(defaultSettings);
  }
}; 