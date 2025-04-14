// Visual Assistant Module for Accessibility Assistant
// Provides visual accessibility features like color adjustments, zoom and image descriptions

// Types
interface VisualAssistantSettings {
  enableHighContrast: boolean;
  enableColorBlindMode: boolean;
  colorBlindType: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia' | 'none';
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  characterSpacing: number;
  imageDescriptions: boolean;
  zoomLevel: number;
}

// Default settings
const defaultSettings: VisualAssistantSettings = {
  enableHighContrast: false,
  enableColorBlindMode: false,
  colorBlindType: 'none',
  fontFamily: 'Arial, sans-serif',
  fontSize: 16,
  lineSpacing: 1.5,
  characterSpacing: 0,
  imageDescriptions: true,
  zoomLevel: 1.0
};

// Initialize visual assistant
export function createVisualAssistant(options: Partial<VisualAssistantSettings> = {}) {
  // Merge default settings with provided options
  const settings: VisualAssistantSettings = {
    ...defaultSettings,
    ...options
  };
  
  // Style element for accessibility styles
  let styleElement: HTMLStyleElement | null = null;
  
  // Keyboard shortcut handler
  let keyboardHandler: ((e: KeyboardEvent) => void) | null = null;
  
  // Create UI elements
  const controlPanel = createControlPanel();
  
  // Initialize
  function initialize() {
    // Apply current settings
    applySettings();
    
    // Set up keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Set up color overlay
    if (settings.enableHighContrast || settings.enableColorBlindMode) {
      setupColorOverlay();
    }
    
    // Enhance images with descriptions
    if (settings.imageDescriptions) {
      enhanceImages();
    }
    
    // Load settings from storage
    loadSettings();
  }
  
  // Load saved settings from storage
  function loadSettings() {
    chrome.storage.sync.get('visualAssistant', (data) => {
      if (data.visualAssistant) {
        // Merge saved settings with current settings
        Object.assign(settings, data.visualAssistant);
        applySettings();
        updateControlPanel();
      }
    });
  }
  
  // Save settings to storage
  function saveSettings() {
    chrome.storage.sync.set({
      visualAssistant: settings
    });
  }
  
  // Create control panel for visual accessibility settings
  function createControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'accessibility-assistant-visual-panel';
    panel.style.position = 'fixed';
    panel.style.top = '50px';
    panel.style.right = '20px';
    panel.style.width = '300px';
    panel.style.backgroundColor = 'white';
    panel.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    panel.style.borderRadius = '8px';
    panel.style.padding = '15px';
    panel.style.zIndex = '10000';
    panel.style.display = 'none';
    panel.style.maxHeight = '80vh';
    panel.style.overflowY = 'auto';
    
    // Add controls
    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h2 style="margin: 0; font-size: 16px;">Visual Accessibility Settings</h2>
        <button id="accessibility-assistant-visual-close" style="background: none; border: none; cursor: pointer; font-size: 18px;">×</button>
      </div>
      
      <div style="margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-high-contrast">High Contrast</label>
          <input type="checkbox" id="accessibility-assistant-high-contrast" ${settings.enableHighContrast ? 'checked' : ''}>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-color-blind">Color Blind Mode</label>
          <input type="checkbox" id="accessibility-assistant-color-blind" ${settings.enableColorBlindMode ? 'checked' : ''}>
        </div>
        
        <div style="margin-bottom: 10px;">
          <label for="accessibility-assistant-color-blind-type">Color Blind Type</label>
          <select id="accessibility-assistant-color-blind-type" style="width: 100%; margin-top: 5px; padding: 5px;" ${!settings.enableColorBlindMode ? 'disabled' : ''}>
            <option value="protanopia" ${settings.colorBlindType === 'protanopia' ? 'selected' : ''}>Protanopia (Red-Blind)</option>
            <option value="deuteranopia" ${settings.colorBlindType === 'deuteranopia' ? 'selected' : ''}>Deuteranopia (Green-Blind)</option>
            <option value="tritanopia" ${settings.colorBlindType === 'tritanopia' ? 'selected' : ''}>Tritanopia (Blue-Blind)</option>
            <option value="achromatopsia" ${settings.colorBlindType === 'achromatopsia' ? 'selected' : ''}>Achromatopsia (No Color)</option>
          </select>
        </div>
      </div>
      
      <div style="margin-bottom: 15px;">
        <h3 style="font-size: 14px; margin-bottom: 10px;">Text Settings</h3>
        
        <div style="margin-bottom: 10px;">
          <label for="accessibility-assistant-font-family">Font Family</label>
          <select id="accessibility-assistant-font-family" style="width: 100%; margin-top: 5px; padding: 5px;">
            <option value="Arial, sans-serif" ${settings.fontFamily === 'Arial, sans-serif' ? 'selected' : ''}>Arial (Sans-serif)</option>
            <option value="Times New Roman, serif" ${settings.fontFamily === 'Times New Roman, serif' ? 'selected' : ''}>Times New Roman (Serif)</option>
            <option value="OpenDyslexic, sans-serif" ${settings.fontFamily === 'OpenDyslexic, sans-serif' ? 'selected' : ''}>OpenDyslexic</option>
            <option value="Comic Sans MS, sans-serif" ${settings.fontFamily === 'Comic Sans MS, sans-serif' ? 'selected' : ''}>Comic Sans MS</option>
          </select>
        </div>
        
        <div style="margin-bottom: 10px;">
          <label for="accessibility-assistant-font-size">Font Size: ${settings.fontSize}px</label>
          <input type="range" id="accessibility-assistant-font-size" min="12" max="32" value="${settings.fontSize}" style="width: 100%;">
        </div>
        
        <div style="margin-bottom: 10px;">
          <label for="accessibility-assistant-line-spacing">Line Spacing: ${settings.lineSpacing}</label>
          <input type="range" id="accessibility-assistant-line-spacing" min="1" max="3" step="0.1" value="${settings.lineSpacing}" style="width: 100%;">
        </div>
        
        <div style="margin-bottom: 10px;">
          <label for="accessibility-assistant-char-spacing">Character Spacing: ${settings.characterSpacing}px</label>
          <input type="range" id="accessibility-assistant-char-spacing" min="0" max="5" step="0.5" value="${settings.characterSpacing}" style="width: 100%;">
        </div>
      </div>
      
      <div style="margin-bottom: 15px;">
        <h3 style="font-size: 14px; margin-bottom: 10px;">Zoom Settings</h3>
        
        <div style="margin-bottom: 10px;">
          <label for="accessibility-assistant-zoom">Zoom Level: ${settings.zoomLevel}x</label>
          <input type="range" id="accessibility-assistant-zoom" min="1" max="3" step="0.1" value="${settings.zoomLevel}" style="width: 100%;">
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button id="accessibility-assistant-visual-reset" style="padding: 5px 10px; cursor: pointer;">Reset to Default</button>
        <button id="accessibility-assistant-visual-apply" style="padding: 5px 10px; cursor: pointer; background-color: #0078FF; color: white; border: none; border-radius: 4px;">Apply Settings</button>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Add event listeners to controls
    document.getElementById('accessibility-assistant-visual-close')?.addEventListener('click', () => {
      hideControlPanel();
    });
    
    document.getElementById('accessibility-assistant-high-contrast')?.addEventListener('change', (e) => {
      settings.enableHighContrast = (e.target as HTMLInputElement).checked;
    });
    
    document.getElementById('accessibility-assistant-color-blind')?.addEventListener('change', (e) => {
      settings.enableColorBlindMode = (e.target as HTMLInputElement).checked;
      const colorBlindTypeSelect = document.getElementById('accessibility-assistant-color-blind-type') as HTMLSelectElement;
      colorBlindTypeSelect.disabled = !settings.enableColorBlindMode;
    });
    
    document.getElementById('accessibility-assistant-color-blind-type')?.addEventListener('change', (e) => {
      settings.colorBlindType = (e.target as HTMLSelectElement).value as any;
    });
    
    document.getElementById('accessibility-assistant-font-family')?.addEventListener('change', (e) => {
      settings.fontFamily = (e.target as HTMLSelectElement).value;
    });
    
    document.getElementById('accessibility-assistant-font-size')?.addEventListener('input', (e) => {
      settings.fontSize = parseInt((e.target as HTMLInputElement).value);
      const label = document.querySelector('label[for="accessibility-assistant-font-size"]');
      if (label) {
        label.textContent = `Font Size: ${settings.fontSize}px`;
      }
    });
    
    document.getElementById('accessibility-assistant-line-spacing')?.addEventListener('input', (e) => {
      settings.lineSpacing = parseFloat((e.target as HTMLInputElement).value);
      const label = document.querySelector('label[for="accessibility-assistant-line-spacing"]');
      if (label) {
        label.textContent = `Line Spacing: ${settings.lineSpacing}`;
      }
    });
    
    document.getElementById('accessibility-assistant-char-spacing')?.addEventListener('input', (e) => {
      settings.characterSpacing = parseFloat((e.target as HTMLInputElement).value);
      const label = document.querySelector('label[for="accessibility-assistant-char-spacing"]');
      if (label) {
        label.textContent = `Character Spacing: ${settings.characterSpacing}px`;
      }
    });
    
    document.getElementById('accessibility-assistant-zoom')?.addEventListener('input', (e) => {
      settings.zoomLevel = parseFloat((e.target as HTMLInputElement).value);
      const label = document.querySelector('label[for="accessibility-assistant-zoom"]');
      if (label) {
        label.textContent = `Zoom Level: ${settings.zoomLevel}x`;
      }
    });
    
    document.getElementById('accessibility-assistant-visual-reset')?.addEventListener('click', resetToDefaults);
    
    document.getElementById('accessibility-assistant-visual-apply')?.addEventListener('click', () => {
      applySettings();
      saveSettings();
      hideControlPanel();
    });
    
    return panel;
  }
  
  // Update control panel with current settings
  function updateControlPanel() {
    const highContrastCheckbox = document.getElementById('accessibility-assistant-high-contrast') as HTMLInputElement;
    if (highContrastCheckbox) {
      highContrastCheckbox.checked = settings.enableHighContrast;
    }
    
    const colorBlindCheckbox = document.getElementById('accessibility-assistant-color-blind') as HTMLInputElement;
    if (colorBlindCheckbox) {
      colorBlindCheckbox.checked = settings.enableColorBlindMode;
    }
    
    const colorBlindTypeSelect = document.getElementById('accessibility-assistant-color-blind-type') as HTMLSelectElement;
    if (colorBlindTypeSelect) {
      colorBlindTypeSelect.value = settings.colorBlindType;
      colorBlindTypeSelect.disabled = !settings.enableColorBlindMode;
    }
    
    const fontFamilySelect = document.getElementById('accessibility-assistant-font-family') as HTMLSelectElement;
    if (fontFamilySelect) {
      fontFamilySelect.value = settings.fontFamily;
    }
    
    const fontSizeInput = document.getElementById('accessibility-assistant-font-size') as HTMLInputElement;
    if (fontSizeInput) {
      fontSizeInput.value = settings.fontSize.toString();
      const label = document.querySelector('label[for="accessibility-assistant-font-size"]');
      if (label) {
        label.textContent = `Font Size: ${settings.fontSize}px`;
      }
    }
    
    const lineSpacingInput = document.getElementById('accessibility-assistant-line-spacing') as HTMLInputElement;
    if (lineSpacingInput) {
      lineSpacingInput.value = settings.lineSpacing.toString();
      const label = document.querySelector('label[for="accessibility-assistant-line-spacing"]');
      if (label) {
        label.textContent = `Line Spacing: ${settings.lineSpacing}`;
      }
    }
    
    const charSpacingInput = document.getElementById('accessibility-assistant-char-spacing') as HTMLInputElement;
    if (charSpacingInput) {
      charSpacingInput.value = settings.characterSpacing.toString();
      const label = document.querySelector('label[for="accessibility-assistant-char-spacing"]');
      if (label) {
        label.textContent = `Character Spacing: ${settings.characterSpacing}px`;
      }
    }
    
    const zoomInput = document.getElementById('accessibility-assistant-zoom') as HTMLInputElement;
    if (zoomInput) {
      zoomInput.value = settings.zoomLevel.toString();
      const label = document.querySelector('label[for="accessibility-assistant-zoom"]');
      if (label) {
        label.textContent = `Zoom Level: ${settings.zoomLevel}x`;
      }
    }
  }
  
  // Show control panel
  function showControlPanel() {
    controlPanel.style.display = 'block';
  }
  
  // Hide control panel
  function hideControlPanel() {
    controlPanel.style.display = 'none';
  }
  
  // Toggle control panel visibility
  function toggleControlPanel() {
    if (controlPanel.style.display === 'none') {
      showControlPanel();
    } else {
      hideControlPanel();
    }
  }
  
  // Reset settings to defaults
  function resetToDefaults() {
    Object.assign(settings, defaultSettings);
    updateControlPanel();
  }
  
  // Apply current settings to the page
  function applySettings() {
    // Create or retrieve style element
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'accessibility-assistant-visual-styles';
      document.head.appendChild(styleElement);
    }
    
    // Build CSS based on current settings
    let css = '';
    
    // Apply zoom
    document.documentElement.style.zoom = settings.zoomLevel.toString();
    
    // Apply high contrast mode
    if (settings.enableHighContrast) {
      css += `
        html {
          filter: contrast(150%) !important;
        }
        
        body {
          background-color: #000 !important;
          color: #fff !important;
        }
        
        a {
          color: #ffff00 !important;
        }
        
        button, input, select, textarea {
          background-color: #333 !important;
          color: #fff !important;
          border: 1px solid #666 !important;
        }
      `;
    }
    
    // Apply color blind mode
    if (settings.enableColorBlindMode) {
      switch (settings.colorBlindType) {
        case 'protanopia':
          css += `
            html {
              filter: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><filter id='protanopia'><feColorMatrix type='matrix' values='0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0'/></filter></svg>#protanopia") !important;
            }
          `;
          break;
        case 'deuteranopia':
          css += `
            html {
              filter: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><filter id='deuteranopia'><feColorMatrix type='matrix' values='0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0'/></filter></svg>#deuteranopia") !important;
            }
          `;
          break;
        case 'tritanopia':
          css += `
            html {
              filter: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><filter id='tritanopia'><feColorMatrix type='matrix' values='0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0'/></filter></svg>#tritanopia") !important;
            }
          `;
          break;
        case 'achromatopsia':
          css += `
            html {
              filter: grayscale(100%) !important;
            }
          `;
          break;
      }
    }
    
    // Apply text settings
    css += `
      body, p, div, span, h1, h2, h3, h4, h5, h6, a, button, input, select, textarea {
        font-family: ${settings.fontFamily} !important;
        font-size: ${settings.fontSize}px !important;
        line-height: ${settings.lineSpacing} !important;
        letter-spacing: ${settings.characterSpacing}px !important;
      }
    `;
    
    // Apply styles
    styleElement.textContent = css;
  }
  
  // Set up color overlay for color adjustments
  function setupColorOverlay() {
    // High contrast and color blind modes are applied via CSS
  }
  
  // Set up keyboard shortcuts
  function setupKeyboardShortcuts() {
    keyboardHandler = (e: KeyboardEvent) => {
      // Alt+V: Toggle visual settings panel
      if (e.altKey && e.key === 'v') {
        e.preventDefault();
        toggleControlPanel();
      }
      
      // Alt+C: Toggle high contrast
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        settings.enableHighContrast = !settings.enableHighContrast;
        applySettings();
        saveSettings();
      }
      
      // Alt+Plus: Increase zoom
      if (e.altKey && e.key === '+') {
        e.preventDefault();
        settings.zoomLevel = Math.min(settings.zoomLevel + 0.1, 3);
        applySettings();
        saveSettings();
      }
      
      // Alt+Minus: Decrease zoom
      if (e.altKey && e.key === '-') {
        e.preventDefault();
        settings.zoomLevel = Math.max(settings.zoomLevel - 0.1, 1);
        applySettings();
        saveSettings();
      }
      
      // Alt+0: Reset zoom
      if (e.altKey && e.key === '0') {
        e.preventDefault();
        settings.zoomLevel = 1;
        applySettings();
        saveSettings();
      }
    };
    
    document.addEventListener('keydown', keyboardHandler);
  }
  
  // Enhance images with descriptions
  function enhanceImages() {
    const images = document.querySelectorAll('img:not([alt]), img[alt=""]');
    
    images.forEach(img => {
      // Generate a basic description from image URL
      const src = img.getAttribute('src') || '';
      const filename = src.split('/').pop() || '';
      const description = `Image: ${filename}`;
      
      // Set default alt text
      img.setAttribute('alt', description);
      
      // Add class to mark for potential AI-based description
      img.classList.add('accessibility-assistant-needs-description');
      
      // Add hover effect to show/generate description
      img.addEventListener('mouseover', () => {
        requestImageDescription(img as HTMLImageElement);
      });
    });
  }
  
  // Request image description from background script
  function requestImageDescription(img: HTMLImageElement) {
    if (!img.classList.contains('accessibility-assistant-needs-description')) {
      return;
    }
    
    chrome.runtime.sendMessage({
      type: 'DESCRIBE_IMAGE',
      payload: { src: img.src }
    }, (response) => {
      if (response && response.description) {
        // Update alt text with AI-generated description
        img.setAttribute('alt', response.description);
        
        // Remove the needs-description class
        img.classList.remove('accessibility-assistant-needs-description');
      }
    });
  }
  
  // Toggle high contrast mode
  function toggleHighContrast() {
    settings.enableHighContrast = !settings.enableHighContrast;
    applySettings();
    saveSettings();
  }
  
  // Toggle color blind mode
  function toggleColorBlindMode() {
    settings.enableColorBlindMode = !settings.enableColorBlindMode;
    applySettings();
    saveSettings();
  }
  
  // Set color blind type
  function setColorBlindType(type: VisualAssistantSettings['colorBlindType']) {
    settings.colorBlindType = type;
    settings.enableColorBlindMode = true;
    applySettings();
    saveSettings();
  }
  
  // Set zoom level
  function setZoomLevel(level: number) {
    settings.zoomLevel = Math.max(1, Math.min(3, level));
    applySettings();
    saveSettings();
  }
  
  // Set font size
  function setFontSize(size: number) {
    settings.fontSize = Math.max(12, Math.min(32, size));
    applySettings();
    saveSettings();
  }
  
  // Clean up resources
  function cleanup() {
    // Remove event listeners
    if (keyboardHandler) {
      document.removeEventListener('keydown', keyboardHandler);
    }
    
    // Remove UI elements
    if (controlPanel && controlPanel.parentNode) {
      controlPanel.parentNode.removeChild(controlPanel);
    }
    
    // Remove style element
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
    }
    
    // Reset zoom
    document.documentElement.style.zoom = '1';
  }
  
  // Initialize
  initialize();
  
  // Return public API
  return {
    showControlPanel,
    hideControlPanel,
    toggleControlPanel,
    toggleHighContrast,
    toggleColorBlindMode,
    setColorBlindType,
    setZoomLevel,
    setFontSize,
    resetToDefaults,
    applySettings,
    cleanup
  };
}

export default createVisualAssistant; 