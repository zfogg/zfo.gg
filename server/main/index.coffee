path = require "path"

{io} = require "../"


exports.zfogg = (req, res) ->
  res.json
    zfogg: true


exports.yo = (req, res) ->
  io.sockets.emit "yo", req.query["username"]
  res.send 200

