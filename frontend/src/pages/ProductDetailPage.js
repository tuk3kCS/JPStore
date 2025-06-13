import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Breadcrumb from '../components/common/Breadcrumb';
import ProductGallery from '../components/product/ProductGallery';
import ProductInfo from '../components/product/ProductInfo';
import RelatedProducts from '../components/product/RelatedProducts';
import Loading from '../components/common/Loading';
import { productService } from '../services/productService';

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const productData = await productService.getProduct(id);
        setProduct(productData);
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  if (loading) {
    return <Loading message="Loading product details..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <i className="bi bi-exclamation-triangle text-4xl"></i>
            </div>
            <p className="text-gray-600 text-lg">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <i className="bi bi-box text-4xl"></i>
            </div>
            <p className="text-gray-600 text-lg">Product not found</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products' },
    { label: product.category?.name || 'Category', path: `/products?category=${product.category?._id}` },
    { label: product.name, path: '' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />
        
        {/* Main Product Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Gallery */}
            <ProductGallery images={product.images} productName={product.name} product={product} />
            
            {/* Product Info */}
            <ProductInfo product={product} />
          </div>
        </div>
        
        {/* Related Products */}
        <RelatedProducts currentProductId={product._id} />
      </div>
      
      <Footer />
    </div>
  );
};

export default ProductDetailPage; 