import ramlOutline = require("raml-outline")
import sharedAstInitializerInterfaces = require("../shared-ast-initializer-interfaces")
import rp=require("raml-1-parser")
import lowLevel=rp.ll;
import hl=rp.hl;
var universes=rp.universes
import outlineCommon = require("./outline-common")
import UI=require("atom-ui-lib")


export function initialize(
    editorProvider : sharedAstInitializerInterfaces.IEditorProvider,
    astProvider : sharedAstInitializerInterfaces.IASTProvider) {
    
    ramlOutline.setASTProvider(astProvider);
    ramlOutline.initialize();
    ramlOutline.setKeyProvider();

    createCategories();

    createDecorations();
}

function createCategories() : void {
    ramlOutline.addCategoryFilter(outlineCommon.ResourcesCategory, isResource);
    ramlOutline.addCategoryFilter(outlineCommon.SchemasAndTypesCategory, isSchemaOrType);
    ramlOutline.addCategoryFilter(outlineCommon.ResourceTypesAndTraitsCategory, isResourceTypeOrTrait);
    ramlOutline.addCategoryFilter(outlineCommon.OtherCategory, isOther);
}

function createDecorations() : void {
    ramlOutline.addDecoration(ramlOutline.NodeType.ATTRIBUTE, {
        icon: UI.Icon[UI.Icon.ARROW_SMALL_LEFT],
        textStyle: UI.TextClasses[UI.TextClasses.NORMAL]
    });

    ramlOutline.addDecoration(ramlOutline.NodeType.RESOURCE, {
        icon: UI.Icon[UI.Icon.PRIMITIVE_SQUARE],
        textStyle: UI.TextClasses[UI.TextClasses.HIGHLIGHT]
    });

    ramlOutline.addDecoration(ramlOutline.NodeType.METHOD, {
        icon: UI.Icon[UI.Icon.PRIMITIVE_DOT],
        textStyle: UI.TextClasses[UI.TextClasses.WARNING]
    });

    ramlOutline.addDecoration(ramlOutline.NodeType.SECURITY_SCHEME, {
        icon: UI.Icon[UI.Icon.FILE_SUBMODULE],
        textStyle: UI.TextClasses[UI.TextClasses.NORMAL]
    });

    ramlOutline.addDecoration(ramlOutline.NodeType.ANNOTATION_DECLARATION, {
        icon: UI.Icon[UI.Icon.TAG],
        textStyle: UI.TextClasses[UI.TextClasses.HIGHLIGHT]
    });

    ramlOutline.addDecoration(ramlOutline.NodeType.TYPE_DECLARATION, {
        icon: UI.Icon[UI.Icon.FILE_BINARY],
        textStyle: UI.TextClasses[UI.TextClasses.SUCCESS]
    });

    ramlOutline.addDecoration(ramlOutline.NodeType.DOCUMENTATION_ITEM, {
        icon: UI.Icon[UI.Icon.BOOK],
        textStyle: UI.TextClasses[UI.TextClasses.NORMAL]
    });
}

var prohibit={
    resources:true,
    schemas:true,
    types:true,
    resourceTypes:true,
    traits:true
}

function isResource(p: hl.IHighLevelNode) {
    return (p.definition().key()===universes.Universe08.Resource||p.definition().key()===universes.Universe10.Resource);
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

function isSchemaOrType(p: hl.IHighLevelNode) {
    var pc=p.definition().key();
    return (pc===universes.Universe08.GlobalSchema)|| (p.property() && p.property().nameId()
        == universes.Universe10.LibraryBase.properties.types.name);
}