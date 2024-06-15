const util = require('util');
const Multer = require('multer');
const maxSize = 2 * 1024 * 1024;

const processFile = Multer({
  storage: Multer.memoryStorage(),
  limits: { fileSize: maxSize },
}).single('profilePicture');

const upload = util.promisify(processFile);

module.exports = {upload};
