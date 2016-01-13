<<<<<<< HEAD
/// <reference path="../../../typings/main.d.ts" />

import  MetaModel = require("../definition-system/metamodel")
import  Sys = require("./systemTypes")
import  Params=require("./parameters")
import Common=require("./common")

var mediaTypeParser=require("media-typer")
export interface MimeTypeModel{
    type:string
    tree?:string
    subtype:string;
    suffix?:string;
    parameters?:string;
}


export class MimeType extends Sys.StringType{
    isForm(){
        if (this.value()=="application/x-www-form-urlencoded"||this.value()=='multipart/form-data'){
            return true;
        }

        return false;//more smart code here
    }

    isXML(){
        if (this.value()=="application/xml"){
            return true;
        }
        return false;//more smart code here
    }

    isJSON(){
        if (this.value()=="application/json"){
            return true;
        }
        return false;//more smart code here
    }
    $=[MetaModel.description("This sub type of the string represents mime types")]
    parse(){
        /**
         * top-level type name / subtype name [ ; parameters ]
         *
         * top-level type name / [ tree. ] subtype name [ +suffix ] [ ; parameters ]
         */
        var v=this.value();
        if (v=="*/*"){
            return
        }
        var res= mediaTypeParser.parse(v);
        var types={application:1, audio:1, example:1, image:1, message:1, model:1, multipart:1, text:1, video:1}
        if (!types[res.type]){
            throw new Error("Unknown media type 'type' value")
        }
    }
}
/////////////////////////////////////////////////////////
// This section is related to bodies
export class BodyLike extends Common.RAMLLanguageElement{
    name:string
    $name=[MetaModel.key(),MetaModel.description("Mime type of the request or response body"),MetaModel.canInherit("mediaType"),MetaModel.oftenKeys(["application/json","application/xml",
        "application/x-www-form-urlencoded",
        "multipart/formdata"])]
    schema:Sys.SchemaString
    //FIXME forms, references to global schemas should also be represented here
    $schema=[

        MetaModel.requireValue("this.name.isForm()","false"),MetaModel.description(`
    The structure of a request or response body MAY be further specified by the schema property under the appropriate media type.

The schema key CANNOT be specified if a body's media type is application/x-www-form-urlencoded or multipart/form-data.

All parsers of RAML MUST be able to interpret JSON Schema [JSON_SCHEMA] and XML Schema [XML_SCHEMA].

Schema MAY be declared inline or in an external file. However, if the schema is sufficiently large so as to make it difficult for a person to read the API definition, or the schema is reused across multiple APIs or across multiple miles in the same API, the !include user-defined data type SHOULD be used instead of including the content inline.
Alternatively, the value of the schema field MAY be the name of a schema specified in the root-level schemas property (see Named Parameters, or it MAY be declared in an external file and included by using the by using the RAML !include user-defined data type.`)]
    example:Sys.ExampleString
    $example=[
        MetaModel.description(`Documentation generators MUST use body properties' example attributes to generate example invocations.
This example shows example attributes for two body property media types.`)]
    formParameters:Params.Parameter[]
    //this field checks context guard and sets another context guard
    //TODO mime types are open actually open enums are not handled context values are not looked in normal ast not
    //
    $formParameters=[MetaModel.setsContextValue("location",Params.ParameterLocation.FORM),MetaModel.description(`Web forms REQUIRE special encoding and custom declaration.
If the API's media type is either application/x-www-form-urlencoded or multipart/form-data, the formParameters property MUST specify the name-value pairs that the API is expecting.
The formParameters property is a map in which the key is the name of the web form parameter, and the value is itself a map the specifies the web form parameter's attributes`)]

    $=[MetaModel.canInherit("mediaType")]
}

//Later we will attach functionality which is specific for XMLBody and JSONBody at this moment they are the same
export class XMLBody extends BodyLike{
    //mime="application/xml"
    schema:Sys.XMLSchemaString

    $schema=[MetaModel.description("XSD Schema")]

    $=[MetaModel.functionalDescriminator("this.mime.isXML()"),MetaModel.description("Needed to set connection between xml related mime types and xsd schema")]
}

export class JSONBody extends BodyLike{

   schema:Sys.JSonSchemaString
   $schema=[MetaModel.description("JSON Schema")]

    $=[MetaModel.functionalDescriminator("this.mime.isJSON()"),MetaModel.description("Needed to set connection between json related mime types and json schema")
    ]
    //mime="application/json"
}

//TODO CHECK if it all actually extends RAML Language element
export class Response extends Common.RAMLLanguageElement{
    code:Sys.StatusCodeString
    $code=[MetaModel.key(),MetaModel.extraMetaKey("statusCodes"),MetaModel.description("Responses MUST be a map of one or more HTTP status codes, where each status code itself is a map that describes that status code.")]

    headers:Params.Parameter[];
    $headers=[MetaModel.setsContextValue("location",Params.ParameterLocation.HEADERS),MetaModel.newInstanceName("New Header"),
        MetaModel.description(`An API's methods may support custom header values in responses. The custom, non-standard HTTP headers MUST be specified by the headers property.
        API's may include the the placeholder token {?} in a header name to indicate that any number of headers that conform to the specified format can be sent in responses. This is particularly useful for APIs that allow HTTP headers that conform to some naming convention to send arbitrary, custom data.

In the following example, the header x-metadata-{?} is used to send metadata that has been saved with the media.`)]



    body:BodyLike[]
    $body=[MetaModel.newInstanceName("New Body"),MetaModel.description(`Each response MAY contain a body property, which conforms to the same structure as request body properties (see Body). Responses that can return more than one response code MAY therefore have multiple bodies defined.
For APIs without a priori knowledge of the response types for their responses, "*/*" MAY be used to indicate that responses that do not matching other defined data types MUST be accepted. Processing applications MUST match the most descriptive media type first if "*/*" is used.`)]


}
||||||| merged common ancestors
=======
/// <reference path="../../../typings/main.d.ts" />

import  MetaModel = require("../definition-system/metamodel")
import  Sys = require("./systemTypes")
import  Params=require("./parameters")
import Common=require("./common")

var mediaTypeParser=require("media-typer")
export interface MimeTypeModel{
    type:string
    tree?:string
    subtype:string;
    suffix?:string;
    parameters?:string;
}


export class MimeType extends Sys.StringType{
    isForm(){
        if (this.value()=="application/x-www-form-urlencoded"||this.value()=='multipart/form-data'){
            return true;
        }

        return false;//more smart code here
    }

    isXML(){
        if (this.value()=="application/xml"){
            return true;
        }
        return false;//more smart code here
    }

    isJSON(){
        if (this.value()=="application/json"){
            return true;
        }
        return false;//more smart code here
    }
    $=[MetaModel.description("This sub type of the string represents mime types")]
    parse(){
        /**
         * top-level type name / subtype name [ ; parameters ]
         *
         * top-level type name / [ tree. ] subtype name [ +suffix ] [ ; parameters ]
         */
        var v=this.value();
        if (v=="*/*"){
            return
        }
        var res= mediaTypeParser.parse(v);
        var types={application:1, audio:1, example:1, image:1, message:1, model:1, multipart:1, text:1, video:1}
        if (!types[res.type]){
            throw new Error("Unknown media type 'type' value")
        }
    }
}
/////////////////////////////////////////////////////////
// This section is related to bodies
export class BodyLike extends Common.RAMLLanguageElement{
    name:string
    $name=[MetaModel.key(),MetaModel.description("Mime type of the request or response body"),MetaModel.canInherit("mediaType"),MetaModel.oftenKeys(["application/json","application/xml",
        "application/x-www-form-urlencoded",
        "multipart/form-data"])]
    schema:Sys.SchemaString
    //FIXME forms, references to global schemas should also be represented here
    $schema=[

        MetaModel.requireValue("this.name.isForm()","false"),MetaModel.description(`
    The structure of a request or response body MAY be further specified by the schema property under the appropriate media type.

The schema key CANNOT be specified if a body's media type is application/x-www-form-urlencoded or multipart/form-data.

All parsers of RAML MUST be able to interpret JSON Schema [JSON_SCHEMA] and XML Schema [XML_SCHEMA].

Schema MAY be declared inline or in an external file. However, if the schema is sufficiently large so as to make it difficult for a person to read the API definition, or the schema is reused across multiple APIs or across multiple miles in the same API, the !include user-defined data type SHOULD be used instead of including the content inline.
Alternatively, the value of the schema field MAY be the name of a schema specified in the root-level schemas property (see Named Parameters, or it MAY be declared in an external file and included by using the by using the RAML !include user-defined data type.`)]
    example:Sys.ExampleString
    $example=[
        MetaModel.description(`Documentation generators MUST use body properties' example attributes to generate example invocations.
This example shows example attributes for two body property media types.`)]
    formParameters:Params.Parameter[]
    //this field checks context guard and sets another context guard
    //TODO mime types are open actually open enums are not handled context values are not looked in normal ast not
    //
    $formParameters=[MetaModel.setsContextValue("location",Params.ParameterLocation.FORM),MetaModel.description(`Web forms REQUIRE special encoding and custom declaration.
If the API's media type is either application/x-www-form-urlencoded or multipart/form-data, the formParameters property MUST specify the name-value pairs that the API is expecting.
The formParameters property is a map in which the key is the name of the web form parameter, and the value is itself a map the specifies the web form parameter's attributes`)]

    $=[MetaModel.canInherit("mediaType")]
}

//Later we will attach functionality which is specific for XMLBody and JSONBody at this moment they are the same
export class XMLBody extends BodyLike{
    //mime="application/xml"
    schema:Sys.XMLSchemaString

    $schema=[MetaModel.description("XSD Schema")]

    $=[MetaModel.functionalDescriminator("this.mime.isXML()"),MetaModel.description("Needed to set connection between xml related mime types and xsd schema")]
}

export class JSONBody extends BodyLike{

   schema:Sys.JSonSchemaString
   $schema=[MetaModel.description("JSON Schema")]

    $=[MetaModel.functionalDescriminator("this.mime.isJSON()"),MetaModel.description("Needed to set connection between json related mime types and json schema")
    ]
    //mime="application/json"
}

//TODO CHECK if it all actually extends RAML Language element
export class Response extends Common.RAMLLanguageElement{
    code:Sys.StatusCodeString
    $code=[MetaModel.key(),MetaModel.extraMetaKey("statusCodes"),MetaModel.description("Responses MUST be a map of one or more HTTP status codes, where each status code itself is a map that describes that status code.")]

    headers:Params.Parameter[];
    $headers=[MetaModel.setsContextValue("location",Params.ParameterLocation.HEADERS),MetaModel.newInstanceName("New Header"),
        MetaModel.description(`An API's methods may support custom header values in responses. The custom, non-standard HTTP headers MUST be specified by the headers property.
        API's may include the the placeholder token {?} in a header name to indicate that any number of headers that conform to the specified format can be sent in responses. This is particularly useful for APIs that allow HTTP headers that conform to some naming convention to send arbitrary, custom data.

In the following example, the header x-metadata-{?} is used to send metadata that has been saved with the media.`)]



    body:BodyLike[]
    $body=[MetaModel.newInstanceName("New Body"),MetaModel.description(`Each response MAY contain a body property, which conforms to the same structure as request body properties (see Body). Responses that can return more than one response code MAY therefore have multiple bodies defined.
For APIs without a priori knowledge of the response types for their responses, "*/*" MAY be used to indicate that responses that do not matching other defined data types MUST be accepted. Processing applications MUST match the most descriptive media type first if "*/*" is used.`)]


}
>>>>>>> refs/remotes/mulesoft/master
