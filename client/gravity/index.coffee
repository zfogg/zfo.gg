angular.module("zfogg.gravity", [

])


.factory "canvas$", ->
  -> ($ "#canvas")[0]


.controller "GravityCtrl", ($scope, $rootScope, $timeout, gravity, canvas$) ->
  $scope.$on "$viewContentLoaded", ->
    canvas = canvas$()
    canvas.width  = Math.min 1920, ($ "#canvas-container").width()
    canvas.height = canvas.width * 1 #(9/16)

    if canvas.getContext
      gravity()

      ($ "#canvas-controls-container").show()
      link = $ ".toggle-menu a"
      link.click (click) ->
        if click.which is 1
          ($ "#canvas-controls").slideToggle "slow"
          if link[0]?
            if link.eq(0).text() is "show"
            then link.text "hide"
            else link.text "show"

      $scope.$on "$destroy", ->
        window.cancelAnimationFrame gravity.loopID
