describe('Category', function() {
	beforeEach(angular.mock.module('Checkbook'));	
	
	const CATEGORY = { id: 1, caption: '1' };

	var Category;
	var $httpBackend;

	beforeEach(inject(function($injector) {
		Category = $injector.get('Category');
		$httpBackend = $injector.get('$httpBackend');
	}));

	it('should use the provided data values when constructing a new instance', function() {
		var category = new Category(CATEGORY);

		expect(category).to.have.property('$resolved', false);
		// All values passed to the constructor should be present
		for (var key in CATEGORY)
			expect(category).to.have.property(key, CATEGORY[key]);
	});

	it('should get an array of categories when calling .query', function() {
		const RESPONSE = [ CATEGORY, { id: 2, caption: '2' }];
		$httpBackend
			.expectGET('/categories')
			.respond(200, RESPONSE);

		var categories = Category.query();
		$httpBackend.flush();

		// $http promise should be set on the result
		expect(categories).to.have.property('$promise');
		expect(categories.$promise).to.respondTo('then');

		// Result should have the right length
		expect(categories).to.have.length(RESPONSE.length);
		for (var i = 0; i < categories.length; i++) {			
			var category = categories[i];
			// It should be a Category
			expect(category).to.be.an.instanceOf(Category);
			// Its $resolved property should be true
			expect(category).to.have.property('$resolved', true);
			// All values should be set correctly
			for (var key in RESPONSE[i])
				expect(category).to.have.property(key, RESPONSE[i][key]);
		}
	});

	it('should update itself when calling .$get', function() {
		const RESPONSE = { id: 1, caption: 'new caption' };

		$httpBackend
			.expectGET('/categories/' + CATEGORY.id)
			.respond(200, RESPONSE);

		var category = new Category(CATEGORY);
		category = category.$get();
		$httpBackend.flush();

		// Check that promise is set correctly
		expect(category).to.have.property('$promise');
		expect(category.$promise).to.respondTo('then');
		// $resolved should be true after server interaction
		expect(category).to.have.property('$resolved', true);

		// Check that the new values are present
		for (var key in RESPONSE) 
			expect(category).to.have.property(key, RESPONSE[key]);
	});

	it('should POST to the server when calling .$create', function() {
		var data = angular.copy(CATEGORY);
		delete data.id;

		$httpBackend
			.expectPOST('/categories', data)
			.respond(201, null, { location: '/categories/' + CATEGORY.id });

		var category = new Category(data);

		category.$create();
		$httpBackend.flush();

		// Check that promise is set correctly
		expect(category).to.have.property('$promise');
		expect(category.$promise).to.respondTo('then');
		// id should be set after $create - the server provided it in the location header
		expect(category).to.have.property('id', CATEGORY.id);
		// $resolved should be true after server interaction
		expect(category).to.have.property('$resolved', true);
	});

	it('should PUT to the server when calling .$update', function() {
		$httpBackend
			.expectPUT('/categories/' + CATEGORY.id, CATEGORY)
			.respond(204, null, { location: '/categories/' + CATEGORY.id });

		var category = new Category(CATEGORY);

		category.$update();
		$httpBackend.flush();

		// Check that promise is set correctly
		expect(category).to.have.property('$promise');
		expect(category.$promise).to.respondTo('then');
		// $resolved should be true after server interaction
		expect(category).to.have.property('$resolved', true);		
	});

	it('.$save should call .$create when no id is set and .$update when an id is set', function() {
		var category = new Category(CATEGORY);
		var $create = sinon.spy(category, '$create');
		var $update = sinon.spy(category, '$update');

		delete category.id;
		category.$save();
		expect($create).to.have.been.called;

		category.id = CATEGORY.id;
		category.$save();
		expect($update).to.have.been.called;
	});

	it('should DELETE to the server when calling .$delete', function() {
		var category = new Category(CATEGORY);
		$httpBackend
			.expectDELETE('/categories/' + CATEGORY.id)
			.respond(204, null);

		category.$delete();
		$httpBackend.flush();

		// Check that promise is set correctly
		expect(category).to.have.property('$promise');
		expect(category.$promise).to.respondTo('then');
	});
});