/// <reference path="../../../typings/main.d.ts" />

import UI=require("atom-ui-lib")
import SC=require("../util/ScrollViewUI")
import path=require('path')
import Disposable = UI.IDisposable
import CompositeDisposable = UI.CompositeDisposable

import rp=require("raml-1-parser")
import lowLevel=rp.ll;
import hl=rp.hl;
var universes=rp.universes

import fs=require("fs")
import details2=require("./details2")
import contextActions = require("raml-actions")
import commonContextActions = require("../context-menu/commonContextActions")
import editorTools=require("./editor-tools")
import _=require("underscore")
import pair = require("../../util/pair");
import {universeHelpers} from "raml-1-parser/dist/index";

export class RamlOutline extends SC.Scrollable {
    private _rs: UI.TabFolder;

    private createTree(p: hl.IParseResult) {
        this._rs = createTree(p, sender => {
            if(editorTools.aquireManager()._details && sender.selection && sender.selection.elements && this.fire == true){
                if (sender.selection.elements.length>0&&sender.selection.elements[0]) {
                    editorTools.aquireManager().setSelectedNode(sender.selection.elements[0]);
                }
            }
        });
        this._viewers = [0, 1, 2, 3].map(i=> <UI.TreeViewer<any, any>> this._rs.get(i).content);
    }

    private _viewers: UI.TreeViewer<any,any>[];

    constructor() {
        super();

        this.createTree(null);
        (<any>this).addClass('raml-outline');
        this.addChild(this._rs);
    }

    getTitle() { return "Outline"; }

    disposables = new CompositeDisposable();

    _isAttached : boolean;

    private fire : boolean = true;

    private getNodePType(node: hl.IHighLevelNode) {
        while (node.parent() &&node.parent().parent()) {
            node = node.parent();
        }
        return getNodeType(node);
    }

    private _selectedNode: hl.IHighLevelNode;

    setSelection(node: hl.IHighLevelNode) {
        //if (this._selectedNode == node) return;
        this._selectedNode = node;

        this.fire = false;
        try {
            var index = this.getNodePType(node);
            var viewer = this._viewers[index];

            if (viewer != null) {
                viewer.setSelection(node);
                this._rs.setSelectedIndex(index);
            }
        }finally {
            this.fire = true;
        }
    }

    unit: hl.IHighLevelNode;
    setUnit(unit:hl.IHighLevelNode, force: boolean = false) {
        this._children=[];
        this.createTree(unit);
        (<any>this).addClass('raml-outline');
        this.addChild(this._rs);
        this.html(this.innerRenderUI());


    }

    attach() {
        if (!this._isAttached) {
            var $this = $(this);
            $this.html(this._rs.renderUI().outerHTML);
            this._isAttached = true;
        }
    }

    forEachViewer(command: (viewer: UI.TreeViewer<any, any>) => void) {
        this._viewers.forEach(command);
    }

    refresh() {
        var unit = this.unit;
        this.setUnit(null);
        this.setUnit(unit);
    }

    destroy (): void {
        editorTools.aquireManager()._view=null;
        this._selectedNode=null;
        this.unit=null;
        this._viewers=[];
        this._rs=null
        this._children=[];
        this.disposables.dispose()
    }
}

/*
 *
 */
export function treeSection(input: hl.IParseResult,
                            name: string,
                            icon: UI.Icon,
                            filterFunc: (x:hl.IHighLevelNode)=>boolean,
                            l: UI.ISelectionListener<any>,
                            opener: (x:hl.IParseResult)=>void=null) : UI.TreePanel<any,any> {

    var v = UI.treeViewerSection(name,icon,input,x=>getChildren(x).filter(x=>filterFunc(<hl.IHighLevelNode> x)),new HLRenderer(opener));

    v.viewer.setBasicLabelFunction(x=>x ? x.name() : '');
    v.viewer.setKeyProvider({
        key:(p:hl.IParseResult):string=>{
            return ""+p.lowLevel().start();
        }

    });
    v.viewer.addSelectionListener(l)
    return v;
}

enum HLNodeType {
    Resource,
    Schema,
    Type,
    Trait,
    Unknown
}

function getNodeType(node: hl.IHighLevelNode): HLNodeType {
    if (isResource(node)) return HLNodeType.Resource;
    else if (isOther(node)) return HLNodeType.Trait;
    else if (isResourceTypeOrTrait(node)) return HLNodeType.Type;
    else if (isSchemaOrType(node)) return HLNodeType.Schema;
    else return HLNodeType.Unknown;
}

function isResource(p: hl.IHighLevelNode) {
    return (p.definition().key()===universes.Universe08.Resource||p.definition().key()===universes.Universe10.Resource);
}
var prohibit={
    resources:true,
    schemas:true,
    types:true,
    resourceTypes:true,
    traits:true
}
function isOther(p: hl.IHighLevelNode) {
    if (p.property()){
        var nm=p.property().nameId();
        if (prohibit[nm]){
            return false;
        }
    }
    return true;
}
function isResourceTypeOrTrait(p: hl.IHighLevelNode) {
    var pc=p.definition().key();

    return (pc ===universes.Universe08.ResourceType
        ||pc===universes.Universe10.ResourceType||
    pc === universes.Universe08.Trait
    ||
    pc===universes.Universe10.Trait);
}
function isApi(p: hl.IHighLevelNode) {
    var pc=p.definition().key();
    return pc===universes.Universe08.Api||pc===universes.Universe10.Api;
}
function isDocumentation(p: hl.IHighLevelNode) {
    var pc=p.definition().key();
    return ( pc=== universes.Universe08.DocumentationItem||pc===universes.Universe10.DocumentationItem);
}

function isSchemaOrType(p: hl.IHighLevelNode) {
    var pc=p.definition().key();
    return (pc===universes.Universe08.GlobalSchema)|| (p.property() && p.property().nameId()
        == universes.Universe10.LibraryBase.properties.types.name);
}


function getChildren(p:hl.IParseResult):hl.IParseResult[]{
    if (p == null) return [];
    if(p.isAttr()){
        return [];
    }
    if (p.isUnknown()){
        return [];
    }
    var ch=p.children();
    return ch.filter(x=>{
        if (x.isAttr()){
            return false;
        }

        if (x.isUnknown()){
            return false;
        }
        var e:hl.IHighLevelNode=<any>x;
        //return false;
        return true;
    })
}
function keyProvider(node: hl.IParseResult) {
    if (!node) return null;
    if (node && !node.parent()) return node.name();
    else return node.name() + " :: " + keyProvider(node.parent());
}
function fullPath(node: hl.IHighLevelNode) {
    if (node == null) return "";
    else return fullPath(node.parent()) + "/" + node.name();
}
export function simpleTree(input: hl.IParseResult, selectionListener: UI.ISelectionListener<any>, filterFunc: (x:hl.IHighLevelNode)=>boolean, opener: (x:hl.IParseResult)=>void=null) {
    var viewer = UI.treeViewer(x=>{
        if(x === null) {
            return [];
        }

        if (x.parent()==null){
        return getChildren(x).filter(x=>filterFunc(<hl.IHighLevelNode> x));
        }
        return getChildren(x);
    }, new HLRenderer(opener), fullPath);
    viewer.setBasicLabelFunction(x=>x.name());
    viewer.setKeyProvider({ key: keyProvider });
    viewer.addSelectionListener(selectionListener);

    viewer.getBinding().set(input);

    return viewer;
}

export function createTree(p: hl.IParseResult, selectionListener: (e : UI.SelectionChangedEvent<any>) => void, opener: (x: hl.IParseResult) => void = null) {

    var outline = simpleTree(p, { selectionChanged: selectionListener }, x=> (isResource(x)), opener);
    var schemas = simpleTree(p, { selectionChanged: selectionListener }, isSchemaOrType, opener);
    var types   = simpleTree(p, { selectionChanged: selectionListener }, isResourceTypeOrTrait, opener);
    var other  = simpleTree(p, { selectionChanged: selectionListener }, x=> (isOther(x) ), opener);

    var folder = new UI.TabFolder();

    folder.add("Resources", UI.Icon.SEARCH, outline, 'raml-icon-custom');
    folder.add("Schemas & Types", UI.Icon.SEARCH, schemas, 'raml-icon-custom');
    folder.add("Resource Types & Traits", UI.Icon.SEARCH, types, 'raml-icon-custom');
    folder.add("Other", UI.Icon.SEARCH, other, 'raml-icon-custom');
    folder.setSelectedIndex(0)
    folder.setOnSelected(()=>{
        var selectedTab = <UI.TreeViewer<hl.IParseResult, hl.IParseResult>> folder.selectedComponent();
        if (selectedTab) {
            var selection = selectedTab.getSelection();
            if (selection && selection.elements && selection.elements.length > 0) {
                selectionListener(new UI.SelectionChangedEvent(selectedTab, null, selection));
            }

            selectedTab.customizePanel(true);
        }
    })
    return folder;
}

export class HLRenderer implements UI.ICellRenderer<hl.IParseResult>{

    constructor(private opener: (x: hl.IParseResult) => void) {

    }
    render(model: hl.IParseResult): UI.BasicComponent<any> {
        try {
            if (model.isAttr()) {
                var attr = <hl.IAttribute>model;
                return UI.hc(UI.label(attr.name() + ":" + attr.value()), UI.a("", x=> {
                    var p1 = editorTools.aquireManager().getCurrentEditor().getBuffer().positionForCharacterIndex(model.lowLevel().start());
                    var p2 = editorTools.aquireManager().getCurrentEditor().getBuffer().positionForCharacterIndex(model.lowLevel().end());
                    editorTools.aquireManager().getCurrentEditor().setSelectedBufferRange({ start: p1, end: p1 }, {});

                }, UI.Icon.ARROW_SMALL_LEFT, null, null));

            }
            if (model.isUnknown()) {
                return UI.label("unknown");
            }
            var icon = UI.Icon.DASH;
            var highLight = UI.TextClasses.NORMAL;
            var node = <hl.IHighLevelNode>model;
            var pc=node.definition().key();
            if (pc === universes.Universe08.Resource||pc===universes.Universe10.Resource) {
                icon = UI.Icon.PRIMITIVE_SQUARE;
                highLight = UI.TextClasses.HIGHLIGHT;
            }
            if (pc === universes.Universe08.Method||pc===universes.Universe10.Method) {
                icon = UI.Icon.PRIMITIVE_DOT
                highLight = UI.TextClasses.WARNING;
            }
            if (pc === universes.Universe08.AbstractSecurityScheme||pc===universes.Universe10.AbstractSecurityScheme) {
                icon = UI.Icon.LOCK;
                highLight = UI.TextClasses.HIGHLIGHT;
            }
            if (pc === universes.Universe08.AbstractSecurityScheme||pc==universes.Universe10.AbstractSecurityScheme) {
                icon = UI.Icon.FILE_SUBMODULE;
                highLight = UI.TextClasses.NORMAL;
            }
            if (pc==universes.Universe10.TypeDeclaration && universeHelpers.isAnnotationTypesProperty(node.property())) {
                icon = UI.Icon.TAG;
                highLight = UI.TextClasses.HIGHLIGHT;
            }
            if (node.definition().isAssignableFrom(universes.Universe10.TypeDeclaration.name)||
                node.definition().isAssignableFrom(universes.Universe08.Parameter.name)) {
                if (node.property()&&node.property().nameId()==universes.Universe10.ObjectTypeDeclaration.properties.properties.name){
                    icon = UI.Icon.FILE_BINARY;
                    highLight = UI.TextClasses.SUCCESS;
                }
                else {
                    icon = UI.Icon.FILE_BINARY
                    highLight = UI.TextClasses.SUCCESS;
                }
            }
            var nm=model.name();
            var hnode=(<hl.IHighLevelNode>model);
            if (pc===universes.Universe08.DocumentationItem||pc===universes.Universe10.DocumentationItem){
                icon = UI.Icon.BOOK
                var a=hnode.attr("title");
                if (a){
                    nm=a.value();
                }
            }
            var extraText="";
            var extraClass=UI.TextClasses.NORMAL;

            var hc=UI.hc(UI.label(nm, icon, highLight))
            var tp=node.attr("type");
            if (tp){
                var vl=tp.value();
                if (vl==null){
                    vl="";
                }
                var sv="";
                if (typeof vl ==="object"){
                    sv=":"+(<hl.IStructuredValue>vl).valueName();
                }
                else{
                    sv=":"+vl;
                }
                hc.addChild(UI.label(sv, UI.Icon.NONE, UI.TextClasses.WARNING).margin(2,0,0,0));
            }
            if (node.lowLevel().unit()!=node.root().lowLevel().unit()){
                highLight=UI.TextClasses.SUBTLE;
                hc.addChild(UI.label("("+node.lowLevel().unit().path()+")",UI.Icon.NONE,highLight).margin(5,0,0,0));
            }
            hc.addClass("outline");
            return hc;
        } catch (e) {
            console.log(e);
            return UI.hc(UI.label("Illegal node", UI.Icon.ARROW_SMALL_LEFT, null, null));
        }
    }
}
