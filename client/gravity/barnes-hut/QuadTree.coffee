#= require "AABB"

angular.module("zfoggApp.gravity")

.factory "QuadTree", ->
  class QuadTree
    #:: AABB -> @
    constructor: (@boundary, point_pointers, @RECUR_LIMIT) ->
      if point_pointers != null and point_pointers.length > 0
        @insert pp for pp in point_pointers

    pointp: null

    external: true

    #Always work with quadrents in this order.
    _nw: null, _ne: null, _sw: null, _se: null

    _quadrents: []
    getQuadrents: ->
      if @_quadrents.length == 0 and @_nw != null
        @_quadrents = [@_nw, @_ne, @_sw, @_se]
      return @_quadrents
    setQuadrents: (nw, ne, sw, se) ->
      @_nw = @_new_QuadTree nw
      @_ne = @_new_QuadTree ne
      @_sw = @_new_QuadTree sw
      @_se = @_new_QuadTree se
      null

    _new_QuadTree: (corner) ->
      new (@getQT_T()) corner, null, @RECUR_LIMIT-1

    getQT_T: -> QuadTree

    #:: V2* -> bool
    insert: (pp) ->
      unless @boundary.containsPoint pp.position
        return false

      @update pp

      if @pointp == null and @external
        @pointp = pp
        return true

      if @_nw == null
        @subdivide()
      qs = @getQuadrents()

      if @external and true in q.insert @pointp for q in qs
        @pointp = null
        @external = false

      return true in (q.insert pp for q in qs)

    #:: pointp -> void
    #Called on pointps that are at or in this tree.
    update: (pp) ->

    #:: void
    clear: ->
      @pointp = null
      if not @external
        qt.clear() for qt in @getQuadrents()
      @external = true

    #:: void
    subdivide: ->
      if @RECUR_LIMIT > 0
        @setQuadrents.apply @, @boundary.quadrents()
      null

    _map: (f, acc) ->
      acc.push f @
      if not @external
        q._map f, acc for q in @getQuadrents()
      acc

    map: (f) -> @_map f, []

    getPointps: ->
      pps = @map (qt) -> qt.pointp
      pp.position for pp in pps when pp != null
