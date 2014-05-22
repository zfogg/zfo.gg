angular.module("zfogg.gravity")

.factory "PhysicalSquare", (PhysicalBody, canvas$, G) ->
  class PhysicalSquare extends PhysicalBody
    constructor: (@position, @mass, @size, @index, @color) ->
      @LIM_W = canvas$().width
      @LIM_H = canvas$().height
      super @position, @mass, 1.2*@size, 0.95

    update: ->
      if not G.cursor.isClicked.right and not G.cursor.isClicked.left
        @bounceOffLimits @LIM_W, @LIM_H, @mass*2
      else
        G.applyGravity @, G.cursor
      @updatePosition()
      @decayVelocity G.CC_friction.values.current

    decayVelocity: (n) ->
      @velocity[0] -= @velocity[0] * n * @mass
      @velocity[1] -= @velocity[1] * n * @mass

    draw: (ctx) ->
      ctx.fillStyle = @color
      ctx.fillRect @position[0], @position[1], @size, @size

    bounceOffLimits: do ->
      bounce = (dimension) -> Math.abs dimension
      (width, height, offset) ->
        bounced = false
        if @position[0] > width - offset
          @velocity[0] = -bounce @velocity[0]
        else if @position[0] <= 0
          @velocity[0] = bounce @velocity[0]

        if @position[1] > height - offset
          @velocity[1] = -bounce @velocity[1]
        else if @position[1] <= 0
          @velocity[1] = bounce @velocity[1]
