describe('Month', function() {
	beforeEach(angular.mock.module('Checkbook'));	
	
	const MONTH = { id: 0, value: 100 };

	var Month;
	var $httpBackend;

	beforeEach(inject(function($injector) {
		Month = $injector.get('Month');
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
});