const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Copy manifest.json
fs.copyFileSync(
  path.join(__dirname, 'public', 'manifest.json'),
  path.join(distDir, 'manifest.json')
);
console.log('Manifest file copied successfully');

// Create popup.html if it doesn't exist
const popupHtmlPath = path.join(distDir, 'popup.html');
if (!fs.existsSync(path.join(__dirname, 'public', 'popup.html'))) {
  fs.writeFileSync(popupHtmlPath, `
<!DOCTYPE html>
<html>
<head>
  <title>Accessibility Assistant</title>
  <meta charset="utf-8">
  <style>
    body {
      width: 300px;
      font-family: Arial, sans-serif;
      padding: 10px;
    }
    h1 {
      font-size: 18px;
      margin-bottom: 15px;
    }
    button {
      padding: 8px 12px;
      margin: 5px 0;
      background-color: #4285f4;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background-color: #3367d6;
    }
  </style>
</head>
<body>
  <h1>Accessibility Assistant</h1>
  <p>Improve web accessibility with AI assistance</p>
  <button id="toggleAssistant">Enable/Disable Assistant</button>
  <button id="settings">Settings</button>
  <script src="popup.js"></script>
</body>
</html>
  `);
  console.log('Created popup.html');

  // Create popup.js
  fs.writeFileSync(path.join(distDir, 'popup.js'), `
document.getElementById('toggleAssistant').addEventListener('click', () => {
  console.log('Toggle assistant clicked');
});

document.getElementById('settings').addEventListener('click', () => {
  console.log('Settings clicked');
});
  `);
  console.log('Created popup.js');
} else {
  fs.copyFileSync(
    path.join(__dirname, 'public', 'popup.html'),
    popupHtmlPath
  );
  console.log('Popup HTML file copied successfully');
}

// Create or copy content.css
try {
  fs.copyFileSync(
    path.join(__dirname, 'public', 'content.css'),
    path.join(distDir, 'content.css')
  );
  console.log('Content CSS file copied successfully');
} catch (err) {
  fs.writeFileSync(path.join(distDir, 'content.css'), `
.accessibility-assistant-overlay {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px;
  border-radius: 5px;
  z-index: 9999;
  font-family: Arial, sans-serif;
}
  `);
  console.log('Created content.css');
}

// Create placeholder JS files
const createPlaceholderFile = (filename, content) => {
  fs.writeFileSync(path.join(distDir, filename), content);
  console.log(`Created ${filename}`);
};

createPlaceholderFile('background.js', `
// Background script
console.log('Accessibility Assistant background script loaded');

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.action.onClicked.addListener(tab => {
  console.log('Extension icon clicked', tab);
});
`);

createPlaceholderFile('content.js', `
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
`);

// Create icons folder
const iconsDir = path.join(distDir, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// Function to create a colored square icon
const createColoredSquareIcon = (filePath, size) => {
  // Create a simple SVG colored square
  const svgContent = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#4285f4"/>
  <text x="50%" y="50%" font-family="Arial" font-size="${size/2}" 
        fill="white" text-anchor="middle" dominant-baseline="middle">A</text>
</svg>`;

  fs.writeFileSync(filePath, svgContent);
  console.log(`Created icon: ${path.basename(filePath)}`);
};

// Create icons of various sizes
const iconSizes = {
  'icon16.png': 16,
  'icon48.png': 48,
  'icon128.png': 128
};

Object.entries(iconSizes).forEach(([name, size]) => {
  createColoredSquareIcon(path.join(iconsDir, name), size);
});

console.log('Extension files prepared for loading');