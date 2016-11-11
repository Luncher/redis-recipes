var assert = require('assert');
var Promise = require('bluebird');
var client = require('./connect');


var skey = 'skey1';
var svalue = 'hello';
var svalue2 = ' world';

client.appendAsync(skey, svalue)
.then(function(ret) {
  assert(ret === svalue.length);
})
.then(function() {
  return client.appendAsync(skey, svalue2);
})
.then(function(ret) {
  assert(ret === (svalue + svalue2).length);
})
.then(function() {
  return client.getrangeAsync(skey, 0, svalue.length - 1);
})
.then(function(ret) {
  assert(ret === svalue);
})
.then(function() {
  return client.setbitAsync('skeykk', 101, 1);
})
.then(function(ret) {
  console.log(ret);
})
.then(function() {
  return client.getbitAsync('skeykk', 101);
})
.then(function(ret) {
  assert(ret === 1);
})
.then(function() {
  return client.bitcountAsync('skeykk');
})
.then(function(ret) {
  assert(ret === 1);
})
.finally(function() {
  client.delAsync(skey);
  client.delAsync('skeykk');
});