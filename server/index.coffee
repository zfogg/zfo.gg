express   = require "express"
st        = require "st"


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


# RegExp(/.*/).test(NODE_ENV)
app.use st
  path:        "#{CWD}/public"
  url:         "/"
  index:       'index.html'
  passthrough: true
  cache:
    content:
      max:    1024*1024*64 # memory usage
      maxAge: CACHE_TIME   # 'Cache-Control' header

app.use st
  path:        "#{CWD}/components/fontawesome/fonts"
  url:         "fonts/"
  passthrough: true

app.use st
  path:        "#{CWD}/components/typopro-web/web/TypoPRO-Aleo"
  url:         "fonts/"


if NODE_ENV == "development"
  app.use require("errorhandler")()
  cacheControl = (req, res, next) ->
    if not res.getHeader "Cache-Control"
      res.setHeader "Cache-Control", "max-age=0, no-cache, no-store, must-revalidate"
      res.setHeader "Expires"      , 0
      res.setHeader "Pragma"       , "no-cache"
    next()
  app.use cacheControl
  app.use st {path: "#{CWD}/.tmp",                  cache: false, passthrough: true}
  app.use st {path: "#{CWD}/components" , url: "components/"}
  app.use st {path: "#{CWD}/client",                cache: false, passthrough: true}


if NODE_ENV == "production"
  cacheControl = (req, res, next) ->
    if not res.getHeader "Cache-Control"
      res.setHeader "Cache-Control", "public, max-age=#{CACHE_TIME}"
      res.setHeader "Expires"      , CACHE_TIME
      res.setHeader "Pragma"       , "cache"
    next()
  app.use cacheControl
  app.use require("compression")()


app.use require('body-parser').json()


server.listen PORT, ->
  console.log   "\tserver.listen:"
  console.log "\t\tNODE_ENV=%s", NODE_ENV
  console.log "\t\t%s:%d", HOSTNAME, PORT
  console.log   "\t"
  ready.resolve()
