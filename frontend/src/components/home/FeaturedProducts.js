import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import ProductCard from '../product/ProductCard';

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

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container pl-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-12 text-left">Sản phẩm mới</h2>
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
          <h2 className="text-3xl font-bold text-gray-800 mb-12 text-left">Sản phẩm mới</h2>
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
        <h2 className="text-3xl font-bold text-gray-800 mb-12 text-left">Sản phẩm mới</h2>
        
        {products.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <i className="bi bi-box text-4xl"></i>
            </div>
            <p className="text-gray-600">Hiện tại không có sản phẩm nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts; 