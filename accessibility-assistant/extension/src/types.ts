// Types for Accessibility Assistant Extension

// Common types
export type DisabilityType = 
  | 'visual' 
  | 'hearing' 
  | 'motor' 
  | 'cognitive' 
  | 'speech'
  | 'temporary';

// Message types for communication between content scripts and background
export type MessageType = 
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'TOGGLE_FEATURE'
  | 'DESCRIBE_IMAGE'
  | 'SUMMARIZE_PAGE'
  | 'PROCESS_VOICE_COMMAND'
  | 'START_SPEECH_RECOGNITION'
  | 'STOP_SPEECH_RECOGNITION'
  | 'SPEAK_TEXT'
  | 'SCAN_PAGE_ELEMENTS'
  | 'HIGHLIGHT_CLICKABLES'
  | 'SIMPLIFY_PAGE'
  | 'ENABLE_FOCUS_MODE'
  | 'ENABLE_DWELL_CLICKING'
  | 'START_SCREEN_READER'
  | 'STOP_SCREEN_READER';

// Interface for message passing
export interface Message {
  type: MessageType;
  payload?: any;
}

// Extension Settings
export interface ExtensionSettings {
  activeDisabilityTypes: DisabilityType[];
  visual: VisualSettings;
  hearing: HearingSettings;
  motor: MotorSettings;
  cognitive: CognitiveSettings;
  speech: SpeechSettings;
  general: GeneralSettings;
}

// Visual Settings
export interface VisualSettings {
  enabled: boolean;
  highContrast: boolean;
  colorBlindMode: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia' | 'none';
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  characterSpacing: number;
  zoomLevel: number;
  imageDescriptions: boolean;
  screenReaderEnabled: boolean;
  readingGuideEnabled: boolean;
}

// Hearing Settings
export interface HearingSettings {
  enabled: boolean;
  captionsEnabled: boolean;
  soundNotifications: boolean;
  signLanguageEnabled: boolean;
  captionsSize: number;
  captionsPosition: 'top' | 'bottom';
  captionsColor: string;
  captionsBackgroundColor: string;
}

// Motor Settings
export interface MotorSettings {
  enabled: boolean;
  dwellClickingEnabled: boolean;
  dwellTime: number;
  mouseTrackingEnabled: boolean;
  keyboardNavigationEnabled: boolean;
  showClickableElements: boolean;
  autoFillForms: boolean;
  gesturesEnabled: boolean;
  switchControlEnabled: boolean;
  voiceControlEnabled: boolean;
}

// Cognitive Settings
export interface CognitiveSettings {
  enabled: boolean;
  focusModeEnabled: boolean;
  readingGuideEnabled: boolean;
  simplifiedPageEnabled: boolean;
  readingAidsEnabled: boolean;
  highlightLinksEnabled: boolean;
  textToSpeechEnabled: boolean;
  vocabularySimplificationEnabled: boolean;
  readingSpeed: number;
  distractionFreeMode: boolean;
}

// Speech Settings
export interface SpeechSettings {
  enabled: boolean;
  textToSpeechCommunicator: boolean;
  voiceInputAlternative: boolean;
  voiceAvatarEnabled: boolean;
  customVoiceEnabled: boolean;
  customVoiceId?: string;
  speakRate: number;
  speakPitch: number;
  voiceCommandsEnabled: boolean;
}

// General Settings
export interface GeneralSettings {
  extensionEnabled: boolean;
  notificationsEnabled: boolean;
  syncAcrossDevices: boolean;
  privacyMode: 'standard' | 'enhanced' | 'maximum';
  theme: 'light' | 'dark' | 'system';
  shortcutsEnabled: boolean;
  sidebarPosition: 'left' | 'right';
}

// Voice Command
export interface VoiceCommand {
  pattern: string | RegExp;
  description: string;
  action: (matches?: string[]) => void;
}

// Element for navigation
export interface NavigableElement {
  element: HTMLElement;
  role: string;
  label: string;
  rect: DOMRect;
  tabIndex: number;
  isClickable: boolean;
}

// Page Element for accessibility enhancement
export interface PageElement {
  element: HTMLElement;
  type: 'link' | 'button' | 'input' | 'heading' | 'image' | 'text' | 'other';
  rect: DOMRect;
  text: string;
  ariaLabel?: string;
  role?: string;
  isInteractive: boolean;
}

// Page Summary
export interface PageSummary {
  title: string;
  mainHeadings: string[];
  keyPoints: string[];
  links: { text: string; url: string }[];
  images: { alt: string; src: string }[];
  readingTime: number; // in minutes
  complexity: 'simple' | 'moderate' | 'complex';
  mainContent: string;
}

// Screen Reader Element
export interface ScreenReaderElement {
  element: HTMLElement;
  text: string;
  role: string;
  level?: number; // For headings
  state?: string; // For checkboxes, buttons, etc.
}

// Image Description
export interface ImageDescription {
  src: string;
  alt: string;
  generatedDescription: string;
  confidence: number;
}

// Form Field
export interface FormField {
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  type: string;
  name: string;
  id: string;
  label: string;
  value: string;
  required: boolean;
}

// Feature Detection Result
export interface FeatureDetectionResult {
  supportsWebSpeech: boolean;
  supportsScreenOrientation: boolean;
  supportsTouchEvents: boolean;
  supportsPointerEvents: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  hasCamera: boolean;
  hasMicrophone: boolean;
  browserName: string;
  osName: string;
}