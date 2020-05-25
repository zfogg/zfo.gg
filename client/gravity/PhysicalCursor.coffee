angular.module("zfogg.gravity")

.factory "PhysicalCursor", (C$, PhysicalBody, vectors, canvas$, distance, G) ->
  class PhysicalCursor extends PhysicalBody
    constructor: (width, height) ->
      super()
      @.position        = vectors.get()
      @.trackedPosition = vectors.get()
      canvas            = canvas$()
      @.canvasCenter    = vectors.get canvas.width / 2, canvas.height / 2

      ($ canvas).mousedown (e) => @.toggleClicks e, true
      ($ "body").mouseup   (e) => @.toggleClicks e, false
      ($ canvas).mousedown @.mouseDown
      ($ canvas).mouseup   @.mouseUpCanvas
      ($ "body").mouseup   @.mouseUpBody
      ($ canvas).mousemove C$.cursorUpdater @.trackedPosition, canvas

      #($ canvas).css "cursor", "none"

    isClicked:
      left:   false
      middle: false
      right:  false

    toggleClicks: (e, value) =>
      switch e.which
        when 1 then @.isClicked.left   = value
        when 2 then @.isClicked.middle = value
        when 3 then @.isClicked.right  = value
      true

    mouseDown: =>
      if @.isClicked.left
        @.mass = G.CC_cursorMass.values.getFromControl()
        G.CC_friction.values.current =
          G.CC_friction.value / G.CC_friction.values.modifier * G.CC_cursorFriction.value
      else if @.isClicked.right
        @.mass = 0.25 * G.CC_cursorMass.values.getFromControl()
        G.CC_friction.values.current =
          0.2 * (G.CC_friction.value / G.CC_friction.values.modifier * G.CC_cursorFriction.value)
      true

    mouseUpBody: =>
      @.mass = 0
      G.CC_friction.values.setFromControl()
      G.CC_gravity.values.setFromControl()
      @.isClicked.left = @.isClicked.middle = @.isClicked.right = false
      true

    mouseUpCanvas: =>
      if @.isClicked.left
        G.squares.forEach (s) =>
          if 25 > distance s.position, @.position
            f = G.forceTowards s.position, @.position, G.CC_cursorForce.values.getFromControl()
            s.applyForce f
            vectors.put f
      true

    rightHeldDown: =>
      @.position[0] = @.canvasCenter[0] + (Math.sin G.gameTime / 14) * 124
      @.position[1] = @.canvasCenter[1] + (Math.cos G.gameTime / 14) * 124

    updatePosition: ->
      @.position[0] = @.trackedPosition[0]
      @.position[1] = @.trackedPosition[1]

    update: ->
      if @.isClicked.right
        @.rightHeldDown()
      else @.updatePosition()

    draw: (ctx) ->
      ctx.fillStyle = "#000000"
      ctx.beginPath()
      ctx.arc @.position[0], @.position[1], 10, 0, Math.PI*2, true
      ctx.closePath()
      ctx.fill()
