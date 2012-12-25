
function runFileClient(app) {
  
    var client = io.connect('/file');

    client.on('new file', app.showFile);
    
    client.on("status", function(file) {
        if(file.percent == 100) {
            app.unwatchFile(file);
        }
        app.updateFileStatus(file);
    });

    app.watchFile = function(file) {
    	client.emit('file watch', file.servername);
    };

    app.unwatchFile = function(file) {
    	client.emit('file unwatch', file.servername);
    };
    
}

