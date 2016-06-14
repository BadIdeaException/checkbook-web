describe('Resource', function() {
	beforeEach(angular.mock.module('Checkbook'));

	var $resource,
		$httpBackend;

	beforeEach(inject(function(_$resource_, _$httpBackend_) {
		$resource = _$resource_;
		$httpBackend = _$httpBackend_;
	}));

	it('should have get, query, create, update, delete and remove actions and a save method per default', function() {
		var Resource = $resource('/');
		expect(Resource).itself.to.respondTo('get');
		expect(Resource).itself.to.respondTo('query');
		expect(Resource).itself.to.respondTo('create');
		expect(Resource).itself.to.respondTo('update');
		expect(Resource).itself.to.respondTo('delete');				
		expect(Resource).itself.to.respondTo('remove');
		expect(Resource).itself.to.respondTo('save');	

		var resource = new Resource();
		expect(resource).to.respondTo('$get');
		expect(resource).to.respondTo('$query');
		expect(resource).to.respondTo('$create');
		expect(resource).to.respondTo('$update');
		expect(resource).to.respondTo('$delete');				
		expect(resource).to.respondTo('$remove');
		expect(resource).to.respondTo('$save');
	});

	it('should have only GET or HEAD actions when defined as read-only', function() {
		var extraActions = {
			post: { method: 'POST' },
			head: { method: 'HEAD' }
		};

		var Resource = $resource('/', {}, extraActions, { readOnly: true });
		expect(Resource).itself.to.respondTo('get');
		expect(Resource).itself.to.respondTo('query');
		expect(Resource).itself.to.respondTo('head');
		expect(Resource).itself.to.not.respondTo('create');
		expect(Resource).itself.to.not.respondTo('update');
		expect(Resource).itself.to.not.respondTo('delete');				
		expect(Resource).itself.to.not.respondTo('remove');
		expect(Resource).itself.to.not.respondTo('save');	
		expect(Resource).itself.to.not.respondTo('post');

		var resource = new Resource();
		expect(resource).to.respondTo('$get');
		expect(resource).to.respondTo('$query');
		expect(resource).to.respondTo('$head');
		expect(resource).to.not.respondTo('$create');
		expect(resource).to.not.respondTo('$update');
		expect(resource).to.not.respondTo('$delete');				
		expect(resource).to.not.respondTo('$remove');
		expect(resource).to.not.respondTo('$save');
		expect(resource).to.not.respondTo('$post');
	});

	it('should create a new store when options.store is true, and use a given store if it is passed in options.store', inject(function($cacheFactory) {
		// Part 1: Check that a store is correctly created
		const URL = '/shouldbethestorename'
		var Resource1 = $resource(URL, {}, {}, { store: true });
		expect(Resource1.store).to.exist;
		expect(Resource1.store).to.equal($cacheFactory.get(URL));

		// Part 2: Check that a provided store is used
		var store = $cacheFactory('someotherstore');
		Resource2 = $resource('/', {}, {}, { store: store });
		expect(Resource2.store).to.equal(store);
	}));

	it('.save should update when an id is present and create when not', function() {
		function always() { return true; };
		$httpBackend
			.whenPOST(always)
			.respond(200);
		$httpBackend
			.whenPUT(always)
			.respond(200);

		var Resource = $resource('/');

		var create = sinon.spy(Resource, 'create');
		var update = sinon.spy(Resource, 'update');

		Resource.save({});
		expect(create).to.have.been.called;
		expect(update).to.not.have.been.called;

		Resource.save({ id: 1 });
		expect(update).to.have.been.called;
		expect(create).to.have.been.calledOnce;

		create.restore();
		update.restore();
	});

	describe('GET', function() {
		var Resource, store;

		beforeEach(function() {
			Resource = $resource('/:id', { id: '@id' }, null, { store: true });
			store = Resource.store;
		});

		it('should retrieve a stored item if one is available', inject(function($q) {
			var resource = new Resource();
			resource.$promise = $q.resolve(resource); // A real resource in the store would have the $promise set, because 
													  // the only way to get into the store is through server interaction

			store.put('/', resource);

			$httpBackend
				.expectGET('/')
				.respond(500);

			var stored = Resource.get();

			expect($httpBackend.flush).to.throw(); // No request should have been made to the server

			expect(stored).to.equal(resource);
		}));

		it('should store the item returned from the server', function() {
			const RESPONSE = {};

			$httpBackend
				.expectGET('/')
				.respond(200, RESPONSE);

			var returned = Resource.get(); 
			$httpBackend.flush();

			expect(store.get('/')).to.equal(returned);
		});

		it('should store collection items as well as the collection', function() {
			const RESPONSE = [ { id: 1 }, { id: 2 } ];

			$httpBackend
				.expectGET('/')
				.respond(200, RESPONSE);

			var collection = Resource.query();
			$httpBackend.flush();
			
			expect(Resource.store.get('/')).to.equal(collection);
			expect(Resource.store.get('/' + RESPONSE[0].id)).to.equal(collection[0]);
			expect(Resource.store.get('/' + RESPONSE[1].id)).to.equal(collection[1]);
		});
	});

	describe('POST/PUT', function() {
		it('should write the item to the store when creating', function() {
			const ID = 1;

			var Resource = $resource('/:id', { id: '@id' }, null, { store: true });
			var resource = new Resource();

			$httpBackend
				.expectPOST('/')
				.respond(201, angular.merge({}, resource, { id: ID }));

			var returned;
			resource.$create(resource).then(function(r) { returned = r }); // Instance methods return promise directly

			$httpBackend.flush();

			expect(Resource.store.get('/' + ID)).to.equal(returned);						
		});

		it('should write the item to the store when updating', function() {
			const ID = 1;

			var Resource = $resource('/:id', { id: '@id' }, null, { store: true });
			var resource = new Resource({ id: ID});

			$httpBackend
				.expectPUT('/' + ID)
				.respond(200, angular.copy(resource));

			var returned;
			resource.$update(resource).then(function(r) { returned = r }); // Instance methods return promise directly

			$httpBackend.flush();

			expect(Resource.store.get('/' + ID)).to.equal(returned);				
		});
	});

	describe('DELETE', function() {
		it('should remove the item from the store', function() {
			var Resource = $resource('/', null, null, { store: true });
			var resource = new Resource();

			$httpBackend
				.expectDELETE('/')
				.respond(204);

			resource.$delete();
			$httpBackend.flush();

			expect(Resource.store.get('/')).to.not.exist;
		});
	});

	it('should subsequently read from the store when getting', function() {
		const RESPONSE = { id: 1 };
		var Resource = $resource('/', null, null, { store: true });
		$httpBackend
			.expectGET('/')
			.respond(200, RESPONSE);

		var resource1 = Resource.get();
		expect($httpBackend.flush).to.not.throw();

		var resource2 = Resource.get();
		expect($httpBackend.flush).to.throw();

		expect(resource1).to.equal(resource2);
	});
});