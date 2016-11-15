var debug = require('debug')('lru-cache:pool');
var redis = require('redis');

Promise.promisifyAll(redis.Multi.prototype);
Promise.promisifyAll(redis.RedisClient.prototype);

var config;
var count = 0;
var clients = {};
var maxClient = 20;

exports.init = function(redisConfig) {
  config = redisConfig;
  maxClient = config.maxClient || maxClient;
};

exports.alloc = function() {
  if(count >= maxClient) {
    return clients[0];
  }

  clients[count] = redis.createClient(config);

  return clients[count++];
};