<<<<<<< HEAD
import  MetaModel = require("../definition-system/metamodel")
import  Sys = require("./systemTypes")
import  RM=require("./methodsAndResources")
import  Decls=require("./declarations")
import  Params=require("./parameters")
import  Common=require("./common")
import  Bodies=require("./bodies")
import  models=require("./datamodel")


    export class GlobalSchema extends Common.RAMLSimpleElement implements Sys.Referencable<Sys.SchemaString>{
        key:string
        $key=[MetaModel.key(),MetaModel.description("Name of the global schema, used to refer on schema content")]
        value:Sys.SchemaString
        $value=[MetaModel.description("Content of the schema"),MetaModel.canBeValue(),MetaModel.value()]//TODO FIXME
        $=[MetaModel.actuallyExports("value"),MetaModel.description("Content of the schema")]
    }
    //export class GlobalExample extends Common.RAMLSimpleElement implements Sys.Referencable<Sys.SchemaString>{
    //    key:string
    //    $key=[MetaModel.key(),MetaModel.description("Name of the global schema, used to refer on schema content")]
    //    value:Sys.ExampleString
    //    $value=[MetaModel.description("Content of the schema")]//TODO FIXME
    //    $=[MetaModel.actuallyExports("value"),MetaModel.description("Content of the schema")]
    //}
    export class ImportDeclaration extends Common.RAMLSimpleElement{
        key:string
        $key=[MetaModel.key(),MetaModel.description("Name prefix (without dot) used to refer imported declarations")]

        value:Library
        $value=[MetaModel.description("Content of the declared namespace")];
    }

export class Library extends LibraryBase {
    usage: string
    $usage=[MetaModel.description("contains description of why library exist")]
}

    export class LibraryBase extends Common.RAMLLanguageElement{

        $ = [MetaModel.internalClass()]

        name: string;
        $name=[MetaModel.key()]
        schemas:GlobalSchema[]
        $schemas=[
            MetaModel.embeddedInMaps(),
            MetaModel.description("Alias for the equivalent \"types\" property, for compatibility with RAML 0.8. Deprecated - API definitions should use the \"types\" property, as the \"schemas\" alias for that property name may be removed in a future RAML version. The \"types\" property allows for XML and JSON schemas.")
        ]

        types:models.TypeDeclaration[]
        $types=[MetaModel.embeddedInMaps(),
            MetaModel.setsContextValue("locationKind",models.LocationKind.MODELS),
            MetaModel.description("Declarations of (data) types for use within this API"),
            MetaModel.markdownDescription(`Declarations of (data) types for use within this API. See [[raml-10-spec-types|Types]].`),
            MetaModel.valueDescription("An object whose properties map type names to type declarations; or an array of such objects")
        ]


        //examples:GlobalExample[]
        // $examples=[MetaModel.embeddedInMaps(),MetaModel.thisFeatureCovers("https://github.com/raml-org/raml-spec/issues/70")]

        traits:RM.Trait[]
        $traits=[
            MetaModel.embeddedInMaps(),MetaModel.description("Declarations of traits used in this API"),
            MetaModel.description("Declarations of traits for use within this API"),
            MetaModel.markdownDescription(`Declarations of traits for use within this API. See [[raml-10-spec-resource-types-and-traits|Resource Types and Traits]].`),
            MetaModel.valueDescription("An object whose properties map trait names to trait declarations; or an array of such objects")
        ]

        resourceTypes:RM.ResourceType[]
        $resourceTypes=[
            MetaModel.embeddedInMaps(),MetaModel.description("Declaration of resource types used in this API"),
            MetaModel.description("Declarations of resource types for use within this API"),
            MetaModel.markdownDescription(`Declarations of resource types for use within this API. See [[raml-10-spec-resource-types-and-traits|Resource Types and Traits]].`),
            MetaModel.valueDescription("An object whose properties map resource type names to resource type declarations; or an array of such objects")
        ]

        annotationTypes:models.TypeDeclaration[];
        $annotationTypes=[
            MetaModel.setsContextValue("decls","true"),
            MetaModel.embeddedInMaps(),

            MetaModel.description("Declarations of annotation types for use by annotations"),
            MetaModel.markdownDescription(`Declarations of annotation types for use by annotations. See [[raml-10-spec-declaring-annotation-types|Annotation Types]].`),
            MetaModel.valueDescription("An object whose properties map annotation type names to annotation type declarations; or an array of such objects")
        ]

        //securitySchemeTypes:RM.SecuritySchemeType[];
        //$securitySchemaTypes=[
        //    MetaModel.embeddedInMaps(),
        //    MetaModel.description("Security schemas types declarations")]

        securitySchemes:RM.AbstractSecurityScheme[];
        $securitySchemes=[
            MetaModel.embeddedInMaps(),
            MetaModel.description("Security schemas declarations"),
            MetaModel.description("Declarations of security schemes for use within this API."),
            MetaModel.markdownDescription(`Declarations of security schemes for use within this API. See [[raml-10-spec-security|Security Schemes]].`),
            MetaModel.valueDescription("An object whose properties map security scheme names to security scheme declarations; or an array of such objects")
        ]

        uses:Library[];
        $uses=[
            MetaModel.embeddedInMaps(),
            MetaModel.description("Importing libraries"),
            MetaModel.setsContextValue("decls","true"),
            MetaModel.valueDescription("An array of libraries or a single library")
        ]
    }
    class Overlay extends Api{
        usage: string
        $usage=[MetaModel.description("contains description of why overlay exist")]

        masterRef:string;
        $masterRef=[MetaModel.required()];

        title:string
        $title=[MetaModel.description("Short plain-text label for the API")]


    }
    class Extension extends Api{
        usage: string
        $usage=[MetaModel.description("contains description of why extension exist")]

        masterRef:string;
        $masterRef=[MetaModel.required()];
        title:string
        $title=[MetaModel.description("Short plain-text label for the API")]


    }

    class Api extends LibraryBase{

        title:string
        $title=[MetaModel.required(),MetaModel.description("Short plain-text label for the API")]

        version:string
        $version=[MetaModel.description(`The version of the API, e.g. "v1"`)]

        baseUri:Sys.FullUriTemplateString
        $baseUri=[
            MetaModel.description(`A URI that's to be used as the base of all the resources' URIs. Often used as the base of the URL of each resource, containing the location of the API. Can be a template URI.`)
        ]
        baseUriParameters:models.TypeDeclaration[]


        $baseUriParameters=[
            MetaModel.setsContextValue("location",models.ModelLocation.BURI),
            MetaModel.setsContextValue("locationKind",models.LocationKind.APISTRUCTURE),
            MetaModel.description("Named parameters used in the baseUri (template)")
        ]

        protocols:string[]
        $protocols=[
            MetaModel.oneOf(["HTTP","HTTPS"]),
            MetaModel.description("The protocols supported by the API"),
            MetaModel.valueDescription("Array of strings, with each being \"HTTP\" or \"HTTPS\", case-insensitive")
        ]

        mediaType:Bodies.MimeType
        $mediaType=[
            MetaModel.oftenKeys(["application/json","application/xml"
                ,"application/x-www-form-urlencoded",
                "multipart/formdata"]),
            MetaModel.description(`The default media type to use for request and response bodies (payloads), e.g. "application/json"`)
            ,MetaModel.inherited(),
            MetaModel.valueDescription("Media type string")
        ]

        securedBy:RM.SecuritySchemeRef[]
        $securedBy=[
            MetaModel.description(`The security schemes that apply to every resource and method in the API`)
        ]

        resources:RM.Resource[]
        $resources=[ MetaModel.documentationTableLabel("/&lt;relativeUri&gt;"),
            MetaModel.newInstanceName("New Resource"),
            MetaModel.description(`The resources of the API, identified as relative URIs that begin with a slash (/). Every property whose key begins with a slash (/), and is either at the root of the API definition or is the child property of a resource property, is a resource property, e.g.: /users, /{groupId}, etc`)
        ]

        documentation:DocumentationItem[]
        $documentation=[
            MetaModel.description(`Additional overall documentation for the API`)
        ]

        $displayName = [ MetaModel.hide() ]

        $name = [ MetaModel.hide() ]

        $description=[MetaModel.description("A longer, human-friendly description of the API")]

        $annotations=[
            MetaModel.markdownDescription("Annotations to be applied to this API. Annotations are any property whose key begins with \"(\" and ends with \")\" and whose name (the part between the beginning and ending parentheses) is a declared annotation name. See the [[raml-10-spec-annotations|section on annotations]].")
        ]

        //$securitySchemeTypes=[MetaModel.hide()]
    }


    //This is actually not tested//TODO
    class DocumentationItem extends Common.RAMLLanguageElement{
        title:string
        $title=[
            MetaModel.description("Title of documentation section"),
            MetaModel.required()

        ]
        content:Sys.MarkdownString
        $content=[
            MetaModel.description("Content of documentation section"),
            MetaModel.required()
        ]
    }

    export class ScriptSpec extends Common.RAMLLanguageElement{
        language:string
        content:string;
    }
    export class ApiDescription extends Common.RAMLLanguageElement{
        apiFiles:Api[]
        script:ScriptSpec[];
        type:string
        $type=[MetaModel.oneOf(["endpoint","callback"]),MetaModel.descriminatingProperty()];
    }
    export class CallbackAPIDescription extends ApiDescription{
        type="callback"
        callbackFor:Api
    }
    export class RAMLProject extends Common.RAMLLanguageElement
    {
        relatedProjects:RAMLProject[]
        declaredApis:ApiDescription[]
        license:string
        overview:string
        url:string
    }
||||||| merged common ancestors
=======
import  MetaModel = require("../definition-system/metamodel")
import  Sys = require("./systemTypes")
import  RM=require("./methodsAndResources")
import  Decls=require("./declarations")
import  Params=require("./parameters")
import  Common=require("./common")
import  Bodies=require("./bodies")
import  models=require("./datamodel")


    export class GlobalSchema extends Common.RAMLSimpleElement implements Sys.Referencable<Sys.SchemaString>{
        key:string
        $key=[MetaModel.key(),MetaModel.description("Name of the global schema, used to refer on schema content")]
        value:Sys.SchemaString
        $value=[MetaModel.description("Content of the schema"),MetaModel.canBeValue(),MetaModel.value()]//TODO FIXME
        $=[MetaModel.actuallyExports("value"),MetaModel.description("Content of the schema")]
    }
    //export class GlobalExample extends Common.RAMLSimpleElement implements Sys.Referencable<Sys.SchemaString>{
    //    key:string
    //    $key=[MetaModel.key(),MetaModel.description("Name of the global schema, used to refer on schema content")]
    //    value:Sys.ExampleString
    //    $value=[MetaModel.description("Content of the schema")]//TODO FIXME
    //    $=[MetaModel.actuallyExports("value"),MetaModel.description("Content of the schema")]
    //}
    export class ImportDeclaration extends Common.RAMLSimpleElement{
        key:string
        $key=[MetaModel.key(),MetaModel.description("Name prefix (without dot) used to refer imported declarations")]

        value:Library
        $value=[MetaModel.description("Content of the declared namespace")];
    }

export class Library extends LibraryBase {
    usage: string
    $usage=[MetaModel.description("contains description of why library exist")]
}

    export class LibraryBase extends Common.RAMLLanguageElement{

        $ = [MetaModel.internalClass()]

        name: string;
        $name=[MetaModel.key()]
        schemas:GlobalSchema[]
        $schemas=[
            MetaModel.embeddedInMaps(),
            MetaModel.description("Alias for the equivalent \"types\" property, for compatibility with RAML 0.8. Deprecated - API definitions should use the \"types\" property, as the \"schemas\" alias for that property name may be removed in a future RAML version. The \"types\" property allows for XML and JSON schemas.")
        ]

        types:models.TypeDeclaration[]
        $types=[MetaModel.embeddedInMaps(),
            MetaModel.setsContextValue("locationKind",models.LocationKind.MODELS),
            MetaModel.description("Declarations of (data) types for use within this API"),
            MetaModel.markdownDescription(`Declarations of (data) types for use within this API. See [[raml-10-spec-types|Types]].`),
            MetaModel.valueDescription("An object whose properties map type names to type declarations; or an array of such objects")
        ]


        //examples:GlobalExample[]
        // $examples=[MetaModel.embeddedInMaps(),MetaModel.thisFeatureCovers("https://github.com/raml-org/raml-spec/issues/70")]

        traits:RM.Trait[]
        $traits=[
            MetaModel.embeddedInMaps(),MetaModel.description("Declarations of traits used in this API"),
            MetaModel.description("Declarations of traits for use within this API"),
            MetaModel.markdownDescription(`Declarations of traits for use within this API. See [[raml-10-spec-resource-types-and-traits|Resource Types and Traits]].`),
            MetaModel.valueDescription("An object whose properties map trait names to trait declarations; or an array of such objects")
        ]

        resourceTypes:RM.ResourceType[]
        $resourceTypes=[
            MetaModel.embeddedInMaps(),MetaModel.description("Declaration of resource types used in this API"),
            MetaModel.description("Declarations of resource types for use within this API"),
            MetaModel.markdownDescription(`Declarations of resource types for use within this API. See [[raml-10-spec-resource-types-and-traits|Resource Types and Traits]].`),
            MetaModel.valueDescription("An object whose properties map resource type names to resource type declarations; or an array of such objects")
        ]

        annotationTypes:models.TypeDeclaration[];
        $annotationTypes=[
            MetaModel.setsContextValue("decls","true"),
            MetaModel.embeddedInMaps(),

            MetaModel.description("Declarations of annotation types for use by annotations"),
            MetaModel.markdownDescription(`Declarations of annotation types for use by annotations. See [[raml-10-spec-declaring-annotation-types|Annotation Types]].`),
            MetaModel.valueDescription("An object whose properties map annotation type names to annotation type declarations; or an array of such objects")
        ]

        //securitySchemeTypes:RM.SecuritySchemeType[];
        //$securitySchemaTypes=[
        //    MetaModel.embeddedInMaps(),
        //    MetaModel.description("Security schemas types declarations")]

        securitySchemes:RM.AbstractSecurityScheme[];
        $securitySchemes=[
            MetaModel.embeddedInMaps(),
            MetaModel.description("Security schemas declarations"),
            MetaModel.description("Declarations of security schemes for use within this API."),
            MetaModel.markdownDescription(`Declarations of security schemes for use within this API. See [[raml-10-spec-security|Security Schemes]].`),
            MetaModel.valueDescription("An object whose properties map security scheme names to security scheme declarations; or an array of such objects")
        ]

        uses:Library[];
        $uses=[
            MetaModel.embeddedInMaps(),
            MetaModel.description("Importing libraries"),
            MetaModel.setsContextValue("decls","true"),
            MetaModel.valueDescription("An array of libraries or a single library")
        ]
    }
    class Overlay extends Api{
        usage: string
        $usage=[MetaModel.description("contains description of why overlay exist")]

        masterRef:string;
        $masterRef=[MetaModel.required()];

        title:string
        $title=[MetaModel.description("Short plain-text label for the API")]


    }
    class Extension extends Api{
        usage: string
        $usage=[MetaModel.description("contains description of why extension exist")]

        masterRef:string;
        $masterRef=[MetaModel.required()];
        title:string
        $title=[MetaModel.description("Short plain-text label for the API")]


    }

    class Api extends LibraryBase{

        title:string
        $title=[MetaModel.required(),MetaModel.description("Short plain-text label for the API")]

        version:string
        $version=[MetaModel.description(`The version of the API, e.g. "v1"`)]

        baseUri:Sys.FullUriTemplateString
        $baseUri=[
            MetaModel.description(`A URI that's to be used as the base of all the resources' URIs. Often used as the base of the URL of each resource, containing the location of the API. Can be a template URI.`)
        ]
        baseUriParameters:models.TypeDeclaration[]


        $baseUriParameters=[
            MetaModel.setsContextValue("location",models.ModelLocation.BURI),
            MetaModel.setsContextValue("locationKind",models.LocationKind.APISTRUCTURE),
            MetaModel.description("Named parameters used in the baseUri (template)")
        ]

        protocols:string[]
        $protocols=[
            MetaModel.oneOf(["HTTP","HTTPS"]),
            MetaModel.description("The protocols supported by the API"),
            MetaModel.valueDescription("Array of strings, with each being \"HTTP\" or \"HTTPS\", case-insensitive")
        ]

        mediaType:Bodies.MimeType
        $mediaType=[
            MetaModel.oftenKeys(["application/json","application/xml"
                ,"application/x-www-form-urlencoded",
                "multipart/form-data"]),
            MetaModel.description(`The default media type to use for request and response bodies (payloads), e.g. "application/json"`)
            ,MetaModel.inherited(),
            MetaModel.valueDescription("Media type string")
        ]

        securedBy:RM.SecuritySchemeRef[]
        $securedBy=[
            MetaModel.description(`The security schemes that apply to every resource and method in the API`)
        ]

        resources:RM.Resource[]
        $resources=[ MetaModel.documentationTableLabel("/&lt;relativeUri&gt;"),
            MetaModel.newInstanceName("New Resource"),
            MetaModel.description(`The resources of the API, identified as relative URIs that begin with a slash (/). Every property whose key begins with a slash (/), and is either at the root of the API definition or is the child property of a resource property, is a resource property, e.g.: /users, /{groupId}, etc`)
        ]

        documentation:DocumentationItem[]
        $documentation=[
            MetaModel.description(`Additional overall documentation for the API`)
        ]

        $displayName = [ MetaModel.hide() ]

        $name = [ MetaModel.hide() ]

        $description=[MetaModel.description("A longer, human-friendly description of the API")]

        $annotations=[
            MetaModel.markdownDescription("Annotations to be applied to this API. Annotations are any property whose key begins with \"(\" and ends with \")\" and whose name (the part between the beginning and ending parentheses) is a declared annotation name. See the [[raml-10-spec-annotations|section on annotations]].")
        ]

        //$securitySchemeTypes=[MetaModel.hide()]
    }


    //This is actually not tested//TODO
    class DocumentationItem extends Common.RAMLLanguageElement{
        title:string
        $title=[
            MetaModel.description("Title of documentation section"),
            MetaModel.required()

        ]
        content:Sys.MarkdownString
        $content=[
            MetaModel.description("Content of documentation section"),
            MetaModel.required()
        ]
    }

    export class ScriptSpec extends Common.RAMLLanguageElement{
        language:string
        content:string;
    }
    export class ApiDescription extends Common.RAMLLanguageElement{
        apiFiles:Api[]
        script:ScriptSpec[];
        type:string
        $type=[MetaModel.oneOf(["endpoint","callback"]),MetaModel.descriminatingProperty()];
    }
    export class CallbackAPIDescription extends ApiDescription{
        type="callback"
        callbackFor:Api
    }
    export class RAMLProject extends Common.RAMLLanguageElement
    {
        relatedProjects:RAMLProject[]
        declaredApis:ApiDescription[]
        license:string
        overview:string
        url:string
    }
>>>>>>> refs/remotes/mulesoft/master
