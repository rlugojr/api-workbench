/// <reference path="../../../typings/main.d.ts" />
import UI=require("atom-ui-lib")
import fs = require('fs');
import path = require('path');

import launcher = require('./webLauncher');
import docHelper=require("./documentationHelper");

import atomStuff = require('./atomWebStuff');

import gitStuff = require('./contentManagers');

import contextActions = require('./contextActions');

var global = getGlobal();

class Workspace {
    textEditor: TextEditor = null;

    rootPane: Pane = null;

    pane: Pane = null;

    container: HTMLDivElement = null;

    treePanelNode: Node = null;

    filesTree: any;

    rightPanelContainer: Node = null;

    rightPanel: Node = null;

    rightPanelView: any = null;

    consoleAxis: HTMLDivElement = <HTMLDivElement>document.createElement('atom-pane-axis');

    consolePane: Pane = null;

    updateEverythingCallbacks: any[] = [];

    differences: any[] = [];

    dirties: any[] = [];

    ace: any;

    editorsCache: any = {};

    toolBar: ToolBar = isSimpleMode() ? null : new ToolBar();

    popup: HTMLElement = null;

    modalPanel: HTMLElement = null;

    mouseX = null;
    mouseY = null;

    editors: {};

    openAfterLoading: any[] = [];

    didDestroyPaneCallbacks: any[] = [];

    refreshId;

    tabViewer: TabViewer = isSimpleMode() ? null : new TabViewer(id => {
        this.openFile(new FsTreeModel(id))
    }, id => {
        if(id) {
            return this.openFile(new FsTreeModel(id));
        }

        this.clear();
    })

    constructor() {
        if(isSimpleMode()) {
            return;
        }

        this.initUI();

        if(idx === 'iframe') {
            window.addEventListener("message", event => {
                this.clearCaches();

                (<any>fs).reset();

                this.refreshFSTree();

                var projectId = (<any>event).data.exampleId;

                this.loadProjectById((<any>event).data.exampleId);
            });

            this.toolBar.disable('Editor Tools');
            this.toolBar.disable('Api Console');
            this.toolBar.disable('Popular Apis');

            return;
        }

        if(idx === 'data') {
            window.addEventListener("message", event => {
                this.clearCaches();

                (<any>fs).reset();

                this.refreshFSTree();

                this.loadData((<any>event).data);
            });

            this.toolBar.disable('Editor Tools');
            this.toolBar.disable('Api Console');
            this.toolBar.disable('Popular Apis');

            return;
        }

        if(idx) {
            this.loadProjectById(idx);

            return;
        }

        this.toolBar.disable('Editor Tools');
        this.toolBar.disable('Api Console');
        this.toolBar.enable('Popular Apis');
    }

    loadData(content) {
        var manager = this.getManager('data');

        manager.loadContent(content);
    }

    loadProjectById(idx) {
        var url = this.getDescriptors()[idx].url;

        var isExample = (url.indexOf('examples') === 0);

        var manager = this.getManager('embed');

        var project = this.getDescriptors()[idx];

        if(!isExample) {
            this.setUrlForPreloaded(project, manager);
        }

        manager.loadContent(this.getDescriptors()[idx]);
    }

    getDescriptors() {
        return global.projectDescriptors;
    }

    updateDirtyMarker(id, isDirty) {
        var inDirties = workspace.dirties.indexOf(id) >= 0;

        if(isDirty && !inDirties) {
            this.dirties.push(id);
        } else if(!isDirty && inDirties) {
            var oldDirties = this.dirties;

            this.dirties = [];

            oldDirties.forEach(dirtyId => {
                if(dirtyId !== id) {
                    this.dirties.push(dirtyId);
                }
            })
        }

        this.tabViewer.setDirty(this.dirties);
    }

    refreshFSTree() {
        if(!this.filesTree) {
            return;
        }

        this.filesTree.viewer.setInput(new FsTreeModel('/virtual'));

        if(this.openAfterLoading.length) {
            var items = this.openAfterLoading;

            this.openAfterLoading = [];

            items.forEach(file => {
                this.open(file, null);
            });
        }
    }

    initSimpleUI() {
        var preList: NodeListOf<HTMLPreElement> = document.getElementsByTagName('pre');

        for(var i = 0; i < preList.length; i++) {
            var pre: HTMLPreElement = preList[i];

            for(var j = 0; j < pre.children.length; j++) {
                var child: HTMLElement = <HTMLElement>pre.children[j];

                if(child.className === 'lang-yaml') {
                    pre.id = 'pre_' + i;
                    child.id = 'code_' + i;

                    this.addTextEditor('' + i);
                }
            }
        }

        document.addEventListener('mousemove', event => {
            this.mouseX = event.pageX;
            this.mouseY = event.pageY;
        });
    }

    initSimpleUINewSpec() {
        var preList: NodeListOf<HTMLPreElement> = document.getElementsByTagName('pre');

        for(var i = 0; i < preList.length; i++) {
            var pre: HTMLPreElement = preList[i];

            var child: HTMLElement = <HTMLElement>pre.children[0];

            if(child && child.classList.contains('line') && /^(#%RAML)/.test(child.innerText)) {
                pre.id = 'pre_' + i;

                pre.className = pre.className + ' wrapped-editor';

                this.addTextEditorInNewSpec('' + i);
            }
        }

        document.addEventListener('mousemove', event => {
            this.mouseX = event.pageX;
            this.mouseY = event.pageY;
        });
    }

    getPathForId(id) {
        return '/snippets/spec_example' + '_' + id + '.raml';
    }

    addTextEditor(id: string) {
        var wrapper : HTMLElement = document.getElementById('pre_' + id);
        var wrapperParent : HTMLElement = wrapper.parentElement;
        var code : HTMLElement = document.getElementById('code_' + id);
        var errorsElement : HTMLElement = document.createElement('div');

        if(wrapper.nextSibling) {
            wrapperParent.insertBefore(errorsElement, wrapper.nextSibling);
        } else {
            wrapper.appendChild(errorsElement);
        }

        var content = code.innerText;
        var path = this.getPathForId(id);

        fs.writeFileSync(path, content);

        var textEditor: TextEditor = new TextEditor(path, id);

        textEditor.getBuffer().positionForCharacterIndex = () => {
            return {row: 1, column: 1};
        }

        var messages:any[] = getLazy('linter').lint(textEditor);

        messages.forEach(message => {
            if (message.type.toLowerCase() === 'error') {
                var errorElement: HTMLElement = document.createElement('p');

                var errorText = message.text;

                errorElement.style.color = "white";

                errorElement.innerHTML = "ERROR: " + errorText;

                errorsElement.style.backgroundColor = "red";

                errorsElement.appendChild(errorElement);
            }
        });

        wrapper.addEventListener('click', ()=> {
            if((<any>wrapper).created) {
                return;
            }

            var wrapperSize = {
                width: wrapper.clientWidth + 'px',
                height: (wrapper.clientHeight + 32) + 'px'
            }

            var codeSize = {
                width: '100%',
                height: '100%'
            }

            wrapper.style.position = 'relative';

            wrapper.style.width = wrapperSize.width;
            wrapper.style.height = wrapperSize.height;

            textEditor.element.style.width = codeSize.width;
            textEditor.element.style.height = codeSize.height;

            code.style.display = 'none';

            wrapper.appendChild(textEditor.element);

            if(!isMutationSupport) {
                (<any>textEditor.element).dispatchEvent(new global.Event('DOMNodeInserted'));
            }

            (<any>wrapper).created = true;
        });
    }

    addTextEditorInNewSpec(id: string) {
        var wrapper : HTMLPreElement = <HTMLPreElement>document.getElementById('pre_' + id);

        var content = [];

        var lines = wrapper.children;

        for(var i = 0; i < lines.length; i++) {
            var line = lines[i];

            content.push((<any>line).innerText);
        }

        var path = this.getPathForId(id);

        fs.writeFileSync(path, content.join('\n').replace(/\xa0/g, " "));

        var textEditor: TextEditor = new TextEditor(path, id);

        wrapper.addEventListener('click', ()=> {
            if((<any>wrapper).created) {
                return;
            }

            var wrapperSize = {
                width: wrapper.clientWidth + 'px',
                height: (wrapper.clientHeight + 32) + 'px'
            }

            wrapper.style.position = 'relative';

            wrapper.style.width = wrapperSize.width;
            wrapper.style.height = wrapperSize.height;

            textEditor.element.style.width = '100%';
            textEditor.element.style.height = '100%';

            (<any>wrapper).innerHTML = '';

            wrapper.appendChild(textEditor.element);

            if(!isMutationSupport) {
                (<any>textEditor.element).dispatchEvent(new global.Event('DOMNodeInserted'));
            }

            (<any>wrapper).created = true;
        });
    }

    initUI() {
        var AtomTextEditor = this.registerElement('atom-text-editor', HTMLDivElement.prototype);

        AtomTextEditor.prototype.getModel = function() {
            return this.model ? this.model : new atomStuff.AtomTextEditorModel(this);
        };

        var oldSetAttribute = AtomTextEditor.prototype.setAttribute;
        var oldRemoveAttribute = AtomTextEditor.prototype.removeAttribute;

        AtomTextEditor.prototype.setAttribute = function(key, value) {
            oldSetAttribute.apply(this, [key, value]);

            if(key === 'mini') {
                this.getModel().mini = true;
            }

            this.getModel().updateInput();
        }

        AtomTextEditor.prototype.removeAttribute = function(key) {
            oldRemoveAttribute.apply(this, [key]);

            if(key === 'mini') {
                this.getModel().mini = false;
            }

            this.getModel().updateInput();
        }

        Object.defineProperty(AtomTextEditor.prototype, "textContent", {
            get: function() {
                return this.getModel().getText();
            },

            set: function(value) {
                this.getModel().setText(value);
            }
        });

        this.registerElement('atom-workspace', HTMLDivElement.prototype);
        this.registerElement('atom-workspace-axis', HTMLDivElement.prototype);
        this.registerElement('atom-panel-container', HTMLDivElement.prototype);
        this.registerElement('atom-panel', HTMLDivElement.prototype);
        this.registerElement('atom-pane-container', HTMLDivElement.prototype);
        this.registerElement('atom-pane-axis', HTMLDivElement.prototype);
        this.registerElement('atom-pane', HTMLDivElement.prototype);

        $(window).bind('keydown', event => {
            if (event.ctrlKey || event.metaKey) {
                switch (String.fromCharCode(event.which).toLowerCase()) {
                    case 's': {
                        event.preventDefault();

                        this.doSave();

                    } break;
                }
            }
        });

        this.container = <HTMLDivElement>document.getElementById('root-pane-container');

        this.rightPanelContainer = document.getElementById('right-panel-container')

        this.treePanelNode = document.getElementById('fs-tree-panel');

        this.modalPanel = document.getElementById('modal-panel');

        this.modalPanel.style.display = 'none';

        this.consoleAxis.id = 'console-axis';

        this.consoleAxis.className = 'vertical pane-column';

        this.consoleAxis.style.display = 'none';

        this.initFsTree();

        (<any>fs).onChange(() => this.spawnRefresh());

        document.addEventListener('mousemove', event => {
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
        });
    }

    doSave() {
        this.getActiveTextEditor().doSave();

        this.differences.push(this.getActiveTextEditor().getPath());

        this.refreshFSTree();
    }

    spawnRefresh() {
        if(this.refreshId) {
            clearTimeout(this.refreshId);
        }

        this.refreshId = setTimeout(() => {
            this.refreshFSTree();
        }, 100);
    }

    clear() {
        if(this.rootPane) {
            this.rootPane.destroy();
        }

        (<any>this.container).innerHTML = '';

        (<any>this.rightPanelContainer).innerHTML = '';

        this.rootPane = new Pane('main', this.container, this, null);

        this.pane = this.rootPane;

        this.toolBar.disable('Editor Tools');
        this.toolBar.disable('Api Console');
        this.toolBar.enable('Popular Apis');
    }

    doUpdate() {
        this.updateEverythingCallbacks.forEach(callback => {
            callback();
        });
    }

    addModalPanel(itemHolder: any) {
        this.popup = itemHolder.item;

        this.modalPanel.appendChild(this.popup);

        this.modalPanel.style.display = null;

        return {
            destroy: () => {
                this.modalPanel.style.display = 'none';

                if(this.popup.parentElement) {
                    this.modalPanel.removeChild(this.popup);
                }
            }
        }
    }

    completeLoading(contentLoaded) {
        var resultList = contentLoaded;

        this.openAfterLoading = [];

        resultList.forEach(fileDescriptor => {
            var filePath = fileDescriptor.path;
            var content = fileDescriptor.content;

            if(fileDescriptor.openAfterLoading) {
                this.openAfterLoading.push(filePath);
            }

            fs.writeFileSync(filePath, content);
        });

        this.differences = [];

        this.refreshFSTree();

        hideLoading();
    }

    bottomPanel: HTMLElement = document.getElementById('bottom-panel');
    bottomPane: HTMLElement = null;

    addBottomPanel(itemHolder: any) {
        this.bottomPane = itemHolder.item.element;

        this.bottomPane.setAttribute('is', 'space-pen-div');

        this.bottomPane.className = 'raml-console pane-item';

        this.bottomPane.style.overflow = 'scroll';

        document.getElementById('bottom-panel-container').style.flexBasis = '170px';
        (<any>document).getElementById('bottom-panel-container').style.webkitFlexBasis = '170px';

        this.bottomPanel.appendChild(this.bottomPane);

        return {
            destroy: () => {
                this.bottomPanel.removeChild(this.bottomPane);

                document.getElementById('bottom-panel-container').style.flexBasis = '0px';
                (<any>document).getElementById('bottom-panel-container').style.webkitFlexBasis = '0px';
            }
        }
    }

    addConsolePanel(itemHolder: any) {
        this.consolePane.addItem(itemHolder.item, 0);
    }

    showPopularApis() {
        this.clear();

        this.textEditor = null;

        var apis = getLazy('apiList');

        var manager = this.getManager('git');

        var gitConfig = (<any>manager).config;

        apis.onClone(repo => {
            manager.loadContent(repo);
        });

        apis.accessToken = gitConfig.accessToken;
        apis.reposUrl = gitConfig.reposUrl;

        apis.showPopularApis();

        this.toolBar.disable('Editor Tools');
        this.toolBar.disable('Api Console');
        this.toolBar.makeActive('Popular Apis');
    }

    getManager(type): gitStuff.IContentManager {
        var gitConfig = {
            accessToken: 'a349697184d3d8d30f7b539d97a4aa4a3d1ee6d0',
            reposUrl: 'https://api.github.com/users/testramluser/repos'
        }

        switch(type) {
            case 'git': {
                return new gitStuff.GitManager(gitConfig, showLoading, (content) => {this.completeLoading(content)}, null);
            }

            case 'embed': {
                return new gitStuff.EmbedContentManager(gitConfig, showLoading, (content) => {this.completeLoading(content)}, null);
            }

            case 'data': {
                return new gitStuff.InputDataManager(gitConfig, showLoading, (content) => {this.completeLoading(content)}, null);
            }
        }

        return null;
    }

    setUrlForPreloaded(project, manager) {
        project.embedUrl = 'https://api.github.com/repos/testramluser/preloaded/contents?access_token=' + (<any>manager).config.accessToken;
    }

    open(filePath, args) {
        if(filePath.indexOf('raml-console://') === 0) {
            var result = {
                then: callback => {
                    var view = getLazy('ApiConsole').opener(filePath, args);

                    this.addConsolePanel({item: view});

                    callback(view);
                }
            }

            return result;
        }

        this.tabViewer.open(filePath, path.basename(filePath));

        return {
            then: callback => {
                callback(this.textEditor);
            }
        }
    }

    openFile(selection: FsTreeModel) {
        if(!selection.isDirectory()) {
            this.clear();

            this.textEditor = new TextEditor(selection.path);

            this.pane.addItem(this.textEditor, 0);

            var extension = path.extname(selection.path);

            this.doUpdate();

            if(extension === ".raml") {
                getLazy('editorTools').initEditorTools();

                this.toolBar.toggleLastActive();
            } else {
                this.toolBar.disable('Editor Tools');
                this.toolBar.disable('Api Console');
            }

            if(extension === '.ts') {
                //getLazy('editHelper').toggle();
            }

            this.doUpdate();
        }
    }

    initFsTree() {
        var input = new FsTreeModel('/virtual');

        function getChildren(file:FsTreeModel):FsTreeModel[] {
            if(!file) {
                return [];
            }

            return file.getChildren();
        }

        var tree = UI.treeViewerSection('Virtual Workspace', UI.Icon.FILE_SUBMODULE, input, getChildren, new FSRenderer(x=> {

        }));

        tree.viewer.setComparator((arg1, arg2) => {
            return false;
        });

        this.filesTree = tree;

        tree.viewer.setBasicLabelFunction(x=>x.getName());

        tree.viewer.setKeyProvider({
            key: (item:FsTreeModel):string=> {
                return "" + item.getName();
            }
        });

        var selectionListener = {
            selectionChanged: event => {
                var selection: FsTreeModel = event.selection.elements[0];

                if(!selection) {
                    return;
                }

                if(selection.directory) {
                    return;
                }

                this.tabViewer.open(selection.path, selection.getName());
            }
        };

        tree.viewer.addSelectionListener(selectionListener);

        var leftPanel;

        var treeElement;

        if(getParameterByName('version') === '2') {
            var tabFolder: UI.TabFolder = new UI.TabFolder();

            var examplesList = UI.list(this.getDescriptors(), new ExamplesRenderer(() => {}));

            var selectionListener = {
                selectionChanged: event => {
                    var selection = event.selection.elements[0];

                    if(!selection) {
                        return;
                    }

                    window.postMessage({exampleId: selection.index}, '*');
                }
            };

            examplesList.addSelectionListener(selectionListener);

            tabFolder.add("Examples", UI.Icon.LIST_ORDERED, examplesList);

            tabFolder.add('File System', UI.Icon.FILE_DIRECTORY, tree);

            treeElement = tree.ui();

            leftPanel = tabFolder.renderUI();
        } else if(getParameterByName('version') === '3') {
            var selectInput = [];

            var descriptors = this.getDescriptors();

            function getLabel(descriptor) {
                return `${descriptor.title} (${descriptor.tags.indexOf('_api_') > -1? 'Api' : 'Example'})`;
            }

            descriptors.forEach(descriptor => {
                selectInput.push(getLabel(descriptor));
            });

            var select = new UI.Select("Project", selection => {
                var result;

                descriptors.forEach(descriptor => {
                    var label = getLabel(descriptor);

                    if(selection && (<any>selection).getValue() === label) {
                        result = descriptor;
                    }
                });

                if(result) {
                    window.postMessage({exampleId: result.index}, '*');
                }
            });

            select.setOptions(selectInput);

            leftPanel = UI.vc(select, tree).renderUI();

            treeElement = tree.ui();
        } else {
            leftPanel = tree.renderUI();

            treeElement = leftPanel;
        }

        var filter = treeElement.getElementsByTagName('span')[0];


        this.treePanelNode.appendChild(this.toolBar.element);

        this.initMenu();

        treeElement.removeChild(filter);

        this.treePanelNode.appendChild(leftPanel);
    }

    initMenu() {
        var menuItems = [];

        this.toolBar.addButton('Editor Tools', UI.Icon.SETTINGS, () => {
            document.getElementById('editor-tools-axis').style.display = null;
            document.getElementById('console-axis').style.display = 'none';

            this.toolBar.makeActive('Editor Tools');
            this.toolBar.enable('Api Console');
            this.toolBar.enable('Popular Apis');
        });

        this.toolBar.addButton('Api Console', UI.Icon.SETTINGS, () => {
            getLazy('ApiConsole').toggle();

            document.getElementById('console-axis').style.display = null;
            document.getElementById('editor-tools-axis').style.display = 'none';

            this.toolBar.enable('Editor Tools');
            this.toolBar.makeActive('Api Console');
            this.toolBar.enable('Popular Apis');
        });

        if(!idx) {
            this.toolBar.addButton('Popular Apis', UI.Icon.SETTINGS, () => {
                this.showPopularApis();

                if(document.getElementById('console-axis')) {
                    document.getElementById('console-axis').style.display = 'none';
                }
            });
        }

        menuItems.push({
            label: 'Open Api Console',

            handler: () => getLazy('ApiConsole').toggle()
        });
    }

    showGitPushDialog() {
        var dialog = new gitStuff.CommitDialog((message, onSuccess) => {
            this.getManager('git').store(message, this.differences, new GitContentProvider(), () => {
                this.differences = [];

                onSuccess();

                this.refreshFSTree();
            })
        });

        dialog.show();
    }

    registerElement(name: string, prototype, ext?: string): any {
        var config = {prototype: Object.create(prototype)}

        if(ext) {
            config['extends'] = ext;
        }

        return (<any>document).registerElement(name, config);
    }

    getActiveTextEditor(): TextEditor {
        return this.textEditor;
    }

    getTextEditors() {
        return this.textEditor ? [this.textEditor] : [];
    }

    onDidChangeActivePaneItem(callback: (arg:any) => void) {
        this.updateEverythingCallbacks.push(callback);

        return {
            dispose: () => {
                this.updateEverythingCallbacks = this.updateEverythingCallbacks.filter(child => {
                    return child !== callback;
                });
            }
        }
    }

    onDidAddPaneItem(callback: any) {
        console.log("TODO: may be need to implement onDidAddPaneItem method.");
    }

    onDidDestroyPane(callback: any) {
        this.didDestroyPaneCallbacks[0] = callback;
    }

    addRightPanel(arg: any) {
        var panel = document.createElement('atom-panel');

        panel.className = 'right tool-panel panel-right';

        this.rightPanelContainer.appendChild(panel);

        panel.appendChild(arg.item.element);

        return {destroy: function() {}}
    }

    getActivePane(): Pane {
        return this.pane;
    }

    setActivePane(pane:Pane):void {
        this.pane = pane;
    }

    doCache(key:string, content: string) {
        this.editorsCache[key] = content;
    }

    getFromCache(key:string): string {
        return this.editorsCache[key];
    }

    clearCaches() {
        this.differences = [];

        this.dirties = [];

        this.editorsCache = {};

        if(this.tabViewer) {
            this.tabViewer.clearCache();
        }

        this.clear();
    }

    paneForItem(item: any) {
        return item.pane;
    }

    paneDestroyed(pane: Pane) {
        if(pane.destroyed) {
            return;
        }

        this.didDestroyPaneCallbacks.forEach(callback => {
            callback({pane: pane});
        });
    }

    getPaneItems(pane?: Pane) {
        var actualPane = pane ? pane : this.rootPane;

        var result = [];

        if(actualPane) {
            Object.keys(actualPane.items).forEach(key=> {
                if(!actualPane.items[key]) {
                    return;
                }

                result.push(actualPane.items[key]);
            });

            actualPane.children.forEach(child => {
                result.push(this.getPaneItems(child));
            });
        }

        return result;
    }

    getActivePaneItem() {
        return null;
    }

    paneForURI(uri: string) {
        return null;
    }

    observeTextEditors(callback) {
        return {
            dispose: () => {}
        }
    }
}

class ToolBar {
    element:HTMLSpanElement = document.createElement('span');

    buttons = {};

    active = null;

    constructor() {
        this.element.className = 'inline-block';
    }

    addButton(name: string, icon: UI.Icon, handler: any) {
        var button: HTMLButtonElement = document.createElement('button');

        var iconClass = UI.iconToClass(icon);

        button.className = 'icon ' + iconClass + ' btn-info btn-xs btn';

        button.innerHTML = name;

        button.onclick = handler;

        this.element.appendChild(button);

        this.buttons[name] = {button: button, handler: handler, icon: iconClass};
    }

    enable(name) {
        var buttonHolder = this.buttons[name];

        if(!buttonHolder) {
            return;
        }

        buttonHolder.button.className = 'icon ' + buttonHolder.icon + ' btn-info btn-xs btn';

        buttonHolder.button.onclick = buttonHolder.handler;
    }

    disable(name) {
        var buttonHolder = this.buttons[name];

        if(!buttonHolder) {
            return;
        }

        buttonHolder.button.className = 'icon ' + buttonHolder.icon + ' no btn-xs btn';

        buttonHolder.button.onclick = null;
    }

    makeActive(name) {
        var buttonHolder = this.buttons[name];

        if(!buttonHolder) {
            return;
        }

        buttonHolder.button.className = 'icon ' + buttonHolder.icon + ' btn-warning btn-xs btn';

        buttonHolder.button.onclick = name === 'Popular Apis' ? null : () => {
            this.active = null;

            document.getElementById(name === 'Api Console' ? 'console-axis' : 'editor-tools-axis').style.display = 'none';

            this.enable(name);
        };

        if(name !== 'Popular Apis') {
            this.active = buttonHolder;
        }
    }

    toggleLastActive() {
        if(this.active) {
            this.active.handler();
        } else {
            this.enable('Editor Tools');
            this.enable('Api Console');
            this.enable('Popular Apis');

            document.getElementById('console-axis').style.display = 'none';
            document.getElementById('editor-tools-axis').style.display = 'none';
        }
    }
}

class FSRenderer implements UI.ICellRenderer<FsTreeModel>{
    constructor(private onInputChanged: any) {

    }

    render(model: FsTreeModel):UI.BasicComponent<any> {
        var changed = false;

        workspace.differences.forEach(path => {
            if(path === model.path || (path.indexOf(model.path) === 0 && (<string>path).charAt(model.path.length) === '/')) {
                changed = true;
            }
        })

        var highLight = changed ? UI.TextClasses.WARNING : UI.TextClasses.NORMAL;

        var icon = model.isDirectory() ? UI.Icon.FILE_DIRECTORY : UI.Icon.FILE_TEXT;

        var result: UI.BasicComponent<HTMLElement> = UI.hc(UI.label(model.getName(), icon, highLight),UI.a("", x=>{
        }, null,null,null));

        result.setDisabled(false);

        return result;
    }
}

class ExamplesRenderer implements UI.ICellRenderer<any>{
    constructor(private onInputChanged: any) {

    }

    render(model: any):UI.BasicComponent<any> {
        var highLight = UI.TextClasses.NORMAL;

        var icon = UI.Icon.BOOK;

        var label = `${model.title} (${model.tags.indexOf('_api_') > -1? 'Api' : 'Example'})`;

        var result: UI.BasicComponent<HTMLElement> = UI.hc(UI.label(label, icon, highLight),UI.a("", ()=>{

        }, null,null,null));

        result.setDisabled(false);

        return result;
    }
}

class MenuRenderer implements UI.ICellRenderer<any> {
    constructor(private onInputChanged: any) {

    }

    render(model: any):UI.BasicComponent<any> {
        var highLight = UI.TextClasses.NORMAL;

        var icon = UI.Icon.NONE;

        var label = model.label;

        var result = UI.a(label, () => {

        }, null,null,null);

        result.renderUI().setAttribute('href', '#' + model.target);

        result.setDisabled(false);

        return result;
    }
}

class FsTreeModel {
    children: FsTreeModel[];

    path: string;

    directory: boolean;

    constructor(path) {
        this.path = path;

        this.directory = fs.statSync(path).isDirectory();

        var names = (this.directory && this.getName() !== 'node_modules') ? fs.readdirSync(path) : [];

        var children: FsTreeModel[] = [];

        names.forEach(name => {
            children.push(new FsTreeModel(path + "/" + name));
        });

        this.children = children;
    }

    getChildren(): FsTreeModel[] {
        return this.children;
    }

    isDirectory(): boolean {
        return this.directory;
    }

    getName(): string {
        return path.basename(this.path);
    }
}

class Pane {
    items:any =  {};

    id:string;
    parent: HTMLDivElement;
    workspace: Workspace;
    arg:any;

    container: HTMLDivElement;
    axis: HTMLDivElement;
    views: HTMLDivElement;

    children: Pane[] = [];

    destroyed = false;

    constructor(id: string, parentNode:HTMLDivElement, workspace:Workspace, arg:any) {
        this.id = id;
        this.parent = parentNode;
        this.workspace = workspace;
        this.arg = arg;

        if(this.id !== 'console-right'){
            workspace.setActivePane(this);
        }

        this.container = <HTMLDivElement>document.createElement('atom-pane');
        this.container.className = 'pane';
        this.container.id = id;

        this.views = document.createElement('div');
        this.views.className = 'item-views';

        this.parent.appendChild(this.container);

        if(id === 'main-right') {
            if(workspace.consoleAxis.parentElement) {
                workspace.consoleAxis.parentElement.removeChild(workspace.consoleAxis);
            }

            this.parent.appendChild(workspace.consoleAxis);

            workspace.consolePane = new Pane('console-right', workspace.consoleAxis, workspace, {});

            this.children.push(workspace.consolePane);
        }

        this.container.appendChild(this.views);
    }

    destroy() {
        this.children.forEach(child=> {
            child.destroy();
        });

        this.children = [];


        var items = this.items;

        Object.keys(items).forEach(key => {
            var item = items[key];

            item.pane = null;

            if(item && item.destroy) {
                item.destroy();
            }
        });

        this.items = {};

        this.destroyed = true;

        if(this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
        }

        workspace.paneDestroyed(this);
    }

    splitUp(arg: any): Pane {
        return this.newPane('up', arg);
    }

    splitDown(arg: any): Pane {
        return this.newPane('down', arg);
    }

    splitLeft(arg: any): Pane {
        return this.newPane('left', arg);
    }

    splitRight(arg: any): Pane {
        return this.newPane('right', arg);
    }

    newPane(id: string, arg:any):Pane {
        this.axis = <HTMLDivElement>document.createElement('atom-pane-axis');

        this.axis.className = id === 'left' || id === 'right' ? 'horizontal pane-row' : 'vertical pane-column';

        if(this.id === 'main-right') {
            this.axis.id = 'editor-tools-axis';
        }

        this.parent.replaceChild(this.axis, this.container);

        this.axis.appendChild(this.container);

        var result: Pane = new Pane(this.id + '-' + id, this.axis, this.workspace, arg);

        this.children.push(result);

        return result;
    }

    addItem(item:any, index:number) {
        if(this.items[index]) {
            this.views.removeChild(this.items[index].element);
        }

        this.items[index] = item;

        item.pane = this;

        this.views.appendChild(item.element);

        if(!isMutationSupport) {
            item.element.dispatchEvent(new global.Event("DOMNodeInserted"));
        }
    }

    activate() {

    }
}

interface Point {
    row:number;
    column:number;
}

interface Range {
    start:Point;
    end:Point;
}

interface IChangeCommand{
    newText:string;
    oldText:string;

    oldRange:Range;
    newRange:Range;
}

class TextBuffer {
    text:string = '';

    didChangecallbacks: any[] = [];

    stopChangingCallbacks: any[] = [];

    constructor(text:string) {
        this.text = text;
    }

    onDidChange(callback: any) {
        this.didChangecallbacks.push(callback);
    }

    getText(): string {
        return this.text;
    }

    doChange(arg: any) {
        this.didChangecallbacks.forEach(callback=>{
            var text = null;

            var lines: any[] = arg.lines;

            lines.forEach(line=> {
                text = text === null ? line : (text + '\n' + line);
            });

            var cmd: IChangeCommand = {
                newText: arg.action === 'insert' ? text : '',
                oldText: arg.action === 'remove' ? text : '',
                newRange: null,
                oldRange: <Range>{start: (arg.start), end: arg.end}
            };

            callback(cmd);
        })

        this.doStopChanging(arg);
    }

    doStopChanging(arg: any) {
        this.stopChangingCallbacks.forEach(callback=>{
            callback(null);
        })
    }

    onDidStopChanging(callback: any) {
        this.stopChangingCallbacks.push(callback);

        return {
            dispose: () => {
                this.stopChangingCallbacks = this.stopChangingCallbacks.filter(child => {
                    return child !== callback;
                });
            }
        }
    }

    characterIndexForPosition: any;

    positionForCharacterIndex: any;

    setTextInRange: any;
}

class TextEditorCursor {
    editor: TextEditor;

    changePositionCallbacks: any[] = [];

    constructor(editor: TextEditor) {
        this.editor = editor;
    }

    onDidChangePosition(callback: any) {
        this.changePositionCallbacks.push(callback);

        return {
            dispose: () => {
                this.changePositionCallbacks = this.changePositionCallbacks.filter(child => {
                    return child !== callback;
                });
            }
        }
    }

    getBufferPosition(): Point {
        return this.editor.getCursorBufferPosition();
    }

    doChangePosition() {
       this.changePositionCallbacks.forEach(callback => {
           callback();
       });
    }
}

function getRange(row1, col1, row2, col2): Range {
    var point1: Point = {row: row1, column: col1};
    var point2: Point = {row: row2, column: col2};

    return <Range>(isCorrectOrder(point1, point2) ? {start: point1, end: point2} : {start: point2, end: point1});
}

function isCorrectOrder(point1: Point, point2: Point): boolean {
    if(point1.row < point2.row) {
        return true;
    }

    if(point1.row > point2.row) {
        return false;
    }

    return point1.column < point2.column;
}

export class TextEditor {
    textBuffer: TextBuffer;

    editorPath: string;

    extension: string;

    dirtyState: boolean = false;

    element: HTMLElement = document.createElement('div');

    textElement: HTMLElement =  document.createElement('div');

    ace: any;

    aceEditor: any;

    cursor: TextEditorCursor;

    id: string;

    contextMenu = null;

    destroyCallbacks = [];

    grammar: any = {
        scopeName: 'no-grammar'
    }
    constructor(editorPath: string, id: string = 'ace_editor') {
        this.editorPath = editorPath;

        this.id = editorPath;

        this['soft-tabs'] = {};

        this.restore();

        this.textElement.className = 'editor';

        this.textElement.style.position = 'relative';
        this.textElement.style.width = '100%';
        this.textElement.style.flex = '1';

        (<any>this).textElement.style.webkitFlex = '1';

        this.textElement.id = id;

        this.extension = path.extname(editorPath);

        this.grammar.scopeName = 'source' + this.extension;

        this.element.style.position = 'relative';
        this.element.style.width = '100%';

        this.element.className = 'text-editor-wrapper';
        this.element.style.display = 'flex';
        this.element.style.display = '-webkit-flex';

        if(!isSimpleMode()) {
            this.element.appendChild(workspace.tabViewer.element);
        }

        this.element.appendChild(this.textElement);

        var textEditor = this;

        this.element.addEventListener('DOMNodeInserted', event => {
            if(textEditor.ace) {
                return;
            }

            textEditor.doAceSetup(global.ace);

            if(isSimpleMode()) {
                return;
            }

            this.updateDirtyMarker();
        })
    }

    onDidChangeCursorPosition(callback) {
        return this.getLastCursor().onDidChangePosition(callback);
    }

    menuItems() {
        var assistUtils = getLazy('assistUtils');

        var result = [
            {
                label: 'Goto Declaration',
                icon: 'ui-icon-home',
                handler: assistUtils.gotoDeclaration
            }, {
                label: 'Find Usages',
                icon: 'ui-icon-search',
                handler: assistUtils.findUsages
            }, {
                label: 'Rename',
                icon: 'ui-icon-tag',
                handler: assistUtils.renameRAMLElement
            }
        ];

        return result;
    }

    doSave() {
        fs.writeFileSync(this.editorPath, this.getText());

        workspace.doCache(this.editorPath, null);

        this.setDirtyState(false);

        this.updateDirtyMarker();
    }

    doCache() {
        workspace.doCache(this.editorPath, this.dirtyState ? this.getText() : null);
    }

    restore() {
        var cached: string = workspace.getFromCache(this.editorPath);

        var text: string = cached ? cached : fs.readFileSync(this.editorPath).toString();

        this.setDirtyState(cached ? true : false);

        this.textBuffer = new TextBuffer(text);
    }

    setAce(ace: any) {
        this.ace = ace;
    }

    doAceSetup(ace: any) {
        this.ace = ace;

        if(!ace) {
            return;
        }

        var aceEditor: any = ace.edit(this.textElement.id);

        var langTools: any = ace.require('ace/ext/language_tools');

        aceEditor.setTheme('ace/theme/tomorrow_night');

        langTools.setCompleters([]);

        aceEditor.getSession().setMode(this.getMode());

        aceEditor.getSession().off("change", aceEditor.renderer.$gutterLayer.$updateAnnotations);

        aceEditor.setOptions({
            enableBasicAutocompletion: true,

            enableLiveAutocompletion: true
        });


        this.setAceEditor(aceEditor);

        if(this.extension === '.raml') {
            var AceCompleter = getLazy('aceStuff').AceCompleter;

            langTools.addCompleter(new AceCompleter(this));
        }

        if(isSimpleMode()) {
            return;
        }

        registerMenu(this.element, '#' + this.textElement.id, this.menuItems(), (event, ui, menuItems) => {
            var visibleActions = getActionsTree(contextActions.calculateCurrentActions(contextActions.TARGET_RAML_EDITOR_NODE));

            JQ(this.element).contextmenu("replaceMenu", menuItems.concat(visibleActions));
        });
    }

    initialMouseX = 0;
    initialMouseY = 0;

    setDirtyState(state: boolean) {
        this.dirtyState = state;
    }

    getMode() {
        var modeName: string = this.extension === '.raml' ? 'ace/mode/yaml' : 'ace/mode/text';

        modeName = 'ace/mode/text';

        if(this.extension === '.raml') {
            modeName = 'ace/mode/yaml';
        }

        if(this.extension === '.ts') {
            modeName = 'ace/mode/typescript';
        }

        var AceMode = this.ace.require(modeName).Mode;

        var result = new AceMode();

        return result;
    }

    getPath():string {
        return this.editorPath;
    }

    getBuffer(): any {
        return this.textBuffer;
    }

    getLastCursor(): TextEditorCursor {
        if(!this.cursor) {
            this.cursor = new TextEditorCursor(this);
        }

        return this.cursor;
    }

    getCursorBufferPosition(): Point {
        var acePosition: Point = <Point>this.aceEditor.getCursorPosition();

        return {column: acePosition.column, row: acePosition.row};
    }

    setCursorBufferPosition(position: Point) {
        this.setSelectedBufferRange(<Range>{start: position, end: position}, null);
    }

    setSelectedBufferRange(range: Range, arg: any) {
        var AceRange = this.ace.require("ace/range").Range;

        var preparedRange: Range = getRange(range.start.row + 1, range.start.column, range.end.row + 1, range.end.column);

        var aceRange = new AceRange(preparedRange.start.row, preparedRange.start.column, preparedRange.end.row, preparedRange.end.column);

        this.aceEditor.resize(true);

        this.aceEditor.selection.setRange(aceRange);

        this.aceEditor.gotoLine(preparedRange.start.row, preparedRange.start.column, true);
    }

    setAceEditor(aceEditor: any) {
        this.aceEditor = aceEditor;

        var textBuffer = this.getBuffer();

        textBuffer.characterIndexForPosition = function (position:Point) {
            var result = aceEditor.getSession().getDocument().positionToIndex({row: position.row, column: position.column}, 0);

            return result;
        }

        textBuffer.positionForCharacterIndex = function (index:number) {
            var result = aceEditor.getSession().getDocument().indexToPosition(index, 0);

            return result;
        }

        textBuffer.setTextInRange = (range:Range, value:string) => {
            var AceRange = this.ace.require("ace/range").Range;

            var preparedRange: Range = getRange(range.start.row, range.start.column, range.end.row, range.end.column);

            var aceRange = new AceRange(preparedRange.start.row, preparedRange.start.column, preparedRange.end.row, preparedRange.end.column);

            aceEditor.getSession().replace(aceRange, value);
        }

        textBuffer.setText = (text) => {
            var top = this.aceEditor.session.getScrollTop();

            this.aceEditor.setValue(text, 100);

            this.aceEditor.resize(true);

            this.aceEditor.session.setScrollTop(top);
        }

        this.aceEditor.session.setValue(textBuffer.getText());

        var textEditor = this;

        var markers = [];

        this.checkErrors(markers);

        var extension = this.extension;

        this.aceEditor.session.selection.on("changeCursor", function (event) {
            textEditor.getLastCursor().doChangePosition();
        })

        this.aceEditor.on('change', arg => {
            textBuffer.text = aceEditor.getValue();

            textBuffer.doChange(arg);

            this.setDirtyState(true);

            this.updateDirtyMarker();

            if (extension !== '.raml') {
                return;
            }

            markers.forEach(marker=> {
                aceEditor.getSession().removeMarker(marker);
            });

            markers = [];

            this.checkErrors(markers);
        });
    }

    checkErrors(markers: any[]) {
        var messages:any[] = getLazy('linter').lint(this);

        var AceRange = this.ace.require("ace/range").Range;

        var annotatios = [];

        messages.forEach(message => {
            if (message.type.toLowerCase() === 'error') {
                var range:Range = getRange(message.range[0][0], message.range[0][1], message.range[1][0], message.range[1][1]);

                var aceRange = new AceRange(range.start.row, range.start.column, range.end.row, range.end.column);

                annotatios.push({row: range.start.row, text: message.text, type: "error"});

                markers.push(this.aceEditor.session.addMarker(aceRange, "ace_error_highlight", 'line', false));
            }
        });

        this.aceEditor.getSession().setAnnotations(annotatios);
    }

    updateDirtyMarker() {
        if(isSimpleMode()) {
            return;
        }

        workspace.updateDirtyMarker(this.editorPath, this.dirtyState);
    }

    getText(): string {
        return this.getBuffer().getText();
    }

    setText(text) {
        this.getBuffer().setText(text);
    }

    insertText(text:string) {
        this.aceEditor.insert(text);
    }

    getGrammar() {
        return this.grammar;
    }

    onDidStopChanging(callback) {
        return this.textBuffer.onDidStopChanging(callback);
    }

    onDidDestroy(callback) {
        this.destroyCallbacks.push(callback);

        return {
            dispose: () => {
                this.destroyCallbacks = this.destroyCallbacks.filter(child => {
                    return child !== callback;
                });
            }
        }
    }

    onDidChangePath(callback) {
        return {
            dispose: function() {}
        }
    }

    destroy() {
        this.doCache();

        JQ(this.element).contextmenu("replaceMenu");

        this.destroyCallbacks.forEach(callback => callback());
    }
}

function getActionsTree(actions) {
    var actionsTree = {children: [], categories: {}};

    actions.forEach(action => {
        if(action.category && action.category.length > 0) {
            var current = actionsTree;

            for(var i = 0; i < action.category.length; i++) {
                var name = action.category[i];

                if(!current.categories[name]) {
                    var newCategory = {title: name, children: [], categories: {}};

                    current.categories[name] = newCategory;

                    current.children.push(newCategory);
                }

                current = current.categories[action.category[i]];
            }

            current.children.push(actionToItem(action));
        } else {
            actionsTree.children.push(actionToItem(action));
        }
    });

    return actionsTree.children;
}

function actionToItem(action) {
    return {
        title: action.name,
        action: action.onClick ? action.onClick : () => {},
        uiIcon: null
    }
}

function registerMenu(container, selector: string, actions: any[], beforeOpen, position?) {
    var menuItems = actions.map((menuItem) => {
        return <any>{
            title: menuItem.label,
            action: menuItem.handler,
            uiIcon: menuItem.icon,
            children: menuItem.children
        }
    });

    JQ(container).contextmenu({
        delegate: selector,

        menu: menuItems,

        position: (event, ui) => {
            return position ? position(event, ui) : {my: "center", at: "center", of: event, collision: "fit"};
        },

        beforeOpen: (event, ui) => beforeOpen(event, ui, menuItems)
    });
}



class Deserializers {
    add(arg: any) {

    }
}

class TabViewer {
    element: HTMLDivElement = document.createElement('div');

    handles: {name: string; id: string;}[] = [];

    onOpen: (id: string) => void;
    onClose: (id: string) => void;

    constructor(onOpen: (id: string) => void, onClose: (id: string) => void) {
        this.onOpen = onOpen;
        this.onClose = onClose;

        this.element.style.position = 'relative';
        this.element.style.width = '100%';
        this.element.style.backgroundColor = 'black';
        this.element.id = "custom-tab-viewer";
    }

    clearCache() {
        this.handles = [];

        this.close("none");
    }

    open(id: string, name: string) {
        var active = {name: name, id: id, active: true};

        var oldHandles = this.handles;

        this.handles = [];

        var contains = false;

        oldHandles.forEach(handle => {
            this.handles.push(handle);

            var isActive = (handle.id === active.id);

            (<any>handle).active = isActive;

            if(isActive) {
                contains = true;
            }
        });

        if(!contains) {
            this.handles.push(active);
        }

        this.refresh();

        this.onOpen(active.id);
    }

    setDirty(dirties: string[]) {
        this.handles.forEach(handle => {
            (<any>handle).setDirty(dirties.indexOf(handle.id) >= 0);
        });
    }

    refresh() {
        this.element.innerHTML = '';

        this.handles.forEach(handle => {
            var active = (<any>handle).active;
            var root = document.createElement('div');
            var nameElement = document.createElement('h7');
            var closeElement = document.createElement('h7');

            root.style.display = 'inline-block';
            root.style.backgroundColor = active ? '#25282c' : 'black';
            root.style.color = active ? 'white' : 'gray';
            root.style.fontWeight = active ? 'bold' : 'normal';
            root.style.borderLeft = '1px solid #25282c';
            root.style.borderRight = '1px solid #25282c';
            root.style.paddingTop = '10px';
            root.style.paddingBottom = '10px';

            root.addEventListener('click', event => {
                this.open(handle.id, handle.name);
            });

            nameElement.style.display = 'inline-block';
            nameElement.style.paddingLeft = '10px';
            nameElement.style.cursor = 'pointer';

            closeElement.style.display = 'inline-block';
            closeElement.style.paddingLeft = '7px';
            closeElement.style.paddingRight = '10px';
            closeElement.style.cursor = 'pointer';

            closeElement.innerHTML = 'X';

            (<any>closeElement).addEventListener('click', event => {
                this.close(handle.id);

                event.stopPropagation();
            });

            root.appendChild(nameElement);
            root.appendChild(closeElement);

            this.element.appendChild(root);

            (<any>handle).getHeight = () => {
                return root.clientHeight;
            }

            (<any>handle).setDirty = (isDirty: boolean) => {
                nameElement.innerHTML = (isDirty ? '* ' : '') + handle.name;
            };

            (<any>handle).setDirty(workspace.dirties.indexOf(handle.id) >= 0);
        });
    }

    close(id: string) {
        var oldHandles = this.handles;

        this.handles = [];

        var activeClosed = false;

        oldHandles.forEach(handle => {
            if(handle.id !== id) {
                this.handles.push(handle);
            } else if((<any>handle).active) {
                activeClosed = true;
            }
        });

        if(this.handles.length > 0 && activeClosed) {
            (<any>this.handles[0]).active = true;
        }

        this.refresh();

        this.onClose(this.handles.length > 0 ? this.handles[0].id : null);
    }
}

class GitContentProvider {
    getContentFor(difference) {
        var content = fs.readFileSync(difference).toString();

        return content;
    }

    getUrlFor(difference) {
        var contentPath = difference.substring('/virtual/'.length);

        var repoName = contentPath.substring(0, contentPath.indexOf('/'));

        var contentPath = contentPath.substring(repoName.length + 1);

        var url = 'https://api.github.com/repos/testramluser/' + repoName + '/contents/' + contentPath;

        return url;
    }
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function showLoading() {
    document.getElementById("loading-gif").style.display = null;
}

function hideLoading() {
    document.getElementById("loading-gif").style.display = "none";
}


function areMutationEventsAvailable() {
    var result = false;

    var testElement = document.createElement('div');

    testElement.addEventListener('DOMNodeInserted', function() {
        result = true;
    });

    document.body.appendChild(testElement);
    document.body.removeChild(testElement);

    return result;
}

var isMutationSupport = areMutationEventsAvailable();

var idx = getParameterByName('project');

function isSimpleMode() {
    try {
        return global.atomMode === 'spec' || global.atomMode === 'newSpec';
    } catch(exception) {
        return false;
    }
}

export var config = {
    grammars: {
        'api-workbench.grammars': ['source.raml']
    },

    get: function(key) {
        return this.grammars[key];
    }
}

export var grammars = {
    grammarsByScopeName: {
        'text.xml': {scopeName: 'text.xml', fileTypes: ['xml']},
        'source.json': {scopeName: 'source.json', fileTypes: ['json']},
        'text.plain.null-grammar': {scopeName: 'text.plain.null-grammar', fileTypes: []}
    },

    getGrammars: function() {
        var result = [];

        Object.keys(this.grammarsByScopeName).forEach(key => {
            result.push(this.grammarsByScopeName[key]);
        });

        return result;
    }
}

function exportTreeCreator() {
    var creator = (model) => {
        var treeViewer = UI.treeViewer(node => node.children, new MenuRenderer(() => {}));

        treeViewer.renderUI();

        treeViewer.setInput(model);

        return treeViewer;
    }

    global.treeViewerCreatorHandler(creator);
}

var JQ: any = global.jQuery;

export var deserializers = new Deserializers();

export var commands = {add: () => {}};

function getGlobal() {
    var globalGetter = function() {
        return this;
    }

    return globalGetter.apply(null);
}

function getLazy(moduleId) {
    return global.getLazy(moduleId);
}

export var workspace: Workspace;

export function init() {
    workspace = new Workspace();


    if(isSimpleMode() && global.atomMode !== 'newSpec') {
        exportTreeCreator();
    }

    if(isSimpleMode()) {
        if(global.atomMode === 'spec') {
            workspace.initSimpleUI();
        } else {
            workspace.initSimpleUINewSpec();
        }
    }
}