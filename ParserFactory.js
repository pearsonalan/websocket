var ParserFactory = (function() {
    var machine;
    var StateMachine = {
        STATUS_LINE : [
            {
                regexp: /[^\r\n]/,
                next: "STATUS_LINE",
                trans: function (c) {
                    this.statusline += c;
                }
            },
            {
                regexp: /\r/,
                next: "STATUS_EOL1",
                trans: function (c) {
                    console.log("STATUSLINE: " + this.statusline);
                }
            }
        ],
    
        STATUS_EOL1 : [
            {
                regexp: /\n/,
                next: "STATUS_EOL2"
            }
        ],
    
        STATUS_EOL2 : [
            {  
                regexp: /\w/,
                next : "LABEL",
                trans : function (c) {
    //                console.log("in trans function for LABEL -> LABEL: char = " + c);
                    this.header += c;
                }
            }
        ],
    
        LABEL : [
            {  
                regexp: /[\w\-]/,
                next : "LABEL",
                trans : function (c) {
    //                console.log("in trans function for LABEL -> LABEL: char = " + c);
                    this.header += c;
                }
            },
    
            {
                regexp: /:/,
                next : "COLON"
            }
        ],

        COLON: [
            {
                regexp: /\s/,
                next: "SPACE"
            }
        ],
    
        SPACE: [
            {
                regexp: /[\t ]/,
                next: "SPACE"
            },
            {  
                regexp: /[^\t ]/,
                next : "VALUE",
                trans : function (c) {
    //                console.log("in trans function for SPACE -> VALUE: char = " + c);
                    this.value += c;
                }
            }
        ],
    
        VALUE: [
            {  
                regexp: /[^\r\n]/,
                next : "VALUE",
                trans : function (c) {
    //                console.log("in trans function for VALUE -> VALUE: char = " + c);
                    this.value += c;
                }
            },
            {
                regexp: /\r/,
                next: "EOL1",
                trans : function (c) {
    //                console.log("in trans function for EOL1 -> LABEL: char = " + JSON.stringify(c));
                    console.log("GOT HEADER: " + this.header + " = " + this.value );
                    this.headers[this.header] = this.value;
                    this.header = "";
                    this.value = "";
                }
            }
        ],

        EOL1: [
            {
                regexp: /\n/,
                next: "EOL2"
            }
        ],
    
        EOL2: [
            {
                regexp: /\r/,
                next: "EOH1"
            },
            {  
                regexp: /\w/,
                next : "LABEL",
                trans : function (c) {
    //                console.log("in trans function for EOL2 -> LABEL: char = " + c);
                    this.header += c;
                }
            }
        ],
    
        EOH1: [
            {
                regexp: /\n/,
                next: "EOH2"
            }
        ],
    
        EOH2: [
            {
                regexp: /^/,
                next: "FINISH"
            }
        ],
    
        FINISH: [
        ]
    };
    
    function buildStateMachine(states) {
        var machine = {};
        Object.keys(states).forEach(function (state) {
//            console.log("Building state function for " + state);
            var transitions = states[state];
//            console.log("Transitions = " + JSON.stringify(transitions));
            machine[state] = function(c) {
//                console.log("STATE " + state + ": input = " + JSON.stringify(c)); 
                for (var i = 0; i < transitions.length; ++i) {
                    var t = transitions[i];
                    if (t.regexp.test(c)) {
//                        console.log("MATCH transition to " + t.next);
                        return t;
                    }
                }
            };
        });
        
        return machine;
    }
    
    machine = buildStateMachine(StateMachine);
    
    var parserProto = {
        initialize: function(p) {
//            console.log("In parser initializer");
            this.state = "STATUS_LINE";
            this.statusline = "";
            this.header = "";
            this.value = "";
            this.headers = {};
        },

        processChar: function(c) {
//            console.log("process char " + JSON.stringify(c));
            statefn = machine[this.state];
            if (statefn === undefined) {
                console.log("ERROR: no state function for " + this.state);
                return false;
            }
            var t = statefn(c);
            if (t !== undefined) {
                this.state = t.next;
                if (t.trans !== undefined) {
                    t.trans.call(this,c);
                }
                return true;
            } else {
                console.log("Went into ERROR state. No transition for " + this.state + " on " + JSON.stringify(c));
                this.state = undefined;
                return false;
            }
        },
        
        process: function(buffer) {
            for (var i = 0; i < buffer.length; ++i) {
                var c = buffer[i];
                if (!this.processChar(String.fromCharCode(c))) {
                    break;
                }
            }
        }
    };

    return {
        makeParser: function() {
//            console.log("In ParserFactory.makeParser");
            var o = Object.create(parserProto);
            o.initialize.apply(o,arguments);
            return o;
        }
    };
    
}());

exports.makeParser = ParserFactory.makeParser;
