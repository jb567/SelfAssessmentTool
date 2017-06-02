/**
 * Made by Kristian Hansen and Sanjay Govind
 */
const codeDisplay = ace.edit("code-output-display");
codeDisplay.getSession().setMode("ace/mode/java");
codeDisplay.setReadOnly(true);


const userInput = ace.edit("user-input-box");
ace.require("ace/ext/language_tools");
userInput.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true
});
userInput.setWrapBehavioursEnabled(false);
codeDisplay.setWrapBehavioursEnabled(false);
userInput.getSession().setMode("ace/mode/java");
$("#compileBt").click(function() {
    send();
});
const autocompleter = {
    getCompletions: function(editor, session, pos, prefix, callback) {
        if (file === null) return;
        $.post("/autocomplete",JSON.stringify({file:file,code:userInput.getValue(),line: pos.row, col: pos.column}),function(data) {
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
    const pos = userInput.getCursorPosition();
    console.log("SENDING:"+file);
    $.post("/testCode",JSON.stringify({file:file,code:userInput.getValue(),line: pos.row, col: pos.column}),function(data) {
        if (data === "cancel") return;
        let results = JSON.parse(data);
        console.log(results);
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
            anno.push({row: range.start.row, column: 0, text: res.message, type: res.passed?"info":"error"});
        }
        $("#console-output-screen").html(results.console.replace(/(?:\r\n|\r|\n)/g, '<br />'));
        editorDisplay.setAnnotations(anno);
    });
}
function addTasks(data) {
    if (data.fullName) {
        let html = $("#sidenav").html();
        html +=`<li><a href="#${data.name}" onclick="loadFile('${data.name}','${data.fullName}')">${data.fullName}</a></li>`;
        $("#sidenav").html(html);
    } else {
        for (const i in data) {
            addTasks(data[i]);
        }
    }
}
$.get( "listTasks", function( data ) {
    addTasks(JSON.parse(data));
});
let file = null;
function loadFile(name,fullName) {
    file = name;
    $("#asstitle").text(fullName);
    $.post("/getTask",file,function(data) {
        let results = JSON.parse(data);
        if (localStorage.getItem(name)) {
            userInput.setValue(localStorage.getItem(name));
        } else {
            userInput.setValue(results.startingCode,-1);
        }
        $("#task-instructions-display").html(results.info);
        startingCode = results.startingCode;
        codeDisplay.setValue(results.codeToDisplay, -1);
    });

    send();
}
