import KnowYourHttpWell = require('know-your-http-well')
import Opt = require('../../Opt')
import extend = require('xtend')

export function getStatusCode (code: string): Opt<KnowYourHttpWell.StatusCode> {
  for (var i = 0; i < KnowYourHttpWell.statusCodes.length; i++) {
    var statusCode = KnowYourHttpWell.statusCodes[i]

    if (statusCode.code === code) {
      return new Opt(sanitize(statusCode))
    }
  }

  return new Opt<KnowYourHttpWell.StatusCode>()
}

export function getHeader (name: string): Opt<KnowYourHttpWell.Header> {
  for (var i = 0; i < KnowYourHttpWell.headers.length; i++) {
    var header = KnowYourHttpWell.headers[i]

    if (header.header.toLowerCase() === name.toLowerCase()) {
      return new Opt(sanitize(header))
    }
  }

  return new Opt<KnowYourHttpWell.Header>()
}

export function getMethod (verb: string): Opt<KnowYourHttpWell.Method> {
  for (var i = 0; i < KnowYourHttpWell.methods.length; i++) {
    var method = KnowYourHttpWell.methods[i]

    if (method.method.toLowerCase() === verb.toLowerCase()) {
      return new Opt(sanitize(method))
    }
  }

  return new Opt<KnowYourHttpWell.Method>()
}

function sanitize (data: any): any {
  if (typeof data.description === 'string') {
    return extend(data, { description: data.description.replace(/^"|"$/g, '') })
  }

  return data
}
