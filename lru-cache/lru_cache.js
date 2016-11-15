var debug = require('debug')('lru-cache:lru_cache');
var inherits = require('util')._inherits;
var EventEmitter = require('event').EventEmitter;
var List = require('./list');
var Pool = require('./pool');


module.exports = LRUCache;

exports.create = function(config) {
  Pool.init(config.redisConfig);
  return new LRUCache(config);
};


/**
 * LRUCache List Default configure
 */
var DefaultConfig = {
  maxListCount: 10,
  maxListItemCount: 100
};


function LRUCache(options) {
  EventEmitter.call(this);
  this.listCount = 0;
  this.listQueue = {};
  this.client = Pool.alloc();
  this.maxListCount = options.maxListCount || DefaultConfig.maxListCount;
  this.maxListItemCount = options.maxListCount || DefaultConfig.maxListItemCount;
}

inherits(LRUCache, EventEmitter);

LRUCache.prototype.genListID = function() {
  var listId;
  var self = this;

  return this.client.incrAsync('lru:listID', 1)
  .then(function(id) {
    debug('genListID: %s', id);
    return id;
  })
  .then(function(id) {
    listId = 'listID:' + id;
    return self.client.saddAsync('lru:lists', listId);
  })
  .then(function() {
    return  listId;    
  });
};

LRUCache.prototype.createList = function(options) {
  var list;
  var listID;

  if(this.listCount >= this.maxListCount) {
    this.emit('error', new Error('To reach the limit of the number of lists'));
    return;
  }

  if(!options.maxListItemCount) {
    options.maxListItemCount = this.maxListItemCount;
  }

  listID = this.genListID();
  options.id = listID;
  list = new List(this);
  list.save(options);
  this.listCount++;
  this.listQueue[listID] = list;

  return list;
};

LRUCache.prototype.resetList = function(list) {
  debug('resetList:%s', list.getID());
  return;
};

LRUCache.prototype.destroyList = function(list) {
  var listID;
  
  listID = list.getID();
  debug('destroyList:%s', listID);

  if(!this.listQueue[listID]) {
    this.emit('error', new Error('Delete the no exists list: ' + listID));    
  }
  else {
    delete this.listQueue[listID];
  }

  return;
};

LRUCache.prototype.dump = function() {
  var listIDs = Object.keys(this.listQueue);

  return Promise.all(listIDs.map(function(list) {
    return list.dump();
  }))
  .then(function(data) {
    return data;
  });
};