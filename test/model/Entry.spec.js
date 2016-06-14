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

	it('should be an event emitter', function() {
		var entry = new Entry(ENTRY);

		['on', 'off', 'emit'].forEach(function(method) {
			expect(entry).to.respondTo(method);
		});
	});

	it('should emit an event when changing datetime or category', function() {
		var entry = new Entry(ENTRY);
		var datetimeHandler = sinon.spy();
		var categoryHandler = sinon.spy();

		entry.on('datetime', datetimeHandler);
		entry.on('category', categoryHandler);
		
		entry.datetime = new Date();
		entry.category++;

		expect(datetimeHandler).to.have.been.calledWith(ENTRY.datetime, entry.datetime);
		expect(categoryHandler).to.have.been.calledWith(ENTRY.category, entry.category);
	});
});