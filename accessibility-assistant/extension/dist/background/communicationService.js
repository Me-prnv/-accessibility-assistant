// Communication service for the browser extension background script
// Handles message passing between the web app, content scripts, and background script
// Message types for internal and external communication
export var MessageType;
(function (MessageType) {
    // Web app to extension messages
    MessageType["SYNC_SETTINGS"] = "SYNC_SETTINGS";
    MessageType["SYNC_STATS"] = "SYNC_STATS";
    MessageType["APPLY_SETTINGS"] = "APPLY_SETTINGS";
    MessageType["GET_WEBSITE_PREFERENCES"] = "GET_WEBSITE_PREFERENCES";
    MessageType["SET_WEBSITE_PREFERENCES"] = "SET_WEBSITE_PREFERENCES";
    MessageType["FEATURE_USED"] = "FEATURE_USED";
    // Content script to background messages
    MessageType["PAGE_LOADED"] = "PAGE_LOADED";
    MessageType["REQUEST_SETTINGS"] = "REQUEST_SETTINGS";
    MessageType["UPDATE_STATISTICS"] = "UPDATE_STATISTICS";
    MessageType["FEATURE_ACTIVATED"] = "FEATURE_ACTIVATED";
    MessageType["FEATURE_DEACTIVATED"] = "FEATURE_DEACTIVATED";
    MessageType["LOG_ERROR"] = "LOG_ERROR";
    // Background to content script messages
    MessageType["APPLY_ACCESSIBILITY_FEATURES"] = "APPLY_ACCESSIBILITY_FEATURES";
    MessageType["UPDATE_FEATURE_STATE"] = "UPDATE_FEATURE_STATE";
    MessageType["RELOAD_CONTENT"] = "RELOAD_CONTENT";
})(MessageType || (MessageType = {}));
// Storage keys
const STORAGE_KEYS = {
    SETTINGS: 'accessibility_settings',
    WEBSITE_PREFERENCES: 'website_preferences',
    USAGE_STATISTICS: 'usage_statistics',
    USER_ID: 'user_id',
    ACTIVE_PROFILE: 'active_profile_id',
    AUTH_TOKEN: 'auth_token'
};
/**
 * Initialize the communication service
 */
export const initCommunicationService = () => {
    // Set up message listeners
    chrome.runtime.onMessage.addListener(handleMessage);
    // Listen for connections from content scripts
    chrome.runtime.onConnect.addListener(handleConnection);
    console.log('Communication service initialized');
};
/**
 * Handle messages from content scripts and web app
 * @param message The message received
 * @param sender Information about the sender
 * @param sendResponse Function to send a response
 * @returns Boolean indicating whether the response will be sent asynchronously
 */
const handleMessage = (message, sender, sendResponse) => {
    console.log('Received message:', message.type, message.payload);
    // Process message based on type
    switch (message.type) {
        case MessageType.SYNC_SETTINGS:
            handleSyncSettings(message.payload)
                .then(sendResponse)
                .catch(error => sendResponse({ success: false, error: error.toString() }));
            return true;
        case MessageType.SYNC_STATS:
            handleSyncStats(message.payload)
                .then(sendResponse)
                .catch(error => sendResponse({ success: false, error: error.toString() }));
            return true;
        case MessageType.APPLY_SETTINGS:
            handleApplySettings(message.payload, sender.tab?.id)
                .then(sendResponse)
                .catch(error => sendResponse({ success: false, error: error.toString() }));
            return true;
        case MessageType.GET_WEBSITE_PREFERENCES:
            handleGetWebsitePreferences(message.payload)
                .then(sendResponse)
                .catch(error => sendResponse({ success: false, error: error.toString() }));
            return true;
        case MessageType.SET_WEBSITE_PREFERENCES:
            handleSetWebsitePreferences(message.payload)
                .then(sendResponse)
                .catch(error => sendResponse({ success: false, error: error.toString() }));
            return true;
        case MessageType.FEATURE_USED:
            handleFeatureUsed(message.payload)
                .then(sendResponse)
                .catch(error => sendResponse({ success: false, error: error.toString() }));
            return true;
        case MessageType.REQUEST_SETTINGS:
            handleRequestSettings(message.payload, sender.tab?.id)
                .then(sendResponse)
                .catch(error => sendResponse({ success: false, error: error.toString() }));
            return true;
        case MessageType.UPDATE_STATISTICS:
            handleUpdateStatistics(message.payload)
                .then(sendResponse)
                .catch(error => sendResponse({ success: false, error: error.toString() }));
            return true;
        default:
            // Unknown message type
            sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
            return false;
    }
};
/**
 * Handle long-lived connections from content scripts
 * @param port The connection port
 */
const handleConnection = (port) => {
    console.log('New connection established:', port.name);
    // Listen for messages on this port
    port.onMessage.addListener((message) => {
        console.log('Port message received:', message.type);
        // Handle message based on type
        switch (message.type) {
            case MessageType.PAGE_LOADED:
                handlePageLoaded(message.payload, port);
                break;
            case MessageType.FEATURE_ACTIVATED:
                handleFeatureActivated(message.payload);
                break;
            case MessageType.FEATURE_DEACTIVATED:
                handleFeatureDeactivated(message.payload);
                break;
            case MessageType.LOG_ERROR:
                handleLogError(message.payload);
                break;
            default:
                console.warn('Unknown port message type:', message.type);
                break;
        }
    });
    // Handle disconnection
    port.onDisconnect.addListener(() => {
        console.log('Connection closed:', port.name);
    });
};
/**
 * Save settings to storage
 * @param payload Settings payload
 * @returns Promise resolving to success response
 */
const handleSyncSettings = async (payload) => {
    try {
        const { settings } = payload;
        if (!settings) {
            return { success: false, error: 'No settings provided' };
        }
        // Save settings to storage
        await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
        // Notify all tabs to update settings
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
            if (tab.id) {
                chrome.tabs.sendMessage(tab.id, {
                    type: MessageType.APPLY_ACCESSIBILITY_FEATURES,
                    payload: { settings }
                }).catch(() => {
                    // Ignore errors for tabs that don't have content scripts
                });
            }
        });
        return { success: true };
    }
    catch (error) {
        console.error('Error syncing settings:', error);
        return { success: false, error: String(error) };
    }
};
/**
 * Get usage statistics from storage
 * @param payload Stats request payload
 * @returns Promise resolving to stats response
 */
const handleSyncStats = async (payload) => {
    try {
        const { userId } = payload;
        if (!userId) {
            return { success: false, error: 'No user ID provided' };
        }
        // Get stats from storage
        const result = await chrome.storage.local.get(STORAGE_KEYS.USAGE_STATISTICS);
        const allStats = result[STORAGE_KEYS.USAGE_STATISTICS] || {};
        // Get user stats
        const userStats = allStats[userId] || {
            featureUsage: {},
            sessionCount: 0,
            totalTimeSpent: 0,
            websitesVisited: 0
        };
        return { success: true, data: userStats };
    }
    catch (error) {
        console.error('Error syncing stats:', error);
        return { success: false, error: String(error) };
    }
};
/**
 * Apply settings to a specific tab
 * @param payload Settings payload
 * @param tabId Tab ID to apply settings to
 * @returns Promise resolving to success response
 */
const handleApplySettings = async (payload, tabId) => {
    try {
        const { settings } = payload;
        if (!settings) {
            return { success: false, error: 'No settings provided' };
        }
        // Save settings to storage
        await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
        if (tabId) {
            // Apply to specific tab
            await chrome.tabs.sendMessage(tabId, {
                type: MessageType.APPLY_ACCESSIBILITY_FEATURES,
                payload: { settings }
            });
        }
        else {
            // Apply to all tabs
            const tabs = await chrome.tabs.query({});
            for (const tab of tabs) {
                if (tab.id) {
                    try {
                        await chrome.tabs.sendMessage(tab.id, {
                            type: MessageType.APPLY_ACCESSIBILITY_FEATURES,
                            payload: { settings }
                        });
                    }
                    catch (e) {
                        // Ignore errors for tabs that don't have content scripts
                    }
                }
            }
        }
        return { success: true };
    }
    catch (error) {
        console.error('Error applying settings:', error);
        return { success: false, error: String(error) };
    }
};
/**
 * Get website preferences for a domain
 * @param payload Domain request payload
 * @returns Promise resolving to preferences response
 */
const handleGetWebsitePreferences = async (payload) => {
    try {
        const { userId, domain } = payload;
        if (!userId || !domain) {
            return { success: false, error: 'Missing user ID or domain' };
        }
        // Get preferences from storage
        const result = await chrome.storage.local.get(STORAGE_KEYS.WEBSITE_PREFERENCES);
        const allPrefs = result[STORAGE_KEYS.WEBSITE_PREFERENCES] || {};
        // Get preferences for this user and domain
        const userPrefs = allPrefs[userId] || {};
        const domainPrefs = userPrefs[domain] || null;
        return { success: true, data: domainPrefs };
    }
    catch (error) {
        console.error('Error getting website preferences:', error);
        return { success: false, error: String(error) };
    }
};
/**
 * Save website preferences for a domain
 * @param payload Preferences payload
 * @returns Promise resolving to success response
 */
const handleSetWebsitePreferences = async (payload) => {
    try {
        const { preferences } = payload;
        if (!preferences || !preferences.userId || !preferences.domain) {
            return { success: false, error: 'Invalid preferences data' };
        }
        // Get current preferences
        const result = await chrome.storage.local.get(STORAGE_KEYS.WEBSITE_PREFERENCES);
        const allPrefs = result[STORAGE_KEYS.WEBSITE_PREFERENCES] || {};
        // Update preferences
        if (!allPrefs[preferences.userId]) {
            allPrefs[preferences.userId] = {};
        }
        allPrefs[preferences.userId][preferences.domain] = preferences;
        // Save updated preferences
        await chrome.storage.local.set({ [STORAGE_KEYS.WEBSITE_PREFERENCES]: allPrefs });
        // Apply to matching tabs
        const tabs = await chrome.tabs.query({ url: `*://*.${preferences.domain}/*` });
        for (const tab of tabs) {
            if (tab.id) {
                try {
                    await chrome.tabs.sendMessage(tab.id, {
                        type: MessageType.APPLY_ACCESSIBILITY_FEATURES,
                        payload: { websitePreferences: preferences }
                    });
                }
                catch (e) {
                    // Ignore errors for tabs that don't have content scripts
                }
            }
        }
        return { success: true };
    }
    catch (error) {
        console.error('Error setting website preferences:', error);
        return { success: false, error: String(error) };
    }
};
/**
 * Record feature usage
 * @param payload Feature usage payload
 * @returns Promise resolving to success response
 */
const handleFeatureUsed = async (payload) => {
    try {
        const { userId, featureName, count = 1 } = payload;
        if (!userId || !featureName) {
            return { success: false, error: 'Missing user ID or feature name' };
        }
        // Get current stats
        const result = await chrome.storage.local.get(STORAGE_KEYS.USAGE_STATISTICS);
        const allStats = result[STORAGE_KEYS.USAGE_STATISTICS] || {};
        // Initialize user stats if needed
        if (!allStats[userId]) {
            allStats[userId] = {
                featureUsage: {},
                sessionCount: 0,
                totalTimeSpent: 0,
                websitesVisited: 0
            };
        }
        // Initialize feature usage if needed
        if (!allStats[userId].featureUsage[featureName]) {
            allStats[userId].featureUsage[featureName] = 0;
        }
        // Update feature usage count
        allStats[userId].featureUsage[featureName] += count;
        // Save updated stats
        await chrome.storage.local.set({ [STORAGE_KEYS.USAGE_STATISTICS]: allStats });
        return { success: true };
    }
    catch (error) {
        console.error('Error recording feature usage:', error);
        return { success: false, error: String(error) };
    }
};
/**
 * Handle request for settings from content script
 * @param payload Request payload
 * @param tabId Tab ID requesting settings
 * @returns Promise resolving to settings response
 */
const handleRequestSettings = async (payload, tabId) => {
    try {
        const { url } = payload;
        // Get global settings
        const settingsResult = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        const settings = settingsResult[STORAGE_KEYS.SETTINGS];
        // Get user ID
        const userIdResult = await chrome.storage.local.get(STORAGE_KEYS.USER_ID);
        const userId = userIdResult[STORAGE_KEYS.USER_ID];
        if (!settings || !userId) {
            return { success: false, error: 'Settings or user ID not found' };
        }
        // If URL is provided, check for website-specific preferences
        let websitePreferences = null;
        if (url) {
            try {
                const domain = new URL(url).hostname;
                // Get website preferences
                const prefsResult = await chrome.storage.local.get(STORAGE_KEYS.WEBSITE_PREFERENCES);
                const allPrefs = prefsResult[STORAGE_KEYS.WEBSITE_PREFERENCES] || {};
                const userPrefs = allPrefs[userId] || {};
                websitePreferences = userPrefs[domain] || null;
            }
            catch (e) {
                console.warn('Error parsing URL:', e);
            }
        }
        return {
            success: true,
            data: {
                settings,
                websitePreferences
            }
        };
    }
    catch (error) {
        console.error('Error handling settings request:', error);
        return { success: false, error: String(error) };
    }
};
/**
 * Handle page loaded message from content script
 * @param payload Page info payload
 * @param port Connection port
 */
const handlePageLoaded = async (payload, port) => {
    try {
        const { url, title } = payload;
        // Get current user ID
        const userIdResult = await chrome.storage.local.get(STORAGE_KEYS.USER_ID);
        const userId = userIdResult[STORAGE_KEYS.USER_ID];
        if (!userId) {
            console.warn('No user ID found for page load tracking');
            return;
        }
        // Get current stats
        const result = await chrome.storage.local.get(STORAGE_KEYS.USAGE_STATISTICS);
        const allStats = result[STORAGE_KEYS.USAGE_STATISTICS] || {};
        // Initialize user stats if needed
        if (!allStats[userId]) {
            allStats[userId] = {
                featureUsage: {},
                sessionCount: 0,
                totalTimeSpent: 0,
                websitesVisited: 0,
                websitesHistory: []
            };
        }
        // Check if this is a new website
        let isNewWebsite = true;
        if (allStats[userId].websitesHistory) {
            try {
                const domain = new URL(url).hostname;
                isNewWebsite = !allStats[userId].websitesHistory.includes(domain);
                if (isNewWebsite) {
                    allStats[userId].websitesHistory.push(domain);
                    // Limit history size
                    if (allStats[userId].websitesHistory.length > 100) {
                        allStats[userId].websitesHistory = allStats[userId].websitesHistory.slice(-100);
                    }
                }
            }
            catch (e) {
                console.warn('Error parsing URL for tracking:', e);
            }
        }
        else {
            // Initialize history array
            allStats[userId].websitesHistory = [];
        }
        // Update stats
        if (isNewWebsite) {
            allStats[userId].websitesVisited++;
        }
        // Save updated stats
        await chrome.storage.local.set({ [STORAGE_KEYS.USAGE_STATISTICS]: allStats });
        // Send settings to the content script
        const settings = await handleRequestSettings(payload);
        if (settings.success) {
            port.postMessage({
                type: MessageType.APPLY_ACCESSIBILITY_FEATURES,
                payload: settings.data
            });
        }
    }
    catch (error) {
        console.error('Error handling page loaded:', error);
    }
};
/**
 * Handle feature activated message
 * @param payload Feature info payload
 */
const handleFeatureActivated = async (payload) => {
    try {
        const { featureName } = payload;
        if (!featureName) {
            console.warn('No feature name provided for activation');
            return;
        }
        // Get current user ID
        const userIdResult = await chrome.storage.local.get(STORAGE_KEYS.USER_ID);
        const userId = userIdResult[STORAGE_KEYS.USER_ID];
        if (!userId) {
            console.warn('No user ID found for feature activation tracking');
            return;
        }
        // Record feature usage
        await handleFeatureUsed({ userId, featureName, count: 1 });
    }
    catch (error) {
        console.error('Error handling feature activation:', error);
    }
};
/**
 * Handle feature deactivated message
 * @param payload Feature info payload
 */
const handleFeatureDeactivated = async (payload) => {
    // Currently we don't need to do anything when features are deactivated
    // but we might want to track duration in the future
};
/**
 * Update usage statistics from content script
 * @param payload Stats update payload
 * @returns Promise resolving to success response
 */
const handleUpdateStatistics = async (payload) => {
    try {
        const { userId, stats } = payload;
        if (!userId || !stats) {
            return { success: false, error: 'Missing user ID or statistics' };
        }
        // Get current stats
        const result = await chrome.storage.local.get(STORAGE_KEYS.USAGE_STATISTICS);
        const allStats = result[STORAGE_KEYS.USAGE_STATISTICS] || {};
        // Initialize user stats if needed
        if (!allStats[userId]) {
            allStats[userId] = {
                featureUsage: {},
                sessionCount: 0,
                totalTimeSpent: 0,
                websitesVisited: 0
            };
        }
        // Update stats with provided data
        const userStats = allStats[userId];
        // Update feature usage counts
        if (stats.featureUsage) {
            for (const feature in stats.featureUsage) {
                if (!userStats.featureUsage[feature]) {
                    userStats.featureUsage[feature] = 0;
                }
                userStats.featureUsage[feature] += stats.featureUsage[feature];
            }
        }
        // Update session count if provided
        if (typeof stats.sessionCount === 'number') {
            userStats.sessionCount += stats.sessionCount;
        }
        // Update time spent if provided
        if (typeof stats.timeSpent === 'number') {
            userStats.totalTimeSpent += stats.timeSpent;
        }
        // Save updated stats
        await chrome.storage.local.set({ [STORAGE_KEYS.USAGE_STATISTICS]: allStats });
        return { success: true };
    }
    catch (error) {
        console.error('Error updating statistics:', error);
        return { success: false, error: String(error) };
    }
};
/**
 * Log extension errors
 * @param payload Error payload
 */
const handleLogError = (payload) => {
    const { error, context } = payload;
    console.error(`Extension error [${context}]:`, error);
    // In the future, we could send errors to a logging service
};
/**
 * Set active user ID
 * @param userId User ID to set as active
 * @returns Promise resolving to true if successful
 */
export const setActiveUser = async (userId) => {
    try {
        await chrome.storage.local.set({ [STORAGE_KEYS.USER_ID]: userId });
        return true;
    }
    catch (error) {
        console.error('Error setting active user:', error);
        return false;
    }
};
/**
 * Get active user ID
 * @returns Promise resolving to user ID or null
 */
export const getActiveUser = async () => {
    try {
        const result = await chrome.storage.local.get(STORAGE_KEYS.USER_ID);
        return result[STORAGE_KEYS.USER_ID] || null;
    }
    catch (error) {
        console.error('Error getting active user:', error);
        return null;
    }
};
/**
 * Clear all user data
 * @returns Promise resolving to true if successful
 */
export const clearUserData = async () => {
    try {
        await chrome.storage.local.remove([
            STORAGE_KEYS.USER_ID,
            STORAGE_KEYS.SETTINGS,
            STORAGE_KEYS.WEBSITE_PREFERENCES,
            STORAGE_KEYS.USAGE_STATISTICS,
            STORAGE_KEYS.ACTIVE_PROFILE,
            STORAGE_KEYS.AUTH_TOKEN
        ]);
        return true;
    }
    catch (error) {
        console.error('Error clearing user data:', error);
        return false;
    }
};
