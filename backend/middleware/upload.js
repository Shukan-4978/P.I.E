const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for images (posts, startup media)
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pie-images',
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'heic', 'heif'],
    resource_type: 'image',
  },
});

// Storage for pitch decks (PDFs, PPTs)
const pitchDeckStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pie-pitchdecks',
    format: async (req, file) => {
      // Return extension without dot
      return path.extname(file.originalname).substring(1).toLowerCase();
    },
    resource_type: 'raw',
  },
});

// Storage for avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pie-avatars',
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    resource_type: 'image',
  },
});

// Storage for investment proofs
const proofStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pie-proofs',
    format: async (req, file) => {
      return path.extname(file.originalname).substring(1).toLowerCase();
    },
    resource_type: 'auto', // allows image and raw
  },
});

// Generic filters (Cloudinary handles most validation, but we can keep basic checks)
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/octet-stream') {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const pitchDeckFilter = (req, file, cb) => {
  const allowedExts = /pdf|ppt|pptx/;
  const isDocMime = file.mimetype === 'application/pdf' || 
                    file.mimetype.includes('powerpoint') || 
                    file.mimetype.includes('presentationml');
  if (isDocMime || allowedExts.test(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and PowerPoint files are allowed'));
  }
};

const startupFilesFilter = (req, file, cb) => {
  if (file.fieldname === 'images' || file.fieldname === 'logo') {
    imageFilter(req, file, cb);
  } else {
    pitchDeckFilter(req, file, cb);
  }
};

// Multer instances
const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFilter,
});

const uploadPitchDeck = multer({
  storage: pitchDeckStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: pitchDeckFilter,
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: imageFilter,
});

const uploadProof = multer({
  storage: proofStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

// For multiple startup files, CloudinaryStorage requires a dynamic folder/resource_type based on the field
const startupFilesStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    if (file.fieldname === 'images' || file.fieldname === 'logo') {
      return {
        folder: 'pie-images',
        allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
        resource_type: 'image',
      };
    } else {
      return {
        folder: 'pie-pitchdecks',
        format: path.extname(file.originalname).substring(1).toLowerCase(),
        resource_type: 'raw',
      };
    }
  },
});

const uploadStartupFiles = multer({
  storage: startupFilesStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: startupFilesFilter,
});

// Chat attachments
const chatFileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith('image/');
    return {
      folder: 'pie-chat',
      format: path.extname(file.originalname).substring(1).toLowerCase(),
      resource_type: isImage ? 'image' : 'raw',
    };
  },
});

const uploadChatFile = multer({
  storage: chatFileStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

module.exports = { uploadImage, uploadPitchDeck, uploadAvatar, uploadStartupFiles, uploadChatFile, uploadProof };
