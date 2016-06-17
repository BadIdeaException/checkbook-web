describe('Resource - Store integration', function() {
	beforeEach(angular.mock.module('Checkbook'));

	var Resource,
		$httpBackend;
		
	beforeEach(inject(function($resource, _$httpBackend_, _Store_) {		
		$httpBackend = _$httpBackend_;
		Store = _Store_;

		Resource = $resource('/:id', { id: '@id' }, null, { store: true });
	}));

	it('should take the resource from the store on get after create', function() {
		var DATA = { id: 1 };
		var resource1 = new Resource({});

		$httpBackend
			.expectPOST('/')
			.respond(201, DATA);

		// POST to /1
		resource1.$create(); 
		$httpBackend.flush();

		var resource2 = Resource.get(DATA); // DATA doubles as a params object here
		expect($httpBackend.flush).to.throw(); // Should not have hit the server
		expect(resource1).to.equal(resource2);
	});

	it('should take the resource from the store on get after update', function() {
		var DATA = { id: 1 };
		var resource1 = new Resource(DATA);

		$httpBackend
			.expectPUT('/' + resource1.id)
			.respond(200, DATA);

		// PUT to /1
		resource1.$update();
		$httpBackend.flush();

		// GET to /1
		var resource2 = Resource.get(DATA); // DATA doubles as a params object here
		expect($httpBackend.flush).to.throw(); // Should not have hit the server
		expect(resource1).to.equal(resource2); 
	});

	it('should take the resource from the store on get after get', function() {
		const DATA = { id: 1 };
		
		$httpBackend
			.expectGET('/' + DATA.id)
			.respond(200, DATA);

		// GET to /1
		var resource1 = Resource.get(DATA); // DATA doubles as params object here
		$httpBackend.flush();

		// GET to /1 again
		var resource2 = Resource.get(DATA); // DATA doubles as params object here
		expect($httpBackend.flush).to.throw();
		expect(resource1).to.equal(resource2);
	});

	it('should hit the server on get after delete', function() {
		const DATA = { id: 1 };
		var resource1 = new Resource(DATA);

		$httpBackend
			.expectDELETE('/' + DATA.id)
			.respond(204);

		// DELETE to /1
		resource1.$delete();
		$httpBackend.flush(1);

		$httpBackend
			.expectGET('/' + DATA.id)
			.respond(DATA);

		// GET to /1
		var resource2 = Resource.get(DATA); // DATA doubles as a params object here
		$httpBackend.flush();
		
		expect(resource1).to.not.equal(resource2); // These should be distinct objects this time
	});
});