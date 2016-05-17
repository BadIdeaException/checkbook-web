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

	it('should only have "reading" and no "writing" actions', function() {
		expect(CategoryForMonth).itself.to.respondTo('query');
		expect(CategoryForMonth).itself.to.respondTo('get');
		expect(CategoryForMonth).itself.to.not.respondTo('save');
		expect(CategoryForMonth).itself.to.not.respondTo('delete');
		expect(CategoryForMonth).itself.to.not.respondTo('remove');
		
		var c = new CategoryForMonth();
		expect(c).to.respondTo('$query');
		expect(c).to.respondTo('$get');
		expect(c).to.not.respondTo('$save');
		expect(c).to.not.respondTo('$delete');
		expect(c).to.not.respondTo('$remove');
	});

	describe('.fetchEntries', function() {
		it('should hit the server when entries are not loaded', function() {
			var category = new CategoryForMonth(CATEGORY);
			var entryResponse = { id: 25 }; // Arbitrary response, don't need a full entry here

			$httpBackend
				.expectGET('/months/' + category.monthid + '/categories/' + category.id + '/entries')
				.respond(200, [ entryResponse ]);

			var pResult;

			var p = category
				.fetchEntries()
				.then(function(r) { pResult = r; });

			$httpBackend.flush();

			expect(pResult).to.exist.and.have.length(1);
			expect(pResult[0]).to.have.property('id', entryResponse.id);
		});

		it('should not hit the server when entries are already loaded', inject(function($rootScope) {
			var category = new CategoryForMonth(CATEGORY);
			category.entries = [ { id: 25 } ]; // Don't need a full entry here

			$httpBackend
				.whenGET(function() { return true; }) // Match any url
				.respond(function() { expect.fail('Hit the server when it shouldn\'t have'); });

			var pResult;
			var p = category
				.fetchEntries()
				.then(function(r) { pResult = r; });

			$rootScope.$apply(); // Need to apply manually since $httpBackend.flush isn't doing it for us

			expect(pResult).to.exist.and.have.length(1);
			expect(pResult[0]).to.deep.equal(category.entries[0]);
		}));
	});
});