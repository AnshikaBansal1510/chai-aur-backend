import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")   // (error, destination)
  },
  filename: function (req, file, cb) {
    
    cb(null, file.originalname)   // returns filename : this will give us the local path to upload on cloudinary
  }
})

export const upload = multer({ 
  storage, 
})