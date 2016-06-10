import mime = require('mime')

mime.define({
  'text/xml': ['xml']
})

export function getEditorById (editorId: string): AtomCore.IEditor {
  var editors = atom.workspace.getTextEditors()

  for (var i = 0; i < editors.length; i++) {
    var editor = editors[i]

    if (String(editor.id) === editorId) {
      return editor
    }
  }
}

export function getEditorByPath (path: string): AtomCore.IEditor {
  var editors = atom.workspace.getTextEditors()

  for (var i = 0; i < editors.length; i++) {
    var editor = editors[i]

    if (editor.getPath() === path) {
      return editor
    }
  }
}

export function getGrammerFromMime (mimeType: string): AtomCore.IGrammar {
  if (mimeType == null) {
    return atom.grammars.grammarsByScopeName['text.plain.null-grammar']
  }

  var extension = mime.extension(mimeType)
  var grammars = atom.grammars.getGrammars()

  for (var i = 0; i < grammars.length; i++) {
    var grammar = grammars[i]

    if (grammar.fileTypes.indexOf(extension) > -1) {
      return grammar
    }
  }

  return atom.grammars.grammarsByScopeName['text.plain.null-grammar']
}

/**
 * Create an Atom text editor instance for syntax highlighting.
 *
 * Source: https://github.com/atom/markdown-preview/blob/6d672aca4cff48420977708c31290018622bb166/lib/renderer.coffee#L102-L126
 */
export function codeToEditorElement (code: string, grammar: any) {
  var editorElement = document.createElement('atom-text-editor')
  editorElement.setAttributeNode(document.createAttribute('gutter-hidden'))
  editorElement.removeAttribute('tabindex') // Make read-only.

  var editor = (<any> editorElement).getModel()
  editor.getDecorations({ class: 'cursor-line', type: 'line' })[0].destroy()
  editor.setText(code)
  editor.setGrammar(grammar)

  return editorElement
}
