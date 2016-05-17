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

	it('should only have "reading" and no "writing" actions', function() {
		expect(Month).itself.to.respondTo('query');
		expect(Month).itself.to.respondTo('get');
		expect(Month).itself.to.not.respondTo('save');
		expect(Month).itself.to.not.respondTo('delete');
		expect(Month).itself.to.not.respondTo('remove');
		
		var m = new Month();
		expect(m).to.respondTo('$query');
		expect(m).to.respondTo('$get');
		expect(m).to.not.respondTo('$save');
		expect(m).to.not.respondTo('$delete');
		expect(m).to.not.respondTo('$remove');
	});

	describe('.fetchCategories', function() {
		it('should hit the server when categories are not loaded', function() {
			var month = new Month(MONTH);
			var categoryResponse = { id: 25 }; // Arbitrary response, don't need a full category here

			$httpBackend
				.expectGET('/months/' + month.id + '/categories')
				.respond(200, [ categoryResponse ]);

			var pResult;

			var p = month
				.fetchCategories()
				.then(function(r) { pResult = r; });

			$httpBackend.flush();

			expect(pResult).to.exist.and.have.length(1);
			expect(pResult[0]).to.have.property('id', categoryResponse.id);
		});

		it('should not hit the server when categories are already loaded', inject(function($rootScope) {
			var month = new Month(MONTH);
			month.categories = [ { id: 25 } ]; // Don't need a full category here

			$httpBackend
				.whenGET(function() { return true; }) // Match any url
				.respond(function() { expect.fail('Hit the server when it shouldn\'t have'); });

			var pResult;
			var p = month
				.fetchCategories()
				.then(function(r) { pResult = r; });

			$rootScope.$apply(); // Need to apply manually since $httpBackend.flush isn't doing it for us

			expect(pResult).to.exist.and.have.length(1);
			expect(pResult[0]).to.deep.equal(month.categories[0]);
		}));
	});
});