import http = require('http')
import url = require('url')
import extend = require('xtend')
import ClientOAuth2 = require('client-oauth2')
import RamlWrapper = require('../../Raml08Wrapper')
import UI=require("atom-ui-lib")

/**
 * Port number to run the authentication server against.
 */
var PORT = 5623

/**
 * Authenticate using BasicSecurityScheme Authentication.
 */
function authenticateBasicAuthentication (scheme: RamlWrapper.SecuritySchemaDef) {
  return prompt({
    username: {
      name: 'Username',
      required: true
    },
    password: {
      name: 'Password',
      required: true
    }
  },{title:apiTitle(scheme)})
    .then(function (user) {
      return { user }
    })
}
function apiTitle(scheme:RamlWrapper.SecuritySchemaDef){
  return scheme.api().title().getOrElse("Unnamed API")
}
/**
 * Authenticate using OAuth 2.0.
 */
function legacyAuthenticateOAuth2 (scheme: RamlWrapper.SecuritySchemaDef) {
  var settings = <any> scheme.settings()
  var grants = settings.authorizationGrants || []
  var redirectUri = 'http://localhost:' + PORT

  // Prompt for the initial set up credentials.
  var promise = prompt({
    clientId: {
      name: 'Client ID',
      required: true
    },
    clientSecret: {
      name: 'Client Secret',
      required: grants.indexOf('token') === -1
    }
  }, {
    title:apiTitle(scheme),
    description: `Make sure you have registered for API keys and the redirect uri is "${redirectUri}".`
  })
    .then(function (opts) {
      return new ClientOAuth2(<any> extend(settings, opts, { redirectUri }))
    })

  // Handle client credentials grant.
  // https://github.com/mulesoft/js-client-oauth2#client-credentials-grant
  if (grants.indexOf('credentials') > -1) {
    return promise
      .then(function (client) {
        return client.credentials.getToken()
      })
  }

  // Handle owner credentials grant.
  // https://github.com/mulesoft/js-client-oauth2#resource-owner-password-credentials-grant
  if (grants.indexOf('owner') > -1) {
    var title=scheme.api().title().getOrElse("Unnamed API")
    return promise
      .then(function (client) {
        return prompt({
          username: {
            name: 'Username',
            required: true
          },
          password: {
            name: 'Password',
            required: true
          }
        },{title:apiTitle(scheme)})
          .then(function (res) {
            return client.owner.getToken(res.username, res.password)
          })
      })
  }

  // Handle implicit or code auth.
  // https://github.com/mulesoft/js-client-oauth2#implicit-grant
  // https://github.com/mulesoft/js-client-oauth2#authorization-code-grant
  var flow = grants.indexOf('token') > -1 ? 'token' : 'code'

  // Handle the default flow as code.
  return promise
    .then(function (client) {
      return server(client[flow].getUri())
        .then(function (uri) {
          return client[flow].getToken(uri)
        })
    })
}

/**
 * Sanitize the OAuth2 user instance into plain objects.
 */
function sanitizeOAuth2User (user: any) {
  return {
    options: {
      clientId: user.client.options.clientId,
      clientSecret: user.client.options.clientSecret
    },
    user: {
      accessToken: user.accessToken,
      expires: user.expires && user.expires.getTime(),
      refreshToken: user.refreshToken,
      tokenType: user.tokenType
    }
  }
}

/**
 * Wrap OAuth 2 flow to convert the token instance into a plain object.
 */
function authenticateOAuth2 (scheme: RamlWrapper.SecuritySchemaDef) {
  return legacyAuthenticateOAuth2(scheme).then(sanitizeOAuth2User)
}

function authenticateCustomScheme (scheme: RamlWrapper.SecuritySchemaDef) {
  var parameters: Parameters = {}
  var describedBy = scheme.describedBy()

  Object.keys(describedBy).forEach(function (type) {
    Object.keys(describedBy[type]).forEach(function (key) {
      var param = describedBy[type][key]

      parameters[type + '.' + key] = {
        name: key + ` (${type})`,
        required: param.required,
        description: param.description
      }
    })
  })

  return prompt(parameters,{title:apiTitle(scheme)})
}

/**
 * Authenticate using the passed in security scheme.
 */
export function authenticate (scheme: RamlWrapper.SecuritySchemaDef) {
  var type = scheme.type().type().getOrElse(null)
  var method = SUPPORTED[type]

  if (!method) {
    return authenticateCustomScheme(scheme)
  }

  return method(scheme)
}

/**
 * Check whether the user credentials have expired.
 */
export function expired (scheme: RamlWrapper.SecuritySchemaDef, data: any): boolean {
  if (scheme.type().type().getOrElse(null) === 'OAuth 2.0') {
    return Date.now() > data.user.expires
  }

  return false
}


/**
 * Refresh user data.
 */
export function refresh (scheme: RamlWrapper.SecuritySchemaDef, data: any): Promise<any> {
  var user = data.user

  if (scheme.type().type().getOrElse(null) === 'OAuth 2.0') {
    return new ClientOAuth2(<any> extend(scheme.settings(), data.options))
      .createToken(user.accessToken, user.refreshToken, user.tokenType)
      .refresh()
      .then(sanitizeOAuth2User)
  }

  throw new TypeError('Unsupported security scheme')
}

/**
 * Override the name of query string parameters manually.
 *
 * TODO: Fix this in RAML, one day.
 */
var OAUTH2_QUERY_NAME_OVERRIDE = {
  'https://slack.com/oauth/authorize': 'token'
}

/**
 * Sign request information with the scheme data.
 */
export function sign (scheme: RamlWrapper.SecuritySchemaDef, data: any, request: har.Request) {
  var user = data.user
  var type = scheme.type().type().getOrElse(null)

  request.headers = request.headers || []
  request.queryString = request.queryString || []

  // https://github.com/mulesoft/js-client-oauth2/blob/master/client-oauth2.js#L399-L424
  if (type === 'OAuth 2.0') {
    var tokenName = OAUTH2_QUERY_NAME_OVERRIDE[scheme.settings()['authorizationUri']] || 'access_token'

    if (user.tokenType === 'bearer') {
      request.headers.push({
        name: 'Authorization',
        value: 'Bearer ' + user.accessToken
      })
    } else {
      request.url += (request.url.indexOf('?') > -1 ? '&' : '?') + `${tokenName}=${user.accessToken}`

      request.queryString.push({
        name: tokenName,
        value: user.accessToken
      })

      request.headers.push({
        name: 'Pragma',
        value: 'no-store'
      })

      request.headers.push({
        name: 'Cache-Control',
        value: 'no-store'
      })
    }
  } else if (type === 'Basic Authentication') {
    request.headers.push({
      name: 'Authorization',
      value: 'BasicSecurityScheme ' + btoa(user.username + ':' + user.password)
    })
  } else {
    Object.keys(data).forEach(function (key) {
      var index = key.indexOf('.')
      var type = key.substr(0, index)
      var name = key.substr(index + 1)
      var value = data[key]

      if (type === 'queryParameters') {
        request.url += (request.url.indexOf('?') > -1 ? '&' : '?') + `${name}=${value}`

        request.queryString.push({ name, value })
      } else if (type === 'headers') {
        request.headers.push({ name, value })
      } else {
        throw new TypeError('Unhandled custom type')
      }
    })
  }

  return request
}

/**
 * Map of supported authentication types.
 */
export var SUPPORTED = {
  'Basic Authentication': authenticateBasicAuthentication,
  'OAuth 2.0': authenticateOAuth2
}

/**
 * Accept parameter values for rendering the prompt.
 */
interface Parameters {
  [key: string]: {
    name: string
    type?: string
    required?: boolean
    value?: string
    description?: string
  }
}

/**
 * Some options to set up the user prompt.
 */
interface PromptOptions {
  description?: string
  title:string
}

/**
 * Prompt the user for parameters.
 */
function prompt (parameters: Parameters, options: PromptOptions):Promise<any> {
  if (Object.keys(parameters).length === 0) {
    return Promise.resolve({})
  }

  options = options || {title:""}
  var pnl=new UI.Panel();
  pnl.addChild(UI.h1("Authentication "+options.title));
  if (options.description){
    pnl.addChild(UI.label(options.description));
  }
  var ks:{ [name:string]:string}={}
  Object.keys(parameters).forEach((key) => {
    var vc=UI.vc();
    var parameter = parameters[key];
    var label=parameter.name;
    if (parameter.required){
      label+="*";
    }
    var value=parameter.value;
    if (!value){
      value=""
    }
    ks[key]=value;
    var fld=UI.texfField(label,value,x=>{
      ks[key]=fld.getBinding().get();
    });
    vc.addChild(fld);
    if (parameter.description){
      vc.addChild(UI.label(parameter.description));
    }
  })
  var btn=UI.buttonSimple("Submit",x=>{
    pane.destroy();
  });
  pnl.addChild(btn);
  pane = atom.workspace.addModalPanel({
    item: pnl.renderUI()
  });
  var pr= new Promise(function (resolve, reject) {
    var parentNode = pnl.ui().parentNode

    /**
     * Close the modal when clicking the background.
     */
    parentNode.addEventListener('click', function (e) {
      if (e.target === parentNode) {
        pane.destroy()

        return reject(new Error('Prompt aborted'))
      }
    })

    /**
     * Resolve the promise when submitted.
     */
    btn.addOnClickListener( function (e) {
      pane.destroy()

      var data = ks

      return resolve(data)
    })
  })
  var pane:AtomCore.IPane=null;

  return pr;
}

/**
 * Script to respond to the user on callback authentication. This is required
 * to extract the full URL from the user to support implicit authentication.
 */
var SERVER_CALLBACK_SCRIPT = `
<!doctype html>
<html>
  <head>
  </head>
  <body>
    <script>
      var xhr = new XMLHttpRequest()
      xhr.open('GET', '/handle?uri=' + encodeURIComponent(window.location.href))
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          window.close()
        }
      }
      xhr.send()
    </script>
  </body>
</html
`

/**
 * Create an authentication server instance. Everything must go through this
 * server because of the browser security model.
 */
function server (redirectUri: string) {
  return new Promise(function (resolve, reject) {
    var app = http.createServer(function (req, res) {
      var parsedUrl = url.parse(req.url, true)

      // Respond with the server callback script by default.
      if (parsedUrl.pathname === '/') {
        res.end(SERVER_CALLBACK_SCRIPT)
        req.connection.destroy()

        return
      }

      if (parsedUrl.pathname === '/redirect') {
        res.statusCode = 302
        res.setHeader('Location', redirectUri)
        res.end()
        req.connection.destroy()

        return
      }

      // Use a special endpoint to handle receiving the URL and resolving the
      // promise with the server URL callback.
      if (parsedUrl.pathname === '/handle') {
        res.end()
        req.connection.destroy()

        close(function (err) {
          if (err) {
            return reject(err)
          }

          // Return focus back to the application once the flow is complete.
          require('remote').getCurrentWindow().focus()

          return resolve(parsedUrl.query.uri)
        })
      }

      res.statusCode = 404
      res.end()
      req.connection.destroy()
    })

    function close (cb) {
      server.close(cb)
      clearTimeout(timeout)
    }

    // Start listening on the port number.
    var server = app.listen(PORT, function (err) {
      if (err) {
        return reject(err)
      }

      require('shell').openExternal(`http://localhost:${PORT}/redirect`)
    })

    // Timeout after 10 minutes.
    var timeout = setTimeout(close, 10 * 60 * 1000)
  })
}
