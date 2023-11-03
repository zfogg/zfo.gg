module.exports = (grunt) ->

  require("load-grunt-tasks") grunt

  if process.env.NODE_ENV != 'production'
    require("time-grunt") grunt


  grunt.initConfig
    zfogg:

      app:   "client"
      srv:   "server"

      tmp:   ".tmp"
      dist:  "public"



    prettify:
      dist:
        expand: true
        cwd:  "<%= zfogg.dist %>"
        src:  ["**/*.html", "!components/**/*.html"]
        dest: "<%= zfogg.dist %>"


    clean:
      dist:
        files: [
          dot: false
          src: [
            "<%= zfogg.tmp %>/*"
            "<%= zfogg.dist %>/*"
            ".sass-cache"
            "!now.json"
            "!.now/*"
          ]
        ]


    pug:
      index:
        expand: true
        cwd:    "<%= zfogg.app %>"
        src:    [ "index.pug" ]
        dest:   "<%= zfogg.dist %>"
        ext:    ".html"
      templates:
        expand: true
        cwd:    "<%= zfogg.app %>"
        src:    [ "**/*.pug", "!index.pug" ]
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
        assetCacheBuster:        true

      prod: options: debugInfo: false
      dev:  options: debugInfo: true


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
        src:  ["**/*.js", "!concat/**", "!gravity/barnes-hut/*",  "!gravity/canvas-*.js"]
        dest: "<%= zfogg.tmp %>"


    ngAnnotate:
      dist:
        expand: true
        cwd:  "<%= zfogg.tmp %>"
        src:  ["**/*.js", "!concat/**", "!gravity/barnes-hut/*",  "!gravity/canvas-*.js"]
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
      concat_dist:
        expand: true
        cwd: "<%= zfogg.tmp %>/concat"
        dest: "<%= zfogg.dist %>"
        src: [
          "scripts/*.js",
        ]
      fontawesome_dist:
        expand: true
        cwd: "<%= zfogg.dist %>/components/fontawesome/fonts"
        dest: "<%= zfogg.dist %>/fonts"
        src: [
          "*",
        ]
      sitemap_dist:
        expand: true
        cwd: ""
        dest: "<%= zfogg.dist %>/sitemap.xml"
        src: [
          "sitemap.xml",
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
        "pug"
        "compass:prod"
        "coffee:dist"
        "copy:tmp"
      ]
      dist2: [
        #"ngmin"
        #"ngAnnotate"
        "autoprefixer"
      ]
      dist3: [
        "copy:app_dist"
        "copy:concat_dist"
        "copy:components_dist"
        "copy:fontawesome_dist"
        "inject:googleAnalytics"
      ]


    ngtemplates:
      zfogg:
        cwd:  "<%= zfogg.tmp %>"
        src:  [ "**/*.html", "!index.html" ]
        dest: "<%= zfogg.dist %>/scripts/templates.js"
        options:
          usemin: "scripts/main.js"



  grunt.registerTask "build", [
    #"clean"
    "concurrent:dist1"
    "prettify"
    "useminPrepare"
    "concurrent:dist2"
    #"ngAnnotate"
    "ngtemplates"
    "concat:generated"
    "cssmin:generated"
    #"uglify:generated"
    "usemin"
    "concurrent:dist3"
    #"usebanner"
  ]


  grunt.registerTask "default", [
    "build"
  ]
