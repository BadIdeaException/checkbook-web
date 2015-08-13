describe('Category', function() {
	beforeEach(angular.mock.module('Checkbook'));	
	
	var Category;
	var $httpBackend;

	beforeEach(inject(function($injector) {
		Category = $injector.get('Category');
		$httpBackend = $injector.get('$httpBackend');
	}));

	it('should have static methods query and get, and instance methods $save, $delete and $remove', function() {
		expect(Category).itself.to.respondTo('query');
		expect(Category).itself.to.respondTo('get');
		var category = new Category();
		expect(category).to.itself.respondTo('$save');
		expect(category).to.itself.respondTo('$delete');
		expect(category).to.itself.respondTo('$remove');
	});
});

describe('Entry', function() {
	beforeEach(angular.mock.module('Checkbook'));

	var Entry,
		$httpBackend;

	const ENTRY = {
		id: 1,
		caption: '1',
		value: 100,
		datetime: new Date(0),
		category: 1,
		details: '1'
	};

	beforeEach(inject(function($injector) {
		Entry = $injector.get('Entry');
		$httpBackend = $injector.get('$httpBackend');
	}));

	it('should have virtual property monthid', function() {
		var entry = new Entry(ENTRY);

		// Property should exist and have the correct value
		expect(entry).to.have.property('monthid', 0);
		// It should be read-only
		expect(function() { entry.monthid = 5 }).to.throw(TypeError);
	});

	it('should use the monthid in the url', function() {
		var entry = new Entry(ENTRY);
		$httpBackend.expectGET('/months/' + entry.monthid + '/categories/' + entry.category + '/entries/' + entry.id).respond(ENTRY);

		entry.$get();
		expect($httpBackend.flush).to.not.throw();
	});

	it('should have an id after saving', function() {
		var values = angular.copy(ENTRY);
		delete values.id;
		var entry = new Entry(values);

		// Make sure the id isn't already set
		expect(entry).to.not.have.property('id');
		$httpBackend
			.whenPOST('/months/' + entry.monthid + '/categories/' + entry.category + '/entries')
			.respond(201, null, { location: '/months/' + entry.monthid + '/categories/' + entry.category + '/entries/' + ENTRY.id });

		entry.$create();
		$httpBackend.flush();
		expect(entry).to.have.property('id', ENTRY.id);
	});
});

describe('Month', function() {
	beforeEach(angular.mock.module('Checkbook'));

	var Month;
	var $httpBackend;
	var Category;

	beforeEach(inject(function($injector) {
		Month = $injector.get('Month');
		Category = $injector.get('Category')
		$httpBackend = $injector.get('$httpBackend');
	}));

	it('should have static methods query and get, but not instance methods $save, $delete and $remove', function() {
		expect(Month).itself.to.respondTo('query');
		expect(Month).itself.to.respondTo('get');
		var month = new Month();
		expect(month).to.not.respondTo('$save');
		expect(month).to.not.respondTo('$delete');
		expect(month).to.not.respondTo('$remove');
	});

	describe('.getCategories', function() {
		var Category;

		var month;
		const CATEGORIES = [ { id: 1, caption: '1', value: 100 }, { id: 2, caption: '2', value: 200 }];		
		beforeEach(inject(function($injector) {
			Category = $injector.get('Category');
		}));

		beforeEach(function() {
			month = new Month({ id: 1, value: 1234 });
			$httpBackend.whenGET('/months/' + month.id + '/categories').respond(CATEGORIES);
		});

		it('should return the right kind of objects', function() {
			var categories = month.getCategories();
			expect($httpBackend.flush).to.not.throw();

			expect(categories).to.not.be.empty;
			var category = categories[0];
			// Expect the result to be Categories extended with a value property
			expect(category).to.be.an.instanceOf(Category);
			expect(category).to.have.property('value');	
			expect(category).to.respondTo('getEntries');		
			expect(category).to.respondTo('getTotal');
			expect(category).to.have.property('monthid', month.id);
		});

		it('should get categories from /months/:monthid/categories if none are cached', function() {			
			var categories = month.getCategories();
			expect($httpBackend.flush).to.not.throw();

			expect(categories).to.have.length(CATEGORIES.length);		
			// Map the result to values only to be able to check for deep equality now
			var values = categories.map(function(category) {
				return { id: category.id, caption: category.caption, value: category.value };
			});
			expect(values).to.deep.equal(CATEGORIES);
		});

		it('should use cached categories without hitting the server when possible', function() {
			var categories = CATEGORIES.map(function(category) { return new Category(category); });
			month.categories = categories;

			$httpBackend.expectGET('/months/' + month.id + '/categories').respond([]);

			var categories = month.getCategories();
			// Should not have hit the server
			expect($httpBackend.flush).to.throw(Error);
			// Categories should have been retrieved from the cache
			expect(categories).to.deep.equal(categories);
		});
	});

	describe('.getTotal', function() {
		var month;
		const CATEGORIES = [ { id: 1, caption: '1', value: 100 }, { id: 2, caption: '2', value: 200 }];		

		beforeEach(function() {
			month = new Month({ id: 1, value: 1234 });
		});

		it('should use the value property when categories have not been loaded yet', function() {
			delete month.categories;
			expect(month.getTotal()).to.equal(month.value);
		});

		it('should total up the categories\' values when they are available', function() {
			$httpBackend.whenGET('/months/' + month.id + '/categories').respond(CATEGORIES);
			// Force loading
			var categories = month.getCategories();
			expect($httpBackend.flush).to.not.throw();

			var total = categories.reduce(function(total, category) {
				return total + category.value; // Can use the value directly here because no entries are loaded anyway
			}, 0);
			expect(month.getTotal()).to.equal(total);
		});
	});
});

describe('Category (as returned by Month.getCategories)', function() {
	beforeEach(angular.mock.module('Checkbook'));

	var Month;
	var Entry;
	var $httpBackend;

	var category; 

	const ENTRIES = [
		{ id: 1, caption: '1', datetime: '2015-05-01 18:49', value: 100, category: 1, details: '1' }
	];

	beforeEach(inject(function($injector) {
		Month = $injector.get('Month');
		Entry = $injector.get('Entry');
		$httpBackend = $injector.get('$httpBackend');
	}));

	beforeEach(function() {
		month = new Month({ id: 1 });
		const CATEGORIES = [ { id : 1, caption: '1', value: 1234 }];
		$httpBackend.whenGET('/months/' + month.id + '/categories').respond(CATEGORIES);
		var categories = month.getCategories();
		$httpBackend.flush();
		category = categories[0];
	});

	describe('.getEntries', function() {
		beforeEach(function() {
			$httpBackend.whenGET('/months/' + 1 +'/categories/' + 1 + '/entries').respond(ENTRIES);
		});

		it('should get Entries from /months/:monthid/categories/:category/entries when not loaded', function() {
			var entries = category.getEntries();
			expect($httpBackend.flush).to.not.throw();

			expect(entries).to.not.be.empty;
			expect(entries[0]).to.be.an.instanceOf(Entry);
			var values = entries.map(function(entry) { 
				return { id: entry.id, caption: entry.caption, value: entry.value, datetime: entry.datetime, details: entry.details, category: entry.category }
			});
			expect(values).to.deep.equal(ENTRIES);
		});

		it('should use cached entries when available', function() {
			category.entries = ENTRIES.map(function(entry) { return new Entry(entry); });

			var entries = category.getEntries();
			expect($httpBackend.flush).to.throw();
			expect(entries).to.deep.equal(category.entries);
		});
	});

	describe('.getTotal', function() {
		it('should use the value property when entries are not yet loaded', function() {
			delete category.entries;

			expect(category.getTotal()).to.equal(category.value);
		});

		it('should total up the entries\' values when they are available', function() {
			category.entries = ENTRIES.map(function(entry) { return new Entry(entry); });
			var total = category.entries.reduce(function(total, entry) {
				return total + entry.value;
			},0);

			expect(category.getTotal()).to.equal(total);
		})
	});
});