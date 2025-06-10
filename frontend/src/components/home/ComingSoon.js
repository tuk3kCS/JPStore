import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { exchangeRateService } from '../../services/exchangeRateService';
import { Link } from 'react-router-dom';

const ComingSoon = () => {
  const [preorderProducts, setPreorderProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedExchangeRate, setSavedExchangeRate] = useState(null);

  // Load saved exchange rate when component mounts
  useEffect(() => {
    const loadExchangeRate = () => {
      try {
        const result = exchangeRateService.loadSettings();
        if (result.success && result.settings && result.settings.rate) {
          setSavedExchangeRate(parseFloat(result.settings.rate));
        }
      } catch (error) {
        console.error('Error loading exchange rate:', error);
      }
    };

    loadExchangeRate();
  }, []);

  useEffect(() => {
    const fetchPreorderProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch products and filter for pre-order products
        const response = await productService.getProducts({
          limit: 50, // Get more products to filter from
          sort: '-createdAt', // Sort by creation date, newest first
          page: 1
        });
        
        // Filter for pre-order products only and take the 3 most recent
        const preorderProducts = response.products?.filter(product => product.isPreOrder) || [];
        setPreorderProducts(preorderProducts.slice(0, 3));
      } catch (error) {
        console.error('Error fetching preorder products:', error);
        setError('Failed to load pre-order products');
      } finally {
        setLoading(false);
      }
    };

    fetchPreorderProducts();
  }, []);

  // Helper function to format release date
  const formatReleaseDate = (releaseDate) => {
    if (!releaseDate) return 'Release date TBA';
    
    const release = new Date(releaseDate);
    const now = new Date();
    
    // If release date has passed
    if (release <= now) {
      return 'Released';
    }
    
    // Calculate time difference
    const timeDiff = release.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff === 1) {
      return 'Tomorrow';
    } else if (daysDiff <= 30) {
      return `${daysDiff} days`;
    } else {
      return release.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
    }
  };

  // Helper function to format price for display
  const formatPrice = (product) => {
    if (product.jpyPrice) {
      const jpyPrice = `¥${parseInt(product.jpyPrice).toLocaleString('ja-JP')}`;
      
      // Calculate VND price if exchange rate is available
      if (savedExchangeRate && savedExchangeRate > 0) {
        const vndPrice = Math.round(product.jpyPrice * savedExchangeRate);
        const vndFormatted = `${vndPrice.toLocaleString('vi-VN')}đ`;
        return (
          <div className="text-left">
            <div className="text-lg font-bold text-blue-600">{vndFormatted}</div>
            <div className="text-sm text-gray-500">{jpyPrice}</div>
          </div>
        );
      }
      
      return jpyPrice;
    }
    return 'Price TBA';
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container pl-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-12 text-left">Coming Soon</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container pl-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-12 text-left">Coming Soon</h2>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <i className="bi bi-exclamation-triangle text-4xl"></i>
            </div>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container pl-4">
        <h2 className="text-3xl font-bold text-gray-800 mb-12 text-left">Coming Soon</h2>
        
        {preorderProducts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <i className="bi bi-clock text-4xl"></i>
            </div>
            <p className="text-gray-600">No pre-order products available at the moment.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {preorderProducts.map((product) => (
              <Link 
                key={product._id}
                to={`/product/${product._id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 block"
              >
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  <img 
                    src={product.images?.[0] ? `http://localhost:5000${product.images[0]}` : 'https://via.placeholder.com/400x300?text=Product'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x300?text=Product';
                    }}
                  />
                  <div className="absolute top-4 left-4">
                    <div className="flex items-center bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                      <i className="bi bi-clock mr-2"></i>
                      Release in {formatReleaseDate(product.releaseDate)}
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Pre-Order
                    </div>
                  </div>
                </div>
                <div className="p-6 text-left">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800 text-left">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 mb-2 text-left">
                    {product.description || 'Be the first to own this exclusive release'}
                  </p>
                  <div className="mb-4">
                    {React.isValidElement(formatPrice(product)) ? (
                      formatPrice(product)
                    ) : (
                      <p className="text-lg font-bold text-blue-600 text-left">
                        {formatPrice(product)}
                      </p>
                    )}
                  </div>
                  <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Pre-Order Now
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ComingSoon; 