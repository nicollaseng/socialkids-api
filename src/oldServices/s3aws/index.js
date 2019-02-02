const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const Bucket = 'aws-storage-files';

class S3Service {
  async uploadProfile(userId, image) {
    let params = {
      Bucket,
      Key: `${userId}/profile.png`,
      ContentType: 'image/png',
      Body: image,
    };
    this.uploadObject(params, () => {}, () => {});
  }

  async uploadObject(params, success, error) {
    S3.putObject(params, function(err, data) {
      if(err) {
        console.log('Could not upload to S3: ', err);
        error();
      } else  {
        console.log('Successfully uploaded data to aws-storage-files: ', data);
        success();
      }
    });
  }
}

module.exports = new S3Service();