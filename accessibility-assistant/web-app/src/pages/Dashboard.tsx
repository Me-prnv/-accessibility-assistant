import React, { useState, useEffect } from 'react';
import { getCurrentUserProfile, getActiveAccessibilityProfile } from '../services/userService';
import { getCurrentUserSettings } from '../services/settingsService';
import { getUserStatisticsSummary, getFeatureRecommendations, syncStatsFromExtension } from '../services/statisticsService';
import { UserProfile, UserAccessibilityProfile } from '../database/schema';
import ProfileSwitcher from '../components/profile/ProfileSwitcher';
import { useAuth } from '../contexts/AuthContext';

// Helper function for formatting time
const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// Helper function to format feature names for display
const formatFeatureName = (name: string): string => {
  return name
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState(null);
  const [usageSummary, setUsageSummary] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAccessibilityProfile, setActiveAccessibilityProfile] = useState<UserAccessibilityProfile | null>(null);
  const [syncingStats, setSyncingStats] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Get user profile
        const userProfile = await getCurrentUserProfile();
        setProfile(userProfile);
        
        if (!userProfile) {
          setIsLoading(false);
          return;
        }
        
        // Get active accessibility profile
        const activeProfile = await getActiveAccessibilityProfile(userProfile.id);
        setActiveAccessibilityProfile(activeProfile);
        
        // Get settings and stats in parallel
        const [userSettings, statsSummary, featureRecs] = await Promise.all([
          getCurrentUserSettings(),
          getUserStatisticsSummary(userProfile.id),
          getFeatureRecommendations(userProfile.id)
        ]);
        
        setSettings(userSettings);
        setUsageSummary(statsSummary);
        setRecommendations(featureRecs);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Handle profile change
  const handleProfileChange = (profile: UserAccessibilityProfile) => {
    setActiveAccessibilityProfile(profile);
    // In a real application, we would apply the settings from this profile
    console.log(`Applying settings from profile: ${profile.name}`);
  };
  
  // Handle syncing stats from extension
  const handleSyncStats = async () => {
    setSyncingStats(true);
    try {
      await syncStatsFromExtension();
      
      // Reload usage summary
      if (profile) {
        const statsSummary = await getUserStatisticsSummary(profile.id);
        setUsageSummary(statsSummary);
      }
    } catch (error) {
      console.error('Error syncing stats:', error);
    } finally {
      setSyncingStats(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile || !usageSummary) {
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

  // Calculate feature usage percentages for display
  const featureUsageData = usageSummary.featuresUsed || [];
  
  // Create weekly activity data
  const today = new Date();
  const weeklyActivity = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // For this example, we'll just generate random data
    // In a real app, this would come from the usage stats
    const randomMinutes = Math.floor(Math.random() * 70);
    
    weeklyActivity.push({
      date: date.toISOString().split('T')[0],
      minutes: randomMinutes,
      day: date.toLocaleDateString(undefined, { weekday: 'short' }).charAt(0)
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
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
            <button
              onClick={handleSyncStats}
              disabled={syncingStats}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 flex items-center"
            >
              {syncingStats ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Sync with Extension
                </>
              )}
            </button>
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
                  <p className="mt-2 text-2xl font-bold text-blue-600">{usageSummary.totalSessions}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-800">Total Usage</h3>
                  <p className="mt-2 text-2xl font-bold text-green-600">
                    {formatTime(usageSummary.totalTimeSpent)}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-800">Top Feature</h3>
                  <p className="mt-2 text-xl font-bold text-purple-600">
                    {formatFeatureName(usageSummary.mostUsedFeature)}
                  </p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-amber-800">Websites Visited</h3>
                  <p className="mt-2 text-2xl font-bold text-amber-600">{usageSummary.websitesVisited}</p>
                </div>
              </div>
              
              <h3 className="text-md font-medium text-gray-700 mt-6 mb-3">
                Weekly Activity
              </h3>
              <div className="h-32 flex items-end space-x-2">
                {weeklyActivity.map((day) => {
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
                        {day.day}
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
              {featureUsageData.length === 0 ? (
                <div className="py-4 text-center text-gray-500">
                  <p>No feature usage data available yet.</p>
                  <p className="text-sm mt-1">Use the extension to start tracking.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {featureUsageData.slice(0, 5).map((feature) => (
                    <div key={feature.featureName}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{formatFeatureName(feature.featureName)}</span>
                        <span className="text-sm text-gray-500">{feature.count} uses</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, feature.percentage)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-md font-medium text-gray-700 mb-2">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Average Response Time</p>
                    <p className="text-lg font-semibold">{usageSummary.averageResponseTime.toFixed(2)}s</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Error Rate</p>
                    <p className="text-lg font-semibold">{(usageSummary.errorRate * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Switcher Component */}
            <ProfileSwitcher onProfileChange={handleProfileChange} />
            
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

            {/* Feature Recommendations */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recommended Features
              </h2>
              {recommendations.length === 0 ? (
                <div className="py-4 text-center text-gray-500">
                  <p>No personalized recommendations yet.</p>
                  <p className="text-sm mt-1">Continue using the assistant to get suggestions.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((feature, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <h3 className="font-medium text-gray-900">{formatFeatureName(feature)}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        This feature may improve your accessibility experience.
                      </p>
                      <div className="mt-2">
                        <button 
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none"
                        >
                          Try it now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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