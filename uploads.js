const path = require("path");
const { log } = require("console");
const multer = require("multer");
const fs = require("fs");

const projectRoot = path.resolve(__dirname, "..");
const uploadPath = path.join(projectRoot, "public", "uploads");

log("Project Root:", projectRoot);
log("Upload Path:", uploadPath);

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  log("uploadPath of exist", uploadPath);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
    log("path for saving", uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const uploads = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB in bytes
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb("Error: Images only!");
    }
  },
});

log('Final upload path verification:', uploadPath);
log('Directory exists:', fs.existsSync(uploadPath));

module.exports = uploads;
