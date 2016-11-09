var assert = require('assert');
var client = require('./connect.js');
var Promise = require('bluebird');

var key = 'skey';
var members1 = ['m1', 'm2', 'm3'];

var key2 = 'skey2';
var members2 = ['m2', 'm3', 'm4'];

var key3 = 'skey3';
var key4 = 'skey4';


Promise.join(
client.saddAsync(key, members1),
client.saddAsync(key2, members2))
.then(function(ret1, ret2) {
  return client.scardAsync(key);
})
.then(function(ret) {
  assert(ret == 3);
})
.then(function() {
  return client.sdiffAsync(key, key2);
})
.then(function(ret) {
  assert(ret[0] === 'm1');
})
.then(function() {
  return client.sdiffstoreAsync(key3, key, key2);
})
.then(function(ret) {
  assert(ret === 1);
})
.then(function() {
  return client.smembersAsync(key3);
})
.then(function(ret) {
  assert(ret[0] === 'm1' && ret.length === 1);
})
.then(function() {
  return client.sinterstoreAsync(key4, key, key2);
})
.then(function(ret) {
  assert(ret == 2);
})
.then(function() {
  return client.smembersAsync(key4);
})
.then(function(ret) {
  assert(ret.length === 2);
  assert(ret.indexOf('m2') > -1);
})
.then(function() {
  return client.sunionstoreAsync(key4, key, key2);
})
.then(function(ret) {
  assert(ret === 4);
})
.then(function() {
  return Promise.join(client.sremAsync(key4, members1[0]), 
  client.sremAsync(key4, 'ddd'));
})
.spread(function(ret, ret2) {
  console.log(ret, ret2);
  assert(ret === 1);
  assert(ret2 === 0);
})
.then(function() {
  return client.smembersAsync(key);
})
.then(function(ret) {
  assert(ret.length === 3);
  assert(ret.indexOf(members1[0]) > -1);
})
.then(function() {
  return client.spopAsync(key);
})
.then(function() {
  return client.scardAsync(key);
})
.then(function(ret) {
  assert(ret === 2);
})
.then(function() {
  return client.srandmemberAsync(key);
})
.then(function(ret) {
  assert(members1.indexOf(ret) > -1);
});