angular.module('zfogg')
  .controller 'MainCtrl', ($scope, socket, $interval) ->

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
    $scope.$on "$destroy", ->
      yoInterval = not $interval.cancel yoInterval

    playSound = (username) ->
      if username is "ZFOGG"
      then yoyoSound.play()
      else yoSound.play()

    sound = (s) ->
      new buzz.sound "/audio/#{s}", formats: ["ogg", "mp3"]

    yoSound   = sound "yo"
    yoyoSound = sound "yoyo"

    i = 0
    yo = (y) ->
      console.log "yo" + i++
      $scope.yos.push y
      unless yoInterval
        playSound $scope.yos[0]
        yoInterval = $interval ->
          $scope.yos.shift()
          $scope.yo1 = not $scope.yo1
          if $scope.yos.length
            playSound $scope.yos[0]
          else
            yoInterval = not $interval.cancel yoInterval
        , 900

    socket.on "yo", yo
    $scope.$on "$destroy", ->
      socket.removeListener "yo", yo

