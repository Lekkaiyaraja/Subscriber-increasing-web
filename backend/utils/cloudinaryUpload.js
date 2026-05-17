const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');

const uploadImageBuffer = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });

module.exports = { uploadImageBuffer };
