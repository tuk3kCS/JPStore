import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminHeader from '../components/admin/AdminHeader';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { brandService } from '../services/brandService';
import { exchangeRateService } from '../services/exchangeRateService';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/common/Loading';

const ProductManagementPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeMenuItem, setActiveMenuItem] = useState('products');
  const [activeTab, setActiveTab] = useState('instock');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [formData, setFormData] = useState({
    images: [],
    name: '',
    brand: '',
    category: '',
    description: '',
    vndPrice: '',
    jpyPrice: '',
    stock: '',
    isActive: true,
    isPreOrder: false,
    releaseDate: ''
  });

  // Backend data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);

  // Brand management states
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [deleteConfirmBrand, setDeleteConfirmBrand] = useState(null);
  const [brandFormData, setBrandFormData] = useState({ name: '', description: '', isActive: true });
  const [showBrandModal, setShowBrandModal] = useState(false);

  // Category management states
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', description: '', isActive: true });
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Image upload states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Exchange rate states
  const [exchangeRate, setExchangeRate] = useState(null);
  const [exchangeRateLoading, setExchangeRateLoading] = useState(false);
  const [exchangeRateError, setExchangeRateError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [useAutoExchangeRate, setUseAutoExchangeRate] = useState(true);
  const [customExchangeRate, setCustomExchangeRate] = useState('');
  const [savedSettings, setSavedSettings] = useState(null);
  const [settingsSaveStatus, setSettingsSaveStatus] = useState(null); // 'saving', 'saved', 'error'

  // Debounced search term state
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term to avoid too many API calls while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load products and categories from backend when component mounts
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadBrands();
    loadExchangeRate();
  }, [currentPage, debouncedSearchTerm]); // Use debouncedSearchTerm instead of searchTerm

  // Load exchange rate when switching to preorder tab
  useEffect(() => {
    // Reset page when switching tabs
    setCurrentPage(1);
    
    if (activeTab === 'preorder') {
      loadExchangeRateSettings(); // Load saved settings first
      loadExchangeRate();
    }
  }, [activeTab]);

  // Initialize custom exchange rate when API rate is loaded
  useEffect(() => {
    if (exchangeRate && useAutoExchangeRate && !customExchangeRate) {
      setCustomExchangeRate(exchangeRate.toFixed(4));
    }
  }, [exchangeRate, useAutoExchangeRate]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        limit: productsPerPage,
        sort: '-createdAt'
      };
      
      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      const response = await productService.getProducts(params);
      setProducts(response.products || []);
      setTotalProducts(response.totalProducts || 0);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error('Error loading products:', error);
      setError(error.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await categoryService.getCategories();
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadBrands = async () => {
    try {
      const brandsData = await brandService.getBrands();
      setBrands(brandsData || []);
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  const loadExchangeRate = async () => {
    try {
      setExchangeRateLoading(true);
      setExchangeRateError(null);
      
      // Fetch JPY to VND exchange rate using the free currency API
      const primaryUrl = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/jpy.json';
      const fallbackUrl = 'https://latest.currency-api.pages.dev/v1/currencies/jpy.json';
      
      let response;
      try {
        response = await fetch(primaryUrl);
        if (!response.ok) throw new Error('Primary API failed');
      } catch (error) {
        console.log('Primary API failed, trying fallback...');
        response = await fetch(fallbackUrl);
        if (!response.ok) throw new Error('Fallback API also failed');
      }
      
      const data = await response.json();
      const jpyToVndRate = data.jpy?.vnd;
      
      if (jpyToVndRate) {
        setExchangeRate(jpyToVndRate);
        setLastUpdated(new Date().toISOString());
        
        // Only update custom exchange rate if in auto mode and no custom rate is set
        if (useAutoExchangeRate && !customExchangeRate) {
          setCustomExchangeRate(jpyToVndRate.toFixed(4));
        }
      } else {
        throw new Error('VND rate not found in response');
      }
    } catch (error) {
      console.error('Error loading exchange rate:', error);
      setExchangeRateError('Failed to load exchange rate');
    } finally {
      setExchangeRateLoading(false);
    }
  };

  // Handle exchange rate toggle and custom rate changes
  const handleExchangeRateToggle = (enabled) => {
    setUseAutoExchangeRate(enabled);
    if (enabled && exchangeRate) {
      setCustomExchangeRate(exchangeRate.toFixed(4));
    }
  };

  const handleCustomRateChange = (e) => {
    if (!useAutoExchangeRate) {
      setCustomExchangeRate(e.target.value);
    }
  };

  // Get current exchange rate for calculations
  const getCurrentExchangeRate = () => {
    const rate = parseFloat(customExchangeRate) || 0;
    return rate > 0 ? rate : 0;
  };

  // Load saved exchange rate settings
  const loadExchangeRateSettings = () => {
    try {
      const result = exchangeRateService.loadSettings();
      if (result.success && result.settings) {
        setSavedSettings(result.settings);
        setUseAutoExchangeRate(result.settings.type === 'automatic');
        if (result.settings.rate) {
          setCustomExchangeRate(result.settings.rate);
        }
        console.log('Loaded exchange rate settings:', result.settings);
      }
    } catch (error) {
      console.error('Error loading exchange rate settings:', error);
    }
  };

  // Save exchange rate settings
  const saveExchangeRateSettings = async () => {
    try {
      setSettingsSaveStatus('saving');
      
      const settingsToSave = {
        type: useAutoExchangeRate ? 'automatic' : 'manual',
        rate: customExchangeRate
      };

      const result = exchangeRateService.saveSettings(settingsToSave);
      
      if (result.success) {
        setSavedSettings({
          ...settingsToSave,
          lastSaved: new Date().toISOString()
        });
        setSettingsSaveStatus('saved');
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setSettingsSaveStatus(null);
        }, 3000);
      } else {
        setSettingsSaveStatus('error');
        console.error('Failed to save settings:', result.error);
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setSettingsSaveStatus(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error saving exchange rate settings:', error);
      setSettingsSaveStatus('error');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSettingsSaveStatus(null);
      }, 3000);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper function to format price
  const formatPrice = (product) => {
    if (!product) return '0đ';
    
    if (product.isPreOrder && product.jpyPrice) {
      return `¥${parseInt(product.jpyPrice).toLocaleString('ja-JP')}`;
    } else if (!product.isPreOrder && product.vndPrice) {
      return `${parseInt(product.vndPrice).toLocaleString('vi-VN')}đ`;
    }
    
    // Fallback for existing products with old price field
    if (product.price) {
      return `${parseInt(product.price).toLocaleString('vi-VN')}đ`;
    }
    
    return '0đ';
  };

  // Helper function to get stock status
  const getStockStatus = (stock) => {
    if (stock === 0) {
      return { text: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    } else if (stock <= 5) {
      return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { text: 'In Stock', color: 'bg-green-100 text-green-800' };
    }
  };

  // Helper function to format release date
  const formatReleaseDate = (date) => {
    if (!date) return 'Not set';
    const releaseDate = new Date(date);
    const today = new Date();
    const isReleasePassed = releaseDate <= today;
    
    return {
      formatted: releaseDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short'
      }),
      isPassed: isReleasePassed
    };
  };

  // Validate and process files
  const processFiles = (files) => {
    setUploadError('');

    // Check if adding these files would exceed the maximum limit
    const totalAfterAdd = selectedFiles.length + files.length;
    if (totalAfterAdd > 10) {
      const canAdd = 10 - selectedFiles.length;
      if (canAdd <= 0) {
        setUploadError('Maximum 10 images allowed per product. Please remove some images first.');
        return;
      } else {
        setUploadError(`Can only add ${canAdd} more image${canAdd > 1 ? 's' : ''}. Maximum 10 images allowed per product.`);
        return;
      }
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setUploadError('Only image files are allowed');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setUploadError('File size must be less than 5MB');
        return false;
      }
      return true;
    });

    if (validFiles.length !== files.length) {
      return;
    }

    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);
    
    // Create previews for new files
    const existingPreviews = [...imagePreviews];
    let newPreviews = [];
    
    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target.result);
        if (newPreviews.length === validFiles.length) {
          setImagePreviews([...existingPreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle file selection for multiple images
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  // Handle drag and drop upload
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  // Handle image reordering
  const handleImageDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleImageDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newFiles = [...selectedFiles];
    const newPreviews = [...imagePreviews];
    
    // Move the dragged items
    const draggedFile = newFiles[draggedIndex];
    const draggedPreview = newPreviews[draggedIndex];
    
    newFiles.splice(draggedIndex, 1);
    newPreviews.splice(draggedIndex, 1);
    
    newFiles.splice(dropIndex, 0, draggedFile);
    newPreviews.splice(dropIndex, 0, draggedPreview);
    
    setSelectedFiles(newFiles);
    setImagePreviews(newPreviews);
    setDraggedIndex(null);
  };

  // Remove selected file
  const removeImage = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  // Remove existing image from product
  const removeExistingImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // Note: currentPage reset will happen in useEffect when debouncedSearchTerm changes
  };

  // Reset page when debounced search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Reset page when switching between tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsAddMode(false);
    setFormData({
      images: product.images || [],
      name: product.name || '',
      brand: product.brand?._id || '',
      category: product.category?._id || '',
      description: product.description || '',
      vndPrice: product.vndPrice || '',
      jpyPrice: product.jpyPrice || '',
      stock: product.stock || '',
      isActive: product.isActive !== undefined ? product.isActive : true,
      isPreOrder: product.isPreOrder !== undefined ? product.isPreOrder : false,
      releaseDate: product.releaseDate || ''
    });
    // Reset upload states
    setSelectedFiles([]);
    setImagePreviews([]);
    setUploadError('');
    setDragOver(false);
    setDraggedIndex(null);
    setIsModalOpen(true);
  };

  const handleAddNewProduct = () => {
    setSelectedProduct(null);
    setIsAddMode(true);
    setFormData({
      images: [],
      name: '',
      brand: '',
      category: '',
      description: '',
      vndPrice: '',
      jpyPrice: '',
      stock: '',
      isActive: true,
      isPreOrder: activeTab === 'preorder', // Set to true if on pre-order tab
      releaseDate: ''
    });
    // Reset upload states
    setSelectedFiles([]);
    setImagePreviews([]);
    setUploadError('');
    setDragOver(false);
    setDraggedIndex(null);
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    try {
      setUploading(true);
      setError('');

      // Validate pre-order requirements
      if (formData.isPreOrder && !formData.releaseDate) {
        setUploadError('Release date is required for pre-order products');
        setUploading(false);
        return;
      }

      if (isAddMode) {
        // For new products, require at least 5 images
        if (selectedFiles.length < 5) {
          setUploadError('At least 5 images are required for new products');
          setUploading(false);
          return;
        }

        // Upload images first
        const uploadResponse = await productService.uploadProductImages(selectedFiles);
        
        // Create product with uploaded image URLs
        const productData = {
          ...formData,
          images: uploadResponse.images
        };
        
        console.log('Adding new product:', productData);
        await productService.createProduct(productData);
      } else {
        // For existing products, check total image count
        let imageUrls = formData.images;
        
        // If user uploaded new images, use those instead
        if (selectedFiles.length > 0) {
          if (selectedFiles.length < 5) {
            setUploadError('At least 5 images are required when uploading new images');
            setUploading(false);
            return;
          }
          const uploadResponse = await productService.uploadProductImages(selectedFiles);
          imageUrls = uploadResponse.images;
        } else {
          // If using existing images, ensure we have at least 5
          if (formData.images.length < 5) {
            setUploadError('Product must have at least 5 images. Please add more images or upload new ones.');
            setUploading(false);
            return;
          }
        }

        const productData = {
          ...formData,
          images: imageUrls
        };

        console.log('Updating product data:', productData);
        await productService.updateProduct(selectedProduct._id, productData);
      }

      await loadProducts();
      setIsModalOpen(false);
      setSelectedProduct(null);
      setIsAddMode(false);
    } catch (error) {
      console.error('Error saving product:', error);
      setError(error.response?.data?.message || 'Failed to save product');
    } finally {
      setUploading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setIsAddMode(false);
    setFormData({
      images: [],
      name: '',
      brand: '',
      category: '',
      description: '',
      vndPrice: '',
      jpyPrice: '',
      stock: '',
      isActive: true,
      isPreOrder: false,
      releaseDate: ''
    });
    setSelectedFiles([]);
    setImagePreviews([]);
    setUploadError('');
    setDragOver(false);
    setDraggedIndex(null);
  };

  // Delete product functionality
  const handleDeleteProduct = async (productId) => {
    try {
      await productService.deleteProduct(productId);
      setDeleteConfirmProduct(null);
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      setError(error.response?.data?.message || 'Failed to delete product');
    }
  };

  // Category management functions
  const handleDeleteCategory = async (categoryId) => {
    try {
      await categoryService.deleteCategory(categoryId);
      setDeleteConfirmCategory(null);
      await loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      setError(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleSaveCategory = async () => {
    try {
      // Validate form data before sending
      const trimmedName = categoryFormData.name.trim();
      const trimmedDescription = categoryFormData.description.trim();
      
      if (!trimmedName) {
        setError('Please enter a valid category name');
        return;
      }
      
      if (!trimmedDescription) {
        setError('Please enter a valid category description');
        return;
      }
      
      const dataToSend = {
        name: trimmedName,
        description: trimmedDescription,
        isActive: categoryFormData.isActive
      };
      
      if (selectedCategory) {
        await categoryService.updateCategory(selectedCategory._id, dataToSend);
      } else {
        await categoryService.createCategory(dataToSend);
      }
      await loadCategories();
      setSelectedCategory(null);
      setCategoryFormData({ name: '', description: '', isActive: true });
      setShowCategoryModal(false);
      setError(null); // Clear any errors on success
    } catch (error) {
      console.error('Error saving category:', error);
      setError(error.response?.data?.message || 'Failed to save category');
    }
  };

  // Brand management functions
  const handleDeleteBrand = async (brandId) => {
    try {
      await brandService.deleteBrand(brandId);
      setDeleteConfirmBrand(null);
      await loadBrands();
    } catch (error) {
      console.error('Error deleting brand:', error);
      setError(error.response?.data?.message || 'Failed to delete brand');
    }
  };

  const handleSaveBrand = async () => {
    try {
      // Validate form data before sending
      const trimmedName = brandFormData.name.trim();
      const trimmedDescription = brandFormData.description.trim();
      
      if (!trimmedName) {
        setError('Please enter a valid brand name');
        return;
      }
      
      if (!trimmedDescription) {
        setError('Please enter a valid brand description');
        return;
      }
      
      const dataToSend = {
        name: trimmedName,
        description: trimmedDescription,
        isActive: brandFormData.isActive
      };
      
      if (selectedBrand) {
        await brandService.updateBrand(selectedBrand._id, dataToSend);
      } else {
        await brandService.createBrand(dataToSend);
      }
      await loadBrands();
      setSelectedBrand(null);
      setBrandFormData({ name: '', description: '', isActive: true });
      setShowBrandModal(false);
      setError(null); // Clear any errors on success
    } catch (error) {
      console.error('Error saving brand:', error);
      setError(error.response?.data?.message || 'Failed to save brand');
    }
  };

  // Show loading state
  if (loading && products.length === 0) {
    return <Loading message="Loading products..." />;
  }

  // Helper function to get filtered products for current tab
  const getFilteredProducts = () => {
    if (activeTab === 'preorder') {
      return products.filter(product => product.isPreOrder);
    } else if (activeTab === 'instock') {
      return products.filter(product => !product.isPreOrder);
    }
    return products;
  };

  // Helper function to get filtered product count
  const getFilteredProductCount = () => {
    return getFilteredProducts().length;
  };

  // Helper function to get filtered pages count  
  const getFilteredPages = () => {
    return Math.ceil(getFilteredProductCount() / productsPerPage);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        {/* Logo */}
        <div className="px-6 py-6 border-b">
          <div className="flex items-center">
            <img 
              src="/images/logo.png" 
              alt="JPStore Logo" 
              className="h-8 w-auto"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <span 
              className="text-xl font-bold text-blue-600 ml-2"
              style={{display: 'none'}}
            >
              JPStore
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link
                to="/admin"
                className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-gray-600 hover:bg-gray-50"
              >
                <i className="bi bi-grid mr-3"></i>
                Overview
              </Link>
            </li>
            <li>
              <Link
                to="/admin/users"
                className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-gray-600 hover:bg-gray-50"
              >
                <i className="bi bi-people mr-3"></i>
                User Management
              </Link>
            </li>
            <li>
              <button
                onClick={() => setActiveMenuItem('products')}
                className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors bg-blue-50 text-blue-600 border-r-2 border-blue-600"
              >
                <i className="bi bi-box mr-3"></i>
                Product Management
              </button>
            </li>
            <li>
              <Link
                to="/admin/orders"
                className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-gray-600 hover:bg-gray-50"
              >
                <i className="bi bi-clipboard-data mr-3"></i>
                Order Management
              </Link>
            </li>
            <li>
              <button
                onClick={() => setActiveMenuItem('statistics')}
                className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-gray-600 hover:bg-gray-50"
              >
                <i className="bi bi-bar-chart mr-3"></i>
                Statistics
              </button>
            </li>
          </ul>
          
          {/* Logout Button */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <i className="bi bi-box-arrow-right mr-3"></i>
              Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <AdminHeader title="Product Management" />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <div className="flex items-center">
                <i className="bi bi-exclamation-triangle mr-2"></i>
                {error}
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto text-red-700 hover:text-red-900"
                >
                  <i className="bi bi-x"></i>
                </button>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="mb-6">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('instock')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'instock'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="bi bi-box mr-2"></i>
                In Stock Products
              </button>
              <button
                onClick={() => setActiveTab('preorder')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'preorder'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="bi bi-clock mr-2"></i>
                Pre-Order Products
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'categories'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="bi bi-grid mr-2"></i>
                Category Management
              </button>
              <button
                onClick={() => setActiveTab('brands')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'brands'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="bi bi-award mr-2"></i>
                Brand Management
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {(activeTab === 'instock' || activeTab === 'preorder') && (
            <>
              {/* Search and Actions */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <i className="bi bi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      placeholder="Search products by name, brand, or description..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Add New Product Button */}
                <button 
                  onClick={handleAddNewProduct}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <i className="bi bi-plus"></i>
                  <span>Add New Product</span>
                </button>
              </div>

              {/* Pre-Order Products Table */}
              {activeTab === 'preorder' && (
                <div className="mb-8">
                  {/* Exchange Rate Controls */}
                  <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Custom Exchange Rate Control (Left) */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between space-x-4">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">Exchange Rate Setting</h3>
                        </div>
                        
                        {/* Toggle Switch */}
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-600">Manual</span>
                          <button
                            onClick={() => handleExchangeRateToggle(!useAutoExchangeRate)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              useAutoExchangeRate ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                useAutoExchangeRate ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className="text-xs text-gray-600">Auto</span>
                        </div>
                      </div>
                      
                      {/* Exchange Rate Input */}
                      <div className="flex items-center space-x-3 mt-3">
                        <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
                          1 JPY =
                        </label>
                        <input
                          type="number"
                          value={customExchangeRate}
                          onChange={handleCustomRateChange}
                          disabled={useAutoExchangeRate}
                          step="0.0001"
                          min="0"
                          className={`flex-1 px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            useAutoExchangeRate 
                              ? 'bg-gray-50 text-gray-500 cursor-not-allowed' 
                              : 'bg-white text-gray-900'
                          }`}
                          placeholder="0.0000"
                        />
                        <span className="text-xs font-medium text-gray-700">VND</span>
                        
                        {/* Inline Save Button */}
                        <button
                          onClick={saveExchangeRateSettings}
                          disabled={settingsSaveStatus === 'saving'}
                          className={`flex items-center justify-center px-3 py-1 text-sm font-medium rounded transition-colors whitespace-nowrap ${
                            settingsSaveStatus === 'saving'
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {settingsSaveStatus === 'saving' ? (
                            <>
                              <i className="bi bi-arrow-clockwise animate-spin mr-1"></i>
                              <span>Saving</span>
                            </>
                          ) : (
                            <>
                              <i className="bi bi-floppy mr-1"></i>
                              <span>Save</span>
                            </>
                          )}
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div></div>
                        
                        {/* Save Status Display */}
                        <div className="text-xs">
                          {settingsSaveStatus === 'saved' && (
                            <span className="text-green-600 font-medium">
                              <i className="bi bi-check-circle-fill mr-1"></i>
                              Saved!
                            </span>
                          )}
                          {settingsSaveStatus === 'error' && (
                            <span className="text-red-600 font-medium">
                              <i className="bi bi-exclamation-circle-fill mr-1"></i>
                              Error!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* API Exchange Rate Display (Right) */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 h-full flex items-center">
                      <div className="flex items-center justify-between space-x-4 w-full">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <i className="bi bi-globe text-blue-600"></i>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">Live API Rate</h3>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {exchangeRateLoading ? (
                            <div className="flex items-center space-x-2">
                              <i className="bi bi-arrow-clockwise animate-spin text-blue-600"></i>
                              <span className="text-sm text-gray-600">Loading...</span>
                            </div>
                          ) : exchangeRateError ? (
                            <div className="text-center">
                              <div className="flex items-center space-x-2 text-red-600 mb-2">
                                <i className="bi bi-exclamation-triangle"></i>
                                <span className="text-sm">{exchangeRateError}</span>
                              </div>
                              <button 
                                onClick={loadExchangeRate}
                                className="text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
                              >
                                Retry
                              </button>
                            </div>
                          ) : exchangeRate ? (
                            <div>
                              <div className="text-lg font-bold text-gray-900 mb-1">
                                1 JPY = {exchangeRate.toFixed(4)} VND
                              </div>
                              <div className="flex items-center justify-end space-x-2">
                                {lastUpdated && (
                                  <span className="text-xs text-gray-500">
                                    Updated: {new Date(lastUpdated).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                )}
                                <button 
                                  onClick={loadExchangeRate}
                                  className="text-blue-600 hover:text-blue-800 text-xs flex items-center space-x-1"
                                  disabled={exchangeRateLoading}
                                >
                                  <i className="bi bi-arrow-clockwise"></i>
                                  <span>Refresh</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-500 text-sm">No rate available</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">JPY Price</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">VND Price</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Release Date</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Active Status</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {products.filter(product => product.isPreOrder).map((product, index) => {
                          const releaseInfo = product.releaseDate ? formatReleaseDate(product.releaseDate) : null;
                                                      const currentRate = getCurrentExchangeRate();
                            const vndPrice = product.jpyPrice && currentRate ? (product.jpyPrice * currentRate) : 0;
                            return (
                              <tr key={product._id || index} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleProductClick(product)}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">
                                  <div className="flex items-center space-x-3">
                                    <img
                                      src={product.images?.[0] ? `http://localhost:5000${product.images[0]}` : 'https://via.placeholder.com/40x40?text=Product'}
                                      alt={product.name}
                                      className="w-10 h-10 rounded object-cover"
                                      onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/40x40?text=Product';
                                      }}
                                    />
                                    <div>
                                      <div className="font-medium text-gray-900">{product.name}</div>
                                      <div className="text-gray-500 text-xs truncate max-w-xs">
                                        {product.description?.substring(0, 50)}...
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                  <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                                    {product.category?.name || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                  {product.brand?.name || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                  <span className="font-medium text-blue-600">
                                    ¥{parseInt(product.jpyPrice || 0).toLocaleString('ja-JP')}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                  <span className="font-medium text-green-600">
                                    {parseInt(vndPrice).toLocaleString('vi-VN')}đ
                                  </span>
                                  {currentRate === 0 && (
                                    <div className="text-xs text-red-500 mt-1">
                                      No exchange rate
                                    </div>
                                  )}
                                </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                {releaseInfo ? (
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    releaseInfo.isPassed 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    <i className={`mr-1 ${releaseInfo.isPassed ? 'bi bi-check-circle' : 'bi bi-calendar'}`}></i>
                                    {releaseInfo.formatted}
                                  </span>
                                ) : (
                                  <span className="text-gray-500">Not set</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  product.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {product.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  {/* Edit Button */}
                                  <button 
                                    className="px-2 py-1 rounded border text-xs text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleProductClick(product);
                                    }}
                                    title="Edit Product"
                                  >
                                    <i className="bi bi-pencil text-xs mr-1"></i>
                                    <span className="text-xs">Edit</span>
                                  </button>
                                  
                                  {/* Remove Button */}
                                  <button 
                                    className="px-2 py-1 rounded border text-xs text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirmProduct(product);
                                    }}
                                    title="Remove Product"
                                  >
                                    <i className="bi bi-trash text-xs mr-1"></i>
                                    <span className="text-xs">Remove</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* In Stock Products Table */}
              {activeTab === 'instock' && (
                <div className="mb-8">
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Release Date</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Active Status</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {products.filter(product => !product.isPreOrder).map((product, index) => {
                          const stockStatus = getStockStatus(product.stock);
                          const releaseInfo = product.releaseDate ? formatReleaseDate(product.releaseDate) : null;
                          return (
                            <tr key={product._id || index} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleProductClick(product)}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">
                                <div className="flex items-center space-x-3">
                                  <img
                                    src={product.images?.[0] ? `http://localhost:5000${product.images[0]}` : 'https://via.placeholder.com/40x40?text=Product'}
                                    alt={product.name}
                                    className="w-10 h-10 rounded object-cover"
                                    onError={(e) => {
                                      e.target.src = 'https://via.placeholder.com/40x40?text=Product';
                                    }}
                                  />
                                  <div>
                                    <div className="font-medium text-gray-900">{product.name}</div>
                                    <div className="text-gray-500 text-xs truncate max-w-xs">
                                      {product.description?.substring(0, 50)}...
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                                  {product.category?.name || 'N/A'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                {product.brand?.name || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                {formatPrice(product)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                                  {stockStatus.text}
                                </span>
                                <div className="text-gray-900 text-sm mt-1">
                                  {product.stock || 0}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                {releaseInfo ? (
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    releaseInfo.isPassed 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    <i className={`mr-1 ${releaseInfo.isPassed ? 'bi bi-check-circle' : 'bi bi-calendar'}`}></i>
                                    {releaseInfo.formatted}
                                  </span>
                                ) : (
                                  <span className="text-gray-500">Not set</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  product.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {product.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  {/* Edit Button */}
                                  <button 
                                    className="px-2 py-1 rounded border text-xs text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleProductClick(product);
                                    }}
                                    title="Edit Product"
                                  >
                                    <i className="bi bi-pencil text-xs mr-1"></i>
                                    <span className="text-xs">Edit</span>
                                  </button>
                                  
                                  {/* Remove Button */}
                                  <button 
                                    className="px-2 py-1 rounded border text-xs text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteConfirmProduct(product);
                                    }}
                                    title="Remove Product"
                                  >
                                    <i className="bi bi-trash text-xs mr-1"></i>
                                    <span className="text-xs">Remove</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Show message if no products found */}
              {(activeTab === 'instock' || activeTab === 'preorder') && products.length === 0 && !loading && (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <i className="bi bi-box text-4xl text-gray-400 mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'Try adjusting your search criteria.' : 'No products have been added yet.'}
                  </p>
                </div>
              )}

              {/* Show message if no pre-order products found */}
              {activeTab === 'preorder' && products.filter(product => product.isPreOrder).length === 0 && !loading && products.length > 0 && (
                <div className="mb-8">
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <i className="bi bi-clock text-4xl text-gray-400 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No pre-order products found</h3>
                    <p className="text-gray-500">
                      No products are currently available for pre-order.
                    </p>
                  </div>
                </div>
              )}

              {/* Show message if no in-stock products found */}
              {activeTab === 'instock' && products.filter(product => !product.isPreOrder).length === 0 && !loading && products.length > 0 && (
                <div className="mb-8">
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <i className="bi bi-box text-4xl text-gray-400 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No in-stock products found</h3>
                    <p className="text-gray-500">
                      No regular products are currently in stock.
                    </p>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {(activeTab === 'instock' || activeTab === 'preorder') && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-gray-600 text-sm">
                    Showing {((currentPage - 1) * productsPerPage) + 1} to {Math.min(currentPage * productsPerPage, getFilteredProductCount())} of {getFilteredProductCount()} {activeTab === 'preorder' ? 'pre-order' : 'in-stock'} products
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                    
                    {[...Array(Math.min(5, Math.max(1, getFilteredPages())))].map((_, index) => {
                      const page = index + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 hover:text-blue-600'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    {getFilteredPages() > 5 && (
                      <>
                        <span className="text-gray-400">...</span>
                        <button
                          onClick={() => handlePageChange(getFilteredPages())}
                          className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                            currentPage === getFilteredPages()
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 hover:text-blue-600'
                          }`}
                        >
                          {getFilteredPages()}
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === getFilteredPages()}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Category Management Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Category Actions */}
              <div className="flex items-center justify-end">
                <button 
                  onClick={() => {
                    setSelectedCategory(null);
                    setCategoryFormData({ name: '', description: '', isActive: true });
                    setShowCategoryModal(true);
                    setError(null); // Clear any existing errors
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <i className="bi bi-plus"></i>
                  <span>Add New Category</span>
                </button>
              </div>

              {/* Categories Table */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((category) => (
                      <tr key={category._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                          {category.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 text-center">
                          <div className="max-w-xs truncate mx-auto">
                            {category.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            category.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button 
                              className="px-2 py-1 rounded border text-xs text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50"
                              onClick={() => {
                                setSelectedCategory(category);
                                setCategoryFormData({
                                  name: category.name,
                                  description: category.description,
                                  isActive: category.isActive
                                });
                                setShowCategoryModal(true);
                                setError(null); // Clear any existing errors
                              }}
                              title="Edit Category"
                            >
                              <i className="bi bi-pencil text-xs mr-1"></i>
                              <span className="text-xs">Edit</span>
                            </button>
                            
                            <button 
                              className="px-2 py-1 rounded border text-xs text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                              onClick={() => setDeleteConfirmCategory(category)}
                              title="Remove Category"
                            >
                              <i className="bi bi-trash text-xs mr-1"></i>
                              <span className="text-xs">Remove</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* No categories message */}
              {categories.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <i className="bi bi-grid text-4xl text-gray-400 mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                  <p className="text-gray-500">Create your first category to get started.</p>
                </div>
              )}
            </div>
          )}

          {/* Brand Management Tab */}
          {activeTab === 'brands' && (
            <div className="space-y-6">
              {/* Brand Actions */}
              <div className="flex items-center justify-end">
                <button 
                  onClick={() => {
                    setSelectedBrand(null);
                    setBrandFormData({ name: '', description: '', isActive: true });
                    setShowBrandModal(true);
                    setError(null); // Clear any existing errors
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <i className="bi bi-plus"></i>
                  <span>Add New Brand</span>
                </button>
              </div>

              {/* Brands Table */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {brands.map((brand) => (
                      <tr key={brand._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                          {brand.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 text-center">
                          <div className="max-w-xs truncate mx-auto">
                            {brand.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            brand.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {brand.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button 
                              className="px-2 py-1 rounded border text-xs text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50"
                              onClick={() => {
                                setSelectedBrand(brand);
                                setBrandFormData({
                                  name: brand.name,
                                  description: brand.description,
                                  isActive: brand.isActive
                                });
                                setShowBrandModal(true);
                              }}
                              title="Edit Brand"
                            >
                              <i className="bi bi-pencil text-xs mr-1"></i>
                              <span className="text-xs">Edit</span>
                            </button>
                            
                            <button 
                              className="px-2 py-1 rounded border text-xs text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                              onClick={() => setDeleteConfirmBrand(brand)}
                              title="Remove Brand"
                            >
                              <i className="bi bi-trash text-xs mr-1"></i>
                              <span className="text-xs">Remove</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* No brands message */}
              {brands.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <i className="bi bi-award text-4xl text-gray-400 mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No brands found</h3>
                  <p className="text-gray-500">Create your first brand to get started.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Product Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {isAddMode ? 'Add New Product' : 'Edit Product'}
              </h2>
              <button
                onClick={handleModalClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form className="space-y-6">
              {/* Product Images Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3 text-left">
                  Product Images {isAddMode && <span className="text-red-500">* (minimum 5, maximum 10 images)</span>}
                </label>
                
                {/* Upload Error */}
                {uploadError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                    <i className="bi bi-exclamation-triangle mr-2"></i>
                    {uploadError}
                  </div>
                )}

                {/* Drag and Drop Upload Zone */}
                <div
                  className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragOver 
                      ? 'border-blue-500 bg-blue-50' 
                      : selectedFiles.length >= 10
                      ? 'border-gray-200 bg-gray-50'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${selectedFiles.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onDragOver={selectedFiles.length >= 10 ? undefined : handleDragOver}
                  onDragLeave={selectedFiles.length >= 10 ? undefined : handleDragLeave}
                  onDrop={selectedFiles.length >= 10 ? undefined : handleDrop}
                >
                  <div className="flex flex-col items-center">
                    <i className={`bi bi-cloud-upload text-4xl mb-4 ${
                      selectedFiles.length >= 10
                        ? 'text-gray-300'
                        : dragOver 
                        ? 'text-blue-500' 
                        : 'text-gray-400'
                    }`}></i>
                    <h3 className={`text-lg font-medium mb-2 ${
                      selectedFiles.length >= 10
                        ? 'text-gray-400'
                        : dragOver 
                        ? 'text-blue-700' 
                        : 'text-gray-900'
                    }`}>
                      {selectedFiles.length >= 10 
                        ? 'Maximum 10 images reached' 
                        : dragOver 
                        ? 'Drop images here' 
                        : 'Drag & drop images here'
                      }
                    </h3>
                    {selectedFiles.length < 10 && (
                      <>
                        <p className="text-gray-500 mb-4">
                          or
                        </p>
                        <label className="cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          <span>Choose Files</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>

                {/* Image Previews Grid */}
                {imagePreviews.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Selected Images ({imagePreviews.length}/10)
                      </h4>
                    </div>
                    <div className="grid grid-cols-6 gap-3">
                      {imagePreviews.map((preview, index) => (
                        <div
                          key={index}
                          className={`relative group cursor-move transition-transform ${
                            draggedIndex === index ? 'scale-105 z-10' : 'hover:scale-105'
                          }`}
                          draggable
                          onDragStart={(e) => handleImageDragStart(e, index)}
                          onDragOver={(e) => handleImageDragOver(e, index)}
                          onDrop={(e) => handleImageDrop(e, index)}
                        >
                          {/* Main Image Badge */}
                          {index === 0 && (
                            <div className="absolute -top-2 -left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full z-20 shadow-md">
                              <i className="bi bi-star-fill mr-1"></i>
                              Main
                            </div>
                          )}
                          
                          {/* Image Preview */}
                          <div className="relative">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className={`w-full h-24 object-cover rounded-lg border-2 transition-all ${
                                index === 0 
                                  ? 'border-green-300 shadow-md' 
                                  : 'border-gray-200 group-hover:border-blue-300'
                              } ${draggedIndex === index ? 'opacity-50' : ''}`}
                            />
                            
                            {/* Drag Handle */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-30 rounded-lg">
                              <i className="bi bi-grip-vertical text-white text-lg"></i>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 z-20 shadow-md transition-colors"
                          >
                            ×
                          </button>

                          {/* Position Indicator */}
                          <div className="absolute bottom-1 left-1 bg-gray-900 bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Existing Images (for edit mode) */}
                {!isAddMode && formData.images.length > 0 && selectedFiles.length === 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Current Images ({formData.images.length}/10)
                      </h4>
                    </div>
                    <div className="grid grid-cols-6 gap-3">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          {/* Main Image Badge */}
                          {index === 0 && (
                            <div className="absolute -top-2 -left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full z-20 shadow-md">
                              <i className="bi bi-star-fill mr-1"></i>
                              Main
                            </div>
                          )}
                          
                          <img
                            src={`http://localhost:5000${image}`}
                            alt={`Product ${index + 1}`}
                            className={`w-full h-24 object-cover rounded-lg border-2 ${
                              index === 0 ? 'border-green-300' : 'border-gray-200'
                            }`}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/96x96?text=Image';
                            }}
                          />

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 z-20 shadow-md transition-colors"
                            title="Remove image"
                          >
                            ×
                          </button>

                          {/* Position Indicator */}
                          <div className="absolute bottom-1 left-1 bg-gray-900 bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image Count and Requirements Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      {selectedFiles.length > 0 && (
                        <span className="text-gray-700">
                          <i className="bi bi-images mr-1"></i>
                          Selected: <span className="font-medium">{selectedFiles.length}/10</span> images
                        </span>
                      )}
                      {!isAddMode && formData.images.length > 0 && selectedFiles.length === 0 && (
                        <span className="text-gray-700">
                          <i className="bi bi-images mr-1"></i>
                          Current: <span className="font-medium">{formData.images.length}/10</span> images
                        </span>
                      )}
                    </div>
                    
                    <div className="text-right">
                      {selectedFiles.length < 5 && isAddMode && (
                        <span className="text-red-600 font-medium">
                          <i className="bi bi-exclamation-circle mr-1"></i>
                          Need {5 - selectedFiles.length} more images
                        </span>
                      )}
                      {!isAddMode && formData.images.length < 5 && selectedFiles.length === 0 && (
                        <span className="text-red-600 font-medium">
                          <i className="bi bi-exclamation-triangle mr-1"></i>
                          Need {5 - formData.images.length} more images (minimum 5 required)
                        </span>
                      )}
                      {selectedFiles.length >= 5 && selectedFiles.length < 10 && (
                        <span className="text-green-600 font-medium">
                          <i className="bi bi-check-circle mr-1"></i>
                          Requirements met • Can add {10 - selectedFiles.length} more
                        </span>
                      )}
                      {!isAddMode && formData.images.length >= 5 && selectedFiles.length === 0 && (
                        <span className="text-green-600 font-medium">
                          <i className="bi bi-check-circle mr-1"></i>
                          Requirements met • Can add {10 - formData.images.length} more
                        </span>
                      )}
                      {selectedFiles.length >= 10 && (
                        <span className="text-blue-600 font-medium">
                          <i className="bi bi-info-circle mr-1"></i>
                          Maximum images reached
                        </span>
                      )}
                      {!isAddMode && formData.images.length >= 10 && selectedFiles.length === 0 && (
                        <span className="text-blue-600 font-medium">
                          <i className="bi bi-info-circle mr-1"></i>
                          Maximum images reached
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter product name"
                    required
                  />
                </div>

                {/* Brand Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Brand *
                  </label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select brand</option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand._id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    {formData.isPreOrder ? 'Price (Japanese Yen) *' : 'Price (Vietnam Dong) *'}
                  </label>
                  {formData.isPreOrder ? (
                    <input
                      type="number"
                      name="jpyPrice"
                      value={formData.jpyPrice}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                      min="0"
                      step="1"
                      required
                    />
                  ) : (
                    <input
                      type="number"
                      name="vndPrice"
                      value={formData.vndPrice}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                      min="0"
                      step="1000"
                      required
                    />
                  )}
                </div>

                {/* Stock - Only show for non-preorder products */}
                {!formData.isPreOrder && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                )}

                {/* Release Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Release Date (Month & Year)
                    {formData.isPreOrder && <span className="text-orange-600"> *</span>}
                  </label>
                  <input
                    type="month"
                    name="releaseDate"
                    value={formData.releaseDate ? new Date(formData.releaseDate).toISOString().slice(0, 7) : ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required={formData.isPreOrder}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter product description"
                  required
                />
              </div>

              {/* Pre-order Checkbox */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  name="isPreOrder"
                  checked={formData.isPreOrder}
                  onChange={handleFormChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                />
                <label className="ml-2 block text-sm text-gray-700 text-left">
                  <span className="font-medium">Pre-order product</span>
                </label>
              </div>

              {/* Active Checkbox - Only show when editing existing products */}
              {!isAddMode && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleFormChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Active (product is available for sale)
                  </label>
                </div>
              )}

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uploading}
                >
                  {uploading ? (
                    <div className="flex items-center justify-center">
                      <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                      {isAddMode ? 'Creating Product...' : 'Updating Product...'}
                    </div>
                  ) : (
                    isAddMode ? 'Add Product' : 'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Confirm Delete
              </h2>
              <button
                onClick={() => setDeleteConfirmProduct(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="bi bi-exclamation-triangle text-red-600 text-xl"></i>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-medium text-gray-900">Delete Product</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4 text-left">
                Are you sure you want to delete product <strong>{deleteConfirmProduct.name}</strong>? 
                This will permanently remove the product and all associated data.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <i className="bi bi-info-circle text-red-500 mr-2 flex-shrink-0"></i>
                  <span className="text-sm text-red-700 text-left">This action is irreversible</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProduct(deleteConfirmProduct._id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Edit Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setCategoryFormData({ name: '', description: '', isActive: true });
                  setShowCategoryModal(false);
                  setError(null); // Clear any existing errors
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter category name"
                  required
                />
              </div>

              {/* Category Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Description *
                </label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter category description"
                  required
                />
              </div>

              {/* Active Checkbox - Only show when editing */}
              {selectedCategory && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={categoryFormData.isActive}
                    onChange={(e) => setCategoryFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Active (category is available for use)
                  </label>
                </div>
              )}

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(null);
                    setCategoryFormData({ name: '', description: '', isActive: true });
                    setShowCategoryModal(false);
                    setError(null); // Clear any existing errors
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCategory}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {selectedCategory ? 'Save Changes' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brand Edit Modal */}
      {showBrandModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedBrand ? 'Edit Brand' : 'Add New Brand'}
              </h2>
              <button
                onClick={() => {
                  setSelectedBrand(null);
                  setBrandFormData({ name: '', description: '', isActive: true });
                  setShowBrandModal(false);
                  setError(null); // Clear any existing errors
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form className="space-y-4">
              {/* Brand Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={brandFormData.name}
                  onChange={(e) => setBrandFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter brand name"
                  required
                />
              </div>

              {/* Brand Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Description *
                </label>
                <textarea
                  value={brandFormData.description}
                  onChange={(e) => setBrandFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter brand description"
                  required
                />
              </div>

              {/* Active Checkbox - Only show when editing */}
              {selectedBrand && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={brandFormData.isActive}
                    onChange={(e) => setBrandFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Active (brand is available for use)
                  </label>
                </div>
              )}

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBrand(null);
                    setBrandFormData({ name: '', description: '', isActive: true });
                    setShowBrandModal(false);
                    setError(null); // Clear any existing errors
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBrand}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {selectedBrand ? 'Save Changes' : 'Add Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {deleteConfirmCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Confirm Delete
              </h2>
              <button
                onClick={() => setDeleteConfirmCategory(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="bi bi-exclamation-triangle text-red-600 text-xl"></i>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-medium text-gray-900">Delete Category</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4 text-left">
                Are you sure you want to delete category <strong>{deleteConfirmCategory.name}</strong>? 
                This will permanently remove the category and may affect products using this category.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <i className="bi bi-info-circle text-red-500 mr-2 flex-shrink-0"></i>
                  <span className="text-sm text-red-700 text-left">This action is irreversible</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmCategory(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCategory(deleteConfirmCategory._id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Brand Confirmation Modal */}
      {deleteConfirmBrand && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Confirm Delete
              </h2>
              <button
                onClick={() => setDeleteConfirmBrand(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="bi bi-exclamation-triangle text-red-600 text-xl"></i>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-medium text-gray-900">Delete Brand</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4 text-left">
                Are you sure you want to delete brand <strong>{deleteConfirmBrand.name}</strong>? 
                This will permanently remove the brand and may affect products using this brand.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <i className="bi bi-info-circle text-red-500 mr-2 flex-shrink-0"></i>
                  <span className="text-sm text-red-700 text-left">This action is irreversible</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmBrand(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBrand(deleteConfirmBrand._id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Brand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagementPage; 