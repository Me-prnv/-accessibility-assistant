// Cognitive Assistant Module for Accessibility Assistant
// Provides features for users with cognitive and learning disabilities

// Types
interface CognitiveAssistantSettings {
  enableFocusMode: boolean;
  enableReadingGuide: boolean;
  simplifyPage: boolean;
  enableReadingAids: boolean;
  highlightLinks: boolean;
  enableTextToSpeech: boolean;
  enableVocabularySimplification: boolean;
  readingSpeed: number;
}

// Default settings
const defaultSettings: CognitiveAssistantSettings = {
  enableFocusMode: false,
  enableReadingGuide: false,
  simplifyPage: false,
  enableReadingAids: true,
  highlightLinks: true,
  enableTextToSpeech: false,
  enableVocabularySimplification: false,
  readingSpeed: 1.0
};

// Initialize cognitive assistant
export function createCognitiveAssistant(options: Partial<CognitiveAssistantSettings> = {}) {
  // Merge default settings with provided options
  const settings: CognitiveAssistantSettings = {
    ...defaultSettings,
    ...options
  };
  
  // UI Elements
  let focusModeOverlay: HTMLDivElement | null = null;
  let readingGuide: HTMLDivElement | null = null;
  let controlPanel: HTMLDivElement | null = null;
  let simplifiedStyles: HTMLStyleElement | null = null;
  
  // Event handlers
  let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  let keyboardHandler: ((e: KeyboardEvent) => void) | null = null;
  let scrollHandler: ((e: Event) => void) | null = null;
  
  // State variables
  let isFocusModeActive = false;
  let isReadingGuideActive = false;
  let isSimplifiedModeActive = false;
  let currentParagraphElement: HTMLElement | null = null;
  
  // Initialize
  function initialize() {
    // Load settings from storage
    loadSettings();
    
    // Create UI elements
    createControlPanel();
    
    // Set up event handlers
    setupEventHandlers();
    
    // Apply initial settings
    applySettings();
  }
  
  // Load saved settings from storage
  function loadSettings() {
    chrome.storage.sync.get('cognitiveAssistant', (data) => {
      if (data.cognitiveAssistant) {
        // Merge saved settings with current settings
        Object.assign(settings, data.cognitiveAssistant);
        applySettings();
        updateControlPanel();
      }
    });
  }
  
  // Save settings to storage
  function saveSettings() {
    chrome.storage.sync.set({
      cognitiveAssistant: settings
    });
  }
  
  // Apply current settings
  function applySettings() {
    // Apply focus mode
    if (settings.enableFocusMode) {
      enableFocusMode();
    } else {
      disableFocusMode();
    }
    
    // Apply reading guide
    if (settings.enableReadingGuide) {
      enableReadingGuide();
    } else {
      disableReadingGuide();
    }
    
    // Apply simplified page
    if (settings.simplifyPage) {
      enableSimplifiedMode();
    } else {
      disableSimplifiedMode();
    }
    
    // Apply reading aids
    if (settings.enableReadingAids) {
      enableReadingAids();
    } else {
      disableReadingAids();
    }
    
    // Apply link highlighting
    if (settings.highlightLinks) {
      highlightLinks();
    } else {
      unhighlightLinks();
    }
  }
  
  // Create control panel for cognitive accessibility settings
  function createControlPanel() {
    controlPanel = document.createElement('div');
    controlPanel.id = 'accessibility-assistant-cognitive-panel';
    controlPanel.style.position = 'fixed';
    controlPanel.style.top = '50px';
    controlPanel.style.right = '20px';
    controlPanel.style.width = '300px';
    controlPanel.style.backgroundColor = 'white';
    controlPanel.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    controlPanel.style.borderRadius = '8px';
    controlPanel.style.padding = '15px';
    controlPanel.style.zIndex = '10000';
    controlPanel.style.display = 'none';
    
    // Add controls
    controlPanel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h2 style="margin: 0; font-size: 16px;">Cognitive Accessibility Settings</h2>
        <button id="accessibility-assistant-cognitive-close" style="background: none; border: none; cursor: pointer; font-size: 18px;">×</button>
      </div>
      
      <div style="margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-focus-mode">Focus Mode</label>
          <input type="checkbox" id="accessibility-assistant-focus-mode" ${settings.enableFocusMode ? 'checked' : ''}>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-reading-guide">Reading Guide</label>
          <input type="checkbox" id="accessibility-assistant-reading-guide" ${settings.enableReadingGuide ? 'checked' : ''}>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-simplify-page">Simplified Page Layout</label>
          <input type="checkbox" id="accessibility-assistant-simplify-page" ${settings.simplifyPage ? 'checked' : ''}>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-reading-aids">Reading Aids</label>
          <input type="checkbox" id="accessibility-assistant-reading-aids" ${settings.enableReadingAids ? 'checked' : ''}>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-highlight-links">Highlight Links</label>
          <input type="checkbox" id="accessibility-assistant-highlight-links" ${settings.highlightLinks ? 'checked' : ''}>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-text-to-speech">Text-to-Speech with Highlighting</label>
          <input type="checkbox" id="accessibility-assistant-text-to-speech" ${settings.enableTextToSpeech ? 'checked' : ''}>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-vocabulary">Vocabulary Simplification</label>
          <input type="checkbox" id="accessibility-assistant-vocabulary" ${settings.enableVocabularySimplification ? 'checked' : ''}>
        </div>
        
        <div style="margin-bottom: 10px;">
          <label for="accessibility-assistant-reading-speed">Reading Speed: ${settings.readingSpeed}x</label>
          <input type="range" id="accessibility-assistant-reading-speed" min="0.5" max="2" step="0.1" value="${settings.readingSpeed}" style="width: 100%;">
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button id="accessibility-assistant-cognitive-reset" style="padding: 5px 10px; cursor: pointer;">Reset to Default</button>
        <button id="accessibility-assistant-cognitive-apply" style="padding: 5px 10px; cursor: pointer; background-color: #0078FF; color: white; border: none; border-radius: 4px;">Apply Settings</button>
      </div>
    `;
    
    document.body.appendChild(controlPanel);
    
    // Add event listeners to controls
    document.getElementById('accessibility-assistant-cognitive-close')?.addEventListener('click', () => {
      hideControlPanel();
    });
    
    document.getElementById('accessibility-assistant-focus-mode')?.addEventListener('change', (e) => {
      settings.enableFocusMode = (e.target as HTMLInputElement).checked;
    });
    
    document.getElementById('accessibility-assistant-reading-guide')?.addEventListener('change', (e) => {
      settings.enableReadingGuide = (e.target as HTMLInputElement).checked;
    });
    
    document.getElementById('accessibility-assistant-simplify-page')?.addEventListener('change', (e) => {
      settings.simplifyPage = (e.target as HTMLInputElement).checked;
    });
    
    document.getElementById('accessibility-assistant-reading-aids')?.addEventListener('change', (e) => {
      settings.enableReadingAids = (e.target as HTMLInputElement).checked;
    });
    
    document.getElementById('accessibility-assistant-highlight-links')?.addEventListener('change', (e) => {
      settings.highlightLinks = (e.target as HTMLInputElement).checked;
    });
    
    document.getElementById('accessibility-assistant-text-to-speech')?.addEventListener('change', (e) => {
      settings.enableTextToSpeech = (e.target as HTMLInputElement).checked;
    });
    
    document.getElementById('accessibility-assistant-vocabulary')?.addEventListener('change', (e) => {
      settings.enableVocabularySimplification = (e.target as HTMLInputElement).checked;
    });
    
    document.getElementById('accessibility-assistant-reading-speed')?.addEventListener('input', (e) => {
      settings.readingSpeed = parseFloat((e.target as HTMLInputElement).value);
      const label = document.querySelector('label[for="accessibility-assistant-reading-speed"]');
      if (label) {
        label.textContent = `Reading Speed: ${settings.readingSpeed}x`;
      }
    });
    
    document.getElementById('accessibility-assistant-cognitive-reset')?.addEventListener('click', resetToDefaults);
    
    document.getElementById('accessibility-assistant-cognitive-apply')?.addEventListener('click', () => {
      applySettings();
      saveSettings();
      hideControlPanel();
    });
  }
  
  // Update control panel with current settings
  function updateControlPanel() {
    if (!controlPanel) return;
    
    const focusModeCheckbox = document.getElementById('accessibility-assistant-focus-mode') as HTMLInputElement;
    if (focusModeCheckbox) {
      focusModeCheckbox.checked = settings.enableFocusMode;
    }
    
    const readingGuideCheckbox = document.getElementById('accessibility-assistant-reading-guide') as HTMLInputElement;
    if (readingGuideCheckbox) {
      readingGuideCheckbox.checked = settings.enableReadingGuide;
    }
    
    const simplifyPageCheckbox = document.getElementById('accessibility-assistant-simplify-page') as HTMLInputElement;
    if (simplifyPageCheckbox) {
      simplifyPageCheckbox.checked = settings.simplifyPage;
    }
    
    const readingAidsCheckbox = document.getElementById('accessibility-assistant-reading-aids') as HTMLInputElement;
    if (readingAidsCheckbox) {
      readingAidsCheckbox.checked = settings.enableReadingAids;
    }
    
    const highlightLinksCheckbox = document.getElementById('accessibility-assistant-highlight-links') as HTMLInputElement;
    if (highlightLinksCheckbox) {
      highlightLinksCheckbox.checked = settings.highlightLinks;
    }
    
    const textToSpeechCheckbox = document.getElementById('accessibility-assistant-text-to-speech') as HTMLInputElement;
    if (textToSpeechCheckbox) {
      textToSpeechCheckbox.checked = settings.enableTextToSpeech;
    }
    
    const vocabularyCheckbox = document.getElementById('accessibility-assistant-vocabulary') as HTMLInputElement;
    if (vocabularyCheckbox) {
      vocabularyCheckbox.checked = settings.enableVocabularySimplification;
    }
    
    const readingSpeedInput = document.getElementById('accessibility-assistant-reading-speed') as HTMLInputElement;
    if (readingSpeedInput) {
      readingSpeedInput.value = settings.readingSpeed.toString();
      const label = document.querySelector('label[for="accessibility-assistant-reading-speed"]');
      if (label) {
        label.textContent = `Reading Speed: ${settings.readingSpeed}x`;
      }
    }
  }
  
  // Show control panel
  function showControlPanel() {
    if (controlPanel) {
      controlPanel.style.display = 'block';
    }
  }
  
  // Hide control panel
  function hideControlPanel() {
    if (controlPanel) {
      controlPanel.style.display = 'none';
    }
  }
  
  // Toggle control panel visibility
  function toggleControlPanel() {
    if (controlPanel) {
      if (controlPanel.style.display === 'none') {
        showControlPanel();
      } else {
        hideControlPanel();
      }
    }
  }
  
  // Reset settings to defaults
  function resetToDefaults() {
    Object.assign(settings, defaultSettings);
    updateControlPanel();
  }
  
  // Set up event handlers
  function setupEventHandlers() {
    // Set up mouse move handler for reading guide
    mouseMoveHandler = (e: MouseEvent) => {
      if (settings.enableReadingGuide && readingGuide) {
        updateReadingGuidePosition(e.clientY);
      }
    };
    
    // Set up keyboard handler
    keyboardHandler = (e: KeyboardEvent) => {
      // Alt+C to toggle control panel
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        toggleControlPanel();
      }
      
      // Alt+F to toggle focus mode
      if (e.altKey && e.key === 'f') {
        e.preventDefault();
        settings.enableFocusMode = !settings.enableFocusMode;
        applySettings();
        saveSettings();
      }
      
      // Alt+R to toggle reading guide
      if (e.altKey && e.key === 'r') {
        e.preventDefault();
        settings.enableReadingGuide = !settings.enableReadingGuide;
        applySettings();
        saveSettings();
      }
      
      // Alt+S to toggle simplified mode
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        settings.simplifyPage = !settings.simplifyPage;
        applySettings();
        saveSettings();
      }
    };
    
    // Set up scroll handler
    scrollHandler = () => {
      if (settings.enableReadingGuide && readingGuide) {
        // Keep reading guide at current mouse Y position when scrolling
        const mouseY = readingGuide.getBoundingClientRect().top;
        updateReadingGuidePosition(mouseY);
      }
    };
    
    // Add event listeners
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('keydown', keyboardHandler);
    window.addEventListener('scroll', scrollHandler);
  }
  
  // Enable focus mode
  function enableFocusMode() {
    if (isFocusModeActive) return;
    
    // Create overlay if it doesn't exist
    if (!focusModeOverlay) {
      focusModeOverlay = document.createElement('div');
      focusModeOverlay.id = 'accessibility-assistant-focus-overlay';
      focusModeOverlay.style.position = 'fixed';
      focusModeOverlay.style.top = '0';
      focusModeOverlay.style.left = '0';
      focusModeOverlay.style.width = '100%';
      focusModeOverlay.style.height = '100%';
      focusModeOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
      focusModeOverlay.style.zIndex = '9997';
      focusModeOverlay.style.pointerEvents = 'none';
      document.body.appendChild(focusModeOverlay);
      
      // Add paragraph hover handler
      document.addEventListener('mouseover', handleParagraphHover);
    }
    
    // Show overlay
    if (focusModeOverlay) {
      focusModeOverlay.style.display = 'block';
    }
    
    isFocusModeActive = true;
  }
  
  // Disable focus mode
  function disableFocusMode() {
    if (!isFocusModeActive) return;
    
    // Hide overlay
    if (focusModeOverlay) {
      focusModeOverlay.style.display = 'none';
    }
    
    // Clear current paragraph highlight
    if (currentParagraphElement) {
      currentParagraphElement.style.backgroundColor = '';
      currentParagraphElement.style.position = '';
      currentParagraphElement.style.zIndex = '';
      currentParagraphElement = null;
    }
    
    // Remove paragraph hover handler
    document.removeEventListener('mouseover', handleParagraphHover);
    
    isFocusModeActive = false;
  }
  
  // Handle paragraph hover for focus mode
  function handleParagraphHover(e: MouseEvent) {
    if (!isFocusModeActive) return;
    
    // Find paragraph or text block under mouse
    const target = e.target as HTMLElement;
    const paragraph = findTextBlock(target);
    
    // If found a valid paragraph and it's different from current
    if (paragraph && paragraph !== currentParagraphElement) {
      // Reset previous paragraph
      if (currentParagraphElement) {
        currentParagraphElement.style.backgroundColor = '';
        currentParagraphElement.style.position = '';
        currentParagraphElement.style.zIndex = '';
      }
      
      // Highlight new paragraph
      paragraph.style.backgroundColor = 'white';
      paragraph.style.position = 'relative';
      paragraph.style.zIndex = '9998';
      
      // Update current paragraph
      currentParagraphElement = paragraph;
    }
  }
  
  // Find a valid text block (paragraph, heading, list item, etc.)
  function findTextBlock(element: HTMLElement): HTMLElement | null {
    // Check if the element itself is a text block
    if (isTextBlock(element)) {
      return element;
    }
    
    // Check if any parent is a text block
    let parent = element.parentElement;
    while (parent) {
      if (isTextBlock(parent)) {
        return parent;
      }
      parent = parent.parentElement;
    }
    
    return null;
  }
  
  // Check if an element is a valid text block
  function isTextBlock(element: HTMLElement): boolean {
    // Valid text block tags
    const textBlockTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TD', 'DIV', 'SPAN', 'ARTICLE', 'SECTION'];
    
    // Check tag name
    if (textBlockTags.includes(element.tagName)) {
      // Ensure it has some text
      const textContent = element.textContent?.trim();
      if (textContent && textContent.length > 10) {
        return true;
      }
    }
    
    return false;
  }
  
  // Enable reading guide
  function enableReadingGuide() {
    if (isReadingGuideActive) return;
    
    // Create reading guide if it doesn't exist
    if (!readingGuide) {
      readingGuide = document.createElement('div');
      readingGuide.id = 'accessibility-assistant-reading-guide';
      readingGuide.style.position = 'fixed';
      readingGuide.style.left = '0';
      readingGuide.style.width = '100%';
      readingGuide.style.height = '30px';
      readingGuide.style.backgroundColor = 'rgba(255, 255, 0, 0.2)';
      readingGuide.style.borderTop = '1px solid rgba(255, 200, 0, 0.5)';
      readingGuide.style.borderBottom = '1px solid rgba(255, 200, 0, 0.5)';
      readingGuide.style.zIndex = '9996';
      readingGuide.style.pointerEvents = 'none';
      document.body.appendChild(readingGuide);
    }
    
    // Show reading guide
    if (readingGuide) {
      readingGuide.style.display = 'block';
      
      // Position at mouse Y if available, otherwise at center of screen
      const mouseY = mouseMoveHandler ? readingGuide.getBoundingClientRect().top : window.innerHeight / 2;
      updateReadingGuidePosition(mouseY);
    }
    
    isReadingGuideActive = true;
  }
  
  // Disable reading guide
  function disableReadingGuide() {
    if (!isReadingGuideActive) return;
    
    // Hide reading guide
    if (readingGuide) {
      readingGuide.style.display = 'none';
    }
    
    isReadingGuideActive = false;
  }
  
  // Update reading guide position
  function updateReadingGuidePosition(y: number) {
    if (!readingGuide) return;
    
    // Position reading guide at mouse Y position
    readingGuide.style.top = `${y - readingGuide.offsetHeight / 2}px`;
  }
  
  // Enable simplified mode
  function enableSimplifiedMode() {
    if (isSimplifiedModeActive) return;
    
    // Create style element if it doesn't exist
    if (!simplifiedStyles) {
      simplifiedStyles = document.createElement('style');
      simplifiedStyles.id = 'accessibility-assistant-simplified-styles';
      document.head.appendChild(simplifiedStyles);
    }
    
    // Set simplified styles
    simplifiedStyles.textContent = `
      body {
        max-width: 800px !important;
        margin: 0 auto !important;
        padding: 20px !important;
        line-height: 1.6 !important;
        font-size: 18px !important;
        font-family: Arial, sans-serif !important;
      }
      
      /* Hide distracting elements */
      aside, nav, footer, iframe, .ad, .ads, .advertisement, .sidebar, .banner,
      [class*="ad-"], [id*="ad-"], [class*="banner"], [id*="banner"],
      [role="banner"], [role="advertisement"], [role="complementary"] {
        display: none !important;
      }
      
      /* Simplify text content */
      p, li, h1, h2, h3, h4, h5, h6 {
        color: #333 !important;
        margin-bottom: 1em !important;
        background: transparent !important;
      }
      
      a {
        color: #0066cc !important;
        text-decoration: underline !important;
      }
      
      /* Increase spacing */
      p, li {
        margin-bottom: 1.2em !important;
      }
      
      h1, h2, h3, h4, h5, h6 {
        margin-top: 1.5em !important;
        margin-bottom: 0.8em !important;
      }
      
      /* Simplify images */
      img {
        max-width: 100% !important;
        height: auto !important;
        display: block !important;
        margin: 1em auto !important;
      }
    `;
    
    isSimplifiedModeActive = true;
  }
  
  // Disable simplified mode
  function disableSimplifiedMode() {
    if (!isSimplifiedModeActive) return;
    
    // Remove simplified styles
    if (simplifiedStyles) {
      simplifiedStyles.textContent = '';
    }
    
    isSimplifiedModeActive = false;
  }
  
  // Enable reading aids
  function enableReadingAids() {
    // Create style element
    let styleElement = document.getElementById('accessibility-assistant-reading-aids') as HTMLStyleElement;
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'accessibility-assistant-reading-aids';
      document.head.appendChild(styleElement);
    }
    
    // Add reading aids styles
    styleElement.textContent = `
      /* Increase letter spacing */
      p, li, h1, h2, h3, h4, h5, h6 {
        letter-spacing: 0.05em !important;
        word-spacing: 0.1em !important;
        line-height: 1.8 !important;
      }
      
      /* Add paragraph spacing */
      p {
        margin-bottom: 1.5em !important;
      }
      
      /* Text contrast */
      body {
        color: #000 !important;
        background-color: #fff !important;
      }
    `;
  }
  
  // Disable reading aids
  function disableReadingAids() {
    const styleElement = document.getElementById('accessibility-assistant-reading-aids');
    if (styleElement) {
      styleElement.remove();
    }
  }
  
  // Highlight links for better visibility
  function highlightLinks() {
    // Create style element
    let styleElement = document.getElementById('accessibility-assistant-highlight-links') as HTMLStyleElement;
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'accessibility-assistant-highlight-links';
      document.head.appendChild(styleElement);
    }
    
    // Add link highlighting styles
    styleElement.textContent = `
      /* Highlight links */
      a {
        background-color: rgba(0, 102, 204, 0.1) !important;
        border: 1px solid rgba(0, 102, 204, 0.2) !important;
        border-radius: 3px !important;
        padding: 0 3px !important;
        text-decoration: underline !important;
      }
      
      /* Hover effect */
      a:hover {
        background-color: rgba(0, 102, 204, 0.2) !important;
        border-color: rgba(0, 102, 204, 0.4) !important;
      }
    `;
  }
  
  // Remove link highlighting
  function unhighlightLinks() {
    const styleElement = document.getElementById('accessibility-assistant-highlight-links');
    if (styleElement) {
      styleElement.remove();
    }
  }
  
  // Clean up resources
  function cleanup() {
    // Remove event listeners
    if (mouseMoveHandler) {
      document.removeEventListener('mousemove', mouseMoveHandler);
    }
    
    if (keyboardHandler) {
      document.removeEventListener('keydown', keyboardHandler);
    }
    
    if (scrollHandler) {
      window.removeEventListener('scroll', scrollHandler);
    }
    
    document.removeEventListener('mouseover', handleParagraphHover);
    
    // Remove UI elements
    if (focusModeOverlay && focusModeOverlay.parentNode) {
      focusModeOverlay.parentNode.removeChild(focusModeOverlay);
    }
    
    if (readingGuide && readingGuide.parentNode) {
      readingGuide.parentNode.removeChild(readingGuide);
    }
    
    if (controlPanel && controlPanel.parentNode) {
      controlPanel.parentNode.removeChild(controlPanel);
    }
    
    // Remove styles
    if (simplifiedStyles && simplifiedStyles.parentNode) {
      simplifiedStyles.parentNode.removeChild(simplifiedStyles);
    }
    
    const readingAidsStyles = document.getElementById('accessibility-assistant-reading-aids');
    if (readingAidsStyles) {
      readingAidsStyles.remove();
    }
    
    const highlightLinksStyles = document.getElementById('accessibility-assistant-highlight-links');
    if (highlightLinksStyles) {
      highlightLinksStyles.remove();
    }
  }
  
  // Initialize
  initialize();
  
  // Return public API
  return {
    showControlPanel,
    hideControlPanel,
    toggleControlPanel,
    toggleFocusMode: () => {
      settings.enableFocusMode = !settings.enableFocusMode;
      applySettings();
      saveSettings();
    },
    toggleReadingGuide: () => {
      settings.enableReadingGuide = !settings.enableReadingGuide;
      applySettings();
      saveSettings();
    },
    toggleSimplifiedMode: () => {
      settings.simplifyPage = !settings.simplifyPage;
      applySettings();
      saveSettings();
    },
    cleanup
  };
}

export default createCognitiveAssistant; 