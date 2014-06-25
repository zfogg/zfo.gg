angular.module('zfogg')
  .controller 'MainCtrl', ($scope, socket, $interval) ->

    $scope.yos = []
    yoInterval = null

    $scope.yo1 = true

    socket.on "yo", (yo) ->
      $scope.yos.push(yo)
      unless yoInterval
        yoInterval = $interval ->
          console.log "yoInterval"
          $scope.yos.shift()
          $scope.yo1 = not $scope.yo1
          unless $scope.yos.length
            yoInterval = not $interval.cancel yoInterval
        , 4000
