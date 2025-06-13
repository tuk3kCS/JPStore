import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import ProductCard from '../product/ProductCard';

const ComingSoon = () => {
  const [preorderProducts, setPreorderProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPreorderProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch products and filter for pre-order products
        const response = await productService.getProducts({
          limit: 50, // Get more products to filter from
          sort: '-createdAt', // Sort by creation date, newest first
          page: 1
        });
        
        // Filter for pre-order products only and take the 3 most recent
        const preorderProducts = response.products?.filter(product => product.isPreOrder) || [];
        setPreorderProducts(preorderProducts.slice(0, 3));
      } catch (error) {
        console.error('Error fetching preorder products:', error);
        setError('Không thể tải sản phẩm đặt trước');
      } finally {
        setLoading(false);
      }
    };

    fetchPreorderProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container pl-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-12 text-left">Sắp ra mắt</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
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
      <section className="py-16 bg-gray-50">
        <div className="container pl-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-12 text-left">Sắp ra mắt</h2>
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
    <section className="py-16 bg-gray-50">
      <div className="container pl-4">
        <h2 className="text-3xl font-bold text-gray-800 mb-12 text-left">Sắp ra mắt</h2>
        
        {preorderProducts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <i className="bi bi-clock text-4xl"></i>
            </div>
            <p className="text-gray-600">Hiện tại không có sản phẩm đặt trước nào.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {preorderProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ComingSoon; 