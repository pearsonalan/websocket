#!/usr/bin/env node

var connect = require('connect');
var socketio = require('socket.io');

var port = process.env.C9_PORT || 4000,
    host = '0.0.0.0';

var blog = connect(
    connect.router(function(app){
        app.get('/', function(req, res){
          res.end('list blog posts. try /post/0');
        });

        app.get('/post/:id', function(req, res){
            res.end('got post ' + req.params.id);
        });
    })
);

var server = connect();

server.use(connect.logger());
server.use(connect.static(__dirname + '/public', { maxAge: 0 }));
server.use("/blog",blog);
server.use(function(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.end('<html><head></head><body>default</body></html>');
});


server.listen(port);
console.log("Server listening on port " + port);

console.log(server);

var io = socketio.listen(server),
    buffer = [];
  
io.on('connection', function(client) {
    client.send({ buffer: buffer });
    client.broadcast({ announcement: client.sessionId + ' connected' });

    client.on('message', function(message) {
        var msg = { message: [client.sessionId, message] };
        buffer.push(msg);
        if (buffer.length > 15) {
            buffer.shift();
        }
        client.broadcast(msg);
    });

    client.on('disconnect', function() {
        client.broadcast({ announcement: client.sessionId + ' disconnected' });
    });
});

