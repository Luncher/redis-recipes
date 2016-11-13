var client = require('./connect.js');
var assert = require('assert');

var key = 'dbKey';
var key2 = 'dbKey2';
var value = 'dbValue';

client.setAsync(key, value)
.then(function() {
  return client.typeAsync(key)
  .then(function(ret) {
    assert(ret === 'string');
  });
})
.then(function() {
  return client.objectAsync('refcount', key)
  .then(function(ret) {
    assert(ret === 1);
  });
})
.then(function() {
  return client.expireAsync(key, 3);
})
.then(function() {
  return client.pttlAsync(key);
})
.then(function(ret) {
  assert(ret > 2000);
})
.then(function() {
  return client.persistAsync(key)
  .then(function() {
    return client.pttlAsync(key)
    .then(function(ret) {
      assert(ret === -1);
    }); 
  });
})
.then(function() {
  return client.existsAsync(key)
  .then(function(ret) {
    assert(ret === 1);
  });
})
.then(function() {
  return client.expireatAsync(key, 10000);
})
.then(function() {
  return client.existsAsync(key)
  .then(function(ret) {
    assert(ret === 0);
  }); 
})
.then(function() {
  return client.setAsync(key, value)
  .then(function(ret) {
    console.log(ret);
    assert(ret === 'OK');
  })
  .then(function() {
      return client.existsAsync(key)
      .then(function(ret) {
        assert(ret === 1);        
      });    
  })
  .then(function() {
    return client.pexpireatAsync(key, Date.now()+10000)    
    .then(function() {
      return client.existsAsync(key)
      .then(function(ret) {
        assert(ret === 1);
      });
    });
  });
})
.then(function() {
  return client.dumpAsync(key)
  .then(function(ret) {
    //ttl = 0
    //FIXME ERR DUMP payload version or checksum are wrong
    // return client.restoreAsync(key, 0, ret, 'REPLACE');
  });
})
.finally(function() {
  client.delAsync(key)
  .then(function(ret) {
    assert(ret === 1);
  });
});