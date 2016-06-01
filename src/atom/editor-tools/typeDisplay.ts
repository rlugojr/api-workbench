/// <reference path="../../../typings/main.d.ts" />

import fs = require ('fs')
import path = require ('path')
import _=require("underscore")
import UI=require("atom-ui-lib")
import hl=require("raml-1-parser")
import def=hl.ds;

function getValueTypeDisplayName(type: def.IType) : string {
    if (type.nameId() == "StringType") {
        return "string";
    } else if (type.nameId() == "AnyType") {
        return "any";
    } else if (type.nameId() == "NumberType") {
        return "number";
    } else if (type.nameId() == "IntegerType") {
        return "integer";
    } else if (type.nameId() == "NullType") {
        return "null";
    } else if (type.nameId() == "TimeOnlyType") {
        return "time-only";
    } else if (type.nameId() == "DateOnlyType") {
        return "date-only";
    } else if (type.nameId() == "DateTimeOnlyType") {
        return "datetime-only";
    } else if (type.nameId() == "DateTimeType") {
        return "datetime";
    } else if (type.nameId() == "FileType") {
        return "file";
    } else if (type.nameId() == "BooleanType") {
        return "boolean";
    } else if (type.nameId() == "AnnotationTarget") {
        return "annotation target";
    }

    return type.nameId()?type.nameId() : "";
}

export function getTypeDisplayName(type: def.IType) : string {
    if (type == null) return "";

    if (type.isValueType()) {

        return getValueTypeDisplayName(type);
    } else if (type.hasArrayInHierarchy()) {

        var componentType = type.arrayInHierarchy().componentType();
        if (componentType && componentType.nameId()) {
            return getTypeDisplayName(componentType) + "[]";
        } else {
            return "array";
        }
    } else if (type.hasUnionInHierarchy()) {

        var asUnion = type.unionInHierarchy();

        return getTypeDisplayName(asUnion.leftType()) +
            " | " + getTypeDisplayName(asUnion.rightType());
    }

    return type.nameId()?type.nameId() : "";
}

var renderType = function (definition:def.IType):UI.UIComponent {
    var result = UI.vc();
    result.addChild(UI.label("definition:" + getTypeDisplayName(definition)))
    var elements = definition.properties();
    var superTypes = definition.superTypes();
    if (superTypes) {
        result.addChild(UI.h3("Super types:"));
        definition.allSuperTypes().forEach(x=> {
            result.addChild(UI.hc(UI.label(getTypeDisplayName(x), UI.Icon.TAG)));
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
        elements.forEach(property=> {

            var propertyName = property.nameId();
            if (!property.isRequired()) {
                propertyName += "?"
            }

            result.addChild(
                UI.hc(UI.label(propertyName, UI.Icon.LINK),
                UI.label(": " + getTypeDisplayName(property.range()),
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
