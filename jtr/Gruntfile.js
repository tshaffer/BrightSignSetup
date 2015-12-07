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

            copyBRS: {
                files: [
                    {
                        expand: true,                 // Enable dynamic expansion.
                        cwd: 'src/brs/',              // Src matches are relative to this path.
                        src: ['*.brs'],               // Actual pattern(s) to match.
                        dest: 'staging/',             // Destination path prefix.
                    },
                ]
            },

            copyCommonIndex: {
                files: [
                    {
                        src: 'src/common/index.html',
                        dest: 'staging/remoteWebSite/index.html'
                    },
                    {
                        src: 'src/common/index.html',
                        dest: 'staging/deviceWebSite/index.html'
                    },
                ]
            },

            copyCommonJS: {
                files: [
                    {
                        expand: true,                 // Enable dynamic expansion.
                        cwd: 'src/common/js/',        // Src matches are relative to this path.
                        src: ['*.js'],             // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/js',      // Destination path prefix.
                    },
                    {
                        expand: true,                 // Enable dynamic expansion.
                        cwd: 'src/common/js/',        // Src matches are relative to this path.
                        src: ['*.js'],             // Actual pattern(s) to match.
                        dest: 'staging/deviceWebSite/js',      // Destination path prefix.
                    },
                ]
            },

            copyDeviceWebSite: {
                files: [
                    {
                        src: 'src/deviceWebSite/js/deviceWebSiteInterface.js',
                        dest: 'staging/deviceWebSite/js/hostInterface.js'
                    },
                    {
                        expand: true,                 // Enable dynamic expansion.
                        cwd: 'src/deviceWebSite/js/',        // Src matches are relative to this path.
                        src: ['*.js'],             // Actual pattern(s) to match.
                        dest: 'staging/deviceWebSite/js',      // Destination path prefix.
                    },
                ]
            },

            copyRemoteWebSite: {
                files: [
                    {
                        src: 'src/remoteWebSite/js/remoteWebSiteInterface.js',
                        dest: 'staging/remoteWebSite/js/hostInterface.js'
                    },
                    {
                        expand: true,                 // Enable dynamic expansion.
                        cwd: 'src/remoteWebSite/js/',        // Src matches are relative to this path.
                        src: ['*.js'],             // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/js',      // Destination path prefix.
                    },
                ]
            },


            copyCSS: {
                files: [
                    {
                        expand: true,                 // Enable dynamic expansion.
                        cwd: 'src/common/css/',        // Src matches are relative to this path.
                        src: ['*.css'],             // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/css',      // Destination path prefix.
                    },
                    {
                        expand: true,                 // Enable dynamic expansion.
                        cwd: 'src/common/css/',        // Src matches are relative to this path.
                        src: ['*.css'],             // Actual pattern(s) to match.
                        dest: 'staging/deviceWebSite/css',      // Destination path prefix.
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
                ]
            },

            copyLibraries: {
                files: [
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
            },
        },

        watch: {
            brsFiles: {
                files: ["src/brs/*.brs"],
                tasks: ['copy:copyBRS']
            },
            commonIndexFiles: {
                files: ["src/common/index.html"],
                tasks: ['copy:copyCommonIndex']
            },
            commonJSFiles: {
                files: ["src/common/js/*.js"],
                tasks: ['copy:copyCommonJS']
            },
            deviceWebSiteFiles: {
                files: ["src/deviceWebSite/js/*.js"],
                tasks: ['copy:copyDeviceWebSite']
            },
            remoteWebSiteFiles: {
                files: ["src/remoteWebSite/js/*.js"],
                tasks: ['copy:copyRemoteWebSite']
            },
            cssFiles: {
                files: ["src/common/css/*.css","src/remoteWebSite/css/*.css","src/remoteWebSite/css/*.less","src/deviceWebSite/css/*.css","src/deviceWebSite/css/*.less"],
                tasks: ['copy:copyCSS']
            },
            libraryFiles: {
                files: ["bower_components/**"],
                tasks: ['copy:copyLibraries']
            },
        }

  });

  grunt.registerTask('default', ['copy', "watch"]);

    // ===========================================================================
  // LOAD GRUNT PLUGINS ========================================================
  // ===========================================================================
  // we can only load these if they are in our package.json
  // make sure you have run npm install so our app can find these
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
};