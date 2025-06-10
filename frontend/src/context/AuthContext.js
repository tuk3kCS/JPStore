import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getUser, getAuthToken, setUser, setAuthToken } from '../utils/auth';
import { userService } from '../services/userService';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAuthToken();
      const localUser = getUser();
      
      if (token && localUser) {
        // Try to refresh user data from server to get latest info including avatar
        try {
          const updatedUser = await userService.getCurrentUser();
          setUser(updatedUser);
          dispatch({
            type: 'LOGIN',
            payload: { user: updatedUser, token },
          });
        } catch (error) {
          console.error('Error refreshing user data:', error);
          // Fall back to localStorage data if server request fails
          dispatch({
            type: 'LOGIN',
            payload: { user: localUser, token },
          });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = (user, token) => {
    setUser(user);
    setAuthToken(token);
    dispatch({
      type: 'LOGIN',
      payload: { user, token },
    });
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    dispatch({ type: 'LOGOUT' });
  };

  const refreshUser = async () => {
    try {
      const updatedUser = await userService.getCurrentUser();
      setUser(updatedUser);
      dispatch({
        type: 'UPDATE_USER',
        payload: updatedUser,
      });
      return updatedUser;
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const value = {
    ...state,
    login,
    logout,
    refreshUser,
    dispatch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 