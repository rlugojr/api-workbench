/// <reference path="../../../typings/main.d.ts" />

import AtomUtil = require('../util/atom')

export function highlight (fileContents: string, scopeName?: string): string {
  return fileContents;
}

export function highlightByMime (contents: string, mime: string) {
  return highlight(contents, scopeFromMime(mime))
}

export function scopeFromMime (mimeType: string): string {
  var grammar = AtomUtil.getGrammerFromMime(mimeType)

  return grammar ? grammar.scopeName : undefined
}
