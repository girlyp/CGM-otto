'use strict';

var find_options = require('./query');

function storage (collection, ctx) {
  var ObjectID = require('mongodb').ObjectID;

  function create(obj, fn) {
    if (! obj.hasOwnProperty('created_at')){
      obj.created_at = (new Date()).toISOString();
    }
    api().insert(obj, function (err, doc) {
      if (err != null && err.message) {
        console.log('Error inserting the device status object', err.message);
        fn(err.message, null);
        return;
      }
      fn(null, doc.ops);
      ctx.bus.emit('data-received');
    });
  }

  function last(fn) {
    return list({count: 1}, function (err, entries) {
      if (entries && entries.length > 0) {
        fn(err, entries[0]);
      } else {
        fn(err, null);
      }
    });
  }

  function query_for (opts) {
    return find_options(opts, storage.queryOpts);
  }

  function list(opts, fn) {
    // these functions, find, sort, and limit, are used to
    // dynamically configure the request, based on the options we've
    // been given

    // determine sort options
    function sort ( ) {
      return opts && opts.sort || {created_at: -1};
    }

    // configure the limit portion of the current query
    function limit ( ) {
      if (opts && opts.count) {
        return this.limit(parseInt(opts.count));
      }
      return this;
    }

    // handle all the results
    function toArray (err, entries) {
      fn(err, entries);
    }

    // now just stitch them all together
    limit.call(api( )
        .find(query_for(opts))
        .sort(sort( ))
    ).toArray(toArray);
  }

  function remove (opts, fn) {
    return api( ).remove(query_for(opts), fn);
  }

  function api() {
    return ctx.store.collection(collection);
  }

  api.list = list;
  api.create = create;
  api.query_for = query_for;
  api.last = last;
  api.remove = remove;
  api.aggregate = require('./aggregate')({ }, api);
  api.indexedFields = [
    'created_at'
    , 'NSCLIENT_ID'
  ];
  return api;
}

storage.queryOpts = {
  dateField: 'created_at'
};

module.exports = storage;
