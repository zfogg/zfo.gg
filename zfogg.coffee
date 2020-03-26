bluebird  = require "bluebird"
{app, appServer, server, index, staticRoutes} = require("./server")
{zfogg} = require "./server/main"


notFound = (req, res, next) ->
  res.status 404
  next() # Let angular figure out the 404 view.


Promise.resolve(1)
  .then ->
    console.log "app routes"
    # api
    app.get "/api/zfogg",     zfogg.get
    # angular
    app.get "/",              index
    app.get "/bitcoin",       index
    app.get "/thing/gravity", index
    app.get "/404",           notFound

  .then staticRoutes

  .then ->
    console.log "catchall routes"
    app.get "/*",             [notFound, index]

  .then appServer


module.exports = server
