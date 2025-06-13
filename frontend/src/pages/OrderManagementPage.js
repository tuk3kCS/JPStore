import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminHeader from '../components/admin/AdminHeader';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import Loading from '../components/common/Loading';

const OrderManagementPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeMenuItem, setActiveMenuItem] = useState('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderStatus, setOrderStatus] = useState('');

  // Backend data states
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState(null);

  // Debounced search term state
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term to avoid too many API calls while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load orders from backend when component mounts
  useEffect(() => {
    loadOrders();
  }, [currentPage, debouncedSearchTerm]);

  // Reset page when debounced search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        limit: ordersPerPage
      };
      
      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      const response = await orderService.getAllOrders(params);
      setOrders(response.orders || []);
      setTotalPages(response.totalPages || 0);
      setTotalOrders(response.totalOrders || 0);
    } catch (error) {
      console.error('Error loading orders:', error);
      setError(error.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format price
  const formatPrice = (total) => {
    return `${parseInt(total).toLocaleString('vi-VN')}đ`;
  };

  // Helper function to get order status styling
  const getOrderStatusStyle = (status) => {
    const statusStyles = {
      'confirmed': 'bg-green-100 text-green-800',
      'processing': 'bg-yellow-100 text-yellow-800',
      'delivering': 'bg-blue-100 text-blue-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'pending': 'bg-gray-100 text-gray-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-800';
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to get customer avatar fallback
  const getCustomerAvatar = (user) => {
    if (user?.avatar) {
      // If avatar starts with '/', it's a server path, prepend server URL
      return user.avatar.startsWith('/') ? `http://localhost:5000${user.avatar}` : user.avatar;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || user?.name || 'Unknown')}&background=random`;
  };

  // Calculate pagination info
  const startItem = ((currentPage - 1) * ordersPerPage) + 1;
  const endItem = Math.min(currentPage * ordersPerPage, totalOrders);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // Note: currentPage reset will happen in useEffect when debouncedSearchTerm changes
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setOrderStatus(order.status);
    setIsModalOpen(true);
  };

  const handleStatusChange = (e) => {
    setOrderStatus(e.target.value);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Update order status in backend
      await orderService.updateOrderStatus(selectedOrder._id, orderStatus);
      
      // Reload orders to get updated data
      await loadOrders();
      
    setIsModalOpen(false);
    setSelectedOrder(null);
    setOrderStatus('');
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setSaving(false);
    }
  };

  // Delete order functionality
  const handleDeleteOrder = async (orderId) => {
    try {
      // Note: You might want to implement a soft delete or archive instead of hard delete
      // For now, this would call a delete endpoint if it exists
      console.log('Delete order:', orderId);
      // await orderService.deleteOrder(orderId);
      
      setDeleteConfirmOrder(null);
      // await loadOrders();
      
      // Show a message that this feature is not implemented yet
      setError('Order deletion is not implemented yet. Orders should typically be archived rather than deleted.');
    } catch (error) {
      console.error('Error deleting order:', error);
      setError(error.response?.data?.message || 'Failed to delete order');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
    setOrderStatus('');
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Show loading state
  if (loading && orders.length === 0) {
    return <Loading message="Loading orders..." />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        {/* Logo */}
        <div className="px-6 py-6 border-b">
          <div className="flex items-center h-8">
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
                Tổng quan
              </Link>
            </li>
            <li>
              <Link
                to="/admin/users"
                className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-gray-600 hover:bg-gray-50"
              >
                <i className="bi bi-people mr-3"></i>
                Quản lý người dùng
              </Link>
            </li>
            <li>
              <Link
                to="/admin/products"
                className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-gray-600 hover:bg-gray-50"
              >
                <i className="bi bi-box mr-3"></i>
                Quản lý sản phẩm
              </Link>
            </li>
            <li>
              <button
                onClick={() => setActiveMenuItem('orders')}
                className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors bg-blue-50 text-blue-600 border-r-2 border-blue-600"
              >
                <i className="bi bi-clipboard-data mr-3"></i>
                Quản lý đơn hàng
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
              Đăng xuất
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <AdminHeader title="Quản lý đơn hàng" />

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
          {/* Search */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative">
                <i className="bi bi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Tìm kiếm đơn hàng theo mã, khách hàng hoặc trạng thái..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đơn hàng</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tên người dùng</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày đặt hàng</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng cộng</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái đơn hàng</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order, index) => (
                  <tr key={order._id || index} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleOrderClick(order)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">{order.orderCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      <div className="flex items-center justify-center space-x-3">
                        <img
                          src={getCustomerAvatar(order.user)}
                          alt={order.user?.username || order.user?.name || order.customerInfo?.fullName}
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(order.user?.username || order.user?.name || order.customerInfo?.fullName || 'Unknown')}&background=random`;
                          }}
                        />
                        <span>{order.user?.username || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      <span>{order.user?.name || order.customerInfo?.fullName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="flex items-center -space-x-2">
                        {order.items.slice(0, 3).map((item, index) => (
                          <img
                            key={index}
                            src={item.product?.images?.[0] ? `http://localhost:5000${item.product.images[0]}` : 'https://via.placeholder.com/32x32?text=Product'}
                            alt={item.name}
                            className="w-8 h-8 rounded-full border-2 border-white object-cover"
                            style={{ zIndex: 3 - index }}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/32x32?text=Product';
                            }}
                          />
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">+{order.items.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{formatPrice(order.total)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderStatusStyle(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{order.items.length}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Edit Order Button */}
                        <button 
                          className="px-2 py-1 rounded border text-xs text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOrderClick(order);
                          }}
                          title="Chỉnh sửa đơn hàng"
                        >
                          <i className="bi bi-pencil text-xs mr-1"></i>
                          <span className="text-xs">Sửa</span>
                        </button>
                        
                        {/* Remove Button */}
                        <button 
                          className="px-2 py-1 rounded border text-xs text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmOrder(order);
                          }}
                          title="Xóa đơn hàng"
                        >
                          <i className="bi bi-trash text-xs mr-1"></i>
                          <span className="text-xs">Xóa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Show message if no orders found */}
            {orders.length === 0 && !loading && (
              <div className="p-8 text-center">
                <i className="bi bi-clipboard-data text-4xl text-gray-400 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy đơn hàng</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Thử điều chỉnh tiêu chí tìm kiếm của bạn.' : 'Chưa có đơn hàng nào được đặt.'}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-gray-600 text-sm">
              {loading ? (
                'Đang tải đơn hàng...'
              ) : totalOrders > 0 ? (
                `Hiển thị ${startItem} đến ${endItem} trong tổng số ${totalOrders} đơn hàng`
              ) : (
                'Không tìm thấy đơn hàng nào'
              )}
            </p>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              
              {[...Array(Math.min(5, Math.max(1, totalPages)))].map((_, index) => {
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
              
              {totalPages > 5 && (
                <>
                  <span className="text-gray-400">...</span>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                      currentPage === totalPages
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    {totalPages}
                </button>
                </>
              )}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Chi tiết đơn hàng - {selectedOrder.orderCode}
              </h2>
              <button
                onClick={handleModalClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Tên khách hàng
                  </label>
                  <input
                    type="text"
                    value={selectedOrder.user?.name || selectedOrder.customerInfo?.fullName}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={selectedOrder.customerInfo?.phone || 'N/A'}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={selectedOrder.customerInfo?.address || 'N/A'}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              {/* Ordered Products */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 text-left">
                  Sản phẩm đã đặt
                </label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-center space-x-3 flex-1">
                          <img
                            src={item.product?.images?.[0] ? `http://localhost:5000${item.product.images[0]}` : 'https://via.placeholder.com/48x48?text=Product'}
                            alt={item.name}
                            className="w-12 h-12 rounded object-cover flex-shrink-0"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/48x48?text=Product';
                            }}
                          />
                          <div className="flex-1 text-left">
                            <span className="text-sm font-medium text-gray-900 block">{item.name}</span>
                            <span className="text-sm text-gray-600">Số lượng: {item.quantity}</span>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 ml-4">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-300 flex justify-between items-center">
                    <span className="text-base font-semibold text-gray-900">Tổng cộng:</span>
                    <span className="text-base font-semibold text-gray-900">{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Order Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                  Trạng thái đơn hàng
                </label>
                <select
                  value={orderStatus}
                  onChange={handleStatusChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="processing">Đang xử lý</option>
                  <option value="delivering">Đang giao hàng</option>
                  <option value="delivered">Đã giao</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={handleModalClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={saving}
                >
                  {saving ? (
                    <div className="flex items-center">
                      <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                      Đang lưu...
                    </div>
                  ) : (
                    'Lưu thay đổi'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Order Confirmation Modal */}
      {deleteConfirmOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Xác nhận xóa
              </h2>
              <button
                onClick={() => setDeleteConfirmOrder(null)}
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
                  <h3 className="text-lg font-medium text-gray-900">Xóa đơn hàng</h3>
                  <p className="text-sm text-gray-500">Hành động này không thể hoàn tác</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4 text-left">
                Bạn có chắc chắn muốn xóa đơn hàng <strong>{deleteConfirmOrder.orderCode}</strong>? 
                Điều này sẽ xóa vĩnh viễn đơn hàng và tất cả dữ liệu liên quan.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <i className="bi bi-info-circle text-red-500 mr-2 flex-shrink-0"></i>
                  <span className="text-sm text-red-700 text-left">Hành động này không thể hoàn tác</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmOrder(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleDeleteOrder(deleteConfirmOrder._id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Xóa đơn hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagementPage; 