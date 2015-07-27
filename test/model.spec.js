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
			month = new Month({ id: 1 });
			$httpBackend.whenGET('/months/' + month.id + '/categories').respond(CATEGORIES);
		});

		it('should return the right kind of objects', function() {
			var categories = month.getCategories();
			$httpBackend.flush();

			expect(categories).to.not.be.empty;
			var category = categories[0];
			// Expect the result to be Categories extended with a value property
			expect(category).to.be.an.instanceOf(Category);
			expect(category).to.have.property('value');	
			expect(category).to.respondTo('getEntries');		
			expect(category).to.have.property('monthid', month.id);
		});

		it('should get categories from /months/:monthid/categories if none are cached', function() {			
			// This will fail if not hitting /months/1/categories
			var categories = month.getCategories();
			$httpBackend.flush();

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
});

describe('Category for month', function() {
	beforeEach(angular.mock.module('Checkbook'));

	var Month;
	var $httpBackend;

	var category; 

	const ENTRIES = [
		{ id: 1, caption: '1', datetime: '2015-05-01 18:49', value: 100, category: 1, details: '1' }
	];

	beforeEach(inject(function($injector) {
		Month = $injector.get('Month');
		$httpBackend = $injector.get('$httpBackend');
	}));

	beforeEach(function() {
		month = new Month({ id: 1 });
		const CATEGORIES = [ { id : 1, caption: '1', value: 1 }];
		$httpBackend.whenGET('/months/' + month.id + '/categories').respond(CATEGORIES);
		var categories = month.getCategories();
		$httpBackend.flush();
		category = categories[0];
	});

	it('.getEntries should get Entries from /months/:monthid/categories/:category/entries when not loaded', function() {
		$httpBackend.whenGET('/months/' + 1 +'/categories/' + 1 + '/entries').respond(ENTRIES);

		var entries = category.getEntries();
		$httpBackend.flush();

		expect(entries).to.not.be.empty;
		var values = entries.map(function(entry) { 
			return { id: entry.id, caption: entry.caption, value: entry.value, datetime: entry.datetime, details: entry.details, category: entry.category }
		});
		expect(values).to.deep.equal(ENTRIES);
	})

})

// 	it('.query should return a hash', function() {
// 		var CATEGORIES = [ { id: 1, caption: '1', value: 100 }, { id: 2, caption: '2', value: 200 }];
// 		$httpBackend.whenGET('/months/1/categories').respond(CATEGORIES);
		
// 		var categories = Category.query({ month: 1 });
// 		$httpBackend.flush();

// 		var hash = CATEGORIES.reduce(function(hash,item) {
// 			hash[item.id] = item;
// 			return hash;
// 		}, {});
// 		// Best way to check for identical structures without caring
// 		// about actual object identity:
// 		expect(JSON.stringify(categories)).to.equal(JSON.stringify(hash));
// 	});	
	
// 	it('.getTotal should use own value when entries are not loaded', function() {
// 		var category = new Category({ id: 1, caption: '1', value: 100 });
// 		$httpBackend.whenGET('/months/1/categories/1/entries').respond([]);
		
// 		expect($httpBackend.flush).to.throw(Error); // Should not hit the network
// 		expect(category.entries).to.not.be.defined;
// 		expect(category.getTotal()).to.equal(100);
// 	});
	
// 	it('.getTotal should sum up entries when loaded', function() {
// 		var category = new Category({ id: 1, value: 100 });
// 		$httpBackend
// 			.whenGET('/months/1/categories/1/entries')
// 			.respond(
// 				[ { id: 1, caption: '1', value: 100, datetime: '2015-03-22 14:22', category: 1 }, 
// 				  { id: 2, caption: '2', value: 200, datetime: '2015-03-22 14:25', category: 1 } ]);

// 		entries = category.getEntries(); // Force entry loading
// 		$httpBackend.flush();
// 		expect(category.entries).to.be.defined;
// 		expect(category.getTotal()).to.equal(300);
// 	});});

// describe('Month', function() {
// 	beforeEach(angular.mock.module('Checkbook'));	
	
// 	var Month;
// 	var $httpBackend;

// 	beforeEach(inject(function($injector) {
// 		Month = $injector.get('Month');
// 		$httpBackend = $injector.get('$httpBackend');
// 	}));

// 	it('should have $query and $get, but not $save, $delete and $remove', function() {
// 		expect(Month).itself.to.respondTo('query');
// 		expect(Month).itself.to.respondTo('get');
// 		var month = new Month();
// 		expect(month).to.not.respondTo('$save');
// 		expect(month).to.not.respondTo('$delete');
// 		expect(month).to.not.respondTo('$remove');
// 	});
	
// 	it('.query should return a hash', function() {
// 		var MONTHS = [ { id: 1, value: 100 }, { id: 2, value: 200 }];
// 		$httpBackend.whenGET('/months').respond(MONTHS);
		
// 		var months = Month.query();
// 		$httpBackend.flush();

// 		var hash = MONTHS.reduce(function(hash,item) {
// 			hash[item.id] = item;
// 			return hash;
// 		}, {});
// 		// Best way to check for identical structures without caring
// 		// about actual object identity:
// 		expect(JSON.stringify(months)).to.equal(JSON.stringify(hash));
// 	});
	
// 	it('.getCategories should load from /months/:month/categories initially', function() {
// 		var month = new Month({ id: 1, value: 100 });
// 		const CATEGORIES = [ { id: 1, caption: '1', value: 100 } ];
// 		$httpBackend.whenGET('/months/1/categories').respond(CATEGORIES);
		
// 		var categories = month.getCategories();
// 		$httpBackend.flush();
		
// 		expect(JSON.stringify(categories)).to.equal(JSON.stringify({ 1: CATEGORIES[0] }));
// 	});

// 	it('.getCategories should use cached values when available', function() {
// 		var month = new Month({ id: 1, value: 100 });
// 		month.categories = { id: 1, caption: '1', value: 100 };
// 		$httpBackend.whenGET('/months/1/categories').respond([]);
		
// 		var categories = month.getCategories();
		
// 		expect($httpBackend.flush).to.throw(Error); // Do not hit the network
// 		expect(categories).to.deep.equal(month.categories);
// 	});

// 	it('.getTotal should use own value when categories are not loaded', function() {
// 		var month = new Month({ id: 1, value: 100 });
// 		$httpBackend.whenGET('/months/1/categories').respond([]);
		
// 		expect($httpBackend.flush).to.throw(Error); // Should not hit the network
// 		expect(month.categories).to.not.be.defined;
// 		expect(month.getTotal()).to.equal(100);
// 	});
	
// 	it('.getTotal should sum up categories when loaded', function() {
// 		var month = new Month({ id: 1, value: 100 });
// 		$httpBackend.whenGET('/months/1/categories').respond([ { id: 1, caption: '1', value: 100 }, { id: 2, caption: '2', value: 200 }]);

// 		categories = month.getCategories(); // Force category loading
// 		$httpBackend.flush();
// 		expect(month.categories).to.be.defined;
// 		expect(month.getTotal()).to.equal(300);
// 	});
// });