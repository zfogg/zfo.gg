angular.module("zfogg.gravity")


.factory "vectors", (C$) ->
  new C$.Vector2Pool 1000


.factory "direction", (vectors) ->
  (p1, p2) ->
    vectors.get p1[0] - p2[0], p1[1] - p2[1]


.factory "distance", (direction, hypotenuse, vectors) ->
  (p1, p2) ->
    d = direction p1, p2
    r = hypotenuse d[0], d[1]
    vectors.put d
    r


.factory "hypotenuse", (C$, canvas$) ->
  C$.Math.hypotenuseLookup 3, 0,
    ((Math.pow canvas$().width, 2) + (Math.pow canvas$().height, 2)) / Math.pow 10, 5
    Float64Array


.factory "G", ->
  {}


.factory "gravity", (
  CanvasControls, C$,
  AABB,
  SquareTree,
  PhysicalSquare,
  PhysicalCursor,

  vectors,

  direction,
  distance,

  hypotenuse,

  G,

  canvas$
  ) ->
  gravity = ->
    G.canvas   = canvas   = canvas$()
    G.ctx      = ctx      = canvas.getContext "2d"
    G.squares  = squares  = []
    G.gameTime = gameTime = 0

    G.cursor   = cursor = new PhysicalCursor

    defaultGravity        = (C$.Math.randomBetween 4, 9) * Math.pow 10, -4
    defaultFriction       = (C$.Math.randomBetween 2, 6) * Math.pow 10, -4
    defaultDistance       = (C$.Math.randomBetween 5, 9)
    defaultCursorFriction = (C$.Math.randomBetween 1, 4)
    defaultCursorMass     = 1750
    defaultCursorForce    = 0.65
    defaultParticlesN     = 13

    G.applyGravity = applyGravity = do ->
      G.attractionOfGravity = attractionOfGravity = (b1, b2) ->
        d = direction b1.position, b2.position
        r = hypotenuse d[0], d[1]
        v = vectors.get()

        if (r isnt 0) and (r > CC_distance.values.current)
          g = (CC_gravity.values.current*b1.mass*b2.mass) / (Math.pow r, 2)
          normalize d, r
          v[0] = -d[0]*g; v[1] = -d[1]*g

        vectors.put d
        v

      (body1, body2) ->
        f = attractionOfGravity body1, body2
        body1.applyForce f
        f[0] = -f[0]; f[1] = -f[1]
        body2.applyForce f
        vectors.put f

    G.forceTowards = forceTowards = (from, to, coEf = 1) ->
      d = direction from, to
      normalize d
      v = vectors.get -d[0]*coEf, -d[1]*coEf
      vectors.put d
      v

    normalize = (xs, r=hypotenuse xs[0], xs[1]) ->
      xs[0] = xs[0] / r; xs[1] = xs[1] / r
      null

    mapPairs = (f, set) ->
      i = set.length
      while j = --i
        while j--
          f set[i], set[j]
      return

    # Returns an n^2 grid of Squares, where n is the 'size' argument.
    #constructSquares :: (Int rows) -> (Int columns) -> (Int size) ->
    constructSquares = do ->
      initPositions = (rows, columns) ->
        xmargin = canvas.width  / columns
        ymargin = canvas.height / rows
        for n in [0...rows*columns]
          vectors.get \
            ((n / columns | 0) * xmargin) + xmargin/2,
            ((n % rows       ) * ymargin) + ymargin/2

      newSquare = (p, i, size) ->
        new PhysicalSquare p, size*C$.Math.PHI/2, size, i, C$.color Math.random

      (rows, columns, size) ->
        for position, index in initPositions rows, columns
          newSquare position, index, (if size.call then size() else size)

    resetSquares = (xs, gridSize) ->
      size = if [true, false].random()
      then -> (x*C$.Math.PHI for x in [4.25..6.75] by 0.125).random()
      else [4..7].random()
      s.destructor() for s in xs

      constructSquares gridSize, gridSize, size

    newSquareTree = (ss, recur_lim=7) ->
      s = canvas.width/2
      new SquareTree (new AABB [s, s], s), ss, recur_lim

    # Canvas Controls
    controls          = new CanvasControls
    controlValueRange = lower: 10, upper: 100

    rangeInput = (name, defaultValue) ->
      cValObj = controls.controlValueObj defaultValue, controlValueRange
      control = controls.RangeInput \
        name, cValObj.default * cValObj.modifier,
        controlValueRange.lower, controlValueRange.upper, 3

      ($ control).blur controls.propertyUpdater cValObj, "current", cValObj.modifier
      cValObj.self = control
      control.values = cValObj
      control

    G.CC_gravity        = CC_gravity        = rangeInput "Gravitational Attraction",    defaultGravity
    G.CC_friction       = CC_friction       = rangeInput "Atmospheric Friction",        defaultFriction
    G.CC_distance       = CC_distance       = rangeInput "Gravity Deadzone Radius",     defaultDistance
    G.CC_cursorFriction = CC_cursorFriction = rangeInput "Cursor Friction Coefficient", defaultCursorFriction
    G.CC_cursorMass     = CC_cursorMass     = rangeInput "Cursor Body Mass",            defaultCursorMass
    G.CC_cursorForce    = CC_cursorForce    = rangeInput "Cursor Release Force",        defaultCursorForce

    CC_defaultButton = controls.ButtonInput "Default Values"
    ($ CC_defaultButton).click ->
        x() for x in controls.resets

    CC_particleCount = controls.NumberInput "Rows of Squares", defaultParticlesN
    ($ CC_particleCount).blur controls.controlLimit (lower: 1, upper: 30)

    CC_resetButton = controls.ButtonInput("Reset Squares")
    ($ CC_resetButton).click (e) ->
      G.squares = squares = resetSquares squares, CC_particleCount.value


    # Keyboard Events
    Mousetrap.bind 'space', ->
      for s in squares
        r = (p, k) ->
          [-1, 1].random() * C$.Math.randomBetween p*s.mass, k*s.mass
        s.applyForce vectors.get (r 0.1, 0.4), (r 0.1, 0.4)
      false


    # Init.
    G.squares = squares = resetSquares [], defaultParticlesN
    G.qt      = qt      = newSquareTree squares, 5


    do main = ->
      #Update
      cursor.update()
      mapPairs applyGravity, squares
      square.update gameTime for square in squares

      qt.clear()
      qt.insert s for s in squares
      qt.applyForceTo s for s in squares

      #Render
      C$.clearCanvas canvas, ctx
      ctx.fillStyle = "rgba(0, 0, 0, 0)"
      ctx.fillRect 0, 0, canvas.width, canvas.height

      ctx.beginPath()
      qt.map (t) -> t.draw ctx
      ctx.closePath(); ctx.stroke()

      cursor.draw ctx
      s.draw ctx for s in squares

      gameTime++
      gravity.loopID = window.requestAnimationFrame main, canvas


  return gravity

