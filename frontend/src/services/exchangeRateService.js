import api from '../utils/api';

const EXCHANGE_RATE_SETTINGS_KEY = 'jpstore_exchange_rate_settings';

class ExchangeRateService {
  // Save exchange rate settings to backend API
  async saveSettings(settings) {
    try {
      const response = await api.post('/exchange-rate/settings', {
        type: settings.type,
        rate: settings.rate
      });
      
      if (response.data.success) {
        // Also save to localStorage as backup/cache
        localStorage.setItem(EXCHANGE_RATE_SETTINGS_KEY, JSON.stringify(response.data.settings));
        return { success: true, settings: response.data.settings };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('Error saving exchange rate settings to backend:', error);
      
      // Fallback to localStorage if backend fails
    try {
      const settingsToSave = {
          type: settings.type,
        rate: settings.rate,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(EXCHANGE_RATE_SETTINGS_KEY, JSON.stringify(settingsToSave));
        return { success: true, settings: settingsToSave };
      } catch (localError) {
        return { success: false, error: error.response?.data?.message || error.message };
      }
    }
  }

  // Load exchange rate settings from backend API with localStorage fallback
  async loadSettingsAsync() {
    try {
      // Try to load from backend first
      const response = await api.get('/exchange-rate/settings');
      if (response.data.success) {
        // Cache in localStorage
        localStorage.setItem(EXCHANGE_RATE_SETTINGS_KEY, JSON.stringify(response.data.settings));
        return {
          success: true,
          settings: response.data.settings
        };
      }
    } catch (error) {
      console.warn('Failed to load settings from backend, trying localStorage:', error.message);
    }
    
    // Fallback to localStorage
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

  // Synchronous method for backward compatibility (uses cached localStorage data)
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

  // Immediate sync method to load from backend and save to backend
  saveSettingsSync(settings) {
    try {
      const settingsToSave = {
        type: settings.type,
        rate: settings.rate,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(EXCHANGE_RATE_SETTINGS_KEY, JSON.stringify(settingsToSave));
      return { success: true, settings: settingsToSave };
    } catch (error) {
      console.error('Error saving exchange rate settings:', error);
      return { success: false, error: error.message };
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