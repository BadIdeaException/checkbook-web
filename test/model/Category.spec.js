describe.only('Category', function() {
	beforeEach(angular.mock.module('Checkbook'));	
	
	const CATEGORY = { id: 1, caption: '1' };

	var Category;
	var $httpBackend;

	beforeEach(inject(function($injector) {
		Category = $injector.get('Category');
		$httpBackend = $injector.get('$httpBackend');
	}));
});