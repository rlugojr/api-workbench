#Batch Notebooks Conversion and Launching

##About
Batch convert and launch utility is the main tool for testing RamlScript and API specifications.

The `automation/automation.ts` script allows to perform batch conversion of JavaScript notebooks from the Portal to RamlScript notebooks and lunching the converted notebooks.

You may launch the utility by the `node automation/automation.js` from the project root or create the corresponding launch configuration in your IDE.

The automation steps are:
####Cloning the notebook configs [repository](https://github.com/KonstantinSviridov/notebook-configs)
The repository is cloned into `automation/input` subfolder. It provides following files for each API:

######`path.txt` 
The file contains path of the API GitHub repository

######`config.cfg`
The file contains values prompted by the JavaScript Portal notebook. The format is:
```
{prompt message 1}={value 1}
{prompt message 2}={value 2}
...
```
######`auth.cfg`
The file contains authorization parameters. The format is
```
{
  "{API title} {API version or 'V' if no version}{parameter name}":"{parameter value}",
  ...
}
```
######`generation.cfg`
The file contains options passed to generation config and is isomorphous with [`IConfig` instance](https://github.com/mulesoft-labs/api-workbench/blob/master/src/ramlscript/config.ts).

####Cloning the API repositories
The repositories are cloned into 'automation/input' subfolder. Each of `production` and `staging` branches is cloned to separate subfolder so that the subfolders structure reflects the `branch/API` hierarchy. After that all config files are copied from config repository to root API folders.

####Converting the notebooks
The converted notebooks are placed into `automation/output` subfolder. The subfolders structure reflects `branch/api/notebook_file` hierarchy. Notebook subfolder obtains a `deps` subfolder containing all notebook dependencies from the `api-workbench` project. The API subfolder, in turn, obtains a `node_modules` containing all the external dependencies.

####Transpiling the notebooks
After the ramlscript notebooks are generated, they are subjected to TypeScript compiler.

####Launching notebooks
Launching is implemented as an external child process. The notebooks are executed one by one with the
```
node {RamlScript notebook path} -logDir {target logs directory}
```
command. After the execution you may find the complete log of requests and responses in the directory passed under the `logDir` parameter.

## Automation Options
Creating the `automation/acfg.json`files allows to set up the automation process. For exmaple, you may want to work only with a specific branch or disable batch launching in order to debug each notebook separately. The set of options is determined by the [`AutomationConfig`](https://github.com/mulesoft-labs/api-workbench/blob/master/automation/impl/automationConfig.ts) class.

The set of APIs involved is controlled by the `automation/apisToTest.json` file. If the file is present, only those APIs are taken, which have `true` value after their title. For example:
```
{
  "Box": false,
  "Fuel Economy": true,
  "GeoNames": true,
  "GMail": false,
  "Parse": true,
  "Slack": false,
  "XKCD": false,
  "Zillow": true
}
```

##Sample APIs
This section lists APIs which are known to pass fine the batch process and provides example of config files for them.

####Box
```
auth.cfg:

{
  "Box 2.0accessToken" : "valid OAuth2 access token"
}
```

####FuelEconomy
No config files required.

####GeoNames
```
auth.cfg:

{
  "GeoNames Vusername" : "your-GeoNames-username"
}

```

####GMail
```
config.cfg:

Please, enter your GMail address=your.gmail.address@gmail.com
```
```
auth.cfg:

{
	"GMail v1clientId": "your client ID",
	"GMail v1clientSecret": "your client Secret",
	"GMail v1accessToken" : "valid OAuth2 access token"
}
```

####HealthCare.gov
No config files required.

####Instagram
```
config.cfg:

Please, enter client ID of your Instagram application=Client ID of your app
Please, enter client Secret of your Instagram application=Client Secret of your app
```
```
auth.cfg:

{
    "Instagram v1accessToken" : "Valid OAuth 2 access token"
}
```

####Parse
```
auth.cfg:

{
    "Parse 1X-Parse-Application-Id" : "Your application ID",
    "Parse 1X-Parse-REST-API-Key" : "REST API key of your application",
    "Parse 1X-Parse-Master-Key" : "Master key of your application"
}
```

####Slack
```
auth.cfg:

{
    "SlackaccessToken" : "Valid OAuth 2 access token"
}
```

####XKCD
No config files required.

####Zillow
```
auth.cfg:

{
  "Zillow Vzws-id" : "X1-ZWz1b7cczcioln_4pyss"
}
```

