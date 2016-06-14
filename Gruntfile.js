module.exports = function(grunt) {
	var config = require('./grunt');	
	grunt.initConfig(config);
	
	grunt.loadNpmTasks('grunt-contrib-jade');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-ngdocs')
	
	grunt.registerTask('buildDev', ['jade']);
}