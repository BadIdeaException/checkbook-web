describe('expandURL', function() {
	beforeEach(angular.mock.module('Checkbook.Util'));

	var expandURL;
	beforeEach(inject(function(_expandURL_) {
		expandURL = _expandURL_;
	}));

	it('should copy over protocol and domain if they are specified', function() {
		const URL = 'http://www.example.com/path';
		var result = expandURL(URL);
		expect(result).to.equal(URL);
	});

	it('should copy over query if specified', function() {
		const URL = '/path?q1=1&q2=2';
		var result = expandURL(URL);
		expect(result).to.equal(URL);
	});

	it('should fill in literals', function() {
		const URL = '/number/:i/string/:s';
		var params = { i: 1, s: 'string' };
		var result = expandURL(URL, params);
		expect(result).to.equal('/number/1/string/string');
	});

	it('should fill in functions', function() {
		const URL = '/function/:f';
		var params = { f: sinon.spy() };
		var result = expandURL(URL, params);
		expect(params.f).to.have.been.called;		
	});

	it('should fill in property accessors', function() {
		const URL = '/property/:prop';
		var params = { prop: '@target' };
		var data = { target: 'value' };
		var result = expandURL(URL, params, data);
		expect(result).to.equal('/property/' + data.target);
	});

	it('should append extra parameters in query', function() {
		const URL = '/path';
		const PARAMS = { q1: 5, q2: 'x' };
		var result = expandURL(URL, PARAMS);		
		
		// This test is a little more complicated because we cannot assume 
		// anything about the order of the query parameters
		const REGEXP = /\/path\?(q\d+=[^&]*)&(q\d+=[^&]*)/i		
		expect(result).to.match(REGEXP);		
		var query = REGEXP.exec(result).slice(1) || []; // Throw away first array element, it's the entire matched string
		expect(query
			.map(function(q) {
				var components = q.split('=');
				return '' + PARAMS[components[0]] === components[1];				
			}))
			.to.deep.equal([true,true]);
	});

	it('should respect a query that is already present when appending extra parameters', function() {
		const URL = '/path?p=1';
		const PARAMS = { q: 'x' };
		var result = expandURL(URL, PARAMS);
		expect(result).to.equal(URL + '&q=x');
	});
});