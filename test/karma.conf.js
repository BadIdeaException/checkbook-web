// Karma configuration
// Generated on Wed Apr 08 2015 16:22:03 GMT+0200 (CEST)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '..',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'sinon-chai', 'chai-as-promised', 'chai'],


    // list of files / patterns to load in the browser
    files: [
        'node_modules/chai-angular/chai-angular.js',
        'http://ajax.googleapis.com/ajax/libs/angularjs/1.3.14/angular.js',
        'bower_components/angular-restmod/dist/angular-restmod-bundle.js',
        'http://ajax.googleapis.com/ajax/libs/angularjs/1.3.14/angular-route.js',
        'http://ajax.googleapis.com/ajax/libs/angularjs/1.3.14/angular-animate.js',
        'http://ajax.googleapis.com/ajax/libs/angularjs/1.3.14/angular-cookies.js',
        'http://ajax.googleapis.com/ajax/libs/angularjs/1.3.14/angular-resource.js',
        'http://ajax.googleapis.com/ajax/libs/angularjs/1.3.14/angular-mocks.js',
        'src/js/app.js',
        'src/js/*.js',
        'test/*.spec.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],
    // browsers: ['Firefox'],


    plugins: ['karma-phantomjs-launcher', 'karma-mocha', 'karma-chai', 'karma-chai-as-promised', 'karma-sinon-chai', 'karma-mocha-reporter'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
