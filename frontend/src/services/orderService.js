import api from '../utils/api';

export const orderService = {
  // Create new order with payment
  createOrder: async (customerInfo, paymentMethod = 'payos') => {
    const response = await api.post('/orders', {
      customerInfo,
      paymentMethod
    });
    return response.data;
  },

  // Get user's orders
  getOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  // Get single order
  getOrder: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  // Get order by order code
  getOrderByCode: async (orderCode, isFromSuccessPage = false) => {
    const url = isFromSuccessPage 
      ? `/orders/code/${orderCode}?success=true`
      : `/orders/code/${orderCode}`;
    const response = await api.get(url);
    return response.data;
  },

  // Admin methods
  // Get all orders (admin only)
  getAllOrders: async (params = {}) => {
    const response = await api.get('/orders/admin/all', { params });
    return response.data;
  },

  // Update order status (admin only)
  updateOrderStatus: async (orderId, status) => {
    const response = await api.put(`/orders/${orderId}/status`, { status });
    return response.data;
  }
}; 