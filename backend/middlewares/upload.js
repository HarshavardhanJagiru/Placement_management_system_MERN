import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload folder exists
const uploadDir = './public/uploads/resumes';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const userId = req.user ? req.user._id : 'anonymous';
    const cleanOrigName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `resume_${userId}_${Date.now()}_${cleanOrigName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const filetypes = /pdf|docx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype === 'application/pdf' || 
                   file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX files are allowed!'), false);
  }
};

const uploadResume = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export default uploadResume;
