/// <reference path="../../../typings/main.d.ts" />
import fs = require('fs');
import path = require('path');

import parser = require("raml-1-parser");

import parserUtils = parser.utils;

import unitUtils = require("../util/unit");

var TextBuffer = require("basarat-text-buffer");

import editorManager = require("./editorManager");
import editorTools = require("../editor-tools/editor-tools");

export var grammarScopes = ['source.raml'];

export var scope = 'file';

export var lintOnFly = true;

import taskManager = require("./taskManager");

export function relint(editor:AtomCore.IEditor) {
    Promise.resolve("").then(editorManager.toggleEditorTools);
}

function lintFirstTime(linterApi: any, editor: AtomCore.IEditor) {
    var editorPath = editor.getPath && editor.getPath();

    var extName = editorPath && path.extname(editorPath);

    var lowerCase = extName && extName.toLowerCase();

    if(lowerCase === '.raml' || lowerCase === '.yaml' ) {
        var linter = linterApi.getEditorLinter(editor);

        lint(editor).then(messages => {
            linterApi.setMessages(linter, messages);

            var linterDestroyer = editor.onDidChange(() => {
                destroyLinter(linterApi, linter);

                linterDestroyer.dispose();
            });
        });
    }
}

export function initEditorObservers(linterApi) {
    parserUtils.addLoadCallback(x => {
        var manager = editorTools.aquireManager();

        if(manager) {
            manager.updateDetails();
        }
    });

    atom.workspace.observeTextEditors(editor => lintFirstTime(linterApi, editor));

    return {
        dispose: () => {
            
        }
    }
}

function destroyLinter(linterApi, linter) {
    linterApi.deleteMessages(linter);

    linterApi.deleteLinter(linter);
}

function isRAMLUnit(editor) {
    var contents = editor.getBuffer().getText();

    return unitUtils.isRAMLUnit(contents)
}

var combErrors = function (result:any[]) {
    var map = {};
    result.forEach(x=> {
        var original = JSON.parse(JSON.stringify(x));
        original.trace = null;
        var newKey = JSON.stringify(original);
        var tr = map[newKey];
        if (tr) {
            tr.push(x);
        }
        else {
            map[newKey] = [x];
        }
    });
    var rs:any[] = [];
    for (var i in map) {
        var mes = JSON.parse(i);
        mes.trace = [];
        var ms = map[i];
        ms.forEach(x=> {
            if (x.trace) {
                mes.trace = mes.trace.concat(x.trace);
            }
        })
        mes.trace = combErrors(mes.trace);
        rs.push(mes);
    }
    return rs;
};

function tabWarnings(textEditor:AtomCore.IEditor): any[] {
    var result: any[] = [];

    var text = textEditor.getBuffer().getText();

    var tab = 0;

    while(true) {
        var tab: number = text.indexOf('\t',tab);

        if(tab != -1) {
            var p1 = textEditor.getBuffer().positionForCharacterIndex(tab);
            var p2 = textEditor.getBuffer().positionForCharacterIndex(tab + 1);

            var message = {
                type: ("Warning"),

                filePath: textEditor.getPath(),

                text: "Using tabs  can lead to unpredictable results",

                trace: [],

                range: [[p1.row, p1.column], [p2.row, p2.column]]
            };

            result.push(message);

            tab++;
        }
        else{
            break;
        }
    }

    return result;
}

function postPocessError(editor, error, buffers) {
    var editorPath = editor.getPath();

    if(!buffers[editorPath]) {
        buffers[editorPath] = editor.getBuffer();
    }

    return Promise.resolve(error).then(error => {
        if(!error.filePath) {
            error.filePath = editorPath;
        }

        var buffer = buffers[error.filePath];

        if(!buffer) {
            return new Promise((resolve, reject) => {
                fs.readFile(error.filePath, (err: any, data: any) => {
                    if(err) {
                        reject(err);
                    } else {
                        buffer = new TextBuffer(data.toString());

                        buffers[error.filePath] = buffer;

                        resolve(buffer);
                    }
                });
            });
        }

        return buffer;
    }).then(buffer => {
        var p1 = buffer.positionForCharacterIndex(error.range[0]);
        var p2 = buffer.positionForCharacterIndex(error.range[1]);

        error.range = [[p1.row, p1.column], [p2.row, p2.column]];
        
        var traceErrors = error.trace || [];
        
        var tracePromises = traceErrors.map(traceError => postPocessError(editor, traceError, buffers));

        return Promise.all(tracePromises).then(trace => {
            error.trace = trace;
            
            return error;
        });
    });
}

function getEditorId(textEditor): string {
    return textEditor.id;
}

function runValidationSheduleUpdater(textEditor: AtomCore.IEditor, resolve, reject) {
    var sheduler = textEditor.onDidChange(() => {
        taskManager.sheduleTask(new taskManager.ValidationTask(textEditor.getPath(), textEditor.getBuffer().getText(), errors => {
            sheduler.dispose();

            resolve(errors);
        }, getEditorId(textEditor)));
    });

    taskManager.sheduleTask(new taskManager.ValidationTask(textEditor.getPath(), textEditor.getBuffer().getText(), errors => {
        sheduler.dispose();

        resolve(errors);
    }, getEditorId(textEditor)));
}

export function lint(textEditor: AtomCore.IEditor): Promise<any[]> {
    if(!isRAMLUnit(textEditor)) {
        return Promise.resolve([]);
    }
    
    Promise.resolve("").then(editorManager.toggleEditorTools);
    
    var promise = new Promise((resolve, reject) => {
        runValidationSheduleUpdater(textEditor, resolve, reject);
    }).then((errors: any[]) => {
        var buffers = {};
        
        var promises = errors.map(error => postPocessError(textEditor, error, buffers));

        var tabs: any[] = tabWarnings(textEditor);

        promises = promises.concat(tabs);
        
        return Promise.all(promises).then((errors: any[]) => {
            var result = combErrors(errors);

            var warnings = 0;
            
            return result.filter(error => error ? true : false).filter(error => {
                return error.type === 'Warning' && warnings++ >= 20 ? false : true;
            });
        });
    });
    
    return promise;
}