import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { totalItems } = useCart();
  const { user, logout } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get user avatar URL or initials
  const getUserAvatar = () => {
    if (user?.avatar && !isDefaultAvatar(user.avatar)) {
      return `http://localhost:5000${user.avatar}`;
    }
    return null;
  };

  // Check if avatar is default
  const isDefaultAvatar = (avatar) => {
    return !avatar || avatar.includes('default-avatar') || avatar === '/images/default-avatar.png';
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return 'U';
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setIsUserDropdownOpen(false);
  };
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center">
            <img 
              src="/images/logo.png" 
              alt="JPStore Logo" 
              className="h-10 w-auto"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <span 
              className="text-2xl font-bold text-blue-600 ml-2"
              style={{display: 'none'}}
            >
              JPStore
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              to="/figures" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Mô hình
            </Link>
            <Link 
              to="/merchandise" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Vật phẩm & Phụ kiện
            </Link>
            <Link 
              to="/pre-order" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Hàng đặt trước
            </Link>
          </nav>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center p-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                {user ? (
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700">
                      Mừng bạn quay lại, {user.username || 'Người dùng'}!
                    </span>
                    {getUserAvatar() ? (
                      <img
                        src={getUserAvatar()}
                        alt={user.name || 'User'}
                        className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-8 h-8 rounded-full border-2 border-gray-200 bg-blue-500 text-white text-sm font-medium flex items-center justify-center ${getUserAvatar() ? 'hidden' : 'flex'}`}
                    >
                      {getUserInitials()}
                    </div>
                  </div>
                ) : (
                <i className="bi bi-person text-xl"></i>
                )}
              </button>
              
              {/* User Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {user ? (
                    /* Logged in user menu */
                    <div>
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          {getUserAvatar() ? (
                            <img
                              src={getUserAvatar()}
                              alt={user.name || 'User'}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-10 h-10 rounded-full border-2 border-gray-200 bg-blue-500 text-white text-sm font-medium flex items-center justify-center ${getUserAvatar() ? 'hidden' : 'flex'}`}
                          >
                            {getUserInitials()}
                          </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-sm font-medium text-gray-900 truncate text-left">
                               {user.username || 'User'}
                             </p>
                           </div>
                        </div>
                      </div>
                      
                      {/* Menu options */}
                  <div className="py-1">
                    <Link 
                      to="/account" 
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <i className="bi bi-person mr-2"></i>
                      Tài khoản của tôi
                    </Link>
                    <Link 
                      to="/orders" 
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <i className="bi bi-box mr-2"></i>
                      Đơn hàng của tôi
                        </Link>
                        <div className="border-t border-gray-200"></div>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <i className="bi bi-box-arrow-right mr-2"></i>
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Guest user menu */
                    <div className="py-1">
                      <Link 
                        to="/login" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        <i className="bi bi-box-arrow-in-right mr-2"></i>
                        Đăng nhập
                      </Link>
                      <Link 
                        to="/register" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        <i className="bi bi-person-plus mr-2"></i>
                        Tạo tài khoản
                    </Link>
                  </div>
                  )}
                </div>
              )}
            </div>
            <Link to="/cart" className="p-2 text-gray-600 hover:text-blue-600 transition-colors relative">
              <i className="bi bi-bag text-xl"></i>
              {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
              </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 