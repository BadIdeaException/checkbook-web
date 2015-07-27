module.exports = {
	build: {		
		files: [{
			expand: true,
			cwd: 'src/scss/',
			src: ['**/*.scss'],
			dest: 'stylesheets/',
			ext: '.css',
		}]
	},
}