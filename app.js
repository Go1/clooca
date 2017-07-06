#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var nopt = require("nopt");
var express = require('express');
var bodyParser = require('body-parser');
var loader = require('./lib/server/core/pluginLoader');
var ejs = require('ejs');
var ccRestMiddleware = require('./lib/server/core/cc/rest');
var registry = require('./lib/common/core/registry');

var CloocaModule = require('./lib/server/core/clooca');

var loadSettings = require('./lib/server/core/settingsLoader');

var knownOpts = {
    "settings": [path],
    "plugin": [path],
    "port": Number,
    "help": Boolean
};
var shortHands = {
    "s": ["--settings"],
    "pl": ["--plugin"],
    "p": ["--port"],
    "?": ["--help"]
};

nopt.invalidHandler = function(k, v, t) {}

var parsedArgs = nopt(knownOpts, shortHands, process.argv, 2)

var settings = loadSettings(parsedArgs);

//load plugins
var pluginPath = parsedArgs.plugin || settings.pluginPath || path.join(settings.userDir, "./plugins");
var plugins = loader.load(pluginPath);
var corePlugins = loader.load(path.resolve(__dirname, './plugins'));
plugins = plugins.concat(corePlugins);

var cloocaapp = express();
cloocaapp.use(bodyParser.json({}));
cloocaapp.use('/', express.static(path.resolve(__dirname, "dist")));
cloocaapp.set('views', path.join(__dirname, 'views'));
cloocaapp.engine('ejs', ejs.renderFile);

cloocaapp.get('/plugins', function(req, res) {
    res.json(plugins.map(function(plugin) {
        return plugin.name;
    }))
});

cloocaapp.get('/plugins/:name/js', function(req, res) {
    var name = req.params.name;
    var target = plugins.filter(function(plugin) {
        return plugin.name == name;
    })[0];
    fs.readFile(path.join(target.path, "bundle.js"), function(err, data) {
        res.setHeader('Content-Type', 'text/script')
        res.send(data);
    });
});

cloocaapp.get('/plugins/:name/css', function(req, res) {
    var name = req.params.name;
    var target = plugins.filter(function(plugin) {
        return plugin.name == name;
    })[0];
    fs.readFile(path.join(target.path, "style.css"), function(err, data) {
        res.setHeader('Content-Type', 'text/css')
        res.send(data);
    });
});

cloocaapp.get('/plugins/:name/html', function(req, res) {
    var name = req.params.name;
    res.render('plugin.ejs', {
        name: name
    })
});

cloocaapp.get('/cc/:moduleName/:methodName', ccRestMiddleware());

cloocaapp.listen(process.env.PORT || 3000);

/**
 * Module dependencies.
 */

var api_app = require('./metaindex-api/api_app');
var debug = require('debug')('metaindex-api:server');
var http = require('http');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '4567');
api_app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(api_app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}


const { app, BrowserWindow, Menu } = require('electron');

let window;

function createWindow() {
    window = new BrowserWindow();
    window.loadURL('http://localhost:3000/');

    // デバッグモードで起動された場合のみ、デベロッパーツールを表示
    if (process.argv.indexOf('debug')>=0) {
        window.webContents.openDevTools();
    }

    window.on('closed', function() {
        win = null;
    });
}

app.on('ready', function() {
    Menu.setApplicationMenu(menu);
    createWindow();
});

app.on('window-all-closed', function() {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

app.on('activate', function() {
    if (window == null) {
        createWindow();
    }
});


var template = [{
    label: "Clooca",
    submenu: [
        { label: "About Clooca", selector: "orderFrontStandardAboutPanel:" },
        { type: "separator" },
        { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); } }
    ]
}, {
    label: "Edit",
    submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]
}];

var menu = Menu.buildFromTemplate(template);

registry.addModule('clooca', new CloocaModule(settings));