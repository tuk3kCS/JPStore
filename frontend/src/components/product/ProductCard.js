import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { exchangeRateService } from '../../services/exchangeRateService';

const ProductCard = ({ product }) => {
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

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Add to cart functionality
    console.log(`Added ${product.name} to cart`);
  };

  // Helper function to format price
  const formatPrice = (product) => {
    if (product.isPreOrder && product.jpyPrice) {
      const jpyPrice = `¥${parseInt(product.jpyPrice).toLocaleString('ja-JP')}`;
      
      // Calculate VND price if exchange rate is available
      if (savedExchangeRate && savedExchangeRate > 0) {
        const vndPrice = Math.round(product.jpyPrice * savedExchangeRate);
        const vndFormatted = `${vndPrice.toLocaleString('vi-VN')}đ`;
        return (
          <div className="text-left">
            <div className="text-lg font-semibold text-blue-600">{vndFormatted}</div>
            <div className="text-xs text-gray-500">{jpyPrice}</div>
          </div>
        );
      }
      
      return jpyPrice;
    } else if (product.vndPrice) {
      return `${parseInt(product.vndPrice).toLocaleString('vi-VN')}đ`;
    }
    // Fallback for products with old price field
    if (product.price) {
      return `${parseInt(product.price).toLocaleString('vi-VN')}đ`;
    }
    return 'Price not available';
  };

  return (
    <Link to={`/product/${product._id}`} className="block">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
      {/* Product Image */}
      <div className="h-48 bg-gray-100 relative overflow-hidden">
        <img 
          src={product.images?.[0] ? `http://localhost:5000${product.images[0]}` : 'https://via.placeholder.com/300x300?text=Product'}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x300?text=Product';
          }}
        />
        
        {/* Product Badges */}
        <div className="absolute top-2 left-2 space-y-1">
          {product.isPreOrder && (
            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              Pre-Order
            </span>
          )}
          {product.stock === 0 && !product.isPreOrder && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              Out of Stock
            </span>
          )}
          {product.stock > 0 && product.stock <= 5 && !product.isPreOrder && (
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
              Low Stock
            </span>
          )}
        </div>
      </div>
      
      {/* Product Info */}
      <div className="p-4 text-left">
        <h3 className="font-medium text-gray-800 mb-2 text-sm text-left truncate">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {React.isValidElement(formatPrice(product)) ? (
              formatPrice(product)
            ) : (
              <span className="text-lg font-semibold text-blue-600 text-left">
                {formatPrice(product)}
              </span>
            )}
          </div>
          
          {product.isPreOrder ? (
            <button 
              onClick={handleAddToCart}
              className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-green-700 transition-colors ml-2"
            >
              Pre-Order
            </button>
          ) : product.stock > 0 ? (
            <button 
              onClick={handleAddToCart}
              className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 transition-colors ml-2"
            >
              Add to Cart
            </button>
          ) : (
            <button 
              disabled
              className="bg-gray-400 text-white px-3 py-1.5 rounded text-sm font-medium cursor-not-allowed ml-2"
            >
              Out of Stock
            </button>
          )}
        </div>
      </div>
      </div>
    </Link>
  );
};

export default ProductCard; 