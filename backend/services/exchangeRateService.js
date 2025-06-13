const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class ExchangeRateService {
  async fetchExchangeRate() {
    try {
      // Use the same APIs as the frontend for consistency
      const primaryUrl = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/jpy.json';
      const fallbackUrl = 'https://latest.currency-api.pages.dev/v1/currencies/jpy.json';
      
      let response;
      try {
        response = await fetch(primaryUrl);
        if (!response.ok) throw new Error('Primary API failed');
      } catch (error) {
        console.log('Primary exchange rate API failed, trying fallback...');
        response = await fetch(fallbackUrl);
        if (!response.ok) throw new Error('Fallback API also failed');
      }
      
      const data = await response.json();
      const jpyToVndRate = data.jpy?.vnd;
      
      if (jpyToVndRate && jpyToVndRate > 0) {
        console.log(`Fetched exchange rate: 1 JPY = ${jpyToVndRate} VND`);
        return jpyToVndRate;
      } else {
        throw new Error('VND rate not found in response');
      }
    } catch (error) {
      console.error('Error fetching exchange rate from API:', error);
      throw error;
    }
  }
}

module.exports = new ExchangeRateService(); 