import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import Pagination from './Pagination';
import { productService } from '../../services/productService';

const ProductGrid = ({ searchTerm, sortBy, setSortBy, filters }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 12;

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, sortBy, filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build API parameters
      const params = {
        page: currentPage,
        limit: productsPerPage,
        sort: getSortParam(sortBy)
      };

      // Add search term
      if (searchTerm) {
        params.search = searchTerm;
      }

      // Add price range filters
      if (filters.priceRange.min > 0) {
        params.minPrice = filters.priceRange.min;
      }
      if (filters.priceRange.max > 0 && filters.priceRange.max < 1000000) {
        params.maxPrice = filters.priceRange.max;
      }

      // Add category filter
      if (filters.categories.length > 0) {
        params.category = filters.categories.join(',');
      }

      // Add brand filter  
      if (filters.brands.length > 0) {
        params.brand = filters.brands.join(',');
      }

      const response = await productService.getProducts(params);
      let filteredProducts = response.products || [];

      // Apply product type filter (since backend doesn't have this param yet)
      if (filters.productType === 'regular') {
        filteredProducts = filteredProducts.filter(product => !product.isPreOrder);
      } else if (filters.productType === 'preorder') {
        filteredProducts = filteredProducts.filter(product => product.isPreOrder);
      }

      // Apply client-side sorting for better UX
      filteredProducts = sortProducts(filteredProducts, sortBy);

      setProducts(filteredProducts);
      setTotalProducts(filteredProducts.length);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  };

  const getSortParam = (sortBy) => {
    switch (sortBy) {
      case 'Price: Low to High':
        return 'vndPrice';
      case 'Price: High to Low':
        return '-vndPrice';
      case 'Name: A to Z':
        return 'name';
      case 'Name: Z to A':
        return '-name';
      default:
        return '-createdAt'; // Featured - newest first
    }
  };

  const sortProducts = (products, sortBy) => {
    return [...products].sort((a, b) => {
      switch (sortBy) {
        case 'Price: Low to High':
          const priceA = a.vndPrice || a.jpyPrice || 0;
          const priceB = b.vndPrice || b.jpyPrice || 0;
          return priceA - priceB;
        case 'Price: High to Low':
          const priceA2 = a.vndPrice || a.jpyPrice || 0;
          const priceB2 = b.vndPrice || b.jpyPrice || 0;
          return priceB2 - priceA2;
        case 'Name: A to Z':
          return a.name.localeCompare(b.name);
        case 'Name: Z to A':
          return b.name.localeCompare(a.name);
        default:
          return 0; // Keep original order for Featured
      }
    });
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const totalPages = Math.ceil(totalProducts / productsPerPage);
  const startItem = totalProducts > 0 ? (currentPage - 1) * productsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * productsPerPage, totalProducts);

  if (loading) {
    return (
      <div>
        {/* Header with skeleton */}
        <div className="flex justify-between items-center mb-6">
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-40 animate-pulse"></div>
        </div>

        {/* Product Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(12)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">Error loading products</p>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option>Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Name: A to Z</option>
              <option>Name: Z to A</option>
            </select>
          </div>
        </div>
        
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <i className="bi bi-exclamation-triangle text-4xl"></i>
          </div>
          <p className="text-gray-600 text-lg">{error}</p>
          <button 
            onClick={fetchProducts}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with results count and sort */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">
          {totalProducts > 0 ? (
            <>Showing {startItem}-{endItem} of {totalProducts} products</>
          ) : (
            'No products found'
          )}
        </p>
        
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option>Featured</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Name: A to Z</option>
            <option>Name: Z to A</option>
          </select>
        </div>
      </div>

      {/* Product Grid - 3 products per row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      {/* No products message */}
      {products.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <i className="bi bi-box text-4xl"></i>
          </div>
          <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search terms.</p>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.max(1, totalPages)}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default ProductGrid; 