import React from 'react';
import { Link } from 'react-router-dom';

const OrderSummary = ({ total, loading }) => {
  // Format price in VND
  const formatPrice = (price) => {
    return `${Math.round(price || 0).toLocaleString('vi-VN')}đ`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6 text-left">Tóm tắt đơn hàng</h2>
      
      <div className="mb-6">
        <div className="flex justify-between">
          <span className="text-xl font-semibold text-gray-900">Tổng cộng:</span>
          <span className="text-xl font-bold text-blue-600">
            {loading ? (
              <div className="w-24 h-7 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              formatPrice(total)
            )}
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
            Đang tải...
          </div>
        ) : (
          'Tiếp tục thanh toán'
        )}
      </Link>
    </div>
  );
};

export default OrderSummary; 