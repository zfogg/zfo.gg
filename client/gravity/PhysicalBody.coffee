angular.module("zfoggApp.gravity")

    .run (namespace) ->

        namespace "Gravity", (G, top) ->
            class G.PhysicalBody
                constructor: (@position    = G.vectors.get(),  \
                              @mass        = 1,                \
                              @size        = 1,                \
                              @restitution = 1,                \
                              @velocity    = G.vectors.get()) ->

                destructor: ->
                    G.vectors.put @position
                    G.vectors.put @velocity

                updatePosition: ->
                    @position[0] += @velocity[0]
                    @position[1] += @velocity[1]

                applyForce: (acceleration) ->
                    @velocity[0] += 0.5 * acceleration[0] * @mass
                    @velocity[1] += 0.5 * acceleration[1] * @mass
