const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const DatauriParser = require('datauri/parser');
const catchAsync = require('./catchAsync');
const AppError = require('./appError');
const cloudinary = require('./cloudinary');

const parser = new DatauriParser();

const MulterStorge = multer.memoryStorage();

const MulterFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError('File format not supported plese choose an image!', 400),
      false
    );
  }
};

const upload = multer({
  storage: MulterStorge,
  fileFilter: MulterFilter,
});

exports.uploadUserImg = upload.single('photo');

exports.UserImgResize = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 85 });

  const extName = path.extname(req.file.originalname).toString();
  const file64 = parser.format(extName, req.file.buffer);
  // console.log(file64);
  const result = await cloudinary.uploader.upload(file64.content);

  req.file.filename = result.url;

  next();
});
