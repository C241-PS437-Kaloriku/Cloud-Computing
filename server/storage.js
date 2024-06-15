const { Storage } = require('@google-cloud/storage');
const path = require('path');

const serviceKey = path.join(__dirname, './kaloriku-serviceaccount.json');

const storage = new Storage({
  keyFilename: serviceKey,
  projectId: 'ujicoba-kaloriku',
});

const bucketName = 'ujicoba-bucket-kaloriku';
const bucket = storage.bucket(bucketName);

module.exports = bucket;
