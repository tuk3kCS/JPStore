import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const AdminHeader = ({ title }) => {
  const { user, refreshUser } = useAuth();

  // Refresh user data to get latest avatar when component mounts
  useEffect(() => {
    if (user && refreshUser) {
      refreshUser();
    }
  }, []);

  // Get user's initials for avatar
  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const displayName = user?.name || user?.username || 'Admin';

  return (
    <header className="bg-white shadow-sm border-b px-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                {user?.avatar && !user.avatar.includes('placeholder') && user.avatar !== 'https://via.placeholder.com/150' ? (
                  <img
                    src={user.avatar.startsWith('/') ? `http://localhost:5000${user.avatar}` : user.avatar}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">{getInitials(displayName)}</span>
                  </div>
                )}
                {user?.avatar && !user.avatar.includes('placeholder') && user.avatar !== 'https://via.placeholder.com/150' && (
                  <div className="w-full h-full bg-blue-500 flex items-center justify-center" style={{display: 'none'}}>
                    <span className="text-sm font-medium text-white">{getInitials(displayName)}</span>
                  </div>
                )}
              </div>
              <span className="text-sm font-medium">{displayName}</span>
              <i className="bi bi-chevron-down text-xs"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader; 