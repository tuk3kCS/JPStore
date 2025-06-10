import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

// Cart action types
const CART_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_CART: 'SET_CART',
  SET_ERROR: 'SET_ERROR',
  ADD_ITEM: 'ADD_ITEM',
  UPDATE_ITEM: 'UPDATE_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  CLEAR_CART: 'CLEAR_CART',
  SET_CART_COUNT: 'SET_CART_COUNT'
};

// Initial cart state
const initialState = {
  items: [],
  totalItems: 0,
  subtotal: 0,
  shipping: 0,
  total: 0,
  loading: false,
  error: null
};

// Cart reducer
function cartReducer(state, action) {
  switch (action.type) {
    case CART_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: null
      };

    case CART_ACTIONS.SET_CART:
      return {
        ...state,
        ...action.payload,
        loading: false,
        error: null
      };

    case CART_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case CART_ACTIONS.ADD_ITEM:
      const existingItemIndex = state.items.findIndex(
        item => item.product._id === action.payload.product._id
      );

      let updatedItems;
      if (existingItemIndex > -1) {
        updatedItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        updatedItems = [...state.items, action.payload];
      }

      const newTotalItems = updatedItems.reduce((total, item) => total + item.quantity, 0);
      const newSubtotal = updatedItems.reduce((total, item) => {
        const price = item.product.isPreOrder 
          ? (item.product.vndPrice || 0) 
          : (item.product.vndPrice || item.product.price || 0);
        return total + (price * item.quantity);
      }, 0);

      return {
        ...state,
        items: updatedItems,
        totalItems: newTotalItems,
        subtotal: newSubtotal,
        total: newSubtotal + state.shipping,
        loading: false,
        error: null
      };

    case CART_ACTIONS.UPDATE_ITEM:
      const updatedItemsAfterUpdate = state.items.map(item =>
        item.product._id === action.payload.productId
          ? { ...item, quantity: action.payload.quantity }
          : item
      );

      const updatedTotalItems = updatedItemsAfterUpdate.reduce((total, item) => total + item.quantity, 0);
      const updatedSubtotal = updatedItemsAfterUpdate.reduce((total, item) => {
        const price = item.product.isPreOrder 
          ? (item.product.vndPrice || 0) 
          : (item.product.vndPrice || item.product.price || 0);
        return total + (price * item.quantity);
      }, 0);

      return {
        ...state,
        items: updatedItemsAfterUpdate,
        totalItems: updatedTotalItems,
        subtotal: updatedSubtotal,
        total: updatedSubtotal + state.shipping,
        loading: false,
        error: null
      };

    case CART_ACTIONS.REMOVE_ITEM:
      const filteredItems = state.items.filter(
        item => item.product._id !== action.payload
      );

      const filteredTotalItems = filteredItems.reduce((total, item) => total + item.quantity, 0);
      const filteredSubtotal = filteredItems.reduce((total, item) => {
        const price = item.product.isPreOrder 
          ? (item.product.vndPrice || 0) 
          : (item.product.vndPrice || item.product.price || 0);
        return total + (price * item.quantity);
      }, 0);

      return {
        ...state,
        items: filteredItems,
        totalItems: filteredTotalItems,
        subtotal: filteredSubtotal,
        total: filteredSubtotal + state.shipping,
        loading: false,
        error: null
      };

    case CART_ACTIONS.CLEAR_CART:
      return {
        ...initialState,
        shipping: state.shipping
      };

    case CART_ACTIONS.SET_CART_COUNT:
      return {
        ...state,
        totalItems: action.payload
      };

    default:
      return state;
  }
}

// Create context
const CartContext = createContext();

// Cart provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user } = useAuth();

  // Load cart on mount and when user changes
  useEffect(() => {
    loadCart();
  }, [user]);

  // Load cart from backend or local storage
  const loadCart = async () => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });

      if (user) {
        // User is logged in - load from backend
        const cartData = await cartService.getCart();
        dispatch({ 
          type: CART_ACTIONS.SET_CART, 
          payload: {
            items: cartData.items || [],
            totalItems: cartData.totalItems || 0,
            subtotal: cartData.subtotal || 0,
            shipping: cartData.shipping || 0,
            total: cartData.total || 0
          }
        });
      } else {
        // Guest user - load from local storage
        const localCart = cartService.getLocalCart();
        const subtotal = localCart.items.reduce((total, item) => {
          const price = item.product.isPreOrder 
            ? (item.product.vndPrice || 0) 
            : (item.product.vndPrice || item.product.price || 0);
          return total + (price * item.quantity);
        }, 0);

        dispatch({ 
          type: CART_ACTIONS.SET_CART, 
          payload: {
            items: localCart.items,
            totalItems: localCart.totalItems,
            subtotal,
            shipping: 50000, // Default shipping in VND
            total: subtotal + 50000
          }
        });
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  // Add item to cart
  const addToCart = async (product, quantity = 1) => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });

      if (user) {
        // User is logged in - save to backend
        await cartService.addToCart(product._id, quantity);
        await loadCart(); // Reload cart from backend
      } else {
        // Guest user - save to local storage
        cartService.addToLocalCart(product, quantity);
        dispatch({ 
          type: CART_ACTIONS.ADD_ITEM, 
          payload: { product, quantity }
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding to cart:', error);
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Update item quantity
  const updateCartItem = async (productId, quantity) => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });

      if (user) {
        // User is logged in - update in backend
        await cartService.updateCartItem(productId, quantity);
        await loadCart(); // Reload cart from backend
      } else {
        // Guest user - update in local storage
        cartService.updateLocalCartItem(productId, quantity);
        dispatch({ 
          type: CART_ACTIONS.UPDATE_ITEM, 
          payload: { productId, quantity }
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating cart item:', error);
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId) => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });

      if (user) {
        // User is logged in - remove from backend
        await cartService.removeFromCart(productId);
        await loadCart(); // Reload cart from backend
      } else {
        // Guest user - remove from local storage
        cartService.removeFromLocalCart(productId);
        dispatch({ 
          type: CART_ACTIONS.REMOVE_ITEM, 
          payload: productId
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing from cart:', error);
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });

      if (user) {
        // User is logged in - clear backend cart
        await cartService.clearCart();
      } else {
        // Guest user - clear local storage
        cartService.clearLocalCart();
      }

      dispatch({ type: CART_ACTIONS.CLEAR_CART });
      return { success: true };
    } catch (error) {
      console.error('Error clearing cart:', error);
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Get cart item count
  const getCartItemCount = () => {
    return state.totalItems;
  };

  // Check if product is in cart
  const isInCart = (productId) => {
    return state.items.some(item => item.product._id === productId);
  };

  // Get item quantity in cart
  const getItemQuantity = (productId) => {
    const item = state.items.find(item => item.product._id === productId);
    return item ? item.quantity : 0;
  };

  const value = {
    // State
    cart: state,
    cartItems: state.items,
    totalItems: state.totalItems,
    subtotal: state.subtotal,
    shipping: state.shipping,
    total: state.total,
    loading: state.loading,
    error: state.error,

    // Actions
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    loadCart,
    
    // Utilities
    getCartItemCount,
    isInCart,
    getItemQuantity
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext; 