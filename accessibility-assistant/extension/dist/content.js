
// Content script
console.log('Accessibility Assistant content script loaded');

// Create status indicator
const createStatusIndicator = () => {
  const statusDiv = document.createElement('div');
  statusDiv.className = 'accessibility-assistant-overlay';
  statusDiv.textContent = 'Accessibility Assistant active';
  document.body.appendChild(statusDiv);

  // Auto-hide after 3 seconds
  setTimeout(() => {
    statusDiv.style.opacity = '0.7';
    statusDiv.style.transition = 'opacity 0.5s ease-in-out';
  }, 3000);
};

// Wait for page to be fully loaded
if (document.readyState === 'complete') {
  createStatusIndicator();
} else {
  window.addEventListener('load', createStatusIndicator);
}
