const path = require('path');
const multer = require('multer');
const uploadPath = path.join(__dirname, "../public/uploads");
const fs = require('fs')

if (!fs.existsSync(uploadPath)) {
  console.log("Uploads folder does NOT exist. Creating it now...");
  fs.mkdirSync(uploadPath, { recursive: true });
} else {
  console.log("Uploads folder exists.");
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      console.log("Saving image to:", uploadPath);    
      cb(null, uploadPath);      
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix +path.extname(file.originalname))
    }
  })  
  

  const uploads = multer({storage:storage,limits: { fileSize: 10 * 1024 * 1024 },}) 


module.exports = uploads;