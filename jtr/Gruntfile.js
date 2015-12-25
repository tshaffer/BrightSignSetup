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

            copyRemoteIndex: {
                files: [
                    {
                        src: 'src/angularRemoteWebSite/index.html',
                        dest: 'staging/remoteWebSite/index.html'
                    },
                ]
            },

            copyRemoteApp: {
                files: [
                    {
                        src: 'src/angularRemoteWebSite/app.js',
                        dest: 'staging/remoteWebSite/app.js'
                    },
                ]
            },

            copyRemoteCgRecordingsMgr: {
                files: [
                    {
                        expand: true,                                               // Enable dynamic expansion.
                        cwd: 'src/angularRemoteWebSite/cgRecordingsMgr/',           // Src matches are relative to this path.
                        src: ['*.*'],                                               // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/cgRecordingsMgr',              // Destination path prefix.
                    },
                ]
            },

            copyRemoteChannelGuide: {
                files: [
                    {
                        expand: true,                                               // Enable dynamic expansion.
                        cwd: 'src/angularRemoteWebSite/channelGuide/',           // Src matches are relative to this path.
                        src: ['*.*'],                                               // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/channelGuide',              // Destination path prefix.
                    },
                ]
            },

            copyRemoteFooter: {
                files: [
                    {
                        expand: true,                                               // Enable dynamic expansion.
                        cwd: 'src/angularRemoteWebSite/footer/',           // Src matches are relative to this path.
                        src: ['*.*'],                                               // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/footer',              // Destination path prefix.
                    },
                ]
            },

            copyRemoteJS: {
                files: [
                    {
                        expand: true,                                               // Enable dynamic expansion.
                        cwd: 'src/angularRemoteWebSite/js/',           // Src matches are relative to this path.
                        src: ['*.*'],                                               // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/js',              // Destination path prefix.
                    },
                ]
            },

            copyRemoteManualRecord: {
                files: [
                    {
                        expand: true,                                               // Enable dynamic expansion.
                        cwd: 'src/angularRemoteWebSite/manualRecord/',           // Src matches are relative to this path.
                        src: ['*.*'],                                               // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/manualRecord',              // Destination path prefix.
                    },
                ]
            },

            copyRemoteRecordings: {
                files: [
                    {
                        expand: true,                                               // Enable dynamic expansion.
                        cwd: 'src/angularRemoteWebSite/recordings/',           // Src matches are relative to this path.
                        src: ['*.*'],                                               // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/recordings',              // Destination path prefix.
                    },
                ]
            },

            copyRemoteRecordNow: {
                files: [
                    {
                        expand: true,                                               // Enable dynamic expansion.
                        cwd: 'src/angularRemoteWebSite/recordNow/',           // Src matches are relative to this path.
                        src: ['*.*'],                                               // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/recordNow',              // Destination path prefix.
                    },
                ]
            },

            copyRemoteScheduledRecordings: {
                files: [
                    {
                        expand: true,                                               // Enable dynamic expansion.
                        cwd: 'src/angularRemoteWebSite/scheduledRecordings/',           // Src matches are relative to this path.
                        src: ['*.*'],                                               // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/scheduledRecordings',              // Destination path prefix.
                    },
                ]
            },

            copyRemoteSettings: {
                files: [
                    {
                        expand: true,                                               // Enable dynamic expansion.
                        cwd: 'src/angularRemoteWebSite/settings/',           // Src matches are relative to this path.
                        src: ['*.*'],                                               // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/settings',              // Destination path prefix.
                    },
                ]
            },

            //lib
            //css

            copyCommonIndex: {
                files: [
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

            copyCSS: {
                files: [
                    {
                        expand: true,                 // Enable dynamic expansion.
                        cwd: 'src/angularRemoteWebSite/css/',        // Src matches are relative to this path.
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
                        cwd: 'bower_components/angular/',      // Src matches are relative to this path.
                        src: ['angular.js'],                   // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/lib',                        // Destination path prefix.
                    },

                    {
                        expand: true,                               // Enable dynamic expansion.
                        cwd: 'bower_components/angular-route/',      // Src matches are relative to this path.
                        src: ['angular-route.min.js'],                   // Actual pattern(s) to match.
                        dest: 'staging/remoteWebSite/lib',                        // Destination path prefix.
                    },

                    {
                        expand: true,                               // Enable dynamic expansion.
                        cwd: 'bower_components/angular-bootstrap/',      // Src matches are relative to this path.
                        src: ['ui-bootstrap-tpls.js'],                   // Actual pattern(s) to match.
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
            remoteIndexFile: {
                files: ["src/angularRemoteWebSite/index.html"],
                tasks: ['copy:copyRemoteIndex']
            },
            remoteAppFile: {
                files: ["src/angularRemoteWebSite/app.js"],
                tasks: ['copy:copyRemoteApp']
            },
            remoteCGRecordingsMgrFiles: {
                files: ["src/angularRemoteWebSite/cgRecordingsMgr/**"],
                tasks: ['copy:copyRemoteCgRecordingsMgr']
            },
            remoteChannelGuideFiles: {
                files: ["src/angularRemoteWebSite/channelGuide/**"],
                tasks: ['copy:copyRemoteChannelGuide']
            },
            remoteFooterFiles: {
                files: ["src/angularRemoteWebSite/footer/**"],
                tasks: ['copy:copyRemoteFooter']
            },
            remoteJSFiles: {
                files: ["src/angularRemoteWebSite/js/**"],
                tasks: ['copy:copyRemoteJS']
            },
            remoteManualRecordFiles: {
                files: ["src/angularRemoteWebSite/manualRecord/**"],
                tasks: ['copy:copyRemoteManualRecord']
            },
            remoteRecordingsFiles: {
                files: ["src/angularRemoteWebSite/recordings/**"],
                tasks: ['copy:copyRemoteRecordings']
            },
            remoteRecordNowFiles: {
                files: ["src/angularRemoteWebSite/recordNow/**"],
                tasks: ['copy:copyRemoteRecordNow']
            },
            remoteScheduledRecordingsFiles: {
                files: ["src/angularRemoteWebSite/scheduledRecordings/**"],
                tasks: ['copy:copyRemoteScheduledRecordings']
            },
            remoteSettingsFiles: {
                files: ["src/angularRemoteWebSite/settings/**"],
                tasks: ['copy:copyRemoteSettings']
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
            cssFiles: {
                files: ["src/common/css/*.css","src/angularRemoteWebSite/css/*.css","src/deviceWebSite/css/*.css","src/deviceWebSite/css/*.less"],
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