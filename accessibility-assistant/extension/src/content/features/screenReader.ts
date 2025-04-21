// Screen Reader Module for Accessibility Assistant
// Provides screen reading functionality and enhanced text-to-speech

import { VisualSettings, ScreenReaderElement } from '../../types';

// Default settings
const defaultSettings: Partial<VisualSettings> = {
  screenReaderEnabled: false,
  readingGuideEnabled: false
};

// Initialize screen reader
export function createScreenReader(options: Partial<VisualSettings> = {}) {
  // Merge default settings with provided options
  const settings: Partial<VisualSettings> = {
    ...defaultSettings,
    ...options
  };
  
  // UI elements
  let controlPanel: HTMLElement | null = null;
  let readerOverlay: HTMLElement | null = null;
  
  // State
  let isActive = false;
  let currentSpeech: SpeechSynthesisUtterance | null = null;
  let elements: ScreenReaderElement[] = [];
  let currentElementIndex = -1;
  let voices: SpeechSynthesisVoice[] = [];
  let selectedVoice: SpeechSynthesisVoice | null = null;
  let rate = 1.0;
  let pitch = 1.0;
  let volume = 1.0;
  
  // Event handlers
  let keyboardHandler: ((e: KeyboardEvent) => void) | null = null;
  
  // Initialize
  function initialize() {
    // Create UI elements
    createUI();
    
    // Load settings from storage
    loadSettings();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load available voices
    loadVoices();
  }
  
  // Load settings from Chrome storage
  function loadSettings() {
    chrome.storage.sync.get('screenReader', (data) => {
      if (data.screenReader) {
        Object.assign(settings, data.screenReader);
        updateControlPanel();
      }
    });
  }
  
  // Save settings to Chrome storage
  function saveSettings() {
    chrome.storage.sync.set({
      screenReader: settings
    });
  }
  
  // Load available speech synthesis voices
  function loadVoices() {
    // Get available voices
    voices = window.speechSynthesis.getVoices();
    
    // If voices aren't loaded yet, wait for them
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        // Set default voice (prefer English)
        selectedVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
        updateVoiceSelector();
      };
    } else {
      // Set default voice (prefer English)
      selectedVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
      updateVoiceSelector();
    }
  }
  
  // Create UI elements
  function createUI() {
    createControlPanel();
  }
  
  // Create control panel UI
  function createControlPanel() {
    controlPanel = document.createElement('div');
    controlPanel.id = 'accessibility-assistant-screen-reader-panel';
    controlPanel.style.position = 'fixed';
    controlPanel.style.bottom = '20px';
    controlPanel.style.left = '50%';
    controlPanel.style.transform = 'translateX(-50%)';
    controlPanel.style.width = '400px';
    controlPanel.style.backgroundColor = 'white';
    controlPanel.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    controlPanel.style.borderRadius = '8px';
    controlPanel.style.padding = '15px';
    controlPanel.style.zIndex = '10000';
    controlPanel.style.display = 'none';
    
    controlPanel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h2 style="margin: 0; font-size: 16px;">Screen Reader Settings</h2>
        <button id="accessibility-assistant-screen-reader-close" style="background: none; border: none; cursor: pointer; font-size: 18px;">×</button>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label for="accessibility-assistant-screen-reader-voice">Voice:</label>
        <select id="accessibility-assistant-screen-reader-voice" style="width: 100%; margin-top: 5px; padding: 5px;">
          <option value="">Loading voices...</option>
        </select>
      </div>
      
      <div style="margin-bottom: 10px;">
        <label for="accessibility-assistant-screen-reader-rate">Reading Speed: 1.0x</label>
        <input type="range" id="accessibility-assistant-screen-reader-rate" min="0.5" max="2" step="0.1" value="1.0" style="width: 100%;">
      </div>
      
      <div style="margin-bottom: 10px;">
        <label for="accessibility-assistant-screen-reader-pitch">Pitch: 1.0</label>
        <input type="range" id="accessibility-assistant-screen-reader-pitch" min="0.5" max="2" step="0.1" value="1.0" style="width: 100%;">
      </div>
      
      <div style="margin-bottom: 15px;">
        <label for="accessibility-assistant-screen-reader-volume">Volume: 100%</label>
        <input type="range" id="accessibility-assistant-screen-reader-volume" min="0" max="1" step="0.1" value="1.0" style="width: 100%;">
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <button id="accessibility-assistant-read-page" style="padding: 8px 12px; background-color: #0078FF; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Read Page
        </button>
        <button id="accessibility-assistant-read-selection" style="padding: 8px 12px; background-color: #0078FF; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Read Selection
        </button>
        <button id="accessibility-assistant-stop-reading" style="padding: 8px 12px; background-color: #FF3B30; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Stop Reading
        </button>
      </div>
      
      <div style="margin-top: 10px;">
        <p style="margin-bottom: 5px; font-size: 14px; color: #666;">Keyboard Shortcuts:</p>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #666;">
          <li>Alt+Space: Start/Stop Reading</li>
          <li>Alt+Right Arrow: Next Element</li>
          <li>Alt+Left Arrow: Previous Element</li>
          <li>Alt+Up Arrow: Increase Speed</li>
          <li>Alt+Down Arrow: Decrease Speed</li>
        </ul>
      </div>
    `;
    
    document.body.appendChild(controlPanel);
    
    // Add event listeners
    document.getElementById('accessibility-assistant-screen-reader-close')?.addEventListener('click', () => {
      hideControlPanel();
    });
    
    document.getElementById('accessibility-assistant-screen-reader-voice')?.addEventListener('change', (e) => {
      const voiceURI = (e.target as HTMLSelectElement).value;
      selectedVoice = voices.find(voice => voice.voiceURI === voiceURI) || null;
    });
    
    document.getElementById('accessibility-assistant-screen-reader-rate')?.addEventListener('input', (e) => {
      rate = parseFloat((e.target as HTMLInputElement).value);
      const label = document.querySelector('label[for="accessibility-assistant-screen-reader-rate"]');
      if (label) {
        label.textContent = `Reading Speed: ${rate.toFixed(1)}x`;
      }
    });
    
    document.getElementById('accessibility-assistant-screen-reader-pitch')?.addEventListener('input', (e) => {
      pitch = parseFloat((e.target as HTMLInputElement).value);
      const label = document.querySelector('label[for="accessibility-assistant-screen-reader-pitch"]');
      if (label) {
        label.textContent = `Pitch: ${pitch.toFixed(1)}`;
      }
    });
    
    document.getElementById('accessibility-assistant-screen-reader-volume')?.addEventListener('input', (e) => {
      volume = parseFloat((e.target as HTMLInputElement).value);
      const label = document.querySelector('label[for="accessibility-assistant-screen-reader-volume"]');
      if (label) {
        label.textContent = `Volume: ${Math.round(volume * 100)}%`;
      }
    });
    
    document.getElementById('accessibility-assistant-read-page')?.addEventListener('click', () => {
      readPage();
    });
    
    document.getElementById('accessibility-assistant-read-selection')?.addEventListener('click', () => {
      readSelection();
    });
    
    document.getElementById('accessibility-assistant-stop-reading')?.addEventListener('click', () => {
      stopReading();
    });
  }
  
  // Update voice selector with available voices
  function updateVoiceSelector() {
    const voiceSelector = document.getElementById('accessibility-assistant-screen-reader-voice') as HTMLSelectElement;
    if (voiceSelector) {
      voiceSelector.innerHTML = '';
      
      voices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.voiceURI;
        option.textContent = `${voice.name} (${voice.lang})`;
        option.selected = selectedVoice?.voiceURI === voice.voiceURI;
        voiceSelector.appendChild(option);
      });
    }
  }
  
  // Update control panel with current settings
  function updateControlPanel() {
    const rateSlider = document.getElementById('accessibility-assistant-screen-reader-rate') as HTMLInputElement;
    if (rateSlider) {
      rateSlider.value = rate.toString();
      const label = document.querySelector('label[for="accessibility-assistant-screen-reader-rate"]');
      if (label) {
        label.textContent = `Reading Speed: ${rate.toFixed(1)}x`;
      }
    }
    
    const pitchSlider = document.getElementById('accessibility-assistant-screen-reader-pitch') as HTMLInputElement;
    if (pitchSlider) {
      pitchSlider.value = pitch.toString();
      const label = document.querySelector('label[for="accessibility-assistant-screen-reader-pitch"]');
      if (label) {
        label.textContent = `Pitch: ${pitch.toFixed(1)}`;
      }
    }
    
    const volumeSlider = document.getElementById('accessibility-assistant-screen-reader-volume') as HTMLInputElement;
    if (volumeSlider) {
      volumeSlider.value = volume.toString();
      const label = document.querySelector('label[for="accessibility-assistant-screen-reader-volume"]');
      if (label) {
        label.textContent = `Volume: ${Math.round(volume * 100)}%`;
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
  
  // Set up event listeners
  function setupEventListeners() {
    // Keyboard shortcuts
    keyboardHandler = (e: KeyboardEvent) => {
      // Alt+Space: Start/Stop reading
      if (e.altKey && e.code === 'Space') {
        e.preventDefault();
        if (window.speechSynthesis.speaking) {
          stopReading();
        } else {
          readPage();
        }
      }
      
      // Alt+Right Arrow: Next element
      if (e.altKey && e.code === 'ArrowRight') {
        e.preventDefault();
        readNextElement();
      }
      
      // Alt+Left Arrow: Previous element
      if (e.altKey && e.code === 'ArrowLeft') {
        e.preventDefault();
        readPreviousElement();
      }
      
      // Alt+Up Arrow: Increase speed
      if (e.altKey && e.code === 'ArrowUp') {
        e.preventDefault();
        increaseSpeed();
      }
      
      // Alt+Down Arrow: Decrease speed
      if (e.altKey && e.code === 'ArrowDown') {
        e.preventDefault();
        decreaseSpeed();
      }
    };
    
    document.addEventListener('keydown', keyboardHandler);
  }
  
  // Enable screen reader
  function enableScreenReader() {
    if (isActive) return;
    
    // Scan page for readable elements
    scanPage();
    
    // Show indicator that screen reader is active
    const screenReaderIndicator = document.createElement('div');
    screenReaderIndicator.id = 'accessibility-assistant-screen-reader-indicator';
    screenReaderIndicator.style.position = 'fixed';
    screenReaderIndicator.style.top = '10px';
    screenReaderIndicator.style.right = '10px';
    screenReaderIndicator.style.backgroundColor = '#0078FF';
    screenReaderIndicator.style.color = 'white';
    screenReaderIndicator.style.padding = '5px 10px';
    screenReaderIndicator.style.borderRadius = '3px';
    screenReaderIndicator.style.fontSize = '12px';
    screenReaderIndicator.style.zIndex = '10000';
    screenReaderIndicator.innerHTML = 'Screen Reader Active';
    
    document.body.appendChild(screenReaderIndicator);
    
    // Add keyboard focus styles
    const focusStyles = document.createElement('style');
    focusStyles.id = 'accessibility-assistant-screen-reader-styles';
    focusStyles.textContent = `
      .accessibility-assistant-reading-current {
        outline: 3px solid #0078FF !important;
        background-color: rgba(0, 120, 255, 0.1) !important;
      }
    `;
    document.head.appendChild(focusStyles);
    
    isActive = true;
    settings.screenReaderEnabled = true;
    
    // Save settings
    saveSettings();
  }
  
  // Disable screen reader
  function disableScreenReader() {
    if (!isActive) return;
    
    // Stop any ongoing reading
    stopReading();
    
    // Remove indicator
    const indicator = document.getElementById('accessibility-assistant-screen-reader-indicator');
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
    
    // Remove focus styles
    const styles = document.getElementById('accessibility-assistant-screen-reader-styles');
    if (styles && styles.parentNode) {
      styles.parentNode.removeChild(styles);
    }
    
    // Remove highlight from current element
    clearCurrentElementHighlight();
    
    isActive = false;
    settings.screenReaderEnabled = false;
    
    // Save settings
    saveSettings();
  }
  
  // Toggle screen reader
  function toggleScreenReader() {
    if (isActive) {
      disableScreenReader();
    } else {
      enableScreenReader();
    }
  }
  
  // Scan page for readable elements
  function scanPage() {
    elements = [];
    currentElementIndex = -1;
    
    // Get all headings, paragraphs, lists, links, buttons, and images
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const paragraphs = Array.from(document.querySelectorAll('p'));
    const listItems = Array.from(document.querySelectorAll('li'));
    const links = Array.from(document.querySelectorAll('a'));
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
    const images = Array.from(document.querySelectorAll('img[alt]'));
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
    
    // Process headings
    headings.forEach(heading => {
      const text = heading.textContent?.trim() || '';
      if (text) {
        const level = parseInt(heading.tagName.substring(1));
        elements.push({
          element: heading as HTMLElement,
          text: `Heading level ${level}: ${text}`,
          role: 'heading',
          level
        });
      }
    });
    
    // Process paragraphs
    paragraphs.forEach(paragraph => {
      const text = paragraph.textContent?.trim() || '';
      if (text) {
        elements.push({
          element: paragraph as HTMLElement,
          text,
          role: 'paragraph'
        });
      }
    });
    
    // Process list items
    listItems.forEach(item => {
      const text = item.textContent?.trim() || '';
      if (text) {
        elements.push({
          element: item as HTMLElement,
          text: `List item: ${text}`,
          role: 'listitem'
        });
      }
    });
    
    // Process links
    links.forEach(link => {
      const text = link.textContent?.trim() || '';
      if (text) {
        elements.push({
          element: link as HTMLElement,
          text: `Link: ${text}`,
          role: 'link'
        });
      }
    });
    
    // Process buttons
    buttons.forEach(button => {
      const text = button.textContent?.trim() || '';
      if (text) {
        elements.push({
          element: button as HTMLElement,
          text: `Button: ${text}`,
          role: 'button'
        });
      }
    });
    
    // Process images with alt text
    images.forEach(image => {
      const alt = image.getAttribute('alt')?.trim() || '';
      if (alt && alt !== '') {
        elements.push({
          element: image as HTMLElement,
          text: `Image: ${alt}`,
          role: 'img'
        });
      }
    });
    
    // Process form elements
    inputs.forEach(input => {
      let role = 'input';
      let text = '';
      let state = '';
      
      if (input instanceof HTMLInputElement) {
        switch (input.type) {
          case 'checkbox':
            role = 'checkbox';
            text = getInputLabel(input) || 'Checkbox';
            state = input.checked ? 'checked' : 'not checked';
            break;
          case 'radio':
            role = 'radio';
            text = getInputLabel(input) || 'Radio button';
            state = input.checked ? 'selected' : 'not selected';
            break;
          case 'submit':
            role = 'button';
            text = input.value || 'Submit';
            break;
          case 'button':
            role = 'button';
            text = input.value || 'Button';
            break;
          default:
            text = getInputLabel(input) || input.placeholder || input.name || 'Text field';
        }
      } else if (input instanceof HTMLTextAreaElement) {
        text = getInputLabel(input) || input.placeholder || 'Text area';
      } else if (input instanceof HTMLSelectElement) {
        role = 'combobox';
        text = getInputLabel(input) || 'Dropdown menu';
        state = input.options[input.selectedIndex]?.text || '';
      }
      
      elements.push({
        element: input as HTMLElement,
        text: `${text}${state ? `, ${state}` : ''}`,
        role,
        state
      });
    });
    
    // Sort elements by their position in the document (top to bottom)
    elements.sort((a, b) => {
      const rectA = a.element.getBoundingClientRect();
      const rectB = b.element.getBoundingClientRect();
      return rectA.top - rectB.top;
    });
  }
  
  // Get label for form input
  function getInputLabel(input: HTMLElement): string {
    // Check for associated label
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) {
        return label.textContent?.trim() || '';
      }
    }
    
    // Check for parent label
    let parent = input.parentElement;
    while (parent) {
      if (parent.tagName === 'LABEL') {
        // Remove the input's text from the label text
        const labelText = parent.textContent || '';
        return labelText.trim();
      }
      parent = parent.parentElement;
    }
    
    // Check for aria-label
    const ariaLabel = input.getAttribute('aria-label');
    if (ariaLabel) {
      return ariaLabel;
    }
    
    // Check for aria-labelledby
    const ariaLabelledBy = input.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      if (labelElement) {
        return labelElement.textContent?.trim() || '';
      }
    }
    
    return '';
  }
  
  // Read the entire page
  function readPage() {
    // Make sure screen reader is enabled
    if (!isActive) {
      enableScreenReader();
    }
    
    // Scan page if needed
    if (elements.length === 0) {
      scanPage();
    }
    
    // Start reading from beginning
    currentElementIndex = -1;
    readNextElement();
  }
  
  // Read currently selected text
  function readSelection() {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const text = selection.toString().trim();
      if (text) {
        speak(text);
      }
    }
  }
  
  // Read next element
  function readNextElement() {
    // Stop any current speech
    stopReading();
    
    // Remove highlight from current element
    clearCurrentElementHighlight();
    
    // Move to next element
    currentElementIndex++;
    if (currentElementIndex >= elements.length) {
      currentElementIndex = 0; // Loop back to beginning
    }
    
    // Get current element
    const element = elements[currentElementIndex];
    
    // Highlight element
    highlightCurrentElement(element);
    
    // Scroll element into view
    element.element.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    
    // Speak element text
    speak(element.text);
  }
  
  // Read previous element
  function readPreviousElement() {
    // Stop any current speech
    stopReading();
    
    // Remove highlight from current element
    clearCurrentElementHighlight();
    
    // Move to previous element
    currentElementIndex--;
    if (currentElementIndex < 0) {
      currentElementIndex = elements.length - 1; // Loop to end
    }
    
    // Get current element
    const element = elements[currentElementIndex];
    
    // Highlight element
    highlightCurrentElement(element);
    
    // Scroll element into view
    element.element.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    
    // Speak element text
    speak(element.text);
  }
  
  // Highlight current element
  function highlightCurrentElement(element: ScreenReaderElement) {
    element.element.classList.add('accessibility-assistant-reading-current');
  }
  
  // Clear highlight from current element
  function clearCurrentElementHighlight() {
    if (currentElementIndex >= 0 && currentElementIndex < elements.length) {
      elements[currentElementIndex].element.classList.remove('accessibility-assistant-reading-current');
    }
  }
  
  // Stop reading
  function stopReading() {
    window.speechSynthesis.cancel();
    if (currentSpeech) {
      currentSpeech = null;
    }
  }
  
  // Speak text
  function speak(text: string) {
    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice if available
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Set properties
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    
    // Set up event handlers
    utterance.onend = () => {
      currentSpeech = null;
    };
    
    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      currentSpeech = null;
    };
    
    // Store current speech
    currentSpeech = utterance;
    
    // Start speaking
    window.speechSynthesis.speak(utterance);
  }
  
  // Increase reading speed
  function increaseSpeed() {
    rate = Math.min(rate + 0.1, 2);
    updateControlPanel();
  }
  
  // Decrease reading speed
  function decreaseSpeed() {
    rate = Math.max(rate - 0.1, 0.5);
    updateControlPanel();
  }
  
  // Clean up resources
  function cleanup() {
    // Stop any ongoing reading
    stopReading();
    
    // Remove event listener
    if (keyboardHandler) {
      document.removeEventListener('keydown', keyboardHandler);
    }
    
    // Disable screen reader
    disableScreenReader();
    
    // Remove UI elements
    if (controlPanel && controlPanel.parentNode) {
      controlPanel.parentNode.removeChild(controlPanel);
    }
  }
  
  // Initialize
  initialize();
  
  // Public API
  return {
    showControlPanel,
    hideControlPanel,
    toggleControlPanel,
    enableScreenReader,
    disableScreenReader,
    toggleScreenReader,
    readPage,
    readSelection,
    readNextElement,
    readPreviousElement,
    stopReading,
    increaseSpeed,
    decreaseSpeed,
    cleanup
  };
}

export default createScreenReader;