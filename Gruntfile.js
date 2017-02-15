var makeCRCTable = function () {
    var c;
    var crcTable = [];
    for (var n = 0; n < 256; n++) {
        c = n;
        for (var k = 0; k < 8; k++) {
            c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
    }
    return crcTable;
};

var crc32 = function (str) {
    var crcTable = makeCRCTable();
    var crc = 0 ^ (-1);

    for (var i = 0; i < str.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
    }

    return (crc ^ (-1)) >>> 0;
};

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    var cwd = "../web/";

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        sass: {
            dev: {
                options: {
                    httpPath: '/',
                    imagesDir: 'images',
                    javascriptsDir: 'js',
                    noLineComments: true,
                    environment: 'development'
                },
                files: [{
                    cwd: cwd + 'scss',
                    expand: true,
                    src: '*.scss',
                    dest: '../web/css/build',
                    ext: '.css'
                }]
            },
            production: {
                options: {
                    httpPath: '/',
                    imagesDir: 'images',
                    javascriptsDir: 'js',
                    noLineComments: true,
                    environment: 'production'
                }
            }
        },
        sass_globbing: {
            dev: {
                files: [
                    {dest: cwd + 'scss/imports/_partials.scss', src: cwd + 'scss/partials/**/*.scss'},
                    {dest: cwd + 'scss/imports/_mixins.scss', src: cwd + 'scss/mixins/*.scss'},
                ]
            }
        },
        postcss: {
            options: {
                map: false,
                processors: []
            },
            pack: {
                options: {
                    processors: [
                        require('css-mqpacker')({sort: true})
                    ]
                },
                files: [{
                    expand: true,
                    cwd: cwd + 'css/',
                    src: ['*.css'],
                    dest: cwd + 'css/',
                    ext: '.css'
                }]
            },
            prefix: {
                options: {
                    processors: [
                        require('autoprefixer')({browsers: ['> 1%', 'ie >= 7']})
                    ]
                },
                files: [{
                    expand: true,
                    cwd: cwd + 'css/',
                    src: ['*.css'],
                    dest: cwd + 'css/',
                    ext: '.css'
                }]
            },
            min: {
                options: {
                    processors: [
                        require('cssnano')({zindex: false})
                    ]
                },
                files: [{
                    expand: true,
                    cwd: cwd + 'css/',
                    src: ['*.css'],
                    dest: cwd + 'css/',
                    ext: '.css'
                }]
            }
        },
        autoprefixer: {
            options: {
                browsers: ['> 1%', 'ie >= 7']
            },
            prefix: {
                src: cwd + 'css/build/styles.css',
                dest: cwd + 'css/styles.css'
            }
        },
        css_mqpacker: {
            pack: {
                src: cwd + 'css/build/styles.css',
                dest: cwd + 'css/styles.css'
            }
        },
        copy: {
            main: {
                expand: true,
                cwd: cwd + 'css/build/',
                src: '*.css',
                dest: cwd + 'css/',
                flatten: true,
            }
        },
        concat: {
            options: {
                separator: ";\n"
            },
            js: {
                src: [
                    cwd + 'js/external/*.js',
                    cwd + 'js/build/*.js'
                ],
                dest: cwd + 'js/script.js',
                nonull: true
            }
        },
        uglify: {
            dev: {
                files: [{
                    expand: true,
                    src: cwd + 'js/script.js',
                    dest: cwd + 'js/script.js'
                }]
            },
            production: {
                options: {
                    compress: {
                        drop_console: true
                    }
                },
                files: [{
                    expand: true,
                    cwd: cwd,
                    src: 'js/script.js',
                    dest: cwd
                }]
            }
        },
        jshint: {
            options: {
                force: true
            },
            local: [cwd + 'js/build/*.js']
        },
        manifest: {
            generate: {
                options: {
                    basePath: cwd,
                    network: ["http://*", "https://*"],
                    fallback: ["/ /offline.html"],
                    exclude: [cwd + "js/jquery.min.js"],
                    preferOnline: false,
                    timestamp: true,
                    verbose: true
                },

                src: [
                    'js/*.js',
                    'css/*.css',
                    'images/**/*.png',
                    'images/**/*.jpg',
                    'images/**/*.gif'
                ],
                dest: cwd + "core.manifest"
            }
        },
        dataUri: {
            dist: {
                src: [cwd + '/css/*.css'],
                dest: cwd + '/css',
                options: {
                    target: [cwd + 'images/**/*.png'],
                    fixDirLevel: false, //true,
                    maxBytes: 2048,
                    baseDir: cwd
                }
            }
        },
        csssplit: {
            styles: {
                src: [cwd + 'css/styles.css'],
                dest: cwd + 'css/split/styles.css',
                options: {
                    maxSelectors: 4095,
                    maxPages: 3,
                    suffix: ''
                }
            },
        },
        watch: {
            sass: {
                files: [cwd + '/**/*.scss', '!' + cwd + 'scss/imports/*.scss'],
                tasks: ['sass_globbing', 'sass:dev']
            },
            css: {
                files: [cwd + 'css/build/*.css'],
                tasks: ['copy'],
                options: {
                }
            },
            js: {
                files: [
                    cwd + 'js/*/*.js'
                ],
                tasks: ['jshint', 'concat:js']
            },
            images: {
                files: [cwd + 'images/data/*.{png,jpg,gif,jpeg}'],
                tasks: ['css_images']
            }
        },
        clean: {
            build: {
                src: [
                    '.cache/*',
                    '!.cache/__css_vars.scss',
                    '**/.sass-cache',
                    'css/**/*',
                    '!css/styles.css',
                    '!css/styles.css.map',
                    '**/icons-*.afm'
                ]
            }
        }
    });

    grunt.registerTask('sass_compile', ['sass_globbing', 'sass:dev']);
    grunt.registerTask('cssdev', ['css_images', 'sass_compile', 'dataUri', 'autoprefixer', 'copy:css', 'postcss:prefix']);
    grunt.registerTask('css_production', ['cssdev', 'postcss:pack', 'postcss:min', 'csssplit']);
    grunt.registerTask('jsdev', ['jshint', 'concat']);
    grunt.registerTask('js', ['jsdev', 'uglify:production']);
    grunt.registerTask('compile', ['rename', 'css_production', 'js']);
    grunt.registerTask('compiledev', ['rename', 'cssdev', 'jsdev']);
    grunt.registerTask('default', ['watch']);
}
