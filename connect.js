var redis = require('redis');
var Promise = require('bluebird');

Promise.promisifyAll(redis.Multi.prototype);
Promise.promisifyAll(redis.RedisClient.prototype);

var config = {
  host: '127.0.0.1',
  port: 6379,
  db: 3,
  // password: 'foobared'
};

var client = redis.createClient(config);

client.on('error', function(err) {
  console.log("Error: ", err);
});

client.on('ready', function() {
  console.log('Ready.');
  // client.end();
});

client.on('end', function() {
  console.log('End.');
});

client.on('connect', function() {
  console.log('Connect.');
});


module.exports = client;