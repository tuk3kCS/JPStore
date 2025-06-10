import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminHeader from '../components/admin/AdminHeader';
import { userService } from '../services/userService';
import Loading from '../components/common/Loading';
import { useAuth } from '../context/AuthContext';

const UserManagementPage = () => {
  const navigate = useNavigate();
  const { user: currentUser, refreshUser, logout } = useAuth();
  const [activeMenuItem, setActiveMenuItem] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [formData, setFormData] = useState({
    avatar: '',
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });

  // Backend data states
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploading, setUploading] = useState(false);

  // Load users from backend when component mounts
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await userService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      setError(error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get user initials
  const getUserInitials = (name, username) => {
    if (name) {
      return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    }
    if (username) {
      return username.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Delete user functionality
  const handleDeleteUser = async (userId) => {
    try {
      await userService.deleteUser(userId);
      setDeleteConfirmUser(null);
      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.response?.data?.message || 'Failed to delete user');
    }
  };

  // Promote user to admin
  const handlePromoteUser = async (userId) => {
    try {
      await userService.promoteUser(userId);
      await loadUsers();
    } catch (error) {
      console.error('Error promoting user:', error);
      setError(error.response?.data?.message || 'Failed to promote user');
    }
  };

  // Demote admin to user
  const handleDemoteUser = async (userId) => {
    try {
      await userService.demoteUser(userId);
      await loadUsers();
    } catch (error) {
      console.error('Error demoting user:', error);
      setError(error.response?.data?.message || 'Failed to demote user');
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user._id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);
  const startItem = startIndex + 1;
  const endItem = Math.min(startIndex + usersPerPage, totalUsers);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setIsAddMode(false);
    setFormData({
      avatar: user.avatar || '',
      name: user.name || '',
      username: user.username || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      address: user.address || ''
    });
    setAvatarPreview('');
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleAddNewUser = () => {
    setSelectedUser(null);
    setIsAddMode(true);
    setFormData({
      avatar: '',
      name: '',
      username: '',
      email: '',
      password: '',
      phone: '',
      address: ''
    });
    setAvatarPreview('');
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file selection for avatar
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset file selection
  const handleRemoveAvatar = () => {
    setSelectedFile(null);
    setAvatarPreview('');
    setFormData(prev => ({
      ...prev,
      avatar: ''
    }));
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSave = async () => {
    try {
      setUploading(true);
      let userData = { ...formData };
      
      if (isAddMode) {
        console.log('Adding new user:', formData);
        // Create user first without avatar
        delete userData.avatar;
        const newUser = await userService.createUser(userData);
        
        // Upload avatar if file is selected
        if (selectedFile) {
          await userService.uploadUserAvatar(newUser._id, selectedFile);
        }
        
        // Reload users after successful creation
        await loadUsers();
      } else {
        console.log('Updating user data:', formData);
        
        // Upload avatar if file is selected
        if (selectedFile) {
          await userService.uploadUserAvatar(selectedUser._id, selectedFile);
          
          // If updating current user's avatar, refresh user data in context
          if (selectedUser._id === currentUser?.id && refreshUser) {
            await refreshUser();
          }
        }
        
        // Update other user data (excluding avatar since it's handled separately)
        delete userData.avatar;
        if (Object.keys(userData).some(key => userData[key] !== '' && key !== 'password')) {
          await userService.updateUser(selectedUser._id, userData);
          
          // If updating current user's data, refresh user data in context
          if (selectedUser._id === currentUser?.id && refreshUser) {
            await refreshUser();
          }
        }
        
        // Reload users after successful update
        await loadUsers();
      }
      
      setIsModalOpen(false);
      setSelectedUser(null);
      setIsAddMode(false);
      setSelectedFile(null);
      setAvatarPreview('');
    } catch (error) {
      console.error('Error saving user:', error);
      setError(error.response?.data?.message || 'Failed to save user');
    } finally {
      setUploading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setIsAddMode(false);
    setSelectedFile(null);
    setAvatarPreview('');
    setFormData({
      avatar: '',
      name: '',
      username: '',
      email: '',
      password: '',
      phone: '',
      address: ''
    });
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Show loading state
  if (loading) {
    return <Loading message="Loading users..." />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        {/* Logo */}
        <div className="px-6 py-6 border-b">
          <div className="flex items-center">
            <img 
              src="/images/logo.png" 
              alt="JPStore Logo" 
              className="h-8 w-auto"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <span 
              className="text-xl font-bold text-blue-600 ml-2"
              style={{display: 'none'}}
            >
              JPStore
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link
                to="/admin"
                className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-gray-600 hover:bg-gray-50"
              >
                <i className="bi bi-grid mr-3"></i>
                Overview
              </Link>
            </li>
            <li>
              <button
                onClick={() => setActiveMenuItem('users')}
                className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors bg-blue-50 text-blue-600 border-r-2 border-blue-600"
              >
                <i className="bi bi-people mr-3"></i>
                User Management
              </button>
            </li>
            <li>
              <Link
                to="/admin/products"
                className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-gray-600 hover:bg-gray-50"
              >
                <i className="bi bi-box mr-3"></i>
                Product Management
              </Link>
            </li>
            <li>
              <Link
                to="/admin/orders"
                className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-gray-600 hover:bg-gray-50"
              >
                <i className="bi bi-clipboard-data mr-3"></i>
                Order Management
              </Link>
            </li>
            <li>
              <button
                onClick={() => setActiveMenuItem('statistics')}
                className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-gray-600 hover:bg-gray-50"
              >
                <i className="bi bi-bar-chart mr-3"></i>
                Statistics
              </button>
            </li>
          </ul>
          
          {/* Logout Button */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <i className="bi bi-box-arrow-right mr-3"></i>
              Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <AdminHeader title="User Management" />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <div className="flex items-center">
                <i className="bi bi-exclamation-triangle mr-2"></i>
                {error}
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto text-red-700 hover:text-red-900"
                >
                  <i className="bi bi-x"></i>
                </button>
              </div>
            </div>
          )}

          {/* Search and Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative">
                <i className="bi bi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search users by name, email, username, or ID..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Add New User Button */}
            <button 
              onClick={handleAddNewUser}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <i className="bi bi-plus"></i>
              <span>Add New User</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentUsers.map((user, index) => (
                  <tr key={index} className={`${(user._id === currentUser?.id || user._id === currentUser?._id) ? 'bg-blue-50 hover:bg-blue-100 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer'}`} onClick={() => handleUserClick(user)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">
                      {user._id?.slice(-8) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {user.avatar ? (
                            <img
                              src={user.avatar.startsWith('/') ? `http://localhost:5000${user.avatar}` : user.avatar}
                              alt={user.name || user.username}
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {getUserInitials(user.name, user.username)}
                              </span>
                            </div>
                          )}
                          {user.avatar && (
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center" style={{display: 'none'}}>
                              <span className="text-sm font-medium text-blue-600">
                                {getUserInitials(user.name, user.username)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {user.name || user.username || 'N/A'}
                            </span>
                            {console.log('User ID:', user._id, 'Current User ID:', currentUser?.id, 'Current User _id:', currentUser?._id, 'Match with id:', user._id === currentUser?.id, 'Match with _id:', user._id === currentUser?._id)}
                            {(user._id === currentUser?.id || user._id === currentUser?._id) && (
                              <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">{user.username || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">{user.email || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Role Toggle Button */}
                        {user.role === 'admin' ? (
                          <button 
                            className={`px-2 py-1 rounded border text-xs ${
                              (user._id === currentUser?.id || user._id === currentUser?._id)
                                ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'
                                : 'text-orange-600 hover:text-orange-700 border-orange-300 hover:bg-orange-50'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (user._id !== currentUser?.id && user._id !== currentUser?._id) {
                                handleDemoteUser(user._id);
                              }
                            }}
                            disabled={user._id === currentUser?.id || user._id === currentUser?._id}
                            title={(user._id === currentUser?.id || user._id === currentUser?._id) ? "You cannot demote yourself" : "Demote to User"}
                          >
                            <i className="bi bi-arrow-down text-xs mr-1"></i>
                            <span className="text-xs">Demote</span>
                          </button>
                        ) : (
                          <button 
                            className={`px-2 py-1 rounded border text-xs ${
                              (user._id === currentUser?.id || user._id === currentUser?._id)
                                ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'
                                : 'text-green-600 hover:text-green-700 border-green-300 hover:bg-green-50'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (user._id !== currentUser?.id && user._id !== currentUser?._id) {
                                handlePromoteUser(user._id);
                              }
                            }}
                            disabled={user._id === currentUser?.id || user._id === currentUser?._id}
                            title={(user._id === currentUser?.id || user._id === currentUser?._id) ? "You cannot promote yourself" : "Promote to Admin"}
                          >
                            <i className="bi bi-arrow-up text-xs mr-1"></i>
                            <span className="text-xs">Promote</span>
                          </button>
                        )}
                        
                        {/* Delete Button */}
                        <button 
                          className={`px-2 py-1 rounded border text-xs ${
                            (user._id === currentUser?.id || user._id === currentUser?._id)
                              ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (user._id !== currentUser?.id && user._id !== currentUser?._id) {
                              setDeleteConfirmUser(user);
                            }
                          }}
                          disabled={user._id === currentUser?.id || user._id === currentUser?._id}
                          title={(user._id === currentUser?.id || user._id === currentUser?._id) ? "You cannot delete your own account" : "Delete User"}
                        >
                          <i className="bi bi-trash text-xs mr-1"></i>
                          <span className="text-xs">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Show message if no users found */}
          {filteredUsers.length === 0 && !loading && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <i className="bi bi-people text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria.' : 'No users have been registered yet.'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-gray-600 text-sm">
                Showing {startItem} to {endItem} of {totalUsers} results
              </p>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                
                {[...Array(Math.min(5, totalPages))].map((_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:text-blue-600'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                {totalPages > 5 && (
                  <>
                    <span className="text-gray-400">...</span>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                        currentPage === totalPages
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:text-blue-600'
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* User Modal - Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {isAddMode ? 'Add New User' : 'Edit User'}
              </h2>
              <button
                onClick={handleModalClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form className="space-y-4">
              {/* User Avatar Upload */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  {avatarPreview || (formData.avatar && !formData.avatar.includes('placeholder') && formData.avatar !== 'https://via.placeholder.com/150') ? (
                    <img
                      src={avatarPreview || (formData.avatar?.startsWith('/') ? `http://localhost:5000${formData.avatar}` : formData.avatar)}
                      alt="User Avatar"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-blue-100 border-2 border-gray-200 flex items-center justify-center">
                      <span className="text-xl font-semibold text-blue-600">
                        {getUserInitials(formData.name, formData.username)}
                      </span>
                    </div>
                  )}
                  {/* Remove button - top right */}
                  {(selectedFile || (formData.avatar && !formData.avatar.includes('placeholder') && formData.avatar !== 'https://via.placeholder.com/150')) && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 border-2 border-white"
                      title="Remove Image"
                    >
                      <i className="bi bi-x text-xs"></i>
                    </button>
                  )}
                  {/* Camera button - bottom right */}
                  <button
                    type="button"
                    onClick={() => document.getElementById('avatar-upload').click()}
                    className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-blue-700 border-2 border-white"
                    title="Upload Image"
                  >
                    <i className="bi bi-camera text-xs"></i>
                  </button>
                </div>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Click camera to upload image (max 5MB)
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Full Name
                </label>
                <div className="relative">
                  <i className="bi bi-person-fill absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Username
                </label>
                <div className="relative">
                  <i className="bi bi-person absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleFormChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter username"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Email
                </label>
                <div className="relative">
                  <i className="bi bi-envelope absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Password
                </label>
                <div className="relative">
                  <i className="bi bi-lock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={isAddMode ? "Enter password" : "Enter new password"}
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Phone Number
                </label>
                <div className="relative">
                  <i className="bi bi-telephone absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Address
                </label>
                <div className="relative">
                  <i className="bi bi-geo-alt absolute left-3 top-3 text-gray-400"></i>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter address"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isAddMode ? 'Creating...' : 'Saving...'}
                    </div>
                  ) : (
                    isAddMode ? 'Add User' : 'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Confirm Delete
              </h2>
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="bi bi-exclamation-triangle text-red-600 text-xl"></i>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-medium text-gray-900">Delete User</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4 text-left">
                Are you sure you want to delete user <strong>{deleteConfirmUser.name || deleteConfirmUser.username}</strong>? 
                This will permanently remove the user account and all associated data.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <i className="bi bi-info-circle text-red-500 mr-2 flex-shrink-0"></i>
                  <span className="text-sm text-red-700 text-left">This action is irreversible</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUser(deleteConfirmUser._id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage; 