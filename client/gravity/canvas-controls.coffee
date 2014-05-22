#=require "canvas-tools"
#=require "../libs/html5slider"

angular.module("zfoggApp.gravity")

.factory "CanvasControls", (C$) ->
  class CanvasControls
    constructor: ->
      @controls = ($ "#canvas-controls")

    divElement: (_class, parent=@controls) ->
      div = document.createElement "div"
      div.className += _class
      parent.append div
      div

    inputElement: (type, defaultValue, parent=@controls) ->
      input = document.createElement "input"
      input.type = type
      input.value = defaultValue
      parent.append input
      input

    pElement: (text, parent=@controls) ->
      p = document.createElement 'p'
      p.innerHTML = text
      parent.append p
      p

    NumberInput: (name, defaultValue) ->
      control = @divElement "canvas-control"
      @pElement name, ($ control)
      numberInput = @inputElement "number", defaultValue, ($ control)
      @resets.push -> numberInput.value = defaultValue
      numberInput

    RangeInput: (name, defaultValue, min = 1, max = 100, step = 10) ->
      control = @divElement "canvas-control"
      @pElement name, ($ control)
      rangeInput = @inputElement "range", defaultValue, ($ control)

      rangeInput.min  = min
      rangeInput.max  = max
      rangeInput.step = step

      @resets.push -> rangeInput.value = defaultValue
      rangeInput

    ButtonInput: (name, _class='') ->
      control = @divElement "canvas-control"
      button = @inputElement "button", name, ($ control)
      button.className += _class
      button

    controlLimit: (limit) ->
      -> @value = C$.Math.clipValues @value, limit.lower, limit.upper

    propertyUpdater: (obj, objProperty, modifier = 1) ->
      -> obj[objProperty] = @value / modifier

    controlValueObj: (value, limitRange) ->
      default: value
      current: value
      modifier: C$.Math.commonRangeCoefficient value, limitRange
      setFromControl: -> @current = @getFromControl()
      getFromControl: (control = @self) -> control.value / @modifier
      # self: set this to the parent object after creation if you like.

    resets: []
