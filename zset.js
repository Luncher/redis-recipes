var assert = require('assert');
var client = require('./connect');
var Promise = require('bluebird');

var key = 'k1';
var m1 = 'm1';
var score1 = 3;
var m2 = 'm2';
var score2 = 4;
var m3 = 'm3';
var score3 = 5;


client.zaddAsync(key, score1, m1, score2, m2, score3, m3)
.then(function(ret) {
  return client.zscoreAsync(key, m1);
})
.then(function(ret) {
  assert(parseInt(ret) === score1);
})
.then(function() {
  return client.zrankAsync(key, m1);
})
.then(function(ret) {
  assert(ret === 0);
})
.then(function() {
  return client.zrangebyscoreAsync(key, score1, score3);
})
.then(function(ret) {
  assert(ret.length === 3);
})
.then(function() {
  return client.zlexcountAsync(key, '-', '+');
})
.then(function(ret) {
  assert(ret === 3);
})
.then(function() {
  return client.zrangeAsync(key, 0, 1);
})
.then(function(ret) {
  assert(ret.length === 2);
})
.finally(function() {
  return client.zremAsync(key, m1, m2);
});