import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { Link } from 'react-router-dom';

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecentProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch more products to ensure we have enough in-stock items after filtering
        const response = await productService.getProducts({
          limit: 50, // Fetch more products to filter from
          sort: '-createdAt', // Sort by creation date, newest first
          page: 1
        });
        
        // Filter out pre-order products and only show in-stock products
        const inStockProducts = response.products?.filter(product => 
          !product.isPreOrder && product.stock > 0
        ) || [];
        setProducts(inStockProducts.slice(0, 8));
      } catch (error) {
        console.error('Error fetching recent products:', error);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentProducts();
  }, []);

  // Helper function to format price
  const formatPrice = (product) => {
    if (product.vndPrice) {
      return `${parseInt(product.vndPrice).toLocaleString('vi-VN')}đ`;
    }
    // Fallback for products with old price field
    if (product.price) {
      return `${parseInt(product.price).toLocaleString('vi-VN')}đ`;
    }
    return 'Price not available';
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container pl-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-12 text-left">New Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden border animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-white">
        <div className="container pl-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-12 text-left">New Products</h2>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <i className="bi bi-exclamation-triangle text-4xl"></i>
            </div>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container pl-4">
        <h2 className="text-3xl font-bold text-gray-800 mb-12 text-left">New Products</h2>
        
        {products.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <i className="bi bi-box text-4xl"></i>
            </div>
            <p className="text-gray-600">No products available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link 
                key={product._id}
                to={`/product/${product._id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border block"
              >
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  <img 
                    src={product.images?.[0] ? `http://localhost:5000${product.images[0]}` : 'https://via.placeholder.com/300x300?text=Product'}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x300?text=Product';
                    }}
                  />
                  {product.stock <= 5 && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                        Low Stock
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 text-left">
                  <h3 className="font-semibold text-gray-800 mb-2 truncate text-left">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600 text-left">
                      {formatPrice(product)}
                    </span>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts; 