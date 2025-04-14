import React, { useState, useEffect } from 'react';
import { getCurrentUserProfile } from '../services/userService';
import { getAccessibilitySettings } from '../services/settingsService';
import { UserProfile, UsageStatistics } from '../database/schema';

// Placeholder service - would be implemented with real API calls
const getUserStats = async (userId: string): Promise<UsageStatistics> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 700));
  
  return {
    userId,
    activeSessionsCount: 5,
    totalSessionsCount: 28,
    totalUsageTimeMinutes: 346,
    lastActiveDate: new Date().toISOString(),
    featureUsageCount: {
      screenReader: 12,
      voiceCommands: 35,
      keyboardNavigation: 78,
      visualAdjustments: 16,
      automaticCaptions: 5
    },
    weeklyActivitySummary: [
      { date: '2023-06-01', minutes: 45 },
      { date: '2023-06-02', minutes: 32 },
      { date: '2023-06-03', minutes: 0 },
      { date: '2023-06-04', minutes: 12 },
      { date: '2023-06-05', minutes: 65 },
      { date: '2023-06-06', minutes: 28 },
      { date: '2023-06-07', minutes: 15 }
    ]
  };
};

// Placeholder for site recommendations based on user settings
const getSiteRecommendations = async (userId: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: 'rec1',
      title: 'News site accessibility',
      description: 'Based on your visual settings, we recommend enabling high contrast mode on news sites',
      siteType: 'news',
      priority: 'high'
    },
    {
      id: 'rec2',
      title: 'E-commerce navigation',
      description: 'Try voice commands for easier navigation on shopping sites',
      siteType: 'shopping',
      priority: 'medium'
    },
    {
      id: 'rec3',
      title: 'Video content',
      description: 'Enable automatic captions for better comprehension of video content',
      siteType: 'video',
      priority: 'high'
    }
  ];
};

const Dashboard: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState<UsageStatistics | null>(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Get user profile
        const userProfile = await getCurrentUserProfile();
        setProfile(userProfile);
        
        // Get settings and stats in parallel
        const [userSettings, userStats, siteRecs] = await Promise.all([
          getAccessibilitySettings(userProfile.id),
          getUserStats(userProfile.id),
          getSiteRecommendations(userProfile.id)
        ]);
        
        setSettings(userSettings);
        setStats(userStats);
        setRecommendations(siteRecs);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (!profile || !stats) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <p className="text-lg text-red-600">Could not load dashboard data</p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center">
            {profile.profilePicture ? (
              <img 
                src={profile.profilePicture} 
                alt={profile.name} 
                className="h-16 w-16 rounded-full mr-4 object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <span className="text-blue-800 text-xl font-medium">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {profile.name.split(' ')[0]}!</h1>
              <p className="text-gray-600">
                Last login: {new Date(profile.lastLoginAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Usage Statistics */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Usage Statistics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800">Total Sessions</h3>
                  <p className="mt-2 text-2xl font-bold text-blue-600">{stats.totalSessionsCount}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-800">Total Usage</h3>
                  <p className="mt-2 text-2xl font-bold text-green-600">
                    {Math.floor(stats.totalUsageTimeMinutes / 60)}h {stats.totalUsageTimeMinutes % 60}m
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-800">Voice Commands</h3>
                  <p className="mt-2 text-2xl font-bold text-purple-600">{stats.featureUsageCount.voiceCommands}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-amber-800">Active Today</h3>
                  <p className="mt-2 text-2xl font-bold text-amber-600">{stats.activeSessionsCount}</p>
                </div>
              </div>
              
              <h3 className="text-md font-medium text-gray-700 mt-6 mb-3">
                Weekly Activity
              </h3>
              <div className="h-32 flex items-end space-x-2">
                {stats.weeklyActivitySummary.map((day) => {
                  const height = day.minutes > 0 
                    ? Math.max(20, (day.minutes / 70) * 100) 
                    : 4;
                  return (
                    <div key={day.date} className="flex flex-col items-center flex-1">
                      <div 
                        className={`w-full rounded-t-sm ${day.minutes > 0 ? 'bg-blue-500' : 'bg-gray-200'}`}
                        style={{ height: `${height}%` }}
                      ></div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' }).charAt(0)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Feature Usage */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Feature Usage
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Screen Reader</span>
                    <span className="text-sm text-gray-500">{stats.featureUsageCount.screenReader} uses</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(stats.featureUsageCount.screenReader / 100) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Voice Commands</span>
                    <span className="text-sm text-gray-500">{stats.featureUsageCount.voiceCommands} uses</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(stats.featureUsageCount.voiceCommands / 100) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Keyboard Navigation</span>
                    <span className="text-sm text-gray-500">{stats.featureUsageCount.keyboardNavigation} uses</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${(stats.featureUsageCount.keyboardNavigation / 100) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Visual Adjustments</span>
                    <span className="text-sm text-gray-500">{stats.featureUsageCount.visualAdjustments} uses</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${(stats.featureUsageCount.visualAdjustments / 100) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Automatic Captions</span>
                    <span className="text-sm text-gray-500">{stats.featureUsageCount.automaticCaptions} uses</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: `${(stats.featureUsageCount.automaticCaptions / 100) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <a href="/settings" className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                  <svg className="h-6 w-6 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  <span className="text-blue-800">Adjust Settings</span>
                </a>
                <a href="/profile" className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition">
                  <svg className="h-6 w-6 text-green-600 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span className="text-green-800">Update Profile</span>
                </a>
                <a href="/help" className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition">
                  <svg className="h-6 w-6 text-purple-600 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <span className="text-purple-800">Get Help</span>
                </a>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recommendations
              </h2>
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <h3 className="font-medium text-gray-900">{rec.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${rec.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {rec.priority === 'high' ? 'High Priority' : 'Suggested'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Resources */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Helpful Resources
              </h2>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="flex items-center text-blue-600 hover:text-blue-800">
                    <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    Voice Command Guide
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center text-blue-600 hover:text-blue-800">
                    <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    Accessibility Tips
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center text-blue-600 hover:text-blue-800">
                    <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    Keyboard Shortcuts
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 