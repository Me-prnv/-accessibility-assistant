import { UsageStatistics, AccessibilitySettings, WebsitePreferences } from '../database/schema';
import { getCurrentUserId } from './userService';

// Extension message types
export enum MessageType {
  SYNC_SETTINGS = 'SYNC_SETTINGS',
  SYNC_STATS = 'SYNC_STATS',
  APPLY_SETTINGS = 'APPLY_SETTINGS',
  GET_WEBSITE_PREFERENCES = 'GET_WEBSITE_PREFERENCES',
  SET_WEBSITE_PREFERENCES = 'SET_WEBSITE_PREFERENCES',
  FEATURE_USED = 'FEATURE_USED'
}

interface ExtensionMessage {
  type: MessageType;
  payload: any;
}

interface ExtensionResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Send a message to the browser extension
 * @param message The message to send
 * @returns Promise resolving to the extension response
 */
export const sendMessageToExtension = async (message: ExtensionMessage): Promise<ExtensionResponse> => {
  try {
    // Check if we're in a browser environment with extension support
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
      console.warn('Chrome extension API not available');
      return { success: false, error: 'Extension API not available' };
    }
    
    // Send message to extension
    const response = await chrome.runtime.sendMessage(message);
    return response || { success: false, error: 'No response from extension' };
  } catch (error) {
    console.error('Error sending message to extension:', error);
    return { success: false, error: String(error) };
  }
};

/**
 * Sync accessibility settings with the browser extension
 * @param settings The settings to sync
 * @returns Promise resolving to success status
 */
export const syncSettingsWithExtension = async (settings: AccessibilitySettings): Promise<boolean> => {
  const response = await sendMessageToExtension({
    type: MessageType.SYNC_SETTINGS,
    payload: { settings }
  });
  
  return response.success;
};

/**
 * Fetch usage statistics from the browser extension
 * @returns Promise resolving to usage statistics
 */
export const fetchUsageStatsFromExtension = async (): Promise<Partial<UsageStatistics> | null> => {
  const userId = getCurrentUserId();
  if (!userId) return null;
  
  const response = await sendMessageToExtension({
    type: MessageType.SYNC_STATS,
    payload: { userId }
  });
  
  if (response.success && response.data) {
    return response.data as Partial<UsageStatistics>;
  }
  
  return null;
};

/**
 * Apply accessibility settings to the current website through the extension
 * @param settings The settings to apply
 * @returns Promise resolving to success status
 */
export const applySettingsToWebsite = async (settings: AccessibilitySettings): Promise<boolean> => {
  const response = await sendMessageToExtension({
    type: MessageType.APPLY_SETTINGS,
    payload: { settings }
  });
  
  return response.success;
};

/**
 * Get website-specific preferences from the extension
 * @param domain The website domain
 * @returns Promise resolving to website preferences
 */
export const getWebsitePreferences = async (domain: string): Promise<WebsitePreferences | null> => {
  const userId = getCurrentUserId();
  if (!userId) return null;
  
  const response = await sendMessageToExtension({
    type: MessageType.GET_WEBSITE_PREFERENCES,
    payload: { userId, domain }
  });
  
  if (response.success && response.data) {
    return response.data as WebsitePreferences;
  }
  
  return null;
};

/**
 * Save website-specific preferences through the extension
 * @param preferences The preferences to save
 * @returns Promise resolving to success status
 */
export const saveWebsitePreferences = async (preferences: WebsitePreferences): Promise<boolean> => {
  const response = await sendMessageToExtension({
    type: MessageType.SET_WEBSITE_PREFERENCES,
    payload: { preferences }
  });
  
  return response.success;
};

/**
 * Report feature usage to the extension
 * @param featureName The name of the feature used
 * @param count The number of times the feature was used
 * @returns Promise resolving to success status
 */
export const reportFeatureUsage = async (featureName: string, count = 1): Promise<boolean> => {
  const userId = getCurrentUserId();
  if (!userId) return false;
  
  const response = await sendMessageToExtension({
    type: MessageType.FEATURE_USED,
    payload: { userId, featureName, count }
  });
  
  return response.success;
};

/**
 * Mock extension communication for development/testing
 * This simulates responses from the extension when it's not available
 * @param message The message that would be sent to the extension
 * @returns Mock response mimicking extension behavior
 */
export const mockExtensionResponse = (message: ExtensionMessage): ExtensionResponse => {
  switch (message.type) {
    case MessageType.SYNC_STATS:
      return {
        success: true,
        data: {
          featureUsage: {
            screenReader: 15,
            voiceControl: 8,
            dwellClicking: 3,
            highContrast: 12,
            textToSpeech: 6
          },
          sessionCount: 5,
          totalTimeSpent: 127, // in minutes
          websitesVisited: 15,
          performanceMetrics: {
            averageResponseTime: 0.8,
            errorCount: 2,
            modelProcessingTime: 1.1
          }
        }
      };
      
    case MessageType.GET_WEBSITE_PREFERENCES:
      return {
        success: true,
        data: {
          id: `pref-${Date.now()}`,
          userId: message.payload.userId,
          domain: message.payload.domain,
          highContrastEnabled: false,
          fontSizeAdjustment: 1.2,
          reducedMotion: true,
          customCss: null
        }
      };
      
    default:
      return { success: true };
  }
};