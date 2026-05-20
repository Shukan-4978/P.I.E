const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir('uploads/images');
ensureDir('uploads/pitchdecks');
ensureDir('uploads/avatars');
ensureDir('uploads/chat');
ensureDir('uploads/proofs');

// Storage for images (posts, startup media)
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/images');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

// Storage for pitch decks
const pitchDeckStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/pitchdecks');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

// Storage for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

// Storage for investment proofs
const proofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/proofs');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

// Generic image filter
const imageFilter = (req, file, cb) => {
  const allowedExts = /jpeg|jpg|png|gif|webp|heic|heif/;
  const isImageMime = file.mimetype.startsWith('image/') || file.mimetype === 'application/octet-stream';
  const isValidExt = allowedExts.test(path.extname(file.originalname).toLowerCase());
  
  if (isValidExt && (isImageMime || file.mimetype === 'application/octet-stream')) {
    cb(null, true);
  } else if (isImageMime && !isValidExt) {
    // Some images might not have extensions but have correct mime
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, heic)'));
  }
};

// Generic pitch deck/document filter
const pitchDeckFilter = (req, file, cb) => {
  const allowedExts = /pdf|ppt|pptx/;
  const isPDF = file.mimetype === 'application/pdf';
  const isPPT = file.mimetype === 'application/vnd.ms-powerpoint' || file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  const isValidExt = allowedExts.test(path.extname(file.originalname).toLowerCase());
  
  if (isPDF || isPPT || isValidExt) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and PowerPoint files are allowed for documents'));
  }
};

// Combined startup files filter
const startupFilesFilter = (req, file, cb) => {
  const field = file.fieldname;
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (field === 'images' || field === 'logo') {
    const allowedExts = /jpeg|jpg|png|gif|webp|heic|heif/;
    if (allowedExts.test(ext) || file.mimetype.startsWith('image/') || file.mimetype === 'application/octet-stream' && allowedExts.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for ${field} (${ext}, ${file.mimetype}). Only images are allowed.`));
    }
  } else if (field === 'verificationDocument' || field === 'pitchDeck') {
    const allowedExts = /pdf|ppt|pptx/;
    const isDocMime = file.mimetype === 'application/pdf' || 
                      file.mimetype.includes('powerpoint') || 
                      file.mimetype.includes('presentationml');
    if (allowedExts.test(ext) || isDocMime) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for ${field} (${ext}, ${file.mimetype}). Only PDF/PPT are allowed.`));
    }
  } else {
    cb(null, true); // Allow other fields or handle as needed
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
  fileFilter: (req, file, cb) => {
    const allowedExts = /jpeg|jpg|png|pdf/;
    const isValidExt = allowedExts.test(path.extname(file.originalname).toLowerCase());
    if (isValidExt) cb(null, true);
    else cb(new Error('Only images (jpg/png) and PDFs are allowed for proofs.'));
  }
});

const uploadStartupFiles = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'images' || file.fieldname === 'logo') cb(null, 'uploads/images');
      else cb(null, 'uploads/pitchdecks');
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: startupFilesFilter,
});

// Chat attachments
const uploadChatFile = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/chat');
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

module.exports = { uploadImage, uploadPitchDeck, uploadAvatar, uploadStartupFiles, uploadChatFile, uploadProof };
