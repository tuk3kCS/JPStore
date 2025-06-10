import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import ProductFilters from '../components/product/ProductFilters';
import ProductGrid from '../components/product/ProductGrid';
import Footer from '../components/layout/Footer';
import { productService } from '../services/productService';

const ProductsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('Featured');
  const [maxPrice, setMaxPrice] = useState(500); // Default fallback
  const [filters, setFilters] = useState({
    priceRange: { min: 0, max: 500 },
    categories: [],
    brands: [],
    productType: 'all' // 'all', 'regular', 'preorder'
  });

  // Fetch maximum price on component mount
  useEffect(() => {
    const fetchMaxPrice = async () => {
      try {
        // Fetch all products to find the maximum price
        const response = await productService.getProducts({
          limit: 1000, // Get a large number to ensure we get all products
          page: 1
        });
        
        const products = response.products || [];
        let maxPriceFound = 500; // Default fallback
        
        // Find the maximum price considering both VND and JPY prices
        products.forEach(product => {
          const vndPrice = product.vndPrice || 0;
          const jpyPrice = product.jpyPrice || 0;
          
          // Convert JPY to VND for comparison (approximate conversion: 1 JPY ≈ 170 VND)
          const jpyToVnd = jpyPrice * 170;
          
          const currentMaxPrice = Math.max(vndPrice, jpyToVnd);
          if (currentMaxPrice > maxPriceFound) {
            maxPriceFound = currentMaxPrice;
          }
        });
        
        // Round up to the nearest thousand for better UX
        const roundedMaxPrice = Math.ceil(maxPriceFound / 1000) * 1000;
        
        setMaxPrice(roundedMaxPrice);
        setFilters(prev => ({
          ...prev,
          priceRange: { min: 0, max: roundedMaxPrice }
        }));
      } catch (error) {
        console.error('Error fetching max price:', error);
        // Keep default values on error
      }
    };

    fetchMaxPrice();
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      priceRange: { min: 0, max: maxPrice },
      categories: [],
      brands: [],
      productType: 'all'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Browse Products</h1>
          
          {/* Search Bar */}
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search figures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <i className="bi bi-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0">
            <ProductFilters 
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              maxPrice={maxPrice}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <ProductGrid 
              searchTerm={searchTerm}
              sortBy={sortBy}
              setSortBy={setSortBy}
              filters={filters}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductsPage; 