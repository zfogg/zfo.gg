angular.module("zfogg", [
  "ngAnimate"
  "ngRoute"

  "zfogg.gravity"

  "btford.socket-io"
])


.config ($routeProvider, $locationProvider) ->

  $locationProvider.html5Mode(true)

  $routeProvider
    .when "/",
      templateUrl: "main/index.html"
      controller: "MainCtrl"
    .when "/thing/gravity",
      templateUrl: "gravity/index.html"
      controller: "GravityCtrl"
    .when "/bitcoin",
      templateUrl: "bitcoin/index.html"
      controller: "BitcoinCtrl"
    .when "/404",
      templateUrl: "layout/404/index.html"
      controller: "404Ctrl"
    .otherwise
      redirectTo: "/404"

  $("body").flowtype
    minimum   : 320
    maximum   : 960
    minFont   : 20
    maxFont   : 32
    fontRatio : 32
    lineRatio : 1.45

  console.log "Looking for this? http://github.com/zfogg/zfo.gg"


.controller "BodyCtrl", ($http, $scope, $rootScope, $window, $location, $timeout, $interval, C$) ->

  window.Color = net.brehaut.Color

  $rootScope.isLoaded  = true
  $rootScope.viewReady = true

  $scope.animReady = false

  $scope.bodyStyle   = {}
  $rootScope.bgStyle = {}

  $http.get("/api/zfogg")
    .success ->
      $scope.animReady = true
    .error (data) ->
      null

  $rootScope.$on "$routeChangeStart", ->
    $rootScope.viewReady = false

  $rootScope.$on "$routeChangeSuccess", ->
    $rootScope.viewReady = true

    $window.ga? "set", "page", $location.path()
    $window.ga? "send", "pageview"


.directive "scrollTo", ->
  (scope, element, attrs) ->
    element.bind "click", (event) ->
      location = attrs.scrollTo
      $.scrollTo location, +attrs.scrollSpeed or 300


.factory "socket", (socketFactory, $location) ->
  options = {}
  unless $location.host() is "localhost"
    options.address = "http://50.22.11.232:13891/"
  socketFactory options
