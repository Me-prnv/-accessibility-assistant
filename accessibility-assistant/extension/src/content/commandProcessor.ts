// Command processor for accessibility commands in content scripts
import { AccessibilityCommand } from '../types';

// Define command types
export enum CommandType {
  // Visual adjustments
  ZOOM_IN = 'ZOOM_IN',
  ZOOM_OUT = 'ZOOM_OUT',
  INCREASE_CONTRAST = 'INCREASE_CONTRAST',
  DECREASE_CONTRAST = 'DECREASE_CONTRAST',
  TOGGLE_COLOR_BLIND_MODE = 'TOGGLE_COLOR_BLIND_MODE',
  TOGGLE_DARK_MODE = 'TOGGLE_DARK_MODE',
  
  // Screen reader
  START_SCREEN_READER = 'START_SCREEN_READER',
  STOP_SCREEN_READER = 'STOP_SCREEN_READER',
  READ_SELECTED_TEXT = 'READ_SELECTED_TEXT',
  READ_PAGE = 'READ_PAGE',
  
  // Motor assistance
  TOGGLE_EASY_CLICK = 'TOGGLE_EASY_CLICK',
  TOGGLE_KEYBOARD_NAVIGATION = 'TOGGLE_KEYBOARD_NAVIGATION',
  DISABLE_ANIMATIONS = 'DISABLE_ANIMATIONS',
  
  // Cognitive assistance
  SIMPLIFY_PAGE = 'SIMPLIFY_PAGE',
  HIGHLIGHT_LINKS = 'HIGHLIGHT_LINKS',
  HIGHLIGHT_HEADINGS = 'HIGHLIGHT_HEADINGS',
  SHOW_TABLE_OF_CONTENTS = 'SHOW_TABLE_OF_CONTENTS',
  
  // Speech recognition
  START_SPEECH_RECOGNITION = 'START_SPEECH_RECOGNITION',
  STOP_SPEECH_RECOGNITION = 'STOP_SPEECH_RECOGNITION'
}

// Define interfaces
export interface CommandHandler {
  execute: (command: AccessibilityCommand) => Promise<boolean>;
}

// Command processor class
class CommandProcessor {
  private handlers: Map<CommandType, CommandHandler>;
  private activeFeatures: Set<CommandType>;
  
  constructor() {
    this.handlers = new Map();
    this.activeFeatures = new Set();
  }
  
  /**
   * Register a command handler
   * @param commandType The command type to handle
   * @param handler The handler for the command
   */
  registerHandler(commandType: CommandType, handler: CommandHandler): void {
    this.handlers.set(commandType, handler);
    console.log(`Registered handler for command: ${commandType}`);
  }
  
  /**
   * Process a command
   * @param command The command to process
   * @returns Promise that resolves to true if the command was handled successfully
   */
  async processCommand(command: AccessibilityCommand): Promise<boolean> {
    console.log(`Processing command: ${command.type}`, command);
    
    const handler = this.handlers.get(command.type as CommandType);
    
    if (!handler) {
      console.warn(`No handler registered for command: ${command.type}`);
      return false;
    }
    
    try {
      const result = await handler.execute(command);
      
      // Update active features
      const commandType = command.type as CommandType;
      if (result) {
        // For toggle commands, update the active features list
        if (this.isToggleCommand(commandType)) {
          this.updateActiveFeature(commandType);
        }
        
        // For start/stop commands, update accordingly
        if (this.isStartCommand(commandType)) {
          const featureType = this.getFeatureTypeFromStartCommand(commandType);
          if (featureType) {
            this.activeFeatures.add(featureType);
          }
        } else if (this.isStopCommand(commandType)) {
          const featureType = this.getFeatureTypeFromStopCommand(commandType);
          if (featureType) {
            this.activeFeatures.delete(featureType);
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Error executing command ${command.type}:`, error);
      return false;
    }
  }
  
  /**
   * Check if a feature is active
   * @param featureType The feature type to check
   * @returns True if the feature is active
   */
  isFeatureActive(featureType: CommandType): boolean {
    return this.activeFeatures.has(featureType);
  }
  
  /**
   * Get all active features
   * @returns Array of active feature types
   */
  getActiveFeatures(): CommandType[] {
    return Array.from(this.activeFeatures);
  }
  
  /**
   * Reset all active features
   */
  resetActiveFeatures(): void {
    this.activeFeatures.clear();
  }
  
  /**
   * Get all available commands
   * @returns Array of command types
   */
  getAvailableCommands(): CommandType[] {
    return Array.from(this.handlers.keys());
  }
  
  // Helper methods
  private isToggleCommand(commandType: CommandType): boolean {
    return commandType.startsWith('TOGGLE_');
  }
  
  private isStartCommand(commandType: CommandType): boolean {
    return commandType.startsWith('START_');
  }
  
  private isStopCommand(commandType: CommandType): boolean {
    return commandType.startsWith('STOP_');
  }
  
  private getFeatureTypeFromStartCommand(commandType: CommandType): CommandType | null {
    if (commandType === CommandType.START_SCREEN_READER) {
      return CommandType.START_SCREEN_READER;
    }
    if (commandType === CommandType.START_SPEECH_RECOGNITION) {
      return CommandType.START_SPEECH_RECOGNITION;
    }
    return null;
  }
  
  private getFeatureTypeFromStopCommand(commandType: CommandType): CommandType | null {
    if (commandType === CommandType.STOP_SCREEN_READER) {
      return CommandType.START_SCREEN_READER;
    }
    if (commandType === CommandType.STOP_SPEECH_RECOGNITION) {
      return CommandType.START_SPEECH_RECOGNITION;
    }
    return null;
  }
  
  private updateActiveFeature(commandType: CommandType): void {
    if (this.activeFeatures.has(commandType)) {
      this.activeFeatures.delete(commandType);
    } else {
      this.activeFeatures.add(commandType);
    }
  }
}

// Create and export a singleton instance
export const commandProcessor = new CommandProcessor();
export default commandProcessor;