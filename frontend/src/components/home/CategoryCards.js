import React from 'react';
import { Link } from 'react-router-dom';

const CategoryCards = () => {
  const categories = [
    {
      title: 'Mô hình',
      description: 'Mô hình cao cấp',
      image: '/images/figure.jpg',
      link: '/figures',
      action: 'Khám phá'
    },
    {
      title: 'Vật phẩm & Phụ kiện',
      description: 'Vật phẩm độc quyền',
      image: '/images/goods.jpeg',
      link: '/merchandise',
      action: 'Khám phá'
    },
    {
      title: 'Hàng đặt trước',
      description: 'Sản phẩm sắp ra mắt',
      image: '/images/pre-order.webp',
      link: '/pre-order',
      action: 'Khám phá'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container pl-4">
        <div className="grid md:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <div 
              key={index}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                <img 
                  src={category.image} 
                  alt={category.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              </div>
              <div className="p-6 text-left">
                <h3 className="text-xl font-semibold mb-2 text-gray-800 text-left">
                  {category.title}
                </h3>
                <p className="text-gray-600 mb-4 text-left">
                  {category.description}
                </p>
                <Link 
                  to={category.link}
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  {category.action}
                  <i className="bi bi-arrow-right ml-2"></i>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryCards; 