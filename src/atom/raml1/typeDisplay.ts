/// <reference path="../../../typings/main.d.ts" />

import fs = require ('fs')
import path = require ('path')
import _=require("underscore")
import UI=require("atom-ui-lib")
import hl=require("raml-1-parser")
import def=hl.ds;
var renderType = function (definition:def.IType):UI.UIComponent {
    var result = UI.vc();
    result.addChild(UI.label("definition:" + definition.nameId()))
    var elements = definition.properties();
    var superTypes = definition.superTypes();
    if (superTypes) {
        result.addChild(UI.h3("Super types:"));
        definition.allSuperTypes().forEach(x=> {
            result.addChild(UI.hc(UI.label(x.nameId(), UI.Icon.TAG)));
        })
    }
    var rf=definition.getAdapter(def.RAMLService).getRepresentationOf();
    if (rf){
        var facets=rf.getFixedFacets();
        if (Object.keys(facets).length>0) {
            result.addChild(UI.h3("All facets"))
            Object.keys(facets).forEach(x=> {
                result.addChild(UI.label(x + ":" + facets[x].value()));
            })
        }
    }
    if (elements && elements.length > 0) {
        result.addChild(UI.h3("All properties"))
        elements.forEach(x=> {
            result.addChild(
                UI.hc(UI.label(x.nameId(), UI.Icon.LINK),
                UI.label(": " + x.range().nameId(),
                UI.Icon.NONE, UI.TextClasses.WARNING)));
        })
    }
    if (definition.hasArrayInHierarchy()) {
        result.addChild(UI.h3("Component type:"))
        result.addChild(renderType(definition.arrayInHierarchy().componentType()))
    }

    if (definition.hasUnionInHierarchy()) {
        result.addChild(UI.h3("Union type:"))

        result.addChild(UI.h3("Left:"))
        result.addChild(renderType(definition.unionInHierarchy().leftType()))
        result.addChild(UI.h3("Right:"))

        result.addChild(renderType(definition.unionInHierarchy().rightType()))
    }
    return result;
};
export function render(node:hl.IHighLevelNode) {
    var wn = node.wrapperNode();
    var definition = wn.highLevel().localType();
    return renderType(definition);
}