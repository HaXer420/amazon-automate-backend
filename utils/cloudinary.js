const cloudinary = require('cloudinary');
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: 'x-haxer',
  api_key: '498343716274441',
  api_secret: 'oOyEF935evWbA07yu6ke1HpUE1s',
});

module.exports = cloudinary;

// exports.uploads = function (file, folder) {
//   return new Promise((resolve) => {
//     cloudinary.uploader.upload(
//       file,
//       (result) => {
//         resolve({
//           url: result.url,
//           id: result.public_id,
//         });
//       },
//       {
//         resource_type: 'auto',
//         folder: folder,
//       }
//     );
//   });
// };
