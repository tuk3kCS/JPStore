import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Breadcrumb from '../components/common/Breadcrumb';

const MyOrdersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  const allOrders = [
    {
      id: 'ORD-2024-8756',
      date: 'May 15, 2024',
      items: [
        { image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop' },
        { image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=50&h=50&fit=crop' }
      ],
      itemCount: 2,
      total: 119.98,
      status: 'Processing',
      statusColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'ORD-2024-8742',
      date: 'May 10, 2024',
      items: [
        { image: 'https://images.unsplash.com/photo-1566694271453-390536dd1f0d?w=50&h=50&fit=crop' }
      ],
      itemCount: 1,
      total: 59.99,
      status: 'Shipped',
      statusColor: 'bg-orange-100 text-orange-800'
    },
    {
      id: 'ORD-2024-8721',
      date: 'May 5, 2024',
      items: [
        { image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=50&h=50&fit=crop' },
        { image: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=50&h=50&fit=crop' },
        { image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop' }
      ],
      itemCount: 3,
      total: 259.97,
      status: 'Delivered',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      id: 'ORD-2024-8698',
      date: 'April 28, 2024',
      items: [
        { image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=50&h=50&fit=crop' }
      ],
      itemCount: 1,
      total: 99.99,
      status: 'Delivered',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      id: 'ORD-2024-8675',
      date: 'April 20, 2024',
      items: [
        { image: 'https://images.unsplash.com/photo-1566694271453-390536dd1f0d?w=50&h=50&fit=crop' },
        { image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=50&h=50&fit=crop' }
      ],
      itemCount: 2,
      total: 229.98,
      status: 'Delivered',
      statusColor: 'bg-green-100 text-green-800'
    },
    // Additional orders for pagination
    {
      id: 'ORD-2024-8654',
      date: 'April 15, 2024',
      items: [
        { image: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=50&h=50&fit=crop' }
      ],
      itemCount: 1,
      total: 79.99,
      status: 'Delivered',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      id: 'ORD-2024-8632',
      date: 'April 10, 2024',
      items: [
        { image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop' },
        { image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=50&h=50&fit=crop' },
        { image: 'https://images.unsplash.com/photo-1566694271453-390536dd1f0d?w=50&h=50&fit=crop' }
      ],
      itemCount: 3,
      total: 189.97,
      status: 'Delivered',
      statusColor: 'bg-green-100 text-green-800'
    }
  ];

  const breadcrumbItems = [
    { label: 'My Account', path: '/account' },
    { label: 'My Orders', path: '' }
  ];

  // Filter orders based on search term
  const filteredOrders = allOrders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getActionIcons = (status) => {
    const baseIcons = (
      <>
        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
          <i className="bi bi-eye text-lg"></i>
        </button>
      </>
    );

    if (status === 'Delivered') {
      return (
        <>
          {baseIcons}
          <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
            <i className="bi bi-cart-plus text-lg"></i>
          </button>
        </>
      );
    }

    return baseIcons;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />
        
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-left">My Orders</h1>
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <i className="bi bi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-gray-700">
            <div className="col-span-2">Order #</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Items</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Actions</div>
          </div>
          
          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {currentOrders.map((order) => (
              <div key={order.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                {/* Order # */}
                <div className="col-span-2">
                  <span className="font-medium text-gray-900">{order.id}</span>
                </div>
                
                {/* Date */}
                <div className="col-span-2">
                  <span className="text-gray-600">{order.date}</span>
                </div>
                
                {/* Items */}
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-1">
                      {order.items.slice(0, 3).map((item, index) => (
                        <img
                          key={index}
                          src={item.image}
                          alt="Product"
                          className="w-8 h-8 rounded-full border-2 border-white object-cover"
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">{order.itemCount} items</span>
                  </div>
                </div>
                
                {/* Total */}
                <div className="col-span-2">
                  <span className="font-semibold text-blue-600">${order.total}</span>
                </div>
                
                {/* Status */}
                <div className="col-span-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.statusColor}`}>
                    {order.status}
                  </span>
                </div>
                
                {/* Actions */}
                <div className="col-span-2">
                  <div className="flex items-center space-x-1">
                    {getActionIcons(order.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mb-12">
          <p className="text-gray-600 text-sm">
            Showing {startItem} to {endItem} of {totalOrders} orders
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