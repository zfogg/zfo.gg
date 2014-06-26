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

    socket.on "yo", (yo) ->
      $scope.yos.push(yo)
      unless yoInterval
        yoSound.play()
        yoInterval = $interval ->
          $scope.yos.shift()
          $scope.yo1 = not $scope.yo1
          if $scope.yos.length
            yoSound.play()
          else
            yoInterval = not $interval.cancel yoInterval
        , 2200
