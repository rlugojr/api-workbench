/// <reference path="../../../typings/main.d.ts" />

import _ = require("underscore")
import contextMenu = require("./contextMenu")
import commandManager = require("./commandManager")
import contextActions = require("./contextActions")
import path = require ('path')
import provider=require("./provider")
import rp=require("raml-1-parser");
import search=rp.search;
import hl=rp.hl;
import editorTools = require("./editorTools")

function registerCommonActions() {
    //TODO here the common actions should be registered
}

/**
 * Must be called once on module initialization
 */
export function initialize() {

    initializeActionSupport();

    registerCommonActions()
}

/**
 * General state of AST of the opened editor
 */
export interface IGeneralASTState {
    editor : AtomCore.IEditor
    offset : number
    node : hl.IParseResult
    completionKind : search.LocationKind
}

/**
 * For those who ignore state calculators approach. Is not recommended to use.
 */
export class NullCalculator implements contextActions.IContextStateCalculator {

    calculate () : any {
    }
}

/**
 * This class calculates current open editor AST state, including the selected node.
 *
 * The state is actually calculated on the global calculation start, and calling "calculate"
 * just returns the state. This allows to reuse a single instance in many actions
 * and only perform the actual state calculation once.
 *
 * On reuse please call contextCalculationStarted and contextCalculationFinished methods
 * from respective methods of the state calculator that reuses current one.
 *
 * It is not recommended to inherit the class, instead, reuse the exported instance of the class
 * so that AST parsing is performed once.
 */
export class GeneralASTStateCalculator implements contextActions.IContextStateCalculator {

    private state : IGeneralASTState = null;

    /**
     * Is called to calculate context
     */
    calculate () : any {

        //should actually never happened if this class is reused properly
        if (this.state == null) {
            this.state = this.calculateState()
        }

        return this.state
    }

    /**
     * If present is called before any context calculations are started
     */
    contextCalculationStarted : () => void = () => {

        if (this.state == null) {
            this.state = this.calculateState()
        }
    }

    /**
     * If present is called after all context calculations are finished
     */
    contextCalculationFinished : () => void = () => {

        //deleting current state
        this.state = null
    }

    private calculateState() : IGeneralASTState {

        var gotEditorFromOutline = false;

        var editor = null;
        if (atom.workspace.getActiveTextEditor()) {
            editor = atom.workspace.getActiveTextEditor()
        } else if (editorTools.aquireManager()) {
            editor = <AtomCore.IEditor>editorTools.aquireManager().getCurrentEditor()
            gotEditorFromOutline = true
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

        if (!node) {
            return null;
        }

        var offset = request.editor.getBuffer().
            characterIndexForPosition(request.bufferPosition);

        var completionKind = search.determineCompletionKind(editor.getBuffer().getText(), offset);

        return {
            editor : editor,
            offset : offset,
            node : node,
            completionKind : completionKind
        }
    }
}

export var generalASTStateCalculator = new GeneralASTStateCalculator()

/**
 * Intended for subclassing version of GeneralASTStateCalculator
 * Override calculate() method, use getGeneralState() to obtain current general AST state
 */
export class CommonASTStateCalculator  implements contextActions.IContextStateCalculator {

    calculate () : any {
       return null
    }

    getGeneralState() : IGeneralASTState {
        return <IGeneralASTState> generalASTStateCalculator.calculate()
    }

    contextCalculationStarted : () => void = () => {
        generalASTStateCalculator.contextCalculationStarted()
    }

    contextCalculationFinished : () => void = () => {
        generalASTStateCalculator.contextCalculationFinished()
    }

    getEditor() : AtomCore.IEditor {
        return editorTools.aquireManager()?(<AtomCore.IEditor>editorTools.aquireManager().getCurrentEditor()) : atom.workspace.getActiveTextEditor();
    }
}

function initializeActionSupport() {

    var editorContextMenuContributor : contextMenu.IContextMenuContributor = {

        id : "editorContextActionContributor",


        calculateItems : function () {
            var actions = contextActions.calculateCurrentActions(
                contextActions.TARGET_RAML_EDITOR_NODE)

            if (!actions) return []

            var result : contextMenu.IContextMenuItem[] = []

            actions.forEach(action => {
                result.push({

                    selector : 'atom-text-editor[data-grammar="source raml"],.raml-outline',

                    name : action.label ? action.label : action.name,

                    categories : action.category,

                    onClick: action.onClick
                })
            })

            return result
        }

    }

    contextMenu.registerContributor(editorContextMenuContributor)

    var editorCommandContributor : commandManager.ICommandContributor = {
        id : "editorContextActionContributor",


        calculateItems : function () {
            var actions = contextActions.calculateCurrentActions(
                contextActions.TARGET_RAML_EDITOR_NODE)

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