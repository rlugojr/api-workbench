/// <reference path="../../../typings/main.d.ts" />
import fs = require('fs');
import path = require('path');

XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest

var global = getGlobal();

export interface IContentManager {
    loadContentByUrl(url);

    loadContent(repo);

    store(comment, differences, contentProvider, onSuccess);

    abort();
}

export class GitManager implements IContentManager {
    config;

    callbacks = {};

    contentLoaded: {path: string; content: string;filePath?:string; repo?:string}[] = [];

    collectingApis = false;

    workDirectory = null;

    constructor(config, onCloneStart, onCloneComplete, onCloneAbort) {
        this.config = config;

        this.callbacks['start'] = onCloneStart ? onCloneStart : () => {};
        this.callbacks['end'] = onCloneComplete ? content => {
            markAsOpened(content, true);

            onCloneComplete(content);
        } : () => {};
        this.callbacks['abort'] = onCloneAbort ? onCloneAbort : () => {};
    }

    loadContentByUrl(url) {
        if(!url || !(url.indexOf('http') === 0)) {
            console.log('failed: ' + url);
        }

        doCloneRepoByUri(url, this);
    }

    loadContent(repo) {
        if(this.collectingApis) {
            var content = readDirContent(repo, path.resolve(this.workDirectory, repo.repo), this.workDirectory);

            this.callbacks['end'](content);

            return;
        }

        doCloneRepo(repo, this);
    }

    store(comment, differences, contentProvider, onSuccess) {
        doPush(comment, differences, contentProvider, onSuccess, this);
    }

    abort() {

    }
}

export class InputDataManager implements IContentManager {
    config;

    callbacks = {};

    contentLoaded: {path: string; content: string;}[] = [];

    constructor(config, onCloneStart, onCloneComplete, onCloneAbort) {
        this.config = config;

        this.callbacks['start'] = onCloneStart ? onCloneStart : () => {};
        this.callbacks['end'] = onCloneComplete ? content => {
            content.forEach(item => {
                item.path = path.resolve('/virtual', item.path);
                item.openAfterLoading = item.open;
            });

            onCloneComplete(content);
        } : () => {};
        this.callbacks['abort'] = onCloneAbort ? onCloneAbort : () => {};
    }

    loadContentByUrl(url) {

    }

    loadContent(listOfItems) {
        this.callbacks['start']();

        setTimeout(() => this.callbacks['end'](listOfItems))
    }

    store(comment, differences, contentProvider, onSuccess) {

    }

    abort() {

    }
}

export class EmbedContentManager implements IContentManager {
    config;

    callbacks = {};

    contentLoaded: {path: string; content: string;}[] = [];

    constructor(config, onCloneStart, onCloneComplete, onCloneAbort) {
        this.config = config;

        this.callbacks['start'] = onCloneStart ? onCloneStart : () => {};
        this.callbacks['end'] = onCloneComplete ? content => {
            markAsOpened(content, false);

            onCloneComplete(content);
        } : () => {};
        this.callbacks['abort'] = onCloneAbort ? onCloneAbort : () => {};
    }

    loadContentByUrl(url) {

    }

    loadContent(descriptor) {
        loadProject(descriptor, this);
    }

    store(comment, differences, contentProvider, onSuccess) {

    }

    abort() {

    }
}

function readDirContent(project, dir, workDirectory): any[] {
    var result: any[] = [];

    var names = fs.readdirSync(dir);

    names.forEach(name => {
        if(name === '.git' || name === '.DS_Store' || name === '.gitignore') {
            return;
        }

        var filePath = path.resolve(dir, name);

        if(fs.statSync(filePath).isFile()) {
            var relativePath = path.relative(path.resolve(workDirectory, project.repo), filePath);

            var element = {
                path: '/virtual/' + project.repo + '/' + relativePath,
                content: fs.readFileSync(filePath).toString(),
                filePath: relativePath,
                repo: project.repo
            }

            result.push(element);
        } else {
            result = result.concat(readDirContent(project, filePath, workDirectory));
        }
    });

    return result;
}

function loadProject(descriptor, manager: EmbedContentManager) {
    manager.callbacks['start']();

    if(descriptor.embedUrl) {
        var request = buildXHR();

        request.open('GET', descriptor.embedUrl);

        request.onload = () => {
            var data  = JSON.parse(request.responseText);

            var reference;

            data.forEach(element => {
                if(element.name === descriptor.repo) {
                    reference = element;
                }
            });

            var blobRequest = buildXHR();

            blobRequest.open('GET', reference.git_url + '?access_token=' + manager.config.accessToken);

            blobRequest.onload = () => {
                var blobReference = JSON.parse(blobRequest.responseText);

                var blob = blobReference.content;

                var content = atob(blob.replace(/\s/g, ''));

                try {
                    manager.callbacks['end'](JSON.parse(content));
                } catch(exception) {
                    console.log('');
                }
            }

            blobRequest.send();
        }

        request.send();

        return;
    }

    var url = descriptor.url;

    descriptor.files.forEach(fileName => {
        var filePath = '/virtual/' + fileName;

        manager.contentLoaded.push({
            path: filePath,
            content: fs.readFileSync('/' + url + '/' + fileName).toString()
        });
    });

    setTimeout(() => {
        manager.callbacks['end'](manager.contentLoaded);
    }, 10);
}

export class CommitDialog {
    message = "";

    onCommit: any = null;

    destroyer: any = null;

    success = false;

    element : HTMLDivElement = null;

    constructor(onCommit) {
        this.onCommit = onCommit;
    }

    show() {
        var UI = require("../ramlscript/UI");
        var factory = require("../ramlscript/UIFactory");

        var rootContainer = factory.section("Push To Github", UI.Icon.GIT_COMMIT,false,false).setPercentWidth(100);

        var textBox = UI.texfField("Commit Message: ", '', arg => {})

        var inputRow = factory.hc().margin(0, 0, 0, 10).setPercentWidth(100);

        var pushingLabel = factory.label("");

        var buttonBar=factory.hc().setPercentWidth(100).setStyle("display","flex");

        var okButton=factory.button("Commit",UI.ButtonSizes.NORMAL,UI.ButtonHighlights.SUCCESS,UI.Icon.NONE,x=>{
            pushingLabel.setText('Pushing...');

            this.onCommit((<any>textBox).getBinding().value, () => {
                this.destroyer.destroy();
            });
        });

        okButton.setDisabled(false);

        buttonBar.addChild(factory.button("Cancel", UI.ButtonSizes.NORMAL, UI.ButtonHighlights.NO_HIGHLIGHT, UI.Icon.NONE, () => this.destroyer.destroy()).margin(10,10))
        buttonBar.addChild(factory.label("",null,null,null).setStyle("flex","1"));
        buttonBar.addChild(okButton);

        rootContainer.addChild(textBox);
        rootContainer.addChild(pushingLabel);
        rootContainer.addChild(inputRow);
        rootContainer.addChild(buttonBar);

        this.element = rootContainer.renderUI();

        this.destroyer = global.atom.workspace.addModalPanel({item: this.element});

        this.element.focus();
    }
}

class LoadWatcher {
    children = {};

    onCheck:any;

    constructor(onCheck) {
        this.onCheck = onCheck;
    }

    start(names:string[]) {
        names.forEach(name => {
            this.children[name] = {};
        })
    }

    complete(name) {
        this.children[name].completed = true;

        this.doCheck();
    }

    directory(name):LoadWatcher {
        var child = this.children[name];

        child.parent = new LoadWatcher(()  => {
            child.completed = true;

            this.doCheck();
        });

        return child.parent;
    }

    doCheck() {
        var result:boolean = true;

        Object.keys(this.children).forEach(key => {
            var child = this.children[key];

            if (!child.completed) {
                result = false;
            }
        });

        if (result) {
            this.onCheck();
        }
    }
}

function doCloneRepoByUri(uri, manager: GitManager) {
    var request = buildXHR();

    request.open('GET', uri);

    request.onload = () => {
        var data  = JSON.parse(request.responseText);

        doCloneRepo(data, manager);
    }

    request.onerror = error => {
        manager.callbacks['abort']({error: error, repoUri: uri});
    }

    request.send();
}

function doCloneRepo(repo: any, manager: GitManager) {
    manager.callbacks['start']();

    var request = buildXHR();

    request.open('GET', 'https://api.github.com/repos/' + repo.full_name + '/contents?access_token=' + manager.config.accessToken);

    request.onload = () => {
        var data: any[] = JSON.parse(request.responseText);

        startCloning(repo.name, data, new LoadWatcher(() => {
            manager.callbacks['end'](manager.contentLoaded);
        }), manager);
    }

    request.onerror = error => {
        manager.callbacks['abort']({error: error, repo: repo.name});
    }

    request.send();
}

function startCloning(repoName: string, gitNode: any[], loader: LoadWatcher, manager: GitManager) {
    var names: string[] = [];

    gitNode.forEach(file => {
        if(file.type === 'file' || file.type === 'dir') {
            names.push(file.name);
        }
    });

    loader.start(names);

    gitNode.forEach(file => {
        var request;

        var url = ((file.type === 'file') ? (file.download_url + '?access_token=') : (file.url + '&access_token=')) + manager.config.accessToken;

        var onload = () => {
            var content = request.responseText;

            if(file.type == 'file') {
                var filePath = '/virtual/' + repoName + '/' + file.path;

                manager.contentLoaded.push({
                    path: filePath,
                    content: <string>content,
                    filePath: file.path,
                    repo: repoName
                });

                loader.complete(file.name);
            } else {
                startCloning(repoName, JSON.parse(content), loader.directory(file.name), manager);
            }
        }

        if(manager.collectingApis && file.type === 'file') {
            url = path.resolve(manager.workDirectory, './' + repoName + '/' + file.path);

            request = {responseText: fs.existsSync(url) ? fs.readFileSync(url) : ''};

            onload();

            return;
        }

        request = buildXHR();

        request.open('GET', url + '&cachectrl=' + new Date().getTime(), true);

        request.onload = onload;

        request.onerror = error => {
            loader.complete(file.name);

            console.log('Failed download: ' + url);
        }

        request.send();
    });
}

function doPush(message, differences, contentProvider, onSuccess, manager: GitManager) {
    var commits = 0;

    differences.forEach((difference) => {
        var request = buildXHR();

        var content = contentProvider.getContentFor(difference);

        var fileUrl = contentProvider.getUrlFor(difference);

        var parentUrl = path.dirname(fileUrl);

        request.open('GET', parentUrl + '?access_token=' + manager.config.accessToken, true);

        request.onload = () => {
            var fileInfos = JSON.parse(request.responseText);

            var fileInfo;

            fileInfos.forEach(info => {
                if(info.name === (difference.repo ? difference.repo : path.basename(difference))) {
                    fileInfo = info;
                }
            });

            var pushRequest = buildXHR();

            pushRequest.open('PUT', fileUrl + '?access_token=' + manager.config.accessToken, true);

            var commit = {
                message: message,
                content: btoa(content.replace(/[^\x00-\x7F]/g, "").replace(/\x14/g, "")),
                sha: fileInfo ? fileInfo.sha : undefined
            }

            pushRequest.send(JSON.stringify(commit));

            pushRequest.onload = () => {
                commits++;

                if(manager.collectingApis) {
                    console.log('pushed: ' + difference.repo + '['+ commits + '/' + differences.length + ']');
                }

                if(commits == differences.length) {
                    onSuccess();
                }
            }
        }

        request.send();
    });
}

function markAsOpened(content, isRepo) {
    var itemToOpen = null;

    for(var i = 0; i < content.length; i++) {
        var item = content[i];

        if(path.extname(item.path) !== '.raml') {
            continue;
        }

        var dirName = path.dirname(item.path);

        if(dirName === '/virtual') {
            item.openAfterLoading = true;

            return;
        }

        if(path.dirname(dirName) === '/virtual') {
            itemToOpen = item;

            if(isRepo) {
                item.openAfterLoading = true;

                return;
            }
        }
    }

    if(itemToOpen) {
        itemToOpen.openAfterLoading = true;
    }
}

function buildXHR() {
    var request: XMLHttpRequest = new XMLHttpRequest();

    return request;
}

function getGlobal() {
    var globalGetter = function() {
        return this;
    }

    return globalGetter.apply(null);
}