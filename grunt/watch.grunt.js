module.exports = {
	jade: {
		files: 'src/jade/**/*.jade',
		tasks: ['jade:buildDev']
	},
	sass: {
		files: 'src/scss/**/*.scss',
		tasks: ['sass:build'],
	}
}