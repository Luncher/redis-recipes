var debug = require('debug')('lru-cache:list');
var inherits = require('util')._inherits;
var Promise = require('bluebird');
var Pool = require('./pool');
var EventEmitter = require('event').EventEmitter;


module.exports = List;

function List(lru, options) {
  this.lru = lru;
  this.client = Poool.alloc();
}

List.prototype.save = function(options) {
  this.id = options.id;  
  this.title = options.title || 'list-title';
  this.maxListItemCount = options.maxListItemCount;

  if(options.data) {
    options.data = JSON.stringify(options.data);
  }
  options.createAt = Date.now();

  return this.client.hmsetAsync(this.id + ':options', options);
};

List.prototype.getOption = function(field) {
  return this.client.hgetAsync(this.id + ':options', field)
  .then(function(ret) {
    if(field === 'data') {
      return JSON.parse(ret);
    }
    else {
      return ret;
    }
  });
};

List.prototype.setOption = function(field, value) {
  if('data' === field) {
    value = JSON.stringify(value);
  }

  return this.client.hsetAsync(this.id + ':options', field, value);
};

List.prototype.setTitle = function(title) {
  return this.setOption('title', title);
};

List.prototype.getTitle = function() {
  return this.getOption('title');
};

List.prototype.setMaxItemCount = function(maxCount) {
  this.maxListItemCount = maxCount;

  return this;
};

List.prototype.toJSON = function() {
  var self = this;

  return this.client.hgetallAsync(this.id + ':options')
  .then(function(ret) {
    if(ret.maxListItemCount) {
      ret.maxListItemCount = self.maxListItemCount;
    }

    if(ret.data) {
      ret.data = JSON.parse(ret.data);
    }

    ret.id = self.id;
    ret.count = self.count;

    return ret;
  });
};

List.prototype.genListItemID = function() {
  var itemId;
  var self = this;

  return this.client.incAsync(this.id + ':list-itemID', 1)
  .then(function(id) {
    debug('genListItemID: %s', id);
    return id;
  })
  .then(function(id) {
    itemId  =  'itemID:' + id;
    return self.client.lpushAsync(self.id + ':list-ids', itemId);
  })
  .then(function() {
    return itemId;
  });
};


List.prototype.popLatestUsedItem = function() {
  var itemId;
  var self = this;
    
  return self.client.zrangeAsync(self.id + ':list-items', 0, 0)
  .then(function(ret) {
    var itemId = ret[0];

    return Promise.join(
      self.client.zremrangebyrankAsync(self.id + ':list-items', 0, 0),
      self.client.lremAsync(self.id + ':list-ids', 0, itemId),
      self.client.delAsync(itemId)
    )
    .then(function(ret1, ret2, ret3) {
      assert(ret1 === 1, 'zremrangebyrankAsync must return 1');
      assert(ret2 === 1, 'lremAsync must return 1');
      assert(ret3 === 1, 'hdelAsync must return 1');
      self.count--;
    });
  });
};

List.prototype.add = function(data) {
  var itemId;
  var self = this;

  return Promise.resolve()
  .then(function() {
    if(self.count >= self.maxListItemCount) {
      return self.popLatestUsedItem();
    }
    self.count++;
  })
  .then(function() {
    return self.genListItemID()
    .then(function(id) {
      itemId = id;
      return self.client.zaddAsync(self.id + ':list-items', 1, id);
    })
    .then(function() {
      return self.client.hmsetAsync(id, data);
    });
  })
  .then(function() {
    return itemId;
  });
};

List.prototype.peek = function(id) {
  return this.client.hgetAllAsync(id);
};

List.prototype.exists = function(id) {
  return Promise.join(
    this.client.existsAsync(id),
    this.client.typeAsync(id)
  )
  .then(function(exists, type) {
    return exists && type === 'hash';
  });
};

List.prototype.get = function(id) {
  var self = this;

  return this.exists(id)
  .then(function(exists) {
    if(!exists) {
      throw new Error('not found list item: ' + id);
    }
    return self.client.zincrbyAsync(self.id + ':list-items', 1, id);
  })
  .then(function() {
    return self.client.hgetallAsync(id);
  });
};

List.prototype.getByIteratee = function(iteratee, onDone) {
  var self = this;

  this.iterateList(function(id, data) {
    if(iteratee(data)) {
      self.client.zincrbyAsync(self.id + ':list-items', 1, id);      
      onDone(null, id, data);
      return true;
    }
  }, function() {
    onDone(new Error('not found'));
  });
};

List.prototype.iterateList = function(iteratee, onDone) {
  var self = this;

  function doIterator(cursor) {
    self.client.zscan(self.id + ':list-items', cursor, function(err, ret) {
      var itemId;
      var props = {};

      ret.data.forEach(function(it) {
        props[it.key] = self.hgetallAsync(it.key);
      });

      Promise.props(props)
      .then(function(rets) {
        return Object.keys(rets)
        .some(function(id) {
          return iteratee(null, id, rets[id]);
        });
      })
      .then(function(match) {
        if(ret.cursor !== 0 && !match) {
          doIterator(ret.cursor);      
        }
        else {
          onDone();
        }
      });
    });
  }

  doIterator(0);

  return;
};

List.prototype.destroy = function(onDone) {
  var self = this;

  self.client.hdel(self.id + ':options', function(err, ret) {
    var listPromises = [];
    
    self.iterateList(function(id, data) {
      listPromises.push(self.client.delAsync(id));
    }, function() {
      listPromises.push(self.client.delAsync(self.id + ':list-ids'));
      listPromises.push(self.client.delAsync(self.id + ':list-items'));

      Promise.all(listPromises)
      .then(function() {
        self.lru.destroyList(self);
        onDone();
      })
      .catch(function(err) {
        onDone(err);
      });
    });
  });

  return;
};

List.prototype.dump = function() {
  return Promise.props({
    profile: this.toJSON(),
    items:  this.client.lrangeAsync(this.id + ':list-ids'),
    options: this.client.hgetallAsync(this.id + ':options')
  })
  .then(function(data) {
    return data;
  });
};