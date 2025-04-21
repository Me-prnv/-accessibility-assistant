import * as db from './databaseService';
import { UserProfile, UserAccessibilityProfile, AccessibilitySettings, DisabilityType } from '../database/schema';
import * as authService from './authService';

/**
 * Get the current user ID from auth service
 */
export const getCurrentUserId = (): string | null => {
  return authService.getCurrentAuthUserId();
};

/**
 * Get the current user profile
 * @returns Promise resolving to the user profile or null if not authenticated
 */
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const userId = getCurrentUserId();
  if (!userId) return null;
  
  return db.getUserById(userId);
};

/**
 * Update user profile
 * @param userId User ID
 * @param profileData Profile data to update
 * @returns Promise resolving to the updated profile
 */
export const updateUserProfile = async (
  userId: string,
  profileData: Partial<UserProfile>
): Promise<UserProfile> => {
  // Fetch existing profile
  const existingProfile = await db.getUserById(userId);
  if (!existingProfile) {
    throw new Error('User profile not found');
  }
  
  // Update fields
  const updatedProfile = {
    ...existingProfile,
    ...profileData,
  };
  
  // Save updated profile
  return await db.saveUser(updatedProfile);
};

/**
 * Get all accessibility profiles for the current user
 * @returns Promise resolving to array of accessibility profiles
 */
export const getCurrentUserAccessibilityProfiles = async (): Promise<UserAccessibilityProfile[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  
  return db.getAccessibilityProfilesByUser(userId);
};

/**
 * Create a new accessibility profile for a user
 * @param userId User ID
 * @param profileData Basic profile data
 * @returns Promise resolving to the created profile
 */
export const createAccessibilityProfile = async (
  userId: string,
  profileData: {
    id: string;
    name: string;
    description?: string;
    isDefault: boolean;
  }
): Promise<UserAccessibilityProfile> => {
  // Create new profile with default settings
  const now = new Date();
  
  const newProfile: UserAccessibilityProfile = {
    id: profileData.id,
    userId,
    name: profileData.name,
    description: profileData.description || '',
    createdAt: now,
    updatedAt: now,
    isDefault: profileData.isDefault,
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
  
  // Save profile
  await db.saveAccessibilityProfile(newProfile);
  
  // If this is the default profile, set it as active
  if (profileData.isDefault) {
    const user = await db.getUserById(userId);
    if (user) {
      user.activeAccessibilityProfileId = newProfile.id;
      await db.saveUser(user);
    }
  }
  
  return newProfile;
};

/**
 * Update an accessibility profile
 * @param profileId Profile ID
 * @param profileData Profile data to update
 * @returns Promise resolving to the updated profile
 */
export const updateAccessibilityProfile = async (
  profileId: string,
  profileData: Partial<UserAccessibilityProfile>
): Promise<UserAccessibilityProfile> => {
  // Fetch existing profile
  const existingProfile = await db.getAccessibilityProfileById(profileId);
  if (!existingProfile) {
    throw new Error('Profile not found');
  }
  
  // Ensure the user owns this profile
  const currentUserId = getCurrentUserId();
  if (currentUserId !== existingProfile.userId) {
    throw new Error('Unauthorized to update this profile');
  }
  
  // Update fields
  const updatedProfile = {
    ...existingProfile,
    ...profileData,
    updatedAt: new Date(),
  };
  
  // Save updated profile
  return await db.saveAccessibilityProfile(updatedProfile);
};

/**
 * Delete an accessibility profile
 * @param profileId Profile ID
 * @returns Promise resolving when the profile is deleted
 */
export const deleteAccessibilityProfile = async (profileId: string): Promise<void> => {
  // Fetch existing profile
  const existingProfile = await db.getAccessibilityProfileById(profileId);
  if (!existingProfile) {
    throw new Error('Profile not found');
  }
  
  // Ensure the user owns this profile
  const currentUserId = getCurrentUserId();
  if (currentUserId !== existingProfile.userId) {
    throw new Error('Unauthorized to delete this profile');
  }
  
  // Check if this is the user's active profile
  const currentUser = await db.getUserById(currentUserId!);
  
  if (currentUser && currentUser.activeAccessibilityProfileId === profileId) {
    // Find another profile to set as active
    const userProfiles = await db.getAccessibilityProfilesByUser(currentUserId!);
    const otherProfile = userProfiles.find(p => p.id !== profileId);
    
    if (otherProfile) {
      // Set another profile as active
      currentUser.activeAccessibilityProfileId = otherProfile.id;
      await db.saveUser(currentUser);
    } else {
      // No other profiles available, create a default one
      const newDefaultProfile = await createAccessibilityProfile(currentUserId!, {
        id: `profile-${Date.now()}`,
        name: 'Default Profile',
        isDefault: true
      });
      
      // Set as active
      currentUser.activeAccessibilityProfileId = newDefaultProfile.id;
      await db.saveUser(currentUser);
    }
  }
  
  // Delete the profile
  await db.deleteAccessibilityProfile(profileId);
};

/**
 * Set a profile as the active one for the user
 * @param profileId Profile ID
 * @returns Promise resolving to the updated user profile
 */
export const setActiveProfile = async (profileId: string): Promise<UserProfile> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('Not authenticated');
  }
  
  // Fetch user
  const user = await db.getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Verify the profile exists and belongs to the user
  const profile = await db.getAccessibilityProfileById(profileId);
  if (!profile || profile.userId !== userId) {
    throw new Error('Profile not found or unauthorized');
  }
  
  // Update user
  user.activeAccessibilityProfileId = profileId;
  
  // Save user
  return await db.saveUser(user);
};

/**
 * Get the active accessibility profile for the current user
 * @returns Promise resolving to the active profile or null if not found
 */
export const getActiveProfile = async (): Promise<UserAccessibilityProfile | null> => {
  const user = await getCurrentUserProfile();
  if (!user || !user.activeAccessibilityProfileId) {
    return null;
  }
  
  return await db.getAccessibilityProfileById(user.activeAccessibilityProfileId);
};

/**
 * Update disability types for a user profile
 * @param userId User ID
 * @param disabilityTypes Array of disability types
 * @returns Promise resolving to the updated user profile
 */
export const updateUserDisabilityTypes = async (
  userId: string,
  disabilityTypes: DisabilityType[]
): Promise<UserProfile> => {
  const user = await db.getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Update user profile
  user.disabilityTypes = disabilityTypes;
  
  // Save user
  return await db.saveUser(user);
};

/**
 * Complete the onboarding process for a user
 * @param userId User ID
 * @returns Promise resolving to the updated user profile
 */
export const completeOnboarding = async (userId: string): Promise<UserProfile> => {
  const user = await db.getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Mark onboarding as complete
  user.isOnboarded = true;
  
  // Save user
  return await db.saveUser(user);
};