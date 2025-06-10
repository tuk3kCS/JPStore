const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const userUploadDir = path.join(__dirname, '../public/images/user');
const productUploadDir = path.join(__dirname, '../public/images/product');

if (!fs.existsSync(userUploadDir)) {
    fs.mkdirSync(userUploadDir, { recursive: true });
}

if (!fs.existsSync(productUploadDir)) {
    fs.mkdirSync(productUploadDir, { recursive: true });
}

// File filter to only allow images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// User avatar upload configuration
const userAvatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, userUploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'avatar-' + uniqueSuffix + extension);
    }
});

// Product images upload configuration
const productImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, productUploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + extension);
    }
});

// Configure multer for user avatars
const uploadUserAvatar = multer({
    storage: userAvatarStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Configure multer for product images (multiple files)
const uploadProductImages = multer({
    storage: productImageStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
        files: 10 // Max 10 files
    }
});

module.exports = {
    uploadUserAvatar,
    uploadProductImages
}; 