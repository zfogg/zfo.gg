path    = require "path"

express = require "express"

q       = require "q"


exports.app    = app    = express()
exports.server = server = require("http").createServer app


exports.cacheTime = cacheTime = 86400000

staticDir = (p) ->
  express.static path.join(__dirname, p),
    maxAge: cacheTime
    redirect: false


app.configure "development", ->
  app.use require("connect-livereload")()
  app.use express.errorHandler()
  app.use express.logger "dev"

  app.use                staticDir "../.tmp"
  app.use "/components", staticDir "../components"
  app.use                staticDir "../client"


app.configure "production", ->
  app.use (req, res, next) ->
    res.setHeader "Cache-Control", "public, max-age=#{cacheTime}"
    res.setHeader "Expires"      , cacheTime
    res.setHeader "Pragma"       , "cache"
    next()

  app.use express.compress()


app.configure ->
  app.use staticDir "../public"

  app.use (req, res, next) ->
    res.setHeader "Cache-Control", "max-age=0, no-cache, no-store, must-revalidate"
    res.setHeader "Expires"      , 0
    res.setHeader "Pragma"       , "no-cache"
    next()

  app.use express.urlencoded()
  app.use express.methodOverride()
  app.use express.json()

  app.use app.router


# Start server
ready = q.defer()


app.configure "production", ->
  port = process.env.PORT or 8000
  console.log "localhost:#{port}"
  server.listen port, ->
    console.log "Listening on port %d in %s mode", port, app.get("env")
    ready.resolve()


exports.ready = ready.promise


exports.indexRoute = (req, res) ->
  res.sendfile path.resolve "#{__dirname}/../public/index.html"

