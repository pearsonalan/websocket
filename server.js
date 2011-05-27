#!/usr/bin/env node

var net = require('net');

var server = net.createServer(function (client) {
    var requestHeaders = "";
    console.log('accepted connection from ' + client.remoteAddress + ':' + client.remotePort);
    console.log(client);
    client.on('data', function (data) {
        console.log('received data: ' + data.toString());
        requestHeaders = requestHeaders + data.toString();
        parseRequestHeaders();
    });
    client.on('end', function () {
        console.log('client disconnected');
    });
    client.on('error', function (exception) {
        console.log('exception from client socket');
        console.log(exception);
    });
    
    function parseRequestHeaders() {
        var lines = requestHeaders.split('\n');
        console.log("headers has " + lines.length + " lines");
        lines.forEach(function (line) {
            console.log("LINE: " + line.trim());
        });
    }
});

var port = process.env.C9_PORT || 8124,
	host = '0.0.0.0';

server.listen(port, host);
console.log('listening at ' + host + ':' + port);
