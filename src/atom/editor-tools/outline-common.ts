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