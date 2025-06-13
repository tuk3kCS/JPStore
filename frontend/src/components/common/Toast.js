import React, { useEffect } from 'react';

const Toast = ({ message, type = 'success', isVisible, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  if (!isVisible) return null;

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  const icon = type === 'success' ? 'bi-check-circle-fill' : type === 'error' ? 'bi-exclamation-circle-fill' : 'bi-info-circle-fill';

  return (
    <div className="fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out">
      <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 min-w-80`}>
        <i className={`bi ${icon} text-xl`}></i>
        <span className="font-medium">{message}</span>
        <button 
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200 transition-colors"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>
    </div>
  );
};

export default Toast; 