/// <reference path="../typings/main.d.ts" />
import util = require("./util/index");
import Opt = require("./Opt");
import _ = require("underscore");
import ramlPathMatch = require("./util/raml-path-match")
function opt<T>(v?:T) {
    return new Opt<T>(v)
}

export function wrap(api:Raml08Parser.Api):Api {
    return new Api(api)
}

/**
 * A layer on top of the output of the raml-js-parser
 * providing various convenience access methods and queries.
 *
 * - All nodes are represented by concrete instances of classes
 *   ( so we can use "instanceof" checks when visiting the tree )
 *
 * - The base class calls util.lazyprops, which will automatically
 *   transform all no-arg methods into lazy vals.
 *
 * - Values that may be null or undefined are wrapped as instances of the Opt class
 *    ( which is a simpler version of Scala's Option type )
 */

export class AbstractNode {
    constructor() {
        util.lazyprops(this, k => true)
    }

    allDirectChildren(): AbstractNode[] { return [] } // abstract
    visit( iter: ( node: AbstractNode ) => void ): void {
        iter( this )
        this.allDirectChildren().forEach( x => x.visit(iter) )
    }
    visitAndCollectInstancesOf<T>( c: { new( ...args: any[] ): T } ): T[] {
        var arr: T[] = []
        this.visit( n => util.ifInstanceOf( n, c, x => arr.push(x) ) )
        return arr;
    }
}

export class SchemaDef {
    constructor( private _name: string, private _content: string ){
    }
    name = (): string => this._name
    content = () : string => this._content
    wrapped = (): WrappedSchema => null // TODO
}

class WrappedSchema {}
class JSONSchema { }
class XSDSchema { }

export class Api extends AbstractNode {
    // NOTE: `data` should be private, but it's not because of legacy tools
    // utilizing the parsed data object. Maybe we can rewrite them one day.
    constructor(public data:Raml08Parser.Api) {
        super();
    }

    title    = (): Opt<string> => opt(this.data.title);
    version  = (): Opt<string> => opt(this.data.version);
    baseUri  = (): Opt<string> => opt(this.data.baseUri);

    baseUriParameters = (): Param[] => Param.build( ParamLocation.baseUri, this.data.baseUriParameters );
    uriParameters     = (): Param[] => Param.build( ParamLocation.uri, this.data.uriParameters );

    protocols         = () => ProtocolHelper.build(this.data.protocols);

    resources         = (): Resource[] => util.asArray<Raml08Parser.Resource>( this.data.resources ).map(x => new Resource(x, this))
    mediaType         = (): Opt<string> => opt(this.data.mediaType);
    schemas           = (): SchemaDef[] => {
        var schemaMap = util.flattenArrayOfObjects( this.data.schemas || [] )
        return util.toTuples( schemaMap ).map( x => new SchemaDef( x[0], x[1] ))
    }
    securitySchemas = (): SecuritySchemaDef[]=>{
        var schemaMap = util.flattenArrayOfObjects( this.data.securitySchemes || [] )
        return util.toTuples(schemaMap).map(x=>new SecuritySchemaDef(x[0],x[1],this))
    }

    documentation     = (): DocumentationItem[] => DocumentationItem.build( this.data.documentation );

    allDirectChildren(){ return [].concat( this.resources() )}

    /**
     * All resources declared in this API.
     * Do we normalize to also show intermediate resources?
     */
    allResources      = ( ): Resource[] => this.visitAndCollectInstancesOf( Resource )
    allMethods        = ( ): Method[]   => this.visitAndCollectInstancesOf( Method )
    // TODO: cache these things... obviously
    findResourceById  = ( id: RamlId ): Opt<Resource> => opt( _.find( this.allResources(), x => id.equals( x.id() ) ) )
    findMethodById    = ( id: RamlId ): Opt<Method>   => opt( _.find( this.allMethods(), x => id.equals( x.id() ) ) )

    findSchemaByName = ( name: string ): Opt<SchemaDef> => new Opt( _.find( this.schemas(), x => x.name() == name ) )
    findSchemaByContent = ( content: string ): Opt<SchemaDef> => new Opt( _.find( this.schemas(), x => x.content() == content ) )

    securedBy(): Array<Opt<string>> {
        if (!this.data.securedBy) {
            return []
        }

        return this.data.securedBy.map((securedBy) => {
            return opt(typeof securedBy === 'string' ? securedBy : securedBy && Object.keys(securedBy)[0])
        })
    }
}
export class SecuritySchemaType{
    type =():Opt<string>=>new Opt(this._data.type);


    constructor(private _data:Raml08Parser.SecurityScheme){

    }

    queryParameters = (): Param[] => Param.build( ParamLocation.query, this._data.describedBy ? this._data.describedBy.queryParameters : undefined )
    headers         = (): Param[] => Param.build( ParamLocation.header, this._data.describedBy ? this._data.describedBy.headers : undefined )
}
export class BasicSecuritySchemaType extends SecuritySchemaType{

    constructor(_data:Raml08Parser.SecurityScheme){
        super(_data)
    }
}

export class SecuritySchemaDef{

    constructor(private _name:string,private _data:Raml08Parser.SecurityScheme,private _api:Api) {}

    name =():string=>this._name;

    /**
     * todo different classes for various types
     */
    type =():SecuritySchemaType=>{
        if (this._data.type.trim()=="Basic Authentication"){
            return new BasicSecuritySchemaType(this._data)
        }
        return new SecuritySchemaType(this._data);
    }

    settings () {
        return this._data.settings || {}
    }

    describedBy () {
        return this._data.describedBy || {}
    }

    api(){
        return this._api
    }
}

export class DocumentationItem {
    constructor( private data: Raml08Parser.DocumentationItem ){ }
    title   = (): string => this.data.title
    content = (): MarkdownString => new MarkdownString( this.data.content )
    static build( items?: Raml08Parser.DocumentationItem[] ): DocumentationItem[]{
        return util.asArray<Raml08Parser.DocumentationItem>(items).map( x => new DocumentationItem( x ) )
    }
}
export class ParamValue{
    key:string
    value:any

    constructor(key:string, value:any) {
        this.key = key;
        this.value = value;
    }
}

export class Resource extends AbstractNode {
    constructor(private data:Raml08Parser.Resource, private _api:Api, private _parent?:Resource) {
        super();
    }

    id          = (): RamlId => new RamlId( this.completeRelativeUri() );
    api         = (): Api => this._api
    relativeUri = (): string => this.data.relativeUri;
    description = (): Opt<MarkdownString> => opt(this.data.description).map(x=>new MarkdownString((x)));
    parent      = (): Opt<Resource> => opt(this._parent);
    methods     = (): Method[] => (this.data.methods||[]).map(x => new Method(x, this));
    resources   = (): Resource[] => util.asArray<Raml08Parser.Resource>(this.data.resources).map( x => new Resource( x, this.api(), this ))

    resourceType (): Opt<string> {
        var type = this.data.type

        if (typeof type === 'string') {
            return new Opt(type)
        }

        return new Opt(type && Object.keys(type)[0])
    }

    allDirectChildren(){ return [].concat( this.methods(), this.resources() ) }
    uriParameters       = (): Param[] => _.sortBy(Param.build( ParamLocation.uri, this.data.uriParameters ), x => this.relativeUri().indexOf(x.name()))
    baseUriParameters       = (): Param[] => Param.build( ParamLocation.baseUri, this.data.baseUriParameters )

    // all the way down to the API node
    completeRelativeUri = () => this.parent().map( p => p.completeRelativeUri() ).getOrElse("") + this.relativeUri()

    matchUri = (apiRootRelativeUri: string): Opt<ParamValue[]>=> {
        var allParameters:Raml08Parser.NamedParameterMap = {}
        var resource:Resource = this
        while(true){
            var map = resource.data.uriParameters;
            if(map) {
                Object.keys(map).forEach(x=>allParameters[x] = map[x])
            }
            if(!resource.parent().isDefined()){
                break
            }
            resource = resource.parent().getOrThrow()
        }
        var result = ramlPathMatch(this.completeRelativeUri(), allParameters, {})(apiRootRelativeUri);
        if (result) {
            //TODO NICER TYPING
            return opt(Object.keys((<any>result).params).map(x=> {
                return new ParamValue(x, result['params'][x])
            }))
        }
        return Opt.empty<ParamValue[]>();
    }

    absoluteUri (): string {
        return this.parent().map(x => x.absoluteUri()).getOrElse('') + this.relativeUri()
    }

    absoluteUriParameters (): Param[] {
        return this.parent()
            .map(x => x.absoluteUriParameters())
            .getOrElse([])
            .concat(this.uriParameters())
    }

    segments = ():Resource[] =>{
        var result=[];
        var r:Resource=this;
        do {
            result.push(r);
            r = r.parent().getOrElse(null);
        } while(r)
        result = result.reverse();
        return result;
    }
}

export class RamlId {
    constructor( private _value: string ){
    }
    value = (): string => this._value;
    equals = ( other: RamlId ): boolean => this.value() === other.value()
}


export class Method extends AbstractNode {
    constructor( private data:Raml08Parser.Method, private _resource:Resource ) {
        super();
    }

    id = (): RamlId => new RamlId( this.resource().completeRelativeUri() + " " + this.method().toLowerCase() );

    api             = (): Api => this._resource.api();
    resource        = (): Resource => this._resource;

    method          = (): string => this.data.method;
    description     = (): Opt<MarkdownString> => opt(this.data.description).map( x => new MarkdownString(x) )
    protocols       = (): Protocol[] => ProtocolHelper.build(this.data.protocols)
    queryParameters = (): Param[] => Param.build( ParamLocation.query, this.data.queryParameters )
    headers         = (): Param[] => Param.build( ParamLocation.header, this.data.headers )
    responses       = (): Response[] => Object.keys( this.data.responses ||{}).map( statusCode => new Response(this, statusCode, this.data.responses[statusCode] ))
    bodies       = ():  Body[]=> Object.keys( this.data.body || {}  ).map(mtype =>new Body( this,mtype, this.data.body[mtype] ))

    //FIXME

    // TODO??
    // queryParametersConsolidated = (): Param[] => Param.build( ParamLocation.query, this.data.queryParameters )


    getConsolidatedParameterList = ( inherited: boolean = false ): Param[] => {
        return []
    }

    traits (): string[] {
        if (!this.data.is) {
            return []
        }

        return this.data.is.map((is) => {
            return typeof is === 'string' ? is : Object.keys(is)[0]
        })
    }

    securedBy(): Array<Opt<string>> {
        if (!this.data.securedBy) {
            return []
        }

        return this.data.securedBy.map((securedBy) => {
            return opt(typeof securedBy === 'string' ? securedBy : securedBy && Object.keys(securedBy)[0])
        })
    }


}

export class Response extends AbstractNode{
    constructor( private _method:Method,private _code: string, private _data?: Raml08Parser.Response ){
        super()
    }
    code = (): string => this._code
    // TODO
    //switch proxy/use proxy might also look ok, but I am not sure that they should be threated
    //as accepted here. another 3.. responses also need a look
    isOkRange = (): boolean => ( Number( this.code() ) < 300&&Number( this.code() )>=200 )


    bodies = ():Body[]=>Object.keys(this._data?(this._data.body||{}):{}).map(mtype =>new Body( this._method,mtype, this._data.body[mtype]))

}
export class Body extends AbstractNode{

    constructor(private _method:Method, private _mediaType: string, private _data?: Raml08Parser.BodyPayload){
        super();
        this._formData = <Raml08Parser.WebFormBodyPayload>this._data;
    }

    private _formData:Raml08Parser.WebFormBodyPayload

    mediaType():string{return this._mediaType;}
    example = ():Opt<string>=>opt(this._data && this._data.example)

    schema():Opt<SchemaDef>{
        if (this._data!=null) {
            if (this._data.schema) {
                var s = this._method.api().findSchemaByName(this._data.schema);
                if (s.isDefined()) {
                    return s;
                }
                s = this._method.api().findSchemaByContent(this._data.schema);
                if (s.isDefined()) {
                    return s;
                }
                var d = new SchemaDef(this._data.schema, this._data.schema);
                return opt(d);
                //this._data.
            }
        }
        return opt<SchemaDef>();
    }

    formParameters = (): Param[] => (this._formData && this._formData.formParameters) ? Param.build( ParamLocation.form, this._formData.formParameters ) : []

}

export class MarkdownString {
    constructor( private _value: string ){

    }
    value = (): string => this._value;
    // TODO: add methods to parse MD ( including internal RAML references / IDs )
}

export enum ParamLocation {
    query,
    form,
    uri,
    baseUri,
    header
}

export enum Protocol { HTTP, HTTPS }
module ProtocolHelper {
    var xxx = {
        "HTTP":  Protocol.HTTP,
        "HTTPS": Protocol.HTTPS
    }
    export function build( values?: Raml08Parser.Protocol[] ){
        return (values = values ? values : []).map( x => xxx[x.toUpperCase()] )
    }
}

export class Param extends AbstractNode {

    constructor( private _location: ParamLocation, private _name: string, public _data: Raml08Parser.NamedParameter[] ){
        super();
        //FIXME: Parameters are allowed to have no definition. In this case we fall down with exception.
        if ( this.definitions().length === 0 ) throw new Error("Parameter with no definitions")

    }

    name        = (): string           => this._name;
    location    = (): ParamLocation    => this._location;
    definitions = () : ParamDef<Raml08Parser.BasicNamedParameter>[] => this._data.map( p => ParamDef.build( this, p ) )

    required    = (): boolean => this.definitions().every( x => x.required() )

    // TODO: validate against all definitions
    validate = ( v : any ): boolean => false

    /**
     *
     * @param location
     * @param parameterMap If null or undefined we will return an empty Array
     * @returns {any}
     */

    static build( location: ParamLocation, parameterMap?: Raml08Parser.NamedParameterMap ): Param[] {
        return Object.keys( parameterMap || {}  ).map( name => new Param( location, name, util.asArray( parameterMap[name] ) ) )
    }

}



export class ParamDef<T extends Raml08Parser.BasicNamedParameter> {

    constructor( private _param: Param, /* protected */ public _data: T ){
    }

    param = (): Param => this._param;

    // we are falling back to string because we need to discriminate subclasses
    type     = (): string     => this._data.type || 'string'
    required = (): boolean    => this._data.required === true
    enum     = (): Opt<any[]> => opt<any[]>(this._data.enum)

    description (): Opt<MarkdownString> {
        return opt(this._data.description).map(x => new MarkdownString(x))
    }

    displayName (): string {
        return this._data.displayName
    }

    default (): Opt<any> {
        return opt(this._data.default)
    }

    example (): Opt<any> {
        return opt(this._data.example)
    }

    repeat (): boolean {
        return this._data.repeat === true
    }

    min (): Opt<number> {
        return opt((<Raml08Parser.NumericNamedParameter>this._data).minimum)
    }

    max (): Opt<number> {
        return opt((<Raml08Parser.NumericNamedParameter>this._data).maximum)
    }

    minLength(): Opt<number> {
        return opt((<Raml08Parser.StringNamedParameter>this._data).minLength)
    }

    maxLength(): Opt<number> {
        return opt((<Raml08Parser.StringNamedParameter>this._data).maxLength)
    }

    pattern(): Opt<string> {
        return opt((<Raml08Parser.StringNamedParameter>this._data).pattern)
    }

    static build( param: Param, data: Raml08Parser.NamedParameter ): ParamDef<Raml08Parser.BasicNamedParameter> {
        return new ParamDef( param, data )
    }

    static constructors = {
        "string":  ParamDef_string,
        "boolean": ParamDef_boolean,
        "integer": ParamDef_number,
        "number":  ParamDef_integer
    }

}

export class ParamDef_string extends ParamDef<Raml08Parser.StringNamedParameter> { }
export class ParamDef_boolean extends ParamDef<Raml08Parser.BasicNamedParameter> { }
export class ParamDef_number extends ParamDef<Raml08Parser.NumericNamedParameter> { }
export class ParamDef_integer extends ParamDef_number { }
