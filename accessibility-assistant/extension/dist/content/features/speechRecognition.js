// Speech Recognition Module for Accessibility Assistant
// Provides voice command support and speech-to-text functionality
const defaultSettings = {
    enabled: false,
    language: 'en-US',
    continuous: true,
    interimResults: true,
    autoRestart: true,
    commandFeedback: true
};
// Initialize speech recognition
export function createSpeechRecognition(options = {}) {
    // Merge default settings with provided options
    const settings = {
        ...defaultSettings,
        ...options
    };
    // UI elements
    let controlPanel = null;
    let statusIndicator = null;
    let transcript = null;
    let commandList = null;
    // State
    let isActive = false;
    let recognition = null;
    let isListening = false;
    let supportsSpeechRecognition = false;
    let commands = [];
    let lastTranscript = '';
    let restartTimeout = null;
    // Initialize
    function initialize() {
        // Check browser support
        checkBrowserSupport();
        // Create UI elements
        createUI();
        // Load settings from storage
        loadSettings();
        // Initialize commands
        initializeDefaultCommands();
        // Start recognition if enabled
        if (settings.enabled) {
            startRecognition();
        }
    }
    // Check browser support for speech recognition
    function checkBrowserSupport() {
        const SpeechRecognitionAPI = window.SpeechRecognition ||
            window.webkitSpeechRecognition ||
            window.mozSpeechRecognition ||
            window.msSpeechRecognition;
        if (SpeechRecognitionAPI) {
            recognition = new SpeechRecognitionAPI();
            supportsSpeechRecognition = true;
        }
        else {
            console.error('Speech recognition not supported in this browser');
            supportsSpeechRecognition = false;
        }
    }
    // Load settings from Chrome storage
    function loadSettings() {
        chrome.storage.sync.get('speechRecognition', (data) => {
            if (data.speechRecognition) {
                Object.assign(settings, data.speechRecognition);
                updateControlPanel();
            }
        });
    }
    // Save settings to Chrome storage
    function saveSettings() {
        chrome.storage.sync.set({
            speechRecognition: settings
        });
    }
    // Create UI elements
    function createUI() {
        createControlPanel();
        createStatusIndicator();
        // If speech recognition is not supported, show error message in control panel
        if (!supportsSpeechRecognition) {
            const errorMessage = document.createElement('div');
            errorMessage.style.color = 'red';
            errorMessage.style.padding = '10px';
            errorMessage.style.marginBottom = '10px';
            errorMessage.style.backgroundColor = '#ffebee';
            errorMessage.style.borderRadius = '4px';
            errorMessage.innerHTML = 'Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.';
            if (controlPanel) {
                controlPanel.prepend(errorMessage);
            }
        }
    }
    // Create control panel UI
    function createControlPanel() {
        controlPanel = document.createElement('div');
        controlPanel.id = 'accessibility-assistant-speech-panel';
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
        <h2 style="margin: 0; font-size: 16px;">Speech Recognition Settings</h2>
        <button id="accessibility-assistant-speech-close" style="background: none; border: none; cursor: pointer; font-size: 18px;">×</button>
      </div>
      
      <div style="margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-speech-enabled">Enable Voice Commands</label>
          <input type="checkbox" id="accessibility-assistant-speech-enabled" ${settings.enabled ? 'checked' : ''}>
        </div>
        
        <div style="margin-bottom: 10px;">
          <label for="accessibility-assistant-speech-language">Language:</label>
          <select id="accessibility-assistant-speech-language" style="width: 100%; margin-top: 5px; padding: 5px;">
            <option value="en-US" ${settings.language === 'en-US' ? 'selected' : ''}>English (US)</option>
            <option value="en-GB" ${settings.language === 'en-GB' ? 'selected' : ''}>English (UK)</option>
            <option value="es-ES" ${settings.language === 'es-ES' ? 'selected' : ''}>Spanish</option>
            <option value="fr-FR" ${settings.language === 'fr-FR' ? 'selected' : ''}>French</option>
            <option value="de-DE" ${settings.language === 'de-DE' ? 'selected' : ''}>German</option>
            <option value="ja-JP" ${settings.language === 'ja-JP' ? 'selected' : ''}>Japanese</option>
            <option value="zh-CN" ${settings.language === 'zh-CN' ? 'selected' : ''}>Chinese (Simplified)</option>
          </select>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-speech-continuous">Continuous Listening</label>
          <input type="checkbox" id="accessibility-assistant-speech-continuous" ${settings.continuous ? 'checked' : ''}>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-speech-interim">Show Interim Results</label>
          <input type="checkbox" id="accessibility-assistant-speech-interim" ${settings.interimResults ? 'checked' : ''}>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-speech-autorestart">Auto Restart</label>
          <input type="checkbox" id="accessibility-assistant-speech-autorestart" ${settings.autoRestart ? 'checked' : ''}>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label for="accessibility-assistant-speech-feedback">Command Feedback</label>
          <input type="checkbox" id="accessibility-assistant-speech-feedback" ${settings.commandFeedback ? 'checked' : ''}>
        </div>
      </div>
      
      <div style="margin-bottom: 15px;">
        <h3 style="font-size: 14px; margin-bottom: 10px;">Transcript</h3>
        <div id="accessibility-assistant-speech-transcript" style="background-color: #f5f5f5; border-radius: 4px; padding: 10px; max-height: 100px; overflow-y: auto; margin-bottom: 10px; font-size: 14px; color: #333;">
          Waiting for speech input...
        </div>
        <button id="accessibility-assistant-speech-clear" style="padding: 5px 10px; cursor: pointer; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 4px;">Clear Transcript</button>
      </div>
      
      <div style="margin-bottom: 15px;">
        <h3 style="font-size: 14px; margin-bottom: 10px;">Available Commands</h3>
        <div id="accessibility-assistant-command-list" style="max-height: 200px; overflow-y: auto; font-size: 14px;">
          Loading commands...
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button id="accessibility-assistant-speech-reset" style="padding: 5px 10px; cursor: pointer;">Reset to Default</button>
        <button id="accessibility-assistant-speech-apply" style="padding: 5px 10px; cursor: pointer; background-color: #0078FF; color: white; border: none; border-radius: 4px;">Apply Settings</button>
      </div>
    `;
        document.body.appendChild(controlPanel);
        // Get transcript element
        transcript = document.getElementById('accessibility-assistant-speech-transcript');
        // Get command list element
        commandList = document.getElementById('accessibility-assistant-command-list');
        // Add event listeners
        document.getElementById('accessibility-assistant-speech-close')?.addEventListener('click', () => {
            hideControlPanel();
        });
        document.getElementById('accessibility-assistant-speech-enabled')?.addEventListener('change', (e) => {
            settings.enabled = e.target.checked;
        });
        document.getElementById('accessibility-assistant-speech-language')?.addEventListener('change', (e) => {
            settings.language = e.target.value;
        });
        document.getElementById('accessibility-assistant-speech-continuous')?.addEventListener('change', (e) => {
            settings.continuous = e.target.checked;
        });
        document.getElementById('accessibility-assistant-speech-interim')?.addEventListener('change', (e) => {
            settings.interimResults = e.target.checked;
        });
        document.getElementById('accessibility-assistant-speech-autorestart')?.addEventListener('change', (e) => {
            settings.autoRestart = e.target.checked;
        });
        document.getElementById('accessibility-assistant-speech-feedback')?.addEventListener('change', (e) => {
            settings.commandFeedback = e.target.checked;
        });
        document.getElementById('accessibility-assistant-speech-clear')?.addEventListener('click', () => {
            if (transcript) {
                transcript.textContent = 'Waiting for speech input...';
            }
            lastTranscript = '';
        });
        document.getElementById('accessibility-assistant-speech-reset')?.addEventListener('click', resetToDefaults);
        document.getElementById('accessibility-assistant-speech-apply')?.addEventListener('click', () => {
            applySettings();
            saveSettings();
            hideControlPanel();
        });
    }
    // Create status indicator
    function createStatusIndicator() {
        statusIndicator = document.createElement('div');
        statusIndicator.id = 'accessibility-assistant-speech-status';
        statusIndicator.style.position = 'fixed';
        statusIndicator.style.bottom = '20px';
        statusIndicator.style.right = '20px';
        statusIndicator.style.width = '50px';
        statusIndicator.style.height = '50px';
        statusIndicator.style.borderRadius = '50%';
        statusIndicator.style.backgroundColor = '#ddd';
        statusIndicator.style.display = 'flex';
        statusIndicator.style.justifyContent = 'center';
        statusIndicator.style.alignItems = 'center';
        statusIndicator.style.zIndex = '10000';
        statusIndicator.style.cursor = 'pointer';
        statusIndicator.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
        statusIndicator.style.transition = 'all 0.3s ease';
        // Add microphone icon
        statusIndicator.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#666">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
    `;
        document.body.appendChild(statusIndicator);
        // Add click event to toggle speech recognition
        statusIndicator.addEventListener('click', () => {
            toggleRecognition();
        });
    }
    // Update control panel with current settings
    function updateControlPanel() {
        const enabledCheckbox = document.getElementById('accessibility-assistant-speech-enabled');
        if (enabledCheckbox) {
            enabledCheckbox.checked = settings.enabled;
        }
        const languageSelect = document.getElementById('accessibility-assistant-speech-language');
        if (languageSelect) {
            languageSelect.value = settings.language;
        }
        const continuousCheckbox = document.getElementById('accessibility-assistant-speech-continuous');
        if (continuousCheckbox) {
            continuousCheckbox.checked = settings.continuous;
        }
        const interimCheckbox = document.getElementById('accessibility-assistant-speech-interim');
        if (interimCheckbox) {
            interimCheckbox.checked = settings.interimResults;
        }
        const autoRestartCheckbox = document.getElementById('accessibility-assistant-speech-autorestart');
        if (autoRestartCheckbox) {
            autoRestartCheckbox.checked = settings.autoRestart;
        }
        const feedbackCheckbox = document.getElementById('accessibility-assistant-speech-feedback');
        if (feedbackCheckbox) {
            feedbackCheckbox.checked = settings.commandFeedback;
        }
        // Update command list
        updateCommandList();
    }
    // Update command list display
    function updateCommandList() {
        if (commandList) {
            commandList.innerHTML = '';
            if (commands.length === 0) {
                commandList.innerHTML = '<div style="color: #666; padding: 10px;">No commands available.</div>';
            }
            else {
                const table = document.createElement('table');
                table.style.width = '100%';
                table.style.borderCollapse = 'collapse';
                // Create header
                const thead = document.createElement('thead');
                thead.innerHTML = `
          <tr style="border-bottom: 1px solid #ddd;">
            <th style="text-align: left; padding: 5px;">Command</th>
            <th style="text-align: left; padding: 5px;">Description</th>
          </tr>
        `;
                table.appendChild(thead);
                // Create body
                const tbody = document.createElement('tbody');
                commands.forEach(command => {
                    const tr = document.createElement('tr');
                    tr.style.borderBottom = '1px solid #eee';
                    const patternCell = document.createElement('td');
                    patternCell.style.padding = '5px';
                    patternCell.style.fontWeight = 'bold';
                    patternCell.textContent = typeof command.pattern === 'string' ? command.pattern : command.pattern.toString();
                    const descCell = document.createElement('td');
                    descCell.style.padding = '5px';
                    descCell.textContent = command.description;
                    tr.appendChild(patternCell);
                    tr.appendChild(descCell);
                    tbody.appendChild(tr);
                });
                table.appendChild(tbody);
                commandList.appendChild(table);
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
        if (recognition) {
            // Apply settings to recognition object
            recognition.lang = settings.language;
            recognition.continuous = settings.continuous;
            recognition.interimResults = settings.interimResults;
            // Update recognition state based on enabled setting
            if (settings.enabled) {
                startRecognition();
            }
            else {
                stopRecognition();
            }
        }
    }
    // Initialize default commands
    function initializeDefaultCommands() {
        commands = [
            {
                pattern: 'click',
                description: 'Click the element under the cursor',
                action: () => {
                    const element = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
                    if (element) {
                        element.click();
                    }
                }
            },
            {
                pattern: 'scroll down',
                description: 'Scroll down the page',
                action: () => {
                    window.scrollBy({
                        top: window.innerHeight * 0.8,
                        behavior: 'smooth'
                    });
                }
            },
            {
                pattern: 'scroll up',
                description: 'Scroll up the page',
                action: () => {
                    window.scrollBy({
                        top: -window.innerHeight * 0.8,
                        behavior: 'smooth'
                    });
                }
            },
            {
                pattern: 'top',
                description: 'Scroll to the top of the page',
                action: () => {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
            },
            {
                pattern: 'bottom',
                description: 'Scroll to the bottom of the page',
                action: () => {
                    window.scrollTo({
                        top: document.body.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            },
            {
                pattern: 'back',
                description: 'Go back in history',
                action: () => {
                    window.history.back();
                }
            },
            {
                pattern: 'forward',
                description: 'Go forward in history',
                action: () => {
                    window.history.forward();
                }
            },
            {
                pattern: 'reload',
                description: 'Reload the page',
                action: () => {
                    window.location.reload();
                }
            },
            {
                pattern: /click (?:on )?(.+)/i,
                description: 'Click on an element with the specified text',
                action: (matches) => {
                    if (matches && matches.length > 1) {
                        const text = matches[1].trim();
                        clickElementWithText(text);
                    }
                }
            },
            {
                pattern: 'focus search',
                description: 'Focus on the search input',
                action: () => {
                    const searchInputs = Array.from(document.querySelectorAll('input[type="search"], input[name*="search"], input[placeholder*="search"], input[id*="search"]'));
                    if (searchInputs.length > 0) {
                        searchInputs[0].focus();
                    }
                }
            },
            {
                pattern: /search for (.+)/i,
                description: 'Search for text in the page',
                action: (matches) => {
                    if (matches && matches.length > 1) {
                        const text = matches[1].trim();
                        const searchInputs = Array.from(document.querySelectorAll('input[type="search"], input[name*="search"], input[placeholder*="search"], input[id*="search"]'));
                        if (searchInputs.length > 0) {
                            searchInputs[0].focus();
                            searchInputs[0].value = text;
                            searchInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                            setTimeout(() => {
                                searchInputs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
                            }, 100);
                        }
                    }
                }
            },
            {
                pattern: 'stop listening',
                description: 'Stop speech recognition',
                action: () => {
                    stopRecognition();
                    if (settings.commandFeedback) {
                        speak('Speech recognition stopped.');
                    }
                }
            },
            {
                pattern: 'start listening',
                description: 'Start speech recognition',
                action: () => {
                    startRecognition();
                    if (settings.commandFeedback) {
                        speak('Speech recognition started.');
                    }
                }
            },
            {
                pattern: 'show commands',
                description: 'Show available voice commands',
                action: () => {
                    showControlPanel();
                    if (settings.commandFeedback) {
                        speak('Showing voice commands.');
                    }
                }
            }
        ];
        updateCommandList();
    }
    // Start speech recognition
    function startRecognition() {
        if (!recognition || isListening)
            return;
        try {
            // Configure recognition
            recognition.lang = settings.language;
            recognition.continuous = settings.continuous;
            recognition.interimResults = settings.interimResults;
            // Set up event handlers
            recognition.onstart = handleRecognitionStart;
            recognition.onresult = handleRecognitionResult;
            recognition.onerror = handleRecognitionError;
            recognition.onend = handleRecognitionEnd;
            // Start recognition
            recognition.start();
            isActive = true;
            // Update status indicator
            updateStatusIndicator(true);
        }
        catch (error) {
            console.error('Error starting speech recognition:', error);
        }
    }
    // Stop speech recognition
    function stopRecognition() {
        if (!recognition || !isListening)
            return;
        try {
            recognition.stop();
            isActive = false;
            // Update status indicator
            updateStatusIndicator(false);
            // Clear any restart timeouts
            if (restartTimeout !== null) {
                window.clearTimeout(restartTimeout);
                restartTimeout = null;
            }
        }
        catch (error) {
            console.error('Error stopping speech recognition:', error);
        }
    }
    // Toggle speech recognition
    function toggleRecognition() {
        if (isListening) {
            stopRecognition();
        }
        else {
            startRecognition();
        }
    }
    // Handle recognition start event
    function handleRecognitionStart() {
        isListening = true;
        updateStatusIndicator(true);
    }
    // Handle recognition result event
    function handleRecognitionResult(event) {
        // Get latest result
        const resultIndex = event.results.length - 1;
        const transcript = event.results[resultIndex][0].transcript.trim();
        // Update transcript display
        updateTranscript(transcript, event.results[resultIndex].isFinal);
        // If result is final, process command
        if (event.results[resultIndex].isFinal) {
            processCommand(transcript);
        }
    }
    // Handle recognition error event
    function handleRecognitionError(event) {
        console.error('Speech recognition error:', event.error);
        // Update status indicator
        updateStatusIndicator(false);
        // Update transcript with error
        if (transcript) {
            transcript.innerHTML += `<div style="color: red;">Error: ${event.error}</div>`;
            transcript.scrollTop = transcript.scrollHeight;
        }
        isListening = false;
        // Auto restart if enabled
        if (settings.autoRestart && settings.enabled) {
            restartTimeout = window.setTimeout(() => {
                startRecognition();
            }, 1000);
        }
    }
    // Handle recognition end event
    function handleRecognitionEnd() {
        isListening = false;
        updateStatusIndicator(false);
        // Auto restart if enabled
        if (settings.autoRestart && settings.enabled && isActive) {
            restartTimeout = window.setTimeout(() => {
                startRecognition();
            }, 1000);
        }
    }
    // Update transcript display
    function updateTranscript(text, isFinal) {
        if (!transcript)
            return;
        if (isFinal) {
            lastTranscript += ' ' + text;
            transcript.innerHTML = `<div>${lastTranscript.trim()}</div>`;
        }
        else {
            transcript.innerHTML = `<div>${lastTranscript.trim()} <span style="color: #999;">${text}</span></div>`;
        }
        transcript.scrollTop = transcript.scrollHeight;
    }
    // Process voice command
    function processCommand(text) {
        // Check each command pattern
        for (const command of commands) {
            if (typeof command.pattern === 'string') {
                // Simple string matching (case insensitive)
                if (text.toLowerCase().includes(command.pattern.toLowerCase())) {
                    executeCommand(command, text);
                    break;
                }
            }
            else if (command.pattern instanceof RegExp) {
                // Regular expression matching
                const matches = text.match(command.pattern);
                if (matches) {
                    executeCommand(command, text, matches);
                    break;
                }
            }
        }
    }
    // Execute a command
    function executeCommand(command, text, matches) {
        if (settings.commandFeedback) {
            // Add visual feedback
            if (transcript) {
                transcript.innerHTML += `<div style="color: green; font-weight: bold;">Executing: ${command.description}</div>`;
            }
        }
        // Execute the command action
        command.action(matches);
    }
    // Update status indicator
    function updateStatusIndicator(isActive) {
        if (!statusIndicator)
            return;
        if (isActive) {
            statusIndicator.style.backgroundColor = '#4caf50';
            statusIndicator.querySelector('svg')?.setAttribute('fill', 'white');
            // Add pulsing animation
            statusIndicator.style.animation = 'accessibility-assistant-pulse 1.5s infinite';
        }
        else {
            statusIndicator.style.backgroundColor = '#ddd';
            statusIndicator.querySelector('svg')?.setAttribute('fill', '#666');
            // Remove animation
            statusIndicator.style.animation = 'none';
        }
    }
    // Add CSS styles
    function addStyles() {
        const styleElement = document.createElement('style');
        styleElement.id = 'accessibility-assistant-speech-styles';
        styleElement.textContent = `
      @keyframes accessibility-assistant-pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
        }
      }
    `;
        document.head.appendChild(styleElement);
    }
    // Click element with specified text
    function clickElementWithText(text) {
        // Look for elements containing the text
        const allElements = document.querySelectorAll('a, button, [role="button"], input[type="submit"], input[type="button"]');
        for (let i = 0; i < allElements.length; i++) {
            const element = allElements[i];
            const elementText = element.innerText || element.textContent || '';
            if (elementText.toLowerCase().includes(text.toLowerCase())) {
                // Highlight the element briefly
                const originalOutline = element.style.outline;
                element.style.outline = '2px solid #4caf50';
                // Click the element
                element.click();
                // Restore original outline after a delay
                setTimeout(() => {
                    element.style.outline = originalOutline;
                }, 1000);
                return true;
            }
        }
        // If not found, look for input with matching label
        const labels = document.querySelectorAll('label');
        for (let i = 0; i < labels.length; i++) {
            const label = labels[i];
            const labelText = label.innerText || label.textContent || '';
            if (labelText.toLowerCase().includes(text.toLowerCase())) {
                // If label has for attribute, find the corresponding input
                if (label.htmlFor) {
                    const input = document.getElementById(label.htmlFor);
                    if (input) {
                        input.click();
                        return true;
                    }
                }
                else {
                    // Check for input within the label
                    const input = label.querySelector('input, button, select, textarea');
                    if (input) {
                        input.click();
                        return true;
                    }
                }
            }
        }
        return false;
    }
    // Text-to-Speech feedback
    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = settings.language;
        utterance.volume = 1.0;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }
    // Add a custom command
    function addCommand(pattern, description, action) {
        commands.push({ pattern, description, action });
        updateCommandList();
    }
    // Remove a command
    function removeCommand(pattern) {
        const index = commands.findIndex(cmd => {
            if (typeof pattern === 'string' && typeof cmd.pattern === 'string') {
                return cmd.pattern === pattern;
            }
            else if (pattern instanceof RegExp && cmd.pattern instanceof RegExp) {
                return cmd.pattern.toString() === pattern.toString();
            }
            return false;
        });
        if (index !== -1) {
            commands.splice(index, 1);
            updateCommandList();
            return true;
        }
        return false;
    }
    // Clean up resources
    function cleanup() {
        // Stop recognition
        stopRecognition();
        // Remove UI elements
        if (controlPanel && controlPanel.parentNode) {
            controlPanel.parentNode.removeChild(controlPanel);
        }
        if (statusIndicator && statusIndicator.parentNode) {
            statusIndicator.parentNode.removeChild(statusIndicator);
        }
        // Remove styles
        const styles = document.getElementById('accessibility-assistant-speech-styles');
        if (styles && styles.parentNode) {
            styles.parentNode.removeChild(styles);
        }
    }
    // Add styles
    addStyles();
    // Initialize
    initialize();
    // Public API
    return {
        startRecognition,
        stopRecognition,
        toggleRecognition,
        showControlPanel,
        hideControlPanel,
        toggleControlPanel,
        addCommand,
        removeCommand,
        resetToDefaults,
        applySettings,
        isSpeechRecognitionSupported: () => supportsSpeechRecognition,
        isActive: () => isActive,
        isListening: () => isListening,
        getCommands: () => [...commands],
        cleanup
    };
}
export default createSpeechRecognition;
