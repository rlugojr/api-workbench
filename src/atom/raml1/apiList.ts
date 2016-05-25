///// <reference path="../../../typings/main.d.ts" />
//import path      = require('path');
//import fs      = require('fs');
//var mkdirp      = require('mkdirp');
//import UI=require("atom-ui-lib");
//import SC=require("../util/ScrollViewUI")
////import hlm=require("../../ramlscript/highLevelModel")
//import endpoint = require('./../../../../ramlscript-ui/src/ramlscript/endpoint');
//import views=require("./../../../../ramlscript-ui/src/ramlscript/viewManagement");
//
//export function execProcess(
//    callPath:string,
//    wrkDir:string,
//    logEnabled:boolean = false,
//    errLogEnabled:boolean = true,
//    messageBefore:string = '',
//    messageAfter:string = '',
//    messageError:string = '',
//    maxLogLength:number=-1,onError:(err)=>void=null)
//{
//    //try {
//    //    if (logEnabled) {
//    //        console.log(messageBefore)
//    //    }
//    //    var logObj = cp.execSync(
//    //        callPath,
//    //        {
//    //            cwd: wrkDir,
//    //            encoding: 'utf8',
//    //            stdio: [0,1,2]
//    //        });
//    //
//    //    if (logEnabled) {
//    //        console.log(messageAfter);
//    //        if (logObj) {
//    //            var log = logObj.toString();
//    //            if(log.trim().length>0) {
//    //                if (maxLogLength < 0) {
//    //                    console.log(log)
//    //                }
//    //                else if (maxLogLength > 0) {
//    //                    console.log(log.substring(0, Math.min(maxLogLength, log.length)))
//    //                }
//    //            }
//    //        }
//    //    }
//    //}
//    //catch (err) {
//    //    if (onError){
//    //        onError(err);
//    //    }
//    //    if (errLogEnabled) {
//    //        console.log(messageError)
//    //        console.log(err.message)
//    //    }
//    //}
//}
//import atom = require('../raml1/atomWrapper');
//import fileDialogUtils = require("./../../../../ui-libs/src/fileDialogUtils");
//
//var XMLHttpRequestConstructor = require("xmlhttprequest").XMLHttpRequest;
//function buildXHR( ){
//    var x: XMLHttpRequest = new XMLHttpRequestConstructor;
//    return x
//}
//
//export var accessToken = null;
//
//export var reposUrl = null;
//
//
//interface BranchInfo{
//    name: string
//}
//function branches(repoName:string,cb:(br:BranchInfo[])=>void){
//    var o=buildXHR()
//    var reposLink = reposUrl ? (reposUrl + '?access_token=' + accessToken) : 'https://api.github.com/repos/raml-apis/'+repoName+'/branches';
//    o.open("GET",reposLink);
//    o.onload=function(){
//        var data:any[]=JSON.parse(o.responseText)
//        cb(data);
//    }
//    o.send();
//}
//var defaultBranch="production";
//
//export function gitInstalled() : boolean {
//    if (externalCloner) {
//        return true;
//    }
//
//    var errorOccured = false;
//    execProcess(
//        'git version',
//        fileDialogUtils.getHome(),
//        true,
//        true,
//        "",
//        "",
//        'Git launch failed',
//        -1,
//        x=>{
//            errorOccured = true;
//        }
//    )
//
//    return !errorOccured;
//}
//
//class RamlOutline extends SC.Scrollable{
//
//    constructor(){
//        super()
//
//    }
//
//    getTitle(){
//        return "RAML Apis"
//    }
//
//    disposables = new UI.CompositeDisposable()
//
//
//    _isAttached:boolean;
//
//    load(){
//        ///Users/kor/apis/AccuWeather/accuWeather.raml
//        //https://api.github.com/orgs/raml-apis/repos
//        var sec=UI.section("RAML Apis");
//        sec.addChild(UI.label("loading..."))
//        this.html(sec.renderUI())
//        var o=buildXHR()
//        var reposLink = reposUrl ? (reposUrl + '?access_token=' + accessToken) : 'https://api.github.com/orgs/raml-apis/repos?per_page=200';
//        o.open("GET",reposLink);
//        var outer=this;
//        var home=fileDialogUtils.getHome();
//        var dir=path.resolve(home,"apis");
//        var apiListData = require('../util/config/apiList.json');
//
//            var data:any[]= apiListData.filter(repo => {
//                return reposUrl ? repo.name !== 'preloaded' : true;
//            });
//
//            var secHC=UI.hc();
//            var sett=UI.a("Cloning to: "+dir+"(click to change)",x=>{
//                    fileDialogUtils.openFolderDialog("Please enter new path to clone", newVal=>{
//                        dir=newVal;
//                        sett.setText("Cloning to: "+dir+"(click to change)");
//                    }, true, dir);
//            }
//            ,UI.Icon.SETTINGS,UI.TextClasses.NORMAL,UI.HighLightClasses.HIGHLIGHT);
//            secHC.addChild(sett);
//            var branchLink:UI.TextElement<any>=UI.a(""+defaultBranch,x=>{
//                UI.prompt("Please enter name of the branch",y=>{
//                    defaultBranch=y;
//                    branchLink.setText(y)
//                },defaultBranch);
//            },UI.Icon.GIT_BRANCH,UI.TextClasses.NORMAL,UI.HighLightClasses.HIGHLIGHT);
//            branchLink.margin(10,0);
//            //secHC.addChild(branchLink)
//            var l=UI.list(data,x=>{return UI.hc(UI.label(x.name,UI.Icon.REPO ,UI.TextClasses.HIGHLIGHT ,UI.HighLightClasses.NONE).pad(10,10),UI.button("clone",UI.ButtonSizes.EXTRA_SMALL,UI.ButtonHighlights.SUCCESS,UI.Icon.NONE,
//                y=>{
//                    if(externalCloner) {
//                        externalCloner(x);
//
//                        return;
//                    }
//                    if (!fs.existsSync(dir)){
//                        fs.mkdirSync(dir);
//                    }
//
//                    var ok=cloneRepo(x.git_url,dir);
//                    if (ok) {
//                        var output = path.resolve(dir, x.name);
//
//                        if (!fs.existsSync(dir)) {
//                            fs.mkdirSync(dir);
//                        }
//                        var a = path.resolve(output, "api.raml");
//                        if (!fs.existsSync(a)) {
//                            a = path.resolve(output, x.name + ".raml");
//                        }
//                        if (fs.existsSync(a)) {
//                            (<any>atom).open({pathsToOpen: [output, a]});
//
//                        }
//                        else {
//                            //TODO FIX me
//                            (<any>atom).open({pathsToOpen: [output]});
//                        }
//                    }
//                })
//            )});
//            secHC.addChild(l)
//            outer.html(secHC.renderUI());
//    }
//
//    /**
//     * State resolving dependency when the console is attached.
//     */
//    attached (){
//        if (this._isAttached) {
//            return
//        }
//        this.load();
//        this._isAttached = true
//    }
//
//    /**
//     * Destroy the console UI and dispose of anything listening.
//     */
//    destroy (): void {
//        this.disposables.dispose()
//    }
//
//}
///**
// * Prompt the user for parameters.
// */
//export function info (name:string, callBack : (newValue:string)=>void): void {
//
//    var pane = null;
//    var section=UI.section(name,UI.Icon.BOOK,false,false)
//
//
//    var buttonBar=UI.hc().setPercentWidth(100).setStyle("display","flex");
//    buttonBar.addChild(UI.label("",null,null,null).setStyle("flex","1"))
//
//
//
//    var okButton = UI.button(
//        "Ok",
//        UI.ButtonSizes.NORMAL,
//        UI.ButtonHighlights.SUCCESS,
//        UI.Icon.NONE,
//            x=>{
//            pane.destroy()
//
//        }
//    )
//    buttonBar.addChild(okButton);
//    section.addChild(buttonBar);
//
//    pane =(<any>atom).workspace.addModalPanel( { item: section.renderUI() });
//}
//
//function cloneRepo(repo:string, dir:string, branch:string = null) {
//    if (branch==null){
//        branch=defaultBranch;
//    }
//    var repoName:string = extractRepoName(repo)
//    //utils.deleteFiles(path.resolve(dir, repoName))
//    mkdirp.sync(dir)
//    var ok=true;
//    execProcess(
//        'git clone --branch ' + branch + ' "' + repo+"\"",
//        dir,
//        true,
//        true,
//        'Cloning GIT repository: ' + repo,
//        'Cloning complete: ' + repo,
//        'Cloning failed: ' + repo, -1,x=>{
//            ok=false;
//            info(x.message,y=>{})
//        }
//
//    )
//    return ok;
//}
//
//function extractRepoName(repoPath:string) {
//    return repoPath.substring(repoPath.lastIndexOf('/') + 1, repoPath.lastIndexOf('.'))
//}
//interface Api{
//    project:hlm.ApiProject
//    url:string;
//}
//function calcUrl(id:string){
//    if (id=="gmail"){
//        id="GoogleMail"
//    }
//    return "https://github.com/raml-apis/"+id+".git"
//}
//
//export function showPopularApis(){
//    if(!gitInstalled()) {
//        info("GIT is required to clone APIs. Please install GIT.",x=>{});
//        return;
//    }
//
//    views.doSplit(new RamlOutline(),views.SplitDirections.RIGHT);
//}
//
////function importAPI(p:Api,folder:string,cb:(x:string)=>string){
////    var home=folder;
////    console.log("Cloning:"+p.url)
////    var id=p.project.id();
////    if (id=="gmail"){
////        id="GoogleMail"
////    }
////
////    if(id == 'CodeBaseHQ') {
////        generateEndpoint(path.resolve(__dirname, "./codebasehq.raml"), folder, id);
////
////        cb(`
////import ${id} = require("./${id}");
////
////function ${(<any>p).project._data.ch[0].n}Service(request: ${id}.Request):void {
////
////}
////
////${id}.bind(${(<any>p).project._data.ch[0].n}Service, '/${(<any>p).project._data.ch[0].n}');
////
////`);
////
////        return;
////    }
////
////    var output=home+"/"+id;
////    if (!fs.exists(output)){
////        {
////
////            cloneRepo(p.url, home);
////        }
////    }
////    var a=path.resolve(output,"api.raml");
////    if (!fs.existsSync(a)){
////        a=path.resolve(output,p.project.id()+".raml");
////    }
////    if (fs.existsSync(a)){
////        notebooks.loadAndWrapApi(a).then(x=>{
////            var apiImpl=r2ts.raml2ts(x,new r2ts.Config());
////            apiImpl = `
////                    export function createApi(${notebooks.getPDecl(x)}):Api{
////                        return new ApiImpl(${notebooks.getPcalls(x)});
////                    }
////                    ${apiImpl}\n`;
////            var apiFile=path.resolve(folder,"api"+p.project.id()+".ts");
////            console.log(apiFile)
////            fs.writeFileSync(apiFile,apiImpl)
////            var dm=new depMan.DependencyManager()
////            dm.updateDeps(apiFile)
////            cb("import "+p.project.id()+" = require(\"./api"+p.project.id()+"\")\nvar "+p.project.id()+"Client="+p.project.id()+".createApi()");
////            //console.log(apiImpl);
////            return x;
////        })
////        //r2ts.raml2ts()
////    }
////}
//
//
//function storeEndpoint(content: string, path:string) {
//    fs.writeFileSync(path, content);
//}
//
//class APIModelRend implements UI.ICellRenderer<hlm.ApiNode<any>>{
//
//    constructor(private _folder:()=>string,private cb:(x:string)=>string){
//
//    }
//
//    render(model:hlm.ApiNode<any>):UI.BasicComponent<any> {
//        if (model instanceof hlm.ApiDefinition){
//            return UI.a(model.id(),x=>{
//                var prj=model.parent();
//                var api={url:calcUrl(model.id()),project:<hlm.ApiProject>model.parent()};
//                importAPI(api,this._folder(),this.cb)
//            })
//        }
//        return UI.label(model.id());
//    }
//}
//
//export function apiView(fld:()=>string,cb:(string)=>string){
//    var apis = hlm.RAMLWorkspaceProvider.getInstance();
//
//    var v= UI.treeViewerSection("APIS",UI.Icon.TELESCOPE,<hlm.ApiNode<any>>apis,x=>{
//        if (x&&x.children) {
//            if (x instanceof hlm.ApiDefinition){
//                return [];
//            }
//            return x.children().filter(i=>(i&&i.id()) ? true : false)
//        }
//        return [];
//    },new APIModelRend(fld,cb));
//    v.viewer.setBasicLabelFunction(x=>{
//            if (x.parent()){
//                return x.parent().id()+x.id();
//            }
//            return x.id()}
//    );
//
//    //addFakeProject(apis).then(x=>{
//    //    console.log(x);
//    //});
//
//    return v;
//}
//
//
//
//var externalCloner: any = null;
//
//export function onClone(cloner) {
//    externalCloner = cloner;
//}
