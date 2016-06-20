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
			var entryResponse = { id: 25, datetime: new Date(0), category: 1 }; // Arbitrary response, don't need a full entry here
			var url = '/months/' + category.monthid + '/categories/' + category.id + '/entries';

			$httpBackend
				.expectGET(url)
				.respond(200, [ entryResponse ], { location: url });

			var entries;

			category
				.fetchEntries()
				.then(function(r) { entries = r; });

			$httpBackend.flush();

			expect(entries).to.exist.and.have.length(1);
			expect(entries[0]).to.have.property('id', entryResponse.id);
		});

		it('should not hit the server when entries are already loaded', function() {
			var category = new CategoryForMonth(CATEGORY);
			category.entries = [ { id: 25 } ]; // Don't need a full entry here

			$httpBackend
				.expectGET(function() { return true; }) // Match any url
				.respond(function() { expect.fail('Hit the server when it shouldn\'t have'); });

			var entries;
			category
				.fetchEntries()
				.then(function(r) { entries = r; });

			expect($httpBackend.flush).to.throw();
		
			expect(entries).to.exist.and.have.length(1);
			expect(entries[0]).to.deep.equal(category.entries[0]);
		});
	});
});