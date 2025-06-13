import api from '../utils/api';

class DashboardService {
  // Get dashboard statistics
  async getDashboardStats() {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  // Get recent orders for dashboard
  async getRecentOrders(limit = 5) {
    try {
      const response = await api.get(`/dashboard/recent-orders?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      throw error;
    }
  }

  // Get top products for dashboard
  async getTopProducts(limit = 5) {
    try {
      const response = await api.get(`/dashboard/top-products?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching top products:', error);
      throw error;
    }
  }

  // Get recent users for dashboard
  async getRecentUsers(limit = 5) {
    try {
      const response = await api.get(`/dashboard/recent-users?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent users:', error);
      throw error;
    }
  }

  // Get sales analytics for charts
  async getSalesAnalytics() {
    try {
      const response = await api.get('/dashboard/sales-analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching sales analytics:', error);
      throw error;
    }
  }

  // Get product category distribution for pie chart
  async getProductCategories() {
    try {
      const response = await api.get('/dashboard/product-categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching product categories:', error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService(); 