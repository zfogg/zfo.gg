#!/usr/bin/env zsh -e

# FIXME: temporary build static in './o' dir
# FIXME: shit's broken lol.. move from grunt to at LEAST gulp
# FIXME: this builds the dev version
# FIXME: routing is broken.. index.html is symlinked around in ./o/ lol.. 404ing doesn't work


./node_modules/.bin/grunt concurrent:dist1 prettify useminPrepare ngtemplates concat:generated cssmin:generated usemin concurrent:dist3 pug prettify

cp -r ./.tmp/* ./o
cp -r ./components ./o
cp -r ./public/{index.html,robots.txt,keybase.txt,favicon.ico,fonts} ./o

mkdir -p ./o/thing/gravity
cp ./o/index.html ./o/thing/gravity/index.html
