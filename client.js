var CLIENT = (function () {
    var socket;
    
    function open() {
        console.log("Opening socket");
        socket = new WebSocket('ws://localhost:8124/sockettest');
        socket.onopen = function () {
            console.log("Socket openened");
            setTimeout(function() {
                console.log("sending data");
                socket.send("hello");
            }, 1000);
        };
        socket.onmessage = function () {
            console.log("received socket message");
        };
        socket.onclose = function () {
            console.log("Socket closed");
        };
        socket.onerror = function () {
            console.log("Socket error");
        };
    }
    
    return {
        open: open
    };
}());


var UI = (function () {
    function init() {
        console.log("UI.init");
        var el = document.getElementById("openButton");
        el.addEventListener("click", CLIENT.open, false);
    }

    console.log("Adding DOMContentLoaded listener");
    document.addEventListener("DOMContentLoaded",init,false);
}());
