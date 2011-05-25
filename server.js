#!/usr/bin/env node

var net = require('net');

var server = net.createServer(function (c) {
  c.write('hello\r\n');
  c.pipe(c);
});

var port = process.env.C9_PORT || 8124;

server.listen(port, '0.0.0.0');
