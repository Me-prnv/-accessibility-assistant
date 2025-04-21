import { v4 as uuidv4 } from 'uuid';
import { UsageStatistics, FeatureUsage } from '../database/schema';
import * as dbService from './databaseService';

/**
 * Record feature usage for a user
 * @param userId User ID
 * @param featureName Name of the feature used
 * @param duration Duration of usage in seconds (optional)
 * @returns Promise resolving to the updated statistics
 */
export const recordFeatureUsage = async (
  userId: string,
  featureName: string,
  duration?: number
): Promise<UsageStatistics> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Try to find existing stats for today
  const existingStats = await getTodayStats(userId);
  
  if (existingStats) {
    // Update existing stats
    const featureIndex = existingStats.features.findIndex(f => f.name === featureName);
    
    if (featureIndex >= 0) {
      // Update existing feature
      existingStats.features[featureIndex].count += 1;
      existingStats.features[featureIndex].lastUsed = new Date();
      if (duration) {
        existingStats.features[featureIndex].totalDuration += duration;
      }
    } else {
      // Add new feature
      const newFeature: FeatureUsage = {
        name: featureName,
        count: 1,
        firstUsed: new Date(),
        lastUsed: new Date(),
        totalDuration: duration || 0
      };
      existingStats.features.push(newFeature);
    }
    
    existingStats.totalUsage += 1;
    existingStats.updatedAt = new Date();
    
    return dbService.saveUserStats(existingStats);
  } else {
    // Create new stats for today
    const newStats: UsageStatistics = {
      id: `stat-${uuidv4()}`,
      userId,
      date: today,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalUsage: 1,
      features: [
        {
          name: featureName,
          count: 1,
          firstUsed: new Date(),
          lastUsed: new Date(),
          totalDuration: duration || 0
        }
      ]
    };
    
    return dbService.saveUserStats(newStats);
  }
};

/**
 * Get today's statistics for a user
 * @param userId User ID
 * @returns Promise resolving to today's statistics or null if not found
 */
export const getTodayStats = async (userId: string): Promise<UsageStatistics | null> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const stats = await dbService.getUserStatsForDateRange(userId, today, tomorrow);
  return stats.length > 0 ? stats[0] : null;
};

/**
 * Get statistics for a specific date
 * @param userId User ID
 * @param date Date to get statistics for
 * @returns Promise resolving to statistics for the specified date or null if not found
 */
export const getStatsForDate = async (
  userId: string,
  date: Date
): Promise<UsageStatistics | null> => {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);
  
  const stats = await dbService.getUserStatsForDateRange(userId, startDate, endDate);
  return stats.length > 0 ? stats[0] : null;
};

/**
 * Get statistics for the last n days
 * @param userId User ID
 * @param days Number of days to get statistics for
 * @returns Promise resolving to array of statistics
 */
export const getStatsForLastDays = async (
  userId: string,
  days: number
): Promise<UsageStatistics[]> => {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  
  return dbService.getUserStatsForDateRange(userId, startDate, endDate);
};

/**
 * Get statistics for a date range
 * @param userId User ID
 * @param startDate Range start date
 * @param endDate Range end date
 * @returns Promise resolving to array of statistics
 */
export const getStatsForDateRange = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<UsageStatistics[]> => {
  return dbService.getUserStatsForDateRange(userId, startDate, endDate);
};

/**
 * Get the most used features for a user
 * @param userId User ID
 * @param limit Maximum number of features to return
 * @param days Number of days to analyze (default: 30)
 * @returns Promise resolving to array of feature usage data
 */
export const getMostUsedFeatures = async (
  userId: string,
  limit: number = 5,
  days: number = 30
): Promise<{name: string, count: number}[]> => {
  const stats = await getStatsForLastDays(userId, days);
  
  // Aggregate feature usage
  const featureMap: Map<string, number> = new Map();
  
  stats.forEach(stat => {
    stat.features.forEach(feature => {
      const currentCount = featureMap.get(feature.name) || 0;
      featureMap.set(feature.name, currentCount + feature.count);
    });
  });
  
  // Convert to array and sort
  const sortedFeatures = Array.from(featureMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  
  return sortedFeatures.slice(0, limit);
};

/**
 * Get usage trend data for a user
 * @param userId User ID
 * @param days Number of days to analyze
 * @returns Promise resolving to array of daily usage counts
 */
export const getUsageTrend = async (
  userId: string,
  days: number = 30
): Promise<{date: string, count: number}[]> => {
  const stats = await getStatsForLastDays(userId, days);
  
  // Create a map for all days in the range
  const trendMap: Map<string, number> = new Map();
  
  // Initialize with zeros for all days
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const dateString = date.toISOString().split('T')[0];
    trendMap.set(dateString, 0);
  }
  
  // Fill in actual values
  stats.forEach(stat => {
    const dateString = new Date(stat.date).toISOString().split('T')[0];
    trendMap.set(dateString, stat.totalUsage);
  });
  
  // Convert to array and sort by date
  return Array.from(trendMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Get improvement suggestions based on usage patterns
 * @param userId User ID
 * @returns Promise resolving to array of improvement suggestions
 */
export const getImprovementSuggestions = async (
  userId: string
): Promise<string[]> => {
  const stats = await getStatsForLastDays(userId, 30);
  const suggestions: string[] = [];
  
  // Get user profile to check disability types
  const user = await dbService.getUserById(userId);
  if (!user) return suggestions;
  
  const profile = user.activeAccessibilityProfileId ? 
    await dbService.getAccessibilityProfileById(user.activeAccessibilityProfileId) : null;
  
  if (!profile) return suggestions;
  
  // Check for unused features that might be helpful based on user's disability types
  const disabilityTypes = profile.disabilityTypes || [];
  const usedFeatures = new Set<string>();
  
  stats.forEach(stat => {
    stat.features.forEach(feature => {
      usedFeatures.add(feature.name);
    });
  });
  
  // Visual disability suggestions
  if (disabilityTypes.includes('visual')) {
    if (!usedFeatures.has('screenReader')) {
      suggestions.push('Try using the Screen Reader feature to have content read aloud to you');
    }
    if (!usedFeatures.has('highContrast')) {
      suggestions.push('Enable High Contrast mode to make text easier to read');
    }
    if (!usedFeatures.has('zoom')) {
      suggestions.push('Use the Zoom feature to magnify content that is difficult to see');
    }
  }
  
  // Hearing disability suggestions
  if (disabilityTypes.includes('hearing')) {
    if (!usedFeatures.has('captions')) {
      suggestions.push('Enable Captions to see text versions of spoken content');
    }
    if (!usedFeatures.has('visualAlerts')) {
      suggestions.push('Turn on Visual Alerts to see visual notifications for sounds');
    }
  }
  
  // Motor disability suggestions
  if (disabilityTypes.includes('motor')) {
    if (!usedFeatures.has('voiceControl')) {
      suggestions.push('Try Voice Control to navigate without using your hands');
    }
    if (!usedFeatures.has('dwellClicking')) {
      suggestions.push('Enable Dwell Clicking to click by hovering your cursor');
    }
  }
  
  // Cognitive disability suggestions
  if (disabilityTypes.includes('cognitive')) {
    if (!usedFeatures.has('focusMode')) {
      suggestions.push('Try Focus Mode to reduce distractions on web pages');
    }
    if (!usedFeatures.has('readingGuide')) {
      suggestions.push('Use Reading Guide to help you follow along with text');
    }
  }
  
  // If we don't have enough suggestions, add some general ones
  if (suggestions.length < 3) {
    if (!usedFeatures.has('customShortcuts')) {
      suggestions.push('Set up Custom Shortcuts for frequently used accessibility features');
    }
    if (!usedFeatures.has('profiles')) {
      suggestions.push('Create multiple Accessibility Profiles for different contexts or needs');
    }
    if (!usedFeatures.has('sync')) {
      suggestions.push('Enable Settings Sync to use your preferences across all your devices');
    }
  }
  
  return suggestions.slice(0, 5); // Return at most 5 suggestions
};