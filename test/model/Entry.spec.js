describe('Entry', function() {
	beforeEach(angular.mock.module('Checkbook'));	
	
	const ENTRY = { id: 1, caption: '1', category: 1, datetime: new Date(0), value: 100, details: '1' };

	var Entry;
	var $httpBackend;

	beforeEach(inject(function($injector) {
		Entry = $injector.get('Entry');
		$httpBackend = $injector.get('$httpBackend');
	}));

	it('should use the provided data values when constructing a new instance', function() {
		var entry = new Entry(ENTRY);

		expect(entry).to.have.property('$resolved', false);
		// All values passed to the constructor should be present
		for (var key in ENTRY)
			expect(entry).to.have.property(key, ENTRY[key]);
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

	it('should get an array of entries when calling .query', function() {
		const RESPONSE = [ ENTRY, 
			{ id: 2, caption: '2', category: 1, datetime: new Date(0), value: 200, details: '2' }];

		$httpBackend
			.expectGET('/months/0/categories/' + ENTRY.category + '/entries')
			.respond(200, RESPONSE);

		var entries = Entry.query(0, 1);
		$httpBackend.flush();

		// $http promise should be set on the result
		expect(entries).to.have.property('$promise');
		expect(entries.$promise).to.respondTo('then');

		// Result should have the right length
		expect(entries).to.have.length(RESPONSE.length);
		for (var i = 0; i < entries.length; i++) {			
			var entry = entries[i];
			// It should be a Entry
			expect(entry).to.be.an.instanceOf(Entry);
			// Its $resolved property should be true
			expect(entry).to.have.property('$resolved', true);
			// All values should be set correctly
			expect(entry.equals(new Entry(RESPONSE[i]))).to.be.true;
		}
	});

	it('should update itself when calling .$get', function() {
		const RESPONSE = { id: ENTRY.id, caption: ENTRY.caption + ENTRY.caption, category: ENTRY.category + 1, datetime: new Date(), value: ENTRY.value + 1, details: ENTRY.details + ENTRY.details };

		$httpBackend
			.expectGET('/months/0/categories/' + ENTRY.category + '/entries/' + ENTRY.id)
			.respond(200, RESPONSE);

		var entry = new Entry(ENTRY);
		entry = entry.$get();
		$httpBackend.flush();

		// Check that promise is set correctly
		expect(entry).to.have.property('$promise');
		expect(entry.$promise).to.respondTo('then');
		// $resolved should be true after server interaction
		expect(entry).to.have.property('$resolved', true);

		expect(entry.equals(new Entry(RESPONSE))).to.be.true;
	});

	it('should POST to the server when calling .$create', function() {
		var data = angular.copy(ENTRY);
		delete data.id;

		$httpBackend
			.expectPOST('/months/0/categories/' + data.category + '/entries', data)
			.respond(201, null, { location: '/months/0/categories/' + data.category + '/entries/' + ENTRY.id });

		var entry = new Entry(data);

		entry.$create();
		$httpBackend.flush();

		// Check that promise is set correctly
		expect(entry).to.have.property('$promise');
		expect(entry.$promise).to.respondTo('then');
		// id should be set after $create - the server provided it in the location header
		expect(entry).to.have.property('id', ENTRY.id);
		// $resolved should be true after server interaction
		expect(entry).to.have.property('$resolved', true);
	});

	it('should PUT to the server when calling .$update', function() {
		$httpBackend
			.expectPUT('/months/0/categories/' + ENTRY.category + '/entries/' + ENTRY.id, ENTRY)
			.respond(204, null, { location: '/months/0/categories/' + ENTRY.category + '/entries/' + ENTRY.id });

		var entry = new Entry(ENTRY);

		entry.$update();
		$httpBackend.flush();

		// Check that promise is set correctly
		expect(entry).to.have.property('$promise');
		expect(entry.$promise).to.respondTo('then');
		// $resolved should be true after server interaction
		expect(entry).to.have.property('$resolved', true);		
	});

	it('.$save should call .$create when no id is set and .$update when an id is set', function() {
		var entry = new Entry(ENTRY);
		var $create = sinon.spy(entry, '$create');
		var $update = sinon.spy(entry, '$update');

		delete entry.id;
		entry.$save();
		expect($create).to.have.been.called;

		entry.id = ENTRY.id;
		entry.$save();
		expect($update).to.have.been.called;
	});

	it('should DELETE to the server when calling .$delete', function() {
		var entry = new Entry(ENTRY);
		$httpBackend
			.expectDELETE('/months/0/categories/' + ENTRY.category + '/entries/' + ENTRY.id)
			.respond(204, null);

		entry.$delete();
		$httpBackend.flush();

		// Check that promise is set correctly
		expect(entry).to.have.property('$promise');
		expect(entry.$promise).to.respondTo('then');
	});
});