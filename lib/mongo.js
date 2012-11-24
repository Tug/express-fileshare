
var mongodb         = require('mongodb')
  , mongoose        = require('mongoose')
  , Db              = mongodb.Db
  , Server          = mongodb.Server
  , ReplSetServers  = mongodb.ReplSetServers
  , debug           = require('debug')('express-chat');

exports.autoload = function(model, mongoConfig, callback) {
    
    if( mongoConfig.options
        && mongoConfig.options.db
        && mongoConfig.options.db.safe
        && mongoConfig.options.db.safe.w == 'all' ) {
        mongoConfig.options.db.safe.w = mongoConfig.servers.length;
    }
    
    var connStr = 'mongodb://'+mongoConfig.servers.join(',')
    mongoose.connect(connStr, mongoConfig.options, function () {
        debug('Connected to MongoDB!');
        model.mongoose = mongoose.connection;
        model.mongo = model.mongoose.db;
        callback && callback(null, model.mongo);
    });

}
