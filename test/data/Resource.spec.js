describe('Resource', function() {
	beforeEach(angular.mock.module('Checkbook'));

	var $resource,
		$httpBackend,
		$cacheFactory;

	beforeEach(inject(function(_$resource_, _$httpBackend_, _$cacheFactory_) {
		$resource = _$resource_;
		$httpBackend = _$httpBackend_;
		$cacheFactory = _$cacheFactory_;
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

	it('should create a store object if options.store is true, or use a store object passed in options.store', inject(function($cacheFactory) {		
		// Part 1: Create a store if options.store is true
		var Resource = $resource('/', null, null, { store: true });
		expect(Resource.store).to.exist;

		// Part 2: use a provided store
		var store = {};
		Resource = $resource('/', {}, {}, { store: store });
		expect(Resource.store).to.equal(store);
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

	it('should update itself when calling $create or $update', function() {
		const CREATE_RESPONSE = { id: 1, prop: 1 };
		const UPDATE_RESPONSE = { id: 1, prop: 2 };
		var Resource = $resource('/', null, null, null);
		var resource = new Resource();

		$httpBackend
			.expectPOST('/')
			.respond(CREATE_RESPONSE);

		resource.$save(); // will do 'create'
		$httpBackend.flush();
		expect(resource).to.have.property('prop', CREATE_RESPONSE.prop);
		
		$httpBackend
			.expectPUT('/')
			.respond(UPDATE_RESPONSE);

		resource.$save(); // will do 'update'
		$httpBackend.flush();
		expect(resource).to.have.property('prop', UPDATE_RESPONSE.prop);
	});

	describe('GET', function() {
		var Resource, store;

		beforeEach(function() {
			Resource = $resource('/:id', { id: '@id' }, null, { store: {} }); // Use angularjs Cache as a simple mock store
			store = Resource.store;
		});

		it('should retrieve a stored item if one is available', inject(function($q) {
			var resource = new Resource();
			resource.$promise = $q.resolve(resource); // A real resource in the store would have the $promise set, because 
													  // the only way to get into the store is through server interaction

			store.get = sinon.stub().returns(resource);
			// store.put('/', resource);

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
			store.get = sinon.stub().returns(undefined); // Make initial store hit fail
			store.put = sinon.spy();

			var returned = Resource.get(); 
			$httpBackend.flush();

			expect(store.put).to.have.been.calledWith(returned);			
		});
	});

	describe('POST/PUT', function() {
		var Resource, store;
		beforeEach(function() {
			Resource = $resource('/:id', { id: '@id' }, null, { store: {} });
			store = Resource.store;
		});

		it('should write the resource to the store when creating', function() {
			const ID = 1;

			var resource = new Resource();

			$httpBackend
				.expectPOST('/')
				.respond(201, angular.merge({}, resource, { id: ID }));
			store.put = sinon.spy();

			var returned;
			resource.$create(resource).then(function(r) { returned = r }); // Instance methods return promise directly

			$httpBackend.flush();

			expect(store.put).to.have.been.calledWith(resource);
		});

		it('should write the resource to the store when updating', function() {
			const ID = 1;

			var resource = new Resource({ id: ID});

			$httpBackend
				.expectPUT('/' + ID)
				.respond(200, angular.copy(resource));
			store.put = sinon.spy();

			var returned;
			resource.$update(resource).then(function(r) { returned = r }); // Instance methods return promise directly

			$httpBackend.flush();
			expect(store.put).to.have.been.calledWith(resource);			
		});
	});

	describe('DELETE', function() {
		it('should remove the resource from the store', function() {
			const URL = '/';
			var Resource = $resource(URL, null, null, { store: {} }); // Use angularjs Cache as a simple mock store
			var store = Resource.store;
			var resource = new Resource();

			$httpBackend
				.expectDELETE('/')
				.respond(204);
			store.remove = sinon.spy();

			resource.$delete();
			$httpBackend.flush();

			expect(store.remove).to.have.been.calledWith(URL)
		});
	});

});