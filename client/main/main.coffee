angular.module('zfogg')
  .controller 'MainCtrl', ($scope, socket, $interval, $timeout, $rootScope) ->

    $scope.$on "$viewContentLoaded", ->
      window._yoData =
        username: "ZFODOTGG"
        trigger: "he's feeling saucy"
      s = document.createElement("script")
      s.type = "text/javascript"
      s.src = "//yoapp.s3.amazonaws.com/js/yo-button.js"
      (document.head or document.getElementsByTagName("head")[0]).appendChild s

    $scope.yos = []
    $scope.yo1 = true

    yoInterval = null
    cancelYo = ->
      yoInterval = not $interval.cancel yoInterval
    $scope.$on "$destroy", cancelYo

    playSound = (username) ->
      if username is "ZFOGG"
      then yoyoSound.play()
      else yoSound.play()

    sound = (s) ->
      new buzz.sound "/audio/#{s}", formats: ["ogg", "mp3"]

    yoSound   = sound "yo"
    yoyoSound = sound "yoyo"
    yoyoSound.setSpeed 2

    $rootScope.bgStyle["opacity"] = "0.4"
    pulsePurple = ->
      $rootScope.bgStyle["background-color"] = "#c6a0d5"
      $timeout ->
        $rootScope.bgStyle["background-color"] = ""
      , 450
    $scope.$on "yo", pulsePurple

    doYo = ->
      playSound $scope.yos[0]
      $scope.$emit "yo"

    yo = (y) ->
      $scope.yos.push y
      unless yoInterval
        doYo()
        yoInterval = $interval ->
          $scope.yos.shift()
          $scope.yo1 = not $scope.yo1
          if $scope.yos.length
          then doYo()
          else cancelYo()
        , 800

    socket.on "yo", yo
    $scope.$on "$destroy", ->
      socket.removeListener "yo", yo

