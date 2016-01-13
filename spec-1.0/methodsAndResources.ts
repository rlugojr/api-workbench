<<<<<<< HEAD
import  MetaModel = require("../definition-system/metamodel")
import  Sys = require("./systemTypes")
import  Params=require("./parameters")
import  Bodies=require("./bodies")
import  Common=require("./common")
import  Declarations=require("./declarations")
import models=require("./datamodel")
import  auth=require("./auth")
import  api=require("./api")
///////////////////////////////////////////////////////////
//Resources  methods and Api, demonstrate setting context values a bit

export class ResourceTypeRef extends Sys.Reference<ResourceType>{

}

export class TraitRef extends Sys.Reference<Trait>{

}
export class SecuritySchemePart extends MethodBase {

    //$=[MetaModel.issue("Specification is actually very vague here")]

    $headers=[
        MetaModel.markdownDescription("Optional array of headers, documenting the possible headers that could be accepted. See [[raml-10-spec-headers|Headers]] section."),
        MetaModel.valueDescription("Object whose property names are the request header names and whose values describe the values.")
    ]

    $queryParameters=[
        MetaModel.markdownDescription("Query parameters, used by the schema in order to authorize the request. Mutually exclusive with queryString. See [[raml-10-spec-query-parameters-in-a-query-string|Query Parameters]] section."),
        MetaModel.valueDescription("Object whose property names are the query parameter names and whose values describe the values.")
    ]

    $queryString=[
        MetaModel.description("Specifies the query string, used by the schema in order to authorize the request. Mutually exclusive with queryParameters."),
        MetaModel.valueDescription("Type name or type declaration")
    ]

    $responses=[
        MetaModel.description("Optional array of responses, describing the possible responses that could be sent. See [[raml-10-spec-responses|Responses]] section.")
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



//export class SecuritySchemeType extends Common.RAMLLanguageElement{
//
//    requiredSettings:models.TypeDeclaration[];
//    $requiredSettings=[MetaModel.description("You may declare settings needed to use this type of security security schemas"),
//        MetaModel.setsContextValue("locationKind",models.LocationKind.DECLARATIONS),
//        MetaModel.declaringFields()]
//
//    describedBy:SecuritySchemePart;
//    $describedBy=[MetaModel.description(`The describedBy attribute MAY be used to apply a trait-like structure to a security scheme mechanism so as to extend the mechanism, such as specifying response codes, HTTP headers or custom documentation.
//        This extension allows API designers to describe security schemes. As a best practice, even for standard security schemes, API designers SHOULD describe the security schemes' required artifacts, such as headers, URI parameters, and so on. Including the security schemes' description completes an API's documentation.`)]
//
//    $=[MetaModel.declaresSubTypeOf("SecuritySchemeSettings"),MetaModel.description("Security schema type allows you to contribute your own security schema type with settings and optinal configurator for " +
//    "plugging into client sdks auth mechanism")]
//}

export class SecuritySchemeSettings {

    $=[]

}
export class OAuth1SecuritySchemeSettings extends  SecuritySchemeSettings{
    $=[MetaModel.functionalDescriminator("$parent.type=='OAuth 1.0'")]

    requestTokenUri:Sys.FixedUriString
    $requestTokenUri=[
        MetaModel.required(),
        MetaModel.description("The URI of the Temporary Credential Request endpoint as defined in RFC5849 Section 2.1"),
        MetaModel.valueDescription("FixedUriString")
    ]

    authorizationUri:Sys.FixedUriString
    $authorizationUri=[
        MetaModel.required(),
        MetaModel.description("The URI of the Resource Owner Authorization endpoint as defined in RFC5849 Section 2.2"),
        MetaModel.valueDescription("FixedUriString")
    ]

    tokenCredentialsUri:Sys.FixedUriString
    $tokenCredentialsUri=[
        MetaModel.required(),
        MetaModel.description("The URI of the Token Request endpoint as defined in RFC5849 Section 2.3"),
        MetaModel.valueDescription("FixedUriString")
    ]

    signatures: string[]
    $signatures=[
        MetaModel.oneOf(["HMAC-SHA1","RSA-SHA1","PLAINTEXT"]),
        MetaModel.hide()
    ]

    $displayName=[MetaModel.hide()]
    $description=[MetaModel.hide()]
    $annotations=[MetaModel.hide()]
    $authentificationConfigurator=[MetaModel.hide()]
}
export class OAuth2SecuritySchemeSettings extends  SecuritySchemeSettings{
    $=[]

    accessTokenUri:Sys.FixedUriString
    $accessTokenUri=[
        MetaModel.required(),
        MetaModel.description("The URI of the Token Endpoint as defined in RFC6749 [RFC6748] Section 3.2. Not required forby implicit grant type."),
        MetaModel.valueDescription("FixedUriString")
    ]

    authorizationUri:Sys.FixedUriString
    $authorizationUri=[
        MetaModel.required(),
        MetaModel.description("The URI of the Authorization Endpoint as defined in RFC6749 [RFC6748] Section 3.1. Required forby authorization_code and implicit grant types."),
        MetaModel.valueDescription("FixedUriString")
    ]

    authorizationGrants:string[]
    $authorizationGrants=[MetaModel.required(),MetaModel.markdownDescription("A list of the Authorization grants supported by the API as defined in RFC6749 [RFC6749] Sections 4.1, 4.2, 4.3 and 4.4, can be any of:<br>* authorization_code<br>* password<br>* client_credentials<br>* implicit<br>* refresh_token.")]

    scopes:string[]
    $scopes=[MetaModel.description("A list of scopes supported by the security scheme as defined in RFC6749 [RFC6749] Section 3.3")]

    $displayName=[MetaModel.hide()]
    $description=[MetaModel.hide()]
    $annotations=[MetaModel.hide()]
    $authentificationConfigurator=[MetaModel.hide()]
}
export class PassThroughSecuritySchemeSettings extends  SecuritySchemeSettings{
    $=[]


    queryParameterName:string
    headerName:string

}




export class SecuritySchemeRef extends Sys.Reference<AbstractSecurityScheme>{

}

export class AbstractSecurityScheme extends Common.RAMLLanguageElement implements Sys.Referencable<AbstractSecurityScheme> {
    name:string
    $name=[MetaModel.key(),MetaModel.startFrom(""),MetaModel.hide()]

    type:string
    $type=[
        MetaModel.required(),
        MetaModel.oneOf(["OAuth 1.0","OAuth 2.0","Basic Authentication","DigestSecurityScheme Authentication","Pass Through","x-{other}"]),
        MetaModel.descriminatingProperty(),//FIXME (we need more clear connection with SecuritySchemeType)
        MetaModel.description("The securitySchemes property MUST be used to specify an API's security mechanisms, including the required settings and the authentication methods that the API supports. one authentication method is allowed if the API supports them."),
        MetaModel.valueDescription("string<br><br>The value MUST be one of<br>* OAuth 1.0,<br>* OAuth 2.0,<br>* BasicSecurityScheme Authentication<br>* DigestSecurityScheme Authentication<br>* Pass Through<br>* x-&lt;other&gt;")
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
class PassThroughSecurityScheme extends AbstractSecurityScheme{
    type="Pass Through"
    settings:PassThroughSecuritySchemeSettings

    $=[MetaModel.description("Declares globally referable security schema definition"),MetaModel.actuallyExports("$self"),MetaModel.referenceIs("settings")]

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
export class MethodBase extends Params.HasNormalParameters{

    responses:Bodies.Response[]
    $responses=[
        MetaModel.setsContextValue("response","true"),
        MetaModel.newInstanceName("New Response"),
        MetaModel.description("Information about the expected responses to a request"),
        MetaModel.valueDescription("An object whose keys are the HTTP status codes of the responses and whose values describe the responses.")
    ]

    body:models.TypeDeclaration[]
    $body=[MetaModel.newInstanceName("New Body"),MetaModel.description(`Some method verbs expect the resource to be sent as a request body. For example, to create a resource, the request must include the details of the resource to create.
Resources CAN have alternate representations. For example, an API might support both JSON and XML representations.
A method's body is defined in the body property as a hashmap, in which the key MUST be a valid media type.`)]

    protocols:string[]
    $protocols=[MetaModel.oneOf(["HTTP","HTTPS"]),
        //MetaModel.issue("Not clear how it should work in combination with baseUri also is it also related to resources and types/traits"),MetaModel.needsClarification("Actually it is a set"),
        MetaModel.description("A method can override the protocols specified in the resource or at the API root, by employing this property."),
        MetaModel.valueDescription("array of strings of value HTTP or HTTPS, or a single string of such kind, case-insensitive")
    ]


    is:TraitRef[]
    securedBy:SecuritySchemeRef[]
    $securedBy=[
        MetaModel.allowNull(),
        MetaModel.description(` securityScheme may also be applied to a resource by using the securedBy key, which is equivalent to applying the securityScheme to all methods that may be declared, explicitly or implicitly, by defining the resourceTypes or traits property for that resource.
To indicate that the method may be called without applying any securityScheme, the method may be annotated with the null securityScheme.`)]
    $is=[MetaModel.description("Instantiation of applyed traits")]
}
export class Trait extends MethodBase implements Sys.DeclaresDynamicType<Trait>{
    name:string
    usage:string
    $name=[MetaModel.key(),MetaModel.description("Name of the trait")]

    $=[MetaModel.inlinedTemplates(),MetaModel.allowQuestion()]

    uses:api.Library[];
    $uses=[
        MetaModel.embeddedInMaps(),
        MetaModel.description("You may import library locally here it contents is accessible only inside of this trait"),
        MetaModel.setsContextValue("decls","true"),
        MetaModel.valueDescription("An array of libraries or a single library")
    ]
}
export class ResourceBase extends Common.RAMLLanguageElement{
    methods:Method[];


    //FIXME
    $methods=[
        MetaModel.description("Methods that are part of this resource type definition"),
        //MetaModel.issue("definition system did not represents that ? is allowed after method names here"),
        MetaModel.markdownDescription("The methods available on this resource. See [[raml-10-spec-methods|the section on method properties]]."),
        MetaModel.documentationTableLabel("get?<br>patch?<br>put?<br>post?<br>delete?<br>options?<br>head?"),
        MetaModel.valueDescription("Object describing the method")
    ]

    is:TraitRef[]
    $is=[
        MetaModel.description("A list of the traits to apply to all methods declared (implicitly or explicitly) for this resource. See [[raml-10-spec-applying-resource-types-and-traits|Applying Resource Types and Traits]] section. Individual methods may override this declaration"),
        //MetaModel.thisFeatureCovers("https://github.com/raml-org/raml-spec/issues/98")
        MetaModel.valueDescription("array, which can contain each of the following elements:<br>* name of unparametrized trait<br>* a key-value pair with trait name as key and a map of trait parameters as value<br>* inline trait declaration<br><br>(or a single element of any above kind)")
    ]

    type:ResourceTypeRef
    $type=[
        MetaModel.description("The resource type which this resource inherits. . See [[raml-10-spec-applying-resource-types-and-traits|Applying Resource Types and Traits]] section."),
        //MetaModel.thisFeatureCovers("https://github.com/raml-org/raml-spec/issues/98"),
        MetaModel.valueDescription("one of the following elements:<br>* name of unparametrized resource type<br>* a key-value pair with resource type name as key and a map of its parameters as value<br>* inline resource type declaration")
    ]

    //TODO FIXME
    securedBy:SecuritySchemeRef[]
    $securedBy=[
        MetaModel.allowNull(),
        MetaModel.description("The security schemes that apply to all methods declared (implicitly or explicitly) for this resource."),
        MetaModel.valueDescription("array of security scheme names or a single security scheme name")
    ]


    uriParameters:models.TypeDeclaration[]
    $uriParameters=[
        //MetaModel.issue("https://github.com/raml-org/raml-spec/issues/71"),
        MetaModel.setsContextValue("location",models.ModelLocation.URI),
        MetaModel.setsContextValue("locationKind",models.LocationKind.APISTRUCTURE),
        MetaModel.setsContextValue("fieldOrParam",true),
        MetaModel.description("Detailed information about any URI parameters of this resource"),
        MetaModel.valueDescription("object whose property names are the URI parameter names and whose values describe the values")
    ]

}
export class ResourceType extends ResourceBase implements Sys.DeclaresDynamicType<ResourceType>{
    name:string
    $name=[MetaModel.key(),MetaModel.description("Name of the resource type")]
    usage:string
    $=[MetaModel.inlinedTemplates(),MetaModel.allowQuestion()]

    uses:api.Library[];
    $uses=[
        MetaModel.embeddedInMaps(),
        MetaModel.description("You may import library locally here it contents is accessible only inside of this resource type"),
        MetaModel.setsContextValue("decls","true"),
        MetaModel.valueDescription("An array of libraries")
    ]
}

export class ResourceTypeOrTrait{

    usage:string
    $usage=[
        MetaModel.description("Instructions on how and when to use this resource type in a RAML spec"),
        MetaModel.valueDescription("Markdown string")
    ]

    uses:api.Library[];
    $uses=[
        MetaModel.embeddedInMaps(),
        MetaModel.description("You may import library locally here it contents is accessible only inside of this trait"),
        MetaModel.valueDescription("An array of libraries")
    ]

    parameters:string[]
    $parameters=[
        MetaModel.description("Optional declaration of the parameters that the resource type employs."),
        MetaModel.valueDescription("An object whose property names are the parameter names and whose property values describe the parameter data types.")
    ]
}


export class Method extends MethodBase{




    method:string;
    $method=[MetaModel.key(),
        MetaModel.extraMetaKey("methods"),
        MetaModel.oneOf(["get","put","post","delete","options","head","patch"]),
        MetaModel.description("Method that can be called"),
        //MetaModel.issue("https://github.com/raml-org/raml-spec/issues/95")
        MetaModel.hide()
    ]

    $displayName=[MetaModel.description("An alternate, human-friendly name for the method (in the resource's context).")]

    $description=[
        MetaModel.description("A longer, human-friendly description of the method (in the resource's context)"),
        MetaModel.valueDescription("Markdown string")
    ]

    $queryString=[
        MetaModel.description("Specifies the query string needed by this method. Mutually exclusive with queryParameters."),
        MetaModel.valueDescription("Type name or type declaration")
    ]

    $queryParameters=[
        MetaModel.description("Detailed information about any query parameters needed by this method. Mutually exclusive with queryString."),
        MetaModel.valueDescription("Object whose property names are the query parameter names and whose values describe the values.")
    ]

    $headers=[
        MetaModel.description("Detailed information about any request headers needed by this method."),
        MetaModel.valueDescription("Object whose property names are the request header names and whose values describe the values.")
    ]

    $body=[
        MetaModel.description("Some methods admit request bodies, which are described by this property."),
        MetaModel.valueDescription("Object whose properties are either<br>1) media types and whose values are type objects describing the request body for that media type, or<br>2) a type object describing the request body for the default media type specified in the root mediaType property")
    ]

    $is=[
        MetaModel.description("A list of the traits to apply to this method. See [[raml-10-spec-applying-resource-types-and-traits|Applying Resource Types and Traits]] section."),
        MetaModel.valueDescription("array, which can contain each of the following elements:<br>* name of unparametrized trait<br>* a key-value pair with trait name as key and a map of trait parameters as value<br>* inline trait declaration<br><br>(or a single element of any above kind)")
    ]

    $annotations=[
        MetaModel.markdownDescription("Annotations to be applied to this method. Annotations are any property whose key begins with \"(\" and ends with \")\" and whose name (the part between the beginning and ending parentheses) is a declared annotation name. See the [[raml-10-spec-annotations|section on annotations]].")
    ]

    $securedBy=[
        MetaModel.description("The security schemes that apply to this method"),
        MetaModel.valueDescription("Array of security scheme names or a  single security scheme name")
    ]
}

export class Resource extends ResourceBase{

    relativeUri:Sys.RelativeUriString
    $relativeUri=[MetaModel.key(),
        //MetaModel.issue("https://github.com/raml-org/raml-spec/issues/73"),
        MetaModel.startFrom("/"),
        MetaModel.description("Relative URL of this resource from the parent resource"),
        //MetaModel.issue("https://github.com/raml-org/raml-spec/issues/87")
        MetaModel.hide()
    ]
    resources:Resource[];
    $resources=[
        MetaModel.newInstanceName("New Resource"),
        MetaModel.description("A nested resource is identified as any property whose name begins with a slash (\"/\") and is therefore treated as a relative URI."),
        MetaModel.documentationTableLabel("/&lt;relativeUri&gt;"),
        MetaModel.valueDescription("object describing the nested resource")
    ]

    $displayName=[MetaModel.description("An alternate, human-friendly name for the resource.")]

    $description=[
        MetaModel.description("A longer, human-friendly description of the resource."),
        MetaModel.valueDescription("Markdown string")
    ]

    $annotations=[
        MetaModel.markdownDescription("Annotations to be applied to this resource. Annotations are any property whose key begins with \"(\" and ends with \")\" and whose name (the part between the beginning and ending parentheses) is a declared annotation name. See the [[raml-10-spec-annotations|section on annotations]].")
    ]

}
||||||| merged common ancestors
=======
import  MetaModel = require("../definition-system/metamodel")
import  Sys = require("./systemTypes")
import  Params=require("./parameters")
import  Bodies=require("./bodies")
import  Common=require("./common")
import  Declarations=require("./declarations")
import models=require("./datamodel")
import  auth=require("./auth")
import  api=require("./api")
///////////////////////////////////////////////////////////
//Resources  methods and Api, demonstrate setting context values a bit

export class ResourceTypeRef extends Sys.Reference<ResourceType>{

}

export class TraitRef extends Sys.Reference<Trait>{

}
export class SecuritySchemePart extends MethodBase {

    //$=[MetaModel.issue("Specification is actually very vague here")]

    $headers=[
        MetaModel.markdownDescription("Optional array of headers, documenting the possible headers that could be accepted. See [[raml-10-spec-headers|Headers]] section."),
        MetaModel.valueDescription("Object whose property names are the request header names and whose values describe the values.")
    ]

    $queryParameters=[
        MetaModel.markdownDescription("Query parameters, used by the schema in order to authorize the request. Mutually exclusive with queryString. See [[raml-10-spec-query-parameters-in-a-query-string|Query Parameters]] section."),
        MetaModel.valueDescription("Object whose property names are the query parameter names and whose values describe the values.")
    ]

    $queryString=[
        MetaModel.description("Specifies the query string, used by the schema in order to authorize the request. Mutually exclusive with queryParameters."),
        MetaModel.valueDescription("Type name or type declaration")
    ]

    $responses=[
        MetaModel.description("Optional array of responses, describing the possible responses that could be sent. See [[raml-10-spec-responses|Responses]] section.")
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



//export class SecuritySchemeType extends Common.RAMLLanguageElement{
//
//    requiredSettings:models.TypeDeclaration[];
//    $requiredSettings=[MetaModel.description("You may declare settings needed to use this type of security security schemas"),
//        MetaModel.setsContextValue("locationKind",models.LocationKind.DECLARATIONS),
//        MetaModel.declaringFields()]
//
//    describedBy:SecuritySchemePart;
//    $describedBy=[MetaModel.description(`The describedBy attribute MAY be used to apply a trait-like structure to a security scheme mechanism so as to extend the mechanism, such as specifying response codes, HTTP headers or custom documentation.
//        This extension allows API designers to describe security schemes. As a best practice, even for standard security schemes, API designers SHOULD describe the security schemes' required artifacts, such as headers, URI parameters, and so on. Including the security schemes' description completes an API's documentation.`)]
//
//    $=[MetaModel.declaresSubTypeOf("SecuritySchemeSettings"),MetaModel.description("Security schema type allows you to contribute your own security schema type with settings and optinal configurator for " +
//    "plugging into client sdks auth mechanism")]
//}

export class SecuritySchemeSettings {

    $=[MetaModel.allowAny()]

}
export class OAuth1SecuritySchemeSettings extends  SecuritySchemeSettings{
    $=[MetaModel.allowAny(), MetaModel.functionalDescriminator("$parent.type=='OAuth 1.0'")]

    requestTokenUri:Sys.FixedUriString
    $requestTokenUri=[
        MetaModel.required(),
        MetaModel.description("The URI of the Temporary Credential Request endpoint as defined in RFC5849 Section 2.1"),
        MetaModel.valueDescription("FixedUriString")
    ]

    authorizationUri:Sys.FixedUriString
    $authorizationUri=[
        MetaModel.required(),
        MetaModel.description("The URI of the Resource Owner Authorization endpoint as defined in RFC5849 Section 2.2"),
        MetaModel.valueDescription("FixedUriString")
    ]

    tokenCredentialsUri:Sys.FixedUriString
    $tokenCredentialsUri=[
        MetaModel.required(),
        MetaModel.description("The URI of the Token Request endpoint as defined in RFC5849 Section 2.3"),
        MetaModel.valueDescription("FixedUriString")
    ]

    signatures: string[]
    $signatures=[
        MetaModel.oneOf(["HMAC-SHA1","RSA-SHA1","PLAINTEXT"]),
        MetaModel.hide()
    ]
}
export class OAuth2SecuritySchemeSettings extends  SecuritySchemeSettings{
    $=[MetaModel.allowAny()]

    accessTokenUri:Sys.FixedUriString
    $accessTokenUri=[
        MetaModel.required(),
        MetaModel.description("The URI of the Token Endpoint as defined in RFC6749 [RFC6748] Section 3.2. Not required forby implicit grant type."),
        MetaModel.valueDescription("FixedUriString")
    ]

    authorizationUri:Sys.FixedUriString
    $authorizationUri=[
        MetaModel.required(),
        MetaModel.description("The URI of the Authorization Endpoint as defined in RFC6749 [RFC6748] Section 3.1. Required forby authorization_code and implicit grant types."),
        MetaModel.valueDescription("FixedUriString")
    ]

    authorizationGrants:string[]
    $authorizationGrants=[MetaModel.required(),MetaModel.markdownDescription("A list of the Authorization grants supported by the API as defined in RFC6749 [RFC6749] Sections 4.1, 4.2, 4.3 and 4.4, can be any of:<br>* authorization_code<br>* password<br>* client_credentials<br>* implicit<br>* refresh_token.")]

    scopes:string[]
    $scopes=[MetaModel.description("A list of scopes supported by the security scheme as defined in RFC6749 [RFC6749] Section 3.3")]

}
export class PassThroughSecuritySchemeSettings extends  SecuritySchemeSettings{
    $=[MetaModel.allowAny()]


    queryParameterName:string
    headerName:string

}




export class SecuritySchemeRef extends Sys.Reference<AbstractSecurityScheme>{

}

export class AbstractSecurityScheme extends Common.RAMLLanguageElement implements Sys.Referencable<AbstractSecurityScheme> {
    name:string
    $name=[MetaModel.key(),MetaModel.startFrom(""),MetaModel.hide()]

    type:string
    $type=[
        MetaModel.required(),
        MetaModel.oneOf(["OAuth 1.0","OAuth 2.0","Basic Authentication","DigestSecurityScheme Authentication","Pass Through","x-{other}"]),
        MetaModel.descriminatingProperty(),//FIXME (we need more clear connection with SecuritySchemeType)
        MetaModel.description("The securitySchemes property MUST be used to specify an API's security mechanisms, including the required settings and the authentication methods that the API supports. one authentication method is allowed if the API supports them."),
        MetaModel.valueDescription("string<br><br>The value MUST be one of<br>* OAuth 1.0,<br>* OAuth 2.0,<br>* BasicSecurityScheme Authentication<br>* DigestSecurityScheme Authentication<br>* Pass Through<br>* x-&lt;other&gt;")
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
class PassThroughSecurityScheme extends AbstractSecurityScheme{
    type="Pass Through"
    settings:PassThroughSecuritySchemeSettings

    $=[MetaModel.description("Declares globally referable security schema definition"),MetaModel.actuallyExports("$self"),MetaModel.referenceIs("settings")]

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
export class MethodBase extends Params.HasNormalParameters{

    responses:Bodies.Response[]
    $responses=[
        MetaModel.setsContextValue("response","true"),
        MetaModel.newInstanceName("New Response"),
        MetaModel.description("Information about the expected responses to a request"),
        MetaModel.valueDescription("An object whose keys are the HTTP status codes of the responses and whose values describe the responses.")
    ]

    body:models.TypeDeclaration[]
    $body=[MetaModel.newInstanceName("New Body"),MetaModel.description(`Some method verbs expect the resource to be sent as a request body. For example, to create a resource, the request must include the details of the resource to create.
Resources CAN have alternate representations. For example, an API might support both JSON and XML representations.
A method's body is defined in the body property as a hashmap, in which the key MUST be a valid media type.`)]

    protocols:string[]
    $protocols=[MetaModel.oneOf(["HTTP","HTTPS"]),
        //MetaModel.issue("Not clear how it should work in combination with baseUri also is it also related to resources and types/traits"),MetaModel.needsClarification("Actually it is a set"),
        MetaModel.description("A method can override the protocols specified in the resource or at the API root, by employing this property."),
        MetaModel.valueDescription("array of strings of value HTTP or HTTPS, or a single string of such kind, case-insensitive")
    ]


    is:TraitRef[]
    securedBy:SecuritySchemeRef[]
    $securedBy=[
        MetaModel.allowNull(),
        MetaModel.description(` securityScheme may also be applied to a resource by using the securedBy key, which is equivalent to applying the securityScheme to all methods that may be declared, explicitly or implicitly, by defining the resourceTypes or traits property for that resource.
To indicate that the method may be called without applying any securityScheme, the method may be annotated with the null securityScheme.`)]
    $is=[MetaModel.description("Instantiation of applyed traits")]
}
export class Trait extends MethodBase implements Sys.DeclaresDynamicType<Trait>{
    name:string
    usage:string
    $name=[MetaModel.key(),MetaModel.description("Name of the trait")]

    $=[MetaModel.inlinedTemplates(),MetaModel.allowQuestion()]

    uses:api.Library[];
    $uses=[
        MetaModel.embeddedInMaps(),
        MetaModel.description("You may import library locally here it contents is accessible only inside of this trait"),
        MetaModel.setsContextValue("decls","true"),
        MetaModel.valueDescription("An array of libraries or a single library")
    ]
}
export class ResourceBase extends Common.RAMLLanguageElement{
    methods:Method[];


    //FIXME
    $methods=[
        MetaModel.description("Methods that are part of this resource type definition"),
        //MetaModel.issue("definition system did not represents that ? is allowed after method names here"),
        MetaModel.markdownDescription("The methods available on this resource. See [[raml-10-spec-methods|the section on method properties]]."),
        MetaModel.documentationTableLabel("get?<br>patch?<br>put?<br>post?<br>delete?<br>options?<br>head?"),
        MetaModel.valueDescription("Object describing the method")
    ]

    is:TraitRef[]
    $is=[
        MetaModel.description("A list of the traits to apply to all methods declared (implicitly or explicitly) for this resource. See [[raml-10-spec-applying-resource-types-and-traits|Applying Resource Types and Traits]] section. Individual methods may override this declaration"),
        //MetaModel.thisFeatureCovers("https://github.com/raml-org/raml-spec/issues/98")
        MetaModel.valueDescription("array, which can contain each of the following elements:<br>* name of unparametrized trait<br>* a key-value pair with trait name as key and a map of trait parameters as value<br>* inline trait declaration<br><br>(or a single element of any above kind)")
    ]

    type:ResourceTypeRef
    $type=[
        MetaModel.description("The resource type which this resource inherits. . See [[raml-10-spec-applying-resource-types-and-traits|Applying Resource Types and Traits]] section."),
        //MetaModel.thisFeatureCovers("https://github.com/raml-org/raml-spec/issues/98"),
        MetaModel.valueDescription("one of the following elements:<br>* name of unparametrized resource type<br>* a key-value pair with resource type name as key and a map of its parameters as value<br>* inline resource type declaration")
    ]

    //TODO FIXME
    securedBy:SecuritySchemeRef[]
    $securedBy=[
        MetaModel.allowNull(),
        MetaModel.description("The security schemes that apply to all methods declared (implicitly or explicitly) for this resource."),
        MetaModel.valueDescription("array of security scheme names or a single security scheme name")
    ]


    uriParameters:models.TypeDeclaration[]
    $uriParameters=[
        //MetaModel.issue("https://github.com/raml-org/raml-spec/issues/71"),
        MetaModel.setsContextValue("location",models.ModelLocation.URI),
        MetaModel.setsContextValue("locationKind",models.LocationKind.APISTRUCTURE),
        MetaModel.setsContextValue("fieldOrParam",true),
        MetaModel.description("Detailed information about any URI parameters of this resource"),
        MetaModel.valueDescription("object whose property names are the URI parameter names and whose values describe the values")
    ]

}
export class ResourceType extends ResourceBase implements Sys.DeclaresDynamicType<ResourceType>{
    name:string
    $name=[MetaModel.key(),MetaModel.description("Name of the resource type")]
    usage:string
    $=[MetaModel.inlinedTemplates(),MetaModel.allowQuestion()]

    uses:api.Library[];
    $uses=[
        MetaModel.embeddedInMaps(),
        MetaModel.description("You may import library locally here it contents is accessible only inside of this resource type"),
        MetaModel.setsContextValue("decls","true"),
        MetaModel.valueDescription("An array of libraries")
    ]
}

export class ResourceTypeOrTrait{

    usage:string
    $usage=[
        MetaModel.description("Instructions on how and when to use this resource type in a RAML spec"),
        MetaModel.valueDescription("Markdown string")
    ]

    uses:api.Library[];
    $uses=[
        MetaModel.embeddedInMaps(),
        MetaModel.description("You may import library locally here it contents is accessible only inside of this trait"),
        MetaModel.valueDescription("An array of libraries")
    ]

    parameters:string[]
    $parameters=[
        MetaModel.description("Optional declaration of the parameters that the resource type employs."),
        MetaModel.valueDescription("An object whose property names are the parameter names and whose property values describe the parameter data types.")
    ]
}


export class Method extends MethodBase{




    method:string;
    $method=[MetaModel.key(),
        MetaModel.extraMetaKey("methods"),
        MetaModel.oneOf(["get","put","post","delete","options","head","patch"]),
        MetaModel.description("Method that can be called"),
        //MetaModel.issue("https://github.com/raml-org/raml-spec/issues/95")
        MetaModel.hide()
    ]

    $displayName=[MetaModel.description("An alternate, human-friendly name for the method (in the resource's context).")]

    $description=[
        MetaModel.description("A longer, human-friendly description of the method (in the resource's context)"),
        MetaModel.valueDescription("Markdown string")
    ]

    $queryString=[
        MetaModel.description("Specifies the query string needed by this method. Mutually exclusive with queryParameters."),
        MetaModel.valueDescription("Type name or type declaration")
    ]

    $queryParameters=[
        MetaModel.description("Detailed information about any query parameters needed by this method. Mutually exclusive with queryString."),
        MetaModel.valueDescription("Object whose property names are the query parameter names and whose values describe the values.")
    ]

    $headers=[
        MetaModel.description("Detailed information about any request headers needed by this method."),
        MetaModel.valueDescription("Object whose property names are the request header names and whose values describe the values.")
    ]

    $body=[
        MetaModel.description("Some methods admit request bodies, which are described by this property."),
        MetaModel.valueDescription("Object whose properties are either<br>1) media types and whose values are type objects describing the request body for that media type, or<br>2) a type object describing the request body for the default media type specified in the root mediaType property")
    ]

    $is=[
        MetaModel.description("A list of the traits to apply to this method. See [[raml-10-spec-applying-resource-types-and-traits|Applying Resource Types and Traits]] section."),
        MetaModel.valueDescription("array, which can contain each of the following elements:<br>* name of unparametrized trait<br>* a key-value pair with trait name as key and a map of trait parameters as value<br>* inline trait declaration<br><br>(or a single element of any above kind)")
    ]

    $annotations=[
        MetaModel.markdownDescription("Annotations to be applied to this method. Annotations are any property whose key begins with \"(\" and ends with \")\" and whose name (the part between the beginning and ending parentheses) is a declared annotation name. See the [[raml-10-spec-annotations|section on annotations]].")
    ]

    $securedBy=[
        MetaModel.description("The security schemes that apply to this method"),
        MetaModel.valueDescription("Array of security scheme names or a  single security scheme name")
    ]
}

export class Resource extends ResourceBase{

    relativeUri:Sys.RelativeUriString
    $relativeUri=[MetaModel.key(),
        //MetaModel.issue("https://github.com/raml-org/raml-spec/issues/73"),
        MetaModel.startFrom("/"),
        MetaModel.description("Relative URL of this resource from the parent resource"),
        //MetaModel.issue("https://github.com/raml-org/raml-spec/issues/87")
        MetaModel.hide()
    ]
    resources:Resource[];
    $resources=[
        MetaModel.newInstanceName("New Resource"),
        MetaModel.description("A nested resource is identified as any property whose name begins with a slash (\"/\") and is therefore treated as a relative URI."),
        MetaModel.documentationTableLabel("/&lt;relativeUri&gt;"),
        MetaModel.valueDescription("object describing the nested resource")
    ]

    $displayName=[MetaModel.description("An alternate, human-friendly name for the resource.")]

    $description=[
        MetaModel.description("A longer, human-friendly description of the resource."),
        MetaModel.valueDescription("Markdown string")
    ]

    $annotations=[
        MetaModel.markdownDescription("Annotations to be applied to this resource. Annotations are any property whose key begins with \"(\" and ends with \")\" and whose name (the part between the beginning and ending parentheses) is a declared annotation name. See the [[raml-10-spec-annotations|section on annotations]].")
    ]

}
>>>>>>> refs/remotes/mulesoft/master
