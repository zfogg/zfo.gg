angular.module("zfogg.gravity")

.factory "PhysicalBody", (vectors) ->
  class PhysicalBody
    constructor: (@position    = vectors.get(),  \
                  @mass        = 1,              \
                  @size        = 1,              \
                  @restitution = 1,              \
                  @velocity    = vectors.get()) ->

    destructor: ->
      vectors.put @position
      vectors.put @velocity

    updatePosition: ->
      @position[0] += @velocity[0]
      @position[1] += @velocity[1]

    applyForce: (acceleration) ->
      @velocity[0] += 0.5 * acceleration[0] * @mass
      @velocity[1] += 0.5 * acceleration[1] * @mass
