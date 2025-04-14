// Command Processor for Accessibility Assistant
// Handles execution of voice commands and accessibility features

// Types
interface CommandHandler {
  (params: any): void;
}

// Command registry
const commands: Record<string, CommandHandler> = {};

// Register command handlers
function registerCommands() {
  // Navigation commands
  commands['scroll_down'] = (params) => {
    const amount = params?.amount || 300;
    window.scrollBy({ top: amount, behavior: 'smooth' });
  };
  
  commands['scroll_up'] = (params) => {
    const amount = params?.amount || 300;
    window.scrollBy({ top: -amount, behavior: 'smooth' });
  };
  
  commands['scroll_bottom'] = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };
  
  commands['scroll_top'] = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  commands['go_back'] = () => {
    window.history.back();
  };
  
  commands['go_forward'] = () => {
    window.history.forward();
  };
  
  commands['refresh_page'] = () => {
    window.location.reload();
  };
  
  // Click commands
  commands['click'] = (params) => {
    const targetText = params?.text;
    if (!targetText) return;
    
    clickElementWithText(targetText);
  };
  
  commands['click_button'] = (params) => {
    const buttonText = params?.text;
    if (!buttonText) return;
    
    clickButtonWithText(buttonText);
  };
  
  commands['click_link'] = (params) => {
    const linkText = params?.text;
    if (!linkText) return;
    
    clickLinkWithText(linkText);
  };
  
  // Form interaction commands
  commands['fill_input'] = (params) => {
    const { field, value } = params || {};
    if (!field || !value) return;
    
    fillInputField(field, value);
  };
  
  commands['submit_form'] = () => {
    submitCurrentForm();
  };
  
  // Accessibility commands
  commands['read_aloud'] = (params) => {
    const text = params?.text || getSelectedText();
    if (!text) return;
    
    // We'll need to import the readTextAloud function from content script
    // For now, we'll dispatch a custom event
    document.dispatchEvent(new CustomEvent('accessibility-assistant-read-text', {
      detail: { text }
    }));
  };
  
  commands['toggle_high_contrast'] = () => {
    document.dispatchEvent(new CustomEvent('accessibility-assistant-toggle-high-contrast'));
  };
  
  commands['increase_font_size'] = () => {
    changeFontSize(0.1);
  };
  
  commands['decrease_font_size'] = () => {
    changeFontSize(-0.1);
  };
  
  commands['summarize_page'] = () => {
    document.dispatchEvent(new CustomEvent('accessibility-assistant-summarize-page'));
  };
  
  commands['simplify_page'] = () => {
    document.dispatchEvent(new CustomEvent('accessibility-assistant-toggle-simplified-view'));
  };
  
  // Tab management commands
  commands['new_tab'] = () => {
    chrome.runtime.sendMessage({ type: 'OPEN_NEW_TAB' });
  };
  
  commands['close_tab'] = () => {
    chrome.runtime.sendMessage({ type: 'CLOSE_CURRENT_TAB' });
  };
  
  commands['switch_tab'] = (params) => {
    const tabIndex = params?.index;
    if (tabIndex !== undefined) {
      chrome.runtime.sendMessage({ type: 'SWITCH_TAB', payload: { index: tabIndex } });
    }
  };
  
  // Assistant control commands
  commands['open_assistant'] = () => {
    chrome.runtime.sendMessage({ type: 'OPEN_ASSISTANT' });
  };
  
  commands['close_assistant'] = () => {
    chrome.runtime.sendMessage({ type: 'CLOSE_ASSISTANT' });
  };
}

// Execute a command
export function executeCommand(commandName: string, params: any = {}) {
  console.log(`Executing command: ${commandName}`, params);
  
  // Initialize commands if they haven't been registered yet
  if (Object.keys(commands).length === 0) {
    registerCommands();
  }
  
  const handler = commands[commandName];
  if (handler) {
    try {
      handler(params);
      return true;
    } catch (error) {
      console.error(`Error executing command ${commandName}:`, error);
      return false;
    }
  } else {
    console.warn(`Unknown command: ${commandName}`);
    return false;
  }
}

// Helper function to get selected text
function getSelectedText(): string {
  return window.getSelection()?.toString() || '';
}

// Helper function to click an element containing specific text
function clickElementWithText(text: string) {
  // Create a text matcher that's more forgiving
  const normalizedSearchText = text.toLowerCase().trim();
  
  // Find all potentially clickable elements
  const clickableElements = document.querySelectorAll('a, button, [role="button"], input[type="submit"], input[type="button"], [tabindex]');
  
  // Try exact match first
  for (const element of Array.from(clickableElements)) {
    const elementText = element.textContent?.toLowerCase().trim() || '';
    if (elementText === normalizedSearchText) {
      (element as HTMLElement).click();
      return true;
    }
  }
  
  // Try contains match
  for (const element of Array.from(clickableElements)) {
    const elementText = element.textContent?.toLowerCase().trim() || '';
    if (elementText.includes(normalizedSearchText)) {
      (element as HTMLElement).click();
      return true;
    }
  }
  
  // Try finding elements by aria-label
  for (const element of Array.from(clickableElements)) {
    const ariaLabel = (element as HTMLElement).getAttribute('aria-label')?.toLowerCase().trim() || '';
    if (ariaLabel.includes(normalizedSearchText)) {
      (element as HTMLElement).click();
      return true;
    }
  }
  
  // Try looking for elements with children containing the text
  const allElements = document.querySelectorAll('*');
  for (const element of Array.from(allElements)) {
    if (element.textContent?.toLowerCase().includes(normalizedSearchText)) {
      // Check if this element or its parent is clickable
      const clickableParent = findClickableParent(element as HTMLElement);
      if (clickableParent) {
        clickableParent.click();
        return true;
      }
    }
  }
  
  console.warn(`No element found containing text: ${text}`);
  return false;
}

// Find the closest clickable parent of an element
function findClickableParent(element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element;
  
  while (current) {
    if (isClickable(current)) {
      return current;
    }
    current = current.parentElement;
  }
  
  return null;
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

// Helper function to click a button with specific text
function clickButtonWithText(text: string) {
  // Find all buttons
  const buttons = document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]');
  
  const normalizedSearchText = text.toLowerCase().trim();
  
  // Try exact match first
  for (const button of Array.from(buttons)) {
    const buttonText = button.textContent?.toLowerCase().trim() || '';
    if (buttonText === normalizedSearchText) {
      (button as HTMLElement).click();
      return true;
    }
  }
  
  // Try contains match
  for (const button of Array.from(buttons)) {
    const buttonText = button.textContent?.toLowerCase().trim() || '';
    if (buttonText.includes(normalizedSearchText)) {
      (button as HTMLElement).click();
      return true;
    }
  }
  
  // Try finding buttons by aria-label
  for (const button of Array.from(buttons)) {
    const ariaLabel = (button as HTMLElement).getAttribute('aria-label')?.toLowerCase().trim() || '';
    if (ariaLabel.includes(normalizedSearchText)) {
      (button as HTMLElement).click();
      return true;
    }
  }
  
  console.warn(`No button found containing text: ${text}`);
  return false;
}

// Helper function to click a link with specific text
function clickLinkWithText(text: string) {
  // Find all links
  const links = document.querySelectorAll('a');
  
  const normalizedSearchText = text.toLowerCase().trim();
  
  // Try exact match first
  for (const link of Array.from(links)) {
    const linkText = link.textContent?.toLowerCase().trim() || '';
    if (linkText === normalizedSearchText) {
      (link as HTMLElement).click();
      return true;
    }
  }
  
  // Try contains match
  for (const link of Array.from(links)) {
    const linkText = link.textContent?.toLowerCase().trim() || '';
    if (linkText.includes(normalizedSearchText)) {
      (link as HTMLElement).click();
      return true;
    }
  }
  
  // Try finding links by aria-label
  for (const link of Array.from(links)) {
    const ariaLabel = (link as HTMLElement).getAttribute('aria-label')?.toLowerCase().trim() || '';
    if (ariaLabel.includes(normalizedSearchText)) {
      (link as HTMLElement).click();
      return true;
    }
  }
  
  console.warn(`No link found containing text: ${text}`);
  return false;
}

// Helper function to fill an input field
function fillInputField(fieldName: string, value: string) {
  // Find input by name, id, placeholder, or label
  const normalizedFieldName = fieldName.toLowerCase().trim();
  
  // Try by id
  let input = document.getElementById(normalizedFieldName) as HTMLInputElement | null;
  
  // Try by name attribute
  if (!input) {
    input = document.querySelector(`input[name="${normalizedFieldName}"]`) as HTMLInputElement | null;
  }
  
  // Try by placeholder
  if (!input) {
    input = Array.from(document.querySelectorAll('input, textarea')).find(
      input => input.getAttribute('placeholder')?.toLowerCase().includes(normalizedFieldName)
    ) as HTMLInputElement | null;
  }
  
  // Try by aria-label
  if (!input) {
    input = Array.from(document.querySelectorAll('input, textarea')).find(
      input => input.getAttribute('aria-label')?.toLowerCase().includes(normalizedFieldName)
    ) as HTMLInputElement | null;
  }
  
  // Try by associated label
  if (!input) {
    const labels = Array.from(document.querySelectorAll('label'));
    for (const label of labels) {
      if (label.textContent?.toLowerCase().includes(normalizedFieldName)) {
        const forAttr = label.getAttribute('for');
        if (forAttr) {
          input = document.getElementById(forAttr) as HTMLInputElement | null;
          if (input) break;
        } else {
          // Label might be wrapping the input
          input = label.querySelector('input, textarea') as HTMLInputElement | null;
          if (input) break;
        }
      }
    }
  }
  
  // If we found an input, fill it and focus it
  if (input) {
    input.focus();
    input.value = value;
    
    // Dispatch input event to trigger any listeners
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    
    return true;
  }
  
  console.warn(`No input field found matching: ${fieldName}`);
  return false;
}

// Helper function to submit the current form
function submitCurrentForm() {
  // Find the form that contains the active element
  const activeElement = document.activeElement as HTMLElement;
  
  if (activeElement) {
    let form: HTMLFormElement | null = null;
    
    // Check if active element is within a form
    let parent = activeElement.parentElement;
    while (parent) {
      if (parent.tagName === 'FORM') {
        form = parent as HTMLFormElement;
        break;
      }
      parent = parent.parentElement;
    }
    
    if (form) {
      form.submit();
      return true;
    }
    
    // If no form found, try to find a submit button and click it
    const submitButton = activeElement.closest('form')?.querySelector('input[type="submit"], button[type="submit"]') as HTMLElement;
    if (submitButton) {
      submitButton.click();
      return true;
    }
  }
  
  // If we couldn't find a form related to the active element,
  // try finding any visible form with a submit button
  const forms = Array.from(document.querySelectorAll('form')) as HTMLFormElement[];
  for (const form of forms) {
    if (isElementVisible(form)) {
      const submitButton = form.querySelector('input[type="submit"], button[type="submit"]') as HTMLElement;
      if (submitButton) {
        submitButton.click();
        return true;
      }
      
      form.submit();
      return true;
    }
  }
  
  console.warn('No form found to submit');
  return false;
}

// Helper function to change font size
function changeFontSize(delta: number) {
  // Get the current font size
  const html = document.documentElement;
  const currentSize = parseFloat(window.getComputedStyle(html).fontSize);
  
  // Calculate new size
  const newSize = currentSize * (1 + delta);
  
  // Apply new size
  html.style.fontSize = `${newSize}px`;
}

// Helper function to check if an element is visible
function isElementVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  
  return style.display !== 'none' &&
         style.visibility !== 'hidden' &&
         style.opacity !== '0' &&
         element.offsetWidth > 0 &&
         element.offsetHeight > 0;
}

// Initialize command processor
registerCommands();

// Export other useful functions
export {
  clickElementWithText,
  clickButtonWithText,
  clickLinkWithText,
  fillInputField,
  submitCurrentForm
}; 