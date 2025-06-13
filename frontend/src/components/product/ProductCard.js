import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { exchangeRateService } from '../../services/exchangeRateService';
import { useCart } from '../../context/CartContext';
import Toast from '../common/Toast';

const ProductCard = ({ product }) => {
  const [savedExchangeRate, setSavedExchangeRate] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const { addToCart } = useCart();

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

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setAddingToCart(true);
      const result = await addToCart(product, 1);
      
      if (result.success) {
        // Item added successfully (no success message)
      } else {
        // Show error message
        setToastMessage(result.error || 'Không thể thêm sản phẩm vào giỏ hàng');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setToastMessage('Không thể thêm sản phẩm vào giỏ hàng');
      setToastType('error');
      setShowToast(true);
    } finally {
      setAddingToCart(false);
    }
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
    return 'Giá không có sẵn';
  };

  return (
    <>
      {/* Toast Notification */}
      <Toast 
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
      
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
              Đặt trước
            </span>
          )}
          {product.stock === 0 && !product.isPreOrder && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              Hết hàng
            </span>
          )}
          {product.stock > 0 && product.stock <= 5 && !product.isPreOrder && (
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
              Sắp hết hàng
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
              disabled={addingToCart}
              className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-green-700 transition-colors ml-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {addingToCart ? (
                <i className="bi bi-arrow-clockwise animate-spin"></i>
              ) : (
                'Đặt trước'
              )}
            </button>
          ) : product.stock > 0 ? (
            <button 
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 transition-colors ml-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {addingToCart ? (
                <i className="bi bi-arrow-clockwise animate-spin"></i>
              ) : (
                'Thêm vào giỏ'
              )}
            </button>
          ) : (
            <button 
              disabled
              className="bg-gray-400 text-white px-3 py-1.5 rounded text-sm font-medium cursor-not-allowed ml-2"
            >
              Hết hàng
            </button>
          )}
        </div>
      </div>
      </div>
    </Link>
    </>
  );
};

export default ProductCard; 