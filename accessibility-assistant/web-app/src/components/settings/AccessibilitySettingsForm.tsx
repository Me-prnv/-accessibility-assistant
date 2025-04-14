import React, { useState, useEffect } from 'react';
import { AccessibilitySettings } from '../../database/schema';
import { getAccessibilitySettings, updateAccessibilitySettings } from '../../services/settingsService';

interface AccessibilitySettingsFormProps {
  userId: string;
  onSave?: (settings: AccessibilitySettings) => void;
}

const AccessibilitySettingsForm: React.FC<AccessibilitySettingsFormProps> = ({ 
  userId, 
  onSave 
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const data = await getAccessibilitySettings(userId);
        setSettings(data);
      } catch (err) {
        setError('Failed to load accessibility settings. Please try again.');
        console.error('Error fetching settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [userId]);

  // Handle form field changes
  const handleChange = (
    category: keyof AccessibilitySettings,
    setting: string,
    value: boolean | string | number
  ) => {
    if (!settings) return;

    setSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [setting]: value
        }
      };
    });
  };

  // Handle range input changes
  const handleRangeChange = (
    category: keyof AccessibilitySettings,
    setting: string,
    value: string
  ) => {
    handleChange(category, setting, parseFloat(value));
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const updatedSettings = await updateAccessibilitySettings(userId, settings);
      setSettings(updatedSettings);
      setSaveSuccess(true);
      
      if (onSave) {
        onSave(updatedSettings);
      }
    } catch (err) {
      setError('Failed to save settings. Please try again.');
      console.error('Error saving settings:', err);
    } finally {
      setIsSaving(false);
      
      // Auto-hide success message after 3 seconds
      if (saveSuccess) {
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    }
  };

  if (isLoading) return <div className="p-6">Loading settings...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!settings) return <div className="text-red-500 p-4">Settings not found</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Visual Settings */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Visual Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.visual.highContrast}
                onChange={(e) => handleChange('visual', 'highContrast', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-gray-700">High Contrast Mode</span>
            </label>
            <p className="text-sm text-gray-500 mt-1 ml-6">
              Enhances text visibility with stronger contrast between foreground and background.
            </p>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.visual.reducedMotion}
                onChange={(e) => handleChange('visual', 'reducedMotion', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-gray-700">Reduced Motion</span>
            </label>
            <p className="text-sm text-gray-500 mt-1 ml-6">
              Minimizes animations and transitions throughout the interface.
            </p>
          </div>

          <div>
            <label htmlFor="fontSize" className="block text-sm font-medium text-gray-700 mb-1">
              Font Size: {settings.visual.fontSize}px
            </label>
            <input
              type="range"
              id="fontSize"
              min="12"
              max="24"
              step="1"
              value={settings.visual.fontSize}
              onChange={(e) => handleRangeChange('visual', 'fontSize', e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Small</span>
              <span>Default</span>
              <span>Large</span>
            </div>
          </div>

          <div>
            <label htmlFor="colorTheme" className="block text-sm font-medium text-gray-700 mb-1">
              Color Theme
            </label>
            <select
              id="colorTheme"
              value={settings.visual.colorTheme}
              onChange={(e) => handleChange('visual', 'colorTheme', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="system">System Default</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="highContrastDark">High Contrast Dark</option>
              <option value="highContrastLight">High Contrast Light</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hearing Settings */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Hearing & Sound Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.hearing.captionsEnabled}
                onChange={(e) => handleChange('hearing', 'captionsEnabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-gray-700">Enable Captions</span>
            </label>
            <p className="text-sm text-gray-500 mt-1 ml-6">
              Show captions for all audio and video content when available.
            </p>
          </div>

          <div>
            <label htmlFor="captionSize" className="block text-sm font-medium text-gray-700 mb-1">
              Caption Size: {settings.hearing.captionSize}
            </label>
            <select
              id="captionSize"
              value={settings.hearing.captionSize}
              onChange={(e) => handleChange('hearing', 'captionSize', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={!settings.hearing.captionsEnabled}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="xlarge">Extra Large</option>
            </select>
          </div>

          <div>
            <label htmlFor="volume" className="block text-sm font-medium text-gray-700 mb-1">
              System Volume: {settings.hearing.volume}%
            </label>
            <input
              type="range"
              id="volume"
              min="0"
              max="100"
              step="5"
              value={settings.hearing.volume}
              onChange={(e) => handleRangeChange('hearing', 'volume', e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Motor Settings */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Motor & Input Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.motor.keyboardOnly}
                onChange={(e) => handleChange('motor', 'keyboardOnly', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-gray-700">Keyboard Navigation Mode</span>
            </label>
            <p className="text-sm text-gray-500 mt-1 ml-6">
              Optimize navigation for keyboard-only use without requiring mouse input.
            </p>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.motor.autoClickEnabled}
                onChange={(e) => handleChange('motor', 'autoClickEnabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-gray-700">Auto-Click on Hover</span>
            </label>
            <p className="text-sm text-gray-500 mt-1 ml-6">
              Automatically click elements after hovering for a specified time.
            </p>
          </div>

          {settings.motor.autoClickEnabled && (
            <div>
              <label htmlFor="autoClickDelay" className="block text-sm font-medium text-gray-700 mb-1">
                Auto-Click Delay: {settings.motor.autoClickDelay / 1000} seconds
              </label>
              <input
                type="range"
                id="autoClickDelay"
                min="1000"
                max="5000"
                step="500"
                value={settings.motor.autoClickDelay}
                onChange={(e) => handleRangeChange('motor', 'autoClickDelay', e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* Cognitive Settings */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Cognitive Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.cognitive.simplifiedMode}
                onChange={(e) => handleChange('cognitive', 'simplifiedMode', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-gray-700">Simplified Interface</span>
            </label>
            <p className="text-sm text-gray-500 mt-1 ml-6">
              Reduces interface complexity and removes non-essential elements.
            </p>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.cognitive.extraTimeForActions}
                onChange={(e) => handleChange('cognitive', 'extraTimeForActions', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-gray-700">Extended Timeouts</span>
            </label>
            <p className="text-sm text-gray-500 mt-1 ml-6">
              Extends the time allowed for completing actions and forms.
            </p>
          </div>

          <div>
            <label htmlFor="textComplexity" className="block text-sm font-medium text-gray-700 mb-1">
              Text Complexity
            </label>
            <select
              id="textComplexity"
              value={settings.cognitive.textComplexity}
              onChange={(e) => handleChange('cognitive', 'textComplexity', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="simple">Simple Language</option>
              <option value="moderate">Moderate</option>
              <option value="standard">Standard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Reset to Current
        </button>
        
        <div className="flex items-center space-x-4">
          {saveSuccess && (
            <span className="text-green-600">
              Settings saved successfully!
            </span>
          )}
          
          <button
            type="submit"
            disabled={isSaving}
            className={`px-6 py-2 border border-transparent rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
              ${isSaving 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default AccessibilitySettingsForm; 