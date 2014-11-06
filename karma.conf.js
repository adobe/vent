module.exports = function(config) {
  // Disable coverage by default until karma-runner/karma-coverage/issues/96 is fixed
  var reportCoverage = process.env.REPORT_COVERAGE;

  var karmaConfig = {
    // base path, that will be used to resolve files and exclude
    basePath: './',

    frameworks: ['mocha', 'chai', 'sinon'],

    // list of files / patterns to load in the browser
    files: [
      'tests/snippets/*.html',
      'vent.js',
      'tests/tests.js'
    ],

    // use dots reporter, as travis terminal does not support escaping sequences
    // possible values: 'dots', 'progress'
    // CLI --reporters progress
    reporters: ['progress', 'coverage'],

    // web server port
    // CLI --port 9876
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    // CLI --colors --no-colors
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    // CLI --log-level debug
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    // CLI --auto-watch --no-auto-watch
    autoWatch: true,

    // If browser does not capture in given timeout [ms], kill it
    // CLI --capture-timeout 5000
    captureTimeout: 20000,

    // Auto run tests on start (when browsers are captured) and exit
    // CLI --single-run --no-single-run
    singleRun: true,

    // report which specs are slower than 500ms
    // CLI --report-slower-than 500
    reportSlowerThan: 500,

    // Start these browsers
    // CLI --browsers Chrome,Firefox,Safari
    browsers: process.env.TRAVIS ? [ 'Firefox' ] : [
      'Firefox',
      'Chrome'
    ],

    preprocessors: {
      // Source files you want to generate coverage reports for
      // This should not include tests or libraries
      // These files will be instrumented by Istanbu
      'tests/snippets/*.html': ['html2js']
    }
  };

  if (reportCoverage) {
    // Add coverage reporting
    karmaConfig.preprocessors['vent.js'] = ['coverage'];

    // Configure the reporter
    karmaConfig.coverageReporter = {
      type: 'html',
      dir: 'coverage/'
    };
  }

  config.set(karmaConfig);
};
