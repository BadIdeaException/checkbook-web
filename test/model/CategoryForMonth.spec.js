describe('CategoryForMonth', function() {
	beforeEach(angular.mock.module('Checkbook'));	
	
	const CATEGORY = { id: 1, caption: '1', monthid: 0, value: 100 };

	var CategoryForMonth;
	var Entry;
	var $httpBackend;

	beforeEach(inject(function($injector) {
		CategoryForMonth = $injector.get('CategoryForMonth');
		Entry = $injector.get('Entry');
		$httpBackend = $injector.get('$httpBackend');
	}));

	it('should use the provided data values when constructing a new instance', function() {
		var category = new CategoryForMonth(CATEGORY);

		expect(category).to.have.property('$resolved', false);
		// All values passed to the constructor should be present
		for (var key in CATEGORY)
			expect(category).to.have.property(key, CATEGORY[key]);
	});

	it('should get an array of categories when calling .query', function() {
		const RESPONSE = [ CATEGORY, { id: 2, caption: '2', monthid: 0, value: 200 }];
		$httpBackend
			.expectGET('/months/0/categories')
			.respond(200, RESPONSE);

		var categories = CategoryForMonth.query(0);
		$httpBackend.flush();

		// $http promise should be set on the result
		expect(categories).to.have.property('$promise');
		expect(categories.$promise).to.respondTo('then');

		// Result should have the right length
		expect(categories).to.have.length(RESPONSE.length);
		for (var i = 0; i < categories.length; i++) {			
			var category = categories[i];
			// It should be a Category
			expect(category).to.be.an.instanceOf(CategoryForMonth);
			// Its $resolved property should be true
			expect(category).to.have.property('$resolved', true);
			// All values should be set correctly
			for (var key in RESPONSE[i])
				expect(category).to.have.property(key, RESPONSE[i][key]);
		}
	});

	it('should update itself when calling .$get', function() {
		const RESPONSE = { id: CATEGORY.id, caption: CATEGORY.caption + CATEGORY.caption, monthid: CATEGORY.monthid, value: CATEGORY.value + 1 };

		$httpBackend
			.expectGET('/months/' + CATEGORY.monthid + '/categories/' + CATEGORY.id)
			.respond(200, RESPONSE);

		var category = new CategoryForMonth(CATEGORY);
		category = category.$get();
		$httpBackend.flush();

		// Check that promise is set correctly
		expect(category).to.have.property('$promise');
		expect(category.$promise).to.respondTo('then');
		// $resolved should be true after server interaction
		expect(category).to.have.property('$resolved', true);

		// Check that the new values are present
		for (var key in RESPONSE) 
			expect(category).to.have.property(key, RESPONSE[key]);
	});

	it('should load entries when calling getEntries for the first time', function() {
		var query = sinon.spy(Entry, 'query');

		var category = new CategoryForMonth(CATEGORY);
		var entries = category.getEntries();

		expect(query).to.have.been.called;
		var args = query.getCall(0).args;

		// There are two different ways this could have been called
		if (args.length === 2)
			expect(args).to.deep.equal([ CATEGORY.monthid, CATEGORY.id ]);
		else {
			args = args[0];
			expect(args).to.have.property('monthid', CATEGORY.monthid);
			expect(args).to.have.property('category', CATEGORY.id);
		}

		query.restore();
	});

	it('should use cached entries when calling getEntries subsequently', function() {
		var category = new CategoryForMonth(CATEGORY);

		const ENTRIES = [{ id: 1, caption: '1', category: CATEGORY.id, datetime: new Date(0), value: CATEGORY.value, details: 'details'}];
		ENTRIES.$resolved = true;
		category.entries = ENTRIES;

		expect(category.getEntries()).to.equal(ENTRIES);
	});

	it('should use own value when calling getTotal and entries haven\'t been loaded', function() {
		var category = new CategoryForMonth(CATEGORY);

		// Case 1: entries haven't been loaded yet
		expect(category.getTotal()).to.equal(category.value);

		// Case 2: loading is in progress but hasn't completed
		const ENTRIES = [{ id: 1, caption: '1', category: CATEGORY.id, datetime: new Date(0), value: CATEGORY.value + 1, details: 'details'}];
		category.entries = ENTRIES;
		category.entries.$resolved = false;
		expect(category.getTotal()).to.equal(category.value);		
	});

	it('should compute total value from entries if they are available', function() {
		var category = new CategoryForMonth(CATEGORY);

		const ENTRIES = [
			{ id: 1, caption: '1', category: CATEGORY.id, datetime: new Date(0), value: CATEGORY.value + 1, details: '1'},
			{ id: 2, caption: '2', category: CATEGORY.id, datetime: new Date(0), value: CATEGORY.value + 2, details: '2' }
		];

		category.entries = ENTRIES.map(function(entry) { return new Entry(entry); });
		category.entries.$resolved = true;

		// Expect computed values to be the sum of the entries' values
		expect(category.getTotal()).to.equal(ENTRIES.reduce(function(total, entry) {
			return total + entry.value;
		}, 0));
	});
});