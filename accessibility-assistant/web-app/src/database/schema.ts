// Database Schema for Accessibility Assistant
// Defines types and interfaces for the database schema

// User profile schema
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  lastLoginAt: Date;
  disabilityTypes: DisabilityType[];
  preferredLanguage: string;
  isOnboarded: boolean;
  authProvider: 'email' | 'google' | 'apple' | 'microsoft';
  profilePicture?: string;
  activeAccessibilityProfileId?: string; // Added to track the active accessibility profile
}

// User accessibility profile schema for multiple profiles per user
export interface UserAccessibilityProfile {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
  disabilityTypes: DisabilityType[];
  iconName?: string;
  color?: string;
  settings: AccessibilitySettings;
}

// Disability types supported
export type DisabilityType = 
  | 'visual' 
  | 'hearing' 
  | 'motor' 
  | 'cognitive' 
  | 'speech' 
  | 'temporary';

// User accessibility settings schema
export interface AccessibilitySettings {
  userId: string;
  updatedAt: Date;
  
  // Visual settings
  visual: {
    highContrast: boolean;
    colorBlindMode: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia' | 'none';
    fontFamily: string;
    fontSize: number;
    lineSpacing: number;
    characterSpacing: number;
    zoomLevel: number;
    imageDescriptions: boolean;
  };
  
  // Hearing settings
  hearing: {
    captionsEnabled: boolean;
    soundNotifications: boolean;
    signLanguageEnabled: boolean;
    captionsSize: number;
    captionsPosition: 'top' | 'bottom';
    captionsColor: string;
    captionsBackgroundColor: string;
  };
  
  // Motor settings
  motor: {
    dwellClickingEnabled: boolean;
    dwellTime: number;
    mouseTrackingEnabled: boolean;
    keyboardNavigationEnabled: boolean;
    showClickableElements: boolean;
    autoFillForms: boolean;
    gesturesEnabled: boolean;
    switchControlEnabled: boolean;
  };
  
  // Cognitive settings
  cognitive: {
    focusModeEnabled: boolean;
    readingGuideEnabled: boolean;
    simplifiedPageEnabled: boolean;
    readingAidsEnabled: boolean;
    highlightLinksEnabled: boolean;
    textToSpeechEnabled: boolean;
    vocabularySimplificationEnabled: boolean;
    readingSpeed: number;
  };
  
  // Speech settings
  speech: {
    textToSpeechCommunicator: boolean;
    voiceInputAlternative: boolean;
    voiceAvatarEnabled: boolean;
    customVoiceEnabled: boolean;
    customVoiceId?: string;
  };
  
  // General settings
  general: {
    extensionEnabled: boolean;
    notificationsEnabled: boolean;
    syncAcrossDevices: boolean;
    privacyMode: 'standard' | 'enhanced' | 'maximum';
    theme: 'light' | 'dark' | 'system';
    shortcutsEnabled: boolean;
  };
}

// User device schema
export interface UserDevice {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  lastUsedAt: Date;
  extensionInstalled: boolean;
  extensionVersion?: string;
  isSyncing: boolean;
}

// Usage statistics schema
export interface UsageStatistics {
  id: string;
  userId: string;
  date: Date;
  
  // Feature usage metrics
  featureUsage: {
    screenReader: number;
    voiceControl: number;
    dwellClicking: number;
    highContrast: number;
    textToSpeech: number;
    focusMode: number;
    readingGuide: number;
    simplifiedPage: number;
    keyboardNavigation: number;
    captioning: number;
    // Add other features as needed
  };
  
  // Session metrics
  sessionCount: number;
  totalTimeSpent: number; // in minutes
  websitesVisited: number;
  
  // Performance metrics
  performanceMetrics?: {
    averageResponseTime: number;
    errorCount: number;
    modelProcessingTime: number;
  };
}

// Website preferences schema (site-specific settings)
export interface WebsitePreferences {
  id: string;
  userId: string;
  domain: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Site-specific settings that override global settings
  settings: Partial<AccessibilitySettings>;
  
  // Saved autofill data for forms
  autofillData?: {
    [fieldName: string]: string;
  };
  
  // Custom commands or macros for specific sites
  customCommands?: {
    name: string;
    command: string;
    description: string;
  }[];
}

// Custom voice model schema
export interface CustomVoiceModel {
  id: string;
  userId: string;
  createdAt: Date;
  name: string;
  description?: string;
  modelPath: string;
  isActive: boolean;
  sampleRate: number;
  quality: 'low' | 'medium' | 'high';
  trainingStatus: 'pending' | 'training' | 'completed' | 'failed';
  trainingProgress?: number;
  error?: string;
}

// Voice command pattern schema
export interface VoiceCommandPattern {
  id: string;
  userId: string;
  pattern: string;
  command: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  useCount: number;
  params?: string[];
}

// Training and onboarding progress schema
export interface OnboardingProgress {
  userId: string;
  completedSteps: string[];
  currentStep?: string;
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  tutorials: {
    id: string;
    name: string;
    completed: boolean;
    completedAt?: Date;
  }[];
}

// Feedback and support schema
export interface UserFeedback {
  id: string;
  userId: string;
  type: 'bug' | 'feature' | 'general';
  content: string;
  createdAt: Date;
  isResolved: boolean;
  resolvedAt?: Date;
  adminResponse?: string;
  rating?: number;
  tags: string[];
  attachments?: {
    id: string;
    url: string;
    type: string;
  }[];
}

// AI training data schema (for improving the models)
export interface AITrainingData {
  id: string;
  userId: string;
  type: 'voice' | 'image' | 'interaction';
  data: string; // Could be a path to a file or a JSON string
  createdAt: Date;
  isAnnotated: boolean;
  annotations?: {
    [key: string]: any;
  };
  isApproved: boolean;
  quality: 'low' | 'medium' | 'high';
  isUsedForTraining: boolean;
}

// ML Model versions and config schema
export interface MLModel {
  id: string;
  name: string;
  type: 'voice' | 'image' | 'text' | 'combined';
  version: string;
  createdAt: Date;
  path: string;
  size: number;
  configParams: {
    [key: string]: any;
  };
  accuracy: number;
  isActive: boolean;
  minClientVersion: string;
  releaseNotes?: string;
}

// Database schema version for migration management
export interface SchemaVersion {
  version: number;
  appliedAt: Date;
  description: string;
}

// Export the entire database schema
export interface DatabaseSchema {
  users: UserProfile[]; 
  accessibilityProfiles: UserAccessibilityProfile[]; // Added to include accessibility profiles
  settings: AccessibilitySettings[];
  devices: UserDevice[];
  usage: UsageStatistics[];
  websitePreferences: WebsitePreferences[];
  voiceModels: CustomVoiceModel[];
  commandPatterns: VoiceCommandPattern[];
  onboardingProgress: OnboardingProgress[];
  feedback: UserFeedback[];
  trainingData: AITrainingData[];
  mlModels: MLModel[];
  schemaVersion: SchemaVersion[];
}