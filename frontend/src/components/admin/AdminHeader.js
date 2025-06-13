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

  const displayName = user?.name || user?.username || 'Admin';

  return (
    <header className="bg-white shadow-sm border-b px-6 py-6">
      <div className="flex items-center justify-between h-8">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        </div>
        <div className="flex items-center space-x-3">
          <img
            src={user?.avatar && !user.avatar.includes('placeholder') && user.avatar !== 'https://via.placeholder.com/150' 
              ? (user.avatar.startsWith('/') ? `http://localhost:5000${user.avatar}` : user.avatar)
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1`
            }
                    alt={displayName}
            className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1`;
            }}
          />
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500">Quản trị viên</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader; 