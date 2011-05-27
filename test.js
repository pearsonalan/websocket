#!/usr/bin/env node

var ParserFactory = require("./ParserFactory");

var parser;

console.log("TEST parsing one buffer");
parser = ParserFactory.makeParser();
parser.process(new Buffer("GET / HTTP/1.1\r\nContent-Type: x-application/www-encoded\r\nContent-Length: 120\r\nCookie: this is a cookie\r\n\r\n"));


console.log("TEST parsing buffer in chunks");
parser = ParserFactory.makeParser();
parser.process(new Buffer("GET / HTTP/1.1"));
parser.process(new Buffer("\r\nContent-Type: x-application/www-encoded\r\n"));
parser.process(new Buffer("Content-Length: 120\r"));
parser.process(new Buffer("\nCookie: this i"));
parser.process(new Buffer("s a cookie\r"));
parser.process(new Buffer("\n\r"));
parser.process(new Buffer("\n"));

console.log("Parser headers = " + JSON.stringify(parser.headers));
