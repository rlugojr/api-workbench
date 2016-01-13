<<<<<<< HEAD
import  MetaModel = require("../definition-system/metamodel")
import  Sys = require("./systemTypes")
import  Params=require("./parameters")
import  Bodies=require("./bodies")
import  Common=require("./common")
///////////////////////////////////////////////////////////
//Resources  methods and Api, demonstrate setting context values a bit

export class ResourceTypeRef extends Sys.Reference<ResourceType>{

}

export class TraitRef extends Sys.Reference<Trait>{

}
export class SecuritySchemaPart extends Common.RAMLSimpleElement{

    $=[MetaModel.allowAny()]
}
export class SecuritySchemaSettings extends Common.RAMLSimpleElement{

    //TODO FILL OATH1, OATH2 requirements
    $=[MetaModel.allowAny()]
}
export class OAuth1SecuritySchemeSettings extends  SecuritySchemaSettings{
    $=[MetaModel.functionalDescriminator("$parent.type=='OAuth 1.0'"),MetaModel.allowAny()]

    requestTokenUri:Sys.FixedUri
    $requestTokenUri=[MetaModel.required(),MetaModel.description("The URI of the Temporary Credential Request endpoint as defined in RFC5849 Section 2.1")]

    authorizationUri:Sys.FixedUri
    $authorizationUri=[MetaModel.required(),MetaModel.description("The URI of the Resource Owner Authorization endpoint as defined in RFC5849 Section 2.2")]

    tokenCredentialsUri:Sys.FixedUri
    $tokenCredentialsUri=[MetaModel.required(),MetaModel.description("The URI of the Token Request endpoint as defined in RFC5849 Section 2.3")]

}
export class OAuth2SecuritySchemeSettings extends  SecuritySchemaSettings{
    $=[MetaModel.functionalDescriminator("$parent.type=='OAuth 2.0'"),MetaModel.allowAny()]

    accessTokenUri:Sys.FixedUri
    $accessTokenUri=[MetaModel.required(),MetaModel.description("The URI of the Token Endpoint as defined in RFC6749 [RFC6748] Section 3.2")]

    authorizationUri:Sys.FixedUri
    $authorizationUri=[MetaModel.required(),MetaModel.description("The URI of the Authorization Endpoint as defined in RFC6749 [RFC6748] Section 3.1")]

    authorizationGrants:string[]
    $authorizationGrants=[MetaModel.required(),MetaModel.description("A list of the Authorization grants supported by the API As defined in RFC6749 [RFC6749] Sections 4.1, 4.2, 4.3 and 4.4, can be any of: code, token, owner or credentials.")]

    scopes:string[]
    $scopes=[MetaModel.description("A list of scopes supported by the API as defined in RFC6749 [RFC6749] Section 3.3")]
}

export class SecuritySchemaRef extends Sys.Reference<SecuritySchema>{

}


export class SecuritySchema extends Common.RAMLLanguageElement implements Sys.Referencable<SecuritySchema> {
    name:string
    $name=[MetaModel.key()]

    type:string
    $type=[MetaModel.required(), MetaModel.oneOf(["OAuth 1.0","OAuth 2.0","Basic Authentication","DigestSecurityScheme Authentication","x-{other}"]),MetaModel.description(
        "The securitySchemes property MUST be used to specify an API's security mechanisms, including the required settings and the authentication methods that the API supports. one authentication method is allowed if the API supports them."
    )]

    description:Sys.MarkdownString;
    $description=[MetaModel.description("The description attribute MAY be used to describe a securitySchemes property.")]

    describedBy:SecuritySchemaPart;
    $describedBy=[MetaModel.description(`The describedBy attribute MAY be used to apply a trait-like structure to a security scheme mechanism so as to extend the mechanism, such as specifying response codes, HTTP headers or custom documentation.
        This extension allows API designers to describe security schemes. As a best practice, even for standard security schemes, API designers SHOULD describe the security schemes' required artifacts, such as headers, URI parameters, and so on. Including the security schemes' description completes an API's documentation.`)]

    settings:SecuritySchemaSettings;
    $settings=[MetaModel.description(`The settings attribute MAY be used to provide security schema-specific information. Depending on the value of the type parameter, its attributes can vary.
        The following lists describe the minimum set of properties which any processing application MUST provide and validate if it chooses to implement the Security Scheme type. Processing applications MAY choose to recognize other properties for things such as token lifetime, preferred cryptographic algorithms, an so on.`)]

    $=[MetaModel.description("Declares globally referenceable security schema definition"),MetaModel.actuallyExports("$self"),MetaModel.referenceIs("settings")]
}
//export class HasNormalParameters extends Common.RAMLLanguageElement{
//    queryParameters:Params.Parameter[]
//    displayName:string
//    $displayName=[MetaModel.issue("I am not sure that it should be here but it is actually used")]//REVIEW
//    $queryParameters=[
//        MetaModel.issue("https://github.com/raml-org/raml-spec/issues/53"),
//        MetaModel.issue("https://github.com/raml-org/raml-spec/issues/78"),
//        MetaModel.issue("https://github.com/raml-org/raml-spec/issues/46"),
//        MetaModel.setsContextValue("location",ParameterLocation.QUERY),MetaModel.newInstanceName("New query parameter"),MetaModel.description('An APIs resources MAY be filtered (to return a subset of results) or altered (such as transforming' +
//        ' a response body from JSON to XML format) by the use of query strings. If the resource or its method supports a query string, the query string MUST be defined by the queryParameters property')]
//    headers:Parameter[];
//    $headers=[
//        MetaModel.issue("https://github.com/raml-org/raml-spec/issues/59"),
//        MetaModel.setsContextValue("location",ParameterLocation.HEADERS),
//        MetaModel.description("Headers that allowed at this position"),
//        MetaModel.newInstanceName("New Header"),MetaModel.issue("It is not clear if this also allowed for resources(check)"),MetaModel.issue("cover wildcards ({*})")]
//
//}
export class MethodBase extends Params.HasNormalParameters{

    responses:Bodies.Response[]

    $responses=[MetaModel.newInstanceName("New Response"),MetaModel.description(`Resource methods MAY have one or more responses. Responses MAY be described using the description property, and MAY include example attributes or schema properties.
`)]

    body:Bodies.BodyLike[]
    $body=[MetaModel.newInstanceName("New Body"),MetaModel.description(`Some method verbs expect the resource to be sent as a request body. For example, to create a resource, the request must include the details of the resource to create.
Resources CAN have alternate representations. For example, an API might support both JSON and XML representations.
A method's body is defined in the body property as a hashmap, in which the key MUST be a valid media type.`)]



    is:TraitRef[]
    securedBy:SecuritySchemaRef[]
    $securedBy=[

        MetaModel.allowNull(),
        MetaModel.description(`A list of the security schemas to apply, these must be defined in the securitySchemes declaration.
To indicate that the method may be called without applying any securityScheme, the method may be annotated with the null securityScheme.
Security schemas may also be applied to a resource with securedBy, which is equivalent to applying the security schemas to all methods that may be declared, explicitly or implicitly, by defining the resourceTypes or traits property for that resource.`)]
    $is=[MetaModel.description("Instantiation of applyed traits")]

}
export class Trait extends MethodBase implements Sys.DeclaresDynamicType<Trait>{
    name:string
    usage:string
    $name=[MetaModel.key(),MetaModel.description("Name of the trait")]

    $=[MetaModel.inlinedTemplates(),MetaModel.allowQuestion()]
}

export class ResourceType extends Common.RAMLLanguageElement implements Sys.DeclaresDynamicType<ResourceType>{
    name:string
    usage:string


    $name=[MetaModel.key(),MetaModel.description("Name of the resource type")]
    methods:Method[];
    //FIXME
    $methods=[MetaModel.description("Methods that are part of this resource type definition")]

    is:TraitRef[]
    $is=[MetaModel.description("Instantiation of applyed traits")]

    type:ResourceTypeRef
    $type=[MetaModel.description("Instantiation of applyed resource type")]
    //TODO FIXME

    $=[MetaModel.inlinedTemplates(),MetaModel.allowQuestion()]

    securedBy:SecuritySchemaRef[]
    $securedBy=[
        MetaModel.allowNull(),
        MetaModel.description(` securityScheme may also be applied to a resource by using the securedBy key, which is equivalent to applying the securityScheme to all methods that may be declared, explicitly or implicitly, by defining the resourceTypes or traits property for that resource.
To indicate that the method may be called without applying any securityScheme, the method may be annotated with the null securityScheme.`)]


    uriParameters:Params.Parameter[]
    $uriParameters=[
        MetaModel.setsContextValue("location",Params.ParameterLocation.URI),
        MetaModel.description("Uri parameters of this resource")]
        //TODO MERGE REUSED STUFF WITH RESOURCE
}


export class Method extends MethodBase{
    method:string;
    $method=[MetaModel.key(),
        MetaModel.extraMetaKey("methods"),
        MetaModel.oneOf(["get","put","post","delete","patch","options","head"]),MetaModel.description("Method that can be called")]
    //$baseUriParameters=[MetaModel.setsContextValue("location",Params.ParameterLocation.BURI),MetaModel.description("A resource or a method can override a base URI template's values. This is useful to restrict or change the default or parameter selection in the base URI. The baseUriParameters property MAY be used to override any or all parameters defined at the root level baseUriParameters property, as well as base URI parameters not specified at the root level."
    //),MetaModel.issue("This feature is not consistent (causes not solvable overloading)"),MetaModel.needsClarification("Is it also related to resource types and traits")]

    protocols:string[]
    $protocols=[MetaModel.oneOf(["HTTP","HTTPS"]),
        MetaModel.description("A method can override an API's protocols value for that single method by setting a different value for the fields.")]

    $=[MetaModel.description("Method object allows description of http methods")]

    securedBy:SecuritySchemaRef[]
    $securedBy=[
        MetaModel.allowNull(),
        MetaModel.description(` securityScheme may also be applied to a resource by using the securedBy key, which is equivalent to applying the securityScheme to all methods that may be declared, explicitly or implicitly, by defining the resourceTypes or traits property for that resource.
To indicate that the method may be called without applying any securityScheme, the method may be annotated with the null securityScheme.`)]

}

export class Resource extends Common.RAMLLanguageElement{
    relativeUri:Sys.RelativeUriString
    $relativeUri=[MetaModel.key(),
        MetaModel.startFrom("/"),MetaModel.description("Relative URL of this resource from the parent resource"),
        ]
    type:ResourceTypeRef
    $type=[MetaModel.description("Instantiation of applyed resource type")]

    is:TraitRef[]
    $is=[MetaModel.description("Instantiation of applyed traits")]

    securedBy:SecuritySchemaRef[]
    $securedBy=[
        MetaModel.allowNull(),
        MetaModel.description(` securityScheme may also be applied to a resource by using the securedBy key, which is equivalent to applying the securityScheme to all methods that may be declared, explicitly or implicitly, by defining the resourceTypes or traits property for that resource.
To indicate that the method may be called without applying any securityScheme, the method may be annotated with the null securityScheme.`)]

    uriParameters:Params.Parameter[]
    $uriParameters=[
        MetaModel.setsContextValue("fieldOrParam",true),
        MetaModel.setsContextValue("location",Params.ParameterLocation.URI),
        MetaModel.description("Uri parameters of this resource")]

    methods:Method[];
    $methods=[MetaModel.newInstanceName("New Method"),MetaModel.description("Methods that can be called on this resource")]
    resources:Resource[];
    $resources=[MetaModel.newInstanceName("New Resource"),MetaModel.description("Children resources")]


    displayName: string
    baseUriParameters:Params.Parameter[]

    $baseUriParameters=[MetaModel.setsContextValue("fieldOrParam",true),MetaModel.setsContextValue("location",Params.ParameterLocation.BURI),MetaModel.description("A resource or a method can override a base URI template's values. This is useful to restrict or change the default or parameter selection in the base URI. The baseUriParameters property MAY be used to override any or all parameters defined at the root level baseUriParameters property, as well as base URI parameters not specified at the root level."
    )]
}
||||||| merged common ancestors
=======
import  MetaModel = require("../definition-system/metamodel")
import  Sys = require("./systemTypes")
import  Params=require("./parameters")
import  Bodies=require("./bodies")
import  Common=require("./common")
///////////////////////////////////////////////////////////
//Resources  methods and Api, demonstrate setting context values a bit

export class ResourceTypeRef extends Sys.Reference<ResourceType>{

}

export class TraitRef extends Sys.Reference<Trait>{

}

export class MethodBase extends Params.HasNormalParameters{

    responses:Bodies.Response[]

    $responses=[MetaModel.newInstanceName("New Response"),MetaModel.description(`Resource methods MAY have one or more responses. Responses MAY be described using the description property, and MAY include example attributes or schema properties.
`)]

    body:Bodies.BodyLike[]
    $body=[MetaModel.newInstanceName("New Body"),MetaModel.description(`Some method verbs expect the resource to be sent as a request body. For example, to create a resource, the request must include the details of the resource to create.
Resources CAN have alternate representations. For example, an API might support both JSON and XML representations.
A method's body is defined in the body property as a hashmap, in which the key MUST be a valid media type.`)]



    is:TraitRef[]
    securedBy:SecuritySchemeRef[]
    $securedBy=[

        MetaModel.allowNull(),
        MetaModel.description(`A list of the security schemas to apply, these must be defined in the securitySchemes declaration.
To indicate that the method may be called without applying any securityScheme, the method may be annotated with the null securityScheme.
Security schemas may also be applied to a resource with securedBy, which is equivalent to applying the security schemas to all methods that may be declared, explicitly or implicitly, by defining the resourceTypes or traits property for that resource.`)]
    $is=[MetaModel.description("Instantiation of applyed traits")]

}
export class Trait extends MethodBase implements Sys.DeclaresDynamicType<Trait>{
    name:string
    usage:string
    $name=[MetaModel.key(),MetaModel.description("Name of the trait")]

    $=[MetaModel.inlinedTemplates(),MetaModel.allowQuestion()]
}

export class ResourceType extends Common.RAMLLanguageElement implements Sys.DeclaresDynamicType<ResourceType>{
    name:string
    usage:string


    $name=[MetaModel.key(),MetaModel.description("Name of the resource type")]
    methods:Method[];
    //FIXME
    $methods=[MetaModel.description("Methods that are part of this resource type definition")]

    is:TraitRef[]
    $is=[MetaModel.description("Instantiation of applyed traits")]

    type:ResourceTypeRef
    $type=[MetaModel.description("Instantiation of applyed resource type")]
    //TODO FIXME

    $=[MetaModel.inlinedTemplates(),MetaModel.allowQuestion()]

    securedBy:SecuritySchemeRef[]
    $securedBy=[
        MetaModel.allowNull(),
        MetaModel.description(` securityScheme may also be applied to a resource by using the securedBy key, which is equivalent to applying the securityScheme to all methods that may be declared, explicitly or implicitly, by defining the resourceTypes or traits property for that resource.
To indicate that the method may be called without applying any securityScheme, the method may be annotated with the null securityScheme.`)]


    uriParameters:Params.Parameter[]
    $uriParameters=[
        MetaModel.setsContextValue("location",Params.ParameterLocation.URI),
        MetaModel.description("Uri parameters of this resource")]
        //TODO MERGE REUSED STUFF WITH RESOURCE

    displayName: string
}


export class Method extends MethodBase{
    method:string;
    $method=[MetaModel.key(),
        MetaModel.extraMetaKey("methods"),
        MetaModel.oneOf(["get","put","post","delete","patch","options","head"]),MetaModel.description("Method that can be called")]
    //$baseUriParameters=[MetaModel.setsContextValue("location",Params.ParameterLocation.BURI),MetaModel.description("A resource or a method can override a base URI template's values. This is useful to restrict or change the default or parameter selection in the base URI. The baseUriParameters property MAY be used to override any or all parameters defined at the root level baseUriParameters property, as well as base URI parameters not specified at the root level."
    //),MetaModel.issue("This feature is not consistent (causes not solvable overloading)"),MetaModel.needsClarification("Is it also related to resource types and traits")]

    protocols:string[]
    $protocols=[MetaModel.oneOf(["HTTP","HTTPS"]),
        MetaModel.description("A method can override an API's protocols value for that single method by setting a different value for the fields.")]

    $=[MetaModel.description("Method object allows description of http methods")]

    securedBy:SecuritySchemeRef[]
    $securedBy=[
        MetaModel.allowNull(),
        MetaModel.description(` securityScheme may also be applied to a resource by using the securedBy key, which is equivalent to applying the securityScheme to all methods that may be declared, explicitly or implicitly, by defining the resourceTypes or traits property for that resource.
To indicate that the method may be called without applying any securityScheme, the method may be annotated with the null securityScheme.`)]

}

export class Resource extends Common.RAMLLanguageElement{
    relativeUri:Sys.RelativeUriString
    $relativeUri=[MetaModel.key(),
        MetaModel.startFrom("/"),MetaModel.description("Relative URL of this resource from the parent resource"),
        ]
    type:ResourceTypeRef
    $type=[MetaModel.description("Instantiation of applyed resource type")]

    is:TraitRef[]
    $is=[MetaModel.description("Instantiation of applyed traits")]

    securedBy:SecuritySchemeRef[]
    $securedBy=[
        MetaModel.allowNull(),
        MetaModel.description(` securityScheme may also be applied to a resource by using the securedBy key, which is equivalent to applying the securityScheme to all methods that may be declared, explicitly or implicitly, by defining the resourceTypes or traits property for that resource.
To indicate that the method may be called without applying any securityScheme, the method may be annotated with the null securityScheme.`)]

    uriParameters:Params.Parameter[]
    $uriParameters=[
        MetaModel.setsContextValue("fieldOrParam",true),
        MetaModel.setsContextValue("location",Params.ParameterLocation.URI),
        MetaModel.description("Uri parameters of this resource")]

    methods:Method[];
    $methods=[MetaModel.newInstanceName("New Method"),MetaModel.description("Methods that can be called on this resource")]
    resources:Resource[];
    $resources=[MetaModel.newInstanceName("New Resource"),MetaModel.description("Children resources")]


    displayName: string
    baseUriParameters:Params.Parameter[]

    $baseUriParameters=[MetaModel.setsContextValue("fieldOrParam",true),MetaModel.setsContextValue("location",Params.ParameterLocation.BURI),MetaModel.description("A resource or a method can override a base URI template's values. This is useful to restrict or change the default or parameter selection in the base URI. The baseUriParameters property MAY be used to override any or all parameters defined at the root level baseUriParameters property, as well as base URI parameters not specified at the root level."
    )]
}

export class SecuritySchemePart extends MethodBase {

    //$=[MetaModel.issue("Specification is actually very vague here")]

    $headers=[
        MetaModel.markdownDescription("Optional array of headers, documenting the possible headers that could be accepted."),
        MetaModel.valueDescription("Object whose property names are the request header names and whose values describe the values.")
    ]

    $queryParameters=[
        MetaModel.markdownDescription("Query parameters, used by the schema in order to authorize the request. Mutually exclusive with queryString."),
        MetaModel.valueDescription("Object whose property names are the query parameter names and whose values describe the values.")
    ]

    $queryString=[
        MetaModel.description("Specifies the query string, used by the schema in order to authorize the request. Mutually exclusive with queryParameters."),
        MetaModel.valueDescription("Type name or type declaration")
    ]

    $responses=[
        MetaModel.description("Optional array of responses, describing the possible responses that could be sent.")
    ]

    $is=[MetaModel.hide()]

    $securedBy=[MetaModel.hide()]

    $displayName=[MetaModel.description("An alternate, human-friendly name for the security scheme part")]

    $description=[
        MetaModel.description("A longer, human-friendly description of the security scheme part"),
        MetaModel.valueDescription("Markdown string")
    ]

    $annotations=[MetaModel.description("Annotations to be applied to this security scheme part. Annotations are any property whose key begins with \"(\" and ends with \")\" and whose name (the part between the beginning and ending parentheses) is a declared annotation name. See [[raml-10-spec-annotations|the section on annotations]].")]

}

export class SecuritySchemeSettings {
    $=[MetaModel.allowAny()]
}

export class AbstractSecurityScheme extends Common.RAMLLanguageElement implements Sys.Referencable<AbstractSecurityScheme> {
    name:string
    $name=[MetaModel.key(),MetaModel.startFrom(""),MetaModel.hide()]

    type:string
    $type=[
        MetaModel.required(),
        MetaModel.oneOf(["OAuth 1.0","OAuth 2.0","Basic Authentication","DigestSecurityScheme Authentication","x-{other}"]),
        MetaModel.descriminatingProperty(),//FIXME (we need more clear connection with SecuritySchemeType)
        MetaModel.description("The securitySchemes property MUST be used to specify an API's security mechanisms, including the required settings and the authentication methods that the API supports. one authentication method is allowed if the API supports them."),
        MetaModel.valueDescription("string<br><br>The value MUST be one of<br>* OAuth 1.0,<br>* OAuth 2.0,<br>* BasicSecurityScheme Authentication<br>* DigestSecurityScheme Authentication<br>* x-&lt;other&gt;")
    ]

    description:Sys.MarkdownString;
    $description=[
        MetaModel.description("The description attribute MAY be used to describe a security schemes property."),
        MetaModel.description("The description MAY be used to describe a securityScheme.")
    ]

    describedBy:SecuritySchemePart;
    $describedBy=[
        MetaModel.description(`A description of the request components related to Security that are determined by the scheme: the headers, query parameters or responses. As a best practice, even for standard security schemes, API designers SHOULD describe these properties of security schemes.
Including the security scheme description completes an API documentation.`)
    ]

    settings:SecuritySchemeSettings;
    $settings=[MetaModel.description(`The settings attribute MAY be used to provide security scheme-specific information. The required attributes vary depending on the type of security scheme is being declared.
It describes the minimum set of properties which any processing application MUST provide and validate if it chooses to implement the security scheme. Processing applications MAY choose to recognize other properties for things such as token lifetime, preferred cryptographic algorithms, and more.`)]

    $=[MetaModel.description("Declares globally referable security schema definition"),MetaModel.actuallyExports("$self"),MetaModel.referenceIs("settings")]
}

export class SecuritySchemeRef extends Sys.Reference<AbstractSecurityScheme>{
    $=[MetaModel.allowAny()]
}

export class OAuth1SecuritySchemeSettings extends  SecuritySchemeSettings{
    $=[MetaModel.allowAny(), MetaModel.functionalDescriminator("$parent.type=='OAuth 1.0'")]

    requestTokenUri:Sys.FixedUri
    $requestTokenUri=[
        MetaModel.required(),
        MetaModel.description("The URI of the Temporary Credential Request endpoint as defined in RFC5849 Section 2.1"),
        MetaModel.valueDescription("FixedUriString")
    ]

    authorizationUri:Sys.FixedUri
    $authorizationUri=[
        MetaModel.required(),
        MetaModel.description("The URI of the Resource Owner Authorization endpoint as defined in RFC5849 Section 2.2"),
        MetaModel.valueDescription("FixedUriString")
    ]

    tokenCredentialsUri:Sys.FixedUri
    $tokenCredentialsUri=[
        MetaModel.required(),
        MetaModel.description("The URI of the Token Request endpoint as defined in RFC5849 Section 2.3"),
        MetaModel.valueDescription("FixedUriString")
    ]


    $annotations=[MetaModel.hide()]
}
export class OAuth2SecuritySchemeSettings extends  SecuritySchemeSettings{
    $=[MetaModel.allowAny()]

    accessTokenUri:Sys.FixedUri
    $accessTokenUri=[
        MetaModel.required(),
        MetaModel.description("The URI of the Token Endpoint as defined in RFC6749 [RFC6748] Section 3.2. Not required forby implicit grant type."),
        MetaModel.valueDescription("FixedUriString")
    ]

    authorizationUri:Sys.FixedUri
    $authorizationUri=[
        MetaModel.required(),
        MetaModel.description("The URI of the Authorization Endpoint as defined in RFC6749 [RFC6748] Section 3.1. Required forby authorization_code and implicit grant types."),
        MetaModel.valueDescription("FixedUriString")
    ]

    authorizationGrants:string[]
    $authorizationGrants=[MetaModel.required(),MetaModel.markdownDescription("A list of the Authorization grants supported by the API as defined in RFC6749 [RFC6749] Sections 4.1, 4.2, 4.3 and 4.4, can be any of:<br>* authorization_code<br>* password<br>* client_credentials<br>* implicit<br>* refresh_token.")]

    scopes:string[]
    $scopes=[MetaModel.description("A list of scopes supported by the security scheme as defined in RFC6749 [RFC6749] Section 3.3")]

    $annotations=[MetaModel.hide()]
}

//export class PassThroughSecuritySchemeSettings extends  SecuritySchemeSettings{
//    $=[MetaModel.allowAny()]
//
//
//    queryParameterName:string
//    headerName:string
//
//}

class OAuth2SecurityScheme extends AbstractSecurityScheme{
    type="OAuth 2.0"
    settings:OAuth2SecuritySchemeSettings

    $=[MetaModel.description("Declares globally referable security schema definition"),MetaModel.actuallyExports("$self"),MetaModel.referenceIs("settings")]

}
class OAuth1SecurityScheme extends AbstractSecurityScheme{
    type="OAuth 1.0"
    $=[MetaModel.description("Declares globally referable security schema definition"),MetaModel.actuallyExports("$self"),MetaModel.referenceIs("settings")]
    settings: OAuth1SecuritySchemeSettings
}
class BasicSecurityScheme extends AbstractSecurityScheme{
    type="Basic Authentication"
    $=[MetaModel.description("Declares globally referable security schema definition"),MetaModel.actuallyExports("$self"),MetaModel.referenceIs("settings")]

}
class DigestSecurityScheme extends AbstractSecurityScheme{
    type="DigestSecurityScheme Authentication"
    $=[MetaModel.description("Declares globally referable security schema definition"),MetaModel.actuallyExports("$self"),MetaModel.referenceIs("settings")]

}
class CustomSecurityScheme extends AbstractSecurityScheme{
    type="x-{other}"
    $=[MetaModel.description("Declares globally referable security schema definition"),MetaModel.actuallyExports("$self"),MetaModel.referenceIs("settings")]

}
>>>>>>> refs/remotes/mulesoft/master
