const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname,'../public/uploads'),(err,success)=>{
        if(err){
            throw err
        }
    });
  },
  filename: (req, file, cb) => {
    const name = Date.now()+'-'+file.originalname;
    cb(null, name,function(error,success){
        if(error){
            throw error
        }
    });
  }
});

const uploads = multer({ storage: storage });

module.exports = uploads;
