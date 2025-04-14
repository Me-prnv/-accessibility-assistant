import React, { useState, useEffect } from 'react';
import { 
  UserProfile as UserProfileType, 
  DisabilityType 
} from '../../database/schema';

// Placeholder for the actual API service
import { getUserProfile, updateUserProfile } from '../../services/userService';

interface UserProfileProps {
  userId: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<UserProfileType>>({});

  // Disability type labels for display
  const disabilityLabels: Record<DisabilityType, string> = {
    visual: 'Visual Impairment',
    hearing: 'Hearing Impairment',
    motor: 'Motor Impairment',
    cognitive: 'Cognitive Impairment',
    speech: 'Speech Impairment',
    temporary: 'Temporary Disability'
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const data = await getUserProfile(userId);
        setProfile(data);
        setFormData(data);
      } catch (err) {
        setError('Failed to load profile data. Please try again later.');
        console.error('Error fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle disability checkbox changes
  const handleDisabilityChange = (type: DisabilityType) => {
    setFormData(prev => {
      const currentDisabilities = prev.disabilityTypes || [];
      if (currentDisabilities.includes(type)) {
        return {
          ...prev,
          disabilityTypes: currentDisabilities.filter(t => t !== type)
        };
      } else {
        return {
          ...prev,
          disabilityTypes: [...currentDisabilities, type]
        };
      }
    });
  };

  // Handle profile update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserProfile(userId, formData);
      setProfile(prev => ({ ...prev, ...formData } as UserProfileType));
      setIsEditing(false);
      // Show success notification
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Error updating profile:', err);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8">Loading profile information...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!profile) return <div className="text-red-500 p-4">Profile not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Profile</h1>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Edit Profile
          </button>
        ) : (
          <div className="space-x-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setFormData(profile);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Language
              </label>
              <select
                id="preferredLanguage"
                name="preferredLanguage"
                value={formData.preferredLanguage || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
                <option value="ar">Arabic</option>
                <option value="ru">Russian</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Disability Types
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(disabilityLabels).map(([type, label]) => (
                <div key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`disability-${type}`}
                    checked={(formData.disabilityTypes || []).includes(type as DisabilityType)}
                    onChange={() => handleDisabilityChange(type as DisabilityType)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`disability-${type}`} className="ml-2 text-sm text-gray-700">
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm text-blue-800">
              Selecting disability types helps us customize the assistant to better meet your needs.
              Your selection is private and used only to enhance your experience.
            </p>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            {profile.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt={`${profile.name}'s profile`}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{profile.name}</h2>
              <p className="text-gray-600">{profile.email}</p>
              <p className="text-sm text-gray-500">
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Account Information</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-sm font-medium text-gray-500">Language:</p>
                  <p className="text-sm text-gray-800">{profile.preferredLanguage}</p>
                  
                  <p className="text-sm font-medium text-gray-500">Auth Method:</p>
                  <p className="text-sm text-gray-800 capitalize">{profile.authProvider}</p>
                  
                  <p className="text-sm font-medium text-gray-500">Last Login:</p>
                  <p className="text-sm text-gray-800">
                    {new Date(profile.lastLoginAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Disability Preferences</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                {profile.disabilityTypes && profile.disabilityTypes.length > 0 ? (
                  <ul className="space-y-1">
                    {profile.disabilityTypes.map(type => (
                      <li key={type} className="text-sm text-gray-800">
                        • {disabilityLabels[type]}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">No disability preferences set</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile; 