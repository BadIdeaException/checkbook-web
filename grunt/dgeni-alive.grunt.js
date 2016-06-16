module.exports = {
	options: {
		basePath: '.'
	},

	checkbook: {
		title: '<%= pkg.title %>',
		version: '<%= pkg.version %>',
		expand: true,
		dest: 'docs',
		src: ['src/js/**/*.js']
	}
}