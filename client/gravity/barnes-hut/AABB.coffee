angular.module("zfoggApp.gravity")

  .run (namespace) ->
    namespace "Gravity", (G, top) ->
      class G.AABB
        constructor: (@center, @half) ->
          @_nw = [@center[0] - @half, @center[1] - @half]
          @_ne = [@center[0] + @half, @center[1] - @half]
          @_sw = [@center[0] - @half, @center[1] + @half]
          @_se = [@center[0] + @half, @center[1] + @half]

        containsPoint: (p) ->
          (@_nw[0] <= p[0] <= @_se[0]) and
          (@_ne[1] <= p[1] <= @_sw[1])

        intersects: (other) ->
          (@containsPoint other._nw) or
          (@containsPoint other._nw) or
          (@containsPoint other._se) or
          (@containsPoint other._se)

        intersection: (other) ->
          if @intersects other
            return new Rectangle [
              (Math.max @_nw[0], other._nw[0]),
              (Math.max @_nw[1], other._nw[1])
            ], [
              (Math.min @_se[0], other._se[0]),
              (Math.min @_se[1], other._se[1])
            ]
          else return null

        quadrents: ->
          q = @half/2
          [
            new G.AABB [@_nw[0] + q, @_nw[1] + q], q
            new G.AABB [@_ne[0] - q, @_ne[1] + q], q
            new G.AABB [@_sw[0] + q, @_sw[1] - q], q
            new G.AABB [@_se[0] - q, @_se[1] - q], q
          ]
