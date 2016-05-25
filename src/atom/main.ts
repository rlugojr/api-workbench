/// <reference path="../../typings/main.d.ts" />

import Console = require('./console/index');
import apiList = require('./raml1/popularApis');
import jQuery = require('jquery');
import editorTools=require('./raml1/editorTools')
import quickCommands = require('./util/quick-commands')
import provider=require("./raml1/provider")
import quickOutline=require("./raml1/quickOutline")
import decl=require("./raml1/assistUtils")
import linterUI=require("./raml1/linterUI")
var CompositeDisposable = require('atom').CompositeDisposable;
import commandManager = require("./raml1/commandManager")
import contextMenu = require("./raml1/contextMenu")
import commonContextActions = require("./raml1/commonContextActions")
import quickFixActions = require("./raml1/quickFix")


module package_entry_point {

    var subscriptions = new CompositeDisposable()

    export function activate (state) {
        require('atom-package-deps').install('api-workbench', true)
            .then(() => {
                subscriptions.add(atom.commands.add('atom-workspace', {
                    'api-workbench:popular-apis': apiList.showPopularApis,
                    'api-workbench:editor-tools':editorTools.initEditorTools,
                    'api-workbench:console': Console.toggle,
                    'api-workbench:go-to-definition':decl.gotoDeclaration,
                    'api-workbench:find-usages':decl.findUsages,
                    'api-workbench:quick-outline':quickOutline.show,
                    'api-workbench:quick-commands': quickCommands.showCommands,
                    'api-workbench:rename':decl.renameRAMLElement,
                    'api-workbench:new-project':decl.newProject,
                    'api-workbench:select-node':decl.select
                }))

                subscriptions.add(atom.workspace.addOpener(Console.opener))
                //subscriptions.add(atom.workspace.addOpener(RamlScriptReport.opener))

                commandManager.initialize()
                contextMenu.initialize()
                commonContextActions.initialize()

                quickCommands.registerCommands()
                quickFixActions.initialize()

                editorTools.initEditorTools()
            })
    }


    export function getProvider(){
        return provider;
    }

    export function provideLinter(){
        return linterUI;
    }

    export function consumeLinter(linterApi) {
        subscriptions.add(linterUI.initEditorObservers(linterApi));
    }

    export function deactivate(){
        subscriptions.dispose()
    }

    export var config = {
        grammars: {
            type: 'array',
            default: [
                'source.raml'
            ]
        },
        openConsoleInSplitPane: {
            type: 'boolean',
            default: true
        }
    }
}
export =package_entry_point
