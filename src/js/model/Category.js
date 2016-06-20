angular.module('Checkbook.Model').factory('Category', [ '$resource', function($resource) {
	var Category = $resource(
			'/categories/:id', 
			{ 'id': '@id' }, 
			null, 
			{ store: true });

	return Category;
}]);