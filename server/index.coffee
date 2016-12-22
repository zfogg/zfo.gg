express   = require "express"
st        = require "st"
morgan    = require "morgan"


exports.NODE_ENV   = NODE_ENV   = process.env.NODE_ENV   or "development"
exports.PORT       = PORT       = process.env.PORT       or 8000
exports.HOSTNAME   = HOSTNAME   = process.env.HOSTNAME   or "localhost"
exports.CACHE_TIME = CACHE_TIME = process.env.CACHE_TIME or (if NODE_ENV == "production" then 86400000 else 0)
exports.CWD        = CWD        = process.cwd() or __dirname
exports.app        = app        = express()
exports.server     = server     = require("http").createServer app
exports.ready      = ready      = require("bluebird").defer()

exports.index = index = (req, res) ->
  res.sendFile "#{CWD}/public/index.html"


# static assets
ST_CACHE = content:
  max:    1024*1024*64 # memory usage
  maxAge: CACHE_TIME   # 'Cache-Control' header

app.use st
  path:        "#{CWD}/public"
  index:       'index.html'
  passthrough: true
  cache:       ST_CACHE

app.use st
  path:        "#{CWD}/components/fontawesome/fonts"
  url:         "fonts/"
  passthrough: true
  cache:       ST_CACHE

app.use st
  path:        "#{CWD}/components/typopro-web/web/TypoPRO-Aleo"
  url:         "fonts/"
  passthrough: false
  cache:       ST_CACHE


exports.afterRoutes = ->
  if NODE_ENV == "development"
    app.use require("errorhandler")()
    app.use morgan "dev"
    app.use st path: "#{CWD}/.tmp",       passthrough: false, cache: ST_CACHE, url: "/"
    app.use st path: "#{CWD}/components", passthrough: false, cache: ST_CACHE, url: "components/"
    app.use st path: "#{CWD}/client",     passthrough: false, cache: ST_CACHE, url: "/"

  if NODE_ENV == "production"
    app.use morgan 'status=:status :method ":url" ":referrer" :remote-addr',
      skip: (req, res) -> res.statusCode < 400
    app.use require("compression")()


server.listen PORT, HOSTNAME, ->
  app.set('x-powered-by', false)
  app.set('etag',         'strong')
  console.log   "\tserver.listen:"
  console.log "\t\tNODE_ENV=%s", NODE_ENV
  console.log "\t\t%s:%d", HOSTNAME, PORT
  console.log   "\t"
  ready.resolve()
