/// <reference path="../../../typings/main.d.ts" />
import path      = require('path');
import fs      = require('fs');
var mkdirp      = require('mkdirp');
var XMLHttpRequestConstructor = require("xmlhttprequest").XMLHttpRequest;

var x: XMLHttpRequest = new XMLHttpRequestConstructor;


var configFileName = 'apiList.json'
createApiList();

export function createApiList(){
    var apiJsonList = {};
    var reposLink = 'https://api.github.com/orgs/raml-apis/repos?per_page=200';
    x.open("GET",reposLink);
    x.onload = function(){
        var data:any[] = []
        var response:any[] =  JSON.parse(x.responseText)
        var count = 0;
        JSON.parse(x.responseText).forEach(e=>{
            var b: XMLHttpRequest = new XMLHttpRequestConstructor;
            b.open("GET", "https://github.com/raml-apis/"+e.name+"/tree/production")
            //b.open("GET", "https://api.github.com/repos/raml-apis/"+e.name+"/branches/production")
            b.onload = function(){
                if (b.status < 320 && e.name !== "main" && e.name !== "synchronization"){
                    data[data.length] = e;
                }
                count++;
                if (response.length == count) {
                    apiJsonList = data;
                    var dir = path.resolve(__dirname + '/config/', configFileName);
                    fs.writeFile(dir, JSON.stringify(apiJsonList, null, 4), function (err) {
                        if (err) throw err;
                    });
                }
            }
            b.send()
        });
    }
    x.send();
}