import React, { useState, useEffect } from 'react';
import { UserAccessibilityProfile, DisabilityType } from '../../database/schema';
import { 
  getUserAccessibilityProfiles, 
  getActiveAccessibilityProfile,
  setActiveAccessibilityProfile,
  createAccessibilityProfile,
  deleteAccessibilityProfile,
  getCurrentUserId
} from '../../services/userService';

interface ProfileSwitcherProps {
  onProfileChange?: (profile: UserAccessibilityProfile) => void;
}

const ProfileSwitcher: React.FC<ProfileSwitcherProps> = ({ onProfileChange }) => {
  const [profiles, setProfiles] = useState<UserAccessibilityProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<UserAccessibilityProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingProfile, setIsCreatingProfile] = useState<boolean>(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState<boolean>(false);
  const [newProfileName, setNewProfileName] = useState<string>('');
  const [selectedDisabilities, setSelectedDisabilities] = useState<DisabilityType[]>([]);
  
  const userId = getCurrentUserId();

  // Fetch profiles on component mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  // Fetch all profiles and the active one
  const fetchProfiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allProfiles = await getUserAccessibilityProfiles(userId);
      setProfiles(allProfiles);
      
      const active = await getActiveAccessibilityProfile(userId);
      setActiveProfile(active);
      
      if (active && onProfileChange) {
        onProfileChange(active);
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError('Failed to load accessibility profiles');
    } finally {
      setIsLoading(false);
    }
  };

  // Switch to a different profile
  const handleProfileSwitch = async (profileId: string) => {
    setIsLoading(true);
    try {
      await setActiveAccessibilityProfile(userId, profileId);
      
      // Find the selected profile in our local state
      const selectedProfile = profiles.find(p => p.id === profileId) || null;
      setActiveProfile(selectedProfile);
      
      if (selectedProfile && onProfileChange) {
        onProfileChange(selectedProfile);
      }
      
      // Show success message
      // Toast or notification could be added here
    } catch (err) {
      console.error('Error switching profiles:', err);
      setError('Failed to switch profiles');
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new profile
  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      return;
    }
    
    setIsLoading(true);
    try {
      const newProfile = await createAccessibilityProfile(userId, {
        name: newProfileName,
        disabilityTypes: selectedDisabilities,
        description: `Custom profile for ${selectedDisabilities.join(', ')} needs`,
      });
      
      setProfiles(prev => [...prev, newProfile]);
      setNewProfileName('');
      setSelectedDisabilities([]);
      setIsCreatingProfile(false);
      
      // Show success message
      // Toast or notification could be added here
    } catch (err) {
      console.error('Error creating profile:', err);
      setError('Failed to create profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a profile
  const handleDeleteProfile = async (profileId: string) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await deleteAccessibilityProfile(profileId);
      setProfiles(prev => prev.filter(p => p.id !== profileId));
      
      // If the deleted profile was active, refresh the active profile
      if (activeProfile && activeProfile.id === profileId) {
        const active = await getActiveAccessibilityProfile(userId);
        setActiveProfile(active);
        
        if (active && onProfileChange) {
          onProfileChange(active);
        }
      }
      
      // Show success message
      // Toast or notification could be added here
    } catch (err) {
      console.error('Error deleting profile:', err);
      setError('Failed to delete profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle disability selection
  const toggleDisability = (type: DisabilityType) => {
    if (selectedDisabilities.includes(type)) {
      setSelectedDisabilities(prev => prev.filter(t => t !== type));
    } else {
      setSelectedDisabilities(prev => [...prev, type]);
    }
  };

  // Get icon for each disability type
  const getDisabilityIcon = (type: DisabilityType) => {
    switch (type) {
      case 'visual':
        return (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
        );
      case 'hearing':
        return (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 20c-.29 0-.56-.06-.76-.15-.71-.37-1.21-.88-1.71-2.38-.51-1.56-1.47-2.29-2.39-3-.79-.61-1.61-1.24-2.32-2.53C9.29 10.98 9 9.93 9 9c0-2.8 2.2-5 5-5s5 2.2 5 5h2c0-3.93-3.07-7-7-7S7 5.07 7 9c0 1.26.38 2.65 1.07 3.9.91 1.65 1.98 2.48 2.85 3.15.81.62 1.39 1.07 1.71 2.05.6 1.82 1.37 2.84 2.73 3.55.51.23 1.07.35 1.64.35 2.21 0 4-1.79 4-4h-2c0 1.1-.9 2-2 2z"/>
          </svg>
        );
      case 'motor':
        return (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6h-4V2h-6v4H5v15h14V6zm-8-2h2v2h-2V4zm-2 4h6v2H9V8zm8 10H7v-6h10v6z"/>
          </svg>
        );
      case 'cognitive':
        return (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.5 10H2v6c0 1.1.9 2 2 2h6v-2.5H4.5V10zm9-6h-6v2.5h6V9H16V4c0-1.1-.9-2-2-2zm6 13.5V10h-2.5v6H10v2c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2z"/>
          </svg>
        );
      case 'speech':
        return (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm-1.2-9.1c0-.66.54-1.2 1.2-1.2s1.2.54 1.2 1.2l-.01 6.2c0 .66-.53 1.2-1.19 1.2s-1.2-.54-1.2-1.2V5.9zm6.5 6.1c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.41 2.72 6.23 6 6.72V22h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
          </svg>
        );
      case 'temporary':
        return (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  // Get color from profile or generate based on name
  const getProfileColor = (profile: UserAccessibilityProfile) => {
    if (profile.color) return profile.color;
    
    // Generate a color based on profile name
    let hash = 0;
    for (let i = 0; i < profile.name.length; i++) {
      hash = profile.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  if (error) {
    return <div className="text-red-600 px-4 py-2">{error}</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-medium text-gray-800">Accessibility Profiles</h2>
        <button
          onClick={() => setShowProfileDrawer(!showProfileDrawer)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium focus:outline-none"
        >
          {showProfileDrawer ? 'Hide Profiles' : 'Show Profiles'}
        </button>
      </div>
      
      {/* Current profile display - always visible */}
      <div className="p-4 flex items-center space-x-3">
        <div 
          className="h-10 w-10 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: activeProfile ? getProfileColor(activeProfile) : '#718096' }}
        >
          {activeProfile ? activeProfile.name.charAt(0).toUpperCase() : 'D'}
        </div>
        <div>
          <p className="font-medium text-gray-800">{activeProfile ? activeProfile.name : 'Default'}</p>
          <p className="text-sm text-gray-500">
            {activeProfile ? 
              `For ${activeProfile.disabilityTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')} needs` : 
              'No profile selected'
            }
          </p>
        </div>
      </div>

      {/* Profile drawer - expandable */}
      {showProfileDrawer && (
        <div className="border-t">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading profiles...</div>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto">
                {profiles.map(profile => (
                  <div 
                    key={profile.id}
                    className={`flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer
                      ${activeProfile && activeProfile.id === profile.id ? 'bg-blue-50' : ''}`}
                    onClick={() => handleProfileSwitch(profile.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: getProfileColor(profile) }}
                      >
                        {profile.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {profile.name}
                          {profile.isDefault && 
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Default</span>
                          }
                        </p>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          {profile.disabilityTypes.map(type => (
                            <div key={type} className="flex items-center" title={type.charAt(0).toUpperCase() + type.slice(1)}>
                              {getDisabilityIcon(type)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex space-x-1">
                      {!(profile.isDefault || (activeProfile && activeProfile.id === profile.id)) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProfile(profile.id);
                          }}
                          className="text-gray-400 hover:text-red-600 p-1"
                          title="Delete profile"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Create profile form */}
              {isCreatingProfile ? (
                <div className="p-4 border-t">
                  <h3 className="text-sm font-medium text-gray-800 mb-2">Create New Profile</h3>
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="Profile Name"
                    className="w-full p-2 border rounded mb-3"
                  />
                  
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">Select Disabilities:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['visual', 'hearing', 'motor', 'cognitive', 'speech', 'temporary'] as DisabilityType[]).map(type => (
                        <div key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`disability-${type}`}
                            checked={selectedDisabilities.includes(type)}
                            onChange={() => toggleDisability(type)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`disability-${type}`} className="ml-2 text-xs text-gray-700 capitalize">
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setIsCreatingProfile(false)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateProfile}
                      disabled={!newProfileName.trim() || selectedDisabilities.length === 0}
                      className={`px-3 py-1 text-sm text-white rounded
                        ${newProfileName.trim() && selectedDisabilities.length > 0
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-gray-400 cursor-not-allowed'
                        }`}
                    >
                      Create Profile
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 border-t">
                  <button
                    onClick={() => setIsCreatingProfile(true)}
                    className="w-full py-2 text-sm flex items-center justify-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create New Profile
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileSwitcher;