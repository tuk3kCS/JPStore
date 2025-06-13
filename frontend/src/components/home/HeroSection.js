import React from 'react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();

  const handleBuyNowClick = () => {
    navigate('/product');
  };

  return (
    <section className="relative bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-white py-24">
      <div className="absolute inset-0 bg-black opacity-10"></div>
      <div className="relative container pl-4">
        <div className="max-w-2xl text-left">
          <h1 className="text-5xl font-bold mb-4 text-left">
            Bộ sưu tập mô hình mới
          </h1>
          <p className="text-xl mb-8 text-blue-100 text-left">
            Khám phá những sản phẩm độc quyền mới nhất của chúng tôi
          </p>
          <button 
            onClick={handleBuyNowClick}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
          >
            Mua ngay
          </button>
        </div>
      </div>
      {/* Decorative elements */}
      <div className="absolute right-0 top-0 w-1/3 h-full opacity-20">
        <div className="absolute right-20 top-1/4 w-32 h-32 bg-white rounded-full opacity-30"></div>
        <div className="absolute right-10 top-1/2 w-20 h-20 bg-white rounded-full opacity-20"></div>
      </div>
    </section>
  );
};

export default HeroSection; 