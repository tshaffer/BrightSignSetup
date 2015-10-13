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
                          src: ['*.brs'],            // Actual pattern(s) to match.
                          dest: 'staging/',                // Destination path prefix.
                        },

                        {
                          expand: true,                 // Enable dynamic expansion.
                          cwd: 'src/device/js/',        // Src matches are relative to this path.
                          src: ['*.js'],             // Actual pattern(s) to match.
                          dest: 'staging/deviceWebSite/js',// Destination path prefix.
                        },

                        {
                          expand: true,                 // Enable dynamic expansion.
                          cwd: 'src/webapp/js/',        // Src matches are relative to this path.
                          src: ['*.js'],             // Actual pattern(s) to match.
                          dest: 'staging/webSite/js',      // Destination path prefix.
                        },

                        {src: 'src/common/index.html', dest: 'staging/webSite/index.html'},
                        {src: 'src/common/index.html', dest: 'staging/deviceWebSite/index.html'},

                        {
                          expand: true,                 // Enable dynamic expansion.
                          cwd: 'src/common/js/',        // Src matches are relative to this path.
                          src: ['*.js'],             // Actual pattern(s) to match.
                          dest: 'staging/deviceWebSite/js',      // Destination path prefix.
                        },

                        {
                          expand: true,                 // Enable dynamic expansion.
                          cwd: 'src/common/js/',        // Src matches are relative to this path.
                          src: ['*.js'],             // Actual pattern(s) to match.
                          dest: 'staging/webSite/js',      // Destination path prefix.
                        },

                        {
                          expand: true,                 // Enable dynamic expansion.
                          cwd: 'src/common/css/',        // Src matches are relative to this path.
                          src: ['*.css'],             // Actual pattern(s) to match.
                          dest: 'staging/deviceWebSite/css',      // Destination path prefix.
                        },

                        {
                          expand: true,                 // Enable dynamic expansion.
                          cwd: 'src/common/css/',        // Src matches are relative to this path.
                          src: ['*.css'],             // Actual pattern(s) to match.
                          dest: 'staging/webSite/css',      // Destination path prefix.
                        },


                        // Bootstrap - deviceWebSite
                        {
                          expand: true,                 // Enable dynamic expansion.
                          cwd: 'src/common/bootstrap/',        // Src matches are relative to this path.
                          src: ['**/*.*'],             // Actual pattern(s) to match.
                          dest: 'staging/deviceWebSite/bootstrap/',      // Destination path prefix.
                        },

                        {
                          expand: true,                 // Enable dynamic expansion.
                          cwd: 'src/common/bootstrap/',        // Src matches are relative to this path.
                          src: ['**/*.*'],             // Actual pattern(s) to match.
                          dest: 'staging/webSite/bootstrap/',      // Destination path prefix.
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