import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminHeader from '../components/admin/AdminHeader';
import { useAuth } from '../context/AuthContext';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeMenuItem, setActiveMenuItem] = useState('overview');

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Sample data
  const stats = [
    {
      title: 'Total Revenue',
      value: '$24,780',
      change: '+12%',
      icon: 'bi-currency-dollar',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Orders',
      value: '1,482',
      change: '+8%',
      icon: 'bi-cart',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Customers',
      value: '892',
      change: '+5%',
      icon: 'bi-people',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Products in Stock',
      value: '128',
      change: '-3%',
      icon: 'bi-box',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ];

  const recentOrders = [
    {
      id: '#ORD-001',
      customer: 'John Doe',
      items: [
        { image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop' }
      ],
      itemCount: 1,
      date: '2023-12-01',
      status: 'Delivered',
      amount: '$49.99',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      id: '#ORD-002',
      customer: 'Jane Smith',
      items: [
        { image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=50&h=50&fit=crop' },
        { image: 'https://images.unsplash.com/photo-1566694271453-390536dd1f0d?w=50&h=50&fit=crop' }
      ],
      itemCount: 2,
      date: '2023-12-02',
      status: 'Processing',
      amount: '$69.99',
      statusColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: '#ORD-003',
      customer: 'Robert Johnson',
      items: [
        { image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=50&h=50&fit=crop' }
      ],
      itemCount: 1,
      date: '2023-12-03',
      status: 'Shipped',
      amount: '$59.99',
      statusColor: 'bg-orange-100 text-orange-800'
    },
    {
      id: '#ORD-004',
      customer: 'Emily Davis',
      items: [
        { image: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=50&h=50&fit=crop' },
        { image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop' },
        { image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=50&h=50&fit=crop' }
      ],
      itemCount: 3,
      date: '2023-12-04',
      status: 'Pending',
      amount: '$89.99',
      statusColor: 'bg-yellow-100 text-yellow-800'
    },
    {
      id: '#ORD-005',
      customer: 'Michael Wilson',
      items: [
        { image: 'https://images.unsplash.com/photo-1566694271453-390536dd1f0d?w=50&h=50&fit=crop' },
        { image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=50&h=50&fit=crop' }
      ],
      itemCount: 2,
      date: '2023-12-05',
      status: 'Delivered',
      amount: '$79.99',
      statusColor: 'bg-green-100 text-green-800'
    }
  ];

  const topProducts = [
    {
      name: 'Premium Figure 1',
      sales: 245,
      stock: 43,
      price: '$49.99',
      image: '/images/figure1.jpg'
    },
    {
      name: 'Premium Figure 3',
      sales: 190,
      stock: 32,
      price: '$69.99',
      image: '/images/figure3.jpg'
    },
    {
      name: 'Premium Figure 2',
      sales: 175,
      stock: 28,
      price: '$59.99',
      image: '/images/figure2.jpg'
    }
  ];

  const recentUsers = [
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      orders: 5,
      total: '$249.95',
      initial: 'J'
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      orders: 3,
      total: '$189.97',
      initial: 'J'
    },
    {
      name: 'Robert Johnson',
      email: 'robert.j@example.com',
      orders: 7,
      total: '$419.93',
      initial: 'R'
    }
  ];

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
              <button
                onClick={() => setActiveMenuItem('overview')}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                  activeMenuItem === 'overview' 
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <i className="bi bi-grid mr-3"></i>
                Overview
              </button>
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
              <Link
                to="/admin/products"
                className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-gray-600 hover:bg-gray-50"
              >
                <i className="bi bi-box mr-3"></i>
                Product Management
              </Link>
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
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                  activeMenuItem === 'statistics' 
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
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
        <AdminHeader title="Dashboard Overview" />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6">
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
                      <p className={`text-sm ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </p>
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
                <h3 className="text-lg font-semibold text-gray-900">Sales Overview</h3>
                <select className="text-sm border rounded px-3 py-1">
                  <option>Last 12 months</option>
                </select>
              </div>
              <div className="h-64 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Sales Chart Placeholder</p>
              </div>
            </div>

            {/* Top Selling Products */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Top Selling Products</h3>
                <Link to="/admin/products" className="text-blue-600 hover:text-blue-700 text-sm">View All</Link>
              </div>
              <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Pie Chart Placeholder</p>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm border mb-8">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                <Link to="/admin/orders" className="text-blue-600 hover:text-blue-700 text-sm">View All Orders</Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map((order, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">{order.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">{order.customer}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <div className="flex -space-x-1">
                            {order.items.slice(0, 3).map((item, itemIndex) => (
                              <img
                                key={itemIndex}
                                src={item.image}
                                alt="Product"
                                className="w-8 h-8 rounded-full border-2 border-white object-cover"
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">{order.itemCount} items</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{order.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${order.statusColor}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{order.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-700">
                            <i className="bi bi-eye"></i>
                          </button>
                          <button className="text-red-600 hover:text-red-700">
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
                <Link to="/admin/products" className="text-blue-600 hover:text-blue-700 text-sm">Manage Products</Link>
              </div>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <i className="bi bi-box text-gray-400"></i>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">Sales: {product.sales} | Stock: {product.stock}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{product.price}</p>
                      <button className="text-xs text-blue-600 hover:text-blue-700">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
                <Link to="/admin/users" className="text-blue-600 hover:text-blue-700 text-sm">Manage Users</Link>
              </div>
              <div className="space-y-4">
                {recentUsers.map((user, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">{user.initial}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 text-left">{user.name}</p>
                        <p className="text-xs text-gray-500 text-left">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{user.orders} orders</p>
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