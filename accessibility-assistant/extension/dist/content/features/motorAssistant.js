// Motor Assistant Module for Accessibility Assistant
// Provides motor accessibility features like dwell clicking, voice control, and keyboard navigation
// Default settings
const defaultSettings = {
    enabled: false,
    dwellClickingEnabled: false,
    dwellTime: 1000, // milliseconds
    mouseTrackingEnabled: false,
    keyboardNavigationEnabled: false,
    showClickableElements: false,
    autoFillForms: false,
    gesturesEnabled: false,
    switchControlEnabled: false,
    voiceControlEnabled: false
};
// Initialize motor assistant
export function createMotorAssistant(options = {}) {
    // Merge default settings with provided options
    const settings = {
        ...defaultSettings,
        ...options
    };
    // UI elements
    let controlPanel = null;
    let dwellIndicator = null;
    let highlightOverlay = null;
    // State
    const dwellState = {
        element: null,
        startTime: null,
        timer: null,
        isActive: false
    };
    // Event handlers
    let mouseMoveHandler = null;
    let keyboardHandler = null;
    // Array of clickable elements
    let clickableElements = [];
    let currentElementIndex = -1;
    // Initialize
    function initialize() {
        // Create UI elements
        createUI();
        // Load settings from storage
        loadSettings();
        // Set up event listeners
        setupEventListeners();
        // Initialize features based on settings
        initializeFeatures();
    }
    // Load settings from Chrome storage
    function loadSettings() {
        chrome.storage.sync.get('motorAssistant', (data) => {
            if (data.motorAssistant) {
                Object.assign(settings, data.motorAssistant);
                updateControlPanel();
                initializeFeatures();
            }
        });
    }
    // Save settings to Chrome storage
    function saveSettings() {
        chrome.storage.sync.set({
            motorAssistant: settings
        });
    }
    // Create UI elements
    function createUI() {
        createControlPanel();
        createDwellIndicator();
        createHighlightOverlay();
    }
    // Create control panel UI
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
        controlPanel.style.maxHeight = '80vh';
        controlPanel.style.overflowY = 'auto';
        controlPanel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h2 style="margin: 0; font-size: 16px;">Motor Accessibility Settings</h2>
        <button id="accessibility-assistant-motor-close" style="background: none; border: none; cursor: pointer; font-size: 18px;">×</button>
      </div>
      
      <div style="margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-dwell-clicking">Dwell Clicking</label>
          <input type="checkbox" id="accessibility-assistant-dwell-clicking" ${settings.dwellClickingEnabled ? 'checked' : ''}>
        </div>
        
        <div style="margin-bottom: 10px;">
          <label for="accessibility-assistant-dwell-time">Dwell Time: ${settings.dwellTime}ms</label>
          <input type="range" id="accessibility-assistant-dwell-time" min="500" max="3000" step="100" value="${settings.dwellTime}" style="width: 100%;" ${!settings.dwellClickingEnabled ? 'disabled' : ''}>
        </div>
      </div>
      
      <div style="margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-keyboard-navigation">Keyboard Navigation</label>
          <input type="checkbox" id="accessibility-assistant-keyboard-navigation" ${settings.keyboardNavigationEnabled ? 'checked' : ''}>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-highlight-clickable">Highlight Clickable Elements</label>
          <input type="checkbox" id="accessibility-assistant-highlight-clickable" ${settings.showClickableElements ? 'checked' : ''}>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-auto-fill">Auto-Fill Forms</label>
          <input type="checkbox" id="accessibility-assistant-auto-fill" ${settings.autoFillForms ? 'checked' : ''}>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-gestures">Gesture Controls</label>
          <input type="checkbox" id="accessibility-assistant-gestures" ${settings.gesturesEnabled ? 'checked' : ''}>
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button id="accessibility-assistant-motor-reset" style="padding: 5px 10px; cursor: pointer;">Reset to Default</button>
        <button id="accessibility-assistant-motor-apply" style="padding: 5px 10px; cursor: pointer; background-color: #0078FF; color: white; border: none; border-radius: 4px;">Apply Settings</button>
      </div>
    `;
        document.body.appendChild(controlPanel);
        // Add event listeners
        document.getElementById('accessibility-assistant-motor-close')?.addEventListener('click', () => {
            hideControlPanel();
        });
        document.getElementById('accessibility-assistant-dwell-clicking')?.addEventListener('change', (e) => {
            settings.dwellClickingEnabled = e.target.checked;
            const dwellTimeSlider = document.getElementById('accessibility-assistant-dwell-time');
            if (dwellTimeSlider) {
                dwellTimeSlider.disabled = !settings.dwellClickingEnabled;
            }
        });
        document.getElementById('accessibility-assistant-dwell-time')?.addEventListener('input', (e) => {
            settings.dwellTime = parseInt(e.target.value);
            const label = document.querySelector('label[for="accessibility-assistant-dwell-time"]');
            if (label) {
                label.textContent = `Dwell Time: ${settings.dwellTime}ms`;
            }
        });
        document.getElementById('accessibility-assistant-keyboard-navigation')?.addEventListener('change', (e) => {
            settings.keyboardNavigationEnabled = e.target.checked;
        });
        document.getElementById('accessibility-assistant-highlight-clickable')?.addEventListener('change', (e) => {
            settings.showClickableElements = e.target.checked;
            if (settings.showClickableElements) {
                highlightClickableElements();
            }
            else {
                clearElementHighlights();
            }
        });
        document.getElementById('accessibility-assistant-auto-fill')?.addEventListener('change', (e) => {
            settings.autoFillForms = e.target.checked;
        });
        document.getElementById('accessibility-assistant-gestures')?.addEventListener('change', (e) => {
            settings.gesturesEnabled = e.target.checked;
        });
        document.getElementById('accessibility-assistant-motor-reset')?.addEventListener('click', resetToDefaults);
        document.getElementById('accessibility-assistant-motor-apply')?.addEventListener('click', () => {
            applySettings();
            saveSettings();
            hideControlPanel();
        });
    }
    // Create dwell indicator
    function createDwellIndicator() {
        dwellIndicator = document.createElement('div');
        dwellIndicator.id = 'accessibility-assistant-dwell-indicator';
        dwellIndicator.style.position = 'absolute';
        dwellIndicator.style.width = '30px';
        dwellIndicator.style.height = '30px';
        dwellIndicator.style.borderRadius = '50%';
        dwellIndicator.style.border = '2px solid #3498db';
        dwellIndicator.style.borderTop = '2px solid transparent';
        dwellIndicator.style.boxSizing = 'border-box';
        dwellIndicator.style.display = 'none';
        dwellIndicator.style.zIndex = '10001';
        dwellIndicator.style.pointerEvents = 'none';
        dwellIndicator.style.transition = 'transform 0.1s ease-out';
        document.body.appendChild(dwellIndicator);
    }
    // Create highlight overlay for clickable elements
    function createHighlightOverlay() {
        highlightOverlay = document.createElement('div');
        highlightOverlay.id = 'accessibility-assistant-highlight-overlay';
        highlightOverlay.style.position = 'absolute';
        highlightOverlay.style.top = '0';
        highlightOverlay.style.left = '0';
        highlightOverlay.style.width = '100%';
        highlightOverlay.style.height = '100%';
        highlightOverlay.style.zIndex = '9999';
        highlightOverlay.style.pointerEvents = 'none';
        document.body.appendChild(highlightOverlay);
    }
    // Update control panel with current settings
    function updateControlPanel() {
        const dwellCheckbox = document.getElementById('accessibility-assistant-dwell-clicking');
        if (dwellCheckbox) {
            dwellCheckbox.checked = settings.dwellClickingEnabled;
        }
        const dwellTimeSlider = document.getElementById('accessibility-assistant-dwell-time');
        if (dwellTimeSlider) {
            dwellTimeSlider.value = settings.dwellTime.toString();
            dwellTimeSlider.disabled = !settings.dwellClickingEnabled;
            const label = document.querySelector('label[for="accessibility-assistant-dwell-time"]');
            if (label) {
                label.textContent = `Dwell Time: ${settings.dwellTime}ms`;
            }
        }
        const keyboardNavCheckbox = document.getElementById('accessibility-assistant-keyboard-navigation');
        if (keyboardNavCheckbox) {
            keyboardNavCheckbox.checked = settings.keyboardNavigationEnabled;
        }
        const highlightClickableCheckbox = document.getElementById('accessibility-assistant-highlight-clickable');
        if (highlightClickableCheckbox) {
            highlightClickableCheckbox.checked = settings.showClickableElements;
        }
        const autoFillCheckbox = document.getElementById('accessibility-assistant-auto-fill');
        if (autoFillCheckbox) {
            autoFillCheckbox.checked = settings.autoFillForms;
        }
        const gesturesCheckbox = document.getElementById('accessibility-assistant-gestures');
        if (gesturesCheckbox) {
            gesturesCheckbox.checked = settings.gesturesEnabled;
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
            }
            else {
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
        // Dwell clicking
        if (settings.dwellClickingEnabled) {
            enableDwellClicking();
        }
        else {
            disableDwellClicking();
        }
        // Keyboard navigation
        if (settings.keyboardNavigationEnabled) {
            enableKeyboardNavigation();
        }
        else {
            disableKeyboardNavigation();
        }
        // Highlight clickable elements
        if (settings.showClickableElements) {
            highlightClickableElements();
        }
        else {
            clearElementHighlights();
        }
    }
    // Set up event listeners
    function setupEventListeners() {
        // Setup keyboard shortcut
        document.addEventListener('keydown', (e) => {
            // Alt+M: Toggle motor settings panel
            if (e.altKey && e.key === 'm') {
                e.preventDefault();
                toggleControlPanel();
            }
            // Alt+D: Toggle dwell clicking
            if (e.altKey && e.key === 'd') {
                e.preventDefault();
                settings.dwellClickingEnabled = !settings.dwellClickingEnabled;
                applySettings();
                saveSettings();
            }
            // Alt+K: Toggle keyboard navigation
            if (e.altKey && e.key === 'k') {
                e.preventDefault();
                settings.keyboardNavigationEnabled = !settings.keyboardNavigationEnabled;
                applySettings();
                saveSettings();
            }
            // Alt+H: Toggle highlight clickable elements
            if (e.altKey && e.key === 'h') {
                e.preventDefault();
                settings.showClickableElements = !settings.showClickableElements;
                applySettings();
                saveSettings();
            }
        });
    }
    // Initialize features based on settings
    function initializeFeatures() {
        if (settings.dwellClickingEnabled) {
            enableDwellClicking();
        }
        if (settings.keyboardNavigationEnabled) {
            enableKeyboardNavigation();
        }
        if (settings.showClickableElements) {
            highlightClickableElements();
        }
    }
    // Enable dwell clicking
    function enableDwellClicking() {
        // If already active, do nothing
        if (dwellState.isActive) {
            return;
        }
        // Create mouse move handler
        mouseMoveHandler = (e) => {
            if (!dwellIndicator)
                return;
            const x = e.clientX;
            const y = e.clientY;
            // Position the dwell indicator
            dwellIndicator.style.display = 'block';
            dwellIndicator.style.left = `${x - 15}px`;
            dwellIndicator.style.top = `${y - 15}px`;
            // Get element under cursor
            const element = document.elementFromPoint(x, y);
            // Check if the element has changed
            if (element !== dwellState.element) {
                // Reset dwell timer
                if (dwellState.timer !== null) {
                    clearTimeout(dwellState.timer);
                    resetDwellAnimation();
                }
                // Set new element
                dwellState.element = element;
                // Check if the element is clickable
                if (isClickableElement(element)) {
                    dwellState.startTime = Date.now();
                    // Start dwell animation
                    startDwellAnimation();
                    // Start dwell timer
                    dwellState.timer = window.setTimeout(() => {
                        // Trigger click
                        if (element) {
                            element.click();
                            // Visual feedback for click
                            const feedback = document.createElement('div');
                            feedback.style.position = 'absolute';
                            feedback.style.left = `${x - 25}px`;
                            feedback.style.top = `${y - 25}px`;
                            feedback.style.width = '50px';
                            feedback.style.height = '50px';
                            feedback.style.borderRadius = '50%';
                            feedback.style.backgroundColor = 'rgba(52, 152, 219, 0.3)';
                            feedback.style.zIndex = '10001';
                            feedback.style.pointerEvents = 'none';
                            feedback.style.animation = 'accessibility-assistant-click-feedback 0.5s ease-out forwards';
                            document.body.appendChild(feedback);
                            // Remove feedback element after animation
                            setTimeout(() => {
                                document.body.removeChild(feedback);
                            }, 500);
                            // Reset dwell state
                            resetDwellAnimation();
                        }
                    }, settings.dwellTime);
                }
            }
        };
        // Add mouse move event listener
        document.addEventListener('mousemove', mouseMoveHandler);
        // Create dwell animation styles
        const styleElement = document.createElement('style');
        styleElement.id = 'accessibility-assistant-dwell-styles';
        styleElement.textContent = `
      @keyframes accessibility-assistant-dwell-animation {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
      
      @keyframes accessibility-assistant-click-feedback {
        0% {
          transform: scale(0);
          opacity: 1;
        }
        100% {
          transform: scale(1);
          opacity: 0;
        }
      }
    `;
        document.head.appendChild(styleElement);
        dwellState.isActive = true;
    }
    // Start dwell animation
    function startDwellAnimation() {
        if (dwellIndicator) {
            dwellIndicator.style.animation = `accessibility-assistant-dwell-animation ${settings.dwellTime / 1000}s linear`;
        }
    }
    // Reset dwell animation
    function resetDwellAnimation() {
        if (dwellIndicator) {
            dwellIndicator.style.animation = 'none';
            // Trigger reflow
            void dwellIndicator.offsetWidth;
        }
        dwellState.startTime = null;
        if (dwellState.timer !== null) {
            clearTimeout(dwellState.timer);
            dwellState.timer = null;
        }
    }
    // Disable dwell clicking
    function disableDwellClicking() {
        // If not active, do nothing
        if (!dwellState.isActive) {
            return;
        }
        // Remove event listener
        if (mouseMoveHandler) {
            document.removeEventListener('mousemove', mouseMoveHandler);
            mouseMoveHandler = null;
        }
        // Hide dwell indicator
        if (dwellIndicator) {
            dwellIndicator.style.display = 'none';
        }
        // Reset state
        if (dwellState.timer !== null) {
            clearTimeout(dwellState.timer);
            dwellState.timer = null;
        }
        dwellState.element = null;
        dwellState.startTime = null;
        dwellState.isActive = false;
        // Remove styles
        const styleElement = document.getElementById('accessibility-assistant-dwell-styles');
        if (styleElement && styleElement.parentNode) {
            styleElement.parentNode.removeChild(styleElement);
        }
    }
    // Check if element is clickable
    function isClickableElement(element) {
        if (!element)
            return false;
        // Check tag name
        const clickableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
        if (clickableTags.includes(element.tagName)) {
            return true;
        }
        // Check for role attribute
        const clickableRoles = ['button', 'link', 'checkbox', 'radio', 'tab', 'menuitem'];
        const role = element.getAttribute('role');
        if (role && clickableRoles.includes(role)) {
            return true;
        }
        // Check for pointer cursor
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.cursor === 'pointer') {
            return true;
        }
        // Check for parent elements that might be clickable
        let parent = element.parentElement;
        let depth = 0;
        const maxDepth = 3; // Limit how far up the DOM we check
        while (parent && depth < maxDepth) {
            if (isClickableElement(parent)) {
                return true;
            }
            parent = parent.parentElement;
            depth++;
        }
        return false;
    }
    // Enable keyboard navigation
    function enableKeyboardNavigation() {
        // Scan for navigable elements
        scanNavigableElements();
        // Create keyboard handler
        keyboardHandler = (e) => {
            // If no control panel or other essential UI elements are active
            if (!controlPanel || controlPanel.style.display === 'none') {
                // Tab navigation is handled by browser
                // Arrow key navigation for highlighted elements
                if (settings.showClickableElements) {
                    // Only handle arrow keys if clickable elements are highlighted
                    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        navigateToNextElement();
                    }
                    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        navigateToPreviousElement();
                    }
                    else if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        activateCurrentElement();
                    }
                }
            }
        };
        // Add keyboard event listener
        document.addEventListener('keydown', keyboardHandler);
        // Add custom visible focus indicator styles
        const styleElement = document.createElement('style');
        styleElement.id = 'accessibility-assistant-keyboard-nav-styles';
        styleElement.textContent = `
      .accessibility-assistant-keyboard-focus {
        outline: 3px solid #2980b9 !important;
        outline-offset: 2px !important;
      }
    `;
        document.head.appendChild(styleElement);
    }
    // Disable keyboard navigation
    function disableKeyboardNavigation() {
        // Remove event listener
        if (keyboardHandler) {
            document.removeEventListener('keydown', keyboardHandler);
            keyboardHandler = null;
        }
        // Remove custom focus styles
        const styleElement = document.getElementById('accessibility-assistant-keyboard-nav-styles');
        if (styleElement && styleElement.parentNode) {
            styleElement.parentNode.removeChild(styleElement);
        }
        // Remove focus from currently highlighted element
        const focusedElement = document.querySelector('.accessibility-assistant-keyboard-focus');
        if (focusedElement) {
            focusedElement.classList.remove('accessibility-assistant-keyboard-focus');
        }
    }
    // Scan the page for navigable elements
    function scanNavigableElements() {
        clickableElements = [];
        currentElementIndex = -1;
        // Find all links and buttons
        const links = Array.from(document.querySelectorAll('a, button, [role="button"], [role="link"]'));
        // Find all inputs, selects, textareas
        const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
        // Find elements with click handlers (using cursor: pointer as a proxy)
        const clickables = Array.from(document.querySelectorAll('*')).filter(el => {
            const computedStyle = window.getComputedStyle(el);
            return computedStyle.cursor === 'pointer';
        });
        // Combine and deduplicate
        const allElements = [...new Set([...links, ...inputs, ...clickables])];
        // Filter out invisible elements
        const visibleElements = allElements.filter(el => {
            const rect = el.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
            return isVisible;
        });
        // Convert to NavigableElement format
        clickableElements = visibleElements.map(el => {
            return {
                element: el,
                role: el.getAttribute('role') || el.tagName.toLowerCase(),
                label: getElementLabel(el),
                rect: el.getBoundingClientRect(),
                tabIndex: el.tabIndex,
                isClickable: isClickableElement(el)
            };
        });
    }
    // Get element label (for accessibility)
    function getElementLabel(element) {
        // Check aria-label
        let label = element.getAttribute('aria-label');
        if (label)
            return label;
        // Check aria-labelledby
        const labelledBy = element.getAttribute('aria-labelledby');
        if (labelledBy) {
            const labelElement = document.getElementById(labelledBy);
            if (labelElement)
                return labelElement.textContent || '';
        }
        // Check for label element (for form controls)
        if (element.id) {
            const labelElement = document.querySelector(`label[for="${element.id}"]`);
            if (labelElement)
                return labelElement.textContent || '';
        }
        // Use text content or value for form elements
        if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
            return element.value || element.placeholder || '';
        }
        // Use text content
        return element.textContent?.trim() || '';
    }
    // Navigate to the next element in the clickable elements list
    function navigateToNextElement() {
        if (clickableElements.length === 0)
            return;
        // Remove focus from current element
        if (currentElementIndex >= 0 && currentElementIndex < clickableElements.length) {
            clickableElements[currentElementIndex].element.classList.remove('accessibility-assistant-keyboard-focus');
        }
        // Move to next element
        currentElementIndex = (currentElementIndex + 1) % clickableElements.length;
        // Focus new element
        const element = clickableElements[currentElementIndex].element;
        element.classList.add('accessibility-assistant-keyboard-focus');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Navigate to the previous element in the clickable elements list
    function navigateToPreviousElement() {
        if (clickableElements.length === 0)
            return;
        // Remove focus from current element
        if (currentElementIndex >= 0 && currentElementIndex < clickableElements.length) {
            clickableElements[currentElementIndex].element.classList.remove('accessibility-assistant-keyboard-focus');
        }
        // Move to previous element
        currentElementIndex = (currentElementIndex - 1 + clickableElements.length) % clickableElements.length;
        // Focus new element
        const element = clickableElements[currentElementIndex].element;
        element.classList.add('accessibility-assistant-keyboard-focus');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Activate (click) the current element
    function activateCurrentElement() {
        if (currentElementIndex >= 0 && currentElementIndex < clickableElements.length) {
            const element = clickableElements[currentElementIndex].element;
            element.click();
        }
    }
    // Highlight clickable elements on the page
    function highlightClickableElements() {
        // Scan for clickable elements
        scanNavigableElements();
        // Clear existing highlights
        clearElementHighlights();
        // Create highlights for each clickable element
        clickableElements.forEach((item, index) => {
            const element = item.element;
            const rect = element.getBoundingClientRect();
            const highlight = document.createElement('div');
            highlight.className = 'accessibility-assistant-element-highlight';
            highlight.style.position = 'absolute';
            highlight.style.left = `${rect.left + window.scrollX}px`;
            highlight.style.top = `${rect.top + window.scrollY}px`;
            highlight.style.width = `${rect.width}px`;
            highlight.style.height = `${rect.height}px`;
            highlight.style.border = '2px solid #2ecc71';
            highlight.style.borderRadius = '3px';
            highlight.style.zIndex = '9998';
            highlight.style.pointerEvents = 'none';
            highlight.style.boxSizing = 'border-box';
            // Add number badge for keyboard navigation
            const badge = document.createElement('div');
            badge.className = 'accessibility-assistant-element-badge';
            badge.style.position = 'absolute';
            badge.style.top = '0';
            badge.style.left = '0';
            badge.style.backgroundColor = '#2ecc71';
            badge.style.color = 'white';
            badge.style.padding = '2px 5px';
            badge.style.fontSize = '10px';
            badge.style.fontWeight = 'bold';
            badge.style.borderRadius = '3px';
            badge.style.transform = 'translate(-50%, -50%)';
            badge.textContent = (index + 1).toString();
            highlight.appendChild(badge);
            highlightOverlay?.appendChild(highlight);
        });
        // Update on scroll
        window.addEventListener('scroll', updateHighlightPositions);
        window.addEventListener('resize', updateHighlightPositions);
    }
    // Update positions of all highlights
    function updateHighlightPositions() {
        const highlights = document.querySelectorAll('.accessibility-assistant-element-highlight');
        highlights.forEach((highlight, index) => {
            if (index < clickableElements.length) {
                const element = clickableElements[index].element;
                const rect = element.getBoundingClientRect();
                highlight.style.left = `${rect.left + window.scrollX}px`;
                highlight.style.top = `${rect.top + window.scrollY}px`;
                highlight.style.width = `${rect.width}px`;
                highlight.style.height = `${rect.height}px`;
            }
        });
    }
    // Clear all element highlights
    function clearElementHighlights() {
        // Remove highlights
        const highlights = document.querySelectorAll('.accessibility-assistant-element-highlight');
        highlights.forEach(highlight => {
            highlight.parentNode?.removeChild(highlight);
        });
        // Remove event listeners
        window.removeEventListener('scroll', updateHighlightPositions);
        window.removeEventListener('resize', updateHighlightPositions);
    }
    // Clean up resources
    function cleanup() {
        // Disable features
        disableDwellClicking();
        disableKeyboardNavigation();
        clearElementHighlights();
        // Remove UI elements
        if (controlPanel && controlPanel.parentNode) {
            controlPanel.parentNode.removeChild(controlPanel);
        }
        if (dwellIndicator && dwellIndicator.parentNode) {
            dwellIndicator.parentNode.removeChild(dwellIndicator);
        }
        if (highlightOverlay && highlightOverlay.parentNode) {
            highlightOverlay.parentNode.removeChild(highlightOverlay);
        }
    }
    // Initialize motor assistant
    initialize();
    // Return public API
    return {
        showControlPanel,
        hideControlPanel,
        toggleControlPanel,
        enableDwellClicking,
        disableDwellClicking,
        toggleDwellClicking: () => {
            settings.dwellClickingEnabled = !settings.dwellClickingEnabled;
            applySettings();
            saveSettings();
        },
        enableKeyboardNavigation,
        disableKeyboardNavigation,
        toggleKeyboardNavigation: () => {
            settings.keyboardNavigationEnabled = !settings.keyboardNavigationEnabled;
            applySettings();
            saveSettings();
        },
        highlightClickableElements,
        clearElementHighlights,
        toggleElementHighlights: () => {
            settings.showClickableElements = !settings.showClickableElements;
            applySettings();
            saveSettings();
        },
        resetToDefaults,
        applySettings,
        cleanup
    };
}
export default createMotorAssistant;
