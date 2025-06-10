const EXCHANGE_RATE_SETTINGS_KEY = 'jpstore_exchange_rate_settings';

class ExchangeRateService {
  // Save exchange rate settings to localStorage
  saveSettings(settings) {
    try {
      const settingsToSave = {
        type: settings.type, // 'automatic' or 'manual'
        rate: settings.rate,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(EXCHANGE_RATE_SETTINGS_KEY, JSON.stringify(settingsToSave));
      return { success: true };
    } catch (error) {
      console.error('Error saving exchange rate settings:', error);
      return { success: false, error: error.message };
    }
  }

  // Load exchange rate settings from localStorage
  loadSettings() {
    try {
      const saved = localStorage.getItem(EXCHANGE_RATE_SETTINGS_KEY);
      if (saved) {
        const settings = JSON.parse(saved);
        return {
          success: true,
          settings: {
            type: settings.type || 'automatic',
            rate: settings.rate || '',
            lastSaved: settings.lastSaved || null
          }
        };
      }
      // Return default settings if nothing is saved
      return {
        success: true,
        settings: {
          type: 'automatic',
          rate: '',
          lastSaved: null
        }
      };
    } catch (error) {
      console.error('Error loading exchange rate settings:', error);
      return {
        success: false,
        error: error.message,
        settings: {
          type: 'automatic',
          rate: '',
          lastSaved: null
        }
      };
    }
  }

  // Clear saved settings
  clearSettings() {
    try {
      localStorage.removeItem(EXCHANGE_RATE_SETTINGS_KEY);
      return { success: true };
    } catch (error) {
      console.error('Error clearing exchange rate settings:', error);
      return { success: false, error: error.message };
    }
  }
}

export const exchangeRateService = new ExchangeRateService(); 