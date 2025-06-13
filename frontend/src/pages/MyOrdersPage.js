import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Breadcrumb from '../components/common/Breadcrumb';
import Loading from '../components/common/Loading';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';

const MyOrdersPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const ordersPerPage = 10;
  
  const highlightOrderCode = searchParams.get('highlight');

  const breadcrumbItems = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Đơn hàng của tôi', path: '' }
  ];

  // Load orders on component mount
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError('');
        const ordersData = await orderService.getOrders();
        setOrders(ordersData);
        
        // Auto-expand highlighted order if it exists
        if (highlightOrderCode) {
          const highlightedOrder = ordersData.find(order => 
            order.orderCode?.toString() === highlightOrderCode
          );
          if (highlightedOrder) {
            setExpandedOrders(new Set([highlightedOrder._id]));
            // Clear the highlight parameter from URL after expanding
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
          }
        }
      } catch (error) {
        console.error('Error loading orders:', error);
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [user, highlightOrderCode]);

  // Helper function to get status styling
  const getStatusStyle = (status) => {
    const statusStyles = {
      'confirmed': 'bg-green-100 text-green-800',
      'processing': 'bg-yellow-100 text-yellow-800',
      'delivering': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-blue-100 text-blue-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'pending': 'bg-gray-100 text-gray-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return statusStyles[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to format order items for display
  const formatOrderItems = (items) => {
    const displayItems = items.slice(0, 3).map(item => ({
      image: item.images && item.images[0] 
        ? `http://localhost:5000${item.images[0]}`
        : 'https://via.placeholder.com/50x50?text=No+Image'
    }));
    
    return {
      displayItems,
      totalCount: items.length
    };
  };

  // Filter orders based on search term
  const filteredOrders = orders.filter(order =>
    order.orderCode?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalOrders = filteredOrders.length;
  const totalPages = Math.ceil(totalOrders / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const currentOrders = filteredOrders.slice(startIndex, startIndex + ordersPerPage);
  const startItem = startIndex + 1;
  const endItem = Math.min(startIndex + ordersPerPage, totalOrders);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle order row expansion
  const toggleOrderExpansion = (orderId) => {
    const newExpandedOrders = new Set(expandedOrders);
    if (newExpandedOrders.has(orderId)) {
      newExpandedOrders.delete(orderId);
    } else {
      newExpandedOrders.add(orderId);
    }
    setExpandedOrders(newExpandedOrders);
  };

  if (loading) {
    return <Loading message="Loading your orders..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />
        
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-left">Đơn hàng của tôi</h1>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <i className="bi bi-exclamation-triangle-fill text-red-600 mr-2"></i>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <i className="bi bi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Tìm kiếm đơn hàng..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          {/* Table Header */}
          <div className="grid grid-cols-10 gap-4 p-4 bg-gray-50 border-b font-medium text-gray-700">
            <div className="col-span-2">Mã đơn hàng</div>
            <div className="col-span-2">Ngày</div>
            <div className="col-span-3">Sản phẩm</div>
            <div className="col-span-2">Tổng tiền</div>
            <div className="col-span-1">Trạng thái</div>
          </div>
          
          {/* Table Body */}
          <div>
            {currentOrders.length === 0 ? (
              <div className="p-8 text-center">
                <i className="bi bi-box-seam text-gray-400 text-4xl mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy đơn hàng</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? 'Không tìm thấy đơn hàng phù hợp.' : 'Bạn chưa đặt đơn hàng nào.'}
                </p>
                {!searchTerm && (
                  <a 
                    href="/" 
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <i className="bi bi-plus-circle mr-2"></i>
                    Bắt đầu mua sắm
                  </a>
                )}
              </div>
            ) : (
              currentOrders.map((order) => {
                const { displayItems, totalCount } = formatOrderItems(order.items);
                const isExpanded = expandedOrders.has(order._id);
                const isHighlighted = order.orderCode?.toString() === highlightOrderCode;
                return (
                  <div key={order._id} className={`border-b border-gray-200 last:border-b-0 ${isHighlighted ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
                    {/* Order Row - Clickable */}
                    <div 
                      className="grid grid-cols-10 gap-4 p-4 items-center hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleOrderExpansion(order._id)}
                    >
                      {/* Order # */}
                      <div className="col-span-2 flex items-center">
                        <i className={`bi ${isExpanded ? 'bi-chevron-down' : 'bi-chevron-right'} text-gray-400 mr-2 text-sm`}></i>
                        <span className="font-medium text-gray-900">#{order.orderCode}</span>
                      </div>
                      
                      {/* Date */}
                      <div className="col-span-2">
                        <span className="text-gray-600">{formatDate(order.createdAt)}</span>
                      </div>
                      
                      {/* Items */}
                      <div className="col-span-3">
                        <div className="flex items-center space-x-2">
                          <div className="flex -space-x-1">
                            {displayItems.map((item, index) => (
                              <img
                                key={index}
                                src={item.image}
                                alt="Product"
                                className="w-8 h-8 rounded-full border-2 border-white object-cover"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/50x50?text=No+Image';
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">{totalCount} {totalCount === 1 ? 'item' : 'items'}</span>
                        </div>
                      </div>
                      
                      {/* Total */}
                      <div className="col-span-2">
                        <span className="font-semibold text-blue-600">{order.total?.toLocaleString() || '0'}đ</span>
                      </div>
                      
                      {/* Status */}
                      <div className="col-span-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(order.status)}`}>
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Order Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-gray-50 text-left">
                        <div className="grid md:grid-cols-2 gap-6 pt-4">
                          {/* Customer Information */}
                          <div className="bg-white p-4 rounded-lg text-left">
                            <h4 className="font-semibold text-gray-900 mb-3 text-left">Thông tin khách hàng</h4>
                            <div className="space-y-2 text-sm text-left">
                              <div className="text-left"><span className="font-medium">Tên:</span> {order.customerInfo?.fullName || 'N/A'}</div>
                              <div className="text-left"><span className="font-medium">Email:</span> {order.customerInfo?.email || 'N/A'}</div>
                              <div className="text-left"><span className="font-medium">Số điện thoại:</span> {order.customerInfo?.phone || 'N/A'}</div>
                              <div className="text-left"><span className="font-medium">Địa chỉ:</span> {order.customerInfo?.address || 'N/A'}</div>
                            </div>
                          </div>

                          {/* Order Information */}
                          <div className="bg-white p-4 rounded-lg text-left">
                            <h4 className="font-semibold text-gray-900 mb-3 text-left">Thông tin đơn hàng</h4>
                            <div className="space-y-2 text-sm text-left">
                              <div className="text-left"><span className="font-medium">Ngày đặt hàng:</span> {formatDate(order.createdAt)}</div>
                              <div className="text-left"><span className="font-medium">Phương thức thanh toán:</span> {order.paymentMethod?.toUpperCase() || 'N/A'}</div>
                              {order.paidAt && (
                                <div className="text-left"><span className="font-medium">Ngày thanh toán:</span> {formatDate(order.paidAt)}</div>
                              )}
                              <div className="text-left"><span className="font-medium">Tổng tiền:</span> <span className="text-blue-600 font-semibold">{order.total?.toLocaleString() || '0'}đ</span></div>
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-white p-4 rounded-lg mt-4 text-left">
                          <h4 className="font-semibold text-gray-900 mb-3 text-left">Sản phẩm</h4>
                          <div className="space-y-3 text-left">
                            {order.items?.map((item, index) => (
                              <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg text-left">
                                <img
                                  src={item.images && item.images[0] 
                                    ? `http://localhost:5000${item.images[0]}`
                                    : 'https://via.placeholder.com/60x60?text=No+Image'
                                  }
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/60x60?text=No+Image';
                                  }}
                                />
                                <div className="flex-1 text-left">
                                  <h5 className="font-medium text-gray-900 text-left">{item.name}</h5>
                                  <p className="text-sm text-gray-500 text-left">Số lượng: {item.quantity}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-gray-900 text-right">{(item.price * item.quantity)?.toLocaleString() || '0'}đ</p>
                                  <p className="text-sm text-gray-500 text-right">{item.price?.toLocaleString() || '0'}đ/sản phẩm</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mb-12">
          <p className="text-gray-600 text-sm">
            Hiển thị {startItem} đến {endItem} trên {totalOrders} đơn hàng
          </p>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            
            {[...Array(totalPages)].map((_, index) => {
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
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>


      </div>
      
      <Footer />
    </div>
  );
};

export default MyOrdersPage; 