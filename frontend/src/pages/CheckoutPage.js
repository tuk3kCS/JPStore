import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Breadcrumb from '../components/common/Breadcrumb';
import Loading from '../components/common/Loading';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { userService } from '../services/userService';
import { exchangeRateService } from '../services/exchangeRateService';
import { orderService } from '../services/orderService';

const CheckoutPage = () => {
  const { user } = useAuth();
  const { cartItems, total, loading: cartLoading, loadCart } = useCart();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: ''
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userDetails, setUserDetails] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const breadcrumbItems = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Thanh toán', path: '' }
  ];

  // Load user data and cart when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        if (user) {
          // Load user data
          const userData = await userService.getCurrentUser();
          setUserDetails(userData);
          setFormData({
            fullName: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: userData.address || ''
          });

          // Load exchange rate
          const result = exchangeRateService.loadSettings();
          if (result.success && result.settings && result.settings.rate) {
            setExchangeRate(parseFloat(result.settings.rate));
          }

          // Cart data is automatically loaded by CartContext when user changes
          // No need to manually call loadCart here
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Không thể tải thông tin người dùng');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError('');

      // Validate form data
      if (!formData.fullName || !formData.email || !formData.phone || !formData.address) {
        setError('Vui lòng điền đầy đủ tất cả các trường bắt buộc');
        return;
      }

      // Validate cart
      if (!cartItems || cartItems.length === 0) {
        setError('Giỏ hàng của bạn trống');
        return;
      }

      console.log('Creating order with customer info:', formData);
      console.log('Cart items:', cartItems);
      console.log('Total:', total);

      // Create order with PayOS payment
      const orderResult = await orderService.createOrder(formData, 'payos');
      
      console.log('Order created:', orderResult);

      if (orderResult.payment && orderResult.payment.checkoutUrl) {
        // Open PayOS payment page immediately
        window.location.href = orderResult.payment.checkoutUrl;
      } else {
        setError('Tạo liên kết thanh toán thất bại. Vui lòng thử lại.');
      }

    } catch (error) {
      console.error('Error creating order:', error);
      setError(error.response?.data?.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format price in VND
  const formatPrice = (price) => {
    return `${Math.round(price || 0).toLocaleString('vi-VN')}đ`;
  };

  // Get product image
  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      return `http://localhost:5000${product.images[0]}`;
    }
    return 'https://via.placeholder.com/64x64?text=Product';
  };

  // Calculate price based on product type
  const getItemPrice = (product) => {
    if (product.isPreOrder) {
      // For pre-order products, calculate VND price from JPY price × exchange rate
      if (product.jpyPrice && exchangeRate && exchangeRate > 0) {
        return Math.round(product.jpyPrice * exchangeRate);
      }
      // If no exchange rate available, return 0 to indicate price calculation failed
      // The system should fetch live rates automatically
      return 0;
    } else {
      return product.vndPrice || product.price || 0;
    }
  };

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Vui lòng đăng nhập</h2>
          <p className="text-gray-600 mb-4">Bạn cần đăng nhập để truy cập trang thanh toán.</p>
          <a href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Đi đến đăng nhập
          </a>
        </div>
      </div>
    );
  }

  if (loading || cartLoading) {
    return <Loading message="Đang tải thông tin thanh toán..." />;
  }

  // Redirect if cart is empty
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Giỏ hàng của bạn trống</h2>
          <p className="text-gray-600 mb-4">Thêm một số sản phẩm vào giỏ hàng trước khi thanh toán.</p>
          <a href="/products" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Tiếp tục mua sắm
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container pl-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />
        
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-left">Thanh toán</h1>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <i className="bi bi-exclamation-triangle-fill text-red-600 mr-2"></i>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-left">Thông tin khách hàng</h2>
              
              <div className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <i className="bi bi-person absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Nhập họ và tên của bạn"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                    />
                  </div>
                </div>

                {/* Email and Phone */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      Địa chỉ Email
                    </label>
                    <div className="relative">
                      <i className="bi bi-envelope absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Nhập email của bạn"
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <i className="bi bi-telephone absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Nhập số điện thoại của bạn"
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-left">Địa chỉ giao hàng</h3>
                
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Địa chỉ đầy đủ
                    </label>
                    <div className="relative">
                    <i className="bi bi-geo-alt absolute left-3 top-3 text-gray-400"></i>
                    <textarea
                      name="address"
                      value={formData.address}
                        onChange={handleInputChange}
                      placeholder="Nhập địa chỉ đầy đủ của bạn (đường, thành phố, tỉnh/thành, mã bưu chính)"
                      required
                      rows={4}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left resize-none"
                      />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 text-left">Tóm tắt đơn hàng</h2>
                <span className="text-sm text-gray-500">{cartItems.length} sản phẩm</span>
              </div>
              
              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.product._id} className="flex items-center space-x-4">
                    <img
                      src={getProductImage(item.product)}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/64x64?text=Product';
                      }}
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="font-medium text-gray-900 text-left">{item.product.name}</h4>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-500 text-left">SL: {item.quantity}</p>
                        {item.product.isPreOrder && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            Đặt trước
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-blue-600">
                      {formatPrice(getItemPrice(item.product))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Only */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between text-xl font-semibold text-gray-900">
                  <span>Tổng cộng</span>
                  <span className="text-blue-600">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Complete Purchase Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="bi bi-credit-card mr-2"></i>
                    Thanh toán với PayOS
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <Footer />
    </div>
  );
};

export default CheckoutPage; 