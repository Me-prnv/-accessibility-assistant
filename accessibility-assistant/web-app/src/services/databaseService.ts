import { openDB, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import { 
  UserProfile, 
  AccessibilitySettings, 
  UserAccessibilityProfile, 
  UsageStatistics 
} from '../database/schema';

// Database name and version
const DB_NAME = 'accessibility-assistant-db';
const DB_VERSION = 1;

// Cache for database connection
let dbPromise: Promise<IDBPDatabase> | null = null;

// Database schema definition
interface DBSchema {
  users: {
    key: string;
    value: UserProfile;
    indexes: {
      'by-email': string;
    };
  };
  settings: {
    key: string;
    value: AccessibilitySettings;
    indexes: {
      'by-user': string;
    };
  };
  accessibilityProfiles: {
    key: string;
    value: UserAccessibilityProfile;
    indexes: {
      'by-user': string;
    };
  };
  statistics: {
    key: string;
    value: UsageStatistics;
    indexes: {
      'by-user': string;
      'by-date': Date;
    };
  };
}

/**
 * Ensure database is initialized and return connection
 * @returns Promise resolving to database connection
 */
export const ensureDB = async (): Promise<IDBPDatabase<DBSchema>> => {
  if (!dbPromise) {
    dbPromise = openDB<DBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create users store if it doesn't exist
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('by-email', 'email', { unique: true });
        }

        // Create settings store if it doesn't exist
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', { keyPath: 'userId' });
          settingsStore.createIndex('by-user', 'userId', { unique: true });
        }

        // Create accessibility profiles store if it doesn't exist
        if (!db.objectStoreNames.contains('accessibilityProfiles')) {
          const profilesStore = db.createObjectStore('accessibilityProfiles', { keyPath: 'id' });
          profilesStore.createIndex('by-user', 'userId', { unique: false });
        }

        // Create statistics store if it doesn't exist
        if (!db.objectStoreNames.contains('statistics')) {
          const statsStore = db.createObjectStore('statistics', { keyPath: 'id' });
          statsStore.createIndex('by-user', 'userId', { unique: false });
          statsStore.createIndex('by-date', 'date', { unique: false });
        }
      },
    });
  }

  return dbPromise;
};

// User functions

/**
 * Get a user by their ID
 * @param id User ID
 * @returns Promise resolving to the user or null if not found
 */
export const getUserById = async (id: string): Promise<UserProfile | null> => {
  const db = await ensureDB();
  return db.get('users', id);
};

/**
 * Get a user by their email
 * @param email User email
 * @returns Promise resolving to the user or null if not found
 */
export const getUserByEmail = async (email: string): Promise<UserProfile | null> => {
  const db = await ensureDB();
  return db.getFromIndex('users', 'by-email', email);
};

/**
 * Save or update a user
 * @param user User data
 * @returns Promise resolving to the saved user
 */
export const saveUser = async (user: UserProfile): Promise<UserProfile> => {
  const db = await ensureDB();
  await db.put('users', user);
  return user;
};

/**
 * Delete a user
 * @param id User ID
 * @returns Promise resolving when the user is deleted
 */
export const deleteUser = async (id: string): Promise<void> => {
  const db = await ensureDB();
  
  // Delete the user
  await db.delete('users', id);
  
  // Delete associated data
  await db.delete('settings', id);
  
  // Get and delete all user profiles
  const profiles = await getAccessibilityProfilesByUser(id);
  for (const profile of profiles) {
    await deleteAccessibilityProfile(profile.id);
  }
  
  // Get and delete all user stats
  const stats = await getUserStats(id);
  for (const stat of stats) {
    await db.delete('statistics', stat.id);
  }
};

// Settings functions

/**
 * Get settings for a user
 * @param userId User ID
 * @returns Promise resolving to the user's settings or null if not found
 */
export const getSettings = async (userId: string): Promise<AccessibilitySettings | null> => {
  const db = await ensureDB();
  return db.get('settings', userId);
};

/**
 * Save or update settings
 * @param settings Settings data
 * @returns Promise resolving to the saved settings
 */
export const saveSettings = async (settings: AccessibilitySettings): Promise<AccessibilitySettings> => {
  const db = await ensureDB();
  await db.put('settings', settings);
  return settings;
};

// Accessibility profile functions

/**
 * Get an accessibility profile by ID
 * @param id Profile ID
 * @returns Promise resolving to the profile or null if not found
 */
export const getAccessibilityProfileById = async (id: string): Promise<UserAccessibilityProfile | null> => {
  const db = await ensureDB();
  return db.get('accessibilityProfiles', id);
};

/**
 * Get all accessibility profiles for a user
 * @param userId User ID
 * @returns Promise resolving to array of the user's profiles
 */
export const getAccessibilityProfilesByUser = async (userId: string): Promise<UserAccessibilityProfile[]> => {
  const db = await ensureDB();
  return db.getAllFromIndex('accessibilityProfiles', 'by-user', userId);
};

/**
 * Save or update an accessibility profile
 * @param profile Profile data
 * @returns Promise resolving to the saved profile
 */
export const saveAccessibilityProfile = async (
  profile: UserAccessibilityProfile
): Promise<UserAccessibilityProfile> => {
  const db = await ensureDB();
  await db.put('accessibilityProfiles', profile);
  return profile;
};

/**
 * Delete an accessibility profile
 * @param id Profile ID
 * @returns Promise resolving when the profile is deleted
 */
export const deleteAccessibilityProfile = async (id: string): Promise<void> => {
  const db = await ensureDB();
  await db.delete('accessibilityProfiles', id);
};

// Usage statistics functions

/**
 * Get user statistics by ID
 * @param id Statistics ID
 * @returns Promise resolving to the statistics entry or null if not found
 */
export const getUserStatById = async (id: string): Promise<UsageStatistics | null> => {
  const db = await ensureDB();
  return db.get('statistics', id);
};

/**
 * Get all statistics for a user
 * @param userId User ID
 * @returns Promise resolving to array of the user's statistics
 */
export const getUserStats = async (userId: string): Promise<UsageStatistics[]> => {
  const db = await ensureDB();
  return db.getAllFromIndex('statistics', 'by-user', userId);
};

/**
 * Get user statistics for a specific date range
 * @param userId User ID
 * @param startDate Range start date
 * @param endDate Range end date
 * @returns Promise resolving to array of statistics in the date range
 */
export const getUserStatsForDateRange = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<UsageStatistics[]> => {
  // Get all user stats
  const userStats = await getUserStats(userId);
  
  // Filter by date range
  return userStats.filter(stat => {
    const statDate = new Date(stat.date);
    return statDate >= startDate && statDate <= endDate;
  });
};

/**
 * Save or update user statistics
 * @param stats Statistics data
 * @returns Promise resolving to the saved statistics
 */
export const saveUserStats = async (stats: UsageStatistics): Promise<UsageStatistics> => {
  const db = await ensureDB();
  await db.put('statistics', stats);
  return stats;
};

/**
 * Delete user statistics
 * @param id Statistics ID
 * @returns Promise resolving when the statistics entry is deleted
 */
export const deleteUserStat = async (id: string): Promise<void> => {
  const db = await ensureDB();
  await db.delete('statistics', id);
};

/**
 * Clear all user statistics
 * @param userId User ID
 * @returns Promise resolving when all statistics are deleted
 */
export const clearUserStats = async (userId: string): Promise<void> => {
  const stats = await getUserStats(userId);
  const db = await ensureDB();
  
  // Delete each stat individually
  for (const stat of stats) {
    await db.delete('statistics', stat.id);
  }
};

/**
 * Create a new user account
 * @param email User email
 * @param name User name
 * @param authId Auth provider ID
 * @returns Promise resolving to the created user
 */
export const createUser = async (
  email: string, 
  name: string,
  authId?: string
): Promise<UserProfile> => {
  // Check if user already exists with this email
  const existingUser = await getUserByEmail(email);
  
  if (existingUser) {
    throw new Error('User with this email already exists');
  }
  
  // Create new user
  const now = new Date();
  const userId = `user-${uuidv4()}`;
  
  const user: UserProfile = {
    id: userId,
    email,
    name,
    createdAt: now,
    updatedAt: now,
    authId,
    activeAccessibilityProfileId: '',
    preferences: {
      theme: 'system',
      language: 'en',
    }
  };
  
  // Create default user settings
  const settings: AccessibilitySettings = {
    userId,
    updatedAt: now,
    disabilityTypes: []
  };
  
  // Create default user profile
  const defaultProfile: UserAccessibilityProfile = {
    id: `profile-${uuidv4()}`,
    userId,
    name: 'Default Profile',
    description: 'Default accessibility profile',
    createdAt: now,
    updatedAt: now,
    isDefault: true,
    disabilityTypes: [],
    iconName: 'user',
    color: '#4c9aff',
    settings: {
      userId,
      updatedAt: now,
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
    }
  };
  
  // Set active profile
  user.activeAccessibilityProfileId = defaultProfile.id;
  
  // Save everything
  const db = await ensureDB();
  await db.put('users', user);
  await db.put('settings', settings);
  await db.put('accessibilityProfiles', defaultProfile);
  
  return user;
};

/**
 * Check if the database needs to be cleared due to schema changes
 * @returns Promise resolving to whether the database needs clearing
 */
export const checkDatabaseVersion = async (): Promise<boolean> => {
  const storedVersion = localStorage.getItem('accessibility-assistant-db-version');
  
  if (!storedVersion || parseInt(storedVersion) < DB_VERSION) {
    localStorage.setItem('accessibility-assistant-db-version', DB_VERSION.toString());
    return true;
  }
  
  return false;
};