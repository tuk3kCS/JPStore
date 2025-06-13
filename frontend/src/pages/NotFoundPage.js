import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="text-8xl font-bold text-blue-600 mb-4">404</div>
            <div className="text-6xl mb-4">🏪</div>
          </div>
          
          {/* Error Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Trang không tìm thấy
          </h1>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển. 
            Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.
          </p>
          
          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              to="/"
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <i className="bi bi-house-door mr-2"></i>
              Về trang chủ
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <i className="bi bi-arrow-left mr-2"></i>
              Quay lại trang trước
            </button>
          </div>
          
          {/* Additional Links */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">Hoặc bạn có thể:</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Link
                to="/products"
                className="text-blue-600 hover:text-blue-700 flex items-center justify-center py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <i className="bi bi-grid mr-2"></i>
                Xem sản phẩm
              </Link>
              <Link
                to="/cart"
                className="text-blue-600 hover:text-blue-700 flex items-center justify-center py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <i className="bi bi-cart mr-2"></i>
                Giỏ hàng
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFoundPage; 