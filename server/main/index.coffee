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


yos = {}
ref.on "value", (snapshot) ->
  v = snapshot.val()
  if v
    yos = v
  else
    ref.set {}
    yos = {}

exports.yoFirebase = (req, res) ->
  yoapp    = req.params.yoAppAccount
  username = req.query["username"]

  if not yoapp of yos
    ref.child(yoapp).set {}
    yos[yoapp] = {}
    console.log "setting yoapp"
  if not username of yos[yoapp]
    ref.child(yoapp).child(username).set true
    yos[yoapp][username] = true
    console.log "setting username"

  yos[yoapp][username] = not yos[yoapp][username]
  bool = yos[yoapp][username]
  ref
    .child(yoapp)
    .child(username)
    .set(bool)
  res.send 200
