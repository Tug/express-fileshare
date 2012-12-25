
$(document).ready(function() {

    var app = {
	    UP_URL              : '/upload',
        DOWN_URL            : '/download/',
        ORIGIN              : document.location.origin,
		fileList            : $('#fileList'),
        browseButton        : $('#upFile'),
        fileUrl             : $('#fileUrl'),
        currentFileBox      : $('#currentFile'),
        uploadedFileBox     : $('#uploadedFile'),
        
        showFile: function(file) {
            if(file.status == 'Removed') return;
            file.url = app.DOWN_URL+file.servername+'/'+encodeURIComponent(file.originalname);
            var msg ='<input type="text" class="urlInput" value="'+app.ORIGIN+file.url+'"> '
                    +readableSize(file.size)+' - '
                    +'<span id="c'+file.servername+'status">'
                    + file.status
                    +'</span> '
                    +'<span id="c'+file.servername+'progress">'
                    +'</span>';
            app.currentFileBox.html(msg);
            app.watchFile(file);
        },

        updateFileStatus: function(file) {
            $('#c'+file.servername+'status').html(file.status);
            if(file.status == 'Uploading' && file.percent >= 0) {
                $('#c'+file.servername+'progress').html(file.percent+'%');
            } else {
                $('#c'+file.servername+'progress').html('');
            }
            if(file.status == 'Removed') {
                $('#c'+file.servername+'link').removeAttr('href');
            }
        }

    };

    runFileClient(app);
    loadUploader(app);

})

function readableSize(size) {
    if(size == null) return 'unknown';
    var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = 0;
    while(size >= 1024) {
        size /= 1024;
        ++i;
    }
    return size.toFixed(1) + ' ' + units[i];
}
