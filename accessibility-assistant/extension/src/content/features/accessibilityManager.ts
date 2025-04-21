// Accessibility Manager - Main controller for all accessibility features
// Integrates all specialized assistants and provides a unified interface

import { AccessibilitySettings, AssistantModules } from './types';
import { createVisualAssistant } from './visualAssistant';
import { createScreenReader } from './screenReader';
import { createCognitiveAssistant } from './cognitiveAssistant';
import { createMotorAssistant } from './motorAssistant';
import { createSpeechRecognition } from './speechRecognition';

// Main accessibility manager
export function createAccessibilityManager() {
  // State
  let isInitialized = false;
  let settings: AccessibilitySettings = {
    enabled: false,
    activeModules: [],
    highContrastMode: false,
    fontSize: 'medium',
    fontFamily: 'default',
    colorBlindMode: 'none',
    reduceMotion: false,
    focusIndicators: true,
    screenReader: {
      enabled: false,
      speechRate: 1,
      highlightText: true,
      voice: 'default'
    },
    cognitive: {
      enabled: false,
      simplifyPage: false,
      readingGuide: false,
      focusMode: false
    },
    motor: {
      enabled: false,
      keyboardNavigation: false,
      largeClickTargets: false,
      dwellClicking: false
    },
    speech: {
      enabled: false,
      continuousListening: true,
      languageCode: 'en-US',
      commandsEnabled: true
    }
  };
  
  // UI elements
  let controlPanel: HTMLElement | null = null;
  let statusIcon: HTMLElement | null = null;
  
  // Assistants
  let assistants: Partial<AssistantModules> = {};
  
  // Create and initialize all assistants
  function initialize() {
    if (isInitialized) return;
    
    console.log('Initializing accessibility manager...');
    
    // Load settings
    loadSettings();
    
    // Create UI components
    createStatusIcon();
    createControlPanel();
    
    // Initialize assistants (only create them, enable based on settings later)
    assistants.visual = createVisualAssistant();
    assistants.screenReader = createScreenReader();
    assistants.cognitive = createCognitiveAssistant();
    assistants.motor = createMotorAssistant();
    assistants.speech = createSpeechRecognition();
    
    // Apply initial settings to all assistants
    applySettings();
    
    // Set up message listeners for communication with the extension
    setupMessageListeners();
    
    // Set up keyboard shortcuts
    setupKeyboardShortcuts();
    
    isInitialized = true;
    console.log('Accessibility manager initialized');
    
    // If enabled, start the manager
    if (settings.enabled) {
      enableManager();
    }
  }
  
  // Load settings from storage
  function loadSettings() {
    chrome.storage.sync.get('accessibilitySettings', (data) => {
      if (data.accessibilitySettings) {
        // Merge saved settings with defaults
        settings = {
          ...settings,
          ...data.accessibilitySettings
        };
        
        // Apply loaded settings
        applySettings();
      }
    });
  }
  
  // Save settings to storage
  function saveSettings() {
    chrome.storage.sync.set({
      accessibilitySettings: settings
    });
  }
  
  // Apply current settings to all assistants
  function applySettings() {
    // Apply visual settings
    if (assistants.visual) {
      assistants.visual.updateSettings({
        highContrastMode: settings.highContrastMode,
        fontSize: settings.fontSize,
        fontFamily: settings.fontFamily,
        colorBlindMode: settings.colorBlindMode,
        reduceMotion: settings.reduceMotion,
        focusIndicators: settings.focusIndicators
      });
      
      if (settings.activeModules.includes('visual')) {
        assistants.visual.enable();
      } else {
        assistants.visual.disable();
      }
    }
    
    // Apply screen reader settings
    if (assistants.screenReader) {
      assistants.screenReader.updateSettings({
        speechRate: settings.screenReader.speechRate,
        highlightText: settings.screenReader.highlightText,
        voice: settings.screenReader.voice
      });
      
      if (settings.activeModules.includes('screenReader')) {
        assistants.screenReader.enable();
      } else {
        assistants.screenReader.disable();
      }
    }
    
    // Apply cognitive settings
    if (assistants.cognitive) {
      assistants.cognitive.updateSettings({
        simplifyPage: settings.cognitive.simplifyPage,
        readingGuide: settings.cognitive.readingGuide,
        focusMode: settings.cognitive.focusMode
      });
      
      if (settings.activeModules.includes('cognitive')) {
        assistants.cognitive.enable();
      } else {
        assistants.cognitive.disable();
      }
    }
    
    // Apply motor settings
    if (assistants.motor) {
      assistants.motor.updateSettings({
        keyboardNavigation: settings.motor.keyboardNavigation,
        largeClickTargets: settings.motor.largeClickTargets,
        dwellClicking: settings.motor.dwellClicking
      });
      
      if (settings.activeModules.includes('motor')) {
        assistants.motor.enable();
      } else {
        assistants.motor.disable();
      }
    }
    
    // Apply speech settings
    if (assistants.speech) {
      assistants.speech.updateSettings({
        enabled: settings.speech.enabled,
        continuousListening: settings.speech.continuousListening,
        languageCode: settings.speech.languageCode,
        commandsEnabled: settings.speech.commandsEnabled
      });
      
      if (settings.activeModules.includes('speech')) {
        assistants.speech.start();
      } else {
        assistants.speech.stop();
      }
    }
    
    // Update UI to reflect current settings
    updateControlPanel();
    updateStatusIcon();
  }
  
  // Create status icon
  function createStatusIcon() {
    // Check if already exists
    if (statusIcon) return;
    
    statusIcon = document.createElement('div');
    statusIcon.id = 'accessibility-status-icon';
    statusIcon.setAttribute('aria-label', 'Accessibility Assistant');
    statusIcon.setAttribute('role', 'button');
    statusIcon.setAttribute('tabindex', '0');
    statusIcon.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 45px;
      height: 45px;
      border-radius: 50%;
      background-color: #0078d4;
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
      opacity: 0.8;
      font-family: Arial, sans-serif;
      font-size: 24px;
    `;
    
    // Accessibility icon
    statusIcon.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
        <path d="M12 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 8c0-3.31 2.69-6 6-6s6 2.69 6 6h-2c0-2.21-1.79-4-4-4s-4 1.79-4 4H6z"/>
      </svg>
    `;
    
    document.body.appendChild(statusIcon);
    
    // Add event listeners
    statusIcon.addEventListener('click', toggleControlPanel);
    statusIcon.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleControlPanel();
      }
    });
    
    // Add hover effect
    statusIcon.addEventListener('mouseenter', () => {
      statusIcon.style.opacity = '1';
      statusIcon.style.transform = 'scale(1.1)';
    });
    
    statusIcon.addEventListener('mouseleave', () => {
      statusIcon.style.opacity = '0.8';
      statusIcon.style.transform = 'scale(1)';
    });
    
    // Add tooltip on hover
    const tooltip = document.createElement('div');
    tooltip.id = 'accessibility-tooltip';
    tooltip.style.cssText = `
      position: absolute;
      bottom: 55px;
      left: 0;
      background-color: #333;
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 14px;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
      white-space: nowrap;
      font-family: Arial, sans-serif;
    `;
    tooltip.textContent = 'Accessibility Assistant';
    statusIcon.appendChild(tooltip);
    
    statusIcon.addEventListener('mouseenter', () => {
      tooltip.style.opacity = '1';
    });
    
    statusIcon.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });
    
    // Update status icon based on current state
    updateStatusIcon();
  }
  
  // Update status icon to reflect current state
  function updateStatusIcon() {
    if (!statusIcon) return;
    
    if (settings.enabled) {
      statusIcon.style.backgroundColor = '#0078d4';
      statusIcon.title = 'Accessibility Assistant (Enabled)';
    } else {
      statusIcon.style.backgroundColor = '#666';
      statusIcon.title = 'Accessibility Assistant (Disabled)';
    }
  }
  
  // Create control panel
  function createControlPanel() {
    // Check if already exists
    if (controlPanel) return;
    
    controlPanel = document.createElement('div');
    controlPanel.id = 'accessibility-control-panel';
    controlPanel.setAttribute('role', 'dialog');
    controlPanel.setAttribute('aria-labelledby', 'accessibility-panel-title');
    controlPanel.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 20px;
      width: 340px;
      max-height: 80vh;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 9999;
      display: none;
      overflow-y: auto;
      font-family: Arial, sans-serif;
      color: #333;
    `;
    
    // Panel header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      border-bottom: 1px solid #eee;
      position: sticky;
      top: 0;
      background: white;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
    `;
    
    const title = document.createElement('h2');
    title.id = 'accessibility-panel-title';
    title.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    `;
    title.textContent = 'Accessibility Assistant';
    
    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 22px;
      cursor: pointer;
      color: #666;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', 'Close accessibility panel');
    closeButton.addEventListener('click', hideControlPanel);
    
    header.appendChild(title);
    header.appendChild(closeButton);
    controlPanel.appendChild(header);
    
    // Main toggle section
    const mainToggle = document.createElement('div');
    mainToggle.style.cssText = `
      padding: 15px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    const mainToggleLabel = document.createElement('label');
    mainToggleLabel.style.cssText = `
      font-weight: bold;
      display: flex;
      align-items: center;
    `;
    mainToggleLabel.textContent = 'Enable Accessibility Features';
    
    const mainToggleSwitch = document.createElement('input');
    mainToggleSwitch.type = 'checkbox';
    mainToggleSwitch.id = 'accessibility-main-toggle';
    mainToggleSwitch.checked = settings.enabled;
    mainToggleSwitch.addEventListener('change', () => {
      settings.enabled = mainToggleSwitch.checked;
      if (settings.enabled) {
        enableManager();
      } else {
        disableManager();
      }
      saveSettings();
      updateStatusIcon();
    });
    
    mainToggleLabel.appendChild(mainToggleSwitch);
    mainToggle.appendChild(mainToggleLabel);
    controlPanel.appendChild(mainToggle);
    
    // Feature sections
    const featuresContainer = document.createElement('div');
    featuresContainer.style.cssText = `
      padding: 10px 15px;
    `;
    
    // Visual features section
    const visualSection = createFeatureSection(
      'visual',
      'Visual Accessibility',
      'Adjust contrast, colors, fonts, and other visual elements',
      [
        {
          id: 'high-contrast',
          name: 'High Contrast Mode',
          checked: settings.highContrastMode,
          onChange: (checked) => {
            settings.highContrastMode = checked;
            if (assistants.visual) {
              if (checked) {
                assistants.visual.enableHighContrast();
              } else {
                assistants.visual.disableHighContrast();
              }
            }
            saveSettings();
          }
        },
        {
          id: 'focus-indicators',
          name: 'Enhanced Focus Indicators',
          checked: settings.focusIndicators,
          onChange: (checked) => {
            settings.focusIndicators = checked;
            if (assistants.visual) {
              if (checked) {
                assistants.visual.enableFocusIndicators();
              } else {
                assistants.visual.disableFocusIndicators();
              }
            }
            saveSettings();
          }
        }
      ],
      [
        {
          id: 'color-blind-mode',
          name: 'Color Blind Mode',
          value: settings.colorBlindMode,
          options: [
            { value: 'none', name: 'None' },
            { value: 'protanopia', name: 'Protanopia (Red-Blind)' },
            { value: 'deuteranopia', name: 'Deuteranopia (Green-Blind)' },
            { value: 'tritanopia', name: 'Tritanopia (Blue-Blind)' },
            { value: 'achromatopsia', name: 'Achromatopsia (Monochrome)' }
          ],
          onChange: (value) => {
            settings.colorBlindMode = value;
            if (assistants.visual) {
              assistants.visual.setColorBlindMode(value);
            }
            saveSettings();
          }
        },
        {
          id: 'font-size',
          name: 'Font Size',
          value: settings.fontSize,
          options: [
            { value: 'small', name: 'Small' },
            { value: 'medium', name: 'Medium (Default)' },
            { value: 'large', name: 'Large' },
            { value: 'x-large', name: 'Extra Large' }
          ],
          onChange: (value) => {
            settings.fontSize = value;
            if (assistants.visual) {
              assistants.visual.setFontSize(value);
            }
            saveSettings();
          }
        }
      ]
    );
    
    // Screen reader section
    const screenReaderSection = createFeatureSection(
      'screenReader',
      'Screen Reader',
      'Navigation assistance and text-to-speech functionality',
      [
        {
          id: 'screen-reader-enabled',
          name: 'Enable Screen Reader',
          checked: settings.activeModules.includes('screenReader'),
          onChange: (checked) => {
            if (checked) {
              if (!settings.activeModules.includes('screenReader')) {
                settings.activeModules.push('screenReader');
              }
              if (assistants.screenReader) {
                assistants.screenReader.enable();
              }
            } else {
              settings.activeModules = settings.activeModules.filter(m => m !== 'screenReader');
              if (assistants.screenReader) {
                assistants.screenReader.disable();
              }
            }
            saveSettings();
          }
        },
        {
          id: 'highlight-text',
          name: 'Highlight Text While Reading',
          checked: settings.screenReader.highlightText,
          onChange: (checked) => {
            settings.screenReader.highlightText = checked;
            if (assistants.screenReader) {
              assistants.screenReader.updateSettings({ highlightText: checked });
            }
            saveSettings();
          }
        }
      ],
      [
        {
          id: 'speech-rate',
          name: 'Speech Rate',
          value: settings.screenReader.speechRate.toString(),
          options: [
            { value: '0.5', name: 'Very Slow' },
            { value: '0.75', name: 'Slow' },
            { value: '1', name: 'Normal' },
            { value: '1.25', name: 'Fast' },
            { value: '1.5', name: 'Very Fast' }
          ],
          onChange: (value) => {
            settings.screenReader.speechRate = parseFloat(value);
            if (assistants.screenReader) {
              assistants.screenReader.updateSettings({ speechRate: parseFloat(value) });
            }
            saveSettings();
          }
        }
      ]
    );
    
    // Cognitive section
    const cognitiveSection = createFeatureSection(
      'cognitive',
      'Cognitive Assistance',
      'Reading aids and focus assistance',
      [
        {
          id: 'cognitive-enabled',
          name: 'Enable Cognitive Features',
          checked: settings.activeModules.includes('cognitive'),
          onChange: (checked) => {
            if (checked) {
              if (!settings.activeModules.includes('cognitive')) {
                settings.activeModules.push('cognitive');
              }
              if (assistants.cognitive) {
                assistants.cognitive.enable();
              }
            } else {
              settings.activeModules = settings.activeModules.filter(m => m !== 'cognitive');
              if (assistants.cognitive) {
                assistants.cognitive.disable();
              }
            }
            saveSettings();
          }
        },
        {
          id: 'reading-guide',
          name: 'Reading Guide',
          checked: settings.cognitive.readingGuide,
          onChange: (checked) => {
            settings.cognitive.readingGuide = checked;
            if (assistants.cognitive) {
              if (checked) {
                assistants.cognitive.enableReadingGuide();
              } else {
                assistants.cognitive.disableReadingGuide();
              }
            }
            saveSettings();
          }
        },
        {
          id: 'focus-mode',
          name: 'Focus Mode',
          checked: settings.cognitive.focusMode,
          onChange: (checked) => {
            settings.cognitive.focusMode = checked;
            if (assistants.cognitive) {
              if (checked) {
                assistants.cognitive.enableFocusMode();
              } else {
                assistants.cognitive.disableFocusMode();
              }
            }
            saveSettings();
          }
        },
        {
          id: 'simplify-page',
          name: 'Simplify Page',
          checked: settings.cognitive.simplifyPage,
          onChange: (checked) => {
            settings.cognitive.simplifyPage = checked;
            if (assistants.cognitive) {
              if (checked) {
                assistants.cognitive.simplifyPage();
              } else {
                assistants.cognitive.restorePage();
              }
            }
            saveSettings();
          }
        }
      ],
      []
    );
    
    // Motor section
    const motorSection = createFeatureSection(
      'motor',
      'Motor Assistance',
      'Help with mouse and keyboard input',
      [
        {
          id: 'motor-enabled',
          name: 'Enable Motor Assistance',
          checked: settings.activeModules.includes('motor'),
          onChange: (checked) => {
            if (checked) {
              if (!settings.activeModules.includes('motor')) {
                settings.activeModules.push('motor');
              }
              if (assistants.motor) {
                assistants.motor.enable();
              }
            } else {
              settings.activeModules = settings.activeModules.filter(m => m !== 'motor');
              if (assistants.motor) {
                assistants.motor.disable();
              }
            }
            saveSettings();
          }
        },
        {
          id: 'keyboard-navigation',
          name: 'Enhanced Keyboard Navigation',
          checked: settings.motor.keyboardNavigation,
          onChange: (checked) => {
            settings.motor.keyboardNavigation = checked;
            if (assistants.motor) {
              if (checked) {
                assistants.motor.enableKeyboardNavigation();
              } else {
                assistants.motor.disableKeyboardNavigation();
              }
            }
            saveSettings();
          }
        },
        {
          id: 'large-targets',
          name: 'Larger Click Targets',
          checked: settings.motor.largeClickTargets,
          onChange: (checked) => {
            settings.motor.largeClickTargets = checked;
            if (assistants.motor) {
              if (checked) {
                assistants.motor.enableLargeClickTargets();
              } else {
                assistants.motor.disableLargeClickTargets();
              }
            }
            saveSettings();
          }
        },
        {
          id: 'dwell-clicking',
          name: 'Dwell Clicking (Hover to Click)',
          checked: settings.motor.dwellClicking,
          onChange: (checked) => {
            settings.motor.dwellClicking = checked;
            if (assistants.motor) {
              if (checked) {
                assistants.motor.enableDwellClicking();
              } else {
                assistants.motor.disableDwellClicking();
              }
            }
            saveSettings();
          }
        }
      ],
      []
    );
    
    // Speech recognition section
    const speechSection = createFeatureSection(
      'speech',
      'Speech Recognition',
      'Control the browser using voice commands',
      [
        {
          id: 'speech-enabled',
          name: 'Enable Voice Control',
          checked: settings.activeModules.includes('speech'),
          onChange: (checked) => {
            if (checked) {
              if (!settings.activeModules.includes('speech')) {
                settings.activeModules.push('speech');
              }
              settings.speech.enabled = true;
              if (assistants.speech) {
                assistants.speech.start();
              }
            } else {
              settings.activeModules = settings.activeModules.filter(m => m !== 'speech');
              settings.speech.enabled = false;
              if (assistants.speech) {
                assistants.speech.stop();
              }
            }
            saveSettings();
          }
        },
        {
          id: 'continuous-listening',
          name: 'Continuous Listening',
          checked: settings.speech.continuousListening,
          onChange: (checked) => {
            settings.speech.continuousListening = checked;
            if (assistants.speech) {
              assistants.speech.updateSettings({ continuousListening: checked });
            }
            saveSettings();
          }
        },
        {
          id: 'commands-enabled',
          name: 'Enable Voice Commands',
          checked: settings.speech.commandsEnabled,
          onChange: (checked) => {
            settings.speech.commandsEnabled = checked;
            if (assistants.speech) {
              assistants.speech.updateSettings({ commandsEnabled: checked });
            }
            saveSettings();
          }
        }
      ],
      [
        {
          id: 'speech-language',
          name: 'Recognition Language',
          value: settings.speech.languageCode,
          options: [
            { value: 'en-US', name: 'English (US)' },
            { value: 'en-GB', name: 'English (UK)' },
            { value: 'es-ES', name: 'Spanish' },
            { value: 'fr-FR', name: 'French' },
            { value: 'de-DE', name: 'German' }
          ],
          onChange: (value) => {
            settings.speech.languageCode = value;
            if (assistants.speech) {
              assistants.speech.updateSettings({ languageCode: value });
            }
            saveSettings();
          }
        }
      ]
    );
    
    featuresContainer.appendChild(visualSection);
    featuresContainer.appendChild(screenReaderSection);
    featuresContainer.appendChild(cognitiveSection);
    featuresContainer.appendChild(motorSection);
    featuresContainer.appendChild(speechSection);
    
    controlPanel.appendChild(featuresContainer);
    
    // Footer with keyboard shortcuts info
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 15px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #666;
    `;
    footer.innerHTML = `
      <p><strong>Keyboard Shortcuts:</strong></p>
      <ul style="margin: 5px 0; padding-left: 20px;">
        <li>Alt+A: Toggle Accessibility Panel</li>
        <li>Alt+V: Toggle Voice Recognition</li>
        <li>Alt+C: Toggle High Contrast</li>
        <li>Alt+R: Toggle Screen Reader</li>
        <li>Alt+F: Toggle Focus Mode</li>
      </ul>
    `;
    
    controlPanel.appendChild(footer);
    
    // Add to document
    document.body.appendChild(controlPanel);
  }
  
  // Create feature section
  function createFeatureSection(
    id: string, 
    title: string, 
    description: string, 
    toggles: Array<{id: string, name: string, checked: boolean, onChange: (checked: boolean) => void}>,
    dropdowns: Array<{id: string, name: string, value: string, options: Array<{value: string, name: string}>, onChange: (value: string) => void}>
  ) {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: 20px;
      border-bottom: 1px solid #eee;
      padding-bottom: 15px;
    `;
    
    const sectionHeader = document.createElement('div');
    sectionHeader.style.cssText = `
      margin-bottom: 10px;
    `;
    
    const sectionTitle = document.createElement('h3');
    sectionTitle.style.cssText = `
      margin: 0 0 5px 0;
      font-size: 16px;
      font-weight: 600;
    `;
    sectionTitle.textContent = title;
    
    const sectionDescription = document.createElement('p');
    sectionDescription.style.cssText = `
      margin: 0;
      font-size: 12px;
      color: #666;
    `;
    sectionDescription.textContent = description;
    
    sectionHeader.appendChild(sectionTitle);
    sectionHeader.appendChild(sectionDescription);
    section.appendChild(sectionHeader);
    
    // Add toggles
    if (toggles.length > 0) {
      const toggleList = document.createElement('div');
      toggleList.style.cssText = `
        margin-top: 10px;
      `;
      
      toggles.forEach(toggle => {
        const toggleItem = document.createElement('div');
        toggleItem.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding-left: 10px;
        `;
        
        const toggleLabel = document.createElement('label');
        toggleLabel.style.cssText = `
          font-size: 14px;
          margin-right: 10px;
        `;
        toggleLabel.htmlFor = toggle.id;
        toggleLabel.textContent = toggle.name;
        
        const toggleInput = document.createElement('input');
        toggleInput.type = 'checkbox';
        toggleInput.id = toggle.id;
        toggleInput.checked = toggle.checked;
        toggleInput.addEventListener('change', () => {
          toggle.onChange(toggleInput.checked);
        });
        
        toggleItem.appendChild(toggleLabel);
        toggleItem.appendChild(toggleInput);
        toggleList.appendChild(toggleItem);
      });
      
      section.appendChild(toggleList);
    }
    
    // Add dropdowns
    if (dropdowns.length > 0) {
      const dropdownList = document.createElement('div');
      dropdownList.style.cssText = `
        margin-top: 15px;
      `;
      
      dropdowns.forEach(dropdown => {
        const dropdownItem = document.createElement('div');
        dropdownItem.style.cssText = `
          margin-bottom: 15px;
          padding-left: 10px;
        `;
        
        const dropdownLabel = document.createElement('label');
        dropdownLabel.style.cssText = `
          display: block;
          font-size: 14px;
          margin-bottom: 5px;
        `;
        dropdownLabel.htmlFor = dropdown.id;
        dropdownLabel.textContent = dropdown.name;
        
        const dropdownSelect = document.createElement('select');
        dropdownSelect.id = dropdown.id;
        dropdownSelect.style.cssText = `
          width: 100%;
          padding: 5px;
          border-radius: 4px;
          border: 1px solid #ccc;
        `;
        dropdownSelect.value = dropdown.value;
        
        dropdown.options.forEach(option => {
          const optionElement = document.createElement('option');
          optionElement.value = option.value;
          optionElement.textContent = option.name;
          dropdownSelect.appendChild(optionElement);
        });
        
        dropdownSelect.addEventListener('change', () => {
          dropdown.onChange(dropdownSelect.value);
        });
        
        dropdownItem.appendChild(dropdownLabel);
        dropdownItem.appendChild(dropdownSelect);
        dropdownList.appendChild(dropdownItem);
      });
      
      section.appendChild(dropdownList);
    }
    
    return section;
  }
  
  // Update control panel to reflect current settings
  function updateControlPanel() {
    if (!controlPanel) return;
    
    // Update main toggle
    const mainToggle = document.getElementById('accessibility-main-toggle') as HTMLInputElement;
    if (mainToggle) {
      mainToggle.checked = settings.enabled;
    }
    
    // Update feature toggles
    const featureToggles = {
      'screen-reader-enabled': settings.activeModules.includes('screenReader'),
      'cognitive-enabled': settings.activeModules.includes('cognitive'),
      'motor-enabled': settings.activeModules.includes('motor'),
      'speech-enabled': settings.activeModules.includes('speech'),
      'high-contrast': settings.highContrastMode,
      'focus-indicators': settings.focusIndicators,
      'highlight-text': settings.screenReader.highlightText,
      'reading-guide': settings.cognitive.readingGuide,
      'focus-mode': settings.cognitive.focusMode,
      'simplify-page': settings.cognitive.simplifyPage,
      'keyboard-navigation': settings.motor.keyboardNavigation,
      'large-targets': settings.motor.largeClickTargets,
      'dwell-clicking': settings.motor.dwellClicking,
      'continuous-listening': settings.speech.continuousListening,
      'commands-enabled': settings.speech.commandsEnabled
    };
    
    // Update each toggle
    for (const [id, checked] of Object.entries(featureToggles)) {
      const toggle = document.getElementById(id) as HTMLInputElement;
      if (toggle) {
        toggle.checked = checked;
      }
    }
    
    // Update dropdowns
    const dropdowns = {
      'color-blind-mode': settings.colorBlindMode,
      'font-size': settings.fontSize,
      'speech-rate': settings.screenReader.speechRate.toString(),
      'speech-language': settings.speech.languageCode
    };
    
    // Update each dropdown
    for (const [id, value] of Object.entries(dropdowns)) {
      const dropdown = document.getElementById(id) as HTMLSelectElement;
      if (dropdown) {
        dropdown.value = value;
      }
    }
  }
  
  // Show control panel
  function showControlPanel() {
    if (controlPanel) {
      controlPanel.style.display = 'block';
      
      // Trap focus inside panel
      const focusableElements = controlPanel.querySelectorAll('button, input, select, [tabindex]:not([tabindex="-1"])');
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }
  
  // Hide control panel
  function hideControlPanel() {
    if (controlPanel) {
      controlPanel.style.display = 'none';
      
      // Return focus to status icon
      if (statusIcon) {
        statusIcon.focus();
      }
    }
  }
  
  // Toggle control panel
  function toggleControlPanel() {
    if (controlPanel) {
      if (controlPanel.style.display === 'block') {
        hideControlPanel();
      } else {
        showControlPanel();
      }
    }
  }
  
  // Enable accessibility manager
  function enableManager() {
    settings.enabled = true;
    
    // Enable active modules
    settings.activeModules.forEach(module => {
      switch (module) {
        case 'visual':
          assistants.visual?.enable();
          break;
        case 'screenReader':
          assistants.screenReader?.enable();
          break;
        case 'cognitive':
          assistants.cognitive?.enable();
          break;
        case 'motor':
          assistants.motor?.enable();
          break;
        case 'speech':
          assistants.speech?.start();
          break;
      }
    });
    
    updateControlPanel();
    updateStatusIcon();
    saveSettings();
  }
  
  // Disable accessibility manager
  function disableManager() {
    settings.enabled = false;
    
    // Disable all modules
    if (assistants.visual) assistants.visual.disable();
    if (assistants.screenReader) assistants.screenReader.disable();
    if (assistants.cognitive) assistants.cognitive.disable();
    if (assistants.motor) assistants.motor.disable();
    if (assistants.speech) assistants.speech.stop();
    
    updateControlPanel();
    updateStatusIcon();
    saveSettings();
  }
  
  // Set up keyboard shortcuts
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Alt+A: Toggle accessibility panel
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        toggleControlPanel();
      }
      
      // Alt+C: Toggle high contrast
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        settings.highContrastMode = !settings.highContrastMode;
        if (assistants.visual) {
          if (settings.highContrastMode) {
            assistants.visual.enableHighContrast();
          } else {
            assistants.visual.disableHighContrast();
          }
        }
        saveSettings();
        updateControlPanel();
      }
      
      // Alt+R: Toggle screen reader
      if (e.altKey && e.key === 'r') {
        e.preventDefault();
        const isEnabled = settings.activeModules.includes('screenReader');
        if (isEnabled) {
          settings.activeModules = settings.activeModules.filter(m => m !== 'screenReader');
          if (assistants.screenReader) {
            assistants.screenReader.disable();
          }
        } else {
          if (!settings.activeModules.includes('screenReader')) {
            settings.activeModules.push('screenReader');
          }
          if (assistants.screenReader) {
            assistants.screenReader.enable();
          }
        }
        saveSettings();
        updateControlPanel();
      }
      
      // Alt+F: Toggle focus mode
      if (e.altKey && e.key === 'f') {
        e.preventDefault();
        settings.cognitive.focusMode = !settings.cognitive.focusMode;
        if (assistants.cognitive) {
          if (settings.cognitive.focusMode) {
            assistants.cognitive.enableFocusMode();
          } else {
            assistants.cognitive.disableFocusMode();
          }
        }
        saveSettings();
        updateControlPanel();
      }
      
      // Alt+V: Toggle voice recognition
      if (e.altKey && e.key === 'v') {
        e.preventDefault();
        const isEnabled = settings.activeModules.includes('speech');
        if (isEnabled) {
          settings.activeModules = settings.activeModules.filter(m => m !== 'speech');
          settings.speech.enabled = false;
          if (assistants.speech) {
            assistants.speech.stop();
          }
        } else {
          if (!settings.activeModules.includes('speech')) {
            settings.activeModules.push('speech');
          }
          settings.speech.enabled = true;
          if (assistants.speech) {
            assistants.speech.start();
          }
        }
        saveSettings();
        updateControlPanel();
      }
    });
  }
  
  // Set up message listeners for communication with extension background script
  function setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message.action) return;
      
      switch (message.action) {
        case 'enableAccessibility':
          enableManager();
          break;
        
        case 'disableAccessibility':
          disableManager();
          break;
          
        case 'toggleAccessibility':
          if (settings.enabled) {
            disableManager();
          } else {
            enableManager();
          }
          break;
        
        case 'showAccessibilityPanel':
          showControlPanel();
          break;
          
        case 'hideAccessibilityPanel':
          hideControlPanel();
          break;
          
        case 'enableHighContrast':
          settings.highContrastMode = true;
          if (assistants.visual) {
            assistants.visual.enableHighContrast();
          }
          saveSettings();
          updateControlPanel();
          break;
          
        case 'disableHighContrast':
          settings.highContrastMode = false;
          if (assistants.visual) {
            assistants.visual.disableHighContrast();
          }
          saveSettings();
          updateControlPanel();
          break;
          
        case 'enableScreenReader':
          if (!settings.activeModules.includes('screenReader')) {
            settings.activeModules.push('screenReader');
          }
          if (assistants.screenReader) {
            assistants.screenReader.enable();
          }
          saveSettings();
          updateControlPanel();
          break;
          
        case 'disableScreenReader':
          settings.activeModules = settings.activeModules.filter(m => m !== 'screenReader');
          if (assistants.screenReader) {
            assistants.screenReader.disable();
          }
          saveSettings();
          updateControlPanel();
          break;
          
        case 'getSettings':
          sendResponse(settings);
          break;
          
        case 'updateSettings':
          if (message.settings) {
            Object.assign(settings, message.settings);
            applySettings();
            saveSettings();
          }
          break;
      }
    });
  }
  
  // Cleanup all resources when unloading
  function cleanup() {
    // Disable all assistants
    if (assistants.visual) assistants.visual.cleanup();
    if (assistants.screenReader) assistants.screenReader.cleanup();
    if (assistants.cognitive) assistants.cognitive.cleanup();
    if (assistants.motor) assistants.motor.cleanup();
    if (assistants.speech) assistants.speech.cleanup();
    
    // Remove UI elements
    if (controlPanel && controlPanel.parentNode) {
      controlPanel.parentNode.removeChild(controlPanel);
      controlPanel = null;
    }
    
    if (statusIcon && statusIcon.parentNode) {
      statusIcon.parentNode.removeChild(statusIcon);
      statusIcon = null;
    }
    
    isInitialized = false;
  }
  
  // Initialize immediately
  initialize();
  
  // Public API
  return {
    enable: enableManager,
    disable: disableManager,
    toggle() {
      if (settings.enabled) {
        disableManager();
      } else {
        enableManager();
      }
    },
    showPanel: showControlPanel,
    hidePanel: hideControlPanel,
    togglePanel: toggleControlPanel,
    getSettings() {
      return { ...settings };
    },
    updateSettings(newSettings: Partial<AccessibilitySettings>) {
      Object.assign(settings, newSettings);
      applySettings();
      saveSettings();
    },
    cleanup
  };
}

export default createAccessibilityManager;