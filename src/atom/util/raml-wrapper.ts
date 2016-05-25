import qs = require('querystring')
import popsicle = require('popsicle')
import extend = require('xtend')
import RamlWrapper = require('../../Raml08Wrapper')

export function findResource (path: string, resource: RamlWrapper.Resource | RamlWrapper.Api) {
  var children = resource.resources()

  for (var i = 0; i < children.length; i++) {
    var child = children[i]
    var relativeUri = child.relativeUri()

    // Paths are identical, resource found.
    if (relativeUri === path) {
      return child
    }

    // Prefixes match, maybe exists on a child.
    if (path.substr(0, relativeUri.length) === relativeUri && path[relativeUri.length] === '/') {
      var nested = findResource(path.substr(relativeUri.length), child)

      if (nested) {
        return nested
      }
    }
  }
}

export function findMethod (verb: string, resource: RamlWrapper.Resource) {
  var methods = resource.methods()

  for (var i = 0; i < methods.length; i++) {
    var method = methods[i]

    if (method.method() === verb) {
      return method
    }
  }
}

interface ParameterMap {
  [name: string]: string
}

export interface RequestOptions {
  baseUri?: string
  queryParameters?: ParameterMap
  uriParameters?: ParameterMap
  baseUriParameters?: ParameterMap
  headers?: ParameterMap
  body?: string
}

export function request (method: RamlWrapper.Method, options: RequestOptions): har.Request {
  var api = method.api()
  var resource = method.resource()

  options = extend({
    queryParameters: {},
    uriParameters: {},
    headers: {},
    baseUriParameters: {}
  }, options)

  var baseUri = template(
    options.baseUri || api.baseUri().getOrElse(''),
    options.baseUriParameters,
    extractDefaultParameters(api.baseUriParameters())
  ).replace(/\/$/, '')

  var path = template(
    resource.absoluteUri(),
    options.uriParameters,
    extractDefaultParameters(resource.absoluteUriParameters())
  )

  var queryString = qs.stringify(options.queryParameters)

  return {
    url: baseUri + path + (queryString ? '?' + queryString : ''),
    method: method.method(),
    postData: {
      text: options.body
    },
    queryString: Object.keys(options.queryParameters).map(function (name) {
      return { name, value: options.queryParameters[name] }
    }),
    headers: Object.keys(options.headers).map(function (name) {
      return { name, value: options.headers[name] }
    })
  }
}

export function toPopsicleRequest (req: har.Request): popsicle.Options {
  var request = {
    url: req.url,
    method: req.method,
    body: req.postData && req.postData.text,
    parse: false,
    headers: <{ [name: string]: string }> {}
  }

  req.headers.forEach(function (header) {
    request.headers[header.name] = header.value
  })

  return request
}

export function fromPopsicleResponse (res: popsicle.Response): har.Response {
  var response = {
    status: res.status,
    headers: [],
    content: {
      text: res.body,
      mimeType: res.get('Content-Type')
    }
  }

  Object.keys(res.headers).forEach(function (key) {
    response.headers.push({
      name: res.name(key),
      value: res.get(key)
    })
  })

  return response
}

export function extractParameters (src: Object, params: RamlWrapper.Param[]): ParameterMap {
  var dest: ParameterMap = {}

  if (src) {
    params.forEach(function (param) {
      var key = param.name()

      if (src[key] != null) {
        dest[key] = src[key]
      }
    })
  }

  return dest
}

export function extractHeaders (src: Object, params: RamlWrapper.Param[]): ParameterMap {
  var dest: ParameterMap = {}

  if (src) {
    params.forEach(function (param) {
      var key = param.name().toLowerCase()

      if (key != 'content-type' && src[key] != null) {
        dest[key] = src[key]
      }
    })
  }

  return dest
}

export function extractDefaultParameters (params: RamlWrapper.Param[]): ParameterMap {
  var dest: ParameterMap = {}

  params.forEach(function (param) {
    var value = param.definitions()
      .reduce((value, def) => {
        return value ||
          def.default().getOrElse(undefined) ||
          def.enum().getOrElse(undefined)
      }, undefined)

    if (value != null) {
      dest[param.name()] = value
    }
  })

  return dest
}

export function template (str: string, replace: ParameterMap, defaults?: ParameterMap): string {
  return str.replace(/\{([^{}]+)\}/g, function (match, key) {
    if (replace && replace[key] != null) {
      return replace[key]
    }

    if (defaults && defaults[key] != null) {
      return defaults[key]
    }

    return ''
  })
}
