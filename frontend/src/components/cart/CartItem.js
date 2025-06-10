import React from 'react';
import { Link } from 'react-router-dom';

const CartItem = ({ item, onUpdateQuantity, onRemove, loading }) => {
  const handleQuantityChange = (change) => {
    const newQuantity = item.quantity + change;
    if (newQuantity >= 1) {
      onUpdateQuantity(item.product._id, newQuantity);
    }
  };

  const handleInputChange = (e) => {
    const newQuantity = parseInt(e.target.value) || 1;
    if (newQuantity >= 1) {
      onUpdateQuantity(item.product._id, newQuantity);
    }
  };

  // Calculate price based on product type
  const getPrice = () => {
    if (item.product.isPreOrder) {
      return item.product.vndPrice || 0;
    } else {
      return item.product.vndPrice || item.product.price || 0;
    }
  };

  const itemPrice = getPrice();
  const itemTotal = itemPrice * item.quantity;

  // Format price in VND
  const formatPrice = (price) => {
    return `${Math.round(price).toLocaleString('vi-VN')}đ`;
  };

  // Get product image
  const getProductImage = () => {
    if (item.product.images && item.product.images.length > 0) {
      return `http://localhost:5000${item.product.images[0]}`;
    }
    return 'https://via.placeholder.com/64x64?text=Product';
  };

  return (
    <div className="grid grid-cols-12 gap-4 p-4 items-center">
      {/* Product Info */}
      <div className="col-span-5 flex items-center space-x-4">
        <Link to={`/product/${item.product._id}`} className="flex-shrink-0">
          <img
            src={getProductImage()}
            alt={item.product.name}
            className="w-16 h-16 object-cover rounded-lg"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/64x64?text=Product';
            }}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link 
            to={`/product/${item.product._id}`}
            className="font-medium text-gray-900 hover:text-blue-600 transition-colors block truncate text-left"
          >
            {item.product.name}
          </Link>
          <div className="text-sm text-gray-500 text-left">
            {item.product.brand?.name || 'Unknown Brand'}
          </div>
          {item.product.isPreOrder && (
            <div className="text-xs text-blue-600 text-left mt-1">
              <i className="bi bi-clock mr-1"></i>
              Pre-order
            </div>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="col-span-2 text-center">
        <span className="text-blue-600 font-semibold">
          {formatPrice(itemPrice)}
        </span>
        {item.product.isPreOrder && item.product.jpyPrice && (
          <div className="text-xs text-gray-500">
            ¥{parseInt(item.product.jpyPrice).toLocaleString('ja-JP')}
          </div>
        )}
      </div>

      {/* Quantity */}
      <div className="col-span-2 flex items-center justify-center space-x-2">
        <button
          onClick={() => handleQuantityChange(-1)}
          disabled={item.quantity <= 1 || loading}
          className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="bi bi-dash text-sm"></i>
        </button>
        
        <input
          type="number"
          value={item.quantity}
          onChange={handleInputChange}
          disabled={loading}
          min="1"
          className="w-12 h-8 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 no-spinner disabled:opacity-50"
        />
        
        <button
          onClick={() => handleQuantityChange(1)}
          disabled={loading}
          className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="bi bi-plus text-sm"></i>
        </button>
      </div>

      {/* Total */}
      <div className="col-span-2 text-center">
        <span className="text-blue-600 font-semibold">
          {formatPrice(itemTotal)}
        </span>
      </div>

      {/* Remove */}
      <div className="col-span-1 text-center">
        <button
          onClick={() => onRemove(item.product._id)}
          disabled={loading}
          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Remove item"
        >
          {loading ? (
            <i className="bi bi-arrow-clockwise animate-spin text-lg"></i>
          ) : (
            <i className="bi bi-trash text-lg"></i>
          )}
        </button>
      </div>
    </div>
  );
};

export default CartItem; 