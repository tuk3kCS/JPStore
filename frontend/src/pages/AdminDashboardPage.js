import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminHeader from '../components/admin/AdminHeader';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';
import Loading from '../components/common/Loading';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeMenuItem, setActiveMenuItem] = useState('overview');
  
  // Backend data states
  const [stats, setStats] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real data states for charts
  const [salesData, setSalesData] = useState([]);
  const [productData, setProductData] = useState([]);

  // Colors for charts
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  // Custom tooltip for revenue formatting
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-gray-600">{`Month: ${label}`}</p>
          <p className="text-blue-600 font-medium">
            {`Revenue: ${parseInt(payload[0].value).toLocaleString('vi-VN')}đ`}
          </p>
          <p className="text-green-600">
            {`Orders: ${payload[1] ? payload[1].value : 'N/A'}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Load dashboard data when component mounts
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all dashboard data in parallel
      const [statsData, ordersData, productsData, usersData, salesAnalytics, categoryData] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getRecentOrders(5),
        dashboardService.getTopProducts(3),
        dashboardService.getRecentUsers(3),
        dashboardService.getSalesAnalytics(),
        dashboardService.getProductCategories()
      ]);
      
      setStats(statsData);
      setRecentOrders(ordersData);
      setTopProducts(productsData);
      setRecentUsers(usersData);
      setSalesData(salesAnalytics);
      setProductData(categoryData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Refresh charts data
  const refreshCharts = async () => {
    try {
      setError(null);
      const [salesAnalytics, categoryData] = await Promise.all([
        dashboardService.getSalesAnalytics(),
        dashboardService.getProductCategories()
      ]);
      setSalesData(salesAnalytics);
      setProductData(categoryData);
    } catch (error) {
      console.error('Error refreshing chart data:', error);
      setError('Failed to refresh chart data');
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

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Show loading state
  if (loading) {
    return <Loading message="Đang tải bảng điều khiển..." />;
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
              <button
                onClick={() => setActiveMenuItem('overview')}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                  activeMenuItem === 'overview' 
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <i className="bi bi-grid mr-3"></i>
                Tổng quan
              </button>
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
              <Link
                to="/admin/orders"
                className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-gray-600 hover:bg-gray-50"
              >
                <i className="bi bi-clipboard-data mr-3"></i>
                Quản lý đơn hàng
              </Link>
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
        <AdminHeader title="Tổng quan" />

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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <i className={`${stat.icon} text-xl ${stat.color}`}></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1 text-left">{stat.title}</p>
                    <div className="flex items-center space-x-3">
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      {stat.change && (
                      <p className={`text-sm ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Sales Overview */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Tổng quan doanh số</h3>
                <div className="flex items-center space-x-2">
                <select className="text-sm border rounded px-3 py-1">
                    <option>12 tháng qua</option>
                </select>
                  <button 
                    onClick={refreshCharts}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                    title="Refresh Chart Data"
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                    <span>Làm mới</span>
                  </button>
                </div>
              </div>
              <div className="h-64">
                {salesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <YAxis 
                        yAxisId="left"
                        stroke="#6b7280"
                        fontSize={12}
                        tickFormatter={(value) => `${(value / 1000)}K`}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="orders" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <i className="bi bi-chart-line text-4xl text-gray-400 mb-2"></i>
                      <p className="text-gray-500">Không có dữ liệu doanh số</p>
                      <button 
                        onClick={refreshCharts}
                        className="text-blue-600 hover:text-blue-700 text-sm mt-2"
                      >
                        Thử làm mới
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top Selling Products */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Danh mục sản phẩm</h3>
                <Link to="/admin/products" className="text-blue-600 hover:text-blue-700 text-sm">Xem tất cả</Link>
              </div>
              <div className="h-64">
                {productData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {productData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value}%`, name]}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <i className="bi bi-pie-chart text-4xl text-gray-400 mb-2"></i>
                      <p className="text-gray-500">Không có dữ liệu danh mục</p>
                      <button 
                        onClick={refreshCharts}
                        className="text-blue-600 hover:text-blue-700 text-sm mt-2"
                      >
                        Thử làm mới
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Chart Row */}
          <div className="grid grid-cols-1 mb-8">
            {/* Monthly Order Trends */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Xu hướng đơn hàng hàng tháng</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-sm text-gray-600">Doanh thu</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-sm text-gray-600">Đơn hàng</span>
                  </div>
                </div>
              </div>
              <div className="h-64">
                {salesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <YAxis 
                        yAxisId="left"
                        stroke="#6b7280"
                        fontSize={12}
                        tickFormatter={(value) => `${(value / 1000)}K`}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'revenue' ? `${parseInt(value).toLocaleString('vi-VN')}đ` : value,
                          name === 'revenue' ? 'Doanh thu' : 'Đơn hàng'
                        ]}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Bar 
                        yAxisId="left"
                        dataKey="revenue" 
                        fill="#3b82f6" 
                        name="Doanh thu"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        yAxisId="right"
                        dataKey="orders" 
                        fill="#10b981" 
                        name="Đơn hàng"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <i className="bi bi-bar-chart text-4xl text-gray-400 mb-2"></i>
                      <p className="text-gray-500">Không có dữ liệu xu hướng đơn hàng</p>
                      <button 
                        onClick={refreshCharts}
                        className="text-blue-600 hover:text-blue-700 text-sm mt-2"
                      >
                        Thử làm mới
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm border mb-8">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Đơn hàng gần đây</h3>
                <Link to="/admin/orders" className="text-blue-600 hover:text-blue-700 text-sm">Xem tất cả đơn hàng</Link>
              </div>
            </div>
            <div className="overflow-x-auto">
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
                  {recentOrders.map((order, index) => (
                    <tr key={order._id || index} className="hover:bg-gray-50 cursor-pointer">
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
                          <Link
                            to="/admin/orders"
                            className="px-2 py-1 rounded border text-xs text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50"
                            title="Đi đến quản lý đơn hàng"
                          >
                            <i className="bi bi-pencil text-xs mr-1"></i>
                            <span className="text-xs">Sửa</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Show message if no orders found */}
              {recentOrders.length === 0 && !loading && (
                <div className="p-8 text-center">
                  <i className="bi bi-clipboard-data text-4xl text-gray-400 mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy đơn hàng gần đây</h3>
                  <p className="text-gray-500">
                    Chưa có đơn hàng nào được đặt gần đây.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Sản phẩm hàng đầu</h3>
                <Link to="/admin/products" className="text-blue-600 hover:text-blue-700 text-sm">Quản lý sản phẩm</Link>
              </div>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center ${product.image ? 'hidden' : ''}`}>
                        <i className="bi bi-box text-gray-400"></i>
                        </div>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">Đã bán: {product.sales}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{product.price}</p>
                      <button className="text-xs text-blue-600 hover:text-blue-700">Sửa</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Người dùng gần đây</h3>
                <Link to="/admin/users" className="text-blue-600 hover:text-blue-700 text-sm">Quản lý người dùng</Link>
              </div>
              <div className="space-y-4">
                {recentUsers.map((user, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                        {user.avatar ? (
                          <img
                            src={user.avatar.startsWith('/') ? `http://localhost:5000${user.avatar}` : user.avatar}
                            alt={user.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center ${user.avatar ? 'hidden' : ''}`}>
                        <span className="text-sm font-medium text-blue-600">{user.initial}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 text-left">{user.name}</p>
                        <p className="text-xs text-gray-500 text-left">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{user.orders} đơn hàng</p>
                      <p className="text-xs text-gray-500">{user.total}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardPage;