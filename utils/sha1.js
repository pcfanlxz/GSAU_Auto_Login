const crypto = require('crypto');

function calculateSHA1(inputString) {
    const sha1Hash = crypto.createHash('sha1');
    sha1Hash.update(inputString);
    return sha1Hash.digest('hex');
}

module.exports = { calculateSHA1 };