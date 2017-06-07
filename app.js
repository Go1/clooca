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

const { app, BrowserWindow, Menu } = require('electron');

let window;

function createWindow() {
    window = new BrowserWindow();
    window.loadURL('http://localhost:3000/');
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