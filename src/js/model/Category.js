var module = angular.module('Checkbook.Model', [ 'ngResource' ]);

module.factory('Category', [ '$resouce', function($resource) {
	var Category = $resource('/categories/:id', { 'id': '@id' });

	return Category;
}]);