// Generated by LiveScript 1.5.0
(function(){
  var checkText, strategy, parseAttrs, hashCode, getSassId, generateSass, renderSass, parseClasses, parseId, parse, parseLine, reactify;
  checkText = function(text){
    return text.replace(/"""/g, "\"\"\"");
  };
  strategy = function(c, n, sass){
    var o, objToPairs, camelize, optimize, replacePart, renderText, renderOptimized, renderSubnode, renderChildren, getVal, renderAttrs, attrs, nextSpace, ref$, ref1$, ref2$, end, element, this$ = this;
    o = parse(sass, c);
    objToPairs = function(object){
      var key, value, results$ = [];
      for (key in object) {
        value = object[key];
        results$.push([key, value]);
      }
      return results$;
    };
    camelize = function(it){
      return it.replace(/[-_]+(.)?/g, function(arg$, c){
        return (c != null ? c : '').toUpperCase();
      });
    };
    optimize = function(text){
      return text.split(' + ').filter(function(it){
        return it !== "''";
      }).join(" + ");
    };
    replacePart = function(input, group){
      return "' + " + group + " + '";
    };
    renderText = function(text){
      return '\'' + text.replace(/#\{([^\}]+)\}/, replacePart) + '\'';
    };
    renderOptimized = compose$(renderText, optimize);
    renderSubnode = function(text){
      var subtext;
      subtext = text.substr(1, text.length);
      if (subtext.trim().length === 0) {
        return subtext;
      }
      return strategy(subtext, n, sass);
    };
    renderChildren = function(text){
      switch (false) {
      case text.indexOf(':') !== 0:
        return renderSubnode(text);
      case text.indexOf('.') !== 0:
        return "\"\"\" " + checkText(text.substr(1, text.length));
      default:
        return renderOptimized(text);
      }
    };
    getVal = function(val){
      switch (false) {
      case val.length !== 0:
        return "''";
      default:
        return val;
      }
    };
    renderAttrs = function(attrs){
      return attrs.map(function(it){
        return it[0] + ": " + getVal(it[1]);
      }).join(", ");
    };
    attrs = (function(){
      switch (false) {
      case o.attrs.length !== 0:
        return ", {}";
      default:
        return ", { " + renderAttrs(o.attrs) + " }";
      }
    }());
    nextSpace = (ref$ = n != null ? typeof n.match == 'function' ? (ref1$ = n.match(/^ +/)) != null ? (ref2$ = ref1$[0]) != null ? ref2$.length : void 8 : void 8 : void 8 : void 8) != null ? ref$ : 0;
    end = (function(){
      var ref$;
      switch (false) {
      case !(((ref$ = o.text) != null ? ref$ : "").length > 0):
        return ", " + renderChildren(o.text);
      case !(nextSpace > o.space.length):
        return ", children = ";
      default:
        return "";
      }
    }());
    element = (function(){
      switch (false) {
      case o.element[0] !== o.element[0].toUpperCase():
        return o.element;
      default:
        return "'" + camelize(o.element) + "'";
      }
    }());
    return o.space + ("react.create-element " + element + attrs + end);
  };
  parseAttrs = function(attrs){
    var newAttr, state, attrsBody, c, last, i, char;
    if (attrs == null) {
      return [];
    }
    newAttr = function(){
      return ["", ""];
    };
    state = {
      isName: true,
      isVal: false,
      isStr: false,
      isComa: false
    };
    attrsBody = attrs;
    c = [newAttr()];
    last = function(){
      return c[c.length - 1];
    };
    for (i in attrsBody) {
      char = attrsBody[i];
      switch (false) {
      case !(state.isName && char.toString().match(/[a-z0-9_-]/i)):
        last()[0] += char;
        break;
      case !(state.isName && char === " "):
        c.push(newAttr());
        break;
      case !(state.isName && char === "="):
        state.isName = false;
        state.isVal = true;
        break;
      case !state.isName:
        throw "Error parsing attributes: Unexpected char `" + char + "` at column " + i;
      case !(state.isVal && state.isStr === false && (char === '"' || char === '\'')):
        state.isStr = char;
        last()[1] += char;
        break;
      case !(state.isVal && state.isStr !== false && char === " "):
        last()[1] += char;
        break;
      case !(state.isVal && state.isStr === char):
        last()[1] += char;
        if (last()[1] === char + "" + char) {
          last()[1] = "";
        }
        state.isStr = false;
        state.isVal = false;
        state.isName = true;
        c.push(newAttr());
        break;
      case !(state.isVal && state.isStr === false && char === " "):
        state.isVal = false;
        state.isName = true;
        c.push(newAttr());
        break;
      case !state.isVal:
        last()[1] += char;
        break;
      default:
        throw "Unexpected char `" + char + "` at column " + i;
      }
    }
    return c.filter(function(it){
      return it[0].length > 0;
    });
  };
  hashCode = function(s){
    return s.split('').reduce(function(a, b){
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
  };
  getSassId = curry$(function(sass, name){
    var obj, hash;
    obj = sass[name];
    if (obj == null) {
      return;
    }
    hash = hashCode(
    JSON.stringify(
    obj));
    return name + "" + hash;
  });
  generateSass = curry$(function(sass, name){
    var className, lines;
    className = getSassId(sass, name);
    lines = ["." + className].concat(sass[name]);
    return lines.join('\n');
  });
  renderSass = function(sass){
    var keys;
    keys = Object.keys(sass);
    return keys.map(generateSass(sass)).join('\n');
  };
  parseClasses = curry$(function(sass, inline, attrs){
    var inlineClasses, getClasses, ref$, ref1$, q, classes, dynamic, resultClasses, className;
    inlineClasses = inline.split('.').filter(function(it){
      return it.length > 0 && it !== 'pug';
    });
    getClasses = (ref$ = (ref1$ = attrs.find(function(it){
      return it[0] === 'class';
    })) != null ? ref1$[1] : void 8) != null ? ref$ : "";
    q = (ref$ = getClasses[0]) != null ? ref$ : "'";
    classes = getClasses.substr(1, getClasses.length - 2).split(" ").filter(function(it){
      return it.length > 0;
    }).concat(inlineClasses);
    dynamic = classes.map(getSassId(sass)).filter(function(it){
      return it != null;
    });
    resultClasses = classes.concat(dynamic);
    className = (function(){
      switch (false) {
      case !(classes.length > 0):
        return [['className', q + resultClasses.join(" ") + q]];
      default:
        return [];
      }
    }());
    return attrs.filter(function(it){
      return it[0] !== 'class';
    }).concat(className);
  });
  parseId = curry$(function(id, attrs){
    var _id, getId, ref$;
    if (id == null) {
      return attrs;
    }
    _id = "'" + id.substr(1, id.length) + "'";
    getId = attrs.find(function(it){
      return it[0] === 'id';
    });
    if (getId == null) {
      attrs.push(['id', _id]);
    } else if (((ref$ = getId[1]) != null ? ref$ : "") === "") {
      getId[1] = _id;
    }
    return attrs;
  });
  parse = function(sass, line){
    var parsed, attrs;
    if (sass == null) {
      throw "Internal Error: SASS cannot be null";
    }
    parsed = parseLine(line);
    attrs = parseId(parsed.id)(
    parseClasses(sass, parsed['class'])(
    parseAttrs(parsed.attrs)));
    return {
      space: parsed.space,
      element: parsed.element,
      attrs: attrs,
      text: parsed.text
    };
  };
  parseLine = function(t){
    var collector, rest, i, char, next;
    collector = {
      current: 'space',
      space: "",
      element: "",
      'class': "",
      id: "",
      attrs: "",
      text: ""
    };
    rest = function(char, next){
      if (char === '.' && (next != null && (typeof next.match == 'function' && next.match(/[a-z]/i)))) {
        collector.current = "class";
        return collector['class'] += char;
      } else if (char === '#') {
        collector.current = "id";
        return collector.id += char;
      } else if (char === "(") {
        return collector.current = "attrs";
      } else if (char === " " || char === ":" || char === ".") {
        collector.current = "text";
        return collector.text += char;
      }
    };
    for (i in t) {
      char = t[i];
      next = t[parseInt(i) + 1];
      if (collector.current === 'space' && char === " ") {
        collector.space += " ";
      } else if (collector.current === 'space') {
        if (char.match(/[a-z]/i)) {
          collector.current = 'element';
          collector.element += char;
        } else {
          rest(char, next);
        }
      } else if (collector.current === 'element') {
        if (char.match(/[a-z-_0-9]/i)) {
          collector.element += char;
        } else {
          rest(char, next);
        }
      } else if (collector.current === 'class') {
        if (char.match(/[a-z-_0-9]/i)) {
          collector['class'] += char;
        } else {
          rest(char, next);
        }
      } else if (collector.current === 'id') {
        if (char.match(/[a-z-_0-9]/i)) {
          collector.id += char;
        } else {
          rest(char, next);
        }
      } else if (collector.current === 'attrs') {
        if (char !== ")") {
          collector.attrs += char;
        } else {
          collector.current = "text";
        }
      } else {
        collector.text += char;
      }
    }
    collector.element = (function(){
      switch (false) {
      case collector.element.length !== 0:
        return "div";
      default:
        return collector.element;
      }
    }());
    collector.id = (function(){
      switch (false) {
      case collector.id.length !== 0:
        return null;
      default:
        return collector.id;
      }
    }());
    return collector;
  };
  reactify = function(content, options){
    var lines, state, i, line, ii, next, space, ref$, ref1$, end, sass;
    lines = content.split('\n');
    state = {
      currentSass: null,
      sass: {},
      inlineText: null
    };
    for (i in lines) {
      line = lines[i];
      ii = parseInt(i);
      next = lines[ii + 1];
      space = (ref$ = (ref1$ = line.match(/^ +/)) != null ? ref1$[0] : void 8) != null ? ref$ : "";
      if (line.trim().length === 0) {
        continue;
      } else if (state.inlineText != null) {
        if (state.inlineText.length >= space.length) {
          state.inlineText = null;
          lines[ii - 1] = lines[ii - 1] + '"""';
        } else {
          end = (fn$());
          lines[i] = checkText(lines[i]) + end;
          continue;
        }
      } else if (line.match(/^[ ]+\|(.+)/) && state.pug) {
        lines[i] = space + "\"\"\"" + line.match(/^[ ]+\|(.+)/)[1] + "\"\"\"";
      } else if (line.match(/\.pug/)) {
        state.pug = true;
        lines[i] = strategy(line, next, state.sass);
        if (lines[i].indexOf('"""') > -1) {
          state.inlineText = space;
        }
      } else {
        state.pug = false;
        sass = line.match(/^\.([a-z][a-z-0-9]+)/);
        if (sass != null) {
          state.currentSass = sass[1];
          state.start = i;
          state.sass[state.currentSass] = [];
        } else if (state.currentSass != null) {
          if (space.length > 0) {
            state.sass[state.currentSass].push(line);
            lines[i] = "# " + line;
          } else {
            lines[state.start] = "# " + ("." + getSassId(state.sass, state.currentSass));
            state.currentSass = null;
          }
        }
      }
    }
    return {
      ls: lines.join('\n'),
      sass: renderSass(state.sass)
    };
    function fn$(){
      var ref$;
      switch (false) {
      case !(((ref$ = lines[ii + 1]) != null ? ref$ : "").trim().length > 0 && lines.length - 1 === ii + 1):
        return "";
      default:
        return '"""';
      }
    }
  };
  module.exports = reactify;
  function compose$() {
    var functions = arguments;
    return function() {
      var i, result;
      result = functions[0].apply(this, arguments);
      for (i = 1; i < functions.length; ++i) {
        result = functions[i](result);
      }
      return result;
    };
  }
  function curry$(f, bound){
    var context,
    _curry = function(args) {
      return f.length > 1 ? function(){
        var params = args ? args.concat() : [];
        context = bound ? context || this : this;
        return params.push.apply(params, arguments) <
            f.length && arguments.length ?
          _curry.call(context, params) : f.apply(context, params);
      } : f;
    };
    return _curry();
  }
}).call(this);