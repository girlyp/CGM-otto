'use strict';

var browserStorage = [];

var localstorage = {
      get: function Get(item) {
        return browserStorage[item] || null;
    }
    , getItem: function Get(item) {
        return browserStorage[item] || null;
    }
    , set: function Set(item, value) {
        browserStorage[item] = value;
    }
    , setItem: function Set(item, value) {
        browserStorage[item] = value;
    }
    , remove: function Remove(item) {
        delete browserStorage[item];
    }
    , removeItem: function Remove(item) {
        delete browserStorage[item];
    }
    , removeAll: function RemoveAll() {
        browserStorage = [];
    }
};

module.exports = localstorage;