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

    yoSound = new buzz.sound "/audio/yo", formats: ["ogg", "mp3"]

    yoyoSound = new buzz.sound "/audio/yoyo", formats: ["ogg", "mp3"]

    playSound = (username) ->
      if username is "ZFOGG"
      then yoyoSound.play()
      else yoSound.play()

    socket.on "yo", (yo) ->
      $scope.yos.push(yo)
      unless yoInterval
        playSound $scope.yos[0]
        yoInterval = $interval ->
          $scope.yos.shift()
          $scope.yo1 = not $scope.yo1
          if $scope.yos.length
            playSound $scope.yos[0]
          else
            yoInterval = not $interval.cancel yoInterval
        , 600
