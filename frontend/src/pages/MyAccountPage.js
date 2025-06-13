import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Breadcrumb from '../components/common/Breadcrumb';
import Loading from '../components/common/Loading';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';

const MyAccountPage = () => {
  const { user, logout } = useAuth();
  
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userDetails, setUserDetails] = useState(null);
  
  // Avatar upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const breadcrumbItems = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Tài khoản của tôi', path: '' }
  ];

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const userData = await userService.getCurrentUser();
        setUserDetails(userData);
        setPersonalInfo({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || ''
        });
      } catch (error) {
        console.error('Error loading user data:', error);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Update user profile using the profile endpoint
      await userService.updateProfile(personalInfo);
      
      setSuccess('Cập nhật hồ sơ thành công');
      
      // Reload user data
      const userData = await userService.getCurrentUser();
      setUserDetails(userData);
      
    } catch (error) {
      console.error('Lỗi cập nhật hồ sơ:', error);
      setError(error.response?.data?.message || 'Lỗi cập nhật hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Mật khẩu mới không khớp');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    try {
      setUpdatingPassword(true);
      setError('');
      setSuccess('');

      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setSuccess('Cập nhật mật khẩu thành công');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
    } catch (error) {
      console.error('Lỗi cập nhật mật khẩu:', error);
      setError(error.response?.data?.message || 'Lỗi cập nhật mật khẩu');
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Handle file selection for avatar
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn một tệp ảnh hợp lệ');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước tệp phải nhỏ hơn 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous errors
      setError('');
    }
  };

  // Upload avatar
  const handleUploadAvatar = async () => {
    if (!selectedFile) return;
    
    try {
      setUploadingAvatar(true);
      setError('');
      
      await userService.uploadAvatar(selectedFile);
      
      // Reload user data to get updated avatar
      const userData = await userService.getCurrentUser();
      setUserDetails(userData);
      
      // Clear file selection
      setSelectedFile(null);
      setAvatarPreview('');
      
      // Reset file input
      const fileInput = document.getElementById('avatar-upload');
      if (fileInput) {
        fileInput.value = '';
      }
      
      setSuccess('Cập nhật ảnh đại diện thành công');
      
    } catch (error) {
      console.error('Lỗi cập nhật ảnh đại diện:', error);
      setError(error.response?.data?.message || 'Lỗi cập nhật ảnh đại diện');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Remove avatar
  const handleRemoveAvatar = async () => {
    try {
      setUploadingAvatar(true);
      setError('');
      
      // Call API to remove avatar
      await userService.removeAvatar();
      
      // Update local state
      setSelectedFile(null);
      setAvatarPreview('');
      
      // Reset file input
      const fileInput = document.getElementById('avatar-upload');
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Reload user data to reflect changes
      const userData = await userService.getCurrentUser();
      setUserDetails(userData);
      
      setSuccess('Xóa ảnh đại diện thành công');
      
    } catch (error) {
      console.error('Lỗi xóa ảnh đại diện:', error);
      setError(error.response?.data?.message || 'Lỗi xóa ảnh đại diện');
    } finally {
      setUploadingAvatar(false);
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

  // Check if avatar is default/placeholder
  const isDefaultAvatar = (avatar) => {
    return !avatar || 
           avatar.includes('placeholder') || 
           avatar === 'https://via.placeholder.com/150' ||
           avatar.includes('via.placeholder.com');
  };

  // Auto-upload when file is selected
  useEffect(() => {
    if (selectedFile) {
      handleUploadAvatar();
    }
  }, [selectedFile]);

  if (loading) {
    return <Loading message="Đang tải thông tin tài khoản..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />
        
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-left">Tài khoản của tôi</h1>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <i className="bi bi-exclamation-triangle-fill text-red-600 mr-2"></i>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <i className="bi bi-check-circle-fill text-green-600 mr-2"></i>
              <span className="text-green-800">{success}</span>
            </div>
          </div>
        )}
        
        {/* User Profile Section */}
        <div className="text-center mb-12">
          <div className="inline-block relative">
            {/* Clickable Avatar Container */}
            <div 
              className="relative cursor-pointer group"
              onClick={() => !uploadingAvatar && document.getElementById('avatar-upload').click()}
              title="Nhấn để tải lên ảnh đại diện"
            >
              {/* Avatar Display */}
              {avatarPreview || (userDetails?.avatar && !isDefaultAvatar(userDetails.avatar)) ? (
                <img
                  src={avatarPreview || `http://localhost:5000${userDetails.avatar}`}
                  alt={userDetails?.name || userDetails?.username || 'User'}
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 group-hover:opacity-75 transition-opacity"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150x150?text=User';
                  }}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-100 border-2 border-gray-200 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <span className="text-2xl font-semibold text-blue-600">
                    {getUserInitials(userDetails?.name, userDetails?.username)}
                  </span>
                </div>
              )}
              
              {/* Upload Overlay - shows on hover */}
              <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white">
                  {uploadingAvatar ? (
                    <i className="bi bi-arrow-clockwise animate-spin text-xl"></i>
                  ) : (
                    <i className="bi bi-camera text-xl"></i>
                  )}
                </div>
              </div>
            </div>
            
            {/* Remove Avatar Button - only show if avatar exists and not default */}
            {(avatarPreview || (userDetails?.avatar && !isDefaultAvatar(userDetails.avatar))) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveAvatar();
                }}
                className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 border-2 border-white transition-colors z-10"
                title="Xóa ảnh đại diện"
                disabled={uploadingAvatar}
              >
                <i className="bi bi-x text-xs"></i>
              </button>
            )}
            
            {/* Hidden File Input */}
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-4">
            {userDetails?.username || 'User'}
          </h2>
          
          {/* Upload Instructions */}
          <p className="text-xs text-gray-400 mt-2">
            Nhấn vào ảnh đại diện để tải lên ảnh mới (tối đa 5MB)
          </p>
        </div>

        {/* Account Content */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 text-left">Thông tin cá nhân</h3>
            
            <form onSubmit={handleSaveChanges}>
              <div className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={personalInfo.name}
                    onChange={handlePersonalInfoChange}
                    disabled={saving}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={personalInfo.email}
                    onChange={handlePersonalInfoChange}
                    disabled={saving}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={personalInfo.phone}
                    onChange={handlePersonalInfoChange}
                    disabled={saving}
                    placeholder="Nhập số điện thoại"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={personalInfo.address}
                    onChange={handlePersonalInfoChange}
                    disabled={saving}
                    placeholder="Nhập địa chỉ"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Save Changes Button */}
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="flex items-center">
                      <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                      Lưu...
                    </div>
                  ) : (
                    'Lưu'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 text-left">Thay đổi mật khẩu</h3>
            
            <form onSubmit={handleUpdatePassword}>
              <div className="space-y-6">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      disabled={updatingPassword}
                      placeholder="Nhập mật khẩu hiện tại"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <i className={`bi ${showPasswords.current ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      disabled={updatingPassword}
                      placeholder="Nhập mật khẩu mới"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <i className={`bi ${showPasswords.new ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      disabled={updatingPassword}
                      placeholder="Xác nhận mật khẩu mới"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <i className={`bi ${showPasswords.confirm ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <p className="text-sm text-gray-500 text-left">
                  Mật khẩu phải có ít nhất 8 ký tự và bao gồm ít nhất một số và một ký tự đặc biệt.
                </p>

                {/* Update Password Button */}
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingPassword ? (
                    <div className="flex items-center">
                      <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                      Cập nhật...
                    </div>
                  ) : (
                    'Cập nhật mật khẩu'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default MyAccountPage; 