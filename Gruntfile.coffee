module.exports = (grunt) ->

  require("load-grunt-tasks") grunt

  require("time-grunt") grunt


  grunt.initConfig
    zfogg:

      app:   "client"
      srv:   "server"

      tmp:   ".tmp"
      dist:  "public"


    express:
      options:
        cmd: "/usr/bin/coffee"

      dev:
        options:
          script: "zfogg.coffee"
          node_env: "development"
          port: process.env.PORT or 8000

      prod:
        options:
          script: "zfogg.coffee"
          node_env: "production"
          port: process.env.PORT or 80


    prettify:
      dist:
        expand: true
        cwd:  "<%= zfogg.dist %>"
        src:  "**/*.html"
        dest: "<%= zfogg.dist %>"

    watch:
      views_templates:
        files: [
          "<%= zfogg.app %>/**/*.jade",
          "!<%= zfogg.app %>/index.jade"
        ]
        tasks: [ "newer:jade:templates" ]
      views_index:
        files: [ "<%= zfogg.app %>/index.jade" ]
        tasks: [ "newer:jade:index" ]

      scripts:
        files: ["<%= zfogg.app %>/**/*.coffee"]
        tasks: ["newer:coffee:dist"]

      styles:
        files: ["<%= zfogg.app %>/**/*.sass"]
        tasks: [ "compass:dev", "autoprefixer" ]

      livereload_css:
        options: livereload: true
        files: [ "<%= zfogg.tmp %>/**/*.css" ]

      livereload_else:
        options: livereload: true
        files: [
          "<%= zfogg.dist %>/index.html"
          "<%= zfogg.tmp %>/**/*.html"
          "<%= zfogg.tmp %>/**/*.js"
        ]

      express:
        files: [ "<%= zfogg.srv %>/**/*.coffee", "zfogg.coffee" ]
        tasks: ["express:dev"]
        options:
          livereload: true
          nospawn:    true

      css:
        files: ["<%= zfogg.app %>/**/*.css"]
        tasks: [ "newer:copy:tmp", "autoprefixer" ]

      gruntfile: files: ["Gruntfile.{js,coffee}"]


    clean:
      dist:
        files: [
          dot: true
          src: [
            "<%= zfogg.tmp %>/*"
            "<%= zfogg.dist %>/*"
          ]
        ]


    jade:
      index:
        expand: true
        cwd:    "<%= zfogg.app %>"
        src:    [ "index.jade" ]
        dest:   "<%= zfogg.dist %>"
        ext:    ".html"
      templates:
        expand: true
        cwd:    "<%= zfogg.app %>"
        src:    [ "**/*.jade", "!index.jade" ]
        dest:   "<%= zfogg.tmp %>"
        ext:    ".html"


    autoprefixer:
      options: browsers: ["last 1 version"]
      dist:
        expand: true
        cwd:    "<%= zfogg.tmp %>"
        src:    [ "**/*.css" ]
        dest:   "<%= zfogg.tmp %>"


    coffee:
      dist:
        options: sourceMap: false
        files: [
          expand: true
          cwd:  "<%= zfogg.app %>"
          src:  "**/*.coffee"
          dest: "<%= zfogg.tmp %>"
          ext: ".js"
        ]
      dev:
        options:
          sourceMap: true
          sourceRoot: ""
        files: "<%= coffee.dist.files %>"


    compass:
      options:
        sassDir:                 "<%= zfogg.app %>"
        cssDir:                  "<%= zfogg.tmp %>"
        imagesDir:               "<%= zfogg.app %>"
        javascriptsDir:          "<%= zfogg.app %>"
        fontsDir:                "<%= zfogg.app %>"
        importPath:              "components"
        httpImagesPath:          "/images"
        httpFontsPath:           "/fonts"
        relativeAssets:          false
        assetCacheBuster:        false

      prod: options: debugInfo: false
      dev:  options: debugInfo: true
      watch:
        debugInfo: false
        watch:     true


    rev:
      dist:
        src: [
          "<%= zfogg.dist %>/**/*.js"
          "<%= zfogg.dist %>/**/*.css"
          "<%= zfogg.dist %>/**/*.{png,jpg,jpeg,gif,webp,svg}"
          "!<%= zfogg.dist %>/**/opengraph.png"
        ]


    useminPrepare:
      options: dest: "public"
      html: "<%= zfogg.dist %>/index.html"


    usemin:
      options: assetsDirs: "<%= zfogg.dist %>"
      html: [ "<%= zfogg.dist %>/**/*.html" ]
      css:  [ "<%= zfogg.dist %>/**/*.css" ]


    usebanner:
      options:
        position: "top"
        banner: require "./ascii"
      files:  [ "<%= zfogg.dist %>/index.html" ]


    ngmin:
      dist:
        expand: true
        cwd:  "<%= zfogg.tmp %>"
        src:  "**/*.js"
        dest: "<%= zfogg.tmp %>"


    copy:
      tmp:
        expand: true
        cwd:  "<%= zfogg.app %>"
        src:  [
          "**/*.css"
          "**/*.js"
        ]
        dest: "<%= zfogg.tmp %>"
      components_dist:
        expand: true
        src:  [ "components/**" ]
        dest: "<%= zfogg.dist %>"
      app_dist:
        expand: true
        cwd: "<%= zfogg.app %>"
        dest: "<%= zfogg.dist %>"
        src: [
          "*.{ico,txt}"
          "images/**/*"
          "fonts/**/*"
          "audio/**/*"
        ]


    inject:
      googleAnalytics:
        scriptSrc: "<%= zfogg.app %>/analytics.js"
        files:
          "<%= zfogg.dist %>/index.html": "<%= zfogg.dist %>/index.html"


    concurrent:
      dist1_dev: [
        "compass:dev"
        "coffee:dev"
        "copy:tmp"
      ]
      dist1: [
        "jade"
        "compass:prod"
        "coffee:dist"
        "copy:tmp"
      ]
      dist2: [
        "ngmin"
        "autoprefixer"
      ]
      dist3: [
        "copy:app_dist"
        "copy:components_dist"
        "inject:googleAnalytics"
      ]
      watch:
        options: logConcurrentOutput: true
        tasks: [
          "watch"
          "compass:watch"
        ]


    ngtemplates:
      zfogg:
        cwd:  "<%= zfogg.tmp %>"
        src:  [ "**/*.html", "!index.html" ]
        dest: "<%= zfogg.dist %>/scripts/templates.js"
        options:
          usemin: "scripts/main.js"



  grunt.registerTask "build", [
    "clean"

    "concurrent:dist1"

    "prettify"
    "useminPrepare"

    "concurrent:dist2"

    "ngtemplates"
    "concat:generated"

    "cssmin:generated"
    "uglify:generated"

    "usemin"

    "concurrent:dist3"
    "usebanner"
  ]


  grunt.registerTask "express-keepalive", -> @async()


  grunt.registerTask "serve", (target) ->
    if target is "dist"
      return grunt.task.run [
        "build"
        "express:prod"
        "express-keepalive"
      ]
    else
      return grunt.task.run [
        "clean"

        "jade"
        "concurrent:dist1_dev"

        "prettify"

        "autoprefixer"
        "useminPrepare"

        "concurrent:dist2"

        "express:dev"

        "concurrent:watch"
      ]


  grunt.registerTask "default", [
    "build"
  ]

