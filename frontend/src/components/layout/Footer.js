import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container pl-4">
        <div className="grid md:grid-cols-4 gap-8 text-left">
          <div className="md:col-span-2 text-left">
            <div className="flex items-center mb-4 justify-start">
              <img 
                src="/images/logo.png" 
                alt="JPStore Logo" 
                className="h-12 w-auto mr-3"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <span 
                className="text-2xl font-bold"
                style={{display: 'none'}}
              >
                JPStore
              </span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md text-left">
              Điểm đến hàng đầu cho các mô hình sưu tập và vật phẩm độc quyền.
            </p>
          </div>
          
          <div className="text-left">
            <h4 className="font-semibold mb-4 text-left">Liên kết nhanh</h4>
            <ul className="space-y-2 text-left">
              <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">Về chúng tôi</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Liên hệ</Link></li>
              <li><Link to="/shipping" className="text-gray-400 hover:text-white transition-colors">Thông tin vận chuyển</Link></li>
              <li><Link to="/returns" className="text-gray-400 hover:text-white transition-colors">Đổi trả</Link></li>
            </ul>
          </div>
          
          <div className="text-left">
            <h4 className="font-semibold mb-4 text-left">Dịch vụ khách hàng</h4>
            <ul className="space-y-2 text-left">
              <li><Link to="/faq" className="text-gray-400 hover:text-white transition-colors">Câu hỏi thường gặp</Link></li>
              <li><Link to="/size-guide" className="text-gray-400 hover:text-white transition-colors">Hướng dẫn kích thước</Link></li>
              <li><Link to="/track-order" className="text-gray-400 hover:text-white transition-colors">Theo dõi đơn hàng</Link></li>
              <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Chính sách bảo mật</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <p className="text-gray-400 text-sm text-left">
              © 2024 JPStore. Mọi quyền được bảo lưu.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <i className="bi bi-facebook text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <i className="bi bi-twitter text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <i className="bi bi-instagram text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <i className="bi bi-youtube text-xl"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 