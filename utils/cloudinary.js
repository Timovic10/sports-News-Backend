const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'drykamywi',
  api_key: '198355642176568',
  api_secret: 'aUaCqmygqeuTO5pKZoyGo13Ibd0',
});

module.exports = cloudinary;
