var module = angular.module('Checkbook.Model', [ 'ngResource' ]);

module.factory('Category', [ '$resource', function($resource) {
	var Category = $resource('/categories/:id', { 'id': '@id' });

	return Category;
}]);