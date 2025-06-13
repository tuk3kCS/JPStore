import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import ProductFilters from '../components/product/ProductFilters';
import ProductGrid from '../components/product/ProductGrid';
import Footer from '../components/layout/Footer';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';

const ProductsPage = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('Featured');
  const [maxPrice, setMaxPrice] = useState(500); // Default fallback
  const [filters, setFilters] = useState({
    priceRange: { min: 0, max: 500 },
    categories: [],
    brands: [],
    productType: 'all' // 'all', 'regular', 'preorder'
  });
  const [availableCategories, setAvailableCategories] = useState([]);

  // Fetch categories and maximum price on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await categoryService.getCategories();
        const categories = categoriesResponse || [];
        setAvailableCategories(categories);

        // Fetch maximum price
        const productsResponse = await productService.getProducts({
          limit: 1000, // Get a large number to ensure we get all products
          page: 1
        });
        
        const products = productsResponse.products || [];
        let maxPriceFound = 500; // Default fallback
        
        // Fetch current exchange rate for JPY to VND conversion
        let exchangeRate = 0;
        try {
          const primaryUrl = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/jpy.json';
          const fallbackUrl = 'https://latest.currency-api.pages.dev/v1/currencies/jpy.json';
          
          let response;
          try {
            response = await fetch(primaryUrl);
            if (!response.ok) throw new Error('Primary API failed');
          } catch (error) {
            console.log('Primary exchange rate API failed, trying fallback...');
            response = await fetch(fallbackUrl);
            if (!response.ok) throw new Error('Fallback API also failed');
          }
          
          const data = await response.json();
          exchangeRate = data.jpy?.vnd || 0;
          console.log('Fetched exchange rate for ProductsPage:', exchangeRate);
        } catch (error) {
          console.error('Failed to fetch exchange rate for ProductsPage:', error);
          // If API fails, skip JPY price conversion and only use VND prices
        }
        
        // Find the maximum price considering both VND and JPY prices
        products.forEach(product => {
          const vndPrice = product.vndPrice || 0;
          let currentMaxPrice = vndPrice;
          
          // Convert JPY to VND if exchange rate is available
          if (product.jpyPrice && exchangeRate > 0) {
            const jpyToVnd = product.jpyPrice * exchangeRate;
            currentMaxPrice = Math.max(vndPrice, jpyToVnd);
          }
          
          if (currentMaxPrice > maxPriceFound) {
            maxPriceFound = currentMaxPrice;
          }
        });
        
        // Round up to the nearest thousand for better UX
        const roundedMaxPrice = Math.ceil(maxPriceFound / 1000) * 1000;
        setMaxPrice(roundedMaxPrice);

        // Auto-select categories and product type based on route
        let selectedCategories = [];
        let selectedProductType = 'all';
        
        if (location.pathname === '/figures') {
          // Select categories that include "Mô hình"
          selectedCategories = categories
            .filter(category => category.name.includes('Mô hình'))
            .map(category => category._id);
        } else if (location.pathname === '/merchandise') {
          // Select categories that do NOT include "Mô hình"
          selectedCategories = categories
            .filter(category => !category.name.includes('Mô hình'))
            .map(category => category._id);
        } else if (location.pathname === '/pre-order') {
          // Select pre-order product type
          selectedProductType = 'preorder';
        }
        
        setFilters(prev => ({
          ...prev,
          priceRange: { min: 0, max: roundedMaxPrice },
          categories: selectedCategories,
          productType: selectedProductType
        }));
      } catch (error) {
        console.error('Error fetching initial data:', error);
        // Keep default values on error
      }
    };

    fetchInitialData();
  }, [location.pathname]);

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
          <h1 className="text-3xl font-bold text-gray-800">Duyệt sản phẩm</h1>
          
          {/* Search Bar */}
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
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