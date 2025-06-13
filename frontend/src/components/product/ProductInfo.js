import React, { useState, useEffect } from 'react';
import { exchangeRateService } from '../../services/exchangeRateService';
import { useCart } from '../../context/CartContext';
import Toast from '../common/Toast';

const ProductInfo = ({ product }) => {
  const [exchangeRate, setExchangeRate] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const { addToCart } = useCart();

  useEffect(() => {
  // Load exchange rate settings for pre-order products
  if (product?.isPreOrder) {
    const result = exchangeRateService.loadSettings();
    if (result.success && result.settings && result.settings.rate) {
      setExchangeRate(parseFloat(result.settings.rate));
    }
  } 
  }, [product]);

  // Helper function to format price
  const formatPrice = () => {
    if (product?.isPreOrder && product?.jpyPrice) {
      const jpyPrice = `¥${parseInt(product.jpyPrice).toLocaleString('ja-JP')}`;
      
      // Calculate VND price if exchange rate is available
      if (exchangeRate && exchangeRate > 0) {
        const vndPrice = Math.round(product.jpyPrice * exchangeRate);
        const vndFormatted = `${vndPrice.toLocaleString('vi-VN')}đ`;
        return {
          vnd: vndFormatted,
          jpy: jpyPrice
        };
      }
      
      return { jpy: jpyPrice };
    } else if (product?.vndPrice) {
      return { vnd: `${parseInt(product.vndPrice).toLocaleString('vi-VN')}đ` };
    }
    
    // Fallback for products with old price field
    if (product?.price) {
      return { vnd: `${parseInt(product.price).toLocaleString('vi-VN')}đ` };
    }
    
    return { text: 'Price not available' };
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1) {
      if (product.isPreOrder || newQuantity <= product.stock) {
        setQuantity(newQuantity);
      }
    }
  };

  const handleAddToCart = async () => {
    try {
      setAddingToCart(true);
      const result = await addToCart(product, quantity);
      
      if (result.success) {
        // Reset quantity to 1 after successful add (no success message)
        setQuantity(1);
      } else {
        // Show error message
        setToastMessage(result.error || 'Failed to add item to cart');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setToastMessage('Failed to add item to cart');
      setToastType('error');
      setShowToast(true);
    } finally {
      setAddingToCart(false);
    }
  };

  const priceInfo = formatPrice();

  if (!product) {
    return null;
  }

  return (
    <>
      {/* Toast Notification */}
      <Toast 
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
      
      <div className="product-info text-left">
      {/* 1. Product Name */}
      <h1 className="text-3xl font-bold text-gray-800 mb-4 text-left">{product.name}</h1>
      
      {/* 2. Brand - Category */}
      <div className="mb-4 text-left">
        <div className="flex items-center text-gray-600 text-sm">
          {product.brand && (
            <span className="mr-4">
              <span className="font-medium">Brand:</span> {product.brand.name || product.brand}
            </span>
          )}
          {product.category && (
            <span>
              <span className="font-medium">Category:</span> {product.category.name || product.category}
            </span>
          )}
        </div>
      </div>

      {/* 3. Product Status */}
      <div className="mb-4 text-left">
        {product.isPreOrder ? (
          <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            Đang mở đặt trước
          </span>
        ) : product.stock > 0 ? (
          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            Có sẵn ({product.stock} sản phẩm)
          </span>
        ) : (
          <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
            Hết hàng
          </span>
        )}
      </div>

      {/* 4. Price Display */}
      <div className="mb-6 text-left">
        {priceInfo.vnd && priceInfo.jpy ? (
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-1">{priceInfo.vnd}</div>
            <div className="text-lg text-gray-500">{priceInfo.jpy}</div>
          </div>
        ) : priceInfo.vnd ? (
          <div className="text-3xl font-bold text-blue-600">{priceInfo.vnd}</div>
        ) : priceInfo.jpy ? (
          <div className="text-3xl font-bold text-blue-600">{priceInfo.jpy}</div>
        ) : (
          <div className="text-lg text-gray-500">{priceInfo.text}</div>
        )}
      </div>

      {/* 5. Product Description */}
      {product.description && (
        <div className="mb-6 text-left">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Mô tả</h3>
          <p className="text-gray-600 leading-relaxed">{product.description}</p>
        </div>
      )}

      {/* 6. Quantity and Add to Cart */}
      <div className="text-left">
        {/* Quantity Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng</label>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className="w-10 h-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-lg font-medium">−</span>
            </button>
            <input
              type="number"
              min="1"
              max={product.isPreOrder ? 999 : product.stock}
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              className="w-20 h-10 text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={!product.isPreOrder && quantity >= product.stock}
              className="w-10 h-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-lg font-medium">+</span>
            </button>
                     </div>
         </div>

        {/* Add to Cart / Pre-Order Button */}
        <div className="mb-4">
          {product.isPreOrder ? (
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {addingToCart ? (
                <>
                  <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                  Thêm vào giỏ...
                </>
              ) : (
                'Đặt trước ngay'
              )}
            </button>
          ) : product.stock > 0 ? (
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {addingToCart ? (
                <>
                  <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                  Thêm vào giỏ...
                </>
              ) : (
                'Thêm vào giỏ'
              )}
            </button>
          ) : (
            <button
              disabled
              className="w-full bg-gray-400 text-white py-3 px-6 rounded-lg font-medium cursor-not-allowed"
            >
              Hết hàng
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default ProductInfo; 