import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Breadcrumb from '../components/common/Breadcrumb';
import CartItem from '../components/cart/CartItem';
import OrderSummary from '../components/cart/OrderSummary';
import RelatedProducts from '../components/product/RelatedProducts';
import Loading from '../components/common/Loading';
import { useCart } from '../context/CartContext';

const CartPage = () => {
  const { 
    cartItems, 
    totalItems, 
    subtotal, 
    total, 
    loading, 
    error,
    updateCartItem, 
    removeFromCart,
    loadCart,
    recalculateCartTotals
  } = useCart();

  const breadcrumbItems = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Giỏ hàng', path: '' }
  ];

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Recalculate totals after cart is loaded to ensure correct exchange rate pricing
  useEffect(() => {
    if (cartItems.length > 0 && !loading) {
      // Small delay to ensure exchange rate is loaded
      const timer = setTimeout(() => {
        recalculateCartTotals();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [cartItems.length, loading]); // Removed recalculateCartTotals from dependencies

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity <= 0) return;
    await updateCartItem(productId, newQuantity);
  };

  const removeItem = async (productId) => {
    await removeFromCart(productId);
  };

  if (loading && cartItems.length === 0) {
    return <Loading message="Đang tải giỏ hàng..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex items-center">
              <i className="bi bi-exclamation-triangle mr-2"></i>
              {error}
            </div>
          </div>
        )}
        
        {/* Page Title and Continue Shopping */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 text-left">
            Giỏ hàng của bạn {totalItems > 0 && (
              <span className="text-lg font-normal text-gray-600">
                ({totalItems} sản phẩm)
              </span>
            )}
          </h1>
          {cartItems.length > 0 && (
            <Link
              to="/products"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <i className="bi bi-arrow-left mr-2"></i>
              Tiếp tục mua sắm
            </Link>
          )}
        </div>
        
        {cartItems.length === 0 ? (
          // Empty Cart
          <div className="bg-white rounded-lg shadow-sm p-12 text-center mb-8">
            <i className="bi bi-cart-x text-6xl text-gray-400 mb-4"></i>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Giỏ hàng của bạn trống</h2>
            <p className="text-gray-600 mb-6">Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
            <Link
              to="/products"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Bắt đầu mua sắm
            </Link>
          </div>
        ) : (
          // Cart with Items
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Cart Header */}
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-gray-700">
                  <div className="col-span-5 text-left">Sản phẩm</div>
                  <div className="col-span-2 text-center">Giá</div>
                  <div className="col-span-2 text-center">Số lượng</div>
                  <div className="col-span-2 text-center">Tổng cộng</div>
                  <div className="col-span-1 text-center"></div>
                </div>
                
                {/* Cart Items */}
                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <CartItem
                      key={item.product._id}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                      loading={loading}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Order Summary */}
            <div>
              <OrderSummary
              total={subtotal} // Use subtotal as total since we're removing shipping
                loading={loading}
              />
            </div>
          </div>
        )}
        
        {/* Related Products */}
        <RelatedProducts />
      </div>
      
      <Footer />
    </div>
  );
};

export default CartPage; 