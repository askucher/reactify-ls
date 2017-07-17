check-text = (text)->
      text.replace(/"""/g,"\"\"\"")
strategy = (c, n, sass)->
    o = parse sass, c
    obj-to-pairs = (object) ->
      [[key, value] for key, value of object]
    camelize = (.replace /[-_]+(.)?/g, (, c) -> (c ? '').to-upper-case!)
    optimize = (text)->
      text.split(' + ').filter(-> it isnt "''").join(" + ")
    replace-part = (input, group)->
      "' + #{group} + '"
    render-text = (text)->
      \' + text.replace(/#\{([^\}]+)\}/, replace-part) + \'
    render-optimized = render-text >> optimize
    render-subnode = (text)->
      subtext = text.substr(1, text.length)
      return subtext if subtext.trim!.length is 0
      strategy subtext, n, sass
    
    render-children = (text)->
      | text.index-of(\:) is 0 => render-subnode text
      | text.index-of(\.) is 0 => "\"\"\" #{check-text text.substr(1, text.length)}"
      | _ => render-optimized text
    get-val = (val)->
       | val.length is 0 => "''"
       | _ => val
    render-attrs = (attrs)->
      attrs.map(-> "#{it.0}: #{get-val it.1}").join(", ")
    attrs = 
      | o.attrs.length is 0 => ", {}"
      | _ => ", { #{render-attrs(o.attrs)} }" 
    next-space = n?match?(/^ +/)?0?length ? 0
    end =
      | (o.text ? "").length > 0 => ", #{render-children o.text}"
      | next-space > o.space.length => ", children = "
      | _ => ""
    element = 
       | o.element.0 is o.element.0.to-upper-case! => o.element
       | _ => "'#{camelize o.element}'"
    o.space + "react.create-element #{element}#{attrs}#{end}"

parse-attrs = (attrs)->
  return [] if not attrs?
  new-attr = ->
    ["",""]
  state =
    is-name: yes
    is-val: no
    is-str: no
    is-coma: no
  attrs-body = attrs
  c = [new-attr!]
  last = ->
    c[c.length - 1]
  for i of attrs-body
    char = attrs-body[i]
    switch
    case state.is-name and char.to-string!.match(/[a-z0-9_-]/i)
       last!.0 += char
    #case state.is-name and char is ","
    #   c.push new-attr!
    #   state.is-coma = yes
    #case state.is-coma is yes and char is " "
    #   state.is-coma = no
    case state.is-name and char is " "
       c.push new-attr!
    case state.is-name and char is "="
       state.is-name = no
       state.is-val = yes
    case state.is-name
       throw "Error parsing attributes: Unexpected char `#{char}` at column #{i}"
    case state.is-val and state.is-str is no and (char is \" or char is \')
       state.is-str = char
       last!.1 += char
    case state.is-val and state.is-str isnt no and char is " "
       last!.1 += char
    case state.is-val and state.is-str is char
       last!.1 += char
       if last!.1 is "#char#char"
          last!.1 = ""
       state.is-str = no
       state.is-val = no
       state.is-name = yes 
       c.push new-attr!
    case state.is-val and state.is-str is no and char is " "
       state.is-val = no
       state.is-name = yes 
       c.push new-attr!
    case state.is-val
       last!.1 += char
    else
       throw "Unexpected char `#{char}` at column #{i}"
  c.filter(-> it.0.length > 0)
  
hash-code = (s) ->
  s.split('').reduce ((a, b) ->
    a = (a .<<. 5) - a + b.char-code-at(0)
    a .&. a
  ), 0
get-sass-id = (sass, name)-->
  obj = sass[name]
  return if not obj?
  hash = obj |> JSON.stringify 
             |> hash-code
  "#name#hash"
  
generate-sass = (sass, name)-->
  class-name = get-sass-id sass, name
  lines = [".#{class-name}"] ++ sass[name]
  lines.join(\\n)
  
render-sass = (sass)->
  keys = Object.keys sass
  keys.map(generate-sass sass).join(\\n)
  
parse-classes = (sass, inline, attrs)-->
  inline-classes =
    inline.split(\.).filter(-> it.length > 0 and it isnt \pug)
  get-classes = 
    (attrs.find(-> it.0 is \class)?1 ? "")
  q = get-classes.0 ? "'"
  classes = 
    get-classes.substr(1, get-classes.length - 2).split(" ").filter(-> it.length > 0) ++ inline-classes
  dynamic =
    classes.map(get-sass-id sass).filter(-> it?)
  result-classes =
    classes ++ dynamic
  class-name =
    | classes.length > 0 => [[\className, q + result-classes.join(" ") + q]]
    | _ => []
  attrs.filter(-> it.0 isnt \class) ++ class-name
parse-id = (id, attrs)-->
  return attrs if not id?
  _id = "'#{id.substr(1, id.length)}'"
  get-id = 
    attrs.find(-> it.0 is \id)
  if not get-id?
     attrs.push [\id, _id]
  else if (get-id.1 ? "") is ""
    get-id.1 = _id
  attrs
parse = (sass, line) ->
  if not sass?
    throw "Internal Error: SASS cannot be null"
  parsed = parse-line line
  attrs = parse-attrs(parsed.attrs) |> parse-classes(sass, parsed.class) |> parse-id(parsed.id)
  space: parsed.space
  element: parsed.element
  attrs: attrs
  text: parsed.text


parse-line = (t)->
  collector =
     current: \space 
     space: ""
     element: ""
     opened-function: no
     class: ""
     id: ""
     attrs: ""
     text: ""
  rest = (char, next)->
      if char is \. and next?match?(/[a-z]/i)
         collector.current = "class"
         collector.class += char
      else if char is \#
         collector.current = "id"
         collector.id += char
      else if char is "("
         collector.current = "attrs"
      else if char is " " or char is ":" or char is "."
         collector.current = "text"
         collector.text += char
  for i of t
    char = t[i]
    next = t[parse-int(i) + 1]
    if collector.current is \space and char is " "
       collector.space += " "
    else if collector.current is \space
       if char.match(/[a-z]/i)
         collector.current = \element
         collector.element += char
       else 
         rest char, next
    else if collector.current is \element
       if char.match(/[a-z-_0-9]/i)
         collector.element += char
       else 
         rest char, next 
    else if collector.current is \class
       if char.match(/[a-z-_0-9]/i)
         collector.class += char
       else 
         rest char, next 
    else if collector.current is \id
       if char.match(/[a-z-_0-9]/i)
         collector.id += char
       else 
         rest char, next 
    else if collector.current is \attrs
       if char isnt ")" or collector.opened-function is yes
         if char is ")"
            collector.opened-function = no
         else if char is "(" 
            collector.opened-function = yes   
         collector.attrs += char
       else
           collector.current = "text" 
    else 
       collector.text += char
  collector.element = 
    | collector.element.length is 0 => "div"
    | _ => collector.element
  collector.id = 
    | collector.id.length is 0 => null 
    | _ => collector.id
  collector
  
reactify = (content, options)->
  lines = 
    content.split(\\n)
  state =
    current-sass: null
    sass: {}
    inline-text: null
  for i of lines
    line = lines[i]
    ii = parse-int i
    next = lines[ii + 1]
    space = line.match(/^ +/)?0 ? ""
    if line.trim!.length is 0
       continue
    else if state.inline-text?
      if state.inline-text.length >= space.length
         state.inline-text = null
         lines[ii - 1] = lines[ii - 1] + '"""'
      else
         end =
            | (lines[ii + 1] ? "").trim!.length > 0 and lines.length - 1 is ii + 1 => ""
            | _ => '"""'
         lines[i] = check-text(lines[i]) + end
         continue
    else if line.match(/^[ ]+\|(.+)/) and state.pug
      lines[i] = "#{space}\"\"\"#{line.match(/^[ ]+\|(.+)/).1}\"\"\""
    else if line.match(/\.pug/)
      state.pug = yes
      lines[i] = strategy line, next, state.sass
      if lines[i].index-of('"""') > -1 
         state.inline-text = space
    else
      state.pug = no
      sass = line.match(/^\.([a-z][a-z-0-9]+)/)
      if sass?
        state.current-sass = sass.1
        state.start = i
        state.sass[state.current-sass] = []
      else if state.current-sass?
        if space.length > 0
           state.sass[state.current-sass].push line
           lines[i] = "# " + line
        else
           lines[state.start] = "# " + ".#{get-sass-id state.sass, state.current-sass}"
           state.current-sass = null
  ls: lines.join(\\n)
  sass: render-sass state.sass

module.exports = reactify

