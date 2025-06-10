  // Load exchange rate settings for pre-order products
  if (product?.isPreOrder) {
    const result = exchangeRateService.loadSettings();
    if (result.success && result.settings && result.settings.rate) {
      setExchangeRate(parseFloat(result.settings.rate));
    }
  } 