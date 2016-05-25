/// <reference path="../../../typings/main.d.ts" />

import fs = require ('fs')
import path = require ('path')
import rp = require("raml-1-parser")
import lowLevel=rp.ll;
import hl=rp.hl;
import search=rp.search;
import stubs=rp.stubs;
import universeHelpers = rp.universeHelpers;
import su=rp.schema;
import wrapper = rp.api10;
import apiModifier = rp.parser.modify;
import _=require("underscore")
import provider=require("./provider")
import UI=require("atom-ui-lib")
import xmlutil=require("../../util/xmlutil")
import extract=require("./extractElementsDialog")
import shemagen=require("../../util/schemaGenerator")
import SpacePenViews = require('atom-space-pen-views')
import def=rp.ds
import move=require("./moveElementsDialog")
import tooltip=require("./tooltipManager")
import contextActions = require("./contextActions")
import commonContextActions = require("./commonContextActions")
import assistUtils = require("./assistUtils")
import textutil = require("../../util/textutil")
import editorTools=require("./editorTools")


export class AbstractDialogWithValidation {

    constructor(private parentNode:hl.IParseResult, private name:string) {
    }

    rootAtomPanel:any

    okButton:UI.Button

    errorLabel:UI.TextElement<any>

    /**
     * Intended for overriding in subclass.
     * Checks if everything is valid.
     * @returns {null} if validation passed ok, error message otherwise
     */
    validate():string {
        return null;
    }

    /**
     * Is called when "Ok" is pressed.
     */
    performOk() {

    }

    /**
     * Indended for subclassing
     * @param vc - parent section
     */
    createBody(section:UI.Section) {

    }

    /**
     * Call this to display the dialog.
     */
    show() {
        console.log("Original node tree:")
        if (this.getParentNode()) console.log(this.getParentNode().printDetails())

        if (!this.getParentNode()) {
            return
        }

        var mainSection = UI.section(this.name + ":", UI.Icon.GIST_NEW, false, false);

        this.createValidationIndicator(mainSection)

        this.createBody(mainSection)

        this.createButtonBar(mainSection)

        mainSection.setPercentWidth(100);

        var html = mainSection.renderUI();
        this.rootAtomPanel = (<any>atom).workspace.addModalPanel({item: html});
        html.focus();

        this.performValidation()
    }

    performValidation() {
        var validationMessage = this.validate()


        if (this.okButton) {
            if (validationMessage)
                this.okButton.setDisabled(true)
            else
                this.okButton.setDisabled(false)
        }

        if (this.errorLabel) {
            if (validationMessage) {
                this.errorLabel.setDisplay(true)
                this.errorLabel.setText(validationMessage)
            } else {
                this.errorLabel.setDisplay(false)
                this.errorLabel.setText("")
            }
        }
    }

    createValidationIndicator(vc:UI.Section) {
        this.errorLabel = UI.label("", UI.Icon.BUG, UI.TextClasses.ERROR, UI.HighLightClasses.NONE);
        vc.addChild(UI.vc(this.errorLabel));
    }

    saveUnit(unit:lowLevel.ICompilationUnit):void {
        var unitPath = unit.absolutePath()
        var unitText = unit.contents()

        //first trying to find an opened text editor
        var openedEditor = _.find(atom.workspace.getTextEditors(), editor => {
            var editorPath = editor.getPath()
            return editorPath == unitPath
        })

        if (openedEditor) {
            openedEditor.setText(unitText)
        } else {
            fs.writeFileSync(unitPath, unitText)
        }
    }

    createButtonBar(parentPanel:UI.Section) {
        var buttonBar = UI.hc().setPercentWidth(100).setStyle("display", "flex")

        buttonBar.addChild(UI.label("", null, null, null).setStyle("flex", "1"))

        buttonBar.addChild(UI.button("Cancel", UI.ButtonSizes.NORMAL,
            UI.ButtonHighlights.NO_HIGHLIGHT, UI.Icon.NONE,
            x=> {
                this.rootAtomPanel.destroy()
            }).margin(10, 10))

        this.okButton = UI.button("Extract", UI.ButtonSizes.NORMAL, UI.ButtonHighlights.SUCCESS, UI.Icon.NONE, x=> {
            this.performOk();
            this.rootAtomPanel.destroy();
        })

        this.okButton.setDisabled(true)
        buttonBar.addChild(this.okButton);

        parentPanel.addChild(buttonBar)
    }

    getParentNode():hl.IParseResult {
        return this.parentNode
    }

    getActiveEditor() {
        return assistUtils.getActiveEditor()
    }

    getNodeId(node:hl.IParseResult):string {

        if (node.parent()) {
            var parentId = this.getNodeId(node.parent());
            parentId += "." + node.name();
            var sameName = (<hl.IParseResult><any>node.parent()).directChildren().filter(x=>x.name() == node.name());
            if (sameName.length > 1) {
                var ind = sameName.indexOf(node);
                parentId += "[" + ind + "]"
            }
            return parentId;
        } else if (node.name()) {
            if ((<any>node).definition && (<any>node).definition() && (<any>node).definition().name() == "Api") {
                //no other way to get rid of a fake Api "key"
                return ""
            }
            return "." + node.name()
        }
        return "";
    }

    nodesEqualById(node1:hl.IParseResult, node2:hl.IParseResult) {
        return this.getNodeId(node1) == this.getNodeId(node2)
    }

    isParentOf(potentialParent:hl.IParseResult, potentialChild:hl.IParseResult):boolean {
        var current = potentialChild.parent()
        while (current != null) {

            if (current == potentialParent || this.nodesEqualById(current, potentialParent)) {
                return true
            }

            current = current.parent()
        }

        return false
    }
}


class MoveResourceStateCalculator extends commonContextActions.CommonASTStateCalculator {

    calculate():any {

        var generalState = this.getGeneralState()
        if (!generalState) return null

        if (generalState.completionKind != search.LocationKind.KEY_COMPLETION)
            return null;


        var highLevelNode = <hl.IHighLevelNode>generalState.node;

        if (!universeHelpers.isResourceType(highLevelNode.definition()))
            return null

        return highLevelNode
    }
}

class CreateGlobalSchemaStateCalculator extends commonContextActions.CommonASTStateCalculator {

    calculate():any {

        var generalState = this.getGeneralState()
        if (!generalState) return null

        if (generalState.completionKind != search.LocationKind.VALUE_COMPLETION
            && generalState.completionKind != search.LocationKind.KEY_COMPLETION)
            return null;


        var highLevelNode = <hl.IHighLevelNode>generalState.node;

        var attr = _.find(highLevelNode.attrs(),
            x=>x.lowLevel().start() < generalState.offset && x.lowLevel().end() >= generalState.offset && !x.property().getAdapter(def.RAMLPropertyService).isKey());

        if (!attr) return null

        if (!attr.value()) return null

        var p:hl.IProperty = attr.property();

        //FIXME INFRASTRUCTURE NEEDED
        if (!universeHelpers.isSchemaProperty(p)) return null

        var v = attr.value();
        var targets = search.referenceTargets(p,highLevelNode);
        var t:hl.IHighLevelNode = _.find(targets, x=>x.name() == attr.value())

        if (t) return null

        return attr
    }
}


export class ExtractJSONSchemaToTypeDialog extends AbstractDialogWithValidation {

    typeNameTextField:UI.TextField

    /**
     * Indended for subclassing
     * @param vc - parent section
     */
    createBody(section:UI.Section) {
        section.addChild(UI.label("Type name:").pad(5, 0))

        this.typeNameTextField = UI.texfField("", "NewType", x=> {
            this.performValidation()
        });

        section.addChild(this.typeNameTextField)
    }

    /**
     * Intended for overriding in subclass.
     * Checks if everything is valid.
     * @returns {null} if validation passed ok, error message otherwise
     */
    validate():string {
        if (!this.typeNameTextField || !this.typeNameTextField.getBinding()) {
            return null
        }

        var schemaName = this.typeNameTextField.getBinding().get()
        if (schemaName.trim().length == 0) {
            return "Enter type name"
        }

        return null;
    }

    /**
     * Is called when "Ok" is pressed.
     */
    performOk() {
        var node = <hl.IHighLevelNode>this.getParentNode();
        var api = node.root();
        var schema = node.attrValue('schema');
        node.attr('schema').setValue('');

        var schemaName = this.typeNameTextField.getBinding().get()

        var types = su.createSchemaModelGenerator().generateTo(api, schema, schemaName);
        if (types.length > 0) {
            node.attrOrCreate('type').setValue(types[0]);
        }

        this.saveUnit(api.lowLevel().unit())
    }
}

export class CreateGlobalSchemaDialog extends AbstractDialogWithValidation {

    schemaNameTextField:UI.TextField

    /**
     * Indended for subclassing
     * @param vc - parent section
     */
    createBody(section:UI.Section) {
        section.addChild(UI.label("Schema name:").pad(5, 0))

        this.schemaNameTextField = UI.texfField("", this.getDefaultSchemaName(), x=> {
            this.performValidation()
        });

        section.addChild(this.schemaNameTextField)
    }

    /**
     * Intended for overriding in subclass.
     * Checks if everything is valid.
     * @returns {null} if validation passed ok, error message otherwise
     */
    validate():string {
        if (!this.schemaNameTextField || !this.schemaNameTextField.getBinding()) {
            return null
        }

        var schemaName = this.schemaNameTextField.getBinding().get()
        if (schemaName.trim().length == 0) {
            return "Enter schema name"
        }

        var attr = <hl.IAttribute>this.getParentNode()

        var schemaContent = attr.value()

        var schemaFilePath = this.getSchemaFilePath(schemaName, schemaContent)
        if (fs.existsSync(schemaFilePath)) {
            return "Schema file " + schemaFilePath + " already exists"
        }

        return null;
    }

    /**
     * Is called when "Ok" is pressed.
     */
    performOk() {
        var schemaName = this.schemaNameTextField.getBinding().get()

        var attr = <hl.IAttribute>this.getParentNode()

        var schemaContent = attr.value()

        var schemaFilePath = this.getSchemaFilePath(schemaName, schemaContent)

        var root = attr.parent().root();

        var globalSchemaType:def.NodeClass = <def.NodeClass>attr.property().range().universe().type("GlobalSchema");
        var schemaNode:hl.IHighLevelNode =<hl.IHighLevelNode> stubs.createStubNode(globalSchemaType,(<any>globalSchemaType.universe().type("Api")).property("schemas"), schemaName);

        schemaNode.attrOrCreate("value").setValue("!include " + this.getSchemaRelativePath(schemaName, schemaContent));

        root.add(schemaNode);

        attr.setValue(schemaName);

        this.saveUnit(attr.lowLevel().unit())


        var schemaDir = path.dirname(schemaFilePath)
        if (!fs.existsSync(schemaDir)) {
            fs.mkdirSync(schemaDir);
        }

        fs.writeFileSync(schemaFilePath, schemaContent)
    }

    getSchemaFilePath(schemaName:string, schemaContent:string):string {
        var parentDirectory = path.resolve(path.dirname(this.getActiveEditor().getPath()), "schemas");

        var schemaExtension = this.determineSchemaExtension(schemaContent)

        var fileName = schemaName + "." + schemaExtension

        return path.resolve(parentDirectory, fileName)
    }

    getSchemaRelativePath(schemaName:string, schemaContent:string):string {
        var schemaExtension = this.determineSchemaExtension(schemaContent)

        var fileName = schemaName + "." + schemaExtension

        return "schemas/" + fileName
    }

    determineSchemaExtension(schemaContent:string):string {
        var trim = schemaContent.trim();
        if (trim.indexOf("{") == 0 || trim.indexOf("[") == 0) {
            return "json"
        }

        return "xsd"
    }

    getDefaultSchemaName():string {
        return "NewSchema"
    }
}

export function createGlobalSchema(attr:hl.IAttribute) {
    new CreateGlobalSchemaDialog(attr, "Create Global Schema").show()
}

class ExpandSignatureStateCalculator extends commonContextActions.CommonASTStateCalculator {

    calculate():any {

        var generalState = this.getGeneralState()
        if (!generalState) return null

        if (generalState.completionKind != search.LocationKind.VALUE_COMPLETION)
            return null;


        var highLevelNode = <hl.IHighLevelNode>generalState.node;

        var attr = _.find(highLevelNode.attrs(),
            x=>x.lowLevel().start() < generalState.offset && x.lowLevel().end() >= generalState.offset && !x.property().getAdapter(def.RAMLPropertyService).isKey());

        if (!attr) return null

        if (!attr.value()) return null

        var p:hl.IProperty = attr.property();


        return attr
    }
}



function updateEditor(node) {
    var ed = assistUtils.getActiveEditor();
    ed.setText(assistUtils.cleanEmptyLines(node.root().lowLevel().unit().contents()));
}

var getKeyValue = function (offset, txt) {
    var m = offset;

    for (var i = offset; i >= 0; i--) {
        var c = txt.charAt(i);
        if (c == ' ' || c == '\r' || c == '\n' || c == '\t') {
            m = i + 1;
            break;
        }
    }
    var res = "";
    for (var i = m; i < txt.length; i++) {
        var c = txt.charAt(i);
        if (c == ' ' || c == '\r' || c == '\n' || c == '\t' || c == ':') {
            break;
        }
        res += c;
    }
    return res;
};

class CompleteBodyStateCalculator extends commonContextActions.CommonASTStateCalculator {

    calculate():any {

        var generalState = this.getGeneralState()
        if (!generalState) return null

        if (generalState.completionKind != search.LocationKind.KEY_COMPLETION)
            return null;

        var highLevelNode = <hl.IHighLevelNode>generalState.node;

        if (universeHelpers.isResponseType(highLevelNode.definition()) ||
            universeHelpers.isMethodType(highLevelNode.definition())) {
            var txt = generalState.editor.getText();
            var res = getKeyValue(generalState.offset, txt);
            if (res == "body") {
                return highLevelNode
            }
        }
        if (universeHelpers.isBodyLikeType(highLevelNode.definition())) {
            if (highLevelNode.elements().length == 0) {
                return highLevelNode
            }
        }

        return null
    }
}

export function saveExample(r:hl.IHighLevelNode, schp:string, content:string) {
    var ed = assistUtils.getActiveEditor();
    var sdir = path.resolve(path.dirname(ed.getPath()), path.dirname(schp));
    if (!fs.existsSync(sdir)) {
        fs.mkdirSync(sdir);
    }
    var shFile = path.resolve(path.dirname(ed.getPath()), schp);
    fs.writeFileSync(shFile, content)
}

class FillBodyDialog {

    protected name:string = ""

    constructor(private h:hl.IHighLevelNode, private body:hl.IHighLevelNode, protected title:string = "Fill body") {

    }

    extraContent(s:UI.Section) {

    }

    needXML:boolean = true;
    needJSON:boolean = true;
    createButton:UI.Button;

    updateButtons() {
        if (!this.createButton) {
            return;
        }
        if (this.name.length == 0) {
            this.createButton.setDisabled(true);
            this.em.setDisplay(true)
            this.em.setText("Please type name of your payload");
            return;
        }
        if (this.needJSON) {
            try {
                JSON.parse(this.jsexample);
            } catch (e) {
                this.createButton.setDisabled(true);
                this.em.setDisplay(true)
                this.em.setText("JSON example is not correct");
                return;
            }
            try {
                var so = su.getJSONSchema(this.jsschema, null);

            } catch (e) {
                this.createButton.setDisabled(true);
                this.em.setDisplay(true)
                this.em.setText("JSON schema is not correct");
                return;
            }
        }
        if (this.needXML) {
            try {
                xmlutil(this.xmlexample);
            } catch (e) {
                this.createButton.setDisabled(true);
                this.em.setDisplay(true)
                this.em.setText("XML example is not correct");
                return;
            }
            try {
                var so = su.getXMLSchema(this.xmlschema);

            } catch (e) {
                this.createButton.setDisabled(true);
                this.em.setDisplay(true)
                this.em.setText("XML schema is not correct");
                return;
            }
        }
        this.em.setDisplay(false);
        this.createButton.setDisabled(false);
    }

    em:UI.Label;

    show() {
        var zz = null;
        this.em = UI.label("Please type name of your payload", UI.Icon.BUG, UI.TextClasses.ERROR, UI.HighLightClasses.NONE);
        var section = UI.section(this.title, UI.Icon.BOOK, false, false, this.em, UI.h3("Please type name for your payload")).pad(10, 10)
        section.addChild(UI.texfField("", this.name, x=> {
            this.name = x.getBinding().get();
            this.updateButtons();
        }))
        var r1 = UI.checkBox("Create XML body");
        r1.setValue(this.needXML);
        r1.getBinding().addListener(x=> {
            this.needXML = r1.getValue();
            this.updateButtons();
        });
        section.addChild(r1);
        var r2 = UI.checkBox("Create JSON body");
        r2.setValue(this.needJSON);
        r2.getBinding().addListener(x=> {
            this.needJSON = r2.getValue();
            this.updateButtons();
        });
        section.addChild(r2);

        var buttonBar = UI.hc().setPercentWidth(100).setStyle("display", "flex");
        buttonBar.addChild(UI.label("", null, null, null).setStyle("flex", "1"))
        buttonBar.addChild(UI.button("Cancel", UI.ButtonSizes.NORMAL, UI.ButtonHighlights.NO_HIGHLIGHT, UI.Icon.NONE, x=> {
            zz.destroy()
        }).margin(10, 10))

        this.createButton = UI.button("Create", UI.ButtonSizes.NORMAL, UI.ButtonHighlights.SUCCESS, UI.Icon.NONE, x=> {
            this.onOk(zz);
            zz.destroy();
        });
        buttonBar.addChild(this.createButton)
        var tf = new UI.TabFolder();
        this.createButton.setDisabled(true)
        this.createTextSection(tf, "JSON Example", "source.json", "jsexample");
        this.createTextSection(tf, "JSON Schema", "source.json", "jsschema");
        this.createTextSection(tf, "XML Example", "text.xml", "xmlexample");
        this.createTextSection(tf, "XML Schema", "text.xml", "xmlschema");
        tf.setOnSelected(()=> {
            var c = tf.selectedComponent();
            var te = (<UI.AtomEditorElement><any>c.children()[1]);
            te.setText((<any>this)[(<UI.BasicComponent<any>>c).id()]);

        })
        section.addChild(tf);
        section.addChild(buttonBar);
        zz = (<any>atom).workspace.addModalPanel({item: section.renderUI()});
    }

    jsexample:string = '{\n "message":"Hello world"\n}'
    xmlexample:string = "";
    xmlschema:string = "";
    jsschema:string = "";

    private createTextSection(tf:UI.TabFolder, caption:string, lang:string, code:string) {
        var hs = UI.vc();
        hs.setCaption(caption)
        hs.setId(code)
        var ts = new UI.AtomEditorElement("", x=>x);
        ts.setMini(false);
        ts.getBinding().addListener(x=> {
            this[code] = ts.getValue();
            this.updateButtons()
        })
        //ts.setCaption(code)
        ts.setText("" + (<any>this)[code]);
        ts.setCaption(caption)
        ts.setGrammar(lang)
        ts.setStyle("height", "400px");
        ts.setStyle("border", "solid");
        ts.setStyle("border-width", "1px");
        hs.addChild(UI.h3("Please type your example here:"))

        hs.addChild(ts);
        if (code == 'jsexample') {
            var b = UI.button("Generate JSON schema", UI.ButtonSizes.NORMAL, UI.ButtonHighlights.SUCCESS, UI.Icon.NONE, x=> {
                try {
                    var rs = shemagen.generateSchema(this.jsexample, "application/json")
                    this.jsschema = rs;
                    tf.setSelectedIndex(1)
                }
                catch (e) {
                    this.jsschema = e.message;
                    tf.setSelectedIndex(1)
                }
            });
            hs.addChild(b.margin(5, 5, 5, 5));
        }
        if (code == 'xmlexample') {
            var b = UI.button("Generate JSON example", UI.ButtonSizes.NORMAL, UI.ButtonHighlights.SUCCESS, UI.Icon.NONE, x=> {
                try {
                    var rs = xmlutil(this.xmlexample)
                    this.jsexample = JSON.stringify(rs, null, 2);
                    tf.setSelectedIndex(0)
                }
                catch (e) {
                    this.jsexample = e.message;
                    tf.setSelectedIndex(0)
                }
            });
            hs.addChild(b.margin(5, 5, 5, 5));
        }
        tf.add(caption, null, hs);
    }


    protected onOk(zz) {
        var bodyType = <def.NodeClass>this.body.definition().universe().type("BodyLike");
        if (bodyType) {
            //RAML 0.8 case

            var node = this.body;
            if (universeHelpers.isBodyProperty(node.property())) {
                node = node.parent();
            }
            var type = <def.NodeClass>node.definition();

            if (this.needJSON) {
                var body = <hl.IEditableHighLevelNode>stubs.createStubNode(bodyType,type.property('name'), "application/json");
                body.createAttr("schema", this.name);
                body.createAttr("example", "!include ./examples/" + this.name + ".json");
                node.add(body);
                assistUtils.createGlobalSchemaFromNameAndContent(this.h.root(), this.name, "schemas/" + this.name + ".json", this.jsschema)
                saveExample(this.h, "./examples/" + this.name + ".json", this.jsexample);
            }
            if (this.needXML) {
                var body = <hl.IEditableHighLevelNode>stubs.createStubNode(bodyType,type.property('name'), "application/xml");
                body.createAttr("schema", this.name + "-xml");
                body.createAttr("example", "!include ./examples/" + this.name + ".xml");
                node.add(body);
                var xmlSchemaContents = this.xmlschema;
                assistUtils.createGlobalSchemaFromNameAndContent(this.h.root(), this.name + "-xml", "schemas/" + this.name + ".xml", xmlSchemaContents)
                saveExample(this.h, "./examples/" + this.name + ".xml", this.xmlexample);
            }
        } else {
            //RAML 1.0 case
            var response = this.body;
            if (!universeHelpers.isResponseType(response.property().range())) {
                console.log("Incorrect parent " + response.printDetails() + " , expecting response")
                return;
            }

            var responseWrapper = <wrapper.Response>response.wrapperNode();

            var bodies: wrapper.TypeDeclaration[] = [];

            if (this.needJSON) {
                var typeName = "application/json"

                var bodyWrapper = apiModifier.createTypeDeclaration(typeName)

                apiModifier.setTypeDeclarationSchema(bodyWrapper, this.name)
                apiModifier.setTypeDeclarationExample(bodyWrapper, "!include ./examples/" + this.name + ".json")
                assistUtils.createGlobalSchemaFromNameAndContent(this.h.root(), this.name, "schemas/" + this.name + ".json", this.jsschema)
                saveExample(this.h, "./examples/" + this.name + ".json", this.jsexample);

                bodies.push(bodyWrapper);
            }

            if (this.needXML) {
                var typeName = "application/xml"

                var bodyWrapper = apiModifier.createTypeDeclaration(typeName)

                apiModifier.setTypeDeclarationSchema(bodyWrapper, this.name + "-xml")
                apiModifier.setTypeDeclarationExample(bodyWrapper, "!include ./examples/" + this.name + ".xml")
                var xmlSchemaContents = this.xmlschema;
                assistUtils.createGlobalSchemaFromNameAndContent(this.h.root(), this.name + "-xml", "schemas/" + this.name + ".xsd", xmlSchemaContents)
                saveExample(this.h, "./examples/" + this.name + ".xml", this.xmlexample);

                bodies.push(bodyWrapper);
            }

            bodies.forEach(bodyWrapper => {
                var foundWrapper = _.find(responseWrapper.body() || [], foundWrapper => bodyWrapper.name() === foundWrapper.name());if(foundWrapper) {
                    (<any>responseWrapper).remove(foundWrapper);
                }

                apiModifier.addChild(responseWrapper, bodyWrapper);
            })
        }

        var rs = this.h.lowLevel().unit().contents();
        assistUtils.getActiveEditor().setText(assistUtils.cleanEmptyLines(rs));
    }
}

class ExtractResourceTypeStateCalculator extends commonContextActions.CommonASTStateCalculator {

    calculate():any {

        var generalState = this.getGeneralState()
        if (!generalState) return null

        if (generalState.completionKind != search.LocationKind.KEY_COMPLETION)
            return null;


        var highLevelNode = <hl.IHighLevelNode>generalState.node;

        if (!universeHelpers.isResourceType(highLevelNode.definition()))
            return null

        return highLevelNode
    }
}

class ExtractTraitStateCalculator extends commonContextActions.CommonASTStateCalculator {

    calculate():any {

        var generalState = this.getGeneralState()
        if (!generalState) return null

        if (generalState.completionKind != search.LocationKind.KEY_COMPLETION)
            return null;


        var highLevelNode = <hl.IHighLevelNode>generalState.node;

        if (!universeHelpers.isMethodType(highLevelNode.definition()))
            return null

        return highLevelNode
    }
}

class MoveContentStateCalculator extends commonContextActions.CommonASTStateCalculator {

    calculate():any {

        var generalState = this.getGeneralState()
        if (!generalState) return null

        if (generalState.completionKind != search.LocationKind.KEY_COMPLETION)
            return null;


        var highLevelNode = <hl.IHighLevelNode>generalState.node;

        if (highLevelNode.children().length == 0)
            return null

        return highLevelNode
    }
}

class ConvertJsonSchemaToTypeStateCalculator extends commonContextActions.CommonASTStateCalculator {
    calculate():any {
        var generalState = this.getGeneralState()
        if (!generalState) return null
        var highLevelNode = <hl.IHighLevelNode>generalState.node;
        //console.log('definition: ' + highLevelNode.definition().name() + '; ' + generalState.completionKind);
        if (generalState.completionKind != search.LocationKind.KEY_COMPLETION
            && generalState.completionKind != search.LocationKind.VALUE_COMPLETION)
            return null;

        var attr = _.find(highLevelNode.attrs(),
            x=>x.lowLevel().start() < generalState.offset && x.lowLevel().end() >= generalState.offset && !x.property().getAdapter(def.RAMLPropertyService).isKey());

        if (!attr) return null

        if (!attr.value()) return null

        var p:hl.IProperty = attr.property();

        if (!universeHelpers.isSchemaProperty(p)) return null

        if (typeof attr.value() != 'string' || (<string>attr.value()).indexOf("{") == -1) {
            return null;
        }

        return highLevelNode
        //var txt=generalState.editor.getText();
        //var res = getKeyValue(generalState.offset, txt);
        //if(res != 'schema') return null;
        //var schema = highLevelNode.attrValue('schema');
        //if(!schema) return null;
        //return (schema.length > 0 && schema[0] == '{')? highLevelNode : null;
        //return true; //res == 'schema'? highLevelNode : null;
    }
}


class ConvertTypeToJsonSchemaStateCalculator extends commonContextActions.CommonASTStateCalculator {
    calculate():any {
        var generalState = this.getGeneralState()
        if (!generalState) return null
        var highLevelNode = <hl.IHighLevelNode>generalState.node;
        //console.log('definition: ' + highLevelNode.definition().name() + '; ' + generalState.completionKind);
        if (generalState.completionKind != search.LocationKind.KEY_COMPLETION
            && generalState.completionKind != search.LocationKind.VALUE_COMPLETION)
            return null;
        var txt = generalState.editor.getText();
        //var res = getKeyValue(generalState.offset, txt);
        //return (res == 'type')? highLevelNode: null;

        var attr = _.find(highLevelNode.attrs(),
            x=>x.lowLevel().start() < generalState.offset && x.lowLevel().end() >= generalState.offset && !x.property().getAdapter(def.RAMLPropertyService).isKey());

        if (!attr) return null

        if (!attr.value()) return null

        var p:hl.IProperty = attr.property();

        if (!universeHelpers.isTypeProperty(p)) return null
        return highLevelNode
    }
}

class ConvertTypeToJsonSchemaAtTypeStateCalculator extends commonContextActions.CommonASTStateCalculator {
    calculate():any {
        var generalState = this.getGeneralState()
        if (!generalState) return null
        var node = <hl.IHighLevelNode>generalState.node;
        //highLevelNode.lowLevel().show('HL');
        //console.log('node def: ' + node.property().name() + ': ' + node.definition().name() + '; ' + generalState.completionKind);
        if (generalState.completionKind != search.LocationKind.SEQUENCE_KEY_COPLETION)
            return null;
        return universeHelpers.isTypesProperty(node.property()) ? node : null;
    }
}

function indent(line:string) {
    var rs = "";
    for (var i = 0; i < line.length; i++) {
        var c = line[i];
        if (c == '\r' || c == '\n') {
            continue;
        }
        if (c == ' ' || c == '\t') {
            rs += c;
            continue;
        }
        break;
    }
    return rs;
}

//FIXME remove it from here duplication with jsyaml2lowLevel.ts
function stripIndent(text:string, indent:string) {
    var lines = assistUtils.splitOnLines(text);
    var rs = [];
    for (var i = 0; i < lines.length; i++) {
        if (i == 0) {
            rs.push(lines[0]);
        }
        else {
            rs.push(lines[i].substring(indent.length));
        }
    }
    return rs.join("");
}

export class MoveToNewFileDialog {

    constructor(private node:hl.IHighLevelNode) {

    }

    destination:string;

    show() {
        var zz:any = null;
        var node = this.node;
        var vc = UI.section("Move node content to new file ", UI.Icon.GIST_NEW, false, false);
        var errorLabel = UI.label("Please enter destination file path", UI.Icon.BUG, UI.TextClasses.ERROR, UI.HighLightClasses.NONE);
        vc.addChild(UI.vc(errorLabel));
        vc.addChild(UI.label("Please enter destination path"));
        var txt = UI.texfField("", "", x=> {
            if (!txt) {
                return;
            }

            var errorMessage = null;

            this.destination = txt.getBinding().get();
            if (this.destination.trim().length == 0) {
                errorMessage = "Please enter destination file path";
            }
            else if (!path.extname(this.destination) || path.extname(this.destination).trim().length <= 2) {
                errorMessage = "Please enter destination file extension";
            }
            else {
                var dir = path.resolve(path.dirname(assistUtils.getActiveEditor().getPath()), path.dirname(this.destination));
                if (!fs.existsSync(dir)) {
                    errorMessage = "Parent directory does not exist"
                }
                else {
                    var st = fs.statSync(dir)
                    if (!st.isDirectory()) {
                        errorMessage = "Parent path is not a directory"
                    }

                    if(!errorMessage) {
                        var canWrite = true;

                        try {
                            (<any>fs).accessSync(dir, (<any>fs).W_OK);
                        } catch(exception) {
                            canWrite = false;
                        }

                        if(!canWrite) {
                            errorMessage = "Can't write to specified directory, access denied. Please, check your permissions."
                        }
                    }
                }
            }

            if (errorMessage) {
                errorLabel.setDisplay(true);
                errorLabel.setText(errorMessage);
                okButton.setDisabled(true);
            } else {
                errorLabel.setDisplay(false);
                okButton.setDisabled(false);
            }

        });
        vc.addChild(UI.vc(txt));
        var buttonBar = UI.hc().setPercentWidth(100).setStyle("display", "flex");
        buttonBar.addChild(UI.label("", null, null, null).setStyle("flex", "1"))
        buttonBar.addChild(UI.button("Cancel", UI.ButtonSizes.NORMAL, UI.ButtonHighlights.NO_HIGHLIGHT, UI.Icon.NONE, x=> {
            zz.destroy()
        }).margin(10, 10))
        var okButton = UI.button("Move", UI.ButtonSizes.NORMAL, UI.ButtonHighlights.SUCCESS, UI.Icon.NONE, x=> {
            var d = path.resolve(path.dirname(assistUtils.getActiveEditor().getPath()), this.destination);
            var dump = this.node.lowLevel().dump();
            var ci = assistUtils.splitOnLines(dump);
            var li = ci.length > 1 ? indent(ci[1]) : indent(ci[0]);
            dump = dump.substring(this.node.lowLevel().keyEnd() - this.node.lowLevel().start() + 1).trim();
            dump = stripIndent(dump, li);

            var ramlComment = node.definition().universe().version()==="RAML10" ? "#%RAML 1.0 " : "#%RAML 0.8 "

            dump = ramlComment + this.node.definition().nameId() + "\n" + dump;
            fs.writeFileSync(d, dump);
            //no we need to replace content of the node with text;

            var txt = node.lowLevel().unit().contents();
            var endPart = txt.substring(node.lowLevel().end());
            var startPart = txt.substring(0, node.lowLevel().keyEnd() + 1);
            var vl = startPart + " !include " + this.destination + endPart;
            assistUtils.getActiveEditor().setText(vl);
            zz.destroy();
        });
        okButton.setDisabled(true)
        buttonBar.addChild(okButton);
        vc.addChild(buttonBar)
        var html = vc.renderUI();
        zz = (<any>atom).workspace.addModalPanel({item: html});
        html.focus();
    }
}

class ExtractLibraryStateCalculator extends commonContextActions.CommonASTStateCalculator {

    calculate():any {

        var generalState = this.getGeneralState();
        if (!generalState) return null;

        var current = generalState.node;
        while (current.parent() != null) {
            current = current.parent()
        }
        return current
    }
}

class ExtractOverlayStateCalculator extends commonContextActions.CommonASTStateCalculator {

    calculate():any {

        var generalState = this.getGeneralState()
        if (!generalState) return null

        var current = generalState.node
        while (current.parent() != null) {
            current = current.parent()
        }
        return current
    }
}

class ModifyOverlayStateCalculator extends commonContextActions.CommonASTStateCalculator {

    calculate():any {

        var generalState = this.getGeneralState()
        if (!generalState) return null

        var current = generalState.node
        while (current.parent() != null) {
            current = current.parent()
        }

        if ((<hl.IHighLevelNode>current).definition
            && universeHelpers.isOverlayType((<hl.IHighLevelNode>current).definition())) {
            return current
        }

        return null
    }
}

class AbstractMoveTypePropertiesCalculator extends commonContextActions.CommonASTStateCalculator {
    isTypeNode(node) {
        return (<hl.IHighLevelNode>node).property
            && (<hl.IHighLevelNode>node).property().range
            && universeHelpers.isTypeDeclarationType((<hl.IHighLevelNode>node).property().range())
            && universeHelpers.isTypesProperty((<hl.IHighLevelNode>node).property())
    }
}

class PullUpStateCalculator extends AbstractMoveTypePropertiesCalculator {

    calculate():any {

        var generalState = this.getGeneralState()
        if (!generalState) return null

        var current = generalState.node
        if (!current)
            return null

        while (current.parent() != null) {
            if (this.isTypeNode(current)) {
                //so, we're inside the type

                //but we also want to double check that there are superclasses
                var superTypes = extract.findUserDefinedSupertypes(<hl.IHighLevelNode>current)
                if (superTypes && superTypes.length > 0)
                    return current
                else
                    return null
            }
            current = current.parent()
        }

        return null
    }
}

class ExtractSupertypeCalculator extends AbstractMoveTypePropertiesCalculator {

    calculate():any {
        var generalState = this.getGeneralState()
        if (!generalState) return null

        var current = generalState.node
        if (!current)
            return null

        while (current.parent() != null) {
            if (this.isTypeNode(current)) {
                //so, we're inside the type

                //but we also want to double check that there are no superclasses
                var superTypes = extract.findUserDefinedSupertypes(<hl.IHighLevelNode>current)
                if (!superTypes || superTypes.length == 0)
                    return current
                else
                    return null
            }
            current = current.parent()
        }

        return null
    }
}


class CommentNodeCalculator extends commonContextActions.CommonASTStateCalculator {

    calculate():any {

        var generalState = this.getGeneralState()
        if (!generalState) return null

        return generalState
    }
}


class GenerateExampleCalculator extends commonContextActions.CommonASTStateCalculator {
    calculate():any {
        var generalState = this.getGeneralState()
        if (!generalState) return null
        var highLevelNode = <hl.IHighLevelNode>generalState.node;
        //console.log('definition: ' + highLevelNode.definition().name() + '; ' + generalState.completionKind);
        if (generalState.completionKind != search.LocationKind.KEY_COMPLETION
            && generalState.completionKind != search.LocationKind.VALUE_COMPLETION)
            return null;
        var txt = generalState.editor.getText();
        //var res = getKeyValue(generalState.offset, txt);
        //return (res == 'type')? highLevelNode: null;

        var attr = _.find(highLevelNode.attrs(),
            x=>x.lowLevel().start() < generalState.offset && x.lowLevel().end() >= generalState.offset && !x.property().getAdapter(def.RAMLPropertyService).isKey());

        if (!attr) return null;
        var p:hl.IProperty = attr.property();
        if (!universeHelpers.isExampleProperty(p)) return null;

        var typeAttr = highLevelNode.attr('type');
        if(!typeAttr) return null;
        var type = typeAttr.value();
        if(!type) return null;

        return highLevelNode
    }
}

export function findLowLevelNodeByOffset(root:lowLevel.ILowLevelASTNode, offset:number):lowLevel.ILowLevelASTNode {
    if ((root.keyStart() > offset || root.valueEnd() < offset) && root.parent()) {
        return null;
    }

    if(root.includedFrom()) {
        return findLowLevelNodeByOffset(root.includedFrom(), offset);
    }

    var children = root.children()
    for (var key in children) {
        var child = children[key]
        var result = findLowLevelNodeByOffset(child, offset)
        if (result) return result;
    }

    return root;
}

function lastChild(root:lowLevel.ILowLevelASTNode) {
    if(root.includedFrom()) {
        return root.includedFrom();
    }

    if(!root.children() || root.children().length === 0) {
        return root;
    }

    return lastChild(root.children().filter(child => child ? true : false)[root.children().length - 1]);
}

export function initialize() {

    contextActions.addAction({

        name: "Create global schema",

        target: contextActions.TARGET_RAML_EDITOR_NODE,

        category: ["Code"],

        onClick: state=>createGlobalSchema(<hl.IAttribute> state),

        stateCalculator: new CreateGlobalSchemaStateCalculator(),

        shouldDisplay: state=>state != null
    })

    contextActions.addAction({

        name: "Move resource",

        target: contextActions.TARGET_RAML_EDITOR_NODE,

        category: ["Refactoring"],

        onClick: (state)=> {
            new move.MoveElementsDialog(
                <hl.IHighLevelNode>state,
                "Resource Type", true).show()
        },

        stateCalculator: new MoveResourceStateCalculator(),

        shouldDisplay: state=>state != null
    })

    //contextActions.addAction({
    //
    //    name: "Expand Signature",
    //
    //    target: contextActions.TARGET_RAML_EDITOR_NODE,
    //
    //    category: ["Refactoring"],
    //
    //    onClick: state=>expandSignature(<hl.IAttribute> state),
    //
    //    stateCalculator: new ExpandSignatureStateCalculator(),
    //
    //    shouldDisplay: state=>state != null
    //})

    contextActions.addAction({
        name: "Complete body",
        target: contextActions.TARGET_RAML_EDITOR_NODE,
        category: ["Add new..."],
        onClick: (state)=> {
            var h = <hl.IHighLevelNode>state;
            h.lowLevel().show('BODY');
            new FillBodyDialog(h.parent().parent(), h).show()
        },
        stateCalculator: new CompleteBodyStateCalculator(),
        shouldDisplay: state=>state != null
    })

    contextActions.addAction({

        name: "Extract Resource Type",

        target: contextActions.TARGET_RAML_EDITOR_NODE,

        category: ["Refactoring"],

        onClick: (state)=> {
            new extract.ExtractTypesAndTraitsDialog(<hl.IHighLevelNode>state, "Resource Type", true).show()
        },

        stateCalculator: new ExtractResourceTypeStateCalculator(),

        shouldDisplay: state=>state != null
    })

    contextActions.addAction({

        name: "Extract Trait",

        target: contextActions.TARGET_RAML_EDITOR_NODE,

        category: ["Refactoring"],

        onClick: (state)=> {
            new extract.ExtractTypesAndTraitsDialog(<hl.IHighLevelNode>state, "Trait", false).show()
        },

        stateCalculator: new ExtractTraitStateCalculator(),

        shouldDisplay: state=>state != null
    });

    contextActions.addAction({

        name: "Move content to other file",

        target: contextActions.TARGET_RAML_EDITOR_NODE,

        category: ["Refactoring"],

        onClick: (state)=> {
            new MoveToNewFileDialog(<hl.IHighLevelNode>state).show()
        },

        stateCalculator: new MoveContentStateCalculator(),

        shouldDisplay: state=>state != null
    });

    contextActions.addAction({
        name: "Convert JSON schema to type",
        target: contextActions.TARGET_RAML_EDITOR_NODE,
        category: ["Refactoring"],
        onClick: (state)=> {
            new ExtractJSONSchemaToTypeDialog(<hl.IHighLevelNode>state, "Convert JSON schema to type").show()
        },
        stateCalculator: new ConvertJsonSchemaToTypeStateCalculator(),
        shouldDisplay: state=>state != null
    });

    contextActions.addAction({
        name: "Expand type to JSON schema",
        target: contextActions.TARGET_RAML_EDITOR_NODE,
        category: ["Refactoring"],
        onClick: (state)=> {
            var node = <hl.IHighLevelNode>state;
            var api = node.root();
            var type = node.attrValue('type');
            //console.log('schema: ' + schema);
            var types = <hl.IHighLevelNode[]>api.elementsOfKind('types');
            var typeNode = _.find(types, y=>y.name() == type);
            if (typeNode) {
                node.attr('type').setValue('');
                var obj = su.createModelToSchemaGenerator().generateSchema(typeNode);
                var text = JSON.stringify(obj, null, 2);
                node.attrOrCreate('schema').setValue(text);
                text = api.lowLevel().unit().contents();
                assistUtils.getActiveEditor().setText(text);
            }
        },
        stateCalculator: new ConvertTypeToJsonSchemaStateCalculator(),
        shouldDisplay: state=>state != null
    });
    contextActions.addAction({
        name: "Expand type to JSON schema definition",
        target: contextActions.TARGET_RAML_EDITOR_NODE,
        category: ["Refactoring"],
        onClick: (state)=> {
            var typenode = <hl.IHighLevelNode>state;
            var api = typenode.root();
            //console.log('generate type ' + typenode.name());
            var obj = su.createModelToSchemaGenerator().generateSchema(typenode);
            var schema = JSON.stringify(obj, null, 2);
            console.log('schema: ' + schema);
            //schema = textutil.fromMutiLine(schema);
            var schemaStub = stubs.createStubNoParentPatch(api, 'schemas', typenode.name());
            schemaStub.attrOrCreate('value').setValue(schema);
            api.add(schemaStub);
            var text = api.lowLevel().unit().contents();
            //console.log('text:\n' + text);
            assistUtils.getActiveEditor().setText(text);
        },
        stateCalculator: new ConvertTypeToJsonSchemaAtTypeStateCalculator(),
        shouldDisplay: state=>state != null
    });

    contextActions.addAction({

        name: "Extract Library",

        target: contextActions.TARGET_RAML_EDITOR_NODE,

        category: ["Refactoring"],

        onClick: (state)=> {
            new extract.ExtractLibraryDialog(<hl.IHighLevelNode>state, "Extract Library").show()
        },

        stateCalculator: new ExtractLibraryStateCalculator(),

        shouldDisplay: state=>state != null
    })

    contextActions.addAction({

        name: "Extract Overlay",

        target: contextActions.TARGET_RAML_EDITOR_NODE,

        category: ["Code"],

        onClick: (state)=> {
            new extract.ExtractOverlayDialog(<hl.IHighLevelNode>state, "Extract Overlay").show()
        },

        stateCalculator: new ExtractOverlayStateCalculator(),

        shouldDisplay: state=>state != null
    })

    contextActions.addAction({

        name: "Modify Overlay",

        target: contextActions.TARGET_RAML_EDITOR_NODE,

        category: ["Code"],

        onClick: (state)=> {
            new extract.ModifyOverlayDialog(<hl.IHighLevelNode>state, "Modify Overlay").show()
        },

        stateCalculator: new ModifyOverlayStateCalculator(),

        shouldDisplay: state=>state != null
    })

    contextActions.addAction({

        name: "Pull Up",

        target: contextActions.TARGET_RAML_EDITOR_NODE,

        category: ["Refactoring"],

        onClick: (state)=> {
            new extract.PullUpDialog(<hl.IHighLevelNode>state, "Pull Up").show()
        },

        stateCalculator: new PullUpStateCalculator(),

        shouldDisplay: state=>state != null
    })

    contextActions.addAction({

        name: "Extract Supertype",

        target: contextActions.TARGET_RAML_EDITOR_NODE,

        category: ["Refactoring"],

        onClick: (state)=> {
            new extract.ExtractSupertypeDialog(<hl.IHighLevelNode>state, "Extract Supertype").show()
        },

        stateCalculator: new ExtractSupertypeCalculator(),

        shouldDisplay: state=>state != null
    })

    contextActions.addAction({

        name: "Comment node",

        target: contextActions.TARGET_RAML_EDITOR_NODE,

        category: ["Code"],

        onClick: (state)=> {
            var highLevelNode:hl.IParseResult = (<commonContextActions.IGeneralASTState>state).node;

            if (!highLevelNode.lowLevel()) return;

            var lowLevelNode = findLowLevelNodeByOffset(highLevelNode.lowLevel(),
                (<commonContextActions.IGeneralASTState>state).offset)

            if (!lowLevelNode) return;

            var startOffset = lowLevelNode.keyStart() > -1 ? lowLevelNode.keyStart() : lowLevelNode.start();

            lowLevelNode = lastChild(lowLevelNode);

            var endOffset = lowLevelNode.valueEnd() > -1 ? lowLevelNode.valueEnd() : lowLevelNode.end();

            var buffer = (<commonContextActions.IGeneralASTState>state)
                .editor.getBuffer();
            var startPosition = buffer.positionForCharacterIndex(startOffset);
            var startLine = startPosition.row;

            var endPosition = buffer.positionForCharacterIndex(endOffset);
            var endLine = endPosition.row;

            for (var lineNumber:number = startLine; lineNumber <= endLine; lineNumber++) {

                var oldRange = buffer.rangeForRow(lineNumber, true);
                var oldText = buffer.getTextInRange(oldRange);
                var newText = "#" + oldText;

                buffer.setTextInRange(oldRange, newText)
            }
        },

        stateCalculator: new CommentNodeCalculator(),

        shouldDisplay: state=>state != null
    })

    // contextActions.addAction({
    //     name: "Generate example",
    //     target: contextActions.TARGET_RAML_EDITOR_NODE,
    //     category: ["Code"],
    //     onClick: (state)=> {
    //         var node = <hl.IHighLevelNode>state;
    //         var api = node.root();
    //         var typeman = new gu.TypeManager(<wrapper.ApiImpl>api.wrapperNode());
    //         var type = node.attr('type').value();
    //         var egen = new genex.ExampleGenerator(typeman);
    //         var nodetype = node.definition().nameId();
    //         var proptype = node.property().range().nameId();
    //         if(nodetype != 'application/json') {
    //             type = node.name();
    //         }
    //         //console.log('node type: ' + nodetype + '; prop type: ' + proptype + ' ==> ' + type);
    //         var json = egen.generateTypeExpression(type);
    //         var example = JSON.stringify(json, null, 2);
    //         node.attrOrCreate('example').setValue(example);
    //         var text = api.lowLevel().unit().contents();
    //         //console.log('text:\n' + text);
    //         assistUtils.getActiveEditor().setText(text);
    //         //new extract.ExtractSupertypeDialog(<hl.IHighLevelNode>state, "Extract Supertype").show()
    //     },
    //     stateCalculator: new GenerateExampleCalculator(),
    //     shouldDisplay: state=>state != null
    // });


}

