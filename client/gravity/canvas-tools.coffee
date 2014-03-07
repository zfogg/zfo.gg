# A collection of tools to assist in canvas development.

angular.module("zfoggApp.gravity")

  .run (namespace) ->
    namespace "C$", (C$, top) ->
      # Functional tools.
      C$.Fn = Fn =
          id: (x) -> x
          array: -> arguments

          apply: (f, args...) -> f.apply @, args

          map: (f, xs) ->
              f x for x in xs

          concat: (xss) ->
              r = []
              r = r.concat xs for xs in xss
              r

          #fold :: (a -> b -> b) -> [a] -> a -> b
          fold: (f, xs, acc) ->
              if xs.length > 0
                  Fn.fold f, xs.tail(), (f xs.head(), acc)
              else acc

          fold1: (f, xs) ->
              Fn.fold f, xs.tail(), xs.head()

          #zipWith :: (a -> b -> c) -> [a] -> [b] -> [c]
          zipWith: (f, xs, ys) ->
              f xs[i], ys[i] for i in [0...Math.min xs.length, ys.length]

          #zip :: [a] -> [b] -> [[a, b]]
          zip: (xs, ys) ->
              Fn.zipWith ((x, y) -> [x, y]), xs, ys

          all: (p, xs) ->
              false not in Fn.map p, xs
          any: (p, xs) ->
              for x in xs
                  return true if p x
              false

          #repeat :: a -> Integer -> [a]
          repeat: (x, n) -> x for i in [0...n]

          #lookup :: (-> [a]) -> (b -> Integer) -> (b -> a)
          lookup: (table, hash = Fn.id) ->
              (x) -> table[hash x]

          #compose :: ((a -> b) || [(a -> b)])... -> (a -> b)
          compose: (args...) ->
              fs = [].concat f, fs for f in args
              (x) ->
                  x = f x for f in fs.reverse().tail()
                  x

          #partial :: (a... -> b... -> c) -> a... -> (b... -> c)
          partial: (f, args1...) -> (args2...) ->
              f.apply @, args1.concat args2
          #partial$ :: (a... -> b... -> c) -> [a] -> (b... -> c)
          partial$: (f, args) ->
              Fn.partial.apply @, [f].concat args
          #flip :: (a... -> b... -> c) -> b... -> (a... -> c)
          flip: (f, args1...) -> (args2...) ->
              f.apply @, (args1.concat args2).reverse()
          flip$: (f, args) ->
              Fn.flip.apply @, [f].concat args

          curry: (n, f, args...) ->
              Fn.curry$ (n - args.length), (Fn.partial$ f, args)
          curryFlip: (n, f, args...) ->
              Fn.curry$ (n - args.length), (Fn.flip$ f, args)

          curry$: (n, f, args...) ->
              if n > args.length
                  Fn.partial Fn.curry$, (n - args.length), (Fn.partial$ f, args)
              else f.apply @, args


      Function::curry = (args...) ->
          Fn.curry.apply @, [@length, @].concat args
      Function::curryFlip = (args...) ->
          Fn.curryFlip.apply @, [@length, @].concat args

      C$.Math = $Math =

          PHI: 1/2*(1 + Math.sqrt 5)

          direction: (p1, p2) ->
              [p1[0] - p2[0], p1[1] - p2[1]]

          hypotenuse: (a, b) ->
              Math.sqrt a*a + b*b

          hypotenuseLookup: (digits, minSquare = 0, maxSquare, ArrayT) ->
              sqrtTable = do ->
                  pow = Math.pow 10, digits
                  table = new ArrayT \
                      (Math.sqrt x for x in [minSquare .. maxSquare * pow] by 1.0 / pow)
                  hash = (n) -> (n / 100 * pow) | 0
                  Fn.lookup table, hash
              (a, b) -> (sqrtTable (a*a + b*b)) or ($Math.hypotenuse a, b)

          roundDigits: (n, digits) ->
              parseFloat ((Math.round \
                  (n * (Math.pow 10, digits)).toFixed(digits-1)) / (Math.pow 10,digits)
              ).toFixed digits

          randomBetween: (min, max) -> Math.random() * (max - min) + min

          randomRange: (min, max) ->
              r1 = Math.round $Math.randomBetween min, max
              r2 = Math.round $Math.randomBetween min, max
              [Math.min(r1, r2) .. Math.max(r1, r2)]

          clipValues: (value, lower, upper) ->
              if value >= lower and value <= upper
                  value
              else
                  if value < lower then lower else upper

          commonRangeCoefficient: (n, range, coefficient = 1) ->
              if n < range.lower
                  $Math.commonRangeCoefficient n * 10, range, coefficient * 10
              else if n > range.upper
                  $Math.commonRangeCoefficient n / 10, range, coefficient / 10
              else coefficient

          # Array maths.
          sum:     do -> Fn.partial Fn.fold1, ((x,y) -> x+y)
          product: do -> Fn.partial Fn.fold1, ((x,y) -> x*y)

          factorial: (n) ->
              $Math.product [1..n]

      # Array.prototype

      Array::head = -> @[0]
      Array::last = -> @[@length-1]

      Array::init = -> @[0..@length-2]
      Array::tail = -> @[1..]

      Array::iWhile = (p) ->
          i = 0
          i++ while p @[i]
          i
      Array::takeWhile = (p) ->
          @[0..(@iWhile p)-1]
      Array::dropWhile = (p) ->
          @[(@iWhile p)..]

      Array::take = (n) ->
          @[0...n]
      Array::drop = (n) ->
          @[n..]

      Array::toSet = ->
          s = {}
          s[x] = i for x,i in @
          @[v] for k,v of s

      Array::random = ->
          @[Math.random() * @length | 0]

      Array::extract = (keys) ->
          @map (x) ->
              for k in keys.split '.'
                  x = x[k]
              x
      Array::extractf = (f, args...) ->
          @map (x) -> x[f] args

      Array::clean = ->
          @filter (x) ->
              not ($.isArray x) or x.length > 0

      # For lack of a better place, the following functions are here.
      C$.clearCanvas = (canvas, ctx) ->
          ctx.clearRect 0, 0, canvas.width, canvas.height

      C$.color = (x = 1) ->
          x = x() if x.call
          '#'+("00000"+(x*16777216<<0).toString 16).substr(-6)

      C$.keyWasPressed = (e, code) ->
          if window.event
              window.event.keyCode is code
          else e.which is code

      C$.cursorUpdater = (cursor, element) ->
          (e) ->
              x = y = 0
              if e.pageX or e.pageY
                  x = e.pageX
                  y = e.pageY
              else
                  x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft
                  y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop
              p = C$.findElementPosition element
              cursor[0] = x - element.offsetLeft - p.x
              cursor[1] = y - element.offsetTop  - p.y

      C$.findElementPosition = (obj) ->
          if obj.offsetParent
              curleft = curtop = 0
              loop
                  curleft += obj.offsetLeft
                  curtop += obj.offsetTop
                  break unless obj = obj.offsetParent
              x: curleft, y: curtop

          else undefined

      # Classes

      C$.ObjectPool = class
          constructor: (count, @cons, @zero) ->
                  @deep = (@new() for i in [1..count])

          get: ->
              if @deep.length > 0
                  @deep.pop()
              else @new()

          put: (x) ->
              @deep.push @zero x

          new: -> @zero @cons()

      C$.Vector2Pool = class extends C$.ObjectPool
          constructor: (count) ->
              super count,
              -> new Float32Array 2,
              (v) ->
                  v[0] = 0; v[1] = 0
                  v

          get: (x, y) ->
              v = super()
              v[0] = x if x; v[1] = y if y
              v

      window.requestFrame = do ->
          window.requestAnimationFrame       or
          window.webkitRequestAnimationFrame or
          window.mozRequestAnimationFrame    or
          window.oRequestAnimationFrame      or
          window.msRequestAnimationFrame     or
          (callback, element) -> window.setTimeout callback, 1000 / 60
