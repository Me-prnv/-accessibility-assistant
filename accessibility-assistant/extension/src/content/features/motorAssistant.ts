// Motor Assistant Module for Accessibility Assistant
// Provides features for users with motor disabilities, including voice control, dwell clicking, and keyboard navigation

// Types
interface MotorAssistantSettings {
  enableDwellClicking: boolean;
  dwellTime: number; // in milliseconds
  enableMouseTracking: boolean;
  enhanceKeyboardNavigation: boolean;
  enableVoiceControl: boolean;
  showClickableElements: boolean;
  autoFillForms: boolean;
  enableGestures: boolean;
  enableSwitchControl: boolean;
}

// Default settings
const defaultSettings: MotorAssistantSettings = {
  enableDwellClicking: false,
  dwellTime: 1000, // 1 second
  enableMouseTracking: false,
  enhanceKeyboardNavigation: true,
  enableVoiceControl: false,
  showClickableElements: true,
  autoFillForms: true,
  enableGestures: false,
  enableSwitchControl: false
};

// Initialize motor assistant
export function createMotorAssistant(options: Partial<MotorAssistantSettings> = {}) {
  // Merge default settings with provided options
  const settings: MotorAssistantSettings = {
    ...defaultSettings,
    ...options
  };
  
  // State variables
  let cursorPosition = { x: 0, y: 0 };
  let dwellTimer: NodeJS.Timeout | null = null;
  let currentHoverElement: HTMLElement | null = null;
  let keyboardNavigationMode = false;
  let keyboardFocusedElement: HTMLElement | null = null;
  
  // UI Elements
  let cursorOverlay: HTMLDivElement | null = null;
  let dwellIndicator: HTMLDivElement | null = null;
  let keyboardNavigationIndicator: HTMLDivElement | null = null;
  let controlPanel: HTMLDivElement | null = null;
  
  // Event handlers
  let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  let keyboardHandler: ((e: KeyboardEvent) => void) | null = null;
  
  // Initialize
  function initialize() {
    // Load settings from storage
    loadSettings();
    
    // Create UI elements
    if (settings.enableDwellClicking || settings.enableMouseTracking) {
      createCursorOverlay();
    }
    
    // Set up event handlers
    setupEventHandlers();
    
    // Apply settings
    applySettings();
    
    // Enhance keyboard navigation
    if (settings.enhanceKeyboardNavigation) {
      enhanceKeyboardNavigation();
    }
    
    // Create control panel
    createControlPanel();
    
    // Highlight clickable elements
    if (settings.showClickableElements) {
      highlightClickableElements();
    }
    
    // Enhanced form controls
    if (settings.autoFillForms) {
      enhanceFormControls();
    }
  }
  
  // Load saved settings from storage
  function loadSettings() {
    chrome.storage.sync.get('motorAssistant', (data) => {
      if (data.motorAssistant) {
        // Merge saved settings with current settings
        Object.assign(settings, data.motorAssistant);
        applySettings();
      }
    });
  }
  
  // Save settings to storage
  function saveSettings() {
    chrome.storage.sync.set({
      motorAssistant: settings
    });
  }
  
  // Apply current settings
  function applySettings() {
    // Apply dwell clicking
    if (settings.enableDwellClicking) {
      enableDwellClicking();
    } else {
      disableDwellClicking();
    }
    
    // Apply cursor tracking
    if (settings.enableMouseTracking) {
      enableMouseTracking();
    } else {
      disableMouseTracking();
    }
    
    // Apply keyboard navigation enhancements
    if (settings.enhanceKeyboardNavigation) {
      enhanceKeyboardNavigation();
    } else {
      disableKeyboardNavigation();
    }
    
    // Apply clickable elements highlighting
    if (settings.showClickableElements) {
      highlightClickableElements();
    } else {
      unhighlightClickableElements();
    }
    
    // Update control panel if it exists
    if (controlPanel) {
      updateControlPanel();
    }
  }
  
  // Create cursor overlay for dwell clicking and mouse tracking
  function createCursorOverlay() {
    // Create container
    cursorOverlay = document.createElement('div');
    cursorOverlay.id = 'accessibility-assistant-cursor-overlay';
    cursorOverlay.style.position = 'fixed';
    cursorOverlay.style.pointerEvents = 'none';
    cursorOverlay.style.zIndex = '9999';
    cursorOverlay.style.width = '20px';
    cursorOverlay.style.height = '20px';
    cursorOverlay.style.borderRadius = '50%';
    cursorOverlay.style.backgroundColor = 'rgba(0, 120, 255, 0.3)';
    cursorOverlay.style.border = '1px solid rgba(0, 120, 255, 0.7)';
    cursorOverlay.style.transform = 'translate(-50%, -50%)';
    cursorOverlay.style.display = 'none';
    document.body.appendChild(cursorOverlay);
    
    // Create dwell indicator
    dwellIndicator = document.createElement('div');
    dwellIndicator.id = 'accessibility-assistant-dwell-indicator';
    dwellIndicator.style.position = 'fixed';
    dwellIndicator.style.pointerEvents = 'none';
    dwellIndicator.style.zIndex = '9999';
    dwellIndicator.style.width = '30px';
    dwellIndicator.style.height = '30px';
    dwellIndicator.style.borderRadius = '50%';
    dwellIndicator.style.border = '2px solid rgba(0, 120, 255, 0.7)';
    dwellIndicator.style.borderTop = '2px solid transparent';
    dwellIndicator.style.transform = 'translate(-50%, -50%)';
    dwellIndicator.style.display = 'none';
    dwellIndicator.style.animation = 'accessibility-assistant-spin 1s linear infinite';
    document.body.appendChild(dwellIndicator);
    
    // Add animation style
    const style = document.createElement('style');
    style.textContent = `
      @keyframes accessibility-assistant-spin {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Create control panel for motor accessibility settings
  function createControlPanel() {
    controlPanel = document.createElement('div');
    controlPanel.id = 'accessibility-assistant-motor-panel';
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
        <h2 style="margin: 0; font-size: 16px;">Motor Accessibility Settings</h2>
        <button id="accessibility-assistant-motor-close" style="background: none; border: none; cursor: pointer; font-size: 18px;">×</button>
      </div>
      
      <div style="margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-dwell-clicking">Dwell Clicking</label>
          <input type="checkbox" id="accessibility-assistant-dwell-clicking" ${settings.enableDwellClicking ? 'checked' : ''}>
        </div>
        
        <div style="margin-bottom: 10px;">
          <label for="accessibility-assistant-dwell-time">Dwell Time: ${settings.dwellTime}ms</label>
          <input type="range" id="accessibility-assistant-dwell-time" min="500" max="3000" step="100" value="${settings.dwellTime}" style="width: 100%;">
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-mouse-tracking">Mouse Tracking</label>
          <input type="checkbox" id="accessibility-assistant-mouse-tracking" ${settings.enableMouseTracking ? 'checked' : ''}>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-keyboard-nav">Enhanced Keyboard Navigation</label>
          <input type="checkbox" id="accessibility-assistant-keyboard-nav" ${settings.enhanceKeyboardNavigation ? 'checked' : ''}>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-highlight-clickable">Highlight Clickable Elements</label>
          <input type="checkbox" id="accessibility-assistant-highlight-clickable" ${settings.showClickableElements ? 'checked' : ''}>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-autofill-forms">Auto-Fill Forms Support</label>
          <input type="checkbox" id="accessibility-assistant-autofill-forms" ${settings.autoFillForms ? 'checked' : ''}>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button id="accessibility-assistant-motor-reset" style="padding: 5px 10px; cursor: pointer;">Reset to Default</button>
        <button id="accessibility-assistant-motor-apply" style="padding: 5px 10px; cursor: pointer; background-color: #0078FF; color: white; border: none; border-radius: 4px;">Apply Settings</button>
      </div>
    `;
    
    document.body.appendChild(controlPanel);
    
    // Add event listeners to controls
    document.getElementById('accessibility-assistant-motor-close')?.addEventListener('click', () => {
      hideControlPanel();
    });
    
    document.getElementById('accessibility-assistant-dwell-clicking')?.addEventListener('change', (e) => {
      settings.enableDwellClicking = (e.target as HTMLInputElement).checked;
    });
    
    document.getElementById('accessibility-assistant-dwell-time')?.addEventListener('input', (e) => {
      settings.dwellTime = parseInt((e.target as HTMLInputElement).value);
      const label = document.querySelector('label[for="accessibility-assistant-dwell-time"]');
      if (label) {
        label.textContent = `Dwell Time: ${settings.dwellTime}ms`;
      }
    });
    
    document.getElementById('accessibility-assistant-mouse-tracking')?.addEventListener('change', (e) => {
      settings.enableMouseTracking = (e.target as HTMLInputElement).checked;
    });
    
    document.getElementById('accessibility-assistant-keyboard-nav')?.addEventListener('change', (e) => {
      settings.enhanceKeyboardNavigation = (e.target as HTMLInputElement).checked;
    });
    
    document.getElementById('accessibility-assistant-highlight-clickable')?.addEventListener('change', (e) => {
      settings.showClickableElements = (e.target as HTMLInputElement).checked;
    });
    
    document.getElementById('accessibility-assistant-autofill-forms')?.addEventListener('change', (e) => {
      settings.autoFillForms = (e.target as HTMLInputElement).checked;
    });
    
    document.getElementById('accessibility-assistant-motor-reset')?.addEventListener('click', resetToDefaults);
    
    document.getElementById('accessibility-assistant-motor-apply')?.addEventListener('click', () => {
      applySettings();
      saveSettings();
      hideControlPanel();
    });
  }
  
  // Update control panel with current settings
  function updateControlPanel() {
    if (!controlPanel) return;
    
    const dwellClickingCheckbox = document.getElementById('accessibility-assistant-dwell-clicking') as HTMLInputElement;
    if (dwellClickingCheckbox) {
      dwellClickingCheckbox.checked = settings.enableDwellClicking;
    }
    
    const dwellTimeInput = document.getElementById('accessibility-assistant-dwell-time') as HTMLInputElement;
    if (dwellTimeInput) {
      dwellTimeInput.value = settings.dwellTime.toString();
      const label = document.querySelector('label[for="accessibility-assistant-dwell-time"]');
      if (label) {
        label.textContent = `Dwell Time: ${settings.dwellTime}ms`;
      }
    }
    
    const mouseTrackingCheckbox = document.getElementById('accessibility-assistant-mouse-tracking') as HTMLInputElement;
    if (mouseTrackingCheckbox) {
      mouseTrackingCheckbox.checked = settings.enableMouseTracking;
    }
    
    const keyboardNavCheckbox = document.getElementById('accessibility-assistant-keyboard-nav') as HTMLInputElement;
    if (keyboardNavCheckbox) {
      keyboardNavCheckbox.checked = settings.enhanceKeyboardNavigation;
    }
    
    const highlightClickableCheckbox = document.getElementById('accessibility-assistant-highlight-clickable') as HTMLInputElement;
    if (highlightClickableCheckbox) {
      highlightClickableCheckbox.checked = settings.showClickableElements;
    }
    
    const autoFillFormsCheckbox = document.getElementById('accessibility-assistant-autofill-forms') as HTMLInputElement;
    if (autoFillFormsCheckbox) {
      autoFillFormsCheckbox.checked = settings.autoFillForms;
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
    // Set up mouse move handler
    mouseMoveHandler = (e: MouseEvent) => {
      // Update cursor position
      cursorPosition.x = e.clientX;
      cursorPosition.y = e.clientY;
      
      // Update cursor overlay position
      if (cursorOverlay && settings.enableMouseTracking) {
        cursorOverlay.style.left = `${cursorPosition.x}px`;
        cursorOverlay.style.top = `${cursorPosition.y}px`;
      }
      
      // Update dwell indicator position
      if (dwellIndicator && settings.enableDwellClicking) {
        dwellIndicator.style.left = `${cursorPosition.x}px`;
        dwellIndicator.style.top = `${cursorPosition.y}px`;
      }
      
      // Handle dwell clicking
      if (settings.enableDwellClicking) {
        handleDwellClicking(e);
      }
    };
    
    // Set up keyboard handler
    keyboardHandler = (e: KeyboardEvent) => {
      // Handle keyboard navigation
      if (settings.enhanceKeyboardNavigation) {
        handleKeyboardNavigation(e);
      }
      
      // Alt+M to toggle control panel
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        toggleControlPanel();
      }
    };
    
    // Add event listeners
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('keydown', keyboardHandler);
  }
  
  // Enable dwell clicking
  function enableDwellClicking() {
    if (cursorOverlay) {
      cursorOverlay.style.display = 'block';
    }
    
    if (dwellIndicator) {
      dwellIndicator.style.display = 'none'; // Only show during actual dwell
    }
  }
  
  // Disable dwell clicking
  function disableDwellClicking() {
    if (dwellIndicator) {
      dwellIndicator.style.display = 'none';
    }
    
    // Clear any existing dwell timer
    if (dwellTimer) {
      clearTimeout(dwellTimer);
      dwellTimer = null;
    }
    
    // Hide cursor overlay if mouse tracking is also disabled
    if (cursorOverlay && !settings.enableMouseTracking) {
      cursorOverlay.style.display = 'none';
    }
  }
  
  // Handle dwell clicking logic
  function handleDwellClicking(e: MouseEvent) {
    // Get element under cursor
    const element = document.elementFromPoint(cursorPosition.x, cursorPosition.y) as HTMLElement;
    
    // If cursor moved to a different element, reset dwell timer
    if (element !== currentHoverElement) {
      if (dwellTimer) {
        clearTimeout(dwellTimer);
        dwellTimer = null;
      }
      
      if (dwellIndicator) {
        dwellIndicator.style.display = 'none';
      }
      
      currentHoverElement = element;
      
      // Only start timer for clickable elements
      if (element && isClickable(element)) {
        if (dwellIndicator) {
          dwellIndicator.style.display = 'block';
        }
        
        dwellTimer = setTimeout(() => {
          // Perform click
          element.click();
          
          // Hide indicator after click
          if (dwellIndicator) {
            dwellIndicator.style.display = 'none';
          }
          
          // Reset timer
          dwellTimer = null;
        }, settings.dwellTime);
      }
    }
  }
  
  // Enable mouse tracking
  function enableMouseTracking() {
    if (cursorOverlay) {
      cursorOverlay.style.display = 'block';
    }
  }
  
  // Disable mouse tracking
  function disableMouseTracking() {
    // Hide cursor overlay if dwell clicking is also disabled
    if (cursorOverlay && !settings.enableDwellClicking) {
      cursorOverlay.style.display = 'none';
    }
  }
  
  // Enhance keyboard navigation
  function enhanceKeyboardNavigation() {
    // Create keyboard navigation indicator if it doesn't exist
    if (!keyboardNavigationIndicator) {
      keyboardNavigationIndicator = document.createElement('div');
      keyboardNavigationIndicator.id = 'accessibility-assistant-keyboard-indicator';
      keyboardNavigationIndicator.style.position = 'fixed';
      keyboardNavigationIndicator.style.pointerEvents = 'none';
      keyboardNavigationIndicator.style.zIndex = '9998';
      keyboardNavigationIndicator.style.border = '2px solid #0078FF';
      keyboardNavigationIndicator.style.borderRadius = '3px';
      keyboardNavigationIndicator.style.display = 'none';
      document.body.appendChild(keyboardNavigationIndicator);
    }
    
    // Add tabindex to clickable elements that don't have one
    const clickableElements = document.querySelectorAll('a, button, [role="button"], input, select, textarea');
    clickableElements.forEach((element) => {
      if (!element.hasAttribute('tabindex') && isElementVisible(element as HTMLElement)) {
        element.setAttribute('tabindex', '0');
      }
    });
    
    // Add event listener for focus to update the indicator
    document.addEventListener('focus', (e) => {
      const target = e.target as HTMLElement;
      updateKeyboardNavigationIndicator(target);
    }, true);
  }
  
  // Disable keyboard navigation enhancements
  function disableKeyboardNavigation() {
    // Hide keyboard navigation indicator
    if (keyboardNavigationIndicator) {
      keyboardNavigationIndicator.style.display = 'none';
    }
  }
  
  // Update keyboard navigation indicator position
  function updateKeyboardNavigationIndicator(element: HTMLElement) {
    if (!keyboardNavigationIndicator || !element) return;
    
    // Get element dimensions and position
    const rect = element.getBoundingClientRect();
    
    // Update indicator position
    keyboardNavigationIndicator.style.left = `${rect.left - 3}px`;
    keyboardNavigationIndicator.style.top = `${rect.top - 3}px`;
    keyboardNavigationIndicator.style.width = `${rect.width + 6}px`;
    keyboardNavigationIndicator.style.height = `${rect.height + 6}px`;
    keyboardNavigationIndicator.style.display = 'block';
    
    // Store current focused element
    keyboardFocusedElement = element;
  }
  
  // Handle keyboard navigation
  function handleKeyboardNavigation(e: KeyboardEvent) {
    // Enter keyboard navigation mode with Tab key
    if (e.key === 'Tab') {
      keyboardNavigationMode = true;
      
      // Show keyboard navigation indicator if focused element is valid
      if (document.activeElement && document.activeElement !== document.body) {
        updateKeyboardNavigationIndicator(document.activeElement as HTMLElement);
      }
    }
    
    // Space or Enter to click in keyboard navigation mode
    if (keyboardNavigationMode && (e.key === ' ' || e.key === 'Enter') && keyboardFocusedElement) {
      // Don't interfere with inputs, textareas, etc.
      const tag = keyboardFocusedElement.tagName.toLowerCase();
      if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
        e.preventDefault();
        keyboardFocusedElement.click();
      }
    }
    
    // Escape to exit keyboard navigation mode
    if (e.key === 'Escape') {
      keyboardNavigationMode = false;
      if (keyboardNavigationIndicator) {
        keyboardNavigationIndicator.style.display = 'none';
      }
    }
  }
  
  // Highlight clickable elements
  function highlightClickableElements() {
    // Create a style element if it doesn't exist
    let styleElement = document.getElementById('accessibility-assistant-clickable-highlight') as HTMLStyleElement;
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'accessibility-assistant-clickable-highlight';
      document.head.appendChild(styleElement);
    }
    
    // Add CSS to highlight clickable elements
    styleElement.textContent = `
      a, button, [role="button"], input[type="submit"], input[type="button"], [tabindex]:not([tabindex="-1"]) {
        outline: 2px solid rgba(0, 120, 255, 0.5) !important;
        outline-offset: 2px !important;
      }
      
      a:hover, button:hover, [role="button"]:hover, input[type="submit"]:hover, input[type="button"]:hover, [tabindex]:not([tabindex="-1"]):hover {
        outline: 2px solid rgba(0, 120, 255, 0.8) !important;
        outline-offset: 2px !important;
      }
    `;
  }
  
  // Remove highlighting from clickable elements
  function unhighlightClickableElements() {
    const styleElement = document.getElementById('accessibility-assistant-clickable-highlight');
    if (styleElement) {
      styleElement.remove();
    }
  }
  
  // Enhance form controls
  function enhanceFormControls() {
    // Add support for autocomplete
    const formFields = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="password"], textarea');
    
    formFields.forEach((field) => {
      // Add autocomplete if not already set
      if (!field.hasAttribute('autocomplete')) {
        // Try to guess autocomplete type from field name or id
        const name = field.getAttribute('name')?.toLowerCase() || '';
        const id = field.getAttribute('id')?.toLowerCase() || '';
        const type = field.getAttribute('type')?.toLowerCase() || '';
        
        if (name.includes('email') || id.includes('email') || type === 'email') {
          field.setAttribute('autocomplete', 'email');
        } else if (name.includes('name') || id.includes('name')) {
          if (name.includes('first') || id.includes('first')) {
            field.setAttribute('autocomplete', 'given-name');
          } else if (name.includes('last') || id.includes('last')) {
            field.setAttribute('autocomplete', 'family-name');
          } else {
            field.setAttribute('autocomplete', 'name');
          }
        } else if (name.includes('phone') || id.includes('phone') || type === 'tel') {
          field.setAttribute('autocomplete', 'tel');
        } else if (name.includes('address') || id.includes('address')) {
          field.setAttribute('autocomplete', 'street-address');
        } else if (name.includes('city') || id.includes('city')) {
          field.setAttribute('autocomplete', 'address-level2');
        } else if (name.includes('zip') || id.includes('zip') || name.includes('postal') || id.includes('postal')) {
          field.setAttribute('autocomplete', 'postal-code');
        } else if (name.includes('country') || id.includes('country')) {
          field.setAttribute('autocomplete', 'country');
        } else {
          field.setAttribute('autocomplete', 'on');
        }
      }
    });
  }
  
  // Check if an element is clickable
  function isClickable(element: HTMLElement): boolean {
    // Check for standard clickable elements
    const clickableTagNames = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
    if (clickableTagNames.includes(element.tagName)) {
      return true;
    }
    
    // Check for role="button"
    if (element.getAttribute('role') === 'button') {
      return true;
    }
    
    // Check for elements with click event handlers
    if (element.onclick || element.getAttribute('onclick')) {
      return true;
    }
    
    // Check for elements with cursor: pointer style
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.cursor === 'pointer') {
      return true;
    }
    
    // Check for elements with tabindex
    if (element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '-1') {
      return true;
    }
    
    return false;
  }
  
  // Check if an element is visible
  function isElementVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0' &&
           element.offsetWidth > 0 &&
           element.offsetHeight > 0;
  }
  
  // Toggle dwell clicking
  function toggleDwellClicking() {
    settings.enableDwellClicking = !settings.enableDwellClicking;
    applySettings();
    saveSettings();
  }
  
  // Toggle mouse tracking
  function toggleMouseTracking() {
    settings.enableMouseTracking = !settings.enableMouseTracking;
    applySettings();
    saveSettings();
  }
  
  // Toggle keyboard navigation enhancement
  function toggleKeyboardNavigation() {
    settings.enhanceKeyboardNavigation = !settings.enhanceKeyboardNavigation;
    applySettings();
    saveSettings();
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
    
    // Remove UI elements
    if (cursorOverlay && cursorOverlay.parentNode) {
      cursorOverlay.parentNode.removeChild(cursorOverlay);
    }
    
    if (dwellIndicator && dwellIndicator.parentNode) {
      dwellIndicator.parentNode.removeChild(dwellIndicator);
    }
    
    if (keyboardNavigationIndicator && keyboardNavigationIndicator.parentNode) {
      keyboardNavigationIndicator.parentNode.removeChild(keyboardNavigationIndicator);
    }
    
    if (controlPanel && controlPanel.parentNode) {
      controlPanel.parentNode.removeChild(controlPanel);
    }
    
    // Remove clickable elements highlighting
    unhighlightClickableElements();
    
    // Clear any existing dwell timer
    if (dwellTimer) {
      clearTimeout(dwellTimer);
      dwellTimer = null;
    }
  }
  
  // Initialize
  initialize();
  
  // Return public API
  return {
    showControlPanel,
    hideControlPanel,
    toggleControlPanel,
    toggleDwellClicking,
    toggleMouseTracking,
    toggleKeyboardNavigation,
    cleanup
  };
}

export default createMotorAssistant; 