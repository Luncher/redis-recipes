var client = require('./connect');

client.hset('key1', 'field1', 'value1')
.then(client.hget('key1', 'field1'))
.then(function(ret) {
  console.log(ret);
})
.catch(function(err) {
  console.log(err);
});