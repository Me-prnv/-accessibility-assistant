import { UserProfile } from '../database/schema';

// This is a mock implementation that would be replaced with actual API calls
// to your backend service in a production environment

// In-memory storage for development/testing
const mockUserProfiles: Record<string, UserProfile> = {
  'user-1': {
    id: 'user-1',
    email: 'johndoe@example.com',
    name: 'John Doe',
    createdAt: new Date('2023-01-15').toISOString(),
    lastLoginAt: new Date('2023-06-10').toISOString(),
    disabilityTypes: ['visual', 'motor'],
    preferredLanguage: 'en',
    isOnboarded: true,
    authProvider: 'google',
    profilePicture: 'https://randomuser.me/api/portraits/men/75.jpg'
  },
  'user-2': {
    id: 'user-2',
    email: 'janedoe@example.com',
    name: 'Jane Doe',
    createdAt: new Date('2023-02-20').toISOString(),
    lastLoginAt: new Date('2023-06-08').toISOString(),
    disabilityTypes: ['hearing', 'cognitive'],
    preferredLanguage: 'es',
    isOnboarded: true,
    authProvider: 'email'
  }
};

/**
 * Get a user profile by ID
 * @param userId User ID to fetch
 * @returns Promise resolving to the user profile
 */
export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const profile = mockUserProfiles[userId];
  if (!profile) {
    throw new Error(`User with ID ${userId} not found`);
  }
  
  return { ...profile };
};

/**
 * Update a user profile
 * @param userId User ID to update
 * @param profileData Profile data to update
 * @returns Promise resolving to the updated user profile
 */
export const updateUserProfile = async (
  userId: string, 
  profileData: Partial<UserProfile>
): Promise<UserProfile> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const existingProfile = mockUserProfiles[userId];
  if (!existingProfile) {
    throw new Error(`User with ID ${userId} not found`);
  }
  
  // Don't allow changing certain fields
  const { id, createdAt, ...updatableData } = profileData;
  
  // Update the profile
  const updatedProfile = {
    ...existingProfile,
    ...updatableData,
    // Always update the last modified timestamp
    lastModifiedAt: new Date().toISOString()
  };
  
  // Save to mock database
  mockUserProfiles[userId] = updatedProfile;
  
  return { ...updatedProfile };
};

/**
 * Get the current user ID
 * In a real app, this would likely be from an auth context
 * @returns The current user ID
 */
export const getCurrentUserId = (): string => {
  // For demonstration purposes, just return a fixed ID
  return 'user-1';
};

/**
 * Get the current user profile
 * @returns Promise resolving to the current user's profile
 */
export const getCurrentUserProfile = async (): Promise<UserProfile> => {
  const userId = getCurrentUserId();
  return getUserProfile(userId);
}; 