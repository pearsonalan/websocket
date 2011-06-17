#!/usr/bin/env node

var net = require('net'),
    crypto = require('crypto'),
    ParserFactory = require("./ParserFactory");

var server = net.createServer(function (client) {
    
    console.log('accepted connection from ' + client.remoteAddress + ':' + client.remotePort);
    console.log(client);

    var parser = ParserFactory.makeParser(),
        handshakeComplete = false;
    
    function extractKeyInfo(key) {
        var number = 0, spaces = 0;
        for (var i = 0; i < key.length; i++) {
            var ch = key.charCodeAt(i);
            if (ch === 0x20) {
                spaces++;
            } else if (0x30 <= ch && ch <= 0x39) {
                number = (number * 10) + (ch - 0x30);
            }
        }
        return {
            number: number,
            spaces: spaces
        };
    }
    
    function toBytes(n) {
        var bytes = [];
        while (n > 0) {
            var b = n % 256;
            n = Math.floor(n / 256);
            bytes.unshift(b);
        }
        while (bytes.length < 4) {
            bytes.unshift(0);
        }
        return bytes;
    }
    
    function writeBytesToBuffer(bytes,buffer,start,len) {
        for (var i = 0; i < len; i++) {
            buffer[start + i] = bytes[i];
        }
    }
    
    var hexchars = "0123456789ABCDEF";
    function toHexByte(b) {
        return hexchars[b >> 4] + hexchars[b % 16];
    }
    
    function toHex(buffer) {
        var resp = "";
        for (var i = 0; i < buffer.length; i++) {
            resp = resp + (i > 0 ? " " : "") + toHexByte(buffer[i]);
        }
        return resp;
    }
    
    function makeChallenge(key1,key2,body) {
        // for each key, the spaces needs to be non-zero
        if (key1.spaces === 0 || key2.spaces === 0) {
            console.log("invalid Sec-WebSocket-Key data");
            return;
        }
        
        [key1,key2].forEach(function (k) {
            k.part = k.number / k.spaces;
            k.bytes = toBytes(k.part);
        });
        
        console.log("KEY 1 = " + JSON.stringify(key1));
        console.log("KEY 2 = " + JSON.stringify(key2));
        
        var buffer = new Buffer(16);
        writeBytesToBuffer(key1.bytes,buffer,0,4);
        writeBytesToBuffer(key2.bytes,buffer,4,4);
        writeBytesToBuffer(body,buffer,8,8);
        
        return buffer;
    }
    
    function makeResponse(challenge) {
        var m = crypto.createHash('md5');
        m.update(challenge);
        return m.digest("binary");
    }
    
    client.on('data', function (chunk) {
        console.log('received ' + chunk.length + ' bytes data');
        
        if (!handshakeComplete) {
            parser.process(chunk);
            
            if (parser.isComplete() && parser.body.length === 8) {
                console.log("REQUEST Headers: " + JSON.stringify(parser.headers));
                console.log("BODY Length: " + (parser.body === undefined ? 0 : parser.body.length));
                console.log("BODY: " + toHex(new Buffer(parser.body)));
                var key1 = extractKeyInfo(parser.headers["Sec-WebSocket-Key1"]),
                    key2 = extractKeyInfo(parser.headers["Sec-WebSocket-Key2"]);
                    
                console.log("KEY 1 = " + JSON.stringify(key1));
                console.log("KEY 2 = " + JSON.stringify(key2));
                
                var challenge = makeChallenge(key1,key2,parser.body);
                console.log("Challenge = " + toHex(challenge));
                var response = makeResponse(challenge);
                console.log("Response length = " + response.length);
                console.log("Response = " + toHex(new Buffer(response,"binary")));
                
                var resp =  "HTTP/1.1 101 WebSocket Protocol Handshake\r\n" +
                            "Connection: Upgrade\r\n" + 
                            "Upgrade: WebSocket\r\n" + 
                            "Sec-WebSocket-Location: ws://localhost:8124/sockettest\r\n" +
                            "Sec-WebSocket-Origin: " + parser.headers.Origin + "\r\n" +
                            "\r\n";
                    
                console.log("Writing response:" + resp);
                
                client.write(resp);
                client.write(new Buffer(response,"binary"));
                
                handshakeComplete = true;
            }
        } else {
            console.log("DATA:" + toHex(chunk));
            console.log(chunk);
            var b = new Buffer(" Hello back at you! ");
            b[0] = 0x00;
            b[b.length - 1] = 0xff;
            client.write(b);
            
            setInterval(function () {
                var b = new Buffer(" Yo, dude! ");
                b[0] = 0x00;
                b[b.length - 1] = 0xff;
                client.write(b);
            }, 5000);
                
        }
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
