// Cognitive Assistant Module for Accessibility Assistant
// Provides cognitive accessibility features like focus mode, reading guide, and simplified pages

import { CognitiveSettings, PageSummary } from '../../types';

// Default settings
const defaultSettings: CognitiveSettings = {
  enabled: false,
  focusModeEnabled: false,
  readingGuideEnabled: false,
  simplifiedPageEnabled: false,
  readingAidsEnabled: false,
  highlightLinksEnabled: false,
  textToSpeechEnabled: false,
  vocabularySimplificationEnabled: false,
  readingSpeed: 250, // words per minute
  distractionFreeMode: false
};

// Initialize cognitive assistant
export function createCognitiveAssistant(options: Partial<CognitiveSettings> = {}) {
  // Merge default settings with provided options
  const settings: CognitiveSettings = {
    ...defaultSettings,
    ...options
  };
  
  // UI elements
  let controlPanel: HTMLElement | null = null;
  let readingGuide: HTMLElement | null = null;
  let focusModeOverlay: HTMLElement | null = null;
  let simplifiedPageContainer: HTMLElement | null = null;
  let vocabularyTooltip: HTMLElement | null = null;
  
  // State
  let isReadingGuideActive = false;
  let isFocusModeActive = false;
  let isSimplifiedPageActive = false;
  let originalPageContent: string | null = null;
  let lastMouseY = 0;
  let complexWords: Map<string, string> = new Map();
  
  // Event handlers
  let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  let keyboardHandler: ((e: KeyboardEvent) => void) | null = null;
  let scrollHandler: ((e: Event) => void) | null = null;
  
  // Initialize
  function initialize() {
    // Create UI elements
    createUI();
    
    // Load settings from storage
    loadSettings();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load complex words dictionary
    loadComplexWordsDictionary();
    
    // Initialize features based on settings
    initializeFeatures();
  }
  
  // Load settings from Chrome storage
  function loadSettings() {
    chrome.storage.sync.get('cognitiveAssistant', (data) => {
      if (data.cognitiveAssistant) {
        Object.assign(settings, data.cognitiveAssistant);
        updateControlPanel();
        initializeFeatures();
      }
    });
  }
  
  // Save settings to Chrome storage
  function saveSettings() {
    chrome.storage.sync.set({
      cognitiveAssistant: settings
    });
  }
  
  // Load complex words dictionary
  function loadComplexWordsDictionary() {
    // This would ideally be loaded from a comprehensive dictionary
    // For now, we'll use a small example set
    complexWords.set('utilize', 'use');
    complexWords.set('purchase', 'buy');
    complexWords.set('inquire', 'ask');
    complexWords.set('comprehend', 'understand');
    complexWords.set('additional', 'more');
    complexWords.set('demonstrate', 'show');
    complexWords.set('sufficient', 'enough');
    complexWords.set('approximately', 'about');
    complexWords.set('initiate', 'start');
    complexWords.set('implement', 'do');
    complexWords.set('obtain', 'get');
    complexWords.set('facilitate', 'help');
    complexWords.set('terminate', 'end');
    complexWords.set('modification', 'change');
    complexWords.set('endeavor', 'try');
  }
  
  // Create UI elements
  function createUI() {
    createControlPanel();
    createReadingGuide();
    createFocusModeOverlay();
    createVocabularyTooltip();
  }
  
  // Create control panel UI
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
    controlPanel.style.maxHeight = '80vh';
    controlPanel.style.overflowY = 'auto';
    
    controlPanel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h2 style="margin: 0; font-size: 16px;">Cognitive Accessibility Settings</h2>
        <button id="accessibility-assistant-cognitive-close" style="background: none; border: none; cursor: pointer; font-size: 18px;">×</button>
      </div>
      
      <div style="margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-focus-mode">Focus Mode</label>
          <input type="checkbox" id="accessibility-assistant-focus-mode" ${settings.focusModeEnabled ? 'checked' : ''}>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-reading-guide">Reading Guide</label>
          <input type="checkbox" id="accessibility-assistant-reading-guide" ${settings.readingGuideEnabled ? 'checked' : ''}>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-simplified-page">Simplified Page</label>
          <input type="checkbox" id="accessibility-assistant-simplified-page" ${settings.simplifiedPageEnabled ? 'checked' : ''}>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-reading-aids">Reading Aids</label>
          <input type="checkbox" id="accessibility-assistant-reading-aids" ${settings.readingAidsEnabled ? 'checked' : ''}>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-highlight-links">Highlight Links</label>
          <input type="checkbox" id="accessibility-assistant-highlight-links" ${settings.highlightLinksEnabled ? 'checked' : ''}>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-text-to-speech">Text-to-Speech</label>
          <input type="checkbox" id="accessibility-assistant-text-to-speech" ${settings.textToSpeechEnabled ? 'checked' : ''}>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-vocabulary">Simplify Vocabulary</label>
          <input type="checkbox" id="accessibility-assistant-vocabulary" ${settings.vocabularySimplificationEnabled ? 'checked' : ''}>
        </div>
        
        <div style="margin-bottom: 10px;">
          <label for="accessibility-assistant-reading-speed">Reading Speed: ${settings.readingSpeed} WPM</label>
          <input type="range" id="accessibility-assistant-reading-speed" min="100" max="500" step="10" value="${settings.readingSpeed}" style="width: 100%;">
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button id="accessibility-assistant-cognitive-reset" style="padding: 5px 10px; cursor: pointer;">Reset to Default</button>
        <button id="accessibility-assistant-cognitive-apply" style="padding: 5px 10px; cursor: pointer; background-color: #0078FF; color: white; border: none; border-radius: 4px;">Apply Settings</button>
      </div>
    `;
    
    document.body.appendChild(controlPanel);
    
    // Add event listeners
    document.getElementById('accessibility-assistant-cognitive-close')?.addEventListener('click', () => {
      hideControlPanel();
    });
    
    document.getElementById('accessibility-assistant-focus-mode')?.addEventListener('change', (e) => {
      settings.focusModeEnabled = (e.target as HTMLInputElement).checked;
    });
    
    document.getElementById('accessibility-assistant-reading-guide')?.addEventListener('change', (e) => {
      settings.readingGuideEnabled = (e.target as HTMLInputElement).checked;
    });
    
    document.getElementById('accessibility-assistant-simplified-page')?.addEventListener('change', (e) => {
      settings.simplifiedPageEnabled = (e.target as HTMLInputElement).checked;
    });
    
    document.getElementById('accessibility-assistant-reading-aids')?.addEventListener('change', (e) => {
      settings.readingAidsEnabled = (e.target as HTMLInputElement).checked;
    });
    
    document.getElementById('accessibility-assistant-highlight-links')?.addEventListener('change', (e) => {
      settings.highlightLinksEnabled = (e.target as HTMLInputElement).checked;
    });
    
    document.getElementById('accessibility-assistant-text-to-speech')?.addEventListener('change', (e) => {
      settings.textToSpeechEnabled = (e.target as HTMLInputElement).checked;
    });
    
    document.getElementById('accessibility-assistant-vocabulary')?.addEventListener('change', (e) => {
      settings.vocabularySimplificationEnabled = (e.target as HTMLInputElement).checked;
    });
    
    document.getElementById('accessibility-assistant-reading-speed')?.addEventListener('input', (e) => {
      settings.readingSpeed = parseInt((e.target as HTMLInputElement).value);
      const label = document.querySelector('label[for="accessibility-assistant-reading-speed"]');
      if (label) {
        label.textContent = `Reading Speed: ${settings.readingSpeed} WPM`;
      }
    });
    
    document.getElementById('accessibility-assistant-cognitive-reset')?.addEventListener('click', resetToDefaults);
    
    document.getElementById('accessibility-assistant-cognitive-apply')?.addEventListener('click', () => {
      applySettings();
      saveSettings();
      hideControlPanel();
    });
  }
  
  // Create reading guide element
  function createReadingGuide() {
    readingGuide = document.createElement('div');
    readingGuide.id = 'accessibility-assistant-reading-guide';
    readingGuide.style.position = 'absolute';
    readingGuide.style.height = '30px';
    readingGuide.style.width = '100%';
    readingGuide.style.backgroundColor = 'rgba(255, 255, 0, 0.2)';
    readingGuide.style.pointerEvents = 'none';
    readingGuide.style.zIndex = '9999';
    readingGuide.style.display = 'none';
    
    document.body.appendChild(readingGuide);
  }
  
  // Create focus mode overlay
  function createFocusModeOverlay() {
    focusModeOverlay = document.createElement('div');
    focusModeOverlay.id = 'accessibility-assistant-focus-overlay';
    focusModeOverlay.style.position = 'fixed';
    focusModeOverlay.style.top = '0';
    focusModeOverlay.style.left = '0';
    focusModeOverlay.style.width = '100%';
    focusModeOverlay.style.height = '100%';
    focusModeOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    focusModeOverlay.style.zIndex = '9998';
    focusModeOverlay.style.display = 'none';
    focusModeOverlay.style.pointerEvents = 'none';
    
    document.body.appendChild(focusModeOverlay);
  }
  
  // Create vocabulary tooltip
  function createVocabularyTooltip() {
    vocabularyTooltip = document.createElement('div');
    vocabularyTooltip.id = 'accessibility-assistant-vocabulary-tooltip';
    vocabularyTooltip.style.position = 'absolute';
    vocabularyTooltip.style.backgroundColor = 'white';
    vocabularyTooltip.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    vocabularyTooltip.style.borderRadius = '4px';
    vocabularyTooltip.style.padding = '5px 10px';
    vocabularyTooltip.style.fontSize = '14px';
    vocabularyTooltip.style.zIndex = '10002';
    vocabularyTooltip.style.display = 'none';
    
    document.body.appendChild(vocabularyTooltip);
  }
  
  // Update control panel with current settings
  function updateControlPanel() {
    const focusModeCheckbox = document.getElementById('accessibility-assistant-focus-mode') as HTMLInputElement;
    if (focusModeCheckbox) {
      focusModeCheckbox.checked = settings.focusModeEnabled;
    }
    
    const readingGuideCheckbox = document.getElementById('accessibility-assistant-reading-guide') as HTMLInputElement;
    if (readingGuideCheckbox) {
      readingGuideCheckbox.checked = settings.readingGuideEnabled;
    }
    
    const simplifiedPageCheckbox = document.getElementById('accessibility-assistant-simplified-page') as HTMLInputElement;
    if (simplifiedPageCheckbox) {
      simplifiedPageCheckbox.checked = settings.simplifiedPageEnabled;
    }
    
    const readingAidsCheckbox = document.getElementById('accessibility-assistant-reading-aids') as HTMLInputElement;
    if (readingAidsCheckbox) {
      readingAidsCheckbox.checked = settings.readingAidsEnabled;
    }
    
    const highlightLinksCheckbox = document.getElementById('accessibility-assistant-highlight-links') as HTMLInputElement;
    if (highlightLinksCheckbox) {
      highlightLinksCheckbox.checked = settings.highlightLinksEnabled;
    }
    
    const textToSpeechCheckbox = document.getElementById('accessibility-assistant-text-to-speech') as HTMLInputElement;
    if (textToSpeechCheckbox) {
      textToSpeechCheckbox.checked = settings.textToSpeechEnabled;
    }
    
    const vocabularyCheckbox = document.getElementById('accessibility-assistant-vocabulary') as HTMLInputElement;
    if (vocabularyCheckbox) {
      vocabularyCheckbox.checked = settings.vocabularySimplificationEnabled;
    }
    
    const readingSpeedSlider = document.getElementById('accessibility-assistant-reading-speed') as HTMLInputElement;
    if (readingSpeedSlider) {
      readingSpeedSlider.value = settings.readingSpeed.toString();
      const label = document.querySelector('label[for="accessibility-assistant-reading-speed"]');
      if (label) {
        label.textContent = `Reading Speed: ${settings.readingSpeed} WPM`;
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
  
  // Toggle control panel
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
  
  // Apply current settings
  function applySettings() {
    // Focus mode
    if (settings.focusModeEnabled) {
      enableFocusMode();
    } else {
      disableFocusMode();
    }
    
    // Reading guide
    if (settings.readingGuideEnabled) {
      enableReadingGuide();
    } else {
      disableReadingGuide();
    }
    
    // Simplified page
    if (settings.simplifiedPageEnabled) {
      enableSimplifiedPage();
    } else {
      disableSimplifiedPage();
    }
    
    // Reading aids
    if (settings.readingAidsEnabled) {
      enableReadingAids();
    } else {
      disableReadingAids();
    }
    
    // Highlight links
    if (settings.highlightLinksEnabled) {
      highlightLinks();
    } else {
      unhighlightLinks();
    }
    
    // Vocabulary simplification
    if (settings.vocabularySimplificationEnabled) {
      enableVocabularySimplification();
    } else {
      disableVocabularySimplification();
    }
  }
  
  // Set up event listeners
  function setupEventListeners() {
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Alt+C: Toggle cognitive settings panel
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        toggleControlPanel();
      }
      
      // Alt+F: Toggle focus mode
      if (e.altKey && e.key === 'f') {
        e.preventDefault();
        settings.focusModeEnabled = !settings.focusModeEnabled;
        applySettings();
        saveSettings();
      }
      
      // Alt+R: Toggle reading guide
      if (e.altKey && e.key === 'r') {
        e.preventDefault();
        settings.readingGuideEnabled = !settings.readingGuideEnabled;
        applySettings();
        saveSettings();
      }
      
      // Alt+S: Toggle simplified page
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        settings.simplifiedPageEnabled = !settings.simplifiedPageEnabled;
        applySettings();
        saveSettings();
      }
    });
  }
  
  // Initialize features based on settings
  function initializeFeatures() {
    if (settings.focusModeEnabled) {
      enableFocusMode();
    }
    
    if (settings.readingGuideEnabled) {
      enableReadingGuide();
    }
    
    if (settings.simplifiedPageEnabled) {
      enableSimplifiedPage();
    }
    
    if (settings.readingAidsEnabled) {
      enableReadingAids();
    }
    
    if (settings.highlightLinksEnabled) {
      highlightLinks();
    }
    
    if (settings.vocabularySimplificationEnabled) {
      enableVocabularySimplification();
    }
  }
  
  // Enable focus mode
  function enableFocusMode() {
    if (isFocusModeActive || !focusModeOverlay) return;
    
    // Save current scroll position
    const scrollY = window.scrollY;
    
    // Show overlay
    focusModeOverlay.style.display = 'block';
    
    // Create focused paragraph highlight
    const styleElement = document.createElement('style');
    styleElement.id = 'accessibility-assistant-focus-styles';
    styleElement.textContent = `
      #accessibility-assistant-focus-overlay {
        mask-image: linear-gradient(transparent, transparent);
        -webkit-mask-image: linear-gradient(transparent, transparent);
        mask-size: 100% 100%;
        -webkit-mask-size: 100% 100%;
        mask-position: center center;
        -webkit-mask-position: center center;
        mask-repeat: no-repeat;
        -webkit-mask-repeat: no-repeat;
      }
      
      p, h1, h2, h3, h4, h5, h6, li {
        position: relative;
        z-index: 2;
      }
    `;
    document.head.appendChild(styleElement);
    
    // Create mouse move handler
    function handleFocusedElement() {
      // Find element at current mouse position or in the center of viewport
      const y = lastMouseY || window.innerHeight / 2;
      const x = window.innerWidth / 2;
      
      // Get element at position
      const element = document.elementFromPoint(x, y) as HTMLElement | null;
      
      if (element) {
        // Find parent paragraph, heading, or list item
        let focusTarget = element;
        let parent = element.parentElement;
        
        // Climb up DOM tree to find focusable element
        while (parent && !['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'ARTICLE', 'SECTION'].includes(focusTarget.tagName)) {
          focusTarget = parent;
          parent = parent.parentElement;
          if (!parent) break;
        }
        
        // Make a "spotlight" on this element
        const rect = focusTarget.getBoundingClientRect();
        
        // Add some padding around the element
        const padding = 20;
        const maskWidth = rect.width + (padding * 2);
        const maskHeight = rect.height + (padding * 2);
        const maskTop = rect.top + window.scrollY - padding;
        const maskLeft = rect.left - padding;
        
        // Apply mask to overlay
        if (focusModeOverlay) {
          focusModeOverlay.style.webkitMaskImage = `radial-gradient(ellipse at ${maskLeft + maskWidth/2}px ${maskTop + maskHeight/2}px, transparent ${maskWidth/2}px, black ${maskWidth/2 + 100}px)`;
          focusModeOverlay.style.maskImage = `radial-gradient(ellipse at ${maskLeft + maskWidth/2}px ${maskTop + maskHeight/2}px, transparent ${maskWidth/2}px, black ${maskWidth/2 + 100}px)`;
        }
      }
    }
    
    // Listen to mouse movement to update focus
    mouseMoveHandler = (e: MouseEvent) => {
      lastMouseY = e.clientY;
      handleFocusedElement();
    };
    
    // Listen to scroll to update focus
    scrollHandler = () => {
      handleFocusedElement();
    };
    
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('scroll', scrollHandler);
    
    // Initial focus
    handleFocusedElement();
    
    // Restore scroll position
    window.scrollTo({
      top: scrollY
    });
    
    isFocusModeActive = true;
  }
  
  // Disable focus mode
  function disableFocusMode() {
    if (!isFocusModeActive || !focusModeOverlay) return;
    
    // Hide overlay
    focusModeOverlay.style.display = 'none';
    
    // Remove styles
    const styleElement = document.getElementById('accessibility-assistant-focus-styles');
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
    }
    
    // Remove event listeners
    if (mouseMoveHandler) {
      document.removeEventListener('mousemove', mouseMoveHandler);
      mouseMoveHandler = null;
    }
    
    if (scrollHandler) {
      document.removeEventListener('scroll', scrollHandler);
      scrollHandler = null;
    }
    
    isFocusModeActive = false;
  }
  
  // Enable reading guide
  function enableReadingGuide() {
    if (isReadingGuideActive || !readingGuide) return;
    
    // Show reading guide
    readingGuide.style.display = 'block';
    
    // Create mouse move handler
    mouseMoveHandler = (e: MouseEvent) => {
      if (readingGuide) {
        readingGuide.style.top = `${e.clientY - 15}px`;
      }
    };
    
    // Listen to mouse movement
    document.addEventListener('mousemove', mouseMoveHandler);
    
    isReadingGuideActive = true;
  }
  
  // Disable reading guide
  function disableReadingGuide() {
    if (!isReadingGuideActive || !readingGuide) return;
    
    // Hide reading guide
    readingGuide.style.display = 'none';
    
    // Remove event listener
    if (mouseMoveHandler) {
      document.removeEventListener('mousemove', mouseMoveHandler);
      mouseMoveHandler = null;
    }
    
    isReadingGuideActive = false;
  }
  
  // Enable simplified page view
  function enableSimplifiedPage() {
    if (isSimplifiedPageActive) return;
    
    // Save original page content if we haven't yet
    if (!originalPageContent) {
      originalPageContent = document.body.innerHTML;
    }
    
    // Request page summary from background
    chrome.runtime.sendMessage({
      type: 'SUMMARIZE_PAGE',
      payload: {
        url: window.location.href,
        title: document.title,
        content: document.body.innerText
      }
    }, (response) => {
      if (response && response.summary) {
        createSimplifiedPage(response.summary);
      } else {
        // Fallback to simplified view without AI summary
        createSimplifiedPageFallback();
      }
    });
  }
  
  // Create simplified page with AI summary
  function createSimplifiedPage(summary: PageSummary) {
    // Create simplified page container
    if (!simplifiedPageContainer) {
      simplifiedPageContainer = document.createElement('div');
      simplifiedPageContainer.id = 'accessibility-assistant-simplified-page';
      simplifiedPageContainer.style.position = 'fixed';
      simplifiedPageContainer.style.top = '0';
      simplifiedPageContainer.style.left = '0';
      simplifiedPageContainer.style.width = '100%';
      simplifiedPageContainer.style.height = '100%';
      simplifiedPageContainer.style.backgroundColor = '#f9f9f9';
      simplifiedPageContainer.style.zIndex = '10000';
      simplifiedPageContainer.style.padding = '20px';
      simplifiedPageContainer.style.boxSizing = 'border-box';
      simplifiedPageContainer.style.overflow = 'auto';
      
      document.body.appendChild(simplifiedPageContainer);
    }
    
    // Create simplified content
    let linksHTML = '';
    if (summary.links.length > 0) {
      linksHTML = `
        <div class="simplified-links">
          <h3>Important Links:</h3>
          <ul>
            ${summary.links.slice(0, 5).map(link => `<li><a href="${link.url}">${link.text}</a></li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    let readingTime = summary.readingTime > 0 ? `<p>Reading time: ${Math.ceil(summary.readingTime)} minute${summary.readingTime > 1 ? 's' : ''}</p>` : '';
    
    simplifiedPageContainer.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h1 style="margin: 0;">${summary.title}</h1>
          <button id="accessibility-assistant-simplified-close" style="background: none; border: none; cursor: pointer; font-size: 18px;">×</button>
        </div>
        
        ${readingTime}
        
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h2>Summary:</h2>
          <ul>
            ${summary.keyPoints.map(point => `<li>${point}</li>`).join('')}
          </ul>
        </div>
        
        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
          <div style="flex: 2;">
            <h2>Main Content:</h2>
            <div style="font-size: 18px; line-height: 1.8;">
              ${summary.mainContent}
            </div>
          </div>
          
          <div style="flex: 1;">
            ${linksHTML}
            
            ${summary.images.length > 0 ? `
              <div class="simplified-images">
                <h3>Images:</h3>
                <ul>
                  ${summary.images.slice(0, 3).map(image => `<li>${image.alt}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <button id="accessibility-assistant-view-original" style="padding: 8px 16px; background-color: #0078FF; color: white; border: none; border-radius: 4px; cursor: pointer;">
            View Original Page
          </button>
        </div>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('accessibility-assistant-simplified-close')?.addEventListener('click', disableSimplifiedPage);
    document.getElementById('accessibility-assistant-view-original')?.addEventListener('click', disableSimplifiedPage);
    
    isSimplifiedPageActive = true;
  }
  
  // Create simplified page fallback (without AI)
  function createSimplifiedPageFallback() {
    // Create simplified page container
    if (!simplifiedPageContainer) {
      simplifiedPageContainer = document.createElement('div');
      simplifiedPageContainer.id = 'accessibility-assistant-simplified-page';
      simplifiedPageContainer.style.position = 'fixed';
      simplifiedPageContainer.style.top = '0';
      simplifiedPageContainer.style.left = '0';
      simplifiedPageContainer.style.width = '100%';
      simplifiedPageContainer.style.height = '100%';
      simplifiedPageContainer.style.backgroundColor = '#f9f9f9';
      simplifiedPageContainer.style.zIndex = '10000';
      simplifiedPageContainer.style.padding = '20px';
      simplifiedPageContainer.style.boxSizing = 'border-box';
      simplifiedPageContainer.style.overflow = 'auto';
      
      document.body.appendChild(simplifiedPageContainer);
    }
    
    // Extract content from page
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
    const mainHeadings = headings.slice(0, 5).map(h => h.textContent || '').filter(Boolean);
    
    const paragraphs = Array.from(document.querySelectorAll('p')).map(p => p.textContent || '').filter(Boolean);
    const mainParagraphs = paragraphs.slice(0, 10);
    
    const links = Array.from(document.querySelectorAll('a')).slice(0, 5).map(a => {
      return {
        text: a.textContent || '',
        url: a.href
      };
    });
    
    // Create simplified content
    let linksHTML = '';
    if (links.length > 0) {
      linksHTML = `
        <div class="simplified-links">
          <h3>Important Links:</h3>
          <ul>
            ${links.map(link => `<li><a href="${link.url}">${link.text}</a></li>`).join('')}
          </ul>
        </div>
      `;
    }
    
    simplifiedPageContainer.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h1 style="margin: 0;">${document.title}</h1>
          <button id="accessibility-assistant-simplified-close" style="background: none; border: none; cursor: pointer; font-size: 18px;">×</button>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h2>Main Headings:</h2>
          <ul>
            ${mainHeadings.map(heading => `<li>${heading}</li>`).join('')}
          </ul>
        </div>
        
        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
          <div style="flex: 2;">
            <h2>Main Content:</h2>
            <div style="font-size: 18px; line-height: 1.8;">
              ${mainParagraphs.map(p => `<p>${p}</p>`).join('')}
            </div>
          </div>
          
          <div style="flex: 1;">
            ${linksHTML}
          </div>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <button id="accessibility-assistant-view-original" style="padding: 8px 16px; background-color: #0078FF; color: white; border: none; border-radius: 4px; cursor: pointer;">
            View Original Page
          </button>
        </div>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('accessibility-assistant-simplified-close')?.addEventListener('click', disableSimplifiedPage);
    document.getElementById('accessibility-assistant-view-original')?.addEventListener('click', disableSimplifiedPage);
    
    isSimplifiedPageActive = true;
  }
  
  // Disable simplified page
  function disableSimplifiedPage() {
    if (!isSimplifiedPageActive || !simplifiedPageContainer) return;
    
    // Remove simplified page container
    if (simplifiedPageContainer.parentNode) {
      simplifiedPageContainer.parentNode.removeChild(simplifiedPageContainer);
      simplifiedPageContainer = null;
    }
    
    isSimplifiedPageActive = false;
  }
  
  // Enable reading aids
  function enableReadingAids() {
    // Add bionic reading styles
    const styleElement = document.createElement('style');
    styleElement.id = 'accessibility-assistant-reading-aids-styles';
    styleElement.textContent = `
      p, li, h1, h2, h3, h4, h5, h6 {
        word-spacing: 0.16em;
        letter-spacing: 0.05em;
      }
    `;
    document.head.appendChild(styleElement);
    
    // Find all paragraphs and apply bionic reading
    const paragraphs = document.querySelectorAll('p, li');
    
    paragraphs.forEach(paragraph => {
      if (!paragraph.classList.contains('accessibility-assistant-processed')) {
        const text = paragraph.textContent || '';
        const words = text.split(' ');
        
        // Create bionic reading by bolding the first half of each word
        const bionicHTML = words.map(word => {
          if (word.length <= 1) return word;
          
          const boldLength = Math.ceil(word.length * 0.5);
          return `<span style="font-weight: bold;">${word.substring(0, boldLength)}</span>${word.substring(boldLength)}`;
        }).join(' ');
        
        paragraph.innerHTML = bionicHTML;
        paragraph.classList.add('accessibility-assistant-processed');
      }
    });
  }
  
  // Disable reading aids
  function disableReadingAids() {
    // Remove bionic reading styles
    const styleElement = document.getElementById('accessibility-assistant-reading-aids-styles');
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
    }
    
    // Find all processed paragraphs and restore original content
    const processedElements = document.querySelectorAll('.accessibility-assistant-processed');
    processedElements.forEach(element => {
      element.classList.remove('accessibility-assistant-processed');
    });
    
    // Since we can't easily restore the original content without storing it,
    // we'll rely on reloading or simplified view toggling to reset the content
  }
  
  // Highlight links
  function highlightLinks() {
    const styleElement = document.createElement('style');
    styleElement.id = 'accessibility-assistant-highlight-links-styles';
    styleElement.textContent = `
      a {
        background-color: #e6f7ff !important;
        border-bottom: 2px solid #1890ff !important;
        padding: 0 2px !important;
        border-radius: 2px !important;
        font-weight: bold !important;
        text-decoration: none !important;
      }
      
      a:hover {
        background-color: #bae7ff !important;
      }
      
      a:focus {
        outline: 3px solid #69c0ff !important;
      }
    `;
    document.head.appendChild(styleElement);
  }
  
  // Unhighlight links
  function unhighlightLinks() {
    const styleElement = document.getElementById('accessibility-assistant-highlight-links-styles');
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
    }
  }
  
  // Enable vocabulary simplification
  function enableVocabularySimplification() {
    // Find all text nodes
    const allTextNodes = getAllTextNodes(document.body);
    
    // Process each text node
    allTextNodes.forEach(node => {
      let text = node.nodeValue || '';
      let isChanged = false;
      
      // Check for complex words
      complexWords.forEach((simple, complex) => {
        const regex = new RegExp(`\\b${complex}\\b`, 'gi');
        if (regex.test(text)) {
          text = text.replace(regex, (match) => {
            isChanged = true;
            return simple;
          });
        }
      });
      
      // Update node if changed
      if (isChanged) {
        node.nodeValue = text;
      }
    });
    
    // Add tooltip styles
    const styleElement = document.createElement('style');
    styleElement.id = 'accessibility-assistant-vocabulary-styles';
    styleElement.textContent = `
      .accessibility-assistant-simplified {
        background-color: #e8f5e9;
        border-bottom: 1px dotted #4caf50;
        cursor: help;
      }
    `;
    document.head.appendChild(styleElement);
  }
  
  // Get all text nodes in the document
  function getAllTextNodes(node: Node): Text[] {
    const allNodes: Text[] = [];
    
    function getTextNodes(node: Node) {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue && node.nodeValue.trim() !== '') {
        allNodes.push(node as Text);
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          getTextNodes(node.childNodes[i]);
        }
      }
    }
    
    getTextNodes(node);
    return allNodes;
  }
  
  // Disable vocabulary simplification
  function disableVocabularySimplification() {
    // Remove vocabulary styles
    const styleElement = document.getElementById('accessibility-assistant-vocabulary-styles');
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
    }
    
    // Remove simplified spans
    const simplifiedSpans = document.querySelectorAll('.accessibility-assistant-simplified');
    simplifiedSpans.forEach(span => {
      const parent = span.parentNode;
      const text = span.textContent || '';
      if (parent) {
        const textNode = document.createTextNode(text);
        parent.replaceChild(textNode, span);
      }
    });
    
    // To fully restore original text, we'd need to reload the page
    // Since we can't store all original text efficiently
  }
  
  // Clean up resources
  function cleanup() {
    disableFocusMode();
    disableReadingGuide();
    disableSimplifiedPage();
    disableReadingAids();
    unhighlightLinks();
    disableVocabularySimplification();
    
    // Remove UI elements
    if (controlPanel && controlPanel.parentNode) {
      controlPanel.parentNode.removeChild(controlPanel);
    }
    
    if (readingGuide && readingGuide.parentNode) {
      readingGuide.parentNode.removeChild(readingGuide);
    }
    
    if (focusModeOverlay && focusModeOverlay.parentNode) {
      focusModeOverlay.parentNode.removeChild(focusModeOverlay);
    }
    
    if (simplifiedPageContainer && simplifiedPageContainer.parentNode) {
      simplifiedPageContainer.parentNode.removeChild(simplifiedPageContainer);
    }
    
    if (vocabularyTooltip && vocabularyTooltip.parentNode) {
      vocabularyTooltip.parentNode.removeChild(vocabularyTooltip);
    }
  }
  
  // Initialize
  initialize();
  
  // Public API
  return {
    showControlPanel,
    hideControlPanel,
    toggleControlPanel,
    enableFocusMode,
    disableFocusMode,
    toggleFocusMode: () => {
      settings.focusModeEnabled = !settings.focusModeEnabled;
      applySettings();
      saveSettings();
    },
    enableReadingGuide,
    disableReadingGuide,
    toggleReadingGuide: () => {
      settings.readingGuideEnabled = !settings.readingGuideEnabled;
      applySettings();
      saveSettings();
    },
    enableSimplifiedPage,
    disableSimplifiedPage,
    toggleSimplifiedPage: () => {
      settings.simplifiedPageEnabled = !settings.simplifiedPageEnabled;
      applySettings();
      saveSettings();
    },
    resetToDefaults,
    applySettings,
    cleanup
  };
}

export default createCognitiveAssistant;