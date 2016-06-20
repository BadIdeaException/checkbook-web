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
			var url = '/months/' + monthid + '/categories/' + category + '/entries';

			$httpBackend
				.expectGET(url)
				.respond(200, [ ENTRY ], { location: url });

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

	it('should have properties datetime and category created when they are first accessed', function() {
		var entry = new Entry();
		// Neither datetime nor category should exist as own properties yet
		expect(entry).to.not.have.ownProperty('datetime');
		expect(entry).to.not.have.ownProperty('category');
		// They should be visible on the prototype chain however
		expect(entry).to.have.property('datetime');
		expect(entry).to.have.property('category');

		// Read access
		entry.datetime;
		entry.category;

		// Now both should be available as own properties
		expect(entry).to.have.ownProperty('datetime');
		expect(entry).to.have.ownProperty('category');

		// Check it also works with write access
		entry = new Entry();
		entry.datetime = new Date(0);
		entry.category = 1;
		expect(entry).to.have.ownProperty('datetime');
		expect(entry).to.have.ownProperty('category');
		// Check that the values were set
		expect(entry.datetime.getTime()).to.equal(new Date(0).getTime());
		expect(entry.category).to.equal(1);
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

		entry.on('change', datetimeHandler);
		entry.on('change', categoryHandler);
		
		entry.datetime = new Date();
		entry.category++;

		expect(datetimeHandler).to.have.been.calledWith(entry, 'datetime', ENTRY.datetime, entry.datetime);
		expect(categoryHandler).to.have.been.calledWith(entry, 'category', ENTRY.category, entry.category);
	});

	it('should store entries from querySpecific so they can be retrieved with the get action', function() {
		const URL = '/months/0/categories/' + ENTRY.category + '/entries';
		$httpBackend
			.expectGET(URL)
			.respond(200, [ ENTRY ], { location: URL });

		// Get list of resources from /months/.../entries URL
		var entries = Entry.querySpecific({ monthid: 0, category: ENTRY.category });
		$httpBackend.flush();
		var entry1 = entries[0];

		// Get the entry from /entries/:id
		var entry2 = Entry.get({ id: entry1.id }); // Using ENTRY as params object here
		expect($httpBackend.flush).to.throw();
		expect(entry1).to.equal(entry2);
	});
});