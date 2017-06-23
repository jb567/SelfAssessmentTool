/**
 * Made by Kristian Hansen and Sanjay Govind
 */

const codeDisplay = ace.edit("code-output-display");
const userInput = ace.edit("user-input-box");
if (localStorage.config_invert) {
    invert();
}
codeDisplay.setReadOnly(true);
ace.require("ace/ext/language_tools");
userInput.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true
});
userInput.setWrapBehavioursEnabled(false);
codeDisplay.setWrapBehavioursEnabled(false);
const autocompleter = {
    getCompletions: function(editor, session, pos, prefix, callback) {
        if (file === null) return;
        let files = [];
        if (multi) {
            for (const file in multi) {
                const fname = multi[file].fileName;
                files.push({file:fname,code:localStorage[fname]});
            }
        } else {
            files.push({file:orig,code:userInput.getValue()});
        }
        $.post("/autocomplete",JSON.stringify({file:file,code:userInput.getValue(),line: pos.row, col: pos.column,files: files}),function(data) {
            callback(null, JSON.parse(data));
        });
    }
};
userInput.completers = [autocompleter];
let lastMillis = new Date().getTime();
let lastTimeout;
userInput.getSession().on('change', function() {
    localStorage.setItem(file,userInput.getValue());
    clearTimeout(lastTimeout);
    if (new Date().getTime()-lastMillis < 100) {
        lastTimeout = setTimeout(send,100);
    } else {
        lastMillis = new Date().getTime();
        send();
    }
});
let startingCode = "";
function send() {
    if (file === null) return;
    let files = [];
    if (multi) {
        for (const file in multi) {
            const fname = multi[file].fileName;
            files.push({file:fname,code:localStorage[fname]});
        }
    } else {
        files.push({file:orig,code:userInput.getValue()});
    }
    $.post("/testCode",JSON.stringify({files:files,project:multi?orig:null}),respond);
}
const respond = function(data) {
    if (data === "cancel") return;
    let results = JSON.parse(data);
    if (userInput.getValue().length === 0) {
        userInput.setValue(startingCode,-1);
    }
    const Range = ace.require("ace/range").Range;
    const editor = userInput.getSession();
    const editorDisplay = codeDisplay.getSession();

    editorDisplay.clearAnnotations();
    editor.clearAnnotations();
    _.each(editor.$backMarkers,(val,key)=>editor.removeMarker(key));
    const lines = {};
    for (const i in results.errors) {
        const error = results.errors[i];
        if (error.line === 0) error.line = 1;
        if (lines[error.line]) {
            lines[error.line]+="\n"+error.error;
        } else {
            lines[error.line] = error.error;
        }
        editor.addMarker(new Range(error.line-1, error.col-1, error.line-1, error.col), "ace_underline");
    }
    let anno = [];
    for (const i in lines) {
        anno.push({row: i-1, column: 0, text: lines[i], type: "error"});
    }
    editor.setAnnotations(anno);
    anno = [];
    for (const i in results.junitResults) {
        const res = results.junitResults[i];
        const range = codeDisplay.find(res.name+"(",{
            wrap: true,
            caseSensitive: true,
            wholeWord: true,
            regExp: false,
            preventScroll: true // do not change selection
        });
        if (res.passed) res.message = "Passed!";
        if (range) {
            anno.push({row: range.start.row, column: 0, text: res.message, type: res.passed ? "info" : "error"});
        }
    }
    $("#console-output-screen").html(newLineToBr(results.console));
    editorDisplay.setAnnotations(anno);
};
function newLineToBr(str) {
    return str.replace(/(?:\r\n|\r|\n)/g, '<br />');
}
function addTasks(data) {
    $("#dropdown-master").html(loop(data));
}
function loop(data) {
    let html = "";
    const ordered = {};
    Object.keys(data).sort().forEach(function(key) {
        if(data[key].fullName) return;
        ordered[key] = data[key];
        delete data[key];
    });
    data = _.sortBy(data,'fullName');
    for (const i in data) {
        html += addTask(data[i], i);
    }
    if (Object.keys(data).length > 0 && Object.keys(ordered).length > 0) {
        html += `<li class="divider"></li>`;
    }
    for (const i in ordered) {
        html += addTask(ordered[i], i);
    }
    return html;
}

function addTask(data, name) {
    if (data.project) {
        return `<li><a href="#${data.name}" onclick="loadFile('${data.name}')">${name}</a></li>`;
    } else if (data.fullName) {
        return `<li><a href="#${data.name}" onclick="loadFile('${data.name}')">${data.fullName}</a></li>`;
    } else {
        let str = `<li class="dropdown-submenu"><a tabindex="-1" href="${name}/">${name}</a><ul class="dropdown-menu">`;
        str += loop(data);
        str += `</ul></li>`;
        return str;
    }
}
$.get( "listTasks", function( data ) {
    addTasks(JSON.parse(data));
});
let file = null;
let orig;
let multi = null;
function loadIndex(idx) {
    loadContent(multi[idx],idx);
}
function loadContent(results,i) {
    const tabs = $("#tabs");
    file = results.fileName;
    if (multi !== null) {
        tabs.children().removeClass("active");
        $(tabs.children()[i]).addClass("active");
    } else {
        $("#asstitle").text("Current Task: " + results.name);
    }
    if (localStorage.getItem(file)) {
        userInput.setValue(localStorage.getItem(file));
    } else {
        userInput.setValue(results.startingCode, -1);
    }
    codeDisplay.getSession().setMode("ace/mode/java");
    userInput.getSession().setMode("ace/mode/java");
    startingCode = results.startingCode;
    codeDisplay.setValue(results.codeToDisplay, -1);
    const editorDisplay = codeDisplay.getSession();
    editorDisplay.foldAll();
}
function loadFile(name) {
    file = name;
    orig = name;
    $.post("/getTask",file,function(data) {
        let results = JSON.parse(data);
        const tabs = $("#tabs");
        if (results.constructor === Array) {
            let rname = name;
            if (name.indexOf(".") !== -1) {
                rname = name.substring(name.lastIndexOf(".")+1);
            }
            $("#asstitle").text("Current Project: " + rname.replace("_project",""));
            tabs.css("visibility","visible");
            tabs.css("height","");
            multi =  results;
            tabs.html("");
            for (const result in results) {
                const code = results[result];
                const fname = code.fileName.replace(name+".","");
                tabs.append(`<li><a onclick="loadIndex(${result})">${code.name} (${fname})</a></li>`);
            }
            results = results[0];
        } else {
            multi = null;
            tabs.css("visibility", "hidden")
            tabs.css("height", "0");
        }
        loadContent(results,name,0);
    });

    send();
}
if (window.location.hash) {
    //Give ace time to initilize
    window.setTimeout(function() {
        loadFile(window.location.hash.substr(1));
    },100);
}
function invert() {
    const body = $("body");
    body.toggleClass("invert");
    const inverted = body.hasClass("invert");
    const theme = "ace/theme/"+(inverted?"vibrant_ink":"clouds");
    userInput.setTheme(theme);
    codeDisplay.setTheme(theme);
    localStorage.setItem("config_invert",inverted);
}