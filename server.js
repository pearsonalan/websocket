#!/usr/bin/env node

var net = require('net'),
    ParserFactory = require("./ParserFactory");

var server = net.createServer(function (client) {
    
    console.log('accepted connection from ' + client.remoteAddress + ':' + client.remotePort);
    console.log(client);

    var parser = ParserFactory.makeParser();
    
    client.on('data', function (chunk) {
        console.log('received ' + chunk.length + ' bytes data');
        parser.process(chunk);
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
        
        var m = requestHeaders.match(/\n\n/);
        console.log("Match 2 newlines = " + JSON.stringify(m));
        m = requestHeaders.match(/\r\n\r\n/);
        console.log("Match 2 crlf = " + JSON.stringify(m));
        
        var previdx = 0;
        var re = /\r\n/g;
        while ((m = re.exec(requestHeaders)) !== null) {
            console.log("MATCH: " + JSON.stringify(m));
            var h = requestHeaders.substring(previdx, m.index);
            console.log("   h = '" + h + "'");
            if (m.index === previdx) {
                console.log("Blank line marks end of headers");
            }
            previdx = m.index + m[0].length;
        }
    }
});

var port = process.env.C9_PORT || 8124,
	host = '0.0.0.0';

server.listen(port, host);
console.log('listening at ' + host + ':' + port);
