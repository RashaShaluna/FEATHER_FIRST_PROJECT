const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'C:/Users/lenovo/OneDrive/Desktop/FIRST_PROJECT_WEEK 8/public/uploads')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix +path.extname(file.originalname))
    }
  })
  
  console.log('fileee', 'C:/Users/lenovo/OneDrive/Desktop/FIRST_PROJECT_WEEK 8/public/uploads');

  const uploads = multer({storage:storage})


module.exports = uploads;