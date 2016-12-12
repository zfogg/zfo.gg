{ready, app, server, index} = require("./server")
{zfogg}                     = require "./server/main"


notFound = (req, res, next) ->
  res.status 404
  next() # Let angular figure out the 404 view.


ready.promise.then ->
  # api
  app.get "/api/zfogg"     , zfogg.get
  # angular
  app.get "/"              , index
  app.get "/thing/gravity" , index
  # else
  app.get "/404"           , notFound
  app.get "/*"             , [notFound, index]

.done()


module.exports = server
