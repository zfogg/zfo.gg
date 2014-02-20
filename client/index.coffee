angular.module('zfoggApp', [
  'ngAnimate'
  'ngCookies'
  'ngResource'
  'ngRoute'
])


  .config ($routeProvider, $locationProvider) ->

    $locationProvider.html5Mode(true)

    $routeProvider
      .when '/',
        templateUrl: 'main/index.html'
        controller: 'MainCtrl'
      .when '/404',
        templateUrl: 'layout/404/index.html'
        controller: '404Ctrl'
      .otherwise
        redirectTo: '/404'

    $('body').flowtype
      minimum   : 320
      maximum   : 1200
      minFont   : 17
      maxFont   : 22
      fontRatio : 40
      lineRatio : 1.45

    console.log "Looking for this? http://github.com/zfogg/zfo.gg"


  .controller "BodyCtrl", ($http, $scope, $rootScope, $window, $location, $timeout) ->

    $rootScope.isLoaded  = true
    $rootScope.viewReady = false

    $scope.animReady = false

    $http.get('/api/zfogg')
      .success ->
        $scope.animReady = true
      .error (data) ->
        null

    $rootScope.$on "$routeChangeStart", ->
      $rootScope.viewReady = false

    $rootScope.$on "$routeChangeSuccess", ->
      $timeout ->
        $rootScope.viewReady = true
      , 300

      $window.ga? "set", "page", $location.path()
      $window.ga? "send", "pageview"

