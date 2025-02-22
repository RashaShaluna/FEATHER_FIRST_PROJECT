const path = require('path');
const multer = require('multer');
const fs = require('fs')
const uploadPath = "/home/ubuntu/FEATHER_FIRST_PROJECT/public/uploads/";

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null,uploadPath)
      log('saving in the',uploadPath)
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix +path.extname(file.originalname))
    }
  })
  

  const uploads = multer({storage:storage})


module.exports = uploads;