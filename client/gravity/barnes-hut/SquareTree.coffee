angular.module("zfogg.gravity")

.factory "SquareTree", (C$, QuadTree, distance, vectors, G) ->
  class SquareTree extends QuadTree
    #Ensure that your colors are six hex digits.
    color: "#000000"
    getQT_T: -> SquareTree

    mass: 0
    massx: 0, massy: 0
    theta: 1-C$.Math.PHI

    constructor: (@boundary, point_pointers, @RECUR_LIMIT) ->
      @_barycenter = new Float64Array 2
      super @boundary, point_pointers, @RECUR_LIMIT

    clear: ->
      @mass  =  0
      @massx =  0; @massy = 0

      #FIXME: needs a new way of being cleared.
      @_barycenter[0] = 0; @_barycenter[1] = 0
      super

    getBarycenter: ->
      if @_barycenter[0] == 0 and @_barycenter[1] == 0
        @_barycenter[0] = @massx/@mass
        @_barycenter[1] = @massy/@mass
      return @_barycenter

    ratio: (s) ->
      (@boundary.half*2) / (distance s.position, @getBarycenter())

    applyForceTo: (s) ->
      netForce = vectors.get()
      @_accNetForce s, netForce
      s.applyForce netForce
      vectors.put netForce

    _accNetForce: (s, acc) ->
      if @external
        if @pointp == null
          return
        else if s != @pointp
          g = G.attractionOfGravity s, @pointp
          acc[0] += g[0]; acc[1] += g[1]
          vectors.put g
      else if (@ratio s) < @theta
        bc = @getBarycenter()
        g = G.attractionOfGravity s, { position: bc, mass: @mass }
        acc[0] += g[0]; acc[1] += g[1]
        vectors.put g
      else
        q._accNetForce s, acc for q in @getQuadrents()

    update: (s) ->
      @color  = s.color
      @massx += s.position[0]*s.mass
      @massy += s.position[1]*s.mass
      @mass  += s.mass

    draw: (ctx) ->
      if @external and @pointp != null
        ctx.strokeStyle = @color
        ctx.fillStyle   = @color
        @_drawBoundary   ctx
      else if 0 < @mass
        @_drawBarycenter ctx
        @_drawMass       ctx

    _drawBoundary: (ctx) ->
      ctx.strokeRect(
        @boundary.center[0]-@boundary.half,
        @boundary.center[1]-@boundary.half,
        @boundary.half*2,
        @boundary.half*2)

    _drawBarycenter: (ctx) ->
      bc = @getBarycenter()
      ctx.moveTo bc[0]+2, bc[1]+2
      ctx.arc bc[0]+2, bc[1]+2, 4, 0, Math.PI*2, true

    _drawMass: (ctx) ->
      ctx.fillText((C$.Math.roundDigits @mass, 2),
        @boundary.center[0],
        @boundary.center[1]-2)
