// Gruntfile.js

// our wrapper function (required by grunt and its plugins)
// all configuration goes inside this function
module.exports = function(grunt) {

  // ===========================================================================
  // CONFIGURE GRUNT ===========================================================
  // ===========================================================================
  grunt.initConfig({

    // get the configuration info from package.json ----------------------------
    // this way we can use things like name and version (pkg.name)
    pkg: grunt.file.readJSON('package.json'),

        copy: {
            main: {


                files: [
                    {
                      expand: true,                 // Enable dynamic expansion.
                      cwd: 'src/brs/',              // Src matches are relative to this path.
                      src: ['*.brs'],               // Actual pattern(s) to match.
                      dest: 'staging/',             // Destination path prefix.
                    },

                    {
                        expand: true,                               // Enable dynamic expansion.
                        cwd: 'bower_components/jquery/dist/',      // Src matches are relative to this path.
                        src: ['jquery.min.js'],                   // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/lib',                        // Destination path prefix.
                    },

                    {
                        expand: true,                               // Enable dynamic expansion.
                        cwd: 'bower_components/handlebars/',      // Src matches are relative to this path.
                        src: ['handlebars.js'],                   // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/lib',                        // Destination path prefix.
                    },

                    {
                        expand: true,                               // Enable dynamic expansion.
                        cwd: 'bower_components/underscore/',      // Src matches are relative to this path.
                        src: ['underscore-min.js'],                   // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/lib',                        // Destination path prefix.
                    },

                    {
                        expand: true,                               // Enable dynamic expansion.
                        cwd: 'bower_components/backbone-amd/',      // Src matches are relative to this path.
                        src: ['backbone-min.js'],                   // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/lib',                        // Destination path prefix.
                    },

                    {
                        expand: true,                 // Enable dynamic expansion.
                        cwd: 'bower_components/bootstrap/dist/',        // Src matches are relative to this path.
                        src: ['**/*.*'],             // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/lib/bootstrap',                        // Destination path prefix.
                    },

                    {
                        expand: true,                               // Enable dynamic expansion.
                        cwd: 'bower_components/DateJS/build/',      // Src matches are relative to this path.
                        src: ['date.js'],                   // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/lib',                        // Destination path prefix.
                    },

                    {
                        expand: true,                               // Enable dynamic expansion.
                        cwd: 'bower_components/requirejs/',      // Src matches are relative to this path.
                        src: ['require.js'],                   // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/lib',                        // Destination path prefix.
                    },

                    {
                        src: 'src/common/index.html',
                        dest: 'staging/remoteWebSite/index.html'
                    },

                    {
                        expand: true,                 // Enable dynamic expansion.
                        cwd: 'src/common/js/',        // Src matches are relative to this path.
                        src: ['*.js'],             // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/js',      // Destination path prefix.
                    },

                    {
                        src: 'src/remoteWebSite/js/remoteWebSiteInterface.js',
                        dest: 'staging/remoteWebSite/js/hostInterface.js'
                    },

                    {
                        expand: true,                 // Enable dynamic expansion.
                        cwd: 'src/common/css/',        // Src matches are relative to this path.
                        src: ['*.css'],             // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/css',      // Destination path prefix.
                    },

                    {
                        src: 'src/common/index.html',
                        dest: 'staging/deviceWebSite/index.html'
                    },

                    {
                        expand: true,                 // Enable dynamic expansion.
                        cwd: 'src/common/js/',        // Src matches are relative to this path.
                        src: ['*.js'],             // Actual pattern(s) to match.
                        dest: 'staging/deviceWebSite/js',      // Destination path prefix.
                    },

                    {
                        src: 'src/deviceWebSite/js/deviceWebSiteInterface.js',
                        dest: 'staging/deviceWebSite/js/hostInterface.js'
                    },

                    {
                        expand: true,                 // Enable dynamic expansion.
                        cwd: 'src/common/css/',        // Src matches are relative to this path.
                        src: ['*.css'],             // Actual pattern(s) to match.
                        dest: 'staging/deviceWebSite/css',      // Destination path prefix.
                    },

                    {
                        expand: true,                 // Enable dynamic expansion.
                        cwd: 'src/remoteWebSite/js/',        // Src matches are relative to this path.
                        src: ['*.js'],             // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/js',      // Destination path prefix.
                    },

                    {
                        expand: true,                 // Enable dynamic expansion.
                        cwd: 'src/remoteWebSite/css/',        // Src matches are relative to this path.
                        src: ['*.css'],             // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/css',      // Destination path prefix.
                    },

                    {
                        expand: true,                 // Enable dynamic expansion.
                        cwd: 'src/remoteWebSite/css/',        // Src matches are relative to this path.
                        src: ['*.less'],             // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/css',      // Destination path prefix.
                    },

                    {
                        expand: true,                 // Enable dynamic expansion.
                        cwd: 'src/deviceWebSite/js/',        // Src matches are relative to this path.
                        src: ['*.js'],             // Actual pattern(s) to match.
                        dest: 'staging/deviceWebSite/js',      // Destination path prefix.
                    },

                    {
                        expand: true,                 // Enable dynamic expansion.
                        cwd: 'src/deviceWebSite/css/',        // Src matches are relative to this path.
                        src: ['*.css'],             // Actual pattern(s) to match.
                        dest: 'staging/deviceWebSite/css',      // Destination path prefix.
                    },

                    {
                        expand: true,                 // Enable dynamic expansion.
                        cwd: 'src/deviceWebSite/css/',        // Src matches are relative to this path.
                        src: ['*.less'],             // Actual pattern(s) to match.
                        dest: 'staging/deviceWebSite/css',      // Destination path prefix.
                    },

                    {
                        expand: true,                               // Enable dynamic expansion.
                        cwd: 'bower_components/jquery/dist/',      // Src matches are relative to this path.
                        src: ['jquery.min.js'],                   // Actual pattern(s) to match.
                        dest: 'staging/deviceWebSite/lib',                        // Destination path prefix.
                    },

                    {
                        expand: true,                               // Enable dynamic expansion.
                        cwd: 'bower_components/handlebars/',      // Src matches are relative to this path.
                        src: ['handlebars.js'],                   // Actual pattern(s) to match.
                        dest: 'staging/deviceWebSite/lib',                        // Destination path prefix.
                    },

                    {
                        expand: true,                               // Enable dynamic expansion.
                        cwd: 'bower_components/underscore/',      // Src matches are relative to this path.
                        src: ['underscore-min.js'],                   // Actual pattern(s) to match.
                        dest: 'staging/deviceWebSite/lib',                        // Destination path prefix.
                    },

                    {
                        expand: true,                               // Enable dynamic expansion.
                        cwd: 'bower_components/backbone-amd/',      // Src matches are relative to this path.
                        src: ['backbone-min.js'],                   // Actual pattern(s) to match.
                        dest: 'staging/deviceWebSite/lib',                        // Destination path prefix.
                    },

                    {
                        expand: true,                 // Enable dynamic expansion.
                        cwd: 'bower_components/bootstrap/dist/',        // Src matches are relative to this path.
                        src: ['**/*.*'],             // Actual pattern(s) to match.
                        dest: 'staging/deviceWebSite/lib/bootstrap',                        // Destination path prefix.
                    },

                    {
                        expand: true,                               // Enable dynamic expansion.
                        cwd: 'bower_components/DateJS/build/',      // Src matches are relative to this path.
                        src: ['date.js'],                   // Actual pattern(s) to match.
                        dest: 'staging/deviceWebSite/lib',                        // Destination path prefix.
                    },

                    {
                        expand: true,                               // Enable dynamic expansion.
                        cwd: 'bower_components/requirejs/',      // Src matches are relative to this path.
                        src: ['require.js'],                   // Actual pattern(s) to match.
                        dest: 'staging/deviceWebSite/lib',                        // Destination path prefix.
                    },
                ]
            }
        }


  });

  grunt.registerTask('default', ['copy']);

    // ===========================================================================
  // LOAD GRUNT PLUGINS ========================================================
  // ===========================================================================
  // we can only load these if they are in our package.json
  // make sure you have run npm install so our app can find these
  grunt.loadNpmTasks('grunt-contrib-copy');

};