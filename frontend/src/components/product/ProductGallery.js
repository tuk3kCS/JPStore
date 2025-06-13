import React, { useState } from 'react';

const ProductGallery = ({ images, productName, product }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [currentThumbnailPage, setCurrentThumbnailPage] = useState(0);

  // Handle image URL construction and fallback
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/500x500?text=No+Image';
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) return imagePath;
    
    // Construct full URL for backend images
    return `http://localhost:5000${imagePath}`;
  };

  // Fallback to placeholder if no images
  const displayImages = images && images.length > 0 
    ? images 
    : ['https://via.placeholder.com/500x500?text=No+Image'];

  // Thumbnail pagination logic
  const thumbnailsPerPage = 4;
  const totalPages = Math.ceil(displayImages.length / thumbnailsPerPage);
  const startIndex = currentThumbnailPage * thumbnailsPerPage;
  const endIndex = Math.min(startIndex + thumbnailsPerPage, displayImages.length);
  const visibleThumbnails = displayImages.slice(startIndex, endIndex);

  const goToPreviousThumbnailPage = () => {
    if (currentThumbnailPage > 0) {
      setCurrentThumbnailPage(currentThumbnailPage - 1);
    }
  };

  const goToNextThumbnailPage = () => {
    if (currentThumbnailPage < totalPages - 1) {
      setCurrentThumbnailPage(currentThumbnailPage + 1);
    }
  };

  const handleThumbnailClick = (localIndex) => {
    const globalIndex = startIndex + localIndex;
    setSelectedImage(globalIndex);
  };

  // Helper function to format release date as MM/YYYY
  const formatReleaseDate = (releaseDate) => {
    if (!releaseDate) return null;
    
    const date = new Date(releaseDate);
    if (isNaN(date.getTime())) return null;
    
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${month}/${year}`;
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
        <img
          src={getImageUrl(displayImages[selectedImage])}
          alt={productName}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/500x500?text=Image+Not+Found';
          }}
        />
        
        {/* Release Date Overlay for Pre-order Products */}
        {product?.isPreOrder && product?.releaseDate && (
          <div className="absolute top-4 left-4">
            <div className="bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg">
              <div className="text-xs font-medium uppercase tracking-wide mb-1">Ngày phát hành</div>
              <div className="text-lg font-bold">{formatReleaseDate(product.releaseDate)}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Thumbnail Images with Navigation */}
      <div className="flex items-center space-x-2">
        {/* Left Arrow */}
        <button
          onClick={goToPreviousThumbnailPage}
          disabled={currentThumbnailPage === 0}
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            currentThumbnailPage === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          <i className="bi bi-chevron-left text-sm"></i>
        </button>

        {/* Thumbnail Grid */}
        <div className="flex-1 grid grid-cols-4 gap-3">
          {visibleThumbnails.map((image, localIndex) => {
            const globalIndex = startIndex + localIndex;
            return (
              <button
                key={globalIndex}
                onClick={() => handleThumbnailClick(localIndex)}
                className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${
                  selectedImage === globalIndex
                    ? 'border-blue-600' 
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img
                  src={getImageUrl(image)}
                  alt={`${productName} view ${globalIndex + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150x150?text=No+Image';
                  }}
                />
              </button>
            );
          })}
          
          {/* Fill empty slots if less than 4 images on current page */}
          {visibleThumbnails.length < thumbnailsPerPage && 
            [...Array(thumbnailsPerPage - visibleThumbnails.length)].map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square"></div>
            ))
          }
        </div>

        {/* Right Arrow */}
        <button
          onClick={goToNextThumbnailPage}
          disabled={currentThumbnailPage >= totalPages - 1}
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            currentThumbnailPage >= totalPages - 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          <i className="bi bi-chevron-right text-sm"></i>
        </button>
      </div>

      {/* Page Indicator (optional) */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-1">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentThumbnailPage(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                currentThumbnailPage === index
                  ? 'bg-blue-600'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery; 