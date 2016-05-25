/// <reference path="../../../typings/main.d.ts" />

import fs = require('fs')
import extend = require('xtend')
import RAMLParser = require('raml-parser')
import RAMLWrapper = require('../../Raml08Wrapper')

var reader = new RAMLParser.FileReader(function (path: string): Promise<string> {
  return new Promise<string>(function (resolve, reject) {
    fs.readFile(path, 'utf8', function (err, data) {
      err ? reject(err) : resolve(data)
    })
  })
})

export var FileReader = RAMLParser.FileReader

export function loadFile (filename: string, opts?: RAMLParser.LoadOptions): Promise<RAMLWrapper.Api> {
  return RAMLParser.loadFile(filename, extend<RAMLParser.LoadOptions>({ reader: reader }, opts))
    .then(RAMLWrapper.wrap)
}

export function load (text: string, filename: string, opts?: RAMLParser.LoadOptions): Promise<RAMLWrapper.Api> {
  return RAMLParser.load(text, filename, extend<RAMLParser.LoadOptions>({ reader: reader }, opts))
    .then(RAMLWrapper.wrap)
}
