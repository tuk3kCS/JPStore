import React from 'react';
import { Link } from 'react-router-dom';

const CategoryCards = () => {
  const categories = [
    {
      title: 'Figures',
      description: 'Premium collectible figures',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      link: '/figures',
      action: 'Explore'
    },
    {
      title: 'Merchandise & Goods',
      description: 'Exclusive merchandise',
      image: 'https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=400&h=300&fit=crop',
      link: '/merchandise',
      action: 'Explore'
    },
    {
      title: 'Pre-Order',
      description: 'Coming soon releases',
      image: 'https://images.unsplash.com/photo-1566694271453-390536dd1f0d?w=400&h=300&fit=crop',
      link: '/pre-order',
      action: 'Explore'
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