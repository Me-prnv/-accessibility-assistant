
// Background script
console.log('Accessibility Assistant background script loaded');

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.action.onClicked.addListener(tab => {
  console.log('Extension icon clicked', tab);
});
