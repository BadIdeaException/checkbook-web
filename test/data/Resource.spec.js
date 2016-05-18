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

	it('should create a new cache when options.cache is true, and use a given cache if it is passed in options.cache', inject(function($cacheFactory) {
		// Part 1: Check that a cache is correctly created
		const URL = '/shouldbethecachename'
		var Resource1 = $resource(URL, {}, {}, { cache: true });
		expect(Resource1.cache).to.exist;
		expect(Resource1.cache).to.equal($cacheFactory.get(URL));

		// Part 2: Check that a provided cache is used
		var cache = $cacheFactory('someothercache');
		Resource2 = $resource('/', {}, {}, { cache: cache });
		expect(Resource2.cache).to.equal(cache);
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

	it('should write the resource to cache when getting', function() {
		const RESPONSE = { id: 1 };
		var Resource = $resource('/');
		$httpBackend
			.expectGET('/')
			.respond(200, RESPONSE);

		var cached;
		var resource1 = Resource.get();
		expect($httpBackend.flush).to.not.throw;

		var resource2 = Resource.get();

var result
		expect(result).to.exist.and.have.property('$promise');
		result.$promise.then(function(x) {
			cached = Resource.cache.get(RESPONSE.id);
		});
		$httpBackend.flush();

		expect(cached).to.exist;
	})
});