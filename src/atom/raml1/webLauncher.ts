/**
 * Created by dreamflyer on 8/9/15.
 */
import path = require('path');
import fs = require('fs');
//import building=require("../../ramlscript/building");

export function launch(path: string) {
    run(compile(path));
}

function compile(fullPath: string):string {
    var fileName = path.basename(fullPath, path.extname(fullPath));

    var currentDirectory = path.dirname(fullPath);

    var instrumentedFileName = fileName + ".instrumented";

    var originalContent = fs.readFileSync(fullPath).toString();

    var instrumentedContent = originalContent;

    fs.writeFileSync(currentDirectory + "/" + instrumentedFileName + '.ts', instrumentedContent);

    //building.doCompile(currentDirectory + "/" + instrumentedFileName + '.ts');

    return currentDirectory + "/" + instrumentedFileName;
}

//function run(path: string) {
//    var requirejs;
//
//    eval('requirejs = holder.requirejs');
//
//    requirejs.config({
//        baseUrl: '',
//
//        paths: {
//            root: '/'
//        }
//    });
//
//    requirejs(['root' + path], function(entryPoint) {
//        console.log('rjs buzzinga!!!');
//    });
//}

function run(mainPath:string) {
    var require;

    var directRequire, dirname, entryScript, expose, getOptions, getRequire, getSync, getXHR, injectJS, insertScript, insertScripts, joinPath, options, preset, required, result, src, srcs, _ref, _ref1,
        __slice = [].slice,
        __hasProp = {}.hasOwnProperty;

    required = {};

    preset = (_ref = typeof require !== "undefined" && require !== null ? require.preset : void 0) != null ? _ref : {};

    joinPath = function() {
        var concat, notEmpty, parent, parts;

        parts = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        concat = function(done, part) {
            return done.concat(part.split('/'));
        };
        notEmpty = function(x) {
            return x.length > 0 && x !== '.';
        };
        parent = function(done, part) {
            if (part === '..') {
                done.pop();
            } else {
                done.push(part);
            }
            return done;
        };
        return parts.reduce(concat, []).filter(notEmpty).reduce(parent, []).join('/');
    };

    dirname = function(path) {
        var tokens, _, _i, _ref1;

        _ref1 = path.split('/'), tokens = 2 <= _ref1.length ? __slice.call(_ref1, 0, _i = _ref1.length - 1) : (_i = 0, []), _ = _ref1[_i++];
        return joinPath.apply(null, tokens);
    };

    getSync = function(url) {
        return {status: 200, responseText: fs.readFileSync(url)};
    };

    injectJS = function(content, ref) {
        var head, script;

        script = document.createElement('script');
        script.type = 'text/javascript';
        script.text = content;
        if (ref) {
            script.setAttribute('data-ref', ref);
        }
        head = document.getElementsByTagName('head')[0];
        return head.appendChild(script);
    };

    insertScript = function(src, callback) {
        var head, script;

        script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;
        head = document.getElementsByTagName('head')[0];
        script.onreadystatechange = callback;
        script.onload = callback;
        return head.appendChild(script);
    };

    insertScripts = function(scripts, callback) {
        var next;

        return (next = function() {
            var script;

            script = scripts.shift();
            if (script) {
                return insertScript(script, next);
            } else {
                return callback();
            }
        })();
    };

    expose = function(objects, block) {
        var conflicts, name, object;

        conflicts = {};
        for (name in objects) {
            if (!__hasProp.call(objects, name)) continue;
            object = objects[name];
            if (name in window) {
                conflicts[name] = window[name];
            }
            window[name] = object;
        }
        return block(function() {
            var _results;

            _results = [];
            for (name in objects) {
                if (!__hasProp.call(objects, name)) continue;
                if (name in conflicts) {
                    _results.push(window[name] = object);
                } else {
                    _results.push(delete window[name]);
                }
            }
            return _results;
        });
    };

    getRequire = function(currentPath) {
        return function(path) {
            path = joinPath(currentPath, path);
            if (!(path in required)) {
                directRequire(path);
            }
            return required[path];
        };
    };

    directRequire = function(path) {
        var exports, objects, result;

        exports = {};
        objects = {
            require: getRequire(dirname(path)),
            exports: exports,
            module: {
                exports: exports
            }
        };
        if (preset != null ? preset[path] : void 0) {
            preset[path](objects.require, objects.exports, objects.module);
            required[path] = objects.module.exports;
            return delete preset[path];
        } else {
            result = getSync("" + path + ".js");
            if (result.status !== 200) {
                throw {
                    message: result.statusText,
                    code: result.status
                };
            }
            return expose(objects, function(restore) {
                injectJS("(function(require,exports,module){\n	" + result.responseText + "\n})(require,exports,module)", path);
                restore();
                return required[path] = objects.module.exports;
            });
        }
    };

    getOptions = function() {
        return {
            main: mainPath,
            shims: null
        };
    };

    options = getOptions();

    entryScript = (_ref1 = typeof require !== "undefined" && require !== null ? require.entryScript : void 0) != null ? _ref1 : options.main;

    if (options.shims) {
        result = getSync("" + options.shims);
        if (result.status !== 200) {
            throw {
                message: result.statusText,
                code: result.status
            };
        } else {
            srcs = (function() {
                var _i, _len, _ref2, _results;

                _ref2 = result.responseText.split("\n");
                _results = [];
                for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
                    src = _ref2[_i];
                    if (src !== '' && src[0] !== '#') {
                        _results.push("" + (joinPath(dirname(options.shims), src)) + ".js");
                    }
                }
                return _results;
            })();
            insertScripts(srcs, function() {
                return directRequire(entryScript);
            });
        }
    } else {
        directRequire(entryScript);
    }

}