
var crypto  = require('crypto');

module.exports = function(app) {

    var Step = app.libs.Step;
    
    var randomString = function(strlen) {
      strlen = strlen || 8;
	    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	    var randstr = '';
	    for (var i=0; i<strlen; i++) {
		    var rnum = Math.floor(Math.random() * chars.length);
		    randstr += chars.substring(rnum,rnum+1);
	    }
	    return randstr;
    }

    var cast = function(obj, SubClass) {
      for(var key in SubClass.prototype)
        if(SubClass.prototype.hasOwnProperty(key))
          obj[key] = SubClass.prototype[key];
    };

    var clone = function (obj) {
        if(obj == null || typeof(obj) != 'object')
            return obj;
        var temp = obj.constructor();
        for(var key in obj)
            temp[key] = clone(obj[key]);
        return temp;
    }

    var find = function(arr, el) {
      if(el instanceof Object) {
        var strel = JSON.stringify(el);
        for(var i=0; i<arr.length; i++)
          if(JSON.stringify(arr[i]) == strel)
            return i;
      } else {
        for(var i=0; i<arr.length; i++)
          if(arr[i] == el)
            return i;
      }
      return -1;
    }

    var array_intersect_key_value = function(arr1, arr2) {
      var out = {};
      for(var i in arr2) {
        var key = arr2[i];
        out[key] = arr1[key];
      }
      return out;
    }

    var arrayChain = function (arr, func, callback) {
      var actions = arr.map(function(el) { return function() { func(el) }; });
      actions.push(callback);
      Step.apply(this, actions);
    }

    var md5 = function(plaintext) {
      return crypto.createHash("md5").update(""+plaintext).digest('hex');
    }

    var clientIP = function(req) {
      var ip_address = null;
      try {
        ip_address = req.headers['x-forwarded-for'];
      } catch(error) {
        ip_address = req.connection.remoteAddress;
      }
      if(ip_address == null) ip_address = "127.0.0.1";
      return ip_address;
    }

    var retryAsync = function(func, num, errorCallback) { 
      var actions = [];
      for(var i=0; i<num; i++) actions.push(func);
      actions.push(errorCallback);
      Step.apply(null, actions);
    }

    return {
        randomString              : randomString
      , cast                      : cast
      , find                      : find
      , clone                     : clone
      , array_intersect_key_value : array_intersect_key_value
      , arrayChain                : arrayChain
      , md5                       : md5
      , clientIP                  : clientIP
      , retryAsync                : retryAsync
    };
}


