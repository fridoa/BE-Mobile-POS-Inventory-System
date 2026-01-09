import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 2,
  },
  fileFilter: (req, file, callback) => {
    const fileTypes = /jpeg|jpg|png|webp/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (mimetype && extname) {
      return callback(null, true);
    } else {
      callback(new Error("Only images are allowed (jpeg, jpg, png, webp)"));
    }
  },
});

export default {
  single(fieldName: string) {
    return upload.single(fieldName);
  },

  multiple(fieldName: string, maxCount: number) {
    return upload.array(fieldName, maxCount);
  },
};
