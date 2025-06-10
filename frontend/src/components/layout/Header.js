import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
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
              Figures
            </Link>
            <Link 
              to="/merchandise" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Merchandise & Goods
            </Link>
            <Link 
              to="/pre-order" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Pre-Order
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <i className="bi bi-person text-xl"></i>
              </button>
              
              {/* User Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <Link 
                      to="/account" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <i className="bi bi-person mr-2"></i>
                      My Account
                    </Link>
                    <Link 
                      to="/orders" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <i className="bi bi-box mr-2"></i>
                      My Orders
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <Link to="/cart" className="p-2 text-gray-600 hover:text-blue-600 transition-colors relative">
              <i className="bi bi-bag text-xl"></i>
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span>
            </Link>
            <button className="p-2 text-gray-600 hover:text-red-600 transition-colors">
              <i className="bi bi-box-arrow-right text-xl"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 