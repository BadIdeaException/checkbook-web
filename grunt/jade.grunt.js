module.exports = {
	options : {
		basedir : 'jade',
	},
	buildDev : {
		options : {
			data : {
				dev : true,
			},
			pretty: true
		},
		files : [ {
			expand : true,
			cwd : 'src/jade/',
			src : [ '**/*.jade', '!includes/**/*.jade' ],
			dest : 'html/',
			ext : '.html',
		} ],
	},
}