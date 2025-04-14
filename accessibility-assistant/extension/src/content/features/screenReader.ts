// Screen Reader Module for Accessibility Assistant
// Enhances existing screen readers and provides advanced reading capabilities

// Types
interface ScreenReaderSettings {
  highlightReadText: boolean;
  autoDescribeImages: boolean;
  readingSpeed: number;
  enhanceHeadings: boolean;
  enhanceLinks: boolean;
  enhanceForms: boolean;
}

// Default settings
const defaultSettings: ScreenReaderSettings = {
  highlightReadText: true,
  autoDescribeImages: true,
  readingSpeed: 1,
  enhanceHeadings: true,
  enhanceLinks: true,
  enhanceForms: true
};

// Initialize screen reader
export function createScreenReader(options: Partial<ScreenReaderSettings> = {}) {
  // Merge default settings with provided options
  const settings: ScreenReaderSettings = {
    ...defaultSettings,
    ...options
  };
  
  // State
  let isReading = false;
  let currentUtterance: SpeechSynthesisUtterance | null = null;
  let currentHighlightedElement: HTMLElement | null = null;
  let currentReadingIndex = 0;
  let readingQueue: Element[] = [];
  
  // Create UI elements
  const highlightOverlay = settings.highlightReadText ? createHighlightOverlay() : null;
  const controlBar = createControlBar();
  
  // Initialize
  function initialize() {
    // Enhance page accessibility
    if (settings.enhanceHeadings) enhanceHeadingElements();
    if (settings.enhanceLinks) enhanceLinkElements();
    if (settings.enhanceForms) enhanceFormElements();
    if (settings.autoDescribeImages) enhanceImageElements();
    
    // Set up event listeners
    setupKeyboardControls();
    
    // Set up event listeners for speech synthesis
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    // Load available voices
    loadVoices();
    
    // Add event listener for automatic image descriptions
    if (settings.autoDescribeImages) {
      document.addEventListener('mouseover', handleImageHover);
    }
  }
  
  // Create highlight overlay for text being read
  function createHighlightOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'accessibility-assistant-highlight-overlay';
    overlay.style.position = 'absolute';
    overlay.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
    overlay.style.border = '1px solid rgba(255, 200, 0, 0.5)';
    overlay.style.borderRadius = '2px';
    overlay.style.zIndex = '9999';
    overlay.style.pointerEvents = 'none';
    overlay.style.display = 'none';
    document.body.appendChild(overlay);
    
    return overlay;
  }
  
  // Create control bar for screen reader
  function createControlBar() {
    const bar = document.createElement('div');
    bar.id = 'accessibility-assistant-reader-controls';
    bar.style.position = 'fixed';
    bar.style.bottom = '10px';
    bar.style.left = '50%';
    bar.style.transform = 'translateX(-50%)';
    bar.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    bar.style.color = 'white';
    bar.style.padding = '10px';
    bar.style.borderRadius = '5px';
    bar.style.zIndex = '10000';
    bar.style.display = 'none';
    bar.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    
    // Add controls
    bar.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
        <button id="accessibility-assistant-reader-prev" style="background: none; border: 1px solid #ccc; color: white; padding: 5px 10px; cursor: pointer; border-radius: 3px;" title="Previous element">◀</button>
        <button id="accessibility-assistant-reader-play" style="background: none; border: 1px solid #ccc; color: white; padding: 5px 10px; cursor: pointer; border-radius: 3px;" title="Play/Pause">▶</button>
        <button id="accessibility-assistant-reader-next" style="background: none; border: 1px solid #ccc; color: white; padding: 5px 10px; cursor: pointer; border-radius: 3px;" title="Next element">▶</button>
        <button id="accessibility-assistant-reader-stop" style="background: none; border: 1px solid #ccc; color: white; padding: 5px 10px; cursor: pointer; border-radius: 3px;" title="Stop">■</button>
        <select id="accessibility-assistant-reader-voice" style="background: none; border: 1px solid #ccc; color: white; padding: 5px; background-color: rgba(0, 0, 0, 0.8); cursor: pointer; border-radius: 3px;" title="Select voice">
          <option value="">Default voice</option>
        </select>
        <select id="accessibility-assistant-reader-speed" style="background: none; border: 1px solid #ccc; color: white; padding: 5px; background-color: rgba(0, 0, 0, 0.8); cursor: pointer; border-radius: 3px;" title="Reading speed">
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1" selected>1x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
        </select>
        <button id="accessibility-assistant-reader-close" style="background: none; border: none; color: white; padding: 5px; cursor: pointer; font-size: 16px;" title="Close reader controls">×</button>
      </div>
    `;
    
    document.body.appendChild(bar);
    
    // Add event listeners to controls
    document.getElementById('accessibility-assistant-reader-prev')?.addEventListener('click', readPreviousElement);
    document.getElementById('accessibility-assistant-reader-play')?.addEventListener('click', toggleReading);
    document.getElementById('accessibility-assistant-reader-next')?.addEventListener('click', readNextElement);
    document.getElementById('accessibility-assistant-reader-stop')?.addEventListener('click', stopReading);
    document.getElementById('accessibility-assistant-reader-close')?.addEventListener('click', hideControls);
    document.getElementById('accessibility-assistant-reader-speed')?.addEventListener('change', handleSpeedChange);
    document.getElementById('accessibility-assistant-reader-voice')?.addEventListener('change', handleVoiceChange);
    
    return bar;
  }
  
  // Load available voices for screen reader
  function loadVoices() {
    const voiceSelect = document.getElementById('accessibility-assistant-reader-voice') as HTMLSelectElement;
    if (voiceSelect) {
      // Clear existing options (except default)
      while (voiceSelect.options.length > 1) {
        voiceSelect.remove(1);
      }
      
      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      
      // Add voices to select
      voices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.text = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
      });
    }
  }
  
  // Handle voice change
  function handleVoiceChange(event: Event) {
    const voiceSelect = event.target as HTMLSelectElement;
    const voiceName = voiceSelect.value;
    
    // Save preference
    chrome.storage.sync.set({
      'screenReader.voiceName': voiceName
    });
    
    // If currently reading, restart with new voice
    if (isReading && currentUtterance) {
      const currentText = currentUtterance.text;
      stopReading();
      readTextAloud(currentText);
    }
  }
  
  // Handle speed change
  function handleSpeedChange(event: Event) {
    const speedSelect = event.target as HTMLSelectElement;
    const speed = parseFloat(speedSelect.value);
    settings.readingSpeed = speed;
    
    // Save preference
    chrome.storage.sync.set({
      'screenReader.readingSpeed': speed
    });
    
    // If currently reading, update speed
    if (currentUtterance) {
      currentUtterance.rate = speed;
    }
  }
  
  // Setup keyboard controls for screen reader
  function setupKeyboardControls() {
    document.addEventListener('keydown', (event) => {
      // Only handle keyboard shortcuts when control bar is visible
      if (controlBar.style.display !== 'none') {
        // Alt + Left: Previous element
        if (event.altKey && event.key === 'ArrowLeft') {
          event.preventDefault();
          readPreviousElement();
        }
        
        // Alt + Right: Next element
        if (event.altKey && event.key === 'ArrowRight') {
          event.preventDefault();
          readNextElement();
        }
        
        // Alt + Space: Play/Pause
        if (event.altKey && event.key === ' ') {
          event.preventDefault();
          toggleReading();
        }
        
        // Alt + Escape: Stop
        if (event.altKey && event.key === 'Escape') {
          event.preventDefault();
          stopReading();
          hideControls();
        }
      }
      
      // Global shortcut to start reading (Alt+R)
      if (event.altKey && event.key === 'r') {
        event.preventDefault();
        showControls();
        startReading();
      }
    });
  }
  
  // Show screen reader controls
  function showControls() {
    controlBar.style.display = 'block';
  }
  
  // Hide screen reader controls
  function hideControls() {
    controlBar.style.display = 'none';
  }
  
  // Toggle reading state
  function toggleReading() {
    if (isReading) {
      pauseReading();
    } else {
      resumeReading();
    }
  }
  
  // Start reading from the beginning
  function startReading() {
    // If already reading, stop first
    if (isReading) {
      stopReading();
    }
    
    // Collect readable elements
    collectReadableElements();
    
    // Start reading from the beginning
    currentReadingIndex = 0;
    readCurrentElement();
    
    // Update play button
    const playButton = document.getElementById('accessibility-assistant-reader-play');
    if (playButton) {
      playButton.innerHTML = '❚❚';
      playButton.title = 'Pause';
    }
    
    // Show controls
    showControls();
  }
  
  // Pause the current reading
  function pauseReading() {
    if (isReading) {
      window.speechSynthesis.pause();
      isReading = false;
      
      // Update play button
      const playButton = document.getElementById('accessibility-assistant-reader-play');
      if (playButton) {
        playButton.innerHTML = '▶';
        playButton.title = 'Play';
      }
    }
  }
  
  // Resume the current reading
  function resumeReading() {
    if (!isReading) {
      window.speechSynthesis.resume();
      isReading = true;
      
      // Update play button
      const playButton = document.getElementById('accessibility-assistant-reader-play');
      if (playButton) {
        playButton.innerHTML = '❚❚';
        playButton.title = 'Pause';
      }
    }
  }
  
  // Stop the current reading
  function stopReading() {
    window.speechSynthesis.cancel();
    isReading = false;
    
    // Remove highlight
    if (highlightOverlay) {
      highlightOverlay.style.display = 'none';
    }
    
    // Remove current highlight class
    if (currentHighlightedElement) {
      currentHighlightedElement.classList.remove('accessibility-assistant-reading');
    }
    
    // Update play button
    const playButton = document.getElementById('accessibility-assistant-reader-play');
    if (playButton) {
      playButton.innerHTML = '▶';
      playButton.title = 'Play';
    }
  }
  
  // Collect all readable elements on the page
  function collectReadableElements() {
    // Clear existing queue
    readingQueue = [];
    
    // Add main content elements to queue
    const mainContent = findMainContent();
    
    if (mainContent) {
      // Get all text-containing elements within main content
      const textElements = mainContent.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, td, th, a, button, label, input, textarea, select');
      
      textElements.forEach(element => {
        // Ensure the element has actual text content and is visible
        if (element.textContent?.trim() && isElementVisible(element as HTMLElement)) {
          readingQueue.push(element);
        }
      });
    } else {
      // Fallback to all visible text elements if no main content is found
      const allTextElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, td, th, a, button, label');
      
      allTextElements.forEach(element => {
        if (element.textContent?.trim() && isElementVisible(element as HTMLElement)) {
          readingQueue.push(element);
        }
      });
    }
  }
  
  // Find the main content of the page
  function findMainContent(): Element | null {
    // Try to find main content by common selectors
    const selectors = [
      'main',
      'article',
      '[role="main"]',
      '#content',
      '.content',
      '#main',
      '.main'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent && element.textContent.trim().length > 100) {
        return element;
      }
    }
    
    // Fallback: find the element with the most text
    let maxTextLength = 0;
    let maxTextElement: Element | null = null;
    
    const contentElements = document.querySelectorAll('div, section, article');
    contentElements.forEach(element => {
      const textLength = element.textContent?.trim().length || 0;
      if (textLength > maxTextLength && textLength > 100) {
        maxTextLength = textLength;
        maxTextElement = element;
      }
    });
    
    return maxTextElement;
  }
  
  // Read the current element
  function readCurrentElement() {
    if (currentReadingIndex < 0 || currentReadingIndex >= readingQueue.length) {
      return;
    }
    
    const element = readingQueue[currentReadingIndex];
    
    // Get the text to read
    let textToRead = '';
    
    // Handle different element types
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      // For input elements, read their type, label and value
      const input = element as HTMLInputElement;
      const labelText = findLabelText(input);
      textToRead = `${input.type} field, ${labelText}`;
      
      if (input.value) {
        textToRead += `, current value: ${input.value}`;
      }
    } else if (element.tagName === 'SELECT') {
      // For select elements, read their label and selected option
      const select = element as HTMLSelectElement;
      const labelText = findLabelText(select);
      const selectedOption = select.options[select.selectedIndex];
      textToRead = `Dropdown, ${labelText}`;
      
      if (selectedOption) {
        textToRead += `, current selection: ${selectedOption.text}`;
      }
    } else if (element.tagName === 'A') {
      // For links, add "link" prefix
      textToRead = `Link: ${element.textContent?.trim()}`;
    } else if (element.tagName.match(/^H[1-6]$/)) {
      // For headings, add heading level
      const level = element.tagName.substring(1);
      textToRead = `Heading level ${level}: ${element.textContent?.trim()}`;
    } else {
      // For other elements, just read the text content
      textToRead = element.textContent?.trim() || '';
    }
    
    // If the element has ARIA attributes, add them to the text
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      textToRead = ariaLabel;
    }
    
    // Read the text
    readTextAloud(textToRead);
    
    // Highlight the current element
    highlightElement(element as HTMLElement);
  }
  
  // Read the next element
  function readNextElement() {
    if (currentReadingIndex < readingQueue.length - 1) {
      currentReadingIndex++;
      readCurrentElement();
    }
  }
  
  // Read the previous element
  function readPreviousElement() {
    if (currentReadingIndex > 0) {
      currentReadingIndex--;
      readCurrentElement();
    }
  }
  
  // Read text aloud
  function readTextAloud(text: string) {
    if (!text) return;
    
    // Stop any current reading
    window.speechSynthesis.cancel();
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.readingSpeed;
    
    // Use preferred voice if specified
    const voiceSelect = document.getElementById('accessibility-assistant-reader-voice') as HTMLSelectElement;
    if (voiceSelect && voiceSelect.value) {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(voice => voice.name === voiceSelect.value);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }
    
    // Set up handlers
    utterance.onend = () => {
      // Move to next element when finished
      if (isReading && currentReadingIndex < readingQueue.length - 1) {
        currentReadingIndex++;
        readCurrentElement();
      } else {
        // Reached the end
        isReading = false;
        
        // Update play button
        const playButton = document.getElementById('accessibility-assistant-reader-play');
        if (playButton) {
          playButton.innerHTML = '▶';
          playButton.title = 'Play';
        }
        
        // Remove highlight
        if (highlightOverlay) {
          highlightOverlay.style.display = 'none';
        }
        
        // Remove current highlight class
        if (currentHighlightedElement) {
          currentHighlightedElement.classList.remove('accessibility-assistant-reading');
        }
      }
    };
    
    // Store current utterance
    currentUtterance = utterance;
    
    // Start reading
    window.speechSynthesis.speak(utterance);
    isReading = true;
  }
  
  // Highlight the element currently being read
  function highlightElement(element: HTMLElement) {
    // Remove highlight from previous element
    if (currentHighlightedElement) {
      currentHighlightedElement.classList.remove('accessibility-assistant-reading');
    }
    
    // Add highlight to current element
    element.classList.add('accessibility-assistant-reading');
    currentHighlightedElement = element;
    
    // Update highlight overlay
    if (highlightOverlay && settings.highlightReadText) {
      const rect = element.getBoundingClientRect();
      
      highlightOverlay.style.top = `${window.scrollY + rect.top}px`;
      highlightOverlay.style.left = `${window.scrollX + rect.left}px`;
      highlightOverlay.style.width = `${rect.width}px`;
      highlightOverlay.style.height = `${rect.height}px`;
      highlightOverlay.style.display = 'block';
      
      // Scroll element into view
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }
  
  // Find the label text for an input element
  function findLabelText(input: HTMLElement): string {
    // Try to find label by 'for' attribute
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label && label.textContent) {
        return label.textContent.trim();
      }
    }
    
    // Try to find parent label
    let parent = input.parentElement;
    while (parent) {
      if (parent.tagName === 'LABEL' && parent.textContent) {
        // Return the label text without the input's own text
        const labelText = parent.textContent.trim();
        const inputText = input.textContent?.trim() || '';
        return labelText.replace(inputText, '').trim();
      }
      parent = parent.parentElement;
    }
    
    // Try to find aria-label
    const ariaLabel = input.getAttribute('aria-label');
    if (ariaLabel) {
      return ariaLabel;
    }
    
    // Try to find placeholder
    const placeholder = (input as HTMLInputElement).placeholder;
    if (placeholder) {
      return `Field with placeholder ${placeholder}`;
    }
    
    // Try to find name attribute
    const name = (input as HTMLInputElement).name;
    if (name) {
      return `Field named ${name}`;
    }
    
    // Fallback
    return 'Unlabeled field';
  }
  
  // Enhance heading elements for better screen reader navigation
  function enhanceHeadingElements() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headings.forEach(heading => {
      // Add role="heading" and aria-level if not present
      if (!heading.getAttribute('role')) {
        heading.setAttribute('role', 'heading');
      }
      
      const level = heading.tagName.charAt(1);
      if (!heading.getAttribute('aria-level')) {
        heading.setAttribute('aria-level', level);
      }
    });
  }
  
  // Enhance link elements for better screen reader navigation
  function enhanceLinkElements() {
    const links = document.querySelectorAll('a');
    
    links.forEach(link => {
      // Add role="link" if not present
      if (!link.getAttribute('role')) {
        link.setAttribute('role', 'link');
      }
      
      // If link has no text but has an image, add description
      if ((!link.textContent || link.textContent.trim() === '') && link.querySelector('img')) {
        const img = link.querySelector('img');
        const altText = img?.getAttribute('alt');
        
        if (!altText || altText.trim() === '') {
          // No alt text, try to generate one
          const imgUrl = img?.src || '';
          const filename = imgUrl.split('/').pop() || '';
          
          link.setAttribute('aria-label', `Image link: ${filename}`);
        } else {
          link.setAttribute('aria-label', `Image link: ${altText}`);
        }
      }
      
      // If link opens in new window, indicate this
      if (link.getAttribute('target') === '_blank') {
        let ariaLabel = link.getAttribute('aria-label') || '';
        
        if (ariaLabel) {
          ariaLabel += ' (opens in new window)';
        } else {
          ariaLabel = `${link.textContent} (opens in new window)`;
        }
        
        link.setAttribute('aria-label', ariaLabel);
      }
    });
  }
  
  // Enhance form elements for better screen reader navigation
  function enhanceFormElements() {
    // Add missing labels to form fields
    const formFields = document.querySelectorAll('input, textarea, select');
    
    formFields.forEach(field => {
      const hasLabel = field.id && document.querySelector(`label[for="${field.id}"]`);
      const hasAriaLabel = field.getAttribute('aria-label');
      const hasPlaceholder = (field as HTMLInputElement).placeholder;
      
      if (!hasLabel && !hasAriaLabel && !hasPlaceholder) {
        // Try to generate a label based on name or surrounding text
        const fieldName = (field as HTMLInputElement).name;
        
        if (fieldName) {
          // Convert name attribute to readable label (e.g., "first_name" -> "First name")
          const readableName = fieldName
            .replace(/[_-]/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          field.setAttribute('aria-label', readableName);
        }
      }
      
      // Mark required fields
      if ((field as HTMLInputElement).required) {
        let ariaLabel = field.getAttribute('aria-label') || '';
        
        if (ariaLabel) {
          ariaLabel += ' (required)';
        } else {
          const label = field.id && document.querySelector(`label[for="${field.id}"]`);
          ariaLabel = `${label?.textContent || 'Field'} (required)`;
        }
        
        field.setAttribute('aria-label', ariaLabel);
        field.setAttribute('aria-required', 'true');
      }
    });
  }
  
  // Enhance image elements with auto-generated descriptions
  function enhanceImageElements() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      // Only enhance images that have no alt text or empty alt text
      if (!img.hasAttribute('alt') || img.getAttribute('alt') === '') {
        // Try to generate a description from filename or context
        const imgUrl = img.src;
        const filename = imgUrl.split('/').pop() || '';
        
        // Set a temporary alt text based on filename
        img.setAttribute('alt', `Image: ${filename}`);
        
        // Mark for potential AI-based description
        img.classList.add('accessibility-assistant-needs-description');
      }
    });
  }
  
  // Handle image hover for automatic descriptions
  function handleImageHover(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    if (target.tagName === 'IMG' && target.classList.contains('accessibility-assistant-needs-description')) {
      // Request image description from background script
      chrome.runtime.sendMessage({
        type: 'DESCRIBE_IMAGE',
        payload: { src: (target as HTMLImageElement).src }
      }, (response) => {
        if (response && response.description) {
          // Update alt text with AI-generated description
          target.setAttribute('alt', response.description);
          
          // Remove the needs-description class
          target.classList.remove('accessibility-assistant-needs-description');
        }
      });
    }
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
  
  // Clean up resources
  function cleanup() {
    // Stop any active reading
    stopReading();
    
    // Remove event listeners
    if (settings.autoDescribeImages) {
      document.removeEventListener('mouseover', handleImageHover);
    }
    
    window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    
    // Remove UI elements
    if (highlightOverlay && highlightOverlay.parentNode) {
      highlightOverlay.parentNode.removeChild(highlightOverlay);
    }
    
    if (controlBar && controlBar.parentNode) {
      controlBar.parentNode.removeChild(controlBar);
    }
  }
  
  // Initialize screen reader
  initialize();
  
  // Return public methods
  return {
    startReading,
    pauseReading,
    resumeReading,
    stopReading,
    readTextAloud,
    showControls,
    hideControls,
    cleanup
  };
}

export default createScreenReader; 