import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';
import { exchangeRateService } from '../services/exchangeRateService';

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

// Helper function to calculate item price with exchange rate
const calculateItemPrice = async (product) => {
  if (product.isPreOrder) {
    // For pre-order products, calculate VND price from JPY price × exchange rate
    if (product.jpyPrice) {
      try {
        const result = exchangeRateService.loadSettings();
        if (result.success && result.settings && result.settings.rate) {
          const exchangeRate = parseFloat(result.settings.rate);
          if (exchangeRate > 0) {
            return Math.round(product.jpyPrice * exchangeRate);
          }
        }
      } catch (error) {
        console.error('Error loading exchange rate:', error);
      }
      
      // If no exchange rate is available, try to fetch from API
      try {
        // Fetch exchange rate from the same APIs used in ProductManagementPage
        const primaryUrl = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/jpy.json';
        const fallbackUrl = 'https://latest.currency-api.pages.dev/v1/currencies/jpy.json';
        
        let response;
        try {
          response = await fetch(primaryUrl);
          if (!response.ok) throw new Error('Primary API failed');
        } catch (error) {
          console.log('Primary exchange rate API failed, trying fallback...');
          response = await fetch(fallbackUrl);
          if (!response.ok) throw new Error('Fallback API also failed');
        }
        
        const data = await response.json();
        const jpyToVndRate = data.jpy?.vnd;
        
        if (jpyToVndRate && jpyToVndRate > 0) {
          console.log('Using live exchange rate for cart calculation:', jpyToVndRate);
          return Math.round(product.jpyPrice * jpyToVndRate);
        } else {
          throw new Error('VND rate not found in response');
        }
      } catch (apiError) {
        console.error('Failed to fetch exchange rate from API for cart calculation:', apiError);
        // If API also fails, return 0 to indicate price calculation failed
        // This prevents showing incorrect prices
        return 0;
      }
    }
    // Fallback to stored VND price if no JPY price
    return product.vndPrice || 0;
  } else {
    return product.vndPrice || product.price || 0;
  }
};

// Initial cart state
const initialState = {
  items: [],
  totalItems: 0,
  subtotal: 0,
  total: 0,
  loading: false,
  error: null
};

// Helper function to calculate totals for items asynchronously
const calculateCartTotals = async (items) => {
  if (!items || items.length === 0) {
    return { totalItems: 0, subtotal: 0, total: 0 };
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate prices for all items in parallel
  const itemPrices = await Promise.all(items.map(item => calculateItemPrice(item.product)));
  const subtotal = items.reduce((sum, item, index) => {
    return sum + (itemPrices[index] * item.quantity);
  }, 0);
  
  return {
    totalItems,
    subtotal,
    total: subtotal
  };
};

// Cart reducer (synchronous operations only)
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

      return {
        ...state,
        items: updatedItems,
        loading: false,
        error: null
      };

    case CART_ACTIONS.UPDATE_ITEM:
      const updatedItemsAfterUpdate = state.items.map(item =>
        item.product._id === action.payload.productId
          ? { ...item, quantity: action.payload.quantity }
          : item
      );

      return {
        ...state,
        items: updatedItemsAfterUpdate,
        loading: false,
        error: null
      };

    case CART_ACTIONS.REMOVE_ITEM:
      const filteredItems = state.items.filter(
        item => item.product._id !== action.payload
      );

      return {
        ...state,
        items: filteredItems,
        loading: false,
        error: null
      };

    case CART_ACTIONS.CLEAR_CART:
      return {
        ...initialState
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
  const loadCart = useCallback(async () => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });

      if (user) {
        // User is logged in - load from backend
        const cartData = await cartService.getCart();
        
        // Recalculate totals on frontend to use current exchange rate
        const items = cartData.items || [];
        const { totalItems, subtotal, total } = await calculateCartTotals(items);
        
        dispatch({ 
          type: CART_ACTIONS.SET_CART, 
          payload: {
            items,
            totalItems,
            subtotal,
            total
          }
        });
      } else {
        // Guest user - load from local storage
        const localCart = cartService.getLocalCart();
        const { totalItems, subtotal, total } = await calculateCartTotals(localCart.items);

        dispatch({ 
          type: CART_ACTIONS.SET_CART, 
          payload: {
            items: localCart.items,
            totalItems,
            subtotal,
            total
          }
        });
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: error.message });
    }
  }, [user]);

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
        
        // Recalculate totals after adding item
        const currentState = state.items.find(item => item.product._id === product._id)
          ? state.items.map(item => 
              item.product._id === product._id 
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          : [...state.items, { product, quantity }];
        
        const { totalItems, subtotal, total } = await calculateCartTotals(currentState);
        dispatch({
          type: CART_ACTIONS.SET_CART,
          payload: {
            items: currentState,
            totalItems,
            subtotal,
            total
          }
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding to cart:', error);
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Update cart item quantity
  const updateCartItem = async (productId, quantity) => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });

      if (user) {
        // User is logged in - update in backend
        await cartService.updateCartItem(productId, quantity);
        await loadCart(); // Reload cart from backend
      } else {
        // Guest user - update local storage
        cartService.updateLocalCartItem(productId, quantity);
        dispatch({ 
          type: CART_ACTIONS.UPDATE_ITEM, 
          payload: { productId, quantity }
        });
        
        // Recalculate totals after updating item
        const updatedItems = state.items.map(item =>
          item.product._id === productId
            ? { ...item, quantity }
            : item
        );
        
        const { totalItems, subtotal, total } = await calculateCartTotals(updatedItems);
        dispatch({
          type: CART_ACTIONS.SET_CART,
          payload: {
            items: updatedItems,
            totalItems,
            subtotal,
            total
          }
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
        
        // Recalculate totals after removing item
        const filteredItems = state.items.filter(item => item.product._id !== productId);
        const { totalItems, subtotal, total } = await calculateCartTotals(filteredItems);
        dispatch({
          type: CART_ACTIONS.SET_CART,
          payload: {
            items: filteredItems,
            totalItems,
            subtotal,
            total
          }
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

  // Recalculate cart totals (useful when exchange rate changes)
  const recalculateCartTotals = useCallback(async () => {
    const { totalItems, subtotal, total } = await calculateCartTotals(state.items);

    dispatch({
      type: CART_ACTIONS.SET_CART,
      payload: {
        items: state.items,
        totalItems,
        subtotal,
        total
      }
    });
  }, [state.items]);

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
    recalculateCartTotals,
    
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