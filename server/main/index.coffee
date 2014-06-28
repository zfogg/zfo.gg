path = require "path"

{io} = require "../"

Firebase = require("firebase")
ref      = new Firebase("https://yohacks.firebaseio.com/")


exports.zfogg = (req, res) ->
  res.json
    zfogg: true


exports.yo = (req, res) ->
  io.sockets.emit "yo", req.query["username"]
  res.send 200


exports.yoFirebase = (req, res) ->
  ref
    .child(req.params.yoAppAccount)
    .set(req.query["username"])
  res.send 200
