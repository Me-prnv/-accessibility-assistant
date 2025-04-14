import React, { useState, useEffect } from 'react';
import UserProfile from '../components/profile/UserProfile';
import { getCurrentUserId } from '../services/userService';

const ProfilePage: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        // In a real application, this might come from an auth context
        // or a more complex authentication flow
        const id = getCurrentUserId();
        setUserId(id);
      } catch (error) {
        console.error('Error getting current user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserId();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg text-gray-600">Loading user information...</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <p className="text-lg text-red-600">User not found or not authenticated</p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          onClick={() => window.location.href = '/login'} // Navigate to login in a real app
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        <UserProfile userId={userId} />
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Need help with your profile? <a href="/help" className="text-blue-600 hover:underline">Contact support</a></p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 