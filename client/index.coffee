angular.module("zfoggApp", [
  "ngAnimate"
  "ngRoute"

  "zfoggApp.gravity"
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
      maximum   : 1200
      minFont   : 17
      maxFont   : 22
      fontRatio : 40
      lineRatio : 1.45

    console.log "Looking for this? http://github.com/zfogg/zfo.gg"


  .controller "BodyCtrl", ($http, $scope, $rootScope, $window, $location, $timeout) ->

    $rootScope.isLoaded  = true
    $rootScope.viewReady = true

    $scope.animReady = false

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

  .factory "namespace", ->
    (target, name, block) ->
      [target, name, block] = [(if typeof exports isnt 'undefined' then exports else window), arguments...] if arguments.length < 3
      top    = target
      target = target[item] or= {} for item in name.split '.'
      block target, top

  .directive "scrollTo", ->
    (scope, element, attrs) ->
      element.bind "click", (event) ->
        location = attrs.scrollTo
        console.log location
        $.scrollTo location, +attrs.scrollSpeed or 300

