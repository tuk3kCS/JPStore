import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminHeader from '../components/admin/AdminHeader';
import { useAuth } from '../context/AuthContext';

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

  // Sample order data
  const allOrders = [
    {
      id: 'ORD-001',
      customer: 'John Doe',
      customerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
      orderDate: '2023-12-15',
      total: '$249.95',
      orderStatus: 'Delivered',
      orderStatusColor: 'bg-green-100 text-green-800',
      items: 3,
      address: '123 Main St, New York, NY 10001',
      phoneNumber: '+1 (555) 123-4567',
      orderedProducts: [
        { name: 'Naruto Uzumaki Figure', quantity: 1, price: '$89.99', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=60&h=60&fit=crop' },
        { name: 'Dragon Ball Z Goku Figure', quantity: 1, price: '$79.99', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=60&h=60&fit=crop' },
        { name: 'One Piece Luffy Figure', quantity: 1, price: '$79.97', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=60&h=60&fit=crop' }
      ]
    },
    {
      id: 'ORD-002',
      customer: 'Jane Smith',
      customerAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b890?w=50&h=50&fit=crop&crop=face',
      orderDate: '2023-12-10',
      total: '$189.97',
      orderStatus: 'Shipped',
      orderStatusColor: 'bg-blue-100 text-blue-800',
      items: 2,
      address: '456 Oak Ave, Los Angeles, CA 90210',
      phoneNumber: '+1 (555) 234-5678',
      orderedProducts: [
        { name: 'Attack on Titan Eren Figure', quantity: 1, price: '$94.99', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=60&h=60&fit=crop' },
        { name: 'My Hero Academia Deku Figure', quantity: 1, price: '$94.98', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=60&h=60&fit=crop' }
      ]
    },
    {
      id: 'ORD-003',
      customer: 'Robert Johnson',
      customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
      orderDate: '2023-12-05',
      total: '$419.93',
      orderStatus: 'Delivered',
      orderStatusColor: 'bg-green-100 text-green-800',
      items: 5,
      address: '789 Pine St, Chicago, IL 60601',
      phoneNumber: '+1 (555) 345-6789',
      orderedProducts: [
        { name: 'Death Note L Figure', quantity: 1, price: '$84.99', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=60&h=60&fit=crop' },
        { name: 'Tokyo Ghoul Kaneki Figure', quantity: 1, price: '$84.99', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=60&h=60&fit=crop' },
        { name: 'Demon Slayer Tanjiro Figure', quantity: 1, price: '$79.99', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=60&h=60&fit=crop' },
        { name: 'JoJo Bizarre Adventure Jotaro Figure', quantity: 1, price: '$89.98', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=60&h=60&fit=crop' },
        { name: 'Sailor Moon Figure', quantity: 1, price: '$79.98', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=60&h=60&fit=crop' }
      ]
    },
    {
      id: 'ORD-004',
      customer: 'Emily Davis',
      customerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
      orderDate: '2023-11-28',
      total: '$129.98',
      orderStatus: 'Delivered',
      orderStatusColor: 'bg-green-100 text-green-800',
      items: 1,
      address: '321 Elm St, Miami, FL 33101',
      phoneNumber: '+1 (555) 456-7890',
      orderedProducts: [
        { name: 'Pokemon Pikachu Figure', quantity: 1, price: '$129.98', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=60&h=60&fit=crop' }
      ]
    },
    {
      id: 'ORD-005',
      customer: 'Michael Wilson',
      customerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face',
      orderDate: '2023-11-25',
      total: '$539.91',
      orderStatus: 'Delivered',
      orderStatusColor: 'bg-green-100 text-green-800',
      items: 4,
      address: '654 Maple Dr, Seattle, WA 98101',
      phoneNumber: '+1 (555) 567-8901',
      orderedProducts: [
        { name: 'Final Fantasy Cloud Figure', quantity: 1, price: '$149.99', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=60&h=60&fit=crop' },
        { name: 'Bleach Ichigo Figure', quantity: 1, price: '$134.99', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=60&h=60&fit=crop' },
        { name: 'Fullmetal Alchemist Edward Figure', quantity: 1, price: '$124.99', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=60&h=60&fit=crop' },
        { name: 'Hunter x Hunter Gon Figure', quantity: 1, price: '$129.94', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=60&h=60&fit=crop' }
      ]
    },
    {
      id: 'ORD-006',
      customer: 'Sarah Thompson',
      customerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop&crop=face',
      orderDate: '2023-12-18',
      total: '$59.99',
      orderStatus: 'Processing',
      orderStatusColor: 'bg-yellow-100 text-yellow-800',
      items: 1,
      address: '987 Cedar Ln, Austin, TX 73301',
      phoneNumber: '+1 (555) 678-9012',
      orderedProducts: [
        { name: 'Spirited Away No-Face Figure', quantity: 1, price: '$59.99', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=60&h=60&fit=crop' }
      ]
    },
    {
      id: 'ORD-007',
      customer: 'David Martinez',
      customerAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=50&h=50&fit=crop&crop=face',
      orderDate: '2023-12-17',
      total: '$219.96',
      orderStatus: 'Cancelled',
      orderStatusColor: 'bg-red-100 text-red-800',
      items: 2,
      address: '147 Birch St, Boston, MA 02101',
      phoneNumber: '+1 (555) 789-0123',
      orderedProducts: [
        { name: 'Cowboy Bebop Spike Figure', quantity: 1, price: '$109.99', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=60&h=60&fit=crop' },
        { name: 'Evangelion Rei Figure', quantity: 1, price: '$109.97', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=60&h=60&fit=crop' }
      ]
    },
    {
      id: 'ORD-008',
      customer: 'Jennifer Garcia',
      customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop&crop=face',
      orderDate: '2023-12-12',
      total: '$329.94',
      orderStatus: 'Shipped',
      orderStatusColor: 'bg-blue-100 text-blue-800',
      items: 3,
      address: '258 Willow Ave, Denver, CO 80201',
      phoneNumber: '+1 (555) 890-1234',
      orderedProducts: [
        { name: 'One Piece Zoro Figure', quantity: 1, price: '$109.99', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=60&h=60&fit=crop' },
        { name: 'Naruto Sasuke Figure', quantity: 1, price: '$109.99', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=60&h=60&fit=crop' },
        { name: 'Dragon Ball Vegeta Figure', quantity: 1, price: '$109.96', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=60&h=60&fit=crop' }
      ]
    },
    {
      id: 'ORD-009',
      customer: 'Thomas Anderson',
      customerAvatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=50&h=50&fit=crop&crop=face',
      orderDate: '2023-12-08',
      total: '$149.99',
      orderStatus: 'Processing',
      orderStatusColor: 'bg-yellow-100 text-yellow-800',
      items: 1,
      address: '369 Poplar St, Portland, OR 97201',
      phoneNumber: '+1 (555) 901-2345',
      orderedProducts: [
        { name: 'Studio Ghibli Totoro Figure', quantity: 1, price: '$149.99', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=60&h=60&fit=crop' }
      ]
    },
    {
      id: 'ORD-010',
      customer: 'Lisa Rodriguez',
      customerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=50&h=50&fit=crop&crop=face',
      orderDate: '2023-12-01',
      total: '$729.88',
      orderStatus: 'Delivered',
      orderStatusColor: 'bg-green-100 text-green-800',
      items: 6,
      address: '741 Spruce Rd, Phoenix, AZ 85001',
      phoneNumber: '+1 (555) 012-3456',
      orderedProducts: [
        { name: 'Akira Kaneda Figure', quantity: 1, price: '$124.99', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=60&h=60&fit=crop' },
        { name: 'Ghost in Shell Major Figure', quantity: 1, price: '$119.99', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=60&h=60&fit=crop' },
        { name: 'Berserk Guts Figure', quantity: 1, price: '$134.99', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=60&h=60&fit=crop' },
        { name: 'Code Geass Lelouch Figure', quantity: 1, price: '$114.99', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=60&h=60&fit=crop' },
        { name: 'Mob Psycho 100 Mob Figure', quantity: 1, price: '$109.99', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=60&h=60&fit=crop' },
        { name: 'Fire Force Shinra Figure', quantity: 1, price: '$124.93', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=60&h=60&fit=crop' }
      ]
    }
  ];

  // Filter orders based on search term
  const filteredOrders = allOrders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderStatus.toLowerCase().includes(searchTerm.toLowerCase())
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
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setOrderStatus(order.orderStatus);
    setIsModalOpen(true);
  };

  const handleStatusChange = (e) => {
    setOrderStatus(e.target.value);
  };

  const handleSave = () => {
    // Here you would typically update the order status in your backend
    console.log('Saving order status:', orderStatus, 'for order:', selectedOrder.id);
    setIsModalOpen(false);
    setSelectedOrder(null);
    setOrderStatus('');
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
              <Link
                to="/admin/products"
                className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-gray-600 hover:bg-gray-50"
              >
                <i className="bi bi-box mr-3"></i>
                Product Management
              </Link>
            </li>
            <li>
              <button
                onClick={() => setActiveMenuItem('orders')}
                className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors bg-blue-50 text-blue-600 border-r-2 border-blue-600"
              >
                <i className="bi bi-clipboard-data mr-3"></i>
                Order Management
              </button>
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
        <AdminHeader title="Order Management" />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Search */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative">
                <i className="bi bi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search orders by ID, customer, or status..."
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Order Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentOrders.map((order, index) => (
                  <tr key={index} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleOrderClick(order)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">{order.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">
                      <div className="flex items-center space-x-3">
                        <img
                          src={order.customerAvatar}
                          alt={order.customer}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span>{order.customer}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{order.orderDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="flex items-center -space-x-2">
                        {order.orderedProducts.slice(0, 3).map((product, index) => (
                          <img
                            key={index}
                            src={product.image}
                            alt={product.name}
                            className="w-8 h-8 rounded-full border-2 border-white object-cover"
                            style={{ zIndex: 3 - index }}
                          />
                        ))}
                        {order.orderedProducts.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">+{order.orderedProducts.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{order.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${order.orderStatusColor}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{order.items}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-700">
                          <i className="bi bi-eye"></i>
                        </button>
                        <button className="text-blue-600 hover:text-blue-700">
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="text-gray-600 hover:text-gray-700">
                          <i className="bi bi-three-dots"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-gray-600 text-sm">
              Showing {startItem} to {endItem} of 86 results
            </p>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              
              {[1, 2, 3, 4, 5, 9].map((page, index) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  {index === 4 ? '...' : page}
                </button>
              ))}
              
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
                Order Details - {selectedOrder.id}
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
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={selectedOrder.customer}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={selectedOrder.phoneNumber}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                  Address
                </label>
                <input
                  type="text"
                  value={selectedOrder.address}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              {/* Ordered Products */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 text-left">
                  Ordered Products
                </label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    {selectedOrder.orderedProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-center space-x-3 flex-1">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 rounded object-cover flex-shrink-0"
                          />
                          <div className="flex-1 text-left">
                            <span className="text-sm font-medium text-gray-900 block">{product.name}</span>
                            <span className="text-sm text-gray-600">Quantity: {product.quantity}</span>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 ml-4">{product.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-300 flex justify-between items-center">
                    <span className="text-base font-semibold text-gray-900">Total:</span>
                    <span className="text-base font-semibold text-gray-900">{selectedOrder.total}</span>
                  </div>
                </div>
              </div>

              {/* Order Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                  Order Status
                </label>
                <select
                  value={orderStatus}
                  onChange={handleStatusChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={handleModalClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagementPage; 