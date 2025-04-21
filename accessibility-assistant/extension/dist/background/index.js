// Background script entry point for the accessibility assistant extension
import { initCommunicationService, setActiveUser } from './communicationService';
// Initialize the extension
const init = async () => {
    console.log('Initializing accessibility assistant extension');
    // Initialize the communication service
    initCommunicationService();
    // Set up event listeners
    setupEventListeners();
    // Check authentication status
    await checkAuthStatus();
    console.log('Extension initialization complete');
};
// Set up browser extension event listeners
const setupEventListeners = () => {
    // Listen for extension installation or update
    chrome.runtime.onInstalled.addListener(handleExtensionInstalled);
    // Listen for browser startup
    chrome.runtime.onStartup.addListener(handleBrowserStartup);
};
// Handle extension installation or update
const handleExtensionInstalled = async (details) => {
    if (details.reason === 'install') {
        console.log('Extension installed');
        // Open onboarding page
        await openOnboardingPage();
    }
    else if (details.reason === 'update') {
        console.log('Extension updated from version', details.previousVersion);
        // Check if we need to migrate data
        await migrateDataIfNeeded(details.previousVersion);
    }
};
// Handle browser startup
const handleBrowserStartup = async () => {
    console.log('Browser started');
    // Check authentication status
    await checkAuthStatus();
};
// Check if the user is authenticated
const checkAuthStatus = async () => {
    try {
        // Check if we have an auth token
        const result = await chrome.storage.local.get(['auth_token', 'user_id']);
        const authToken = result.auth_token;
        const userId = result.user_id;
        if (authToken && userId) {
            console.log('User is authenticated');
            // Set the active user
            await setActiveUser(userId);
            // Verify token validity with the web app (future implementation)
        }
        else {
            console.log('User is not authenticated');
        }
    }
    catch (error) {
        console.error('Error checking auth status:', error);
    }
};
// Open the onboarding page
const openOnboardingPage = async () => {
    try {
        const url = chrome.runtime.getURL('onboarding.html');
        await chrome.tabs.create({ url });
    }
    catch (error) {
        console.error('Error opening onboarding page:', error);
    }
};
// Migrate data if needed
const migrateDataIfNeeded = async (previousVersion) => {
    // Example version checking for migrations
    if (previousVersion && compareVersions(previousVersion, '1.0.0') < 0) {
        console.log('Migrating from pre-1.0.0 version');
        // Migration code here
    }
};
// Compare two version strings (semver)
const compareVersions = (v1, v2) => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 !== p2) {
            return p1 - p2;
        }
    }
    return 0;
};
// Initialize the extension
init().catch(error => {
    console.error('Error initializing extension:', error);
});
