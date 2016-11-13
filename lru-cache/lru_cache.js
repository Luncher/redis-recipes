var inherits = require('util')._inherits;
var EventEmitter = require('event').EventEmitter;
var List = require('./list');
var Item = require('./item');


exports.create = function() {
  return new LRUCache();
};

function LRUCache(options) {
  EventEmitter.call(this);
}

inherits(LRUCache, EventEmitter);


LRUCache.prototype.createList = function() {

};

