describe('Resource', function() {
	beforeEach(angular.mock.module('Checkbook'));

	var $resource,
		$httpBackend;

	beforeEach(inject(function(_$resource_, _$httpBackend_) {
		$resource = _$resource_;
		$httpBackend = _$httpBackend_;
	}));

	it('should have get, query, create, update, delete and remove actions', function() {
		var Resource = $resource();
		expect(Resource).itself.to.respondTo('get');
		expect(Resource).itself.to.respondTo('query');
		expect(Resource).itself.to.respondTo('create');
		expect(Resource).itself.to.respondTo('update');
		expect(Resource).itself.to.respondTo('delete');				
		expect(Resource).itself.to.respondTo('remove');

		var resource = new Resource();
		expect(resource).to.respondTo('$get');
		expect(resource).to.respondTo('$query');
		expect(resource).to.respondTo('$create');
		expect(resource).to.respondTo('$update');
		expect(resource).to.respondTo('$delete');				
		expect(resource).to.respondTo('$remove');
	});

	it('should update when an id is present and create when not when saving', function() {
		function always() { return true; };
		$httpBackend
			.whenPOST(always)
			.respond(200);
		$httpBackend
			.whenPUT(always)
			.respond(200);

		var Resource = $resource('http://example.com');

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

	
});