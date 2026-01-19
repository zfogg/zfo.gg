express   = require "express"
st        = require "st"
morgan    = require "morgan"
join      = require("path").join
bluebird  = require "bluebird"


defer = () ->
  resolve = null
  reject  = null
  promise = new Promise () ->
    resolve = arguments[0]
    reject  = arguments[1]
  resolve: resolve
  reject:  reject
  promise: promise


exports.NODE_ENV   = NODE_ENV   = process.env.NODE_ENV   or "development"
exports.PORT       = PORT       = process.env.PORT       or 8000
exports.HOSTNAME   = HOSTNAME   = process.env.HOSTNAME   or "localhost"
exports.CACHE_TIME = CACHE_TIME = process.env.CACHE_TIME or (if NODE_ENV == "production" then 86400000 else 0)
exports.CWD        = CWD        = process.cwd() or __dirname
exports.app        = app        = express()

server = null
if process.env.ORIGIN_CERT and process.env.ORIGIN_KEY
  exports.server     = server     = require("https").createServer({
    cert: process.env.ORIGIN_CERT,
    key:  process.env.ORIGIN_KEY,
    requestCert: true,
    rejectUnauthorized: false,
  }, app)
  console.log('HTTPS')
  console.log(process.env.ORIGIN_CERT)
  console.log(process.env.ORIGIN_KEY)
else
  exports.server     = server     = require("http").createServer app
  console.log('HTTP')

exports.index = index = (req, res) ->
  res.sendFile join CWD, "/client/dist/index.html"


# static assets
ST_CACHE = content:
  max:    1024*1024*64 # memory usage
  maxAge: CACHE_TIME   # 'Cache-Control' header


exports.staticRoutes = ->
  console.log "static routes"
  app.use st
    path:        join CWD, "/client/dist"
    index:       'index.html'
    passthrough: true
    cache:       ST_CACHE

  if NODE_ENV == "development"
    #console.log 'dev routes'
    app.use require("errorhandler")()
    app.use morgan "dev"

  if NODE_ENV == "production"
    app.use morgan 'status=:status :method ":url" ":referrer" :remote-addr',
      skip: (req, res) -> res.statusCode < 400
    app.use require("compression")()

  # In development, use Vite dev server (bun run dev) instead of Express serving client files


appServer = new Promise ->
  console.log("appServer listen")
  server.listen PORT, HOSTNAME, ->
    app.set('x-powered-by', false)
    app.set('etag',         'strong')
    console.log   "\tserver.listen:"
    console.log "\t\tNODE_ENV=%s", NODE_ENV
    console.log "\t\t%s:%d", HOSTNAME, PORT
    console.log   "\t"
