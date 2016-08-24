import rp=require("raml-1-parser")
import lowLevel=rp.ll;
import hl=rp.hl;
var universes=rp.universes;

export var ResourcesCategory = "Resources";
export var SchemasAndTypesCategory = "Schemas & Types";
export var ResourceTypesAndTraitsCategory = "Resource Types & Traits";
export var OtherCategory = "Other";

/**
 * Generates node key
 * @param node
 * @returns {any}
 */
export function keyProvider(node: hl.IParseResult) : string {
    if (!node) return null;
    if (node && !node.parent()) return node.name();
    else return node.name() + " :: " + keyProvider(node.parent());
}

var prohibit={
    resources:true,
    schemas:true,
    types:true,
    resourceTypes:true,
    traits:true
}

export function isResource(p: hl.IHighLevelNode) {
    return (p.definition().key()===universes.Universe08.Resource||p.definition().key()===universes.Universe10.Resource);
}

export function isOther(p: hl.IHighLevelNode) {
    if (p.property()){
        var nm=p.property().nameId();
        if (prohibit[nm]){
            return false;
        }
    }
    return true;
}
export function isResourceTypeOrTrait(p: hl.IHighLevelNode) {
    var pc=p.definition().key();

    return (pc ===universes.Universe08.ResourceType
    ||pc===universes.Universe10.ResourceType||
    pc === universes.Universe08.Trait
    ||
    pc===universes.Universe10.Trait);
}

export function isSchemaOrType(p: hl.IHighLevelNode) {
    var pc=p.definition().key();
    return (pc===universes.Universe08.GlobalSchema)|| (p.property() && p.property().nameId()
        == universes.Universe10.LibraryBase.properties.types.name);
}