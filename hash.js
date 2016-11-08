var client = require('./connect');
var assert = require('assert');
var Promise = require('bluebird');

client.hsetAsync('key1', 'field1', 'value1')
.then(function(ret) {
  return client.hgetAsync('key1', 'field1')
  .then(function(ret) {
    assert(ret === 'value1', 'hsetAsync failed.');
  });
})
.then(function() {
  return client.hexistsAsync('key1', 'field1')
  .then(function(ret) {
    assert(!!ret === true, 'field must exists.');    
  });
})
.then(function() {
  return client.hsetnxAsync('key1', 'field2', 3);
})
.then(function() {
  return client.hincrbyAsync('key1', 'field2', 3)
  .then(function() {
    return client.hgetAsync('key1', 'field2');
  })
  .then(function(ret) {
    assert(ret == 6);
  });
})
.then(function() {
  return client.hlenAsync('key1')
  .then(function(ret) {
    assert(ret === 2);
  });
})
.then(function() {
  return client.hkeysAsync('key1')
  .then(function(ret) {
    assert(ret.indexOf('field1') > -1);
    assert(ret.indexOf('field2') > -1);
  });
})
.then(function() {
  return client.hvalsAsync('key1')
  .then(function(ret) {
    assert(ret.indexOf('value1') > -1);
    assert(ret.indexOf('6') > -1);
  });
})
.then(function() {
  return client.hgetallAsync('key1')
  .then(function(ret) {
    assert('field1' in ret);
    assert('field2' in ret);
    assert(ret.field1 === 'value1');
    assert(ret.field2 === '6');
  });
})
.then(function() {
  return client.hincrbyfloatAsync('key1', 'field2', 0.3)
  .then(function() {
    return client.hgetAsync('key1', 'field2');
  })
  .then(function(ret) {
    assert(ret == 6.3);
  });
})
.then(function() {
  return client.hmgetAsync('key1', 'field1', 'field2')
  .then(function(ret) {
    assert(ret[0] === 'value1');
    assert(ret[1] === '6.3');
  });
})
.then(function() {
  return client.hmsetAsync('key1', 'field1', 'v1', 'field2', 'v2')
  .then(function() {
    return client.hgetallAsync('key1')
    .then(function(ret) {
      assert(ret.field1 === 'v1');
      assert(ret.field2 === 'v2');
    });
  });
})
.then(function() {
  return client.hscanAsync('key1', 0, 'MATCH', '*2', 'COUNT', 500)
  .then(function(ret) {
    console.dir(ret);
  });
})
.catch(function(err) {
  console.log(err);
})
.finally(function(err) {
  return Promise.join(
    client.hdelAsync('key1', 'field1'), 
    client.hdelAsync('key1', 'field2'),
    client.hdelAsync('key1', 'field3'))
  .then(function(ret) {
    return client.hlenAsync('key1');
  })
  .then(function(ret) {
    assert(ret === 0);
    console.log('hash finally done');
  });
});