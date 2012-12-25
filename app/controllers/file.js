
var debug       = require('debug')('express-fileshare')
  , GrowingFile = require('growing-mongofile');

module.exports = function(app, model) {

    var FileModel     = model.mongoose.model('File')
      , db            = model.mongo
      , clientIP      = app.libs.util.clientIP
      , Step          = app.libs.Step;

    var actions       = {};

    var fileIOUrl     = app.routes.io("file.socket");

    actions.upload = function(req, res, error) {
        var filesize  = req.form.fileInfo.filesize
          , filename  = req.form.fileInfo.filename;

        if(typeof filename !== "string" || filename.length > 255) {
            error('Invalid Filename');
            return;
        }
        
        var socketid = req.session.socketid;

        if(socketid == null) {
            error(new Error("socket not found"));
            return;
        }
        
        Step(
            function createFile() {
                var nextstep = this;
                var file = new FileModel({
                    originalname  : filename
                  , uploaderip    : clientIP(req)
                  , size          : filesize
                });
                file.save(function(err) {
                    if(err) {
                        error(err);
                        return;
                    }
                    nextstep(null, file);
                });
            },
            function createGridStore(err, file) {
                if(err) throw err;
                
                var nextstep = this;
                var servername = file.servername;
                var meta = {filesize: filesize, originalname: file.originalname};
                var gs = GrowingFile.createGridStore(app.libs.mongodb, db, servername, meta, function(err, gs) {
                    if(err || !gs) {
                        error(new Error('Error creating gridstore : '+(err && err.message)));
                        return;
                    }
                    nextstep(null, file);
                });
                
                req.form.speedTarget = 10 * 1000; //10MB/s

                var fileStatus = {
                    servername  : servername,
                    status      : file.status,
                    percent     : 0
                };
                
                function transferOver(err) {
                    fileStatus.status = file.status;
                    app.io.of(fileIOUrl).in(fileStatus.servername).emit('status', fileStatus);
                }

                var totalRead = 0;
                req.form.onChunk = function(data, callback) {
                    gs.write(data, function() {
                        totalRead += data.length;
                        var newProgress = Math.floor(100*totalRead/file.size);
                        if(newProgress > fileStatus.percent) {
                            fileStatus.percent = newProgress;
                            app.io.of(fileIOUrl).in(fileStatus.servername).emit('status', fileStatus);
                        }
                        callback();
                    });
                };
                
                req.form.on('close', function() {
                    gs.close(function(err, result) {
                        if(!res.headerSent) res.send('ok');
                        file.status = "Available";
                        file.save();
                        transferOver();
                    });
                });

                req.form.on('error', function(err) {
                    debug(err);
                    file.status = "Removed";
                    file.save();
                    transferOver(err);
                });

                req.form.on('aborted', function() {
                    debug('aborted');
                    gs.unlink(function(err) {
                        file.status = "Removed";
                        file.save();
                        transferOver(err);
                    });
                });
            },
            function start(err, file) {
                if(err) throw err;
                
				var nextstep = this;
                req.form.read();
                debug("uploading "+file.originalname+ " (size : "+file.size+")");
                nextstep(null, file);
            },
            function announceFile(err, file) {
                if(err) throw err;
                
                //TODO: watch in socket.io for a scalable version of getting a socket by its id
				app.io.of(fileIOUrl).socket(socketid).json.emit("new file", file.publicFields());
            },
            function showError(err) {
                debug(err);
				error(err);
			}
        );
        
    };
    

    actions.download = function(req, res, error) {
        var servername = req.params.servername;
        var filenameRequested = req.params.filename;
        
        if(typeof servername !== "string" || servername.length > 16) {
            error('Invalid file ID');
            return;
        }
        
        Step(
            function findFile() {
                var nextstep = this;
                FileModel.findOne({servername: servername}, function(err, file) {
	                if(err || !file) {
	                    error(err || new Error('File not found'));
	                    return;
	                }
	                if(file.status == 'Removed') {
	                    error(new Error("File has been removed !"));
	                    return;
	                }
                    if(file.originalname != filenameRequested) {
                        error(new Error("File Not found !"));
                        return;
                    }
	                nextstep();
                });
            },
            function openFile(err) {
                if(err) throw err;
                
                var nextstep = this;
                GrowingFile.open(app.libs.mongodb, db, servername, null, function(err, gf) {
	                if(err || !gf) {
	                    error(err || new Error('GrowingFile not found'));
	                    return;
	                }
	                nextstep(null, gf);
                });
            },
            function sendFile(err, gf) {
                if(err) throw err;
                
                var filename = gf.originalname;
                var filesize = gf.filesize;
                res.contentType(filename);
                res.header('Content-Length', filesize);
                gf.pipe(res);
            }
        );
        
    };

    actions.socket = function(socket) {
        var hs      = socket.handshake
          , sroomid = null;
        
        hs.session.socketid = socket.id;
        hs.session.save();
        
        socket.on('file watch', function(fileid) {
            FileModel
            .findOne({'servername': fileid})
            .exec(function(err, file) {
                if(err || !file) {
                    return;
                }
                if(file.status == 'Uploading') {
                    socket.join(fileid);
                } else {
                    socket.emit("status", file.publicFields());
                }
            });
        });

        socket.on('file unwatch', function(fileid) {
            socket.leave(fileid);
        });

    };

    return actions;
    
}
