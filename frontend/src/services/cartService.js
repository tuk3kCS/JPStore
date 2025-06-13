import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance for cart operations
const cartAPI = axios.create({
  baseURL: `${API_BASE_URL}/cart`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
cartAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

class CartService {
  // Get user's cart
  async getCart() {
    try {
      const response = await cartAPI.get('/');
      return response.data;
    } catch (error) {
      console.error('Error getting cart:', error);
      throw new Error(error.response?.data?.message || 'Failed to get cart');
    }
  }

  // Add item to cart
  async addToCart(productId, quantity = 1) {
    try {
      const response = await cartAPI.post('/items', {
        productId,
        quantity
      });
      return response.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw new Error(error.response?.data?.message || 'Failed to add item to cart');
    }
  }

  // Update item quantity in cart
  async updateCartItem(productId, quantity) {
    try {
      const response = await cartAPI.put(`/items/${productId}`, {
        quantity
      });
      return response.data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw new Error(error.response?.data?.message || 'Failed to update cart item');
    }
  }

  // Remove item from cart
  async removeFromCart(productId) {
    try {
      const response = await cartAPI.delete(`/items/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove item from cart');
    }
  }

  // Clear entire cart
  async clearCart() {
    try {
      const response = await cartAPI.delete('/');
      return response.data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw new Error(error.response?.data?.message || 'Failed to clear cart');
    }
  }

  // Get cart summary (totals, shipping, etc.)
  async getCartSummary() {
    try {
      const response = await cartAPI.get('/summary');
      return response.data;
    } catch (error) {
      console.error('Error getting cart summary:', error);
      throw new Error(error.response?.data?.message || 'Failed to get cart summary');
    }
  }

  // For guests - local storage cart management
  getLocalCart() {
    try {
      const cart = localStorage.getItem('guest_cart');
      return cart ? JSON.parse(cart) : { items: [], totalItems: 0 };
    } catch (error) {
      console.error('Error getting local cart:', error);
      return { items: [], totalItems: 0 };
    }
  }

  setLocalCart(cart) {
    try {
      localStorage.setItem('guest_cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error setting local cart:', error);
    }
  }

  addToLocalCart(product, quantity = 1) {
    try {
      const cart = this.getLocalCart();
      const existingItemIndex = cart.items.findIndex(item => item.product._id === product._id);

      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        cart.items.push({
          product,
          quantity,
          addedAt: new Date().toISOString()
        });
      }

      cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
      this.setLocalCart(cart);
      return cart;
    } catch (error) {
      console.error('Error adding to local cart:', error);
      throw new Error('Failed to add item to cart');
    }
  }

  updateLocalCartItem(productId, quantity) {
    try {
      const cart = this.getLocalCart();
      const itemIndex = cart.items.findIndex(item => item.product._id === productId);

      if (itemIndex > -1) {
        if (quantity <= 0) {
          cart.items.splice(itemIndex, 1);
        } else {
          cart.items[itemIndex].quantity = quantity;
        }
      }

      cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
      this.setLocalCart(cart);
      return cart;
    } catch (error) {
      console.error('Error updating local cart item:', error);
      throw new Error('Failed to update cart item');
    }
  }

  removeFromLocalCart(productId) {
    try {
      const cart = this.getLocalCart();
      cart.items = cart.items.filter(item => item.product._id !== productId);
      cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
      this.setLocalCart(cart);
      return cart;
    } catch (error) {
      console.error('Error removing from local cart:', error);
      throw new Error('Failed to remove item from cart');
    }
  }

  clearLocalCart() {
    try {
      localStorage.removeItem('guest_cart');
      return { items: [], totalItems: 0 };
    } catch (error) {
      console.error('Error clearing local cart:', error);
      throw new Error('Failed to clear cart');
    }
  }
}

export const cartService = new CartService(); 