// Define command types
export var CommandType;
(function (CommandType) {
    // Visual adjustments
    CommandType["ZOOM_IN"] = "ZOOM_IN";
    CommandType["ZOOM_OUT"] = "ZOOM_OUT";
    CommandType["INCREASE_CONTRAST"] = "INCREASE_CONTRAST";
    CommandType["DECREASE_CONTRAST"] = "DECREASE_CONTRAST";
    CommandType["TOGGLE_COLOR_BLIND_MODE"] = "TOGGLE_COLOR_BLIND_MODE";
    CommandType["TOGGLE_DARK_MODE"] = "TOGGLE_DARK_MODE";
    // Screen reader
    CommandType["START_SCREEN_READER"] = "START_SCREEN_READER";
    CommandType["STOP_SCREEN_READER"] = "STOP_SCREEN_READER";
    CommandType["READ_SELECTED_TEXT"] = "READ_SELECTED_TEXT";
    CommandType["READ_PAGE"] = "READ_PAGE";
    // Motor assistance
    CommandType["TOGGLE_EASY_CLICK"] = "TOGGLE_EASY_CLICK";
    CommandType["TOGGLE_KEYBOARD_NAVIGATION"] = "TOGGLE_KEYBOARD_NAVIGATION";
    CommandType["DISABLE_ANIMATIONS"] = "DISABLE_ANIMATIONS";
    // Cognitive assistance
    CommandType["SIMPLIFY_PAGE"] = "SIMPLIFY_PAGE";
    CommandType["HIGHLIGHT_LINKS"] = "HIGHLIGHT_LINKS";
    CommandType["HIGHLIGHT_HEADINGS"] = "HIGHLIGHT_HEADINGS";
    CommandType["SHOW_TABLE_OF_CONTENTS"] = "SHOW_TABLE_OF_CONTENTS";
    // Speech recognition
    CommandType["START_SPEECH_RECOGNITION"] = "START_SPEECH_RECOGNITION";
    CommandType["STOP_SPEECH_RECOGNITION"] = "STOP_SPEECH_RECOGNITION";
})(CommandType || (CommandType = {}));
// Command processor class
class CommandProcessor {
    constructor() {
        this.handlers = new Map();
        this.activeFeatures = new Set();
    }
    /**
     * Register a command handler
     * @param commandType The command type to handle
     * @param handler The handler for the command
     */
    registerHandler(commandType, handler) {
        this.handlers.set(commandType, handler);
        console.log(`Registered handler for command: ${commandType}`);
    }
    /**
     * Process a command
     * @param command The command to process
     * @returns Promise that resolves to true if the command was handled successfully
     */
    async processCommand(command) {
        console.log(`Processing command: ${command.type}`, command);
        const handler = this.handlers.get(command.type);
        if (!handler) {
            console.warn(`No handler registered for command: ${command.type}`);
            return false;
        }
        try {
            const result = await handler.execute(command);
            // Update active features
            const commandType = command.type;
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
                }
                else if (this.isStopCommand(commandType)) {
                    const featureType = this.getFeatureTypeFromStopCommand(commandType);
                    if (featureType) {
                        this.activeFeatures.delete(featureType);
                    }
                }
            }
            return result;
        }
        catch (error) {
            console.error(`Error executing command ${command.type}:`, error);
            return false;
        }
    }
    /**
     * Check if a feature is active
     * @param featureType The feature type to check
     * @returns True if the feature is active
     */
    isFeatureActive(featureType) {
        return this.activeFeatures.has(featureType);
    }
    /**
     * Get all active features
     * @returns Array of active feature types
     */
    getActiveFeatures() {
        return Array.from(this.activeFeatures);
    }
    /**
     * Reset all active features
     */
    resetActiveFeatures() {
        this.activeFeatures.clear();
    }
    /**
     * Get all available commands
     * @returns Array of command types
     */
    getAvailableCommands() {
        return Array.from(this.handlers.keys());
    }
    // Helper methods
    isToggleCommand(commandType) {
        return commandType.startsWith('TOGGLE_');
    }
    isStartCommand(commandType) {
        return commandType.startsWith('START_');
    }
    isStopCommand(commandType) {
        return commandType.startsWith('STOP_');
    }
    getFeatureTypeFromStartCommand(commandType) {
        if (commandType === CommandType.START_SCREEN_READER) {
            return CommandType.START_SCREEN_READER;
        }
        if (commandType === CommandType.START_SPEECH_RECOGNITION) {
            return CommandType.START_SPEECH_RECOGNITION;
        }
        return null;
    }
    getFeatureTypeFromStopCommand(commandType) {
        if (commandType === CommandType.STOP_SCREEN_READER) {
            return CommandType.START_SCREEN_READER;
        }
        if (commandType === CommandType.STOP_SPEECH_RECOGNITION) {
            return CommandType.START_SPEECH_RECOGNITION;
        }
        return null;
    }
    updateActiveFeature(commandType) {
        if (this.activeFeatures.has(commandType)) {
            this.activeFeatures.delete(commandType);
        }
        else {
            this.activeFeatures.add(commandType);
        }
    }
}
// Create and export a singleton instance
export const commandProcessor = new CommandProcessor();
export default commandProcessor;
