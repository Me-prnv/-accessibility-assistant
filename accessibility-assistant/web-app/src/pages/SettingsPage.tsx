import React, { useState, useEffect } from 'react';
import { getCurrentUserId } from '../services/userService';
import AccessibilitySettingsForm from '../components/settings/AccessibilitySettingsForm';
import { AccessibilitySettings } from '../database/schema';

const SettingsPage: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'accessibility' | 'account' | 'notifications' | 'privacy'>('accessibility');

  useEffect(() => {
    const loadUserId = async () => {
      try {
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

  const handleSettingsSaved = (settings: AccessibilitySettings) => {
    // This could be used to update global state, show notifications, etc.
    console.log('Settings saved:', settings);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg text-gray-600">Loading settings...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your application settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Settings Navigation */}
          <div className="md:col-span-1">
            <nav className="bg-white shadow rounded-lg overflow-hidden">
              <ul>
                <li>
                  <button
                    onClick={() => setActiveTab('accessibility')}
                    className={`w-full text-left px-4 py-3 border-l-4 flex items-center ${
                      activeTab === 'accessibility'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-transparent hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Accessibility
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('account')}
                    className={`w-full text-left px-4 py-3 border-l-4 flex items-center ${
                      activeTab === 'account'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-transparent hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Account
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full text-left px-4 py-3 border-l-4 flex items-center ${
                      activeTab === 'notifications'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-transparent hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M13.73 21C13.5542 21.3031 13.3018 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Notifications
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('privacy')}
                    className={`w-full text-left px-4 py-3 border-l-4 flex items-center ${
                      activeTab === 'privacy'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-transparent hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Privacy & Security
                  </button>
                </li>
              </ul>
            </nav>

            <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Need help?</h3>
              <p className="text-sm text-blue-700">
                Our support team is available to help you with any questions about your settings.
              </p>
              <a href="/help" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800 font-medium">
                Contact Support →
              </a>
            </div>
          </div>

          {/* Settings Content Area */}
          <div className="md:col-span-3">
            {activeTab === 'accessibility' && (
              <div>
                <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Accessibility Settings</h2>
                  <p className="text-gray-600 mb-4">
                    Customize how the application looks and works to better suit your needs. These settings
                    help improve your experience based on your specific requirements.
                  </p>
                </div>
                <AccessibilitySettingsForm userId={userId} onSave={handleSettingsSaved} />
              </div>
            )}

            {activeTab === 'account' && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Settings</h2>
                <p className="text-gray-600">
                  This section is under development. Here you will be able to manage your account 
                  information, change your password, and update your profile details.
                </p>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Notification Settings</h2>
                <p className="text-gray-600">
                  This section is under development. Here you will be able to customize what notifications
                  you receive and how they are delivered to you.
                </p>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Privacy & Security</h2>
                <p className="text-gray-600">
                  This section is under development. Here you will be able to manage your privacy settings,
                  review account security, and control data sharing preferences.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 