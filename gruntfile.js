/*jshint node:true */

'use strict';

var bowerFile = require('./bower.json');

module.exports = function(grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Configurable paths
    var configPaths = {
        src: 'src',
        bowerComponents: 'bower_components',
        dist: 'dist',
        doc: 'doc',
        test: 'test',
        testsConfig: 'config/test',
        reports: 'reports'
    };

    // If app path is defined in bower.json, use it
    try {
        configPaths.src = bowerFile.appPath || configPaths.src;
    } catch (e) {}

    // Start Grunt config definition
    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        // Project settings
        appverse: configPaths,

        maven: {
            options: {
                goal: 'install',
                groupId: 'org.appverse.web.framework.modules.frontend.html5',
                repositoryId: 'my-nexus',
                releaseRepository: 'url'

            },
            'install-src': {
                options: {
                    classifier: 'sources'
                },
                files: [{
                    expand: true,
                    cwd: '<%= appverse.src %>/',
                    src: ['**', '!bower_components/**'],
                    dest: '.'
                }]
            },
            'install-min': {
                options: {
                    classifier: 'min'
                },
                files: [{
                    expand: true,
                    cwd: '<%= appverse.dist %>/',
                    src: ['**'],
                    dest: '.'
                }]
            },
            'deploy-src': {
                options: {
                    goal: 'deploy',
                    url: '<%= releaseRepository %>',
                    classifier: 'sources'
                },
                files: [{
                    expand: true,
                    cwd: '<%= appverse.src %>/',
                    src: ['**', '!bower_components/**'],
                    dest: '.'
                }]
            },
            'deploy-min': {
                options: {
                    goal: 'deploy',
                    url: '<%= releaseRepository %>',
                    classifier: 'min'
                },
                files: [{
                    expand: true,
                    cwd: '<%= appverse.dist %>/',
                    src: ['**'],
                    dest: '.'
                }]
            }
        },

        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= appverse.dist %>/**',
                        '!<%= appverse.dist %>/.git*'
                    ]
                }]
            },
            reports: '<%= appverse.reports %>',
            server: '.tmp',
            doc: 'doc/' + bowerFile.version
        },

        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish'),
                //Show failures but do not stop the task
                force: true
            },
            all: [
                '<%= appverse.src %>/{,*/}*.js'
            ]
        },

        // concatenate source files
        concat: {

            // Concatenate all files for a module in a single module file
            modules: {
                files: [
                    '<%= appverse.src %>/**/module.js',
                    '<%= appverse.src %>/**'
                ]
            },

            // Concatenate all modules into a full distribution
            dist: {
                src: [
                    '<%= appverse.dist %>/*/*.js',
                ],
                dest: '<%= appverse.dist %>/appverse-html5-core.js',
            },
        },

        // ng-annotate tries to make the code safe for minification automatically
        // by using the Angular long form for dependency injection.
        ngAnnotate: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= appverse.dist %>',
                    src: ['**/*.js', '!oldieshim.js'],
                    dest: '<%= appverse.dist %>',
                    extDot: 'last'
                }]
            }
        },

        // Uglifies already concatenated files
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - */',
                sourceMap: true,
            },
            dist: {
                files: [{
                    expand: true, // Enable dynamic expansion.
                    cwd: '<%= appverse.dist %>', // Src matches are relative to this path.
                    src: ['**/*.js'], // Actual pattern(s) to match.
                    dest: '<%= appverse.dist %>', // Destination path prefix.
                    ext: '.min.js', // Dest filepaths will have this extension.
                    extDot: 'last' // Extensions in filenames begin after the last dot
                }]
            }
        },

        karma: {
            unit: {
                configFile: '<%= appverse.testsConfig %>/karma.unit.conf.js',
                autoWatch: false,
                singleRun: true
            },
            'unit:watch': {
                configFile: '<%= appverse.testsConfig %>/karma.unit.watch.conf.js',
                autoWatch: true
            }
        },

        bump: {
            options: {
                files: ['package.json', 'bower.json'],
                updateConfigs: [],
                commit: true,
                commitMessage: 'Release v%VERSION%',
                commitFiles: ['package.json', 'bower.json', 'dist'],
                createTag: true,
                tagName: 'v%VERSION%',
                tagMessage: 'Version %VERSION%',
                push: true,
                pushTo: 'origin',
                gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d'
            }
        },

        // Web server
        connect: {

            // General options
            options: {
                protocol: 'http',
                port: 9000,
                hostname: 'localhost'
            },

            // Docs
            doc: {
                options: {
                    port: 9999,
                    keepalive: true,
                    middleware: function(connect) {
                        return [
                            require('connect-modrewrite')(['!^/partials/api/.* /index.html [L]']),
                            mountFolder(connect, configPaths.doc),

                        ];
                    }
                }
            },
        },

        // Generate code analysis reports
        plato: {
            main: {
                options: {
                    jshint: grunt.file.readJSON('.jshintrc')
                },
                files: {
                    '<%= appverse.reports %>/analysis/': [
                        '<%= appverse.src %>/**/*.js',
                        '<%= appverse.test %>/unit/**/*.js'
                    ]
                }
            }
        },

        concurrent: {
            dist: ['jshint', 'unit', 'analysis']
        }
    });


    /*---------------------------------------- TASKS DEFINITION -------------------------------------*/


    // ------ Dist task. Builds the project -----

    grunt.registerTask('default', [
        'dist'
    ]);

    grunt.registerTask('dist', [
        'concurrent:dist'
    ]);

    grunt.registerTask('dist:make', [
        'clean:dist',
        'concat',
        'ngAnnotate',
        'uglify'
    ]);

    // ------ Tests tasks -----

    grunt.registerTask('test', [
        'test:unit'
    ]);

    grunt.registerTask('test:unit:watch', [
        'karma:unit:watch'
    ]);

    grunt.registerTask('test:unit', [
        'karma:unit'
    ]);

    grunt.registerTask('doc', [
        'clean:doc',
        'docgen'
    ]);

    grunt.registerTask('docgen', 'Generates docs', require('./config/grunt-tasks/docgen/grunt-task'));


    // ------ Analysis tasks. Runs code analysis -----

    grunt.registerTask('analysis', ['plato']);


    // ------ Deployment tasks -----

    grunt.registerTask('install', [
        'clean',
        'maven:install-src',
        'dist',
        'maven:install-min'
    ]);

    grunt.registerTask('deploy', [
        'clean',
        'maven:deploy-src',
        'dist',
        'maven:deploy-min'
    ]);

    // -------- Special task for websockets demo ---------

    grunt.registerTask('wsserver', 'Start a new web socket demo server', function() {

        var http = require('http');
        var CpuUsage = require('./config/grunt-tasks/cpu-usage');
        var server = http.createServer(function handler() {});

        // Never end grunt task
        this.async();

        server.listen(8080, function() {
            console.log('Websockets Server is listening on port 8080');
        });

        var WebSocketServer = require('websocket').server;

        var wsServer = new WebSocketServer({
            httpServer: server,
            autoAcceptConnections: false
        });

        var cpuUsage = new CpuUsage();

        wsServer.on('request', function(request) {
            var connection = request.accept('', request.origin);
            console.log(' Connection accepted from peer ' + connection.remoteAddress);

            var sendInterval = setInterval(function() {
                var payLoad = (cpuUsage.get() * 100).toFixed(0);
                connection.sendUTF(payLoad);
            }, 100);

            connection.on('close', function(reasonCode, description) {
                clearInterval(sendInterval);
                console.log('Peer ' + connection.remoteAddress + ' disconnected.');
                console.log('Closing Reason: ' + reasonCode);
                console.log('Closing Description: ' + description);
            });
        });

    });

};

/*---------------------------------------- HELPER METHODS -------------------------------------*/

function mountFolder(connect, dir, options) {
    return connect.static(require('path').resolve(dir), options);
}
