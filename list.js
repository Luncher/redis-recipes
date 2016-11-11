var assert = require('assert');
var client = require('./connect');
var bluebird = require('bluebird');

var lkey = 'listKey';
var v1 = 'v1';
var v2 = 'v2';

client.llenAsync(lkey)
.then(function(ret) {
  assert(ret === 0);
})
.then(function() {
  return client.lpushAsync(lkey, v1, v2);
})
.then(function(ret) {
  assert(ret === 2);
})
.then(function() {
  return client.lpopAsync(lkey);
})
.then(function(ret) {
  assert(ret === v2);
})
.then(function() {
  return client.lrangeAsync(lkey, 0, -1);
})
.then(function(ret) {
  assert(ret[0] === v1);
})
.finally(function() {
  client.delAsync(lkey);
});