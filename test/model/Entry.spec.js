describe('Entry', function() {
	beforeEach(angular.mock.module('Checkbook'));	
	
	const ENTRY = { id: 1, caption: '1', category: 1, datetime: new Date(0), value: 100, details: '1' };

	var Entry;
	var $httpBackend;

	beforeEach(inject(function($injector) {
		Entry = $injector.get('Entry');
		$httpBackend = $injector.get('$httpBackend');
	}));

	describe('.querySpecific', function() {
		it('should exist', function() {
			expect(Entry).itself.to.respondTo('querySpecific');
		});

		it('should GET the correct route when calling querySpecific', function() {
			var monthid = 0;
			var category = 1;

			$httpBackend
				.expectGET('/months/' + monthid + '/categories/' + category + '/entries')
				.respond(200, [ ENTRY ]);

			Entry.querySpecific({ monthid: monthid, category: category });
			expect($httpBackend.flush).to.not.throw();
		});
	});

	it('.equals should be true for identical entries', function() {
		var entry = new Entry(ENTRY);
		var same = new Entry(ENTRY);

		expect(entry.equals(entry)).to.be.true;
		expect(entry.equals(same)).to.be.true;

		var different = new Entry(ENTRY);
		different.value = 2 * entry.value;
		expect(entry.equals(different)).to.be.false;
	});

});