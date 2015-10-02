describe('DataService', function() {
	beforeEach(angular.mock.module('Checkbook'));	
	
	var dataService;
	var Month;
	var CategoryForMonth;
	var Entry;
	var $httpBackend;

	beforeEach(inject(function($injector) {
		dataService = $injector.get('dataService');
		Month = $injector.get('Month');
		CategoryForMonth = $injector.get('CategoryForMonth');
		Entry = $injector.get('Entry');
		$httpBackend = $injector.get('$httpBackend');
	}));

	it('should load months on the first call to getMonths', function() {
		var query = sinon.spy(Month, 'query');

		dataService.getMonths();
		expect(query).to.have.been.called;
		query.restore();
	});

	it('should return cached months subsequently', function() {
		const MONTHS = [ { id: 0, value: 100 }, { id: 1, value: 200 }];
		var query = sinon.spy(Month, 'query');

		dataService.months = MONTHS.map(function(month) { return new Month(month)});
		dataService.months.$resolved = true;

		expect(dataService.getMonths()).to.equal(dataService.months);
		expect(query).to.not.have.been.called;
		query.restore();
	});

	describe('categories.getById', function() {		
		const MONTHS = [];
		
		before(function() {
			// Cannot do this in MONTHS declaration above because Month will not have
			// been injected yet
			MONTHS.push(
				new Month({ id: 0, value: 100 }), 
				new Month({ id: 2, value: 200 }) 
			);
		});

		beforeEach(function() {	
			dataService.months = MONTHS;
		});

		it('should exist', function() {
			expect(dataService.months).itself.to.respondTo('getById');
		});

		it('should get the right month', function() {
			var month = dataService.months.getById(MONTHS[1].id);
			expect(month).to.exist;
			expect(month).to.have.property('id', MONTHS[1].id);
		});

		it('should return null when no such month exists', function() {
			// Find a non-existent id. This should really pass on the first attempt...
			var nonexistent = Number.MAX_VALUE;
			while (dataService.months.some(function(month) { return month.id === nonexistent; }))
				nonexistent--;
			
			var month = dataService.months.getById(nonexistent);
			expect(month).to.be.null;
		});

		it('should return null when called before months are loaded', function() {
			// Emulate an unfinished load
			dataService.months = [];
			dataService.months.$resolved = false;
			var month = dataService.months.getById(MONTHS[0].id);
			expect(month).to.be.null;
		});
	});

	it('should update the old and new category after successful $save of an entry', function() {
		// Set up a situation like this:
		//  month0
		// 		category1
		//			entry
		//		category2
		//	month1
		//		category1
		//		category2

		// The entry will be moved to month1, category2 in this test
		// The test checks that it gets removed from month0, category1 and added
		// to month1, category2 during the move
		const ENTRY = { id: 1, caption: 'entry1', datetime: new Date(0), value: 100, category: 1, details: 'details1' };
		const CATEGORY = [ { id: 1, caption: 'category1', value: 0 } , { id: 2, caption: 'category2', value: 0 } ];
		const MONTHS = [ { id: 0, value: 100 }, { id: 1, value: 0 } ];

		dataService.months = MONTHS.map(function(month) { return new Month(month); });
		dataService.months.$resolved = true;
		dataService.months.forEach(function(month) {
			month.categories = CATEGORY.map(function(category) {
				var c = new CategoryForMonth(category);
				c.monthid = month.id;
				return c;
			});
			month.categories.$resolved = true;
		});
		var entry = new Entry(ENTRY);
		dataService.months[0].categories[0].entries = [];
		dataService.months[0].categories[0].entries.push(entry);
		dataService.months[0].categories[0].value = entry.value;
		dataService.months[0].categories[0].entries.$resolved = true;
		// Make sure entries of the category we're moving the entry to have been "loaded"
		dataService.months[1].categories[1].entries = [];
		dataService.months[1].categories[1].entries.$resolved = true;

		// Set up to receive request
		$httpBackend
			.whenPUT('/months/' + MONTHS[0].id + '/categories/' + ENTRY.category + '/entries/' + ENTRY.id)
			.respond(204, null, { location: '/months/1/categories/2/entries/' + ENTRY.id });

		// Check that it all went alright
		expect(dataService.getMonths()[0].getCategories()[0].getEntries()).to.contain(entry);
		// Move the entry to category2 of month1
		entry.category = CATEGORY[1].id;
		entry.datetime = new Date(1970, 1, 1);

		// Save the changes
		entry.$save();
		$httpBackend.flush();
		
		// The entry should not be present anymore at month0 category1
		expect(dataService.getMonths()[0].getCategories()[0].getEntries()).to.not.contain(entry);
		// The entry should now be present at month1 category2
		expect(dataService.getMonths()[1].getCategories()[1].getEntries()).to.contain(entry);
	});
});