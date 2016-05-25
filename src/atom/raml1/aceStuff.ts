import atomWeb = require("./atomWrapperWeb");
var provider = require("./provider");

export class AceCompleter {
    editor: atomWeb.TextEditor;

    tooltipId = 'suggestion-description';

    constructor(editor: atomWeb.TextEditor) {
        this.editor = editor;
    }

    getCompletions(editor, session, position, prefix:string, callback) {
        this.handlePopup(this.editor.aceEditor.completer);

        var _this = this;

        if(prefix) {
            var completionsList = this.getCompletionsList(prefix);

            var convertedList = (completionsList ? completionsList : []).map(function(suggestion) {
                var text = suggestion.text;

                var index = text.lastIndexOf(':');

                if(index > 0 && text.length === index + 1) {
                    text = text.substr(0, text.lastIndexOf(':'))
                }

                return {name: "", value: text, score: 1, meta: "", description: suggestion.description, prefix: prefix};
            });

            callback(null, convertedList);

            return;
        }

        callback(null, []);
    }

    handlePopup(completer) {
        var popup;

        var showDescription = popup => this.showDescription(popup);
        var hideDescription = () => this.hideDescription();

        if(completer.popup) {
            return;
        }

        Object.defineProperty(completer, "popup", {
            configurable: true,
            set: function(value) {
                popup = value;

                popup.on('select', event => {
                    showDescription(popup);
                });

                popup.on('show', event => {
                    showDescription(popup);
                });

                popup.on('hide', event => {
                    hideDescription();
                });
            },

            get: function() {
                return popup;
            }
        });
    }

    showDescription(popup) {
        var data = popup.getData(popup.getSelection().getCursor().row);

        if(!data || !data.description || data.description.length === 0) {
            this.hideDescription();

            return;
        }

        var element = document.getElementById(this.tooltipId);

        if(!element) {
            element = document.createElement('div');

            element.id = this.tooltipId;
            element.className = this.tooltipId;

            var left = popup.container.offsetLeft;
            var top = popup.container.offsetTop;
            var width = popup.container.offsetWidth;
            var height = popup.container.offsetHeight;

            element.style.left = left + 'px';
            element.style.top = (top + height) + 'px'
            element.style.width = width + 'px';
            element.style.zIndex = '100';

            document.body.appendChild(element);
        }

        element.innerHTML = '<span>' + data.description + '</span>';
    }

    hideDescription() {
        var tooltip = document.getElementById(this.tooltipId);

        if(tooltip) {
            document.body.removeChild(tooltip);
        }
    }

    getCompletionsList(prefix:string): any[] {
        var request = {editor:this.editor, prefix: prefix, bufferPosition:this.editor.getCursorBufferPosition()};

        return (<any>provider).getSuggestions(request);
    }
}