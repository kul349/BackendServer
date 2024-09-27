import multer from "multer";
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
  const fileFilter = (req, file, cb) => {
    const fileTypes = /pdf|doc|docx|jpg|jpeg|png/;  // Add other extensions if needed
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
  
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only images, PDF, and Word documents are allowed!"));
    }
  };
  export const upload = multer({ storage,
    fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
  })