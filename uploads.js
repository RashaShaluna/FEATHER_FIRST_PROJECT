const path = require('path');
const {log} = require('console');
const multer = require('multer');
const fs = require('fs');

// Explicitly set the project root to include FEATHER_FIRST_PROJECT
const projectRoot = '/home/ubuntu/FEATHER_FIRST_PROJECT';
const uploadPath = path.join(projectRoot, 'public', 'uploads');

log('Project Root:', projectRoot);
log('Upload Path:', uploadPath);

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  log('Created upload directory at:', uploadPath);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      log('File will be saved to:', uploadPath);
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
      log('Generated filename:', filename);
      cb(null, filename);
    }
});

const uploads = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024  // 50MB in bytes
    },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Images only!');
        }
    }
});

// Verify the correct path is being used
log('Final upload path verification:', uploadPath);
log('Directory exists:', fs.existsSync(uploadPath));

module.exports = uploads;