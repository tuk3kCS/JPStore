import React, { useState, useEffect } from 'react';
import { categoryService } from '../../services/categoryService';
import { brandService } from '../../services/brandService';

const ProductFilters = ({ filters, onFilterChange, onClearFilters, maxPrice = 1000000 }) => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        setLoading(true);
        const [categoriesData, brandsData] = await Promise.all([
          categoryService.getCategories(),
          brandService.getBrands()
        ]);
        setCategories(categoriesData || []);
        setBrands(brandsData || []);
      } catch (error) {
        console.error('Error fetching filter data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiltersData();
  }, []);

  const handlePriceChange = (field, value) => {
    const newFilters = {
      ...filters,
      priceRange: {
        ...filters.priceRange,
        [field]: parseInt(value) || 0
      }
    };
    onFilterChange(newFilters);
  };

  const handleCategoryChange = (categoryId) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(c => c !== categoryId)
      : [...filters.categories, categoryId];
    
    onFilterChange({
      ...filters,
      categories: newCategories
    });
  };

  const handleBrandChange = (brandId) => {
    const newBrands = filters.brands.includes(brandId)
      ? filters.brands.filter(b => b !== brandId)
      : [...filters.brands, brandId];
    
    onFilterChange({
      ...filters,
      brands: newBrands
    });
  };

  const handleProductTypeChange = (productType) => {
    onFilterChange({
      ...filters,
      productType
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* Filters Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <i className="bi bi-funnel text-blue-600 mr-2"></i>
          <h3 className="font-semibold text-gray-800">Bộ lọc</h3>
        </div>
        <button 
          onClick={onClearFilters}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Xóa bộ lọc
        </button>
      </div>

      {/* Product Type Filter */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-800 mb-3">Phân loại sản phẩm</h4>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="productType"
              value="all"
              checked={filters.productType === 'all'}
              onChange={(e) => handleProductTypeChange(e.target.value)}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Tất cả sản phẩm</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="productType"
              value="regular"
              checked={filters.productType === 'regular'}
              onChange={(e) => handleProductTypeChange(e.target.value)}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Hàng có sẵn</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="productType"
              value="preorder"
              checked={filters.productType === 'preorder'}
              onChange={(e) => handleProductTypeChange(e.target.value)}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Hàng đặt trước</span>
          </label>
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-800 mb-3">Khoảng giá</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Giá tối thiểu</label>
            <input
              type="number"
              value={filters.priceRange.min}
              onChange={(e) => handlePriceChange('min', e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Giá tối đa</label>
            <input
              type="number"
              value={filters.priceRange.max}
              onChange={(e) => handlePriceChange('max', e.target.value)}
              placeholder={maxPrice.toLocaleString()}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-800 mb-3">Danh mục</h4>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <label key={category._id} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category._id)}
                  onChange={() => handleCategoryChange(category._id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{category.name}</span>
              </label>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-gray-500">Không có danh mục nào</p>
            )}
          </div>
        )}
      </div>

      {/* Brands */}
      <div>
        <h4 className="font-medium text-gray-800 mb-3">Nhà phát hành</h4>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {brands.map((brand) => (
              <label key={brand._id} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.brands.includes(brand._id)}
                  onChange={() => handleBrandChange(brand._id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{brand.name}</span>
              </label>
            ))}
            {brands.length === 0 && (
              <p className="text-sm text-gray-500">Không có nhà phát hành nào</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductFilters; 