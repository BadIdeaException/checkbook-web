describe('Month', function() {
	beforeEach(angular.mock.module('Checkbook'));	
	
	const MONTH = { id: 0, value: 100 };

	var Month;
	var CategoryForMonth;
	var $httpBackend;

	beforeEach(inject(function($injector) {
		Month = $injector.get('Month');
		CategoryForMonth = $injector.get('CategoryForMonth');
		$httpBackend = $injector.get('$httpBackend');
	}));

	it('should use the provided data values when constructing a new instance', function() {
		var month = new Month(MONTH);

		expect(month).to.have.property('$resolved', false);
		// All values passed to the constructor should be present
		for (var key in MONTH)
			expect(month).to.have.property(key, MONTH[key]);
	});

	it('should get an array of months when calling .query', function() {
		const RESPONSE = [ MONTH, { id: 1, value: 200 }];
		$httpBackend
			.expectGET('/months')
			.respond(200, RESPONSE);

		var months = Month.query();
		$httpBackend.flush();

		// $http promise should be set on the result
		expect(months).to.have.property('$promise');
		expect(months.$promise).to.respondTo('then');

		// Result should have the right length
		expect(months).to.have.length(RESPONSE.length);
		for (var i = 0; i < months.length; i++) {			
			var month = months[i];
			// It should be a Month
			expect(month).to.be.an.instanceOf(Month);
			// Its $resolved property should be true
			expect(month).to.have.property('$resolved', true);
			// All values should be set correctly
			for (var key in RESPONSE[i])
				expect(month).to.have.property(key, RESPONSE[i][key]);
		}
	});

	it('should update itself when calling .$get', function() {
		const RESPONSE = { id: MONTH.id, value: MONTH.value + 1 };

		$httpBackend
			.expectGET('/months/' + MONTH.id)
			.respond(200, RESPONSE);

		var month = new Month(MONTH);
		month = month.$get();
		$httpBackend.flush();

		// Check that promise is set correctly
		expect(month).to.have.property('$promise');
		expect(month.$promise).to.respondTo('then');
		// $resolved should be true after server interaction
		expect(month).to.have.property('$resolved', true);

		// Check that the new values are present
		for (var key in RESPONSE) 
			expect(month).to.have.property(key, RESPONSE[key]);
	});

	it('should load categories when calling getCategories for the first time', function() {
		var query = sinon.spy(CategoryForMonth, 'query');

		var month = new Month(MONTH);
		var categories = month.getCategories();

		expect(query).to.have.been.calledWith(MONTH.id);
		query.restore();
	});

	it('should use cached categories when calling getCategories subsequently', function() {
		var month = new Month(MONTH);

		const CATEGORIES = [{ id: 1, caption: '1', value: MONTH.value }];
		CATEGORIES.$resolved = true;
		month.categories = CATEGORIES;

		expect(month.getCategories()).to.equal(CATEGORIES);
	});

	it('should use own value when calling getTotal and categories haven\'t been loaded', function() {
		var month = new Month(MONTH);

		// Case 1: categories haven't been loaded yet
		expect(month.getTotal()).to.equal(month.value);

		// Case 2: loading is in progress but hasn't completed
		const CATEGORIES = [{ id: 1, caption: '1', value: MONTH.value + 1 }];

		month.categories = CATEGORIES;
		month.categories.$resolved = false;
		expect(month.getTotal()).to.equal(month.value);		
	});

	it('should compute total value from categories if they are available', function() {
		var month = new Month(MONTH);

		const CATEGORIES = [{ id: 1, caption: '1', value: MONTH.value + 1 },
			{ id: 2, caption: '2', value: MONTH.value + 2 }];

		month.categories = CATEGORIES.map(function(category) { return new CategoryForMonth(category); });
		month.categories.$resolved = true;

		// Expect computed values to be the sum of the categories' values
		expect(month.getTotal()).to.equal(CATEGORIES.reduce(function(total, category) {
			return total + category.value; // Can use the value directly since no entries are loaded
		}, 0));
	});
});