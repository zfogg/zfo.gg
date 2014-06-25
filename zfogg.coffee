{ready, app, indexRoute} = require "./server"


ready.then ->
  main = require "./server/main"

  # API Routes
  app.get  "/api/zfogg", main.zfogg
  app.get  "/api/yo",    main.yo

  # Angular Routes
  app.get "/",              indexRoute
  app.get "/thing/gravity", indexRoute

  # 404
  app.get "/404", indexRoute

  app.get "/*", [(req, res, next) ->
    res.status 404
    next() # Let angular figure out the 404 view.
  , indexRoute]


ready.done()

