import React from 'react';
import { Link } from 'react-router-dom';

const OrderSummary = ({ subtotal, shipping, total, loading }) => {
  // Format price in VND
  const formatPrice = (price) => {
    return `${Math.round(price || 0).toLocaleString('vi-VN')}đ`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 text-left">Order Summary</h2>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium">
            {loading ? (
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              formatPrice(subtotal)
            )}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping:</span>
          <span className="font-medium">
            {loading ? (
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
            ) : shipping === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              formatPrice(shipping)
            )}
          </span>
        </div>
        
        <div className="border-t pt-3">
          <div className="flex justify-between">
            <span className="text-lg font-semibold text-gray-900">Total:</span>
            <span className="text-lg font-bold text-blue-600">
              {loading ? (
                <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                formatPrice(total)
              )}
            </span>
          </div>
        </div>
      </div>
      
      {/* Shipping Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
        <div className="flex items-center text-green-800">
          <i className="bi bi-truck mr-2"></i>
          <span className="text-sm">
            {shipping === 0 ? 'Free shipping on this order!' : 'Standard shipping included'}
          </span>
        </div>
      </div>
      
      {/* Checkout Button */}
      <Link
        to="/checkout"
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors text-center block ${
          loading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
        onClick={(e) => {
          if (loading) {
            e.preventDefault();
          }
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
            Loading...
          </div>
        ) : (
          'Proceed to Checkout'
        )}
      </Link>
      
      {/* Continue Shopping Link */}
      <Link
        to="/products"
        className="block text-center text-blue-600 hover:text-blue-700 font-medium mt-4 text-sm"
      >
        ← Continue Shopping
      </Link>
      
      {/* Security Info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center text-gray-500 text-xs">
          <i className="bi bi-shield-check mr-2 text-green-600"></i>
          <span>Secure checkout with SSL encryption</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary; 