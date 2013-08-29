
var upm = require('upload-middleware');

module.exports = function(app) {

    var express = app.libs.express;
    
    return {
        urls : [
            ["/",                     "index.index",          "get"  ],
            ["/upload",               "file.upload",          "post" , [upm.upload, "session.load"],
                                                                       [upm.errorHandler] ],
            ["/download/:servername/:filename","file.download","get"  ],
        ]
        
      , ios : [
            ["/file",                 "file.socket",          "on.connection"   ],
        ]
    };

}

