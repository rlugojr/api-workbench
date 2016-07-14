/// <reference path="../../../typings/main.d.ts" />

import _ = require("underscore")
import contextMenu = require("./contextMenu")
import commandManager = require("../quick-commands/command-manager")
import actions = require("raml-actions")
import path = require ('path')
import provider=require("../suggestion/provider")
import rp=require("raml-1-parser");
import search=rp.search;
import hl=rp.hl;
import ll=rp.ll;
import editorTools = require("../editor-tools/editor-tools")

export type CommonASTStateCalculator = actions.CommonASTStateCalculator;

function initializeActionSupport() {

    actions.intializeStandardActions();
    actions.initializeActionBasedMenu('atom-text-editor[data-grammar="source raml"],.raml-outline');

    var editorCommandContributor : commandManager.ICommandContributor = {
        id : "editorContextActionContributor",


        calculateItems : function () {
            var actions = actions.calculateCurrentActions(
                actions.TARGET_RAML_EDITOR_NODE)

            if (!actions) return []

            var result : commandManager.ICommand[] = []

            actions.forEach(action => {
                result.push({

                    selector : 'atom-text-editor[data-grammar="source raml"],.raml-outline',

                    id : action.label ? action.label : action.name,

                    callBack: action.onClick
                })
            })

            return result
        }
    }

    commandManager.registerContributor(editorCommandContributor)
}

export function initialize() {
    var editorProvider = {
        getCurrentEditor() {
            var gotEditorFromOutline = false;

            var editor = null;

            if (atom.workspace.getActiveTextEditor()) {
                editor = atom.workspace.getActiveTextEditor()
            } else if (editorTools.aquireManager()) {
                editor = <AtomCore.IEditor>editorTools.aquireManager().getCurrentEditor()
                gotEditorFromOutline = true
            }

            return editor;
        }
    }

    actions.setEditorProvider(editorProvider);

    var astProvider = {
            getASTRoot() : hl.IHighLevelNode {
                return this.getSelectedNode().root();
            },

            getSelectedNode() : hl.IParseResult {

                var editor = null;
                var gotEditorFromOutline = false;

                if (editorTools.aquireManager()) {
                    editor = <AtomCore.IEditor>editorTools.aquireManager().getCurrentEditor()
                    gotEditorFromOutline = true
                }

                if (!editor && atom.workspace.getActiveTextEditor()) {
                    editor = atom.workspace.getActiveTextEditor()
                }

                if (!editor) return null

                if (path.extname(editor.getPath()) != '.raml') return null

                var request = {
                    editor: editor,
                    bufferPosition: editor.getCursorBufferPosition()
                };

                var node = null;

                if (gotEditorFromOutline) {
                    node = editorTools.aquireManager().getSelectedNode()
                } else {
                    if (editor.getBuffer()) {
                        var lastPosition = editor.getBuffer().getEndPosition();
                        if (lastPosition.column == request.bufferPosition.column
                            && lastPosition.row == request.bufferPosition.row) {
                            return null;
                        }
                        if (request.bufferPosition.row == 0 && request.bufferPosition.column == 0) {
                            return null;
                        }
                    }

                    node = provider.getAstNode(request, false);
                }

                return node;
            }
    }

    actions.setASTProvider(<any>astProvider);

    var astModifier = {
        deleteNode(node: hl.IParseResult) {
            var editorManager = editorTools.aquireManager();
            if (editorManager && editorManager._view) {
                editorManager._view.forEachViewer(x=> x.remove(node));
            }

            var parent = node.parent();
            if (parent) {
                parent.remove(<any>node);
                parent.resetChildren();
            }
        },
        updateText(node: ll.ILowLevelASTNode) {
            var editorManager = editorTools.aquireManager();
            if (editorManager) {
                editorManager.updateText(node);
            }
        }
    }

    actions.setASTModifier(<any>astModifier);

    initializeActionSupport();
}