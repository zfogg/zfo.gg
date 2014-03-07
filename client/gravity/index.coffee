angular.module("zfoggApp.gravity", [

])

  .controller "GravityCtrl", (namespace) ->
    namespace "Gravity", (G, top) ->
      canvas        = ($ "#canvas")[0]

      canvas.width  = Math.min 1920, ($ "#gravity").width()
      canvas.height = canvas.width * (9/16)

      if canvas.getContext
        G.Gravity canvas

        ($ "#canvas-controls-container").show()
        link = $ "#toggle-menu a"
        link.click (click) ->
          if click.which is 1
            ($ "#canvas-controls").slideToggle "slow"
            if link.text() is "Show"
            then link.text "Hide"
            else link.text "Show"

