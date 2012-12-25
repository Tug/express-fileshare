
# Express-fileshare

Express fileshare is a node.js file sharing application.
File stream is available for everyone to download as soon as the upload starts.
Files are stored in MongoDB/GridFS.

## Requirements
* Node.js >= v0.6.2
* MongoDB and Redis installed and running.

## Installation
* git clone git://github.com/Tug/express-fileserver.git
* cd express-fileserver
* npm install .

## Configuring
The config.json file will overwrite properties definied in config.js. Edit it to set your configuration properties such as database host, port, username, password, etc.


## Running
* node app
or
* node app myconfig.js
