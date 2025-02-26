const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads/re-image")); // Save to public/uploads
  },
  filename: (req, file, cb) => {
    cb(null.Date.now() + "." + file.originalname);
  },
});

const upload = multer({ storage });

module.exports = upload;
